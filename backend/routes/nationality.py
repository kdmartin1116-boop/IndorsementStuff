import os
import sys

from fastapi import APIRouter, Request

sys.path.append(
    os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "..",
            "..",
            "LocalAgentCore",
            "NationalityReclaimer",
            "logic",
        )
    )
)

from generate_affidavit import generate_affidavit  # noqa: E402
from parse_nationality import parse_nationality  # noqa: E402

router = APIRouter()


@router.post("/api/wizard/nationality")
async def nationality_context(request: Request):
    body = await request.json()
    user_input = body.get("input", "")

    parsed = parse_nationality(user_input)
    full_name = body.get("full_name", "John Doe")
    birth_location = body.get("birth_location", "Alabama Republic")

    affidavit = generate_affidavit(
        nationality=(
            parsed["suggested_nationalities"][0]
            if parsed["suggested_nationalities"]
            else "American State National"
        ),
        full_name=full_name,
        birth_location=birth_location,
    )

    return {
        "contradictions": parsed["contradictions"],
        "suggested_nationalities": parsed["suggested_nationalities"],
        "affidavit_preview": affidavit,
    }
