"""
Authentication routes for Legal Education Platform

These routes handle user registration, login, and access control for educational resources.
All access is logged for accountability and educational purposes.
"""

from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from backend.auth import (
    UserCreate, UserLogin, Token, User, ACCESS_TOKEN_EXPIRE_MINUTES,
    authenticate_user, create_user, create_access_token, verify_token,
    log_educational_access, load_users
)

router = APIRouter()

# OAuth2 scheme for token handling
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> User:
    """Get the current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    email = verify_token(token)
    if email is None:
        raise credentials_exception
    
    # Load user data
    users = load_users()
    if email not in users:
        raise credentials_exception
    
    user_data = users[email]
    if not user_data.get("is_active", True):
        raise HTTPException(status_code=400, detail="Inactive user")
    
    return User(**{k: v for k, v in user_data.items() if k != "hashed_password"})

@router.post("/register", response_model=User)
async def register_user(user_data: UserCreate):
    """
    Register a new user for legal education platform access
    
    Registration helps ensure responsible use of legal education resources
    and allows tracking usage patterns for educational improvement.
    """
    
    # Validate purpose (ensure educational intent)
    valid_purposes = [
        "learn about consumer rights",
        "understand legal processes", 
        "find legitimate legal help",
        "research for academic purposes",
        "professional legal education",
        "consumer protection advocacy"
    ]
    
    if not any(purpose.lower() in user_data.purpose.lower() for purpose in valid_purposes):
        raise HTTPException(
            status_code=400,
            detail="Please specify a legitimate educational purpose for accessing legal resources"
        )
    
    # Create user
    user = create_user(user_data)
    if user is None:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Log registration for accountability
    log_educational_access(user.email, "registration", "new_user_registered")
    
    return user

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    """
    Login to get access token for legal education resources
    
    Authentication helps ensure responsible use and allows tracking
    of educational resource access patterns.
    """
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    # Log login for accountability
    log_educational_access(user.email, "login", "user_authenticated")
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=User)
async def read_current_user(current_user: Annotated[User, Depends(get_current_user)]):
    """Get current user information"""
    log_educational_access(current_user.email, "profile", "viewed_profile")
    return current_user

@router.get("/dashboard")
async def user_dashboard(current_user: Annotated[User, Depends(get_current_user)]):
    """
    User dashboard with educational progress and resource access
    """
    log_educational_access(current_user.email, "dashboard", "viewed_dashboard")
    
    return {
        "user": current_user,
        "message": "Welcome to the Legal Education Platform",
        "available_resources": [
            "Consumer Rights Information",
            "Legal Resource Directory", 
            "Pseudolegal Warnings",
            "Legitimate Legal Procedures",
            "Attorney Referral Information"
        ],
        "safety_notice": "This platform provides educational information only. Always consult with licensed attorneys for legal advice.",
        "disclaimer": "All access is logged for educational accountability purposes."
    }

@router.post("/log-resource-access")
async def log_resource_access(
    current_user: Annotated[User, Depends(get_current_user)],
    resource: str,
    action: str = "viewed"
):
    """
    Log access to educational resources for accountability
    """
    log_educational_access(current_user.email, resource, action)
    
    return {
        "message": "Resource access logged",
        "resource": resource,
        "action": action,
        "timestamp": "logged",
        "purpose": "educational_accountability"
    }