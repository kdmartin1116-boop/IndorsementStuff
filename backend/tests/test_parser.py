import os
import sys

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from packages.LocalAgentCore.InstrumentAnnotator.parser import BillParser  # noqa: E402


def test_parse_free_text_bill():
    """Test parsing a free-text bill."""
    # Create a BillParser instance
    parser = BillParser()

    # Read the content of the sample bill
    with open("examples/sample_bill.txt", "r") as f:
        bill_text = f.read()

    # Parse the bill
    bill_data = parser.parse_bill(bill_text)

    # Check the extracted data
    assert bill_data.get("payee") == "Sovereign Bank"
    assert bill_data.get("total_amount") == 1200.0
    assert bill_data.get("currency") == "USD"
    assert bill_data.get("due_date") == "September 1, 2025"
