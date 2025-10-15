# Architecture Documentation

## System Overview

This document provides a comprehensive overview of the application architecture, design patterns, and technical decisions that shape the system.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   React + TS    │◄──►│   FastAPI       │◄──►│  PostgreSQL     │
│                 │    │   Python 3.11+  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │  File Storage   │              │
         └──────────────►│  AWS S3 / Local │◄─────────────┘
                        └─────────────────┘
```

## Frontend Architecture

### Technology Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5.x
- **State Management**: React Context + useReducer
- **Styling**: CSS Modules + CSS-in-JS
- **HTTP Client**: Axios with interceptors
- **Form Handling**: Custom hooks with validation
- **Testing**: Jest + React Testing Library

### Component Architecture

```
src/
├── components/
│   ├── UI/                    # Atomic design components
│   │   ├── Button/           # Base button component
│   │   ├── Input/            # Form input components
│   │   ├── Modal/            # Modal dialogs
│   │   └── Card/             # Content containers
│   │
│   ├── Form/                 # Form-specific components
│   │   ├── EndorsementForm/  # Endorsement creation
│   │   ├── DocumentUpload/   # File upload handling
│   │   └── ValidationForm/   # Form validation
│   │
│   └── Layout/               # Layout components
│       ├── Header/           # Application header
│       ├── Sidebar/          # Navigation sidebar
│       └── Footer/           # Application footer
│
├── pages/                    # Page-level components
├── hooks/                    # Custom React hooks
├── services/                 # API service layer
├── utils/                    # Utility functions
└── types/                    # TypeScript definitions
```

### State Management Pattern

```typescript
// Context-based state management
interface AppState {
  user: User | null;
  endorsements: Endorsement[];
  documents: Document[];
  ui: UIState;
}

// Actions for state updates
type AppAction = 
  | { type: 'SET_USER'; payload: User }
  | { type: 'ADD_ENDORSEMENT'; payload: Endorsement }
  | { type: 'UPDATE_DOCUMENT'; payload: Document }
  | { type: 'SET_LOADING'; payload: boolean };

// Reducer pattern for predictable state updates
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    // ... other cases
  }
};
```

### Component Design Patterns

#### 1. Atomic Design
```typescript
// Atoms - Basic building blocks
export const Button: React.FC<ButtonProps> = ({ 
  variant, size, children, ...props 
}) => {
  return (
    <button 
      className={cn('btn', variant, size)} 
      {...props}
    >
      {children}
    </button>
  );
};

// Molecules - Combinations of atoms
export const FormField: React.FC<FormFieldProps> = ({
  label, error, children
}) => {
  return (
    <div className="form-field">
      <Label>{label}</Label>
      {children}
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  );
};

// Organisms - Complex UI sections
export const EndorsementForm: React.FC = () => {
  // Complex form logic with multiple molecules
};
```

#### 2. Custom Hooks Pattern
```typescript
// Reusable logic in custom hooks
export const useEndorsement = () => {
  const [state, setState] = useState<EndorsementState>();
  
  const createEndorsement = useCallback(async (data: CreateEndorsementData) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const result = await endorsementService.create(data);
      setState(prev => ({ ...prev, data: result, loading: false }));
      return result;
    } catch (error) {
      setState(prev => ({ ...prev, error, loading: false }));
      throw error;
    }
  }, []);

  return {
    ...state,
    createEndorsement,
    // ... other operations
  };
};
```

#### 3. Error Boundary Pattern
```typescript
// Global error handling
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

## Backend Architecture

### Technology Stack
- **Framework**: FastAPI 0.104+
- **Language**: Python 3.11+
- **Database**: PostgreSQL 15+
- **ORM**: SQLAlchemy 2.0+
- **Migration**: Alembic
- **Authentication**: JWT with passlib
- **Validation**: Pydantic 2.0+
- **Testing**: pytest + pytest-asyncio

### Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    API Layer                            │
│  (FastAPI routes, request/response handling)            │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│                 Service Layer                           │
│  (Business logic, orchestration, validation)            │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│              Repository Layer                           │
│  (Data access, database operations)                     │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│                Database Layer                           │
│  (PostgreSQL, SQLAlchemy models)                        │
└─────────────────────────────────────────────────────────┘
```

### Directory Structure Pattern

```python
# API Layer - Route definitions
# app/api/endorsements.py
@router.post("/", response_model=EndorsementResponse)
async def create_endorsement(
    endorsement_data: CreateEndorsementRequest,
    current_user: User = Depends(get_current_user),
    endorsement_service: EndorsementService = Depends()
) -> EndorsementResponse:
    return await endorsement_service.create_endorsement(
        endorsement_data, current_user.id
    )

# Service Layer - Business logic
# app/services/endorsement_service.py
class EndorsementService:
    def __init__(self, 
                 endorsement_repo: EndorsementRepository,
                 document_service: DocumentService):
        self.endorsement_repo = endorsement_repo
        self.document_service = document_service

    async def create_endorsement(
        self, 
        data: CreateEndorsementRequest, 
        user_id: str
    ) -> EndorsementResponse:
        # Business logic and validation
        validated_data = await self._validate_endorsement(data)
        
        # Create endorsement
        endorsement = await self.endorsement_repo.create(
            validated_data, user_id
        )
        
        # Generate documents
        await self.document_service.generate_endorsement_docs(
            endorsement.id
        )
        
        return EndorsementResponse.from_orm(endorsement)

# Repository Layer - Data access
# app/repositories/endorsement_repository.py
class EndorsementRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self, 
        data: dict, 
        user_id: str
    ) -> EndorsementModel:
        endorsement = EndorsementModel(**data, user_id=user_id)
        self.db.add(endorsement)
        await self.db.commit()
        await self.db.refresh(endorsement)
        return endorsement

    async def get_by_user(self, user_id: str) -> List[EndorsementModel]:
        result = await self.db.execute(
            select(EndorsementModel)
            .where(EndorsementModel.user_id == user_id)
            .order_by(EndorsementModel.created_at.desc())
        )
        return result.scalars().all()
```

### Dependency Injection Pattern

```python
# Dependency container
class Container:
    def __init__(self):
        self.db_session = Provide[Database.session]
        self.endorsement_repo = Provide[
            EndorsementRepository,
            self.db_session
        ]
        self.document_service = Provide[
            DocumentService,
            self.endorsement_repo
        ]
        self.endorsement_service = Provide[
            EndorsementService,
            self.endorsement_repo,
            self.document_service
        ]

# FastAPI dependency injection
async def get_endorsement_service(
    db: AsyncSession = Depends(get_db_session)
) -> EndorsementService:
    endorsement_repo = EndorsementRepository(db)
    document_service = DocumentService(endorsement_repo)
    return EndorsementService(endorsement_repo, document_service)
```

## Database Design

### Entity Relationship Diagram

```
Users                    Endorsements               Documents
┌─────────────┐         ┌─────────────┐            ┌─────────────┐
│ id (UUID)   │◄────────│ id (UUID)   │◄───────────│ id (UUID)   │
│ email       │         │ user_id     │            │ endorsement │
│ name        │         │ type        │            │ type        │
│ created_at  │         │ status      │            │ file_path   │
└─────────────┘         │ data (JSON) │            │ created_at  │
                        │ created_at  │            └─────────────┘
                        │ updated_at  │
                        └─────────────┘
                              │
                              ▼
                        ┌─────────────┐
                        │ Signatures  │
                        │ id (UUID)   │
                        │ endorsement │
                        │ signature   │
                        │ signed_at   │
                        └─────────────┘
```

### Database Models

```python
# SQLAlchemy models
class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True)
    name: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=datetime.utcnow
    )

    # Relationships
    endorsements: Mapped[List["EndorsementModel"]] = relationship(
        back_populates="user"
    )

class EndorsementModel(Base):
    __tablename__ = "endorsements"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid4
    )
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id"), 
        nullable=False
    )
    type: Mapped[str] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(50), default="draft")
    data: Mapped[dict] = mapped_column(JSON)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationships
    user: Mapped["UserModel"] = relationship(back_populates="endorsements")
    documents: Mapped[List["DocumentModel"]] = relationship(
        back_populates="endorsement"
    )
```

## Security Architecture

### Authentication Flow

```
1. User Login Request
   │
   ▼
2. Validate Credentials
   │
   ▼
3. Generate JWT Token
   │
   ▼
4. Return Token to Client
   │
   ▼
5. Client Stores Token
   │
   ▼
6. Include Token in API Requests
   │
   ▼
7. Validate Token on Each Request
   │
   ▼
8. Extract User Info from Token
   │
   ▼
9. Proceed with Authorized Request
```

### JWT Implementation

```python
# Token generation
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

# Token validation
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await get_user_by_email(username)
    if user is None:
        raise credentials_exception
    return user
```

### Security Measures

1. **Authentication & Authorization**
   - JWT tokens with expiration
   - Role-based access control (RBAC)
   - Password hashing with bcrypt
   - Rate limiting on sensitive endpoints

2. **Data Protection**
   - Input validation with Pydantic
   - SQL injection prevention (ORM)
   - XSS protection (output encoding)
   - CSRF protection for forms

3. **Transport Security**
   - HTTPS enforcement
   - CORS configuration
   - Security headers (HSTS, CSP, etc.)
   - Request/response logging

## Performance Optimization

### Frontend Performance

1. **Code Splitting**
   ```typescript
   // Route-based code splitting
   const HomePage = lazy(() => import('./pages/HomePage'));
   const EndorsementPage = lazy(() => import('./pages/EndorsementPage'));
   
   // Component-based code splitting
   const HeavyComponent = lazy(() => import('./components/HeavyComponent'));
   ```

2. **React Optimization**
   ```typescript
   // Memoization for expensive calculations
   const ExpensiveComponent = React.memo(({ data }) => {
     const processedData = useMemo(() => {
       return data.map(item => expensiveCalculation(item));
     }, [data]);
   
     return <div>{/* render */}</div>;
   });
   
   // Callback memoization
   const OptimizedForm = () => {
     const handleSubmit = useCallback((data) => {
       submitForm(data);
     }, []);
   
     return <Form onSubmit={handleSubmit} />;
   };
   ```

3. **Bundle Optimization**
   ```typescript
   // Vite configuration
   export default defineConfig({
     build: {
       rollupOptions: {
         output: {
           manualChunks: {
             vendor: ['react', 'react-dom'],
             ui: ['@mui/material'],
           },
         },
       },
     },
   });
   ```

### Backend Performance

1. **Database Optimization**
   ```python
   # Query optimization with eager loading
   async def get_endorsements_with_documents(user_id: str):
       result = await db.execute(
           select(EndorsementModel)
           .options(selectinload(EndorsementModel.documents))
           .where(EndorsementModel.user_id == user_id)
       )
       return result.scalars().all()
   
   # Database indexing
   class EndorsementModel(Base):
       # ... other fields
       
       __table_args__ = (
           Index('idx_user_created', 'user_id', 'created_at'),
           Index('idx_status', 'status'),
       )
   ```

2. **Caching Strategy**
   ```python
   # Redis caching for frequent queries
   @cache(expire=300)  # 5 minutes
   async def get_user_endorsements(user_id: str):
       return await endorsement_repo.get_by_user(user_id)
   
   # In-memory caching for configuration
   @lru_cache(maxsize=100)
   def get_endorsement_template(template_type: str):
       return load_template(template_type)
   ```

3. **Async Processing**
   ```python
   # Background task processing
   @app.task
   async def generate_document(endorsement_id: str):
       endorsement = await get_endorsement(endorsement_id)
       document = await create_pdf_document(endorsement)
       await save_document(document)
   
   # Async endpoint
   @router.post("/generate")
   async def generate_documents(endorsement_id: str):
       # Queue background task
       task = generate_document.delay(endorsement_id)
       return {"task_id": task.id, "status": "processing"}
   ```

## Monitoring & Observability

### Application Monitoring

1. **Metrics Collection**
   ```python
   # Prometheus metrics
   REQUEST_COUNT = Counter(
       'http_requests_total',
       'Total HTTP requests',
       ['method', 'endpoint']
   )
   
   REQUEST_DURATION = Histogram(
       'http_request_duration_seconds',
       'HTTP request duration'
   )
   
   # Middleware for metrics
   @app.middleware("http")
   async def metrics_middleware(request: Request, call_next):
       start_time = time.time()
       response = await call_next(request)
       duration = time.time() - start_time
       
       REQUEST_COUNT.labels(
           method=request.method,
           endpoint=request.url.path
       ).inc()
       
       REQUEST_DURATION.observe(duration)
       return response
   ```

2. **Logging Strategy**
   ```python
   # Structured logging
   import structlog
   
   logger = structlog.get_logger()
   
   async def create_endorsement(data: dict):
       logger.info(
           "Creating endorsement",
           user_id=data['user_id'],
           endorsement_type=data['type']
       )
       
       try:
           result = await endorsement_service.create(data)
           logger.info(
               "Endorsement created successfully",
               endorsement_id=result.id
           )
           return result
       except Exception as e:
           logger.error(
               "Failed to create endorsement",
               error=str(e),
               user_id=data['user_id']
           )
           raise
   ```

3. **Health Checks**
   ```python
   # Health check endpoints
   @router.get("/health")
   async def health_check():
       checks = {
           "database": await check_database(),
           "redis": await check_redis(),
           "external_api": await check_external_api()
       }
       
       status = "healthy" if all(checks.values()) else "unhealthy"
       
       return {
           "status": status,
           "checks": checks,
           "timestamp": datetime.utcnow().isoformat()
       }
   ```

## Deployment Architecture

### Container Strategy

```dockerfile
# Multi-stage Docker build
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim AS backend-builder
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./

FROM python:3.11-slim AS production
WORKDIR /app
COPY --from=backend-builder /app ./
COPY --from=frontend-builder /app/frontend/dist ./static
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Infrastructure as Code

```yaml
# docker-compose.yml for local development
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: endorsement_app
      POSTGRES_USER: app_user
      POSTGRES_PASSWORD: app_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: 
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://app_user:app_password@db:5432/endorsement_app
      REDIS_URL: redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./uploads:/app/uploads

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    ports:
      - "3000:3000"
    environment:
      VITE_API_URL: http://localhost:8000
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Production Deployment

```yaml
# Kubernetes deployment example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: endorsement-app
spec:
  replicas: 3
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
        image: endorsement-app:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: secret-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Design Decisions & Trade-offs

### Technology Choices

1. **FastAPI vs Flask/Django**
   - ✅ Automatic OpenAPI documentation
   - ✅ Built-in async support
   - ✅ Pydantic integration for validation
   - ❌ Smaller ecosystem than Django
   - ❌ Less mature than Flask

2. **React vs Vue/Angular**
   - ✅ Large ecosystem and community
   - ✅ Excellent TypeScript support
   - ✅ Flexible component model
   - ❌ Steeper learning curve
   - ❌ Requires additional libraries for full functionality

3. **PostgreSQL vs MongoDB**
   - ✅ ACID compliance
   - ✅ Rich query capabilities
   - ✅ Mature ecosystem
   - ❌ Less flexible for schema changes
   - ❌ Vertical scaling limitations

### Architectural Trade-offs

1. **Monolith vs Microservices**
   - **Choice**: Modular monolith
   - **Reasoning**: 
     - Simpler deployment and testing
     - Lower operational complexity
     - Easy to split later if needed
   - **Trade-off**: Less scalability flexibility

2. **Server-side vs Client-side Rendering**
   - **Choice**: Client-side rendering (SPA)
   - **Reasoning**:
     - Better user experience after initial load
     - Easier API integration
     - Simplified deployment
   - **Trade-off**: Slower initial page load

3. **RESTful vs GraphQL API**
   - **Choice**: RESTful API
   - **Reasoning**:
     - Simpler to implement and debug
     - Better caching support
     - Familiar to most developers
   - **Trade-off**: Over/under-fetching data

---

This architecture documentation provides a foundation for understanding and extending the system. It should be updated as the system evolves and new patterns emerge.