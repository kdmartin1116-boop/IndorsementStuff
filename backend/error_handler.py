"""
Centralized error handling for FastAPI backend
"""
from typing import Dict, Any, Optional
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
import traceback
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ErrorCode(str, Enum):
    VALIDATION_ERROR = "VALIDATION_ERROR"
    FILE_UPLOAD_ERROR = "FILE_UPLOAD_ERROR" 
    PROCESSING_ERROR = "PROCESSING_ERROR"
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR"
    AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"

class APIError(Exception):
    """Custom API Exception"""
    def __init__(
        self,
        status_code: int,
        error_code: ErrorCode,
        message: str,
        details: Optional[str] = None
    ):
        self.status_code = status_code
        self.error_code = error_code
        self.message = message
        self.details = details
        super().__init__(self.message)

def create_error_response(
    status_code: int,
    error_code: ErrorCode,
    message: str,
    details: Optional[str] = None,
    path: Optional[str] = None
) -> Dict[str, Any]:
    """Create standardized error response"""
    response = {
        "error": True,
        "error_code": error_code.value,
        "message": message,
        "status_code": status_code
    }
    
    if details:
        response["details"] = details
    if path:
        response["path"] = path
        
    return response

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors"""
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(x) for x in error["loc"])
        errors.append(f"{field}: {error['msg']}")
    
    error_msg = "Validation failed: " + "; ".join(errors)
    
    logger.warning(f"Validation error on {request.url}: {error_msg}")
    
    return JSONResponse(
        status_code=422,
        content=create_error_response(
            status_code=422,
            error_code=ErrorCode.VALIDATION_ERROR,
            message=error_msg,
            details=str(exc.errors()),
            path=str(request.url)
        )
    )

async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions"""
    error_code = ErrorCode.INTERNAL_SERVER_ERROR
    
    if exc.status_code == 400:
        error_code = ErrorCode.VALIDATION_ERROR
    elif exc.status_code == 401:
        error_code = ErrorCode.AUTHENTICATION_ERROR
    elif exc.status_code == 403:
        error_code = ErrorCode.AUTHORIZATION_ERROR
    elif exc.status_code == 404:
        error_code = ErrorCode.NOT_FOUND
    
    logger.info(f"HTTP {exc.status_code} on {request.url}: {exc.detail}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content=create_error_response(
            status_code=exc.status_code,
            error_code=error_code,
            message=exc.detail,
            path=str(request.url)
        )
    )

async def api_exception_handler(request: Request, exc: APIError):
    """Handle custom API exceptions"""
    logger.error(f"API Error {exc.status_code} on {request.url}: {exc.message}")
    if exc.details:
        logger.error(f"Details: {exc.details}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content=create_error_response(
            status_code=exc.status_code,
            error_code=exc.error_code,
            message=exc.message,
            details=exc.details,
            path=str(request.url)
        )
    )

async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    error_id = str(hash(str(exc)))[:8]
    logger.error(f"Unhandled exception {error_id} on {request.url}: {str(exc)}")
    logger.error(f"Traceback: {traceback.format_exc()}")
    
    return JSONResponse(
        status_code=500,
        content=create_error_response(
            status_code=500,
            error_code=ErrorCode.INTERNAL_SERVER_ERROR,
            message="An internal server error occurred",
            details=f"Error ID: {error_id}",
            path=str(request.url)
        )
    )

def validate_file_upload(file: Any, max_size_mb: int = 10) -> None:
    """Validate uploaded file"""
    if not file:
        raise APIError(
            status_code=400,
            error_code=ErrorCode.FILE_UPLOAD_ERROR,
            message="No file provided"
        )
    
    # Check file size
    if hasattr(file, 'size') and file.size > max_size_mb * 1024 * 1024:
        raise APIError(
            status_code=400,
            error_code=ErrorCode.FILE_UPLOAD_ERROR,
            message=f"File size must be less than {max_size_mb}MB",
            details=f"File size: {file.size / (1024 * 1024):.2f}MB"
        )
    
    # Check file type
    if hasattr(file, 'content_type'):
        allowed_types = ['application/pdf']
        if file.content_type not in allowed_types:
            raise APIError(
                status_code=400,
                error_code=ErrorCode.FILE_UPLOAD_ERROR,
                message=f"File type must be one of: {', '.join(allowed_types)}",
                details=f"Provided type: {file.content_type}"
            )

def handle_processing_error(operation: str, error: Exception) -> APIError:
    """Convert processing errors to API errors"""
    if "permission" in str(error).lower() or "access" in str(error).lower():
        return APIError(
            status_code=403,
            error_code=ErrorCode.AUTHORIZATION_ERROR,
            message=f"Permission denied during {operation}",
            details=str(error)
        )
    
    if "not found" in str(error).lower() or "no such file" in str(error).lower():
        return APIError(
            status_code=404,
            error_code=ErrorCode.NOT_FOUND,
            message=f"Resource not found during {operation}",
            details=str(error)
        )
    
    return APIError(
        status_code=500,
        error_code=ErrorCode.PROCESSING_ERROR,
        message=f"Failed to complete {operation}",
        details=str(error)
    )