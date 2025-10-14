"""
Configuration management for the Enhanced Endorsement API
"""
import os
from typing import Optional


class Config:
    """Application configuration settings"""
    
    def __init__(self):
        self.upload_directory = os.environ.get("UPLOAD_DIR", "uploads")
        self.private_key_file = os.environ.get("PRIVATE_KEY_FILE", "private_key.pem")
        self.max_file_size = int(os.environ.get("MAX_FILE_SIZE", 10 * 1024 * 1024))  # 10MB
        self.allowed_extensions = {"pdf", "txt", "doc", "docx"}
        self.debug = os.environ.get("DEBUG", "False").lower() == "true"
        
        # Ensure upload directory exists
        os.makedirs(self.upload_directory, exist_ok=True)
    
    def get_private_key(self) -> Optional[str]:
        """Load private key from environment or file"""
        # Try environment variable first
        key_from_env = os.environ.get("PRIVATE_KEY_PEM")
        if key_from_env:
            return key_from_env
            
        # Try loading from file
        if os.path.exists(self.private_key_file):
            try:
                with open(self.private_key_file, 'r') as f:
                    return f.read()
            except Exception:
                pass
                
        return None
    
    @property
    def cors_origins(self):
        """Get CORS origins from environment"""
        origins = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
        return origins.split(",")