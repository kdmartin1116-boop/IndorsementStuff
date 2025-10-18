# 🚀 Production Deployment README

Welcome to the **Indorsement Platform Production Deployment Guide**! This document provides everything you need to deploy your enterprise-grade legal technology platform to production.

## 📋 Quick Start

### Option 1: Interactive Deployment (Recommended for First-Time)

**Windows:**
```powershell
cd new\scripts
.\deploy-production.ps1
```

**Linux/macOS:**
```bash
cd new/scripts
chmod +x deploy-production.sh
./deploy-production.sh
```

### Option 2: One-Command Deployment

**Windows:**
```powershell
.\scripts\deploy-production.ps1 -Action production
```

**Linux/macOS:**
```bash
./scripts/deploy-production.sh production
```

## 🛠️ Prerequisites

### Required Software
- **Docker Desktop** 4.0+ with Kubernetes enabled
- **kubectl** 1.25+ configured with your cluster
- **Node.js** 18+ and npm 8+
- **Git** 2.30+
- **Cloud CLI** (AWS CLI, Azure CLI, or Google Cloud SDK)

### Cloud Infrastructure
- **Kubernetes Cluster** (3+ nodes, 8GB+ RAM each)
- **Managed Database** (PostgreSQL 14+)
- **Redis Cache** (Redis 7.0+)
- **Object Storage** (S3, Azure Blob, or GCS)
- **Domain & SSL** certificates

## 📁 File Overview

```
new/
├── scripts/
│   ├── deploy-production.sh     # Linux/macOS deployment script
│   ├── deploy-production.ps1    # Windows PowerShell script
│   └── quick-deploy.sh          # Fast deployment utility
├── deployment/
│   └── k8s/
│       ├── backend-deployment.yaml    # Kubernetes deployment
│       ├── backend-service.yaml       # Services & ingress
│       ├── configmaps.yaml           # Configuration
│       └── secrets.yaml.template     # Secrets template
├── .env.production.template     # Environment variables template
├── backend/
│   ├── Dockerfile.production    # Production Docker image
│   └── scripts/
│       └── docker-entrypoint.sh # Container startup script
└── DEPLOYMENT_GUIDE.md         # Comprehensive guide
```

## 🔧 Environment Setup

### 1. Create Environment File
```bash
# Copy template and customize
cp .env.production.template .env.production

# Edit with your actual values
nano .env.production  # or use your preferred editor
```

### 2. Configure Secrets
```bash
# Copy secrets template
cp deployment/k8s/secrets.yaml.template deployment/k8s/secrets.yaml

# Update with your actual secrets (DO NOT commit this file)
nano deployment/k8s/secrets.yaml
```

### 3. Verify Cloud Access
```bash
# Test kubectl access
kubectl cluster-info

# Test cloud CLI (example for AWS)
aws sts get-caller-identity
```

## 🚀 Deployment Steps

### Automatic Deployment
The deployment scripts handle everything automatically:

1. **Prerequisites Check** - Validates tools and access
2. **Environment Validation** - Checks configuration
3. **Backend Build** - Creates optimized Docker image
4. **Frontend Build** - Generates production assets
5. **Kubernetes Deployment** - Deploys to cluster
6. **Health Checks** - Verifies application health
7. **Post-Deployment** - Shows status and URLs

### Manual Deployment (Advanced)

If you prefer manual control:

```bash
# 1. Build backend
cd backend
docker build -t indorsement-backend:latest -f Dockerfile.production .

# 2. Build frontend
cd ../frontend
npm ci && npm run build

# 3. Deploy to Kubernetes
cd ../deployment
kubectl apply -f k8s/

# 4. Check status
kubectl rollout status deployment/indorsement-backend -n indorsement-production
```

## 🔍 Health Checks & Monitoring

### Application Health
```bash
# Check pod status
kubectl get pods -n indorsement-production

# View application logs
kubectl logs -f deployment/indorsement-backend -n indorsement-production

# Test health endpoint
curl https://api.indorsement.com/health
```

### Performance Monitoring
```bash
# Check resource usage
kubectl top pods -n indorsement-production

# View metrics
kubectl port-forward svc/indorsement-backend-service 9090:9090 -n indorsement-production
# Then visit http://localhost:9090/metrics
```

## 🔄 Common Operations

### Viewing Logs
```bash
# Real-time logs
kubectl logs -f deployment/indorsement-backend -n indorsement-production

# Logs from specific pod
kubectl logs <pod-name> -n indorsement-production

# Logs with timestamps
kubectl logs deployment/indorsement-backend -n indorsement-production --timestamps=true
```

### Scaling
```bash
# Scale up/down manually
kubectl scale deployment indorsement-backend --replicas=5 -n indorsement-production

# Check auto-scaling status
kubectl get hpa -n indorsement-production
```

### Updates
```bash
# Rolling update (zero-downtime)
./scripts/deploy-production.sh production

# Or use kubectl
kubectl set image deployment/indorsement-backend backend=indorsement-backend:new-tag -n indorsement-production
```

### Rollback
```bash
# Quick rollback
./scripts/deploy-production.sh rollback

# Or manual rollback
kubectl rollout undo deployment/indorsement-backend -n indorsement-production
```

## 🔒 Security Considerations

### Secrets Management
- **Never commit** `secrets.yaml` or `.env.production` to version control
- Use **Kubernetes secrets** for sensitive data
- Rotate secrets regularly
- Use **sealed secrets** or **external secret operators** for GitOps

### Network Security
- **Network policies** restrict pod-to-pod communication
- **Ingress** provides SSL termination and rate limiting
- **Service mesh** (optional) for advanced security

### Image Security
- **Multi-stage builds** minimize attack surface
- **Non-root user** in containers
- **Read-only root filesystem** where possible
- **Regular security scans** of images

## 🐛 Troubleshooting

### Common Issues

#### Pod Startup Failures
```bash
# Check pod events
kubectl describe pod <pod-name> -n indorsement-production

# Check logs
kubectl logs <pod-name> -n indorsement-production --previous
```

#### Database Connection Issues
```bash
# Test database connectivity
kubectl exec -it deployment/indorsement-backend -n indorsement-production -- nc -zv postgres-host 5432

# Check database logs
kubectl logs -f statefulset/postgresql -n database
```

#### Ingress/SSL Issues
```bash
# Check ingress status
kubectl describe ingress indorsement-ingress -n indorsement-production

# Check cert-manager
kubectl get certificates -n indorsement-production
kubectl logs -f deployment/cert-manager -n cert-manager
```

#### Resource Issues
```bash
# Check node resources
kubectl top nodes

# Check pod resource usage
kubectl top pods -n indorsement-production

# Describe nodes for events
kubectl describe nodes
```

### Emergency Procedures

#### Scale Down for Maintenance
```bash
kubectl scale deployment indorsement-backend --replicas=0 -n indorsement-production
```

#### Emergency Rollback
```bash
kubectl rollout undo deployment/indorsement-backend -n indorsement-production
kubectl rollout status deployment/indorsement-backend -n indorsement-production
```

#### Pod Recovery
```bash
# Restart deployment
kubectl rollout restart deployment/indorsement-backend -n indorsement-production

# Delete stuck pods
kubectl delete pod <pod-name> -n indorsement-production --force --grace-period=0
```

## 📊 Performance Optimization

### Database Optimization
- **Connection pooling** (configured in application)
- **Read replicas** for read-heavy workloads
- **Database monitoring** and query optimization

### Frontend Optimization
- **CDN** for static assets
- **Gzip compression** enabled
- **Browser caching** optimized
- **Bundle splitting** for faster loads

### Backend Optimization
- **Horizontal Pod Autoscaling** based on CPU/memory
- **Vertical Pod Autoscaling** for right-sizing
- **Connection keep-alive** for external APIs
- **Caching strategies** for frequently accessed data

## 🔄 CI/CD Integration

### GitHub Actions
The deployment includes GitHub Actions workflows:
- **Automated testing** on pull requests
- **Security scanning** for vulnerabilities
- **Automated deployment** on releases
- **Rollback triggers** on failures

### GitOps (Optional)
For advanced GitOps workflow:
- **ArgoCD** or **Flux** for continuous deployment
- **Sealed secrets** for secret management
- **Kustomize** for environment-specific configurations

## 📈 Monitoring & Alerting

### Built-in Monitoring
- **Prometheus** metrics collection
- **Grafana** dashboards
- **AlertManager** for notifications
- **Application metrics** exposed at `/metrics`

### External Monitoring
- **Sentry** for error tracking
- **New Relic** for APM
- **Datadog** for infrastructure monitoring
- **PagerDuty** for incident management

## 📞 Support & Maintenance

### Regular Maintenance
- **Weekly** security updates
- **Monthly** dependency updates  
- **Quarterly** infrastructure reviews
- **Annual** disaster recovery testing

### Support Contacts
- **DevOps Team**: devops@indorsement.com
- **Security Team**: security@indorsement.com
- **On-Call**: Available 24/7 via PagerDuty
- **Slack**: #indorsement-production

## 🎯 Quick Reference Commands

```bash
# Deploy to production
./scripts/deploy-production.sh production

# Check health
./scripts/deploy-production.sh health

# View status
./scripts/deploy-production.sh status

# Rollback
./scripts/deploy-production.sh rollback

# Scale deployment
kubectl scale deployment indorsement-backend --replicas=N -n indorsement-production

# Port forward for local access
kubectl port-forward svc/indorsement-backend-service 3000:80 -n indorsement-production

# Get pod shell
kubectl exec -it deployment/indorsement-backend -n indorsement-production -- sh

# View real-time logs
kubectl logs -f deployment/indorsement-backend -n indorsement-production
```

---

## 🎉 Success!

Once deployed, your Indorsement Platform will be running with:

✅ **Enterprise-grade security** with comprehensive compliance frameworks  
✅ **Auto-scaling backend** with high availability  
✅ **Real-time analytics** and business intelligence  
✅ **Mobile applications** with offline sync  
✅ **AI-powered legal research** and document processing  
✅ **Advanced performance monitoring** and alerting  
✅ **Disaster recovery** and backup systems  

Your legal technology platform is now ready to serve users at enterprise scale! 🚀

---

*For detailed information, see the comprehensive [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)*