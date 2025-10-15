
import os
import uuid
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, Form
from backend.error_handler import APIError, ErrorCode, validate_file_upload
from backend.models import (
    EndorsementResponse, 
    EndorsementRequest, 
    EndorsementOptions,
    BillData,
    EndorsementDetails,
    InkColor,
    PlacementType
)

from packages.EndorserKit.bill_parser import BillParser
from packages.EndorserKit.endorsement_engine import prepare_endorsement_for_signing
from packages.EndorserKit.ucc3_endorsements import sign_endorsement
from packages.EndorserKit.remedy_logger import log_remedy
from packages.EndorserKit.attach_endorsement_to_pdf import attach_endorsement_to_pdf_function
from packages.EndorserKit.utils import load_yaml_config

router = APIRouter()

# --- CONFIGURATION ---
SOVEREIGN_OVERLAY_CONFIG = "config/sovereign_overlay.yaml"
UPLOAD_DIR = "uploads"
KEY_FILE = "private_key.pem"

def get_private_key():
    """Loads the private key from environment variable or file."""
    key_from_env = os.environ.get("PRIVATE_KEY_PEM")
    if key_from_env:
        return key_from_env
    
    if os.path.exists(KEY_FILE):
        with open(KEY_FILE, 'r') as f:
            return f.read()
            
    return None

@router.post("/endorse-bill/", response_model=EndorsementResponse)
async def endorse_bill(
    file: UploadFile = File(..., description="PDF file to be endorsed"),
    ink_color: InkColor = Form(InkColor.BLUE, description="Color of the endorsement ink"),
    placement: PlacementType = Form(PlacementType.FRONT, description="Where to place the endorsement"),
    position_x: int = Form(None, description="X coordinate for endorsement position"),
    position_y: int = Form(None, description="Y coordinate for endorsement position")
) -> EndorsementResponse:
    """
    Endorse a bill by analyzing it and applying sovereign endorsements.
    
    This endpoint accepts a PDF file, parses its content, and applies 
    appropriate endorsements based on the configured sovereign overlay rules.
    
    **Process:**
    1. Validates the uploaded PDF file
    2. Extracts text content from the PDF
    3. Parses bill information using BillParser
    4. Applies configured endorsements with digital signatures
    5. Generates new PDF files with endorsements overlaid
    
    **Parameters:**
    - **file**: PDF file containing the bill to be endorsed (max 10MB)
    - **ink_color**: Color for the endorsement text (black, blue, or red)
    - **placement**: Where to place the endorsement (front or back of document)
    - **position_x**: Optional X coordinate for precise positioning
    - **position_y**: Optional Y coordinate for precise positioning
    
    **Returns:**
    - Success message
    - List of paths to generated endorsed files
    - Parsed bill data
    - Details of applied endorsements
    
    **Raises:**
    - **400**: Invalid file format or corrupted PDF
    - **413**: File size exceeds maximum limit (10MB)
    - **500**: Server configuration error or processing failure
    """
    # Validate the uploaded file
    validate_file_upload(file, max_size_mb=10)
    
    # Check for private key
    private_key_pem = get_private_key()
    if not private_key_pem:
        raise APIError(
            status_code=500,
            error_code=ErrorCode.INTERNAL_SERVER_ERROR,
            message="Server is not configured with a private key",
            details="Run 'python scripts/generate_key.py' or set the PRIVATE_KEY_PEM environment variable"
        )

    # Ensure upload directory exists
    try:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
    except Exception as e:
        raise APIError(
            status_code=500,
            error_code=ErrorCode.INTERNAL_SERVER_ERROR,
            message="Failed to create upload directory",
            details=str(e)
        )

    # Save uploaded file securely
    if not file.filename:
        raise APIError(
            status_code=400,
            error_code=ErrorCode.VALIDATION_ERROR,
            message="File must have a filename"
        )
        
    filename = str(uuid.uuid4()) + os.path.splitext(file.filename)[1]
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    try:
        content = await file.read()
        with open(filepath, "wb") as buffer:
            buffer.write(content)
    except Exception as e:
        raise APIError(
            status_code=500,
            error_code=ErrorCode.FILE_UPLOAD_ERROR,
            message="Failed to save uploaded file",
            details=str(e)
        )

    try:
        # 1. Parse the bill
        try:
            bill_data = BillParser.get_bill_data_from_source(filepath)
            if "error" in bill_data:
                raise APIError(
                    status_code=400,
                    error_code=ErrorCode.PROCESSING_ERROR,
                    message="Failed to parse bill data",
                    details=bill_data["error"]
                )
        except APIError:
            raise
        except Exception as e:
            raise APIError(
                status_code=500,
                error_code=ErrorCode.PROCESSING_ERROR,
                message="Error during bill parsing",
                details=str(e)
            )

        # 2. Load endorsement rules
        try:
            overlay_config = load_yaml_config(SOVEREIGN_OVERLAY_CONFIG)
            sovereign_endorsements = overlay_config.get("sovereign_endorsements", [])
        except Exception as e:
            raise APIError(
                status_code=500,
                error_code=ErrorCode.PROCESSING_ERROR,
                message="Failed to load endorsement configuration",
                details=str(e)
            )

        if not sovereign_endorsements:
            return EndorsementResponse(
                message="Bill processed, but no applicable endorsements found in config.",
                endorsed_files=[],
                bill_data=BillData(**bill_data) if bill_data else None,
                endorsements=[]
            )

        # 3. Process and attach endorsements
        endorsed_files = []
        applied_endorsements = []
        
        for endorsement_type in sovereign_endorsements:
            trigger = endorsement_type.get("trigger", "Unknown")
            
            endorsement_text = f"{trigger}: {endorsement_type.get('meaning', '')}"
            endorsement_to_sign = prepare_endorsement_for_signing(bill_data, endorsement_text)

            # Sign the endorsement
            signed_endorsement = sign_endorsement(
                endorsement_data=endorsement_to_sign,
                endorser_name=bill_data.get("customer_name", "N/A"),
                private_key_pem=private_key_pem
            )

            # Prepare data for logging and PDF attachment
            bill_for_logging = {
                "instrument_id": bill_data.get("bill_number"),
                "issuer": bill_data.get("issuer", "Unknown"),
                "recipient": bill_data.get("customer_name"),
                "amount": bill_data.get("total_amount"),
                "currency": bill_data.get("currency"),
                "description": bill_data.get("description", "N/A"),
                "endorsements": [{
                    "endorser_name": signed_endorsement.get("endorser_id"),
                    "text": endorsement_text,
                    "next_payee": "Original Creditor", # Placeholder
                    "signature": signed_endorsement["signature"]
                }],
                "signature_block": {
                    "signed_by": signed_endorsement.get("endorser_id"),
                    "capacity": "Payer", # Placeholder
                    "signature": signed_endorsement["signature"],
                    "date": signed_endorsement.get("endorsement_date")
                }
            }

            # Log the remedy
            log_remedy(bill_for_logging)

            # Attach endorsement to a new PDF
            output_pdf_name = f"endorsed_{filename.replace('.pdf', '')}_{trigger.replace(' ', '')}.pdf"
            endorsed_output_path = os.path.join(UPLOAD_DIR, output_pdf_name)

            print(f"🔍 DEBUG - Endorsement data being attached:")
            print(f"   Endorsements: {bill_for_logging.get('endorsements')}")
            print(f"   Signature block: {bill_for_logging.get('signature_block')}")
            print(f"   Trigger: {trigger}")
            print(f"   Ink color: {endorsement_type.get('ink_color', 'black')}")

            # Use the form parameters for ink color and placement, with fallback to config
            effective_ink_color = ink_color.value if ink_color else endorsement_type.get("ink_color", "blue")
            effective_placement = placement.value if placement else endorsement_type.get("placement", "front")
            
            attach_endorsement_to_pdf_function(
                original_pdf_path=filepath,
                endorsement_data=bill_for_logging,
                output_pdf_path=endorsed_output_path,
                ink_color=effective_ink_color,
                page_index=0 if effective_placement.lower() == "front" else -1
            )
            endorsed_files.append(endorsed_output_path)
            
            # Create endorsement detail for response
            endorsement_detail = EndorsementDetails(
                endorser_name=signed_endorsement.get("endorser_id", "N/A"),
                text=endorsement_text,
                signature=signed_endorsement["signature"],
                next_payee="Original Creditor"
            )
            applied_endorsements.append(endorsement_detail)

        return EndorsementResponse(
            message="Bill endorsed successfully",
            endorsed_files=endorsed_files,
            bill_data=BillData(**bill_data) if bill_data else None,
            endorsements=applied_endorsements
        )

    except APIError:
        # Clean up uploaded file on error
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except:
                pass  # Don't let cleanup errors mask the original error
        raise
    except Exception as e:
        # Clean up uploaded file on error
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except:
                pass  # Don't let cleanup errors mask the original error
        raise APIError(
            status_code=500,
            error_code=ErrorCode.PROCESSING_ERROR,
            message="Unexpected error during bill endorsement",
            details=str(e)
        )
