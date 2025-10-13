import re
import os # Added
from PyPDF2 import PdfReader # Added
import pytesseract # Added
from PIL import Image # Added

class BillParser:
    def __init__(self):
        # Define regex patterns for common bill data fields
        self.patterns = {
            "bill_number": r"(?:Account Number|Account No|Invoice Number|Bill No|Reference No)[:\s]*([\w-]+)",
            "total_amount": r"(?:Total Amount|Amount Due|Balance Due)[:\s]*[\$€£¥]?\s*([\d.,]+)",
            "currency": r"(?:Total Amount|Amount Due|Balance Due)[:\s]*([\$€£¥])", # Capture the currency symbol
            "customer_name": r"(?:Customer Name|Client Name|Name)[:\s]*(.+)", # Placeholder, as it's not in the sample PDF
            "remittance_coupon_keywords": r"(?:Remittance Coupon|Payment Stub|Please Detach|Return with Payment|please return bottom portion with your payment)"
        }

    @staticmethod # Added
    def get_bill_data_from_source(bill_source_path: str) -> dict: # Added
        if not bill_source_path.lower().endswith(".pdf"):
            return {"error": "Unsupported bill source format. Only PDF files are supported."}

        text = ""
        try:
            with open(bill_source_path, "rb") as f:
                reader = PdfReader(f)
                for page in reader.pages:
                    text += page.extract_text() or ""
        except Exception as e: # Changed from PyPDF2.errors.PdfReadError to Exception for broader catch
            return {"error": f"Failed to read PDF file: {e}"}

        if not text.strip():
            # Attempt OCR if text extraction fails
            try:
                text = pytesseract.image_to_string(Image.open(bill_source_path))
                if not text.strip():
                    return {"error": "Could not parse bill data from PDF (no text extracted and OCR failed)."}
            except pytesseract.TesseractNotFoundError:
                return {"error": "Tesseract is not installed or not in PATH. Cannot perform OCR."}
            except Exception as e:
                return {"error": f"OCR failed: {e}"}
        
        parser = BillParser() # Instantiate BillParser here
        bill_data = parser.parse_bill(text)

        if not bill_data.get("bill_number"):
            return {"error": "Could not parse bill number from PDF."}
            
        return bill_data

    def find_remittance_coupon(self, bill_text: str) -> str:
        coupon_text = ""
        lines = bill_text.split('\n')
        found_coupon = False
        coupon_start_line = -1

        for i, line in enumerate(lines):
            if re.search(self.patterns["remittance_coupon_keywords"], line, re.IGNORECASE):
                found_coupon = True
                coupon_start_line = i
                break
        
        if found_coupon:
            # Heuristic: Capture a few lines after the keyword as the coupon
            # This can be improved with more advanced layout analysis
            for i in range(coupon_start_line, min(coupon_start_line + 10, len(lines))):
                coupon_text += lines[i] + "\n"
        
        return coupon_text.strip()

    def parse_bill(self, bill_text: str) -> dict:
        bill_data = {}
        
        # Extract bill number
        match = re.search(self.patterns["bill_number"], bill_text, re.IGNORECASE)
        if match:
            bill_data["bill_number"] = match.group(1).strip()
        
        # Extract total amount
        match = re.search(self.patterns["total_amount"], bill_text, re.IGNORECASE)
        if match:
            bill_data["total_amount"] = match.group(1).strip()

        # Extract currency
        match = re.search(self.patterns["currency"], bill_text)
        if match:
            currency_symbol = match.group(1)
            if currency_symbol == "$":
                bill_data["currency"] = "USD"
            else:
                bill_data["currency"] = currency_symbol # Or handle other currencies
        else:
            bill_data["currency"] = "N/A" # Default if no currency symbol found

        # Extract customer name (using placeholder for now)
        match = re.search(self.patterns["customer_name"], bill_text, re.IGNORECASE)
        if match:
            bill_data["customer_name"] = match.group(1).strip()
        else:
            bill_data["customer_name"] = "Valued Customer" # Default if not found

        # Find and parse remittance coupon (for demonstration)
        remittance_coupon_text = self.find_remittance_coupon(bill_text)
        if remittance_coupon_text:
            print(f"\n--- Remittance Coupon Found ---\n{remittance_coupon_text}\n---")
            # You can add more specific regex patterns here to extract data from the coupon
            # For example, if the coupon has its own amount due or account number

        return bill_data
