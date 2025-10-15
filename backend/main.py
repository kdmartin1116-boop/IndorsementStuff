import os
import sys
import uuid
from typing import Tuple, Optional

# Add the project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pypdf import PdfReader
from werkzeug.utils import secure_filename
from backend.routes import endorsement, documents, letters
from backend.models import HealthCheckResponse
from backend.error_handler import (
    APIError, 
    validation_exception_handler,
    http_exception_handler,
    api_exception_handler,
    general_exception_handler
)



from packages.LocalAgentCore.InstrumentAnnotator.parser import BillParser  # noqa: E402
from packages.LocalAgentCore.InstrumentAnnotator.stamper import (
    attach_endorsement_to_pdf_function,  # noqa: E402
)
from packages.LocalAgentCore.InstrumentClassifier.classifier import (
    parse_sovereign_instrument,  # noqa: E402
)
from packages.LocalAgentCore.RemedyCompiler.engine import (
    apply_endorsement,
)  # noqa: E402

# --- Basic FastAPI App Setup ---
UPLOAD_FOLDER = "/tmp/uploads"
ALLOWED_EXTENSIONS = {"pdf"}
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app = FastAPI(
    title="Sovereign Finance Cockpit API",
    description="API for document processing and legal instrument analysis",
    version="1.0.0"
)

# Add error handlers
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(APIError, api_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(endorsement.router, prefix="/api", tags=["endorsement"])
app.include_router(documents.router, prefix="/api", tags=["documents"])
app.include_router(letters.router, prefix="/api", tags=["letters"])

@app.get("/health", response_model=HealthCheckResponse, tags=["health"])
async def health_check() -> HealthCheckResponse:
    """
    Health check endpoint to verify the API is running properly.
    
    Returns:
        HealthCheckResponse: Service status and dependency information
    """
    dependencies = {}
    
    # Check if upload directory exists and is writable
    try:
        if os.path.exists(UPLOAD_FOLDER) and os.access(UPLOAD_FOLDER, os.W_OK):
            dependencies["upload_directory"] = "healthy"
        else:
            dependencies["upload_directory"] = "unavailable"
    except Exception:
        dependencies["upload_directory"] = "error"
    
    # Check if private key is configured
    try:
        key_file_exists = os.path.exists("private_key.pem")
        env_key_exists = bool(os.environ.get("PRIVATE_KEY_PEM"))
        if key_file_exists or env_key_exists:
            dependencies["private_key"] = "configured"
        else:
            dependencies["private_key"] = "missing"
    except Exception:
        dependencies["private_key"] = "error"
    
    return HealthCheckResponse(
        status="healthy",
        dependencies=dependencies
    )

# Serve uploaded and endorsed files
@app.get("/uploads/{filename}")
async def serve_file(filename: str):
    """Serve files from the uploads directory"""
    file_path = os.path.join("uploads", filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, filename=filename)
    else:
        raise HTTPException(status_code=404, detail="File not found")


@app.get("/positioner")
async def interactive_positioner():
    """Serve the interactive endorsement positioner tool"""
    from fastapi.responses import HTMLResponse
    try:
        with open("interactive_positioner.html", "r", encoding="utf-8") as f:
            return HTMLResponse(f.read())
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Positioner tool not found")

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
def process_instrument(file_path: str) -> str:
    """
    Orchestrates the OCR -> Parse -> Generate -> Stamp workflow.
    
    Args:
        file_path: Path to the PDF file to process
        
    Returns:
        Path to the processed PDF file
        
    Raises:
        APIError: If processing fails at any step
    """
    from backend.error_handler import APIError, ErrorCode, handle_processing_error
    
    print(f"Processing file: {file_path}")

    # 1. OCR: Extract text from PDF
    try:
        if not os.path.exists(file_path):
            raise APIError(
                status_code=404,
                error_code=ErrorCode.NOT_FOUND,
                message="Input file not found",
                details=f"File path: {file_path}"
            )
            
        reader = PdfReader(file_path)
        if len(reader.pages) == 0:
            raise APIError(
                status_code=400,
                error_code=ErrorCode.PROCESSING_ERROR,
                message="PDF file contains no pages"
            )
            
        first_page = reader.pages[0]
        raw_text = first_page.extract_text()
        if not raw_text:
            print("No text layer found, attempting OCR (placeholder)...")
            raw_text = "OCR Placeholder: Account Number: 123 Amount Due: $456"
        print(f"Extracted Text: {raw_text[:200]}...")
    except APIError:
        raise
    except Exception as e:
        raise handle_processing_error("text extraction", e)

    # 2. Parse: Use BillParser to get structured data
    try:
        parser = BillParser()
        bill_data = parser.parse_bill(raw_text)
        bill_data["recipient"] = "Daddy"
        print(f"Parsed Bill Data: {bill_data}")
    except Exception as e:
        raise handle_processing_error("bill parsing", e)

    # 3. Generate: Create the endorsement
    try:
        remedy_text = "Conditional Acceptance for Value - UCC 1-308"
        endorsed_bill = apply_endorsement(bill_data, "draft", remedy_text)
        print(f"Generated Endorsement: {endorsed_bill['endorsements']}")
    except Exception as e:
        raise handle_processing_error("endorsement generation", e)

    # 4. Stamp: Apply the endorsement to the PDF
    try:
        output_filename = f"processed_{os.path.basename(file_path)}"
        output_path = os.path.join(UPLOAD_FOLDER, output_filename)

        attach_endorsement_to_pdf_function(
            original_pdf_path=file_path,
            endorsement_data=endorsed_bill,
            output_pdf_path=output_path,
            ink_color="blue",
            page_index=0,  # Stamp on the first page
        )

        print(f"Stamped PDF created at: {output_path}")
        return output_path
    except Exception as e:
        raise handle_processing_error("PDF stamping", e)


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

        results = parse_sovereign_instrument(document_content)
        return results
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