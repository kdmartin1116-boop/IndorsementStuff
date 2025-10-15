# Development Guide

## Getting Started

This guide will help you set up your development environment and understand the project structure for contributing to the application.

## Prerequisites

### Required Software
- **Node.js** 18+ (LTS recommended)
- **Python** 3.11+
- **Git** 2.30+
- **VS Code** (recommended editor)

### Optional Tools
- **Docker** & Docker Compose
- **Postman** or similar API testing tool
- **Database GUI** (DBeaver, pgAdmin, etc.)

## Project Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd IndorsementStuff
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
python -m alembic upgrade head

# Start development server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

### 4. Verify Installation
- Backend: http://localhost:8000/docs
- Frontend: http://localhost:3000

## Development Workflow

### Branch Strategy
```
main           # Production-ready code
develop        # Integration branch
feature/*      # Feature branches
bugfix/*       # Bug fix branches
hotfix/*       # Emergency fixes
```

### Commit Convention
We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

feat(auth): add user authentication
fix(api): resolve validation error
docs(readme): update installation guide
style(css): improve button styling
refactor(utils): optimize error handling
test(unit): add form validation tests
chore(deps): update dependencies
```

### Development Process

#### 1. Creating a Feature
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat(scope): add new feature"

# Push branch
git push origin feature/your-feature-name

# Create Pull Request
```

#### 2. Code Quality Checks
```bash
# Frontend
npm run lint          # ESLint check
npm run format:check  # Prettier check
npm run type-check    # TypeScript check
npm run test         # Run tests

# Backend
black .              # Code formatting
flake8 .            # Linting
mypy .              # Type checking
pytest              # Run tests
```

#### 3. Pre-commit Hooks
Pre-commit hooks automatically run on each commit:
- Code formatting (Prettier, Black)
- Linting (ESLint, Flake8)
- Type checking (TypeScript, mypy)
- Test execution

## Project Structure

### Backend Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration management
│   ├── database.py          # Database setup
│   ├── dependencies.py      # Dependency injection
│   │
│   ├── api/                 # API routes
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── endorsements.py
│   │   ├── documents.py
│   │   └── letters.py
│   │
│   ├── core/                # Core business logic
│   │   ├── __init__.py
│   │   ├── security.py      # Authentication/authorization
│   │   ├── models.py        # Pydantic models
│   │   └── exceptions.py    # Custom exceptions
│   │
│   ├── services/            # Business services
│   │   ├── __init__.py
│   │   ├── endorsement_service.py
│   │   ├── document_service.py
│   │   └── letter_service.py
│   │
│   ├── db/                  # Database related
│   │   ├── __init__.py
│   │   ├── models.py        # SQLAlchemy models
│   │   └── repositories.py  # Data access layer
│   │
│   └── utils/               # Utility functions
│       ├── __init__.py
│       ├── pdf_processor.py
│       └── crypto.py
│
├── tests/                   # Test files
├── migrations/              # Database migrations
├── requirements.txt         # Python dependencies
├── .env.example            # Environment template
└── Dockerfile              # Docker configuration
```

### Frontend Structure
```
frontend/
├── public/                  # Static assets
├── src/
│   ├── components/          # Reusable components
│   │   ├── UI/              # UI components
│   │   ├── Form/            # Form components
│   │   └── Layout/          # Layout components
│   │
│   ├── pages/               # Page components
│   │   ├── HomePage.tsx
│   │   ├── EndorsementPage.tsx
│   │   └── DocumentsPage.tsx
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useForm.ts
│   │   ├── useEndorsement.ts
│   │   └── useAsync.ts
│   │
│   ├── services/            # API services
│   │   ├── apiClient.ts
│   │   ├── authService.ts
│   │   └── endorsementService.ts
│   │
│   ├── utils/               # Utility functions
│   │   ├── errorHandler.ts
│   │   ├── validation.ts
│   │   └── formatting.ts
│   │
│   ├── types/               # TypeScript definitions
│   │   ├── index.ts
│   │   └── api.ts
│   │
│   └── styles/              # Global styles
│       ├── globals.css
│       └── variables.css
│
├── package.json            # Node dependencies
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite configuration
└── .env.example          # Environment template
```

## Coding Standards

### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Prefer functional components with hooks
- Use meaningful variable names
- Add JSDoc comments for complex functions

### Python
- Follow PEP 8 style guide
- Use type hints for all functions
- Use Black for code formatting
- Add docstrings to all classes and functions
- Use meaningful variable names

### CSS
- Use CSS Modules or styled-components
- Follow BEM methodology for class names
- Use CSS custom properties for theming
- Mobile-first responsive design
- Prefer flexbox and grid for layouts

## Testing Guidelines

### Frontend Testing
```bash
# Unit tests - Components
npm run test:unit

# Integration tests - Hooks and services
npm run test:integration

# E2E tests - User workflows
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Backend Testing
```bash
# Unit tests
pytest tests/unit/

# Integration tests
pytest tests/integration/

# All tests with coverage
pytest --cov=app tests/
```

### Test Structure
```
tests/
├── unit/                   # Unit tests
│   ├── test_models.py
│   └── test_services.py
├── integration/            # Integration tests
│   ├── test_api.py
│   └── test_database.py
└── fixtures/               # Test fixtures
    ├── sample_data.json
    └── test_files/
```

## Environment Configuration

### Backend Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost/db

# Security
SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# External Services
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# Development
DEBUG=true
LOG_LEVEL=debug
```

### Frontend Environment Variables
```bash
# API Configuration
VITE_API_URL=http://localhost:8000
VITE_API_TIMEOUT=30000

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true

# External Services
VITE_GOOGLE_ANALYTICS_ID=GA-XXXXX
```

## Database Management

### Migrations
```bash
# Create new migration
alembic revision --autogenerate -m "Add new table"

# Run migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# Show current revision
alembic current

# Show migration history
alembic history
```

### Database Seeding
```bash
# Seed development data
python scripts/seed_db.py

# Reset database
python scripts/reset_db.py
```

## Debugging

### VS Code Configuration
The project includes VS Code configuration for debugging:

#### Backend Debugging
- Set breakpoints in Python code
- Use F5 to start debugging
- Debug configuration in `.vscode/launch.json`

#### Frontend Debugging
- Use browser developer tools
- React Developer Tools extension
- VS Code debugger for Chrome

### Common Issues

#### Backend Issues
```bash
# Module not found
pip install -r requirements.txt

# Database connection error
# Check DATABASE_URL in .env file

# Import errors
# Ensure PYTHONPATH includes project root
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

#### Frontend Issues
```bash
# Module not found
npm install

# TypeScript errors
npm run type-check

# Build failures
rm -rf node_modules package-lock.json
npm install
```

## Performance Monitoring

### Development Tools
- **React DevTools Profiler** - Component performance
- **Chrome DevTools** - Network and performance
- **Lighthouse** - Web vitals and best practices

### Backend Monitoring
- **FastAPI metrics endpoint** - `/metrics`
- **Database query logging** - Enabled in development
- **Request timing** - Automatic logging

## Contributing Guidelines

### Code Review Process
1. **Self Review** - Review your own code first
2. **Automated Checks** - Ensure all CI checks pass
3. **Peer Review** - At least one team member review
4. **Testing** - Verify changes work as expected
5. **Documentation** - Update relevant documentation

### Pull Request Checklist
- [ ] Code follows project standards
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or properly documented)
- [ ] Performance impact considered
- [ ] Security implications reviewed

### Getting Help
- Check existing documentation
- Search closed issues/PRs
- Ask in team chat
- Create detailed issue if problem persists

---

*Happy coding! 🚀*