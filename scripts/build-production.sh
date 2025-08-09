#!/bin/bash

# Production Build Script
# This script handles optimized production builds

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

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js first."
    fi
    log "Node.js version: $(node --version)"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install npm first."
    fi
    log "npm version: $(npm --version)"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    if npm ci --production=false; then
        log "Dependencies installed successfully"
    else
        error "Failed to install dependencies"
    fi
}

# Run tests before build
run_tests() {
    log "Running tests before build..."
    if npm run test:ci; then
        log "All tests passed"
    else
        warn "Some tests failed. Continuing with build..."
    fi
}

# Run linting
run_linting() {
    log "Running linting..."
    if npm run lint; then
        log "Linting passed"
    else
        warn "Linting issues found. Please review."
    fi
}

# Build the application
build_app() {
    log "Building application for production..."
    
    # Set production environment
    export NODE_ENV=production
    
    # Clean previous build
    if [ -d "dist" ]; then
        rm -rf dist
        log "Cleaned previous build"
    fi
    
    # Run build
    if npm run build; then
        log "Build completed successfully"
    else
        error "Build failed"
    fi
}

# Analyze bundle size
analyze_bundle() {
    log "Analyzing bundle size..."
    
    # Check if dist directory exists
    if [ ! -d "dist" ]; then
        error "Build directory not found. Run build first."
    fi
    
    # Display bundle sizes
    echo "Bundle Analysis:"
    echo "================"
    find dist -name "*.js" -exec ls -lh {} \; | awk '{print $5 "\t" $9}'
    echo ""
    
    # Check for large chunks
    large_chunks=$(find dist -name "*.js" -size +500k)
    if [ -n "$large_chunks" ]; then
        warn "Large chunks detected (>500KB):"
        echo "$large_chunks"
    fi
}

# Optimize images
optimize_images() {
    log "Optimizing images..."
    
    # Check if imagemin is available
    if command -v imagemin &> /dev/null; then
        find dist -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | xargs imagemin --replace
        log "Images optimized"
    else
        warn "imagemin not found. Skipping image optimization."
    fi
}

# Generate build report
generate_report() {
    local build_time=$(date)
    local build_size=$(du -sh dist | cut -f1)
    
    cat > build-report.txt << EOF
Production Build Report
======================
Build Time: $build_time
Build Size: $build_size
Node Version: $(node --version)
npm Version: $(npm --version)

Bundle Analysis:
$(find dist -name "*.js" -exec ls -lh {} \; | awk '{print $5 "\t" $9}')

Environment Variables:
NODE_ENV=$NODE_ENV
VITE_APP_ENV=${VITE_APP_ENV:-production}
EOF
    
    log "Build report generated: build-report.txt"
}

# Main execution
main() {
    log "Starting production build process..."
    
    # Pre-build checks
    check_node
    check_npm
    
    # Setup environment
    if [ -f ".env.production" ]; then
        log "Loading production environment variables..."
        export $(cat .env.production | grep -v '^#' | xargs)
    fi
    
    # Build process
    install_dependencies
    run_linting
    run_tests
    build_app
    analyze_bundle
    optimize_images
    generate_report
    
    log "Production build completed successfully!"
    log "Build output: ./dist"
    log "Build report: ./build-report.txt"
}

# Handle script arguments
case "${1:-}" in
    --skip-tests)
        log "Skipping tests as requested"
        run_tests() { log "Tests skipped"; }
        ;;
    --skip-lint)
        log "Skipping linting as requested"
        run_linting() { log "Linting skipped"; }
        ;;
    --help)
        echo "Production Build Script"
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --skip-tests    Skip running tests"
        echo "  --skip-lint     Skip linting"
        echo "  --help          Show this help message"
        exit 0
        ;;
esac

# Run main function
main "$@"