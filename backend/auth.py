"""
Authentication system for Legal Education Platform

This authentication system is designed for educational accountability and usage tracking.
It helps ensure responsible use of legal education resources.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
import json

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Simple file-based user storage (for educational purposes)
USERS_FILE = "users.json"

class UserCreate(BaseModel):
    """User registration model"""
    email: EmailStr
    password: str
    full_name: str
    purpose: str  # Why they want to access legal education resources
    
class UserLogin(BaseModel):
    """User login model"""
    email: EmailStr
    password: str

class Token(BaseModel):
    """JWT token model"""
    access_token: str
    token_type: str

class User(BaseModel):
    """User data model"""
    email: EmailStr
    full_name: str
    purpose: str
    created_at: datetime
    last_login: Optional[datetime] = None
    is_active: bool = True

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def load_users() -> Dict[str, Dict[str, Any]]:
    """Load users from file"""
    try:
        if os.path.exists(USERS_FILE):
            with open(USERS_FILE, 'r') as f:
                return json.load(f)
        return {}
    except Exception:
        return {}

def save_users(users: Dict[str, Dict[str, Any]]) -> None:
    """Save users to file"""
    try:
        with open(USERS_FILE, 'w') as f:
            json.dump(users, f, indent=2, default=str)
    except Exception as e:
        print(f"Error saving users: {e}")

def create_user(user_data: UserCreate) -> Optional[User]:
    """Create a new user"""
    users = load_users()
    
    # Check if user already exists
    if user_data.email in users:
        return None
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user_dict = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "purpose": user_data.purpose,
        "hashed_password": hashed_password,
        "created_at": datetime.now().isoformat(),
        "last_login": None,
        "is_active": True
    }
    
    users[user_data.email] = user_dict
    save_users(users)
    
    return User(**{k: v for k, v in user_dict.items() if k != "hashed_password"})

def authenticate_user(email: str, password: str) -> Optional[User]:
    """Authenticate a user"""
    users = load_users()
    
    if email not in users:
        return None
    
    user_data = users[email]
    
    if not verify_password(password, user_data["hashed_password"]):
        return None
    
    # Update last login
    user_data["last_login"] = datetime.now().isoformat()
    users[email] = user_data
    save_users(users)
    
    return User(**{k: v for k, v in user_data.items() if k != "hashed_password"})

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[str]:
    """Verify a JWT token and return the email"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        return email
    except JWTError:
        return None

def log_educational_access(email: str, resource: str, action: str) -> None:
    """Log educational resource access for accountability"""
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "email": email,
        "resource": resource,
        "action": action,
        "purpose": "legal_education"
    }
    
    try:
        # Simple logging to file
        with open("education_access.log", "a") as f:
            f.write(f"{json.dumps(log_entry)}\n")
    except Exception as e:
        print(f"Error logging access: {e}")