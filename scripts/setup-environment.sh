#!/bin/bash

# Environment Setup Script
# This script helps set up environment variables for different deployment environments

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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

# Function to setup environment
setup_environment() {
    local env_type=$1
    
    if [ -z "$env_type" ]; then
        echo "Usage: $0 [development|staging|production]"
        exit 1
    fi
    
    case $env_type in
        development)
            log "Setting up development environment..."
            if [ -f ".env.example" ]; then
                cp .env.example .env.local
                log "Copied .env.example to .env.local"
            else
                warn ".env.example not found"
            fi
            ;;
        staging)
            log "Setting up staging environment..."
            if [ -f ".env.staging" ]; then
                cp .env.staging .env.local
                log "Copied .env.staging to .env.local"
            else
                error ".env.staging not found"
            fi
            ;;
        production)
            log "Setting up production environment..."
            if [ -f ".env.production" ]; then
                cp .env.production .env.local
                log "Copied .env.production to .env.local"
                warn "Please update the environment variables with actual values"
            else
                error ".env.production not found"
            fi
            ;;
        *)
            error "Invalid environment type. Use: development, staging, or production"
            ;;
    esac
    
    log "Environment setup completed for: $env_type"
    log "Please review and update .env.local with appropriate values"
}

# Validate environment variables
validate_environment() {
    log "Validating environment variables..."
    
    # Required variables
    required_vars=(
        "VITE_SUPABASE_URL"
        "VITE_SUPABASE_ANON_KEY"
        "VITE_APP_ENV"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        error "Missing required environment variables: ${missing_vars[*]}"
    fi
    
    log "Environment validation passed"
}

# Main execution
main() {
    if [ $# -eq 0 ]; then
        echo "Environment Setup Script"
        echo "Usage: $0 [development|staging|production] [validate]"
        echo ""
        echo "Commands:"
        echo "  development  - Setup development environment"
        echo "  staging      - Setup staging environment"
        echo "  production   - Setup production environment"
        echo "  validate     - Validate current environment variables"
        exit 1
    fi
    
    case $1 in
        validate)
            source .env.local 2>/dev/null || error ".env.local not found"
            validate_environment
            ;;
        *)
            setup_environment $1
            ;;
    esac
}

main "$@"