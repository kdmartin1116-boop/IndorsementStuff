#!/usr/bin/env python3

import os
import sys
sys.path.insert(0, os.getcwd())

from packages.EndorserKit.attach_endorsement_to_pdf import attach_endorsement_to_pdf_function

# Test endorsement data
test_endorsement_data = {
    "endorsements": [{
        "endorser_name": "FTK SOLUTIONS LLC",
        "next_payee": "For Deposit Only",
        "text": "For Deposit Only - UCC Article 3 Commercial Instrument",
        "signature": "TestSignature123456789"
    }],
    "signature_block": {
        "signed_by": "FTK SOLUTIONS LLC",
        "capacity": "Payer",
        "signature": "Digital Signature Applied",
        "date": "2025-10-12"
    }
}

# Find a recent endorsed file to use as test input
import glob
uploads = glob.glob("uploads/*.pdf")
original_files = [f for f in uploads if not f.startswith("uploads/endorsed_")]

if original_files:
    test_input = original_files[0]
    test_output = "uploads/test_visible_endorsement.pdf"
    
    print(f"Testing endorsement visibility...")
    print(f"Input: {test_input}")
    print(f"Output: {test_output}")
    
    attach_endorsement_to_pdf_function(
        original_pdf_path=test_input,
        endorsement_data=test_endorsement_data,
        output_pdf_path=test_output,
        ink_color="blue",
        page_index=0
    )
    
    print(f"✅ Test endorsement created: {test_output}")
    print(f"📄 Check this file to see if endorsements are now visible!")
else:
    print("❌ No original PDF files found in uploads directory")