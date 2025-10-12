import os
import sys
import uuid
from typing import Tuple, Optional

# Add the project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pypdf import PdfReader
from werkzeug.utils import secure_filename
from backend.routes import endorsement
from backend.routes import auth



# DANGEROUS PACKAGES REMOVED FOR LEGAL SAFETY
# The following imports have been removed because they referenced packages
# containing dangerous pseudolegal theories that could result in criminal charges:
#
# from packages.LocalAgentCore.InstrumentAnnotator.parser import BillParser
# from packages.LocalAgentCore.InstrumentAnnotator.stamper import attach_endorsement_to_pdf_function
# from packages.LocalAgentCore.InstrumentClassifier.classifier import parse_sovereign_instrument  
# from packages.LocalAgentCore.RemedyCompiler.engine import apply_endorsement
#
# These packages promoted sovereign citizen theories that:
# - Are not recognized by any court
# - Could constitute document fraud
# - May result in criminal charges for users

# --- Basic FastAPI App Setup ---
UPLOAD_FOLDER = "/tmp/uploads"
ALLOWED_EXTENSIONS = {"pdf"}
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(endorsement.router, prefix="/api", tags=["endorsement"])
app.include_router(auth.router, prefix="/auth", tags=["authentication"])

# Serve uploaded and endorsed files
@app.get("/uploads/{filename}")
async def serve_file(filename: str):
    """
    DISABLED: File serving disabled for security
    
    This endpoint has been disabled as part of security improvements.
    """
    raise HTTPException(
        status_code=423,  # Locked
        detail="File serving disabled for security reasons. This application has been made safe for educational purposes only."
    )
    
    # ORIGINAL CODE COMMENTED FOR SECURITY
    # """Serve files from the uploads directory"""
    # file_path = os.path.join("uploads", filename)
    # if os.path.exists(file_path):
    #     return FileResponse(file_path, filename=filename)
    # else:
    #     raise HTTPException(status_code=404, detail="File not found")


@app.get("/positioner")
async def interactive_positioner():
    """
    DISABLED: Interactive positioner disabled for legal safety
    
    This tool was designed to help position UCC endorsements on documents,
    which could constitute document fraud. It has been disabled for user safety.
    """
    raise HTTPException(
        status_code=423,  # Locked
        detail={
            "error": "POSITIONER_DISABLED",
            "message": "The interactive positioner tool has been disabled for legal safety. Document modification tools could constitute fraud.",
            "legal_advice": "Please consult with a licensed attorney for legitimate legal assistance."
        }
    )
    
    # ORIGINAL CODE COMMENTED FOR SAFETY
    # """Serve the interactive endorsement positioner tool"""
    # from fastapi.responses import HTMLResponse
    # try:
    #     with open("interactive_positioner.html", "r", encoding="utf-8") as f:
    #         return HTMLResponse(f.read())
    # except FileNotFoundError:
    #     raise HTTPException(status_code=404, detail="Positioner tool not found")

@app.get("/favicon.ico")
async def favicon():
    """Serve favicon.ico or return 204 No Content if not available."""
    from fastapi import Response
    favicon_path = os.path.join("static", "favicon.ico")
    if os.path.exists(favicon_path):
        return FileResponse(favicon_path, media_type="image/x-icon")
    return Response(status_code=204)


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# --- Main Workflow ---
def process_instrument(file_path: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Orchestrates the OCR -> Parse -> Generate -> Stamp workflow.
    """
    print(f"Processing file: {file_path}")

    # 1. OCR: Extract text from PDF
    try:
        reader = PdfReader(file_path)
        first_page = reader.pages[0]
        raw_text = first_page.extract_text()
        if not raw_text:
            print("No text layer found, attempting OCR (placeholder)...")
            raw_text = "OCR Placeholder: Account Number: 123 Amount Due: $456"
        print(f"Extracted Text: {raw_text[:200]}...")
    except Exception as e:
        print(f"Error during text extraction: {e}")
        return None, str(e)

    # DANGEROUS FUNCTIONALITY REMOVED FOR LEGAL SAFETY
    # The following dangerous operations have been disabled:
    # - Bill parsing with pseudolegal theories
    # - Endorsement generation using UCC theories  
    # - PDF stamping/modification
    # These could constitute document fraud and result in criminal charges.
    
    raise Exception("""
    🚨 DOCUMENT PROCESSING DISABLED FOR LEGAL SAFETY 🚨
    
    This document processing functionality has been disabled because it could:
    - Constitute document fraud
    - Result in criminal charges for users
    - Create documents not recognized by courts
    
    For legitimate legal assistance, please consult with a licensed attorney.
    """)
    
    # ORIGINAL DANGEROUS CODE COMMENTED OUT:
    # parser = BillParser()
    # bill_data = parser.parse_bill(raw_text)  
    # remedy_text = "Conditional Acceptance for Value - UCC 1-308"
    # endorsed_bill = apply_endorsement(bill_data, "draft", remedy_text)
    # attach_endorsement_to_pdf_function(...)
    
    # return None, "Functionality disabled for user safety"


# --- FastAPI API Endpoints ---
@app.get("/")
def index():
    return {"message": "Hello, World!"}


@app.post("/upload")
def upload_file_endpoint(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file part")
    if file.filename == "":
        raise HTTPException(status_code=400, detail="No selected file")
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        with open(file_path, "wb") as buffer:
            buffer.write(file.file.read())

        processed_path, error = process_instrument(file_path)

        if error:
            raise HTTPException(status_code=500, detail=f"An error occurred: {error}")

        return FileResponse(processed_path, media_type='application/pdf', filename=os.path.basename(processed_path))

    raise HTTPException(status_code=400, detail="File type not allowed")


@app.post("/scan-contract")
def scan_contract_endpoint(contract: UploadFile = File(...)):
    if not contract:
        raise HTTPException(status_code=400, detail="No file part")
    if contract.filename == "":
        raise HTTPException(status_code=400, detail="No selected file")
    if not allowed_file(contract.filename):
        raise HTTPException(status_code=400, detail="Unsupported file type. Only PDF files are allowed.")

    filename = secure_filename(contract.filename)
    unique_filename = str(uuid.uuid4()) + os.path.splitext(filename)[1]
    filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
    with open(filepath, "wb") as buffer:
        buffer.write(contract.file.read())

    # Placeholder for clause scanner logic
    return {"output": "clausescanner.sh not found"}


@app.post("/parse-sovereign-instrument")
def parse_sovereign_instrument_endpoint(document: UploadFile = File(...)):
    if not document:
        raise HTTPException(status_code=400, detail="No document part")
    if document.filename == "":
        raise HTTPException(status_code=400, detail="No selected file")

    unique_filename = str(uuid.uuid4()) + "_sovereign_doc.pdf"
    filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
    with open(filepath, "wb") as buffer:
        buffer.write(document.file.read())

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            document_content = f.read()

        # DANGEROUS FUNCTION REMOVED FOR SAFETY
        # parse_sovereign_instrument promoted pseudolegal theories
        raise HTTPException(
            status_code=423, 
            detail="Sovereign instrument parsing disabled for legal safety. These theories are not recognized by courts and could result in criminal charges."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)


@app.post("/generate-remedy")
def generate_remedy_endpoint():
    # Placeholder for remedy generation logic
    return {"output": "remedygenerator.sh not found"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)