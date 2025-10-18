import os
import sys

from fastapi import APIRouter, Request

from packages.LocalAgentCore.DebtDischargeKit.logic.parse_statement import parse_statement

router = APIRouter()


@router.post("/api/wizard/discharge")
async def discharge_context(request: Request):
    body = await request.json()
    user_input = body.get("input", "")

    flags = parse_statement(user_input)

    # For now, we'll just return the flags.
    # We can add more logic later to generate the discharge instrument.

    return {"contradictions": flags, "discharge_instrument_preview": "Coming soon..."}
