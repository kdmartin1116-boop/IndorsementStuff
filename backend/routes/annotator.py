import os
import sys

from pydantic import BaseModel

from fastapi import APIRouter

from packages.LocalAgentCore.InstrumentAnnotator.parse_layout import parse_layout
from packages.LocalAgentCore.InstrumentAnnotator.suggest_endorsements import suggest_endorsements
from packages.LocalAgentCore.InstrumentAnnotator.tag_zones import tag_zones

router = APIRouter()


class AnnotatorRequest(BaseModel):
    text: str


@router.post("/api/wizard/annotate")
async def annotate_instrument(request: AnnotatorRequest):
    """
    Analyzes an instrument's text and returns layout, tags, and endorsement suggestions.
    """
    layout = parse_layout(request.text)
    tags = tag_zones(layout)
    endorsements = suggest_endorsements(tags)

    return {"layout": layout, "tags": tags, "endorsements": endorsements}
