import os
from flask import Flask, request, send_file
from werkzeug.utils import secure_filename
import pytesseract
from PIL import Image
from pypdf import PdfReader

# Import our ported modules
# We need to add the project root to the python path for this to work
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from LocalAgentCore.InstrumentAnnotator.parser import BillParser
from LocalAgentCore.InstrumentAnnotator.stamper import stamp_pdf_with_endorsement, attach_endorsement_to_pdf_function
from LocalAgentCore.RemedyCompiler.engine import apply_endorsement

# --- Basic Flask App Setup ---
UPLOAD_FOLDER = '/tmp/uploads'
ALLOWED_EXTENSIONS = {'pdf'}
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- Main Workflow ---
def process_instrument(file_path):
    """
    Orchestrates the OCR -> Parse -> Generate -> Stamp workflow.
    """
    print(f"Processing file: {file_path}")

    # 1. OCR: Extract text from PDF
    # (This is a simplified example; a robust implementation would handle multi-page PDFs and scanned images)
    try:
        reader = PdfReader(file_path)
        first_page = reader.pages[0]
        raw_text = first_page.extract_text()
        if not raw_text:
            # If text extraction fails, fall back to OCR
            # This requires pdf2image or similar library
            print("No text layer found, attempting OCR (placeholder)...")
            # raw_text = pytesseract.image_to_string(Image.open(image_of_pdf_page))
            raw_text = "OCR Placeholder: Account Number: 123 Amount Due: $456" # Placeholder
        print(f"Extracted Text: {raw_text[:200]}...")
    except Exception as e:
        print(f"Error during text extraction: {e}")
        return None, str(e)

    # 2. Parse: Use BillParser to get structured data
    parser = BillParser()
    bill_data = parser.parse_bill(raw_text)
    # Add some placeholder data for the engine
    bill_data['recipient'] = "Daddy"
    print(f"Parsed Bill Data: {bill_data}")

    # 3. Generate: Create the endorsement
    # (In the future, this text would come from a template in RemedyCompiler)
    remedy_text = "Conditional Acceptance for Value - UCC 1-308"
    endorsed_bill = apply_endorsement(bill_data, "draft", remedy_text)
    print(f"Generated Endorsement: {endorsed_bill['endorsements']}")

    # 4. Stamp: Apply the endorsement to the PDF
    output_filename = f"processed_{os.path.basename(file_path)}"
    output_path = os.path.join(app.config['UPLOAD_FOLDER'], output_filename)
    
    # Using the detailed stamper function
    attach_endorsement_to_pdf_function(
        original_pdf_path=file_path,
        endorsement_data=endorsed_bill,
        output_pdf_path=output_path,
        ink_color="blue",
        page_index=0 # Stamp on the first page
    )
    
    print(f"Stamped PDF created at: {output_path}")
    return output_path, None

# --- Flask API Endpoint ---
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return 'No file part', 400
    file = request.files['file']
    if file.filename == '':
        return 'No selected file', 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        processed_path, error = process_instrument(file_path)

        if error:
            return f"An error occurred: {error}", 500
        
        return send_file(processed_path, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, port=5001)