import os
import sys

from fastapi import APIRouter, Request

from packages.LocalAgentCore.DebtDischargeKit.logic.generate_discharge_instrument import generate_discharge_instrument
from packages.LocalAgentCore.InstrumentAnnotator.parse_layout import parse_layout
from packages.LocalAgentCore.InstrumentAnnotator.suggest_endorsements import suggest_endorsements
from packages.LocalAgentCore.InstrumentAnnotator.tag_zones import tag_zones

router = APIRouter()


@router.post("/api/wizard/packet")
async def generate_packet(request: Request):
    body = await request.json()
    full_name = body.get("full_name", "Daddy")
    statement_id = body.get("statement_id", "123456789")
    amount = body.get("amount", "$1,245.67")
    creditor = body.get("creditor", "XYZ Utility Corp")
    billing_text = body.get("billing_text", "")

    endorsement = generate_discharge_instrument(
        full_name, statement_id, amount, creditor
    )

    cover_letter = f"""
    {full_name}
    c/o Private Address
    Non-Domestic, Without U.S.
    [Date]

    {creditor}
    PO Box 9876
    Federal District, USA

    Re: Conditional Acceptance of Billing Statement #{statement_id}

    To Whom It May Concern,

    I, {full_name}, a living man on the land, sui juris, hereby conditionally accept
    your presentment dated September 15, 2025, for value and proof of claim. I do
    not consent to any presumptions of debt, corporate jurisdiction, or federal
    citizenship.

    This acceptance is made under UCC 3-501 and UCC 1-308, with full reservation of
    rights. I demand verified accounting, lawful money, and sworn affidavit of
    claim under penalty of perjury.

    Please process the enclosed endorsement in honor and good faith. I expect remedy
    and response within 21 days.

    Respectfully,
    {full_name}
    """

    layout = parse_layout(billing_text)
    tags = tag_zones(layout)
    endorsement_suggestions = suggest_endorsements(tags)

    placement_guide = ""
    for suggestion in endorsement_suggestions:
        placement_guide += (
            f"- {suggestion['zone'].capitalize()} Zone: _{suggestion['action']}_\n\n"
        )

    return {
        {
            "cover_letter": cover_letter,
            "endorsement": endorsement,
            "placement_guide": placement_guide.strip(),
        }
    }
