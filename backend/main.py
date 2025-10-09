import os
import sys
import uuid
from typing import Tuple, Optional

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from pypdf import PdfReader
from werkzeug.utils import secure_filename



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

app = FastAPI()


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

    # 2. Parse: Use BillParser to get structured data
    parser = BillParser()
    bill_data = parser.parse_bill(raw_text)
    bill_data["recipient"] = "Daddy"
    print(f"Parsed Bill Data: {bill_data}")

    # 3. Generate: Create the endorsement
    remedy_text = "Conditional Acceptance for Value - UCC 1-308"
    endorsed_bill = apply_endorsement(bill_data, "draft", remedy_text)
    print(f"Generated Endorsement: {endorsed_bill['endorsements']}")

    # 4. Stamp: Apply the endorsement to the PDF
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
    return output_path, None


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