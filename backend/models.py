"""
Pydantic models for API request/response validation
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, validator
from enum import Enum

# Enums
class InkColor(str, Enum):
    BLACK = "black"
    BLUE = "blue"  
    RED = "red"

class PlacementType(str, Enum):
    FRONT = "front"
    BACK = "back"

class LetterType(str, Enum):
    TENDER = "tender"
    PTP = "ptp"
    FCRA = "fcra"

class CreditBureau(str, Enum):
    EQUIFAX = "equifax"
    EXPERIAN = "experian"
    TRANSUNION = "transunion"

# Base response models
class BaseResponse(BaseModel):
    """Base response model"""
    success: bool = True
    message: str
    timestamp: datetime = Field(default_factory=datetime.now)

class ErrorResponse(BaseModel):
    """Error response model"""
    error: bool = True
    error_code: str
    message: str
    details: Optional[str] = None
    status_code: int
    path: Optional[str] = None

# Bill parsing models
class BillLineItem(BaseModel):
    """Individual line item in a bill"""
    description: str = Field(..., description="Description of the line item")
    amount: float = Field(..., ge=0, description="Amount for this line item")
    quantity: Optional[int] = Field(None, ge=1, description="Quantity of items")
    unit_price: Optional[float] = Field(None, ge=0, description="Price per unit")

class BillData(BaseModel):
    """Parsed bill information"""
    bill_number: Optional[str] = Field(None, description="Bill or invoice number")
    issuer: Optional[str] = Field(None, description="Company or entity that issued the bill")
    customer_name: Optional[str] = Field(None, description="Name of the customer")
    customer_address: Optional[str] = Field(None, description="Customer's address")
    total_amount: Optional[float] = Field(None, ge=0, description="Total amount due")
    currency: Optional[str] = Field(None, description="Currency code (e.g., USD)")
    due_date: Optional[str] = Field(None, description="Due date for payment")
    description: Optional[str] = Field(None, description="Bill description")
    account_number: Optional[str] = Field(None, description="Account number")
    line_items: Optional[List[BillLineItem]] = Field(None, description="Individual line items")

# Endorsement models
class EndorsementDetails(BaseModel):
    """Details of an endorsement applied to a bill"""
    endorser_name: str = Field(..., description="Name of the person making the endorsement")
    text: str = Field(..., description="Text of the endorsement")
    signature: str = Field(..., description="Digital signature")
    timestamp: datetime = Field(default_factory=datetime.now)
    next_payee: Optional[str] = Field(None, description="Next payee in the chain")

class EndorsementOptions(BaseModel):
    """Options for bill endorsement"""
    ink_color: InkColor = Field(InkColor.BLUE, description="Color of the endorsement ink")
    placement: PlacementType = Field(PlacementType.FRONT, description="Where to place the endorsement")
    position_x: Optional[int] = Field(None, ge=0, description="X coordinate for endorsement position")
    position_y: Optional[int] = Field(None, ge=0, description="Y coordinate for endorsement position")

class EndorsementRequest(BaseModel):
    """Request for bill endorsement"""
    options: Optional[EndorsementOptions] = Field(None, description="Endorsement options")

class EndorsementResponse(BaseResponse):
    """Response from bill endorsement"""
    endorsed_files: List[str] = Field(..., description="List of paths to endorsed files")
    bill_data: Optional[BillData] = Field(None, description="Parsed bill information")
    endorsements: Optional[List[EndorsementDetails]] = Field(None, description="Applied endorsements")

# Contract scanning models
class ContractScanRequest(BaseModel):
    """Request for contract scanning"""
    tag: str = Field(..., description="Tag to search for in the contract")

    @validator('tag')
    def validate_tag(cls, v):
        allowed_tags = ['hidden_fee', 'misrepresentation', 'arbitration']
        if v not in allowed_tags:
            raise ValueError(f'Tag must be one of: {", ".join(allowed_tags)}')
        return v

class ContractScanResponse(BaseResponse):
    """Response from contract scanning"""
    found_clauses: List[str] = Field(..., description="List of found clauses")
    total_matches: int = Field(..., ge=0, description="Total number of matches found")
    confidence_score: Optional[float] = Field(None, ge=0, le=1, description="Confidence score")

# Letter generation models
class TenderLetterData(BaseModel):
    """Data for tender letter generation"""
    user_name: str = Field(..., min_length=1, description="Name of the user")
    user_address: str = Field(..., min_length=1, description="Address of the user")
    creditor_name: str = Field(..., min_length=1, description="Name of the creditor")
    creditor_address: str = Field(..., min_length=1, description="Address of the creditor")
    bill_file_name: str = Field(..., min_length=1, description="Name of the bill file")

class PTPLetterData(BaseModel):
    """Data for Promise to Pay letter generation"""
    user_name: str = Field(..., min_length=1, description="Name of the user")
    user_address: str = Field(..., min_length=1, description="Address of the user")
    creditor_name: str = Field(..., min_length=1, description="Name of the creditor")
    creditor_address: str = Field(..., min_length=1, description="Address of the creditor")
    account_number: str = Field(..., min_length=1, description="Account number")
    promise_amount: str = Field(..., min_length=1, description="Amount promised to pay")
    promise_date: str = Field(..., min_length=1, description="Date of promise")

    @validator('promise_amount')
    def validate_amount(cls, v):
        try:
            float(v.replace('$', '').replace(',', ''))
        except ValueError:
            raise ValueError('Promise amount must be a valid monetary value')
        return v

class FCRALetterData(BaseModel):
    """Data for FCRA dispute letter generation"""
    user_name: str = Field(..., min_length=1, description="Name of the user")
    user_address: str = Field(..., min_length=1, description="Address of the user")
    account_number: str = Field(..., min_length=1, description="Account number to dispute")
    reason: str = Field(..., min_length=1, description="Reason for the dispute")
    violation_template: str = Field(..., description="Violation template to use")
    selected_bureaus: List[CreditBureau] = Field(..., min_items=1, description="Credit bureaus to send dispute to")

class LetterGenerationRequest(BaseModel):
    """Request for letter generation"""
    letter_type: LetterType = Field(..., description="Type of letter to generate")
    data: Dict[str, Any] = Field(..., description="Data specific to the letter type")

class LetterGenerationResponse(BaseResponse):
    """Response from letter generation"""
    letter_content: str = Field(..., description="Generated letter content")
    letter_type: LetterType = Field(..., description="Type of letter generated")
    generated_at: datetime = Field(default_factory=datetime.now)

# File upload models
class FileUploadResponse(BaseResponse):
    """Response from file upload"""
    file_id: str = Field(..., description="Unique identifier for the uploaded file")
    file_path: str = Field(..., description="Path to the uploaded file")
    file_size: int = Field(..., ge=0, description="Size of the uploaded file in bytes")
    content_type: str = Field(..., description="MIME type of the uploaded file")

# Health check model
class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str = Field("healthy", description="Service status")
    timestamp: datetime = Field(default_factory=datetime.now)
    version: str = Field("1.0.0", description="API version")
    dependencies: Dict[str, str] = Field(default_factory=dict, description="Status of dependencies")

# Configuration models
class EndorsementConfig(BaseModel):
    """Configuration for endorsements"""
    trigger: str = Field(..., description="Trigger condition for this endorsement")
    meaning: str = Field(..., description="Meaning or explanation of the endorsement")
    ink_color: InkColor = Field(InkColor.BLUE, description="Default ink color")
    placement: PlacementType = Field(PlacementType.FRONT, description="Default placement")

class SovereignOverlayConfig(BaseModel):
    """Configuration for sovereign overlay"""
    sovereign_endorsements: List[EndorsementConfig] = Field(..., description="List of endorsement configurations")
    default_settings: Dict[str, Any] = Field(default_factory=dict, description="Default settings")