import os
import sys
import uuid

from flask import Flask, jsonify, request, send_file
from pypdf import PdfReader
from werkzeug.utils import secure_filename

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

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

# --- Basic Flask App Setup ---
UPLOAD_FOLDER = "/tmp/uploads"
ALLOWED_EXTENSIONS = {"pdf"}
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# --- Main Workflow ---
def process_instrument(file_path):
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
    output_path = os.path.join(app.config["UPLOAD_FOLDER"], output_filename)

    attach_endorsement_to_pdf_function(
        original_pdf_path=file_path,
        endorsement_data=endorsed_bill,
        output_pdf_path=output_path,
        ink_color="blue",
        page_index=0,  # Stamp on the first page
    )

    print(f"Stamped PDF created at: {output_path}")
    return output_path, None


# --- Flask API Endpoint ---
@app.route("/")
def index():
    return "Hello, World!"


@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return "No file part", 400
    file = request.files["file"]
    if file.filename == "":
        return "No selected file", 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(file_path)

        processed_path, error = process_instrument(file_path)

        if error:
            return f"An error occurred: {error}", 500

        return send_file(processed_path, as_attachment=True)


@app.route("/scan-contract", methods=["POST"])
def scan_contract():
    if "contract" not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files["contract"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
    if not allowed_file(file.filename):
        return (
            jsonify({"error": "Unsupported file type. Only PDF files are allowed."}),
            400,
        )

    filename = secure_filename(file.filename)
    unique_filename = str(uuid.uuid4()) + os.path.splitext(filename)[1]
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], unique_filename)
    file.save(filepath)

    # tag = request.form["tag"]
    # result = subprocess.run(
    #     [
    #         "bash",
    #         "clausescanner.sh",
    #         f"--contract={filepath}",
    #         f"--tags={tag}",
    #     ],
    #     capture_output=True,
    #     text=True,
    # )
    # return jsonify({"output": result.stdout})
    return jsonify({"output": "clausescanner.sh not found"})


@app.route("/parse-sovereign-instrument", methods=["POST"])
def parse_sovereign_instrument_endpoint():
    if "document" not in request.files:
        return jsonify({"error": "No document part"}), 400

    file = request.files["document"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    uploads_dir = app.config["UPLOAD_FOLDER"]
    os.makedirs(uploads_dir, exist_ok=True)
    unique_filename = str(uuid.uuid4()) + "_sovereign_doc.pdf"
    filepath = os.path.join(uploads_dir, unique_filename)
    file.save(filepath)

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            document_content = f.read()

        results = parse_sovereign_instrument(document_content)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)


@app.route("/generate-remedy", methods=["POST"])
def generate_remedy():
    # violation = request.form["violation"]
    # jurisdiction = request.form["jurisdiction"]
    # result = subprocess.run(
    #     [
    #         "bash",
    #         "remedygenerator.sh",
    #         f"--violation={violation}",
    #         f"--jurisdiction={jurisdiction}",
    #     ],
    #     capture_output=True,
    #     text=True,
    # )
    # return jsonify({"output": result.stdout})
    return jsonify({"output": "remedygenerator.sh not found"})


if __name__ == "__main__":
    app.run(debug=True, port=5001)
