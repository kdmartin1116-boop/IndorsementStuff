#!/bin/bash

# 🚀 Indorsement Platform - Production Deployment Script
# This script handles the complete deployment pipeline for production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
NAMESPACE="indorsement-${ENVIRONMENT}"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
BACKEND_REPO="indorsement-backend"
FRONTEND_BUCKET="indorsement-frontend-${ENVIRONMENT}"
CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID}"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check required tools
    command -v docker >/dev/null 2>&1 || error "Docker is required but not installed"
    command -v kubectl >/dev/null 2>&1 || error "kubectl is required but not installed"
    command -v aws >/dev/null 2>&1 || error "AWS CLI is required but not installed"
    command -v npm >/dev/null 2>&1 || error "npm is required but not installed"
    
    # Check AWS credentials
    aws sts get-caller-identity >/dev/null 2>&1 || error "AWS credentials not configured"
    
    # Check kubectl context
    kubectl cluster-info >/dev/null 2>&1 || error "kubectl not connected to cluster"
    
    success "Prerequisites check passed"
}

# Build and push Docker images
build_and_push_backend() {
    log "Building and pushing backend Docker image..."
    
    cd backend
    
    # Get git commit hash for tagging
    GIT_COMMIT=$(git rev-parse --short HEAD)
    IMAGE_TAG="${GIT_COMMIT}-$(date +%s)"
    
    # Login to ECR
    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}
    
    # Build image
    docker build -t ${ECR_REGISTRY}/${BACKEND_REPO}:${IMAGE_TAG} -f Dockerfile.production .
    docker build -t ${ECR_REGISTRY}/${BACKEND_REPO}:latest -f Dockerfile.production .
    
    # Push images
    docker push ${ECR_REGISTRY}/${BACKEND_REPO}:${IMAGE_TAG}
    docker push ${ECR_REGISTRY}/${BACKEND_REPO}:latest
    
    # Store image tag for deployment
    echo ${IMAGE_TAG} > ../deployment/backend-image-tag.txt
    
    cd ..
    success "Backend image built and pushed: ${IMAGE_TAG}"
}

# Build and deploy frontend
deploy_frontend() {
    log "Building and deploying frontend..."
    
    cd frontend
    
    # Install dependencies
    npm ci
    
    # Run tests
    npm run test -- --watchAll=false
    
    # Build for production
    npm run build
    
    # Deploy to S3
    aws s3 sync dist/ s3://${FRONTEND_BUCKET} --delete --exact-timestamps
    
    # Invalidate CloudFront cache
    if [ ! -z "${CLOUDFRONT_DISTRIBUTION_ID}" ]; then
        aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} --paths "/*"
    fi
    
    cd ..
    success "Frontend deployed successfully"
}

# Deploy backend to Kubernetes
deploy_backend() {
    log "Deploying backend to Kubernetes..."
    
    # Read the image tag
    IMAGE_TAG=$(cat deployment/backend-image-tag.txt)
    
    # Create namespace if it doesn't exist
    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply secrets
    kubectl apply -f deployment/k8s/secrets.yaml -n ${NAMESPACE}
    
    # Apply configmaps
    kubectl apply -f deployment/k8s/configmaps.yaml -n ${NAMESPACE}
    
    # Update deployment with new image
    sed "s|{{IMAGE_TAG}}|${IMAGE_TAG}|g" deployment/k8s/backend-deployment.yaml | kubectl apply -f - -n ${NAMESPACE}
    
    # Apply services
    kubectl apply -f deployment/k8s/backend-service.yaml -n ${NAMESPACE}
    
    # Apply ingress
    kubectl apply -f deployment/k8s/ingress.yaml -n ${NAMESPACE}
    
    # Wait for rollout to complete
    kubectl rollout status deployment/indorsement-backend -n ${NAMESPACE} --timeout=300s
    
    success "Backend deployed successfully"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Get a pod name
    POD_NAME=$(kubectl get pods -n ${NAMESPACE} -l app=indorsement-backend -o jsonpath="{.items[0].metadata.name}")
    
    # Run migrations
    kubectl exec -it ${POD_NAME} -n ${NAMESPACE} -- npm run migrate:prod
    
    success "Database migrations completed"
}

# Deploy monitoring stack
deploy_monitoring() {
    log "Deploying monitoring stack..."
    
    # Create monitoring namespace
    kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy Prometheus
    kubectl apply -f deployment/k8s/monitoring/prometheus.yaml -n monitoring
    
    # Deploy Grafana
    kubectl apply -f deployment/k8s/monitoring/grafana.yaml -n monitoring
    
    # Deploy AlertManager
    kubectl apply -f deployment/k8s/monitoring/alertmanager.yaml -n monitoring
    
    success "Monitoring stack deployed"
}

# Health checks
run_health_checks() {
    log "Running health checks..."
    
    # Check backend health
    BACKEND_URL=$(kubectl get ingress indorsement-ingress -n ${NAMESPACE} -o jsonpath='{.spec.rules[0].host}')
    
    for i in {1..30}; do
        if curl -f -s "https://${BACKEND_URL}/health" >/dev/null; then
            success "Backend health check passed"
            break
        fi
        
        if [ $i -eq 30 ]; then
            error "Backend health check failed after 30 attempts"
        fi
        
        sleep 10
    done
    
    # Check database connectivity
    POD_NAME=$(kubectl get pods -n ${NAMESPACE} -l app=indorsement-backend -o jsonpath="{.items[0].metadata.name}")
    kubectl exec ${POD_NAME} -n ${NAMESPACE} -- node -e "
        const { Pool } = require('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        pool.query('SELECT 1').then(() => {
            console.log('Database connection successful');
            process.exit(0);
        }).catch(err => {
            console.error('Database connection failed:', err);
            process.exit(1);
        });
    " || error "Database health check failed"
    
    success "All health checks passed"
}

# Performance tests
run_performance_tests() {
    log "Running performance tests..."
    
    # Basic load test using curl
    BACKEND_URL=$(kubectl get ingress indorsement-ingress -n ${NAMESPACE} -o jsonpath='{.spec.rules[0].host}')
    
    # Test API endpoints
    for endpoint in "/health" "/api/v1/status" "/api/v1/auth/verify"; do
        response_time=$(curl -o /dev/null -s -w '%{time_total}' "https://${BACKEND_URL}${endpoint}")
        
        if (( $(echo "$response_time > 1.0" | bc -l) )); then
            warning "Endpoint ${endpoint} response time: ${response_time}s (> 1.0s)"
        else
            log "Endpoint ${endpoint} response time: ${response_time}s ✓"
        fi
    done
    
    success "Performance tests completed"
}

# Backup current deployment
backup_deployment() {
    log "Creating backup of current deployment..."
    
    BACKUP_DIR="deployment/backups/$(date +%Y%m%d-%H%M%S)"
    mkdir -p ${BACKUP_DIR}
    
    # Backup current Kubernetes resources
    kubectl get all -n ${NAMESPACE} -o yaml > ${BACKUP_DIR}/k8s-resources.yaml
    kubectl get configmaps -n ${NAMESPACE} -o yaml > ${BACKUP_DIR}/configmaps.yaml
    kubectl get secrets -n ${NAMESPACE} -o yaml > ${BACKUP_DIR}/secrets.yaml
    
    # Backup database
    POD_NAME=$(kubectl get pods -n ${NAMESPACE} -l app=indorsement-backend -o jsonpath="{.items[0].metadata.name}")
    kubectl exec ${POD_NAME} -n ${NAMESPACE} -- pg_dump ${DATABASE_URL} > ${BACKUP_DIR}/database-backup.sql
    
    success "Backup created in ${BACKUP_DIR}"
}

# Rollback deployment
rollback_deployment() {
    log "Rolling back deployment..."
    
    # Rollback Kubernetes deployment
    kubectl rollout undo deployment/indorsement-backend -n ${NAMESPACE}
    kubectl rollout status deployment/indorsement-backend -n ${NAMESPACE}
    
    warning "Deployment rolled back. You may need to manually restore frontend and database if needed."
}

# Main deployment function
main() {
    log "🚀 Starting Indorsement Platform deployment to ${ENVIRONMENT}"
    
    # Parse command line arguments
    case "$1" in
        "production"|"staging"|"")
            ;;
        "rollback")
            rollback_deployment
            exit 0
            ;;
        *)
            echo "Usage: $0 [production|staging|rollback]"
            exit 1
            ;;
    esac
    
    # Deployment pipeline
    check_prerequisites
    backup_deployment
    
    # Build and deploy components
    build_and_push_backend
    deploy_backend
    deploy_frontend
    
    # Run migrations and setup
    run_migrations
    deploy_monitoring
    
    # Validation
    run_health_checks
    run_performance_tests
    
    success "🎉 Deployment to ${ENVIRONMENT} completed successfully!"
    
    log "📊 Deployment Summary:"
    log "- Environment: ${ENVIRONMENT}"
    log "- Backend Image: ${ECR_REGISTRY}/${BACKEND_REPO}:$(cat deployment/backend-image-tag.txt)"
    log "- Frontend: Deployed to S3 and CloudFront"
    log "- Database: Migrations applied"
    log "- Monitoring: Prometheus, Grafana, AlertManager deployed"
    
    log "🔗 Access URLs:"
    BACKEND_URL=$(kubectl get ingress indorsement-ingress -n ${NAMESPACE} -o jsonpath='{.spec.rules[0].host}')
    log "- API: https://${BACKEND_URL}"
    log "- Frontend: https://app.indorsement.com"
    log "- Grafana: https://grafana.indorsement.com"
    
    log "📝 Next steps:"
    log "1. Monitor application logs and metrics"
    log "2. Run additional integration tests"
    log "3. Update DNS records if needed"
    log "4. Notify stakeholders of successful deployment"
}

# Error handling
trap 'error "Deployment failed at line $LINENO"' ERR

# Run main function with all arguments
main "$@"