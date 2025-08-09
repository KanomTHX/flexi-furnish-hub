#!/bin/bash

# Database Backup Script
# This script creates automated backups of the Supabase database

set -e

# Configuration
BACKUP_DIR="${BACKUP_STORAGE_PATH:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/warehouse_system_backup_$TIMESTAMP.sql"
LOG_FILE="$BACKUP_DIR/backup_log_$TIMESTAMP.log"

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

# Create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log "Created backup directory: $BACKUP_DIR"
    fi
}

# Create database backup
create_backup() {
    log "Starting database backup..."
    
    # Create full database dump
    if supabase db dump --file "$BACKUP_FILE" --data-only=false; then
        log "Database backup created successfully: $BACKUP_FILE"
    else
        error "Failed to create database backup"
    fi
    
    # Compress the backup file
    if gzip "$BACKUP_FILE"; then
        BACKUP_FILE="${BACKUP_FILE}.gz"
        log "Backup file compressed: $BACKUP_FILE"
    else
        warn "Failed to compress backup file"
    fi
    
    # Get backup file size
    local backup_size=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Backup file size: $backup_size"
}

# Create schema-only backup
create_schema_backup() {
    local schema_file="$BACKUP_DIR/warehouse_system_schema_$TIMESTAMP.sql"
    
    log "Creating schema-only backup..."
    
    if supabase db dump --file "$schema_file" --data-only=false --schema-only=true; then
        log "Schema backup created: $schema_file"
        
        if gzip "$schema_file"; then
            log "Schema backup compressed: ${schema_file}.gz"
        fi
    else
        warn "Failed to create schema backup"
    fi
}

# Verify backup integrity
verify_backup() {
    log "Verifying backup integrity..."
    
    # Check if backup file exists and is not empty
    if [ ! -f "$BACKUP_FILE" ] || [ ! -s "$BACKUP_FILE" ]; then
        error "Backup file is missing or empty"
    fi
    
    # Try to read the compressed file
    if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
        error "Backup file is corrupted"
    fi
    
    log "Backup integrity verification passed"
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    local deleted_count=0
    
    # Find and delete old backup files
    while IFS= read -r -d '' file; do
        rm "$file"
        deleted_count=$((deleted_count + 1))
        log "Deleted old backup: $(basename "$file")"
    done < <(find "$BACKUP_DIR" -name "warehouse_system_backup_*.sql.gz" -mtime +$RETENTION_DAYS -print0 2>/dev/null)
    
    # Clean old log files
    while IFS= read -r -d '' file; do
        rm "$file"
        deleted_count=$((deleted_count + 1))
        log "Deleted old log: $(basename "$file")"
    done < <(find "$BACKUP_DIR" -name "backup_log_*.log" -mtime +$RETENTION_DAYS -print0 2>/dev/null)
    
    if [ $deleted_count -eq 0 ]; then
        log "No old backups to clean up"
    else
        log "Cleaned up $deleted_count old files"
    fi
}

# Send backup notification
send_notification() {
    local status=$1
    local message=$2
    
    # Log the notification
    if [ "$status" = "success" ]; then
        log "Backup completed successfully: $message"
    else
        error "Backup failed: $message"
    fi
    
    # Send email notification if configured
    if [ -n "$BACKUP_NOTIFICATION_EMAIL" ] && command -v mail &> /dev/null; then
        local subject="Warehouse System Backup - $status"
        echo "$message" | mail -s "$subject" "$BACKUP_NOTIFICATION_EMAIL"
        log "Notification sent to $BACKUP_NOTIFICATION_EMAIL"
    fi
    
    # Send webhook notification if configured
    if [ -n "$BACKUP_WEBHOOK_URL" ]; then
        curl -X POST "$BACKUP_WEBHOOK_URL" \
             -H "Content-Type: application/json" \
             -d "{\"status\":\"$status\",\"message\":\"$message\",\"timestamp\":\"$(date -Iseconds)\"}" \
             &>/dev/null || warn "Failed to send webhook notification"
    fi
}

# Create backup manifest
create_manifest() {
    local manifest_file="$BACKUP_DIR/backup_manifest_$TIMESTAMP.json"
    
    cat > "$manifest_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "backup_file": "$(basename "$BACKUP_FILE")",
  "backup_size": "$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null || echo "unknown")",
  "database_url": "$VITE_SUPABASE_URL",
  "backup_type": "full",
  "retention_days": $RETENTION_DAYS,
  "created_by": "$(whoami)",
  "hostname": "$(hostname)",
  "version": "1.0.0"
}
EOF
    
    log "Backup manifest created: $manifest_file"
}

# Main backup function
main() {
    log "Starting automated database backup process..."
    
    # Load environment variables if .env file exists
    if [ -f ".env.local" ]; then
        source .env.local
        log "Loaded environment variables from .env.local"
    fi
    
    # Run backup process
    check_prerequisites
    create_backup_dir
    create_backup
    create_schema_backup
    verify_backup
    create_manifest
    cleanup_old_backups
    
    # Calculate total time
    local end_time=$(date +%s)
    local start_time_file="/tmp/backup_start_time"
    if [ -f "$start_time_file" ]; then
        local start_time=$(cat "$start_time_file")
        local duration=$((end_time - start_time))
        log "Backup completed in ${duration} seconds"
        rm "$start_time_file"
    fi
    
    send_notification "success" "Database backup completed successfully. File: $(basename "$BACKUP_FILE")"
    log "Backup process completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    --help)
        echo "Database Backup Script"
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help          Show this help message"
        echo "  --dry-run       Show what would be done without executing"
        echo ""
        echo "Environment Variables:"
        echo "  BACKUP_STORAGE_PATH     Directory for backups (default: ./backups)"
        echo "  BACKUP_RETENTION_DAYS   Days to keep backups (default: 30)"
        echo "  BACKUP_NOTIFICATION_EMAIL   Email for notifications"
        echo "  BACKUP_WEBHOOK_URL      Webhook URL for notifications"
        exit 0
        ;;
    --dry-run)
        echo "DRY RUN MODE - No actual backup will be created"
        echo "Would create backup in: $BACKUP_DIR"
        echo "Would retain backups for: $RETENTION_DAYS days"
        echo "Backup file would be: $BACKUP_FILE"
        exit 0
        ;;
esac

# Record start time
echo "$(date +%s)" > /tmp/backup_start_time

# Run main function with error handling
if ! main "$@"; then
    send_notification "failure" "Database backup failed. Check logs for details."
    exit 1
fi