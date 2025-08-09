#!/bin/bash

# Production Database Migration Script
# This script handles safe database migrations for production deployment

set -e  # Exit on any error

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup-$TIMESTAMP.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if Supabase CLI is installed
check_supabase_cli() {
    if ! command -v supabase &> /dev/null; then
        error "Supabase CLI is not installed. Please install it first."
    fi
    log "Supabase CLI found"
}

# Create backup directory
create_backup_dir() {
    mkdir -p "$BACKUP_DIR"
    log "Backup directory created: $BACKUP_DIR"
}

# Backup database
backup_database() {
    log "Creating database backup..."
    if supabase db dump --file "$BACKUP_FILE"; then
        log "Database backup created: $BACKUP_FILE"
    else
        error "Failed to create database backup"
    fi
}

# Run migrations
run_migrations() {
    log "Running database migrations..."
    if supabase db push --include-all; then
        log "Migrations completed successfully"
    else
        error "Migration failed. Check logs for details."
    fi
}

# Verify migration
verify_migration() {
    log "Verifying migration status..."
    supabase migration list
    
    log "Running post-migration verification..."
    # Add custom verification queries here
    supabase db test || warn "Some tests failed. Please review."
}

# Main execution
main() {
    log "Starting production database migration..."
    
    # Pre-flight checks
    check_supabase_cli
    create_backup_dir
    
    # Confirm with user
    echo -e "${YELLOW}This will run database migrations on production.${NC}"
    echo -e "${YELLOW}Make sure you have tested these migrations on staging first.${NC}"
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Migration cancelled by user"
        exit 0
    fi
    
    # Execute migration steps
    backup_database
    run_migrations
    verify_migration
    
    log "Production migration completed successfully!"
    log "Backup saved at: $BACKUP_FILE"
}

# Run main function
main "$@"