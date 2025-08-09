#!/bin/bash

# Database Restore Script
# This script restores the Supabase database from backup files

set -e

# Configuration
BACKUP_DIR="${BACKUP_STORAGE_PATH:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$BACKUP_DIR/restore_log_$TIMESTAMP.log"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Logging functions
log() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] $1"
    echo -e "${GREEN}$message${NC}"
    echo "$message" >> "$LOG_FILE"
}

warn() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1"
    echo -e "${YELLOW}$message${NC}"
    echo "$message" >> "$LOG_FILE"
}

error() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1"
    echo -e "${RED}$message${NC}"
    echo "$message" >> "$LOG_FILE"
    exit 1
}

# Show usage
show_usage() {
    echo "Database Restore Script"
    echo "Usage: $0 [options] <backup_file>"
    echo ""
    echo "Options:"
    echo "  --help              Show this help message"
    echo "  --list              List available backup files"
    echo "  --dry-run           Show what would be done without executing"
    echo "  --force             Skip confirmation prompts"
    echo "  --schema-only       Restore schema only (no data)"
    echo "  --data-only         Restore data only (no schema changes)"
    echo ""
    echo "Examples:"
    echo "  $0 warehouse_system_backup_20240101_120000.sql.gz"
    echo "  $0 --list"
    echo "  $0 --schema-only backup.sql.gz"
}

# List available backups
list_backups() {
    log "Available backup files in $BACKUP_DIR:"
    echo ""
    
    if [ ! -d "$BACKUP_DIR" ]; then
        warn "Backup directory does not exist: $BACKUP_DIR"
        return
    fi
    
    local backup_files=($(find "$BACKUP_DIR" -name "warehouse_system_backup_*.sql.gz" -type f | sort -r))
    
    if [ ${#backup_files[@]} -eq 0 ]; then
        warn "No backup files found"
        return
    fi
    
    echo "Recent backups:"
    echo "==============="
    for file in "${backup_files[@]:0:10}"; do
        local basename=$(basename "$file")
        local size=$(du -h "$file" | cut -f1)
        local date=$(stat -f%Sm -t"%Y-%m-%d %H:%M:%S" "$file" 2>/dev/null || stat -c%y "$file" 2>/dev/null | cut -d' ' -f1-2)
        printf "%-40s %8s %s\n" "$basename" "$size" "$date"
    done
    
    if [ ${#backup_files[@]} -gt 10 ]; then
        echo ""
        echo "... and $((${#backup_files[@]} - 10)) more backup files"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        error "Supabase CLI is not installed. Please install it first."
    fi
    
    # Check if required environment variables are set
    if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        error "Required environment variables not set. Please check VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    fi
    
    log "Prerequisites check passed"
}

# Validate backup file
validate_backup_file() {
    local backup_file=$1
    
    log "Validating backup file: $backup_file"
    
    # Check if file exists
    if [ ! -f "$backup_file" ]; then
        error "Backup file does not exist: $backup_file"
    fi
    
    # Check if file is not empty
    if [ ! -s "$backup_file" ]; then
        error "Backup file is empty: $backup_file"
    fi
    
    # Check if compressed file is valid
    if [[ "$backup_file" == *.gz ]]; then
        if ! gzip -t "$backup_file" 2>/dev/null; then
            error "Backup file is corrupted or not a valid gzip file"
        fi
        log "Compressed backup file validation passed"
    fi
    
    log "Backup file validation passed"
}

# Create pre-restore backup
create_pre_restore_backup() {
    log "Creating pre-restore backup as safety measure..."
    
    local pre_restore_file="$BACKUP_DIR/pre_restore_backup_$TIMESTAMP.sql"
    
    if supabase db dump --file "$pre_restore_file"; then
        if gzip "$pre_restore_file"; then
            log "Pre-restore backup created: ${pre_restore_file}.gz"
        else
            log "Pre-restore backup created: $pre_restore_file"
        fi
    else
        warn "Failed to create pre-restore backup. Continuing anyway..."
    fi
}

# Restore database
restore_database() {
    local backup_file=$1
    local schema_only=$2
    local data_only=$3
    
    log "Starting database restore from: $backup_file"
    
    # Prepare the backup file for restore
    local restore_file="$backup_file"
    
    # Decompress if needed
    if [[ "$backup_file" == *.gz ]]; then
        local temp_file="/tmp/restore_temp_$TIMESTAMP.sql"
        if gunzip -c "$backup_file" > "$temp_file"; then
            restore_file="$temp_file"
            log "Decompressed backup file to: $restore_file"
        else
            error "Failed to decompress backup file"
        fi
    fi
    
    # Build restore command
    local restore_cmd="supabase db reset --file \"$restore_file\""
    
    if [ "$schema_only" = true ]; then
        restore_cmd="$restore_cmd --schema-only"
        log "Restoring schema only"
    elif [ "$data_only" = true ]; then
        restore_cmd="$restore_cmd --data-only"
        log "Restoring data only"
    else
        log "Restoring full database (schema and data)"
    fi
    
    # Execute restore
    log "Executing restore command..."
    if eval "$restore_cmd"; then
        log "Database restore completed successfully"
    else
        error "Database restore failed"
    fi
    
    # Clean up temporary file
    if [[ "$backup_file" == *.gz ]] && [ -f "$temp_file" ]; then
        rm "$temp_file"
        log "Cleaned up temporary file"
    fi
}

# Verify restore
verify_restore() {
    log "Verifying database restore..."
    
    # Check if we can connect to the database
    if supabase db ping; then
        log "Database connection successful"
    else
        error "Cannot connect to database after restore"
    fi
    
    # Run basic queries to verify data integrity
    log "Running data integrity checks..."
    
    # Check if main tables exist
    local tables=("products" "warehouses" "product_serial_numbers" "stock_movements")
    for table in "${tables[@]}"; do
        if supabase db query "SELECT COUNT(*) FROM $table" &>/dev/null; then
            log "Table $table is accessible"
        else
            warn "Table $table may have issues"
        fi
    done
    
    log "Database verification completed"
}

# Send restore notification
send_notification() {
    local status=$1
    local message=$2
    
    # Log the notification
    if [ "$status" = "success" ]; then
        log "Restore completed successfully: $message"
    else
        error "Restore failed: $message"
    fi
    
    # Send email notification if configured
    if [ -n "$BACKUP_NOTIFICATION_EMAIL" ] && command -v mail &> /dev/null; then
        local subject="Warehouse System Restore - $status"
        echo "$message" | mail -s "$subject" "$BACKUP_NOTIFICATION_EMAIL"
        log "Notification sent to $BACKUP_NOTIFICATION_EMAIL"
    fi
}

# Main restore function
main() {
    local backup_file=""
    local dry_run=false
    local force=false
    local schema_only=false
    local data_only=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help)
                show_usage
                exit 0
                ;;
            --list)
                list_backups
                exit 0
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            --force)
                force=true
                shift
                ;;
            --schema-only)
                schema_only=true
                shift
                ;;
            --data-only)
                data_only=true
                shift
                ;;
            -*)
                error "Unknown option: $1"
                ;;
            *)
                if [ -z "$backup_file" ]; then
                    backup_file=$1
                else
                    error "Multiple backup files specified"
                fi
                shift
                ;;
        esac
    done
    
    # Validate arguments
    if [ -z "$backup_file" ]; then
        error "No backup file specified. Use --help for usage information."
    fi
    
    if [ "$schema_only" = true ] && [ "$data_only" = true ]; then
        error "Cannot specify both --schema-only and --data-only"
    fi
    
    # Convert relative path to absolute if needed
    if [[ "$backup_file" != /* ]]; then
        if [ -f "$BACKUP_DIR/$backup_file" ]; then
            backup_file="$BACKUP_DIR/$backup_file"
        elif [ ! -f "$backup_file" ]; then
            error "Backup file not found: $backup_file"
        fi
    fi
    
    # Load environment variables if .env file exists
    if [ -f ".env.local" ]; then
        source .env.local
        log "Loaded environment variables from .env.local"
    fi
    
    # Dry run mode
    if [ "$dry_run" = true ]; then
        echo "DRY RUN MODE - No actual restore will be performed"
        echo "Would restore from: $backup_file"
        echo "Schema only: $schema_only"
        echo "Data only: $data_only"
        echo "Target database: $VITE_SUPABASE_URL"
        exit 0
    fi
    
    # Confirmation prompt
    if [ "$force" != true ]; then
        echo -e "${YELLOW}WARNING: This will restore the database from backup.${NC}"
        echo -e "${YELLOW}This operation will overwrite existing data.${NC}"
        echo -e "${YELLOW}Backup file: $backup_file${NC}"
        echo -e "${YELLOW}Target database: $VITE_SUPABASE_URL${NC}"
        echo ""
        read -p "Are you sure you want to continue? (y/N): " -n 1 -r
        echo
        
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Restore cancelled by user"
            exit 0
        fi
    fi
    
    log "Starting database restore process..."
    
    # Run restore process
    check_prerequisites
    validate_backup_file "$backup_file"
    create_pre_restore_backup
    restore_database "$backup_file" "$schema_only" "$data_only"
    verify_restore
    
    send_notification "success" "Database restore completed successfully from $(basename "$backup_file")"
    log "Restore process completed successfully!"
}

# Run main function
main "$@"