import re

def parse_negotiable_instrument(document_text):
    results = []
    text = document_text.lower()

    instrument_types = {
        "treasury bonds / notes": {
            "keywords": ["treasury bond", "treasury note", "t-bond", "t-note"],
            "financial_role": "Long-term debt instruments",
            "government_backing": "Backed by full faith and credit of U.S.",
            "issuer": "U.S. Treasury",
            "authority": "Act of Congress"
        },
        "federal reserve notes": {
            "keywords": ["federal reserve note", "dollar", "currency"],
            "financial_role": "Fiat currency",
            "legal_status": "Legal tender, central bank issued",
            "issuer": "Federal Reserve",
            "authority": "Central Bank Issued"
        },
        "gold/silver certificates": {
            "keywords": ["gold certificate", "silver certificate"],
            "financial_role": "Asset-backed currency (historical)",
            "legal_status": "Legacy instruments with asset backing",
            "issuer": "U.S. Treasury",
            "authority": "Act of Congress"
        },
        "certificates of deposit": {
            "keywords": ["certificate of deposit", "cd"],
            "financial_role": "Short-term government debt",
            "legal_status": "Issued by federal entities",
            "issuer": "Federal Entity", # More specific identification needed
            "authority": "Act of Congress"
        },
        "checks / drafts / bills": {
            "keywords": ["check", "draft", "bill of exchange"],
            "financial_role": "Negotiable instruments",
            "legal_status": "Authorized commercial paper",
            "issuer": "Varies (Drawer)",
            "authority": "Commercial law"
        },
        "canceled u.s. stamps": {
            "keywords": ["canceled stamp", "u.s. stamp"],
            "financial_role": "Historical value tokens",
            "legal_status": "Traceable issuance and cancellation",
            "issuer": "U.S. Postal Service",
            "authority": "Act of Congress"
        }
    }

    for instrument_name, data in instrument_types.items():
        for keyword in data["keywords"]:
            if re.search(r'' + re.escape(keyword) + r'', text):
                status = "valid" # Default status
                if "canceled" in text and "stamp" in keyword:
                    status = "canceled"
                elif "obsolete" in text: # Placeholder for obsolescence detection
                    status = "obsolete"
                elif "forged" in text or "fraud" in text: # Placeholder for fraud detection
                    status = "forged"

                results.append({
                    "instrument_type": instrument_name,
                    "financial_role": data["financial_role"],
                    "legal_status": data["legal_status"],
                    "issuer": data["issuer"],
                    "authority": data["authority"],
                    "status": status,
                    "narration": f"This document appears to be a {instrument_name}. It is {status}.",
                    "jurisdiction_overlay": "Placeholder for jurisdiction",
                    "remedy_overlay": "Placeholder for remedy",
                    "historical_context_overlay": "Placeholder for historical context",
                    "fraud_detected": (status == "forged") # Simple fraud flag
                })
                break # Move to next instrument type after first match

    return results

# Example Usage (for testing purposes)
if __name__ == "__main__":
    sample_doc1 = "This is a U.S. Treasury bond issued in 2020."
    sample_doc2 = "A Federal Reserve Note for twenty dollars."
    sample_doc3 = "A canceled U.S. stamp from 1900."
    sample_doc4 = "This is a forged check."

    print(parse_negotiable_instrument(sample_doc1))
    print(parse_negotiable_instrument(sample_doc2))
    print(parse_negotiable_instrument(sample_doc3))
    print(parse_negotiable_instrument(sample_doc4))
