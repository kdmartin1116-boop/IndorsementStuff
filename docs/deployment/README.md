# Deployment Guide

## Overview

This guide covers deployment strategies for the endorsement application across different environments, from local development to production cloud deployment.

## Environment Types

### Local Development
- **Purpose**: Individual developer workstations
- **Database**: Local PostgreSQL or Docker
- **Dependencies**: Direct Python/Node.js installation
- **Configuration**: `.env` files with development settings

### Staging/Testing
- **Purpose**: Pre-production testing and QA
- **Infrastructure**: Docker containers or cloud instances
- **Database**: Dedicated staging database
- **Configuration**: Environment-specific settings with production-like data

### Production
- **Purpose**: Live application serving end users
- **Infrastructure**: Kubernetes cluster or managed cloud services
- **Database**: Managed database service with backups
- **Configuration**: Secure environment variables and secrets management

## Prerequisites

### Required Software
- **Docker** 20.10+
- **Docker Compose** 2.0+
- **kubectl** (for Kubernetes deployments)
- **Helm** (optional, for Kubernetes package management)

### Cloud Account Setup
- **AWS**: EKS cluster, RDS instance, S3 bucket
- **Google Cloud**: GKE cluster, Cloud SQL, Cloud Storage
- **Azure**: AKS cluster, Azure Database, Blob Storage

### Environment Variables
```bash
# Database Configuration
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=30

# Security
SECRET_KEY=your-super-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# File Storage
UPLOAD_DIRECTORY=/app/uploads
MAX_FILE_SIZE_MB=50
ALLOWED_FILE_TYPES=pdf,doc,docx,txt

# External Services
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-west-2
AWS_S3_BUCKET=endorsement-documents

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=INFO
ENABLE_METRICS=true

# Application Settings
ALLOWED_HOSTS=localhost,yourdomain.com
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
DEBUG=false
```

## Local Development Deployment

### Using Docker Compose

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd IndorsementStuff/new
   cp .env.example .env
   # Edit .env with your local settings
   ```

2. **Build and Start Services**
   ```bash
   # Build all services
   docker-compose build

   # Start all services
   docker-compose up -d

   # View logs
   docker-compose logs -f

   # Stop services
   docker-compose down
   ```

3. **Initialize Database**
   ```bash
   # Run migrations
   docker-compose exec backend alembic upgrade head

   # Seed initial data (optional)
   docker-compose exec backend python scripts/seed_db.py
   ```

4. **Verify Deployment**
   - Backend API: http://localhost:8000/docs
   - Frontend: http://localhost:3000
   - Database: localhost:5432

### Native Development Setup

1. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv

   # Windows
   venv\Scripts\activate
   # macOS/Linux  
   source venv/bin/activate

   pip install -r requirements.txt
   
   # Set up database
   createdb endorsement_app
   alembic upgrade head

   # Start development server
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Create environment file
   cp .env.example .env.local
   # Edit with local API URL: VITE_API_URL=http://localhost:8000

   # Start development server
   npm run dev
   ```

## Docker Deployment

### Single Container Deployment

```dockerfile
# Dockerfile.production
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim AS backend-base
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist ./static

# Create uploads directory
RUN mkdir -p /app/uploads

# Set up user
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Build and Deploy

```bash
# Build production image
docker build -f Dockerfile.production -t endorsement-app:latest .

# Run container
docker run -d \
  --name endorsement-app \
  -p 8000:8000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e SECRET_KEY="your-secret-key" \
  -v $(pwd)/uploads:/app/uploads \
  endorsement-app:latest

# Check logs
docker logs endorsement-app

# Update deployment
docker stop endorsement-app
docker rm endorsement-app
docker run -d --name endorsement-app [... same parameters]
```

## Kubernetes Deployment

### Namespace Setup

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: endorsement-app
  labels:
    name: endorsement-app
```

### ConfigMap and Secrets

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: endorsement-app
data:
  LOG_LEVEL: "INFO"
  ALLOWED_HOSTS: "yourdomain.com,www.yourdomain.com"
  CORS_ORIGINS: "https://yourdomain.com"
  DEBUG: "false"
  UPLOAD_DIRECTORY: "/app/uploads"
  MAX_FILE_SIZE_MB: "50"

---
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: endorsement-app
type: Opaque
data:
  # Base64 encoded values
  DATABASE_URL: <base64-encoded-database-url>
  SECRET_KEY: <base64-encoded-secret-key>
  AWS_ACCESS_KEY_ID: <base64-encoded-access-key>
  AWS_SECRET_ACCESS_KEY: <base64-encoded-secret-key>
```

### Deployment Configuration

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: endorsement-app
  namespace: endorsement-app
  labels:
    app: endorsement-app
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: endorsement-app
  template:
    metadata:
      labels:
        app: endorsement-app
    spec:
      containers:
      - name: app
        image: endorsement-app:v1.0.0
        imagePullPolicy: Always
        ports:
        - containerPort: 8000
          name: http
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: DATABASE_URL
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: SECRET_KEY
        - name: AWS_ACCESS_KEY_ID
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: AWS_ACCESS_KEY_ID
        - name: AWS_SECRET_ACCESS_KEY
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: AWS_SECRET_ACCESS_KEY
        envFrom:
        - configMapRef:
            name: app-config
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 60
          periodSeconds: 30
          timeoutSeconds: 10
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        volumeMounts:
        - name: uploads
          mountPath: /app/uploads
      volumes:
      - name: uploads
        persistentVolumeClaim:
          claimName: app-uploads-pvc
```

### Service and Ingress

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: endorsement-app-service
  namespace: endorsement-app
spec:
  selector:
    app: endorsement-app
  ports:
  - name: http
    port: 80
    targetPort: 8000
    protocol: TCP
  type: ClusterIP

---
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: endorsement-app-ingress
  namespace: endorsement-app
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: 50m
spec:
  tls:
  - hosts:
    - yourdomain.com
    secretName: endorsement-app-tls
  rules:
  - host: yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: endorsement-app-service
            port:
              number: 80
```

### Persistent Storage

```yaml
# pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: app-uploads-pvc
  namespace: endorsement-app
spec:
  accessModes:
  - ReadWriteMany
  resources:
    requests:
      storage: 100Gi
  storageClassName: standard
```

### Deploy to Kubernetes

```bash
# Apply all configurations
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f pvc.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml

# Check deployment status
kubectl get pods -n endorsement-app
kubectl get services -n endorsement-app
kubectl get ingress -n endorsement-app

# View logs
kubectl logs -f deployment/endorsement-app -n endorsement-app

# Scale deployment
kubectl scale deployment endorsement-app --replicas=5 -n endorsement-app
```

## Cloud Platform Deployment

### AWS EKS Deployment

1. **Create EKS Cluster**
   ```bash
   # Install eksctl
   eksctl create cluster \
     --name endorsement-cluster \
     --region us-west-2 \
     --nodegroup-name standard-workers \
     --node-type m5.large \
     --nodes 3 \
     --nodes-min 1 \
     --nodes-max 10 \
     --managed
   ```

2. **Set up RDS Database**
   ```bash
   aws rds create-db-instance \
     --db-instance-identifier endorsement-db \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --master-username dbadmin \
     --master-user-password <your-password> \
     --allocated-storage 20 \
     --vpc-security-group-ids sg-xxxxxxxx \
     --db-subnet-group-name default \
     --backup-retention-period 7 \
     --storage-encrypted
   ```

3. **Configure S3 Bucket**
   ```bash
   aws s3 mb s3://endorsement-documents
   aws s3api put-bucket-versioning \
     --bucket endorsement-documents \
     --versioning-configuration Status=Enabled
   ```

4. **Deploy Application**
   ```bash
   # Update kubeconfig
   aws eks update-kubeconfig --name endorsement-cluster --region us-west-2
   
   # Deploy application
   kubectl apply -f k8s/
   ```

### Google Cloud GKE Deployment

1. **Create GKE Cluster**
   ```bash
   gcloud container clusters create endorsement-cluster \
     --num-nodes=3 \
     --zone=us-central1-a \
     --machine-type=e2-medium \
     --enable-autorepair \
     --enable-autoupgrade
   ```

2. **Set up Cloud SQL**
   ```bash
   gcloud sql instances create endorsement-db \
     --database-version=POSTGRES_13 \
     --tier=db-f1-micro \
     --region=us-central1
   
   gcloud sql databases create endorsement_app \
     --instance=endorsement-db
   ```

3. **Deploy Application**
   ```bash
   gcloud container clusters get-credentials endorsement-cluster \
     --zone=us-central1-a
   
   kubectl apply -f k8s/
   ```

## Database Management

### Migration Strategy

```bash
# Production database migrations
# 1. Create database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run migrations in maintenance mode
kubectl scale deployment endorsement-app --replicas=0 -n endorsement-app

# 3. Apply migrations
kubectl run migration-job \
  --image=endorsement-app:latest \
  --restart=Never \
  --rm -i --tty \
  --env="DATABASE_URL=$DATABASE_URL" \
  -- alembic upgrade head

# 4. Scale back up
kubectl scale deployment endorsement-app --replicas=3 -n endorsement-app
```

### Backup and Restore

```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="endorsement_backup_$DATE.sql"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE s3://endorsement-backups/

# Keep only last 30 days of backups
find . -name "endorsement_backup_*.sql" -mtime +30 -delete

# Restore from backup
# pg_restore --clean --if-exists -d $DATABASE_URL $BACKUP_FILE
```

## Monitoring and Logging

### Application Monitoring

```yaml
# prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
    - job_name: 'endorsement-app'
      kubernetes_sd_configs:
      - role: pod
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
```

### Log Aggregation

```yaml
# fluentd-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
data:
  fluent.conf: |
    <source>
      @type tail
      path /var/log/containers/*endorsement-app*.log
      pos_file /var/log/fluentd-endorsement.log.pos
      tag kubernetes.endorsement.*
      format json
    </source>
    
    <match kubernetes.endorsement.**>
      @type elasticsearch
      host elasticsearch.logging.svc.cluster.local
      port 9200
      index_name endorsement-logs
    </match>
```

## SSL/TLS Configuration

### Let's Encrypt with cert-manager

```yaml
# cert-manager-issuer.yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    email: admin@yourdomain.com
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

### Custom SSL Certificate

```bash
# Create TLS secret with custom certificate
kubectl create secret tls endorsement-app-tls \
  --cert=path/to/certificate.crt \
  --key=path/to/private.key \
  -n endorsement-app
```

## Scaling and Performance

### Horizontal Pod Autoscaler

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: endorsement-app-hpa
  namespace: endorsement-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: endorsement-app
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Database Connection Pooling

```python
# Database configuration for production
DATABASE_POOL_SIZE = 20
DATABASE_MAX_OVERFLOW = 30
DATABASE_POOL_TIMEOUT = 30
DATABASE_POOL_RECYCLE = 3600

# SQLAlchemy engine configuration
engine = create_async_engine(
    DATABASE_URL,
    pool_size=DATABASE_POOL_SIZE,
    max_overflow=DATABASE_MAX_OVERFLOW,
    pool_timeout=DATABASE_POOL_TIMEOUT,
    pool_recycle=DATABASE_POOL_RECYCLE,
    echo=False  # Disable in production
)
```

## Troubleshooting

### Common Issues

1. **Pod Startup Failures**
   ```bash
   # Check pod status
   kubectl describe pod <pod-name> -n endorsement-app
   
   # Check logs
   kubectl logs <pod-name> -n endorsement-app --previous
   
   # Common fixes:
   # - Verify environment variables
   # - Check resource limits
   # - Validate image availability
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connectivity
   kubectl run postgres-client --rm -i --tty \
     --image=postgres:13 \
     --env="PGPASSWORD=$DB_PASSWORD" \
     -- psql -h $DB_HOST -U $DB_USER -d $DB_NAME
   
   # Common fixes:
   # - Verify network policies
   # - Check security groups
   # - Validate credentials
   ```

3. **Performance Issues**
   ```bash
   # Check resource usage
   kubectl top pods -n endorsement-app
   kubectl top nodes
   
   # Monitor metrics
   # - CPU and memory utilization
   # - Database query performance
   # - Network latency
   ```

### Health Checks

```python
# Enhanced health check endpoint
@router.get("/health")
async def health_check():
    checks = {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "checks": {}
    }
    
    # Database check
    try:
        await db.execute(text("SELECT 1"))
        checks["checks"]["database"] = "healthy"
    except Exception as e:
        checks["checks"]["database"] = f"unhealthy: {str(e)}"
        checks["status"] = "degraded"
    
    # File system check
    try:
        Path("/app/uploads").touch()
        checks["checks"]["filesystem"] = "healthy"
    except Exception as e:
        checks["checks"]["filesystem"] = f"unhealthy: {str(e)}"
        checks["status"] = "degraded"
    
    # External API check
    try:
        # Check external dependencies
        checks["checks"]["external_apis"] = "healthy"
    except Exception as e:
        checks["checks"]["external_apis"] = f"unhealthy: {str(e)}"
        checks["status"] = "degraded"
    
    status_code = 200 if checks["status"] == "ok" else 503
    return Response(
        content=json.dumps(checks),
        status_code=status_code,
        media_type="application/json"
    )
```

## Security Best Practices

### Container Security

```dockerfile
# Security-hardened Dockerfile
FROM python:3.11-slim AS base

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Install security updates
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Set up application
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY --chown=appuser:appuser . .

# Switch to non-root user
USER appuser

# Remove unnecessary packages
RUN apt-get autoremove -y && apt-get clean
```

### Network Security

```yaml
# network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: endorsement-app-network-policy
  namespace: endorsement-app
spec:
  podSelector:
    matchLabels:
      app: endorsement-app
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8000
  egress:
  - to: []
    ports:
    - protocol: TCP
      port: 5432  # Database
    - protocol: TCP
      port: 443   # HTTPS
    - protocol: TCP
      port: 53    # DNS
    - protocol: UDP
      port: 53    # DNS
```

This deployment guide provides comprehensive instructions for deploying the endorsement application across various environments with proper security, monitoring, and scaling considerations.