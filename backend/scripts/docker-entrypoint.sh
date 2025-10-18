#!/bin/sh

# Docker entrypoint script for Indorsement Platform Backend
# This script handles initialization, health checks, and graceful shutdown

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Environment validation
validate_environment() {
    log "Validating environment configuration..."
    
    # Required environment variables
    REQUIRED_VARS="NODE_ENV PORT DATABASE_URL REDIS_URL JWT_SECRET"
    
    for var in $REQUIRED_VARS; do
        if [ -z "$(eval echo \$$var)" ]; then
            error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    # Validate NODE_ENV
    if [ "$NODE_ENV" != "production" ] && [ "$NODE_ENV" != "staging" ]; then
        warning "NODE_ENV is set to '$NODE_ENV', expected 'production' or 'staging'"
    fi
    
    # Validate PORT
    if ! echo "$PORT" | grep -qE '^[0-9]+$' || [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
        error "PORT must be a valid port number between 1 and 65535"
        exit 1
    fi
    
    success "Environment validation passed"
}

# Database connectivity check
check_database() {
    log "Checking database connectivity..."
    
    # Parse database URL to get connection details
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\).*/\1/p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    
    if [ -z "$DB_PORT" ]; then
        DB_PORT=5432
    fi
    
    # Wait for database to be ready
    log "Waiting for database at $DB_HOST:$DB_PORT..."
    
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z "$DB_HOST" "$DB_PORT" >/dev/null 2>&1; then
            success "Database is ready"
            return 0
        fi
        
        log "Database not ready, attempt $attempt/$max_attempts..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    error "Database is not accessible after $max_attempts attempts"
    exit 1
}

# Redis connectivity check
check_redis() {
    log "Checking Redis connectivity..."
    
    # Parse Redis URL to get connection details
    REDIS_HOST=$(echo "$REDIS_URL" | sed -n 's/redis:\/\/\([^:]*\).*/\1/p')
    REDIS_PORT=$(echo "$REDIS_URL" | sed -n 's/.*:\([0-9]*\).*/\1/p')
    
    if [ -z "$REDIS_HOST" ]; then
        REDIS_HOST=$(echo "$REDIS_URL" | sed -n 's/redis:\/\/.*@\([^:]*\).*/\1/p')
    fi
    
    if [ -z "$REDIS_PORT" ]; then
        REDIS_PORT=6379
    fi
    
    # Wait for Redis to be ready
    log "Waiting for Redis at $REDIS_HOST:$REDIS_PORT..."
    
    max_attempts=15
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z "$REDIS_HOST" "$REDIS_PORT" >/dev/null 2>&1; then
            success "Redis is ready"
            return 0
        fi
        
        log "Redis not ready, attempt $attempt/$max_attempts..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    warning "Redis is not accessible after $max_attempts attempts (continuing anyway)"
}

# Run database migrations
run_migrations() {
    if [ "${SKIP_MIGRATIONS:-false}" = "true" ]; then
        log "Skipping database migrations (SKIP_MIGRATIONS=true)"
        return 0
    fi
    
    log "Running database migrations..."
    
    if npm run migrate:prod; then
        success "Database migrations completed"
    else
        error "Database migrations failed"
        exit 1
    fi
}

# Initialize application data
initialize_data() {
    if [ "${SKIP_SEED:-false}" = "true" ]; then
        log "Skipping data initialization (SKIP_SEED=true)"
        return 0
    fi
    
    log "Initializing application data..."
    
    if npm run seed:prod; then
        success "Data initialization completed"
    else
        warning "Data initialization failed (continuing anyway)"
    fi
}

# Prepare application directories
prepare_directories() {
    log "Preparing application directories..."
    
    # Create necessary directories if they don't exist
    mkdir -p /app/logs
    mkdir -p /app/uploads
    mkdir -p /app/temp
    mkdir -p /app/cache
    
    # Set proper permissions
    chmod 755 /app/logs /app/uploads /app/temp /app/cache
    
    success "Directories prepared"
}

# Generate application configuration
generate_config() {
    log "Generating application configuration..."
    
    # Create runtime configuration file
    cat > /app/runtime-config.json << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "nodeEnv": "$NODE_ENV",
    "version": "${APP_VERSION:-1.0.0}",
    "buildDate": "${BUILD_DATE:-unknown}",
    "gitCommit": "${GIT_COMMIT:-unknown}",
    "podName": "${POD_NAME:-unknown}",
    "podNamespace": "${POD_NAMESPACE:-unknown}",
    "podIP": "${POD_IP:-unknown}"
}
EOF
    
    success "Configuration generated"
}

# Graceful shutdown handler
shutdown_handler() {
    log "Received shutdown signal, gracefully shutting down..."
    
    # Send SIGTERM to the main process
    if [ -n "$MAIN_PID" ]; then
        kill -TERM "$MAIN_PID" 2>/dev/null || true
        
        # Wait for graceful shutdown
        log "Waiting for application to shutdown gracefully..."
        sleep 10
        
        # Force kill if still running
        if kill -0 "$MAIN_PID" 2>/dev/null; then
            warning "Forcing application shutdown..."
            kill -KILL "$MAIN_PID" 2>/dev/null || true
        fi
    fi
    
    log "Shutdown complete"
    exit 0
}

# Set up signal handlers
trap 'shutdown_handler' TERM INT

# Health check endpoint function
health_check() {
    if curl -f -s http://localhost:${PORT}/health >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Wait for application to be ready
wait_for_ready() {
    log "Waiting for application to be ready..."
    
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if health_check; then
            success "Application is ready"
            return 0
        fi
        
        log "Application not ready, attempt $attempt/$max_attempts..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    error "Application failed to start within expected time"
    return 1
}

# Main execution
main() {
    log "🚀 Starting Indorsement Platform Backend"
    log "Environment: $NODE_ENV"
    log "Port: $PORT"
    log "Process ID: $$"
    
    # Pre-flight checks
    validate_environment
    prepare_directories
    generate_config
    
    # Infrastructure checks
    check_database
    check_redis
    
    # Database setup
    run_migrations
    initialize_data
    
    # Start the application
    log "Starting Node.js application..."
    
    # Start application in background
    node dist/index.js &
    MAIN_PID=$!
    
    # Wait for application to be ready
    if wait_for_ready; then
        success "🎉 Indorsement Platform Backend started successfully"
        log "Application PID: $MAIN_PID"
        log "Health check: http://localhost:${PORT}/health"
        log "Metrics: http://localhost:${PORT}/metrics"
        
        # Wait for the main process
        wait $MAIN_PID
        exit_code=$?
        
        if [ $exit_code -eq 0 ]; then
            log "Application exited normally"
        else
            error "Application exited with code $exit_code"
        fi
        
        exit $exit_code
    else
        error "Failed to start application"
        kill $MAIN_PID 2>/dev/null || true
        exit 1
    fi
}

# Execute main function
main "$@"