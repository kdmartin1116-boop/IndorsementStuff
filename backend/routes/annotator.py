import os
import sys

from pydantic import BaseModel

from fastapi import APIRouter

sys.path.append(
    os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "..",
            "..",
            "LocalAgentCore",
            "InstrumentAnnotator",
        )
    )
)

from parse_layout import parse_layout  # noqa: E402
from suggest_endorsements import suggest_endorsements  # noqa: E402
from tag_zones import tag_zones  # noqa: E402

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
