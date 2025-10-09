
import os
import uuid
from fastapi import APIRouter, File, UploadFile, HTTPException

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

@router.post("/endorse-bill/")
async def endorse_bill(file: UploadFile = File(...)):
    private_key_pem = get_private_key()
    if not private_key_pem:
        raise HTTPException(
            status_code=500, 
            detail=f"Server is not configured with a private key. Please run 'python scripts/generate_key.py' or set the PRIVATE_KEY_PEM environment variable."
        )

    # Ensure upload directory exists
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Save uploaded file securely
    filename = str(uuid.uuid4()) + os.path.splitext(file.filename)[1]
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    with open(filepath, "wb") as buffer:
        buffer.write(await file.read())

    try:
        # 1. Parse the bill
        bill_data = BillParser.get_bill_data_from_source(filepath)
        if "error" in bill_data:
            raise HTTPException(status_code=400, detail=bill_data["error"])

        # 2. Load endorsement rules
        overlay_config = load_yaml_config(SOVEREIGN_OVERLAY_CONFIG)
        sovereign_endorsements = overlay_config.get("sovereign_endorsements", [])

        if not sovereign_endorsements:
            return {"message": "Bill processed, but no applicable endorsements found in config."}

        # 3. Process and attach endorsements
        endorsed_files = []
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

            attach_endorsement_to_pdf_function(
                original_pdf_path=filepath,
                endorsement_data=bill_for_logging,
                output_pdf_path=endorsed_output_path,
                ink_color=endorsement_type.get("ink_color", "black"),
                page_index=0 if endorsement_type.get("placement", "Front").lower() == "front" else -1
            )
            endorsed_files.append(endorsed_output_path)

        return {"message": "Bill endorsed successfully", "endorsed_files": endorsed_files}

    except Exception as e:
        # Clean up uploaded file on error
        if os.path.exists(filepath):
            os.remove(filepath)
        raise HTTPException(status_code=500, detail=str(e))
