from datetime import datetime # Added

def classify_instrument(bill):
    if "description" in bill and "amount" in bill:
        if "issuer" in bill and "recipient" in bill:
            return "draft"  # Most utility bills are orders to pay
    return "note"

def apply_endorsement(bill, instrument_type, text):
    endorsement = {
        "endorser_name": bill["recipient"],
        "text": text,
        "next_payee": "GFL Environmental Services",
        "prev_hash": bill.get("prev_hash", "N/A"),
        "signature": "SIMULATED_SIGNATURE_1234567890"
    }

    bill.setdefault("endorsements", []).append(endorsement)
    return bill

def prepare_endorsement_for_signing(bill_data: dict, endorsement_text: str) -> dict: # Added
    return {
        "document_type": bill_data.get("document_type", "Unknown"),
        "bill_number": bill_data.get("bill_number", "N/A"),
        "customer_name": bill_data.get("customer_name", "N/A"),
        "total_amount": bill_data.get("total_amount", "N/A"),
        "currency": bill_data.get("currency", "N/A"),
        "endorsement_date": datetime.now().strftime("%Y-%m-%d"),
        "endorser_id": "WEB-UTIL-001",
        "endorsement_text": endorsement_text
    }
