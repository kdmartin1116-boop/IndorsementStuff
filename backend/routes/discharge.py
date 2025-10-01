from fastapi import APIRouter, Request
import sys
import os

# Add the logic directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'LocalAgentCore', 'DebtDischargeKit', 'logic')))

from parse_statement import parse_statement
from generate_discharge_instrument import generate_discharge_instrument

router = APIRouter()

@router.post("/api/wizard/discharge")
async def discharge_context(request: Request):
    body = await request.json()
    user_input = body.get("input", "")
    
    flags = parse_statement(user_input)
    
    # For now, we'''ll just return the flags.
    # We can add more logic later to generate the discharge instrument.
    
    return {
        "contradictions": flags,
        "discharge_instrument_preview": "Coming soon..."
    }
