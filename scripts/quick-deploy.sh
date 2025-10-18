#!/bin/bash

# 🚀 Quick Production Deployment Script
# This script provides a fast-track deployment option for production

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✅${NC} $1"; }
error() { echo -e "${RED}❌${NC} $1" >&2; exit 1; }
warning() { echo -e "${YELLOW}⚠️${NC} $1"; }

# Quick deployment function
quick_deploy() {
    log "🚀 Starting Quick Production Deployment"
    
    # Check if environment file exists
    if [ ! -f "$ROOT_DIR/.env.production" ]; then
        warning "Production environment file not found"
        log "Creating from template..."
        cp "$ROOT_DIR/.env.production.template" "$ROOT_DIR/.env.production"
        warning "⚠️  Please edit .env.production with your actual values before proceeding!"
        read -p "Press Enter when you've updated the environment file..."
    fi
    
    # Load environment
    source "$ROOT_DIR/.env.production"
    
    # Quick checks
    command -v docker >/dev/null 2>&1 || error "Docker is required"
    command -v kubectl >/dev/null 2>&1 || error "kubectl is required"
    command -v npm >/dev/null 2>&1 || error "npm is required"
    
    log "Building and deploying backend..."
    
    # Build backend Docker image
    cd "$ROOT_DIR/backend"
    docker build -t indorsement-backend:latest -f Dockerfile.production .
    
    # Build frontend
    cd "$ROOT_DIR/frontend"
    npm ci && npm run build
    
    # Apply Kubernetes configurations
    cd "$ROOT_DIR"
    kubectl apply -f deployment/k8s/
    
    # Wait for deployment
    kubectl rollout status deployment/indorsement-backend -n indorsement-production --timeout=300s
    
    success "Deployment completed!"
    log "Check status with: kubectl get pods -n indorsement-production"
}

# Health check function
check_health() {
    log "🔍 Checking application health..."
    
    # Get the service URL
    BACKEND_URL=$(kubectl get ingress indorsement-ingress -n indorsement-production -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || echo "localhost")
    
    if [ "$BACKEND_URL" = "localhost" ]; then
        # Port forward for local testing
        kubectl port-forward svc/indorsement-backend-service 3000:80 -n indorsement-production &
        PORT_FORWARD_PID=$!
        sleep 5
        BACKEND_URL="localhost:3000"
    fi
    
    # Test health endpoint
    if curl -f -s "http://${BACKEND_URL}/health" >/dev/null; then
        success "Backend is healthy"
    else
        error "Backend health check failed"
    fi
    
    # Cleanup port forward
    if [ -n "$PORT_FORWARD_PID" ]; then
        kill $PORT_FORWARD_PID 2>/dev/null || true
    fi
}

# Show status
show_status() {
    log "📊 Current Deployment Status"
    echo ""
    
    # Kubernetes resources
    echo "🔧 Kubernetes Resources:"
    kubectl get pods,svc,ingress -n indorsement-production 2>/dev/null || warning "Namespace not found"
    echo ""
    
    # Application logs
    echo "📋 Recent Logs:"
    kubectl logs -n indorsement-production deployment/indorsement-backend --tail=10 2>/dev/null || warning "No logs available"
}

# Rollback function
rollback() {
    log "⏪ Rolling back deployment..."
    kubectl rollout undo deployment/indorsement-backend -n indorsement-production
    kubectl rollout status deployment/indorsement-backend -n indorsement-production
    success "Rollback completed"
}

# Main menu
main() {
    echo ""
    echo "🎯 Indorsement Platform - Quick Production Tools"
    echo "================================================"
    echo ""
    echo "1) Quick Deploy"
    echo "2) Health Check"
    echo "3) Show Status"
    echo "4) Rollback"
    echo "5) Exit"
    echo ""
    
    read -p "Select option (1-5): " choice
    
    case $choice in
        1)
            quick_deploy
            ;;
        2)
            check_health
            ;;
        3)
            show_status
            ;;
        4)
            rollback
            ;;
        5)
            log "Goodbye! 👋"
            exit 0
            ;;
        *)
            warning "Invalid option"
            main
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    main
}

# Run main menu if no arguments provided
if [ $# -eq 0 ]; then
    main
else
    case "$1" in
        "deploy")
            quick_deploy
            ;;
        "health")
            check_health
            ;;
        "status")
            show_status
            ;;
        "rollback")
            rollback
            ;;
        *)
            echo "Usage: $0 [deploy|health|status|rollback]"
            exit 1
            ;;
    esac
fi