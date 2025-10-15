"""
Document processing routes
"""

import os
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from backend.error_handler import APIError, ErrorCode, validate_file_upload
from backend.models import (
    ContractScanResponse,
    ContractScanRequest,
    FileUploadResponse
)

router = APIRouter()

# Mock keyword map - in production this would be loaded from configuration
KEYWORD_MAP = {
    "hidden_fee": ["convenience fee", "service charge", "processing fee", "undisclosed", "surcharge"],
    "misrepresentation": ["misrepresented", "misleading", "deceptive", "false statement", "inaccurate"],
    "arbitration": ["arbitration", "arbitrator", "binding arbitration", "waive your right to"]
}

@router.post("/scan-contract", response_model=ContractScanResponse)
async def scan_contract_for_terms(
    contract: UploadFile = File(..., description="PDF contract to scan"),
    tag: str = Form(..., description="Tag to search for in the contract")
) -> ContractScanResponse:
    """
    Scan a contract PDF for specific terms and clauses.
    
    This endpoint analyzes a contract document and searches for clauses
    related to the specified tag (e.g., hidden fees, arbitration clauses).
    
    **Parameters:**
    - **contract**: PDF file containing the contract to scan (max 10MB)
    - **tag**: Category of terms to search for (hidden_fee, misrepresentation, arbitration)
    
    **Returns:**
    - List of found clauses matching the search criteria
    - Total number of matches
    - Confidence score (when available)
    
    **Raises:**
    - **400**: Invalid file format, unsupported tag, or corrupted PDF
    - **413**: File size exceeds maximum limit (10MB)
    - **500**: Processing error during text extraction or analysis
    """
    # Validate file
    validate_file_upload(contract, max_size_mb=10)
    
    # Validate tag
    if tag not in KEYWORD_MAP:
        raise APIError(
            status_code=400,
            error_code=ErrorCode.VALIDATION_ERROR,
            message=f"Invalid tag. Must be one of: {', '.join(KEYWORD_MAP.keys())}",
            details=f"Provided tag: {tag}"
        )
    
    try:
        # Read file content
        content = await contract.read()
        
        # In a real implementation, this would use proper PDF parsing and NLP
        # For now, we'll return a mock response
        keywords = KEYWORD_MAP[tag]
        found_clauses = []
        
        # Mock processing - in reality would parse PDF and search text
        if tag == "hidden_fee":
            found_clauses = [
                "A convenience fee of $2.95 will be charged for online payments.",
                "Processing fees may apply to certain transaction types."
            ]
        elif tag == "arbitration":
            found_clauses = [
                "Any disputes arising from this agreement shall be resolved through binding arbitration."
            ]
        
        return ContractScanResponse(
            message=f"Contract scanned successfully for {tag} terms",
            found_clauses=found_clauses,
            total_matches=len(found_clauses),
            confidence_score=0.85 if found_clauses else 0.0
        )
        
    except Exception as e:
        raise APIError(
            status_code=500,
            error_code=ErrorCode.PROCESSING_ERROR,
            message="Failed to process contract document",
            details=str(e)
        )

@router.post("/upload-document", response_model=FileUploadResponse)
async def upload_document(
    file: UploadFile = File(..., description="Document to upload")
) -> FileUploadResponse:
    """
    Upload a document for processing.
    
    **Parameters:**
    - **file**: Document file to upload (max 10MB)
    
    **Returns:**
    - File ID for referencing the uploaded document
    - File path and metadata
    
    **Raises:**
    - **400**: Invalid file format
    - **413**: File size exceeds maximum limit
    - **500**: Upload processing error
    """
    validate_file_upload(file, max_size_mb=10)
    
    # Generate unique file ID
    import uuid
    file_id = str(uuid.uuid4())
    
    # Save file (mock implementation)
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, f"{file_id}_{file.filename}")
    
    try:
        content = await file.read()
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        return FileUploadResponse(
            message="File uploaded successfully",
            file_id=file_id,
            file_path=file_path,
            file_size=len(content),
            content_type=file.content_type or "application/octet-stream"
        )
        
    except Exception as e:
        # Clean up on error
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass
                
        raise APIError(
            status_code=500,
            error_code=ErrorCode.FILE_UPLOAD_ERROR,
            message="Failed to upload document",
            details=str(e)
        )