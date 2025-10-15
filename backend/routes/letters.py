"""
Letter generation routes
"""

from fastapi import APIRouter, HTTPException
from backend.error_handler import APIError, ErrorCode
from backend.models import (
    LetterGenerationRequest,
    LetterGenerationResponse,
    TenderLetterData,
    PTPLetterData,
    FCRALetterData,
    LetterType
)
from datetime import datetime
from typing import Dict, Any

router = APIRouter()

def generate_tender_letter(data: TenderLetterData) -> str:
    """Generate a tender letter based on provided data"""
    current_date = datetime.now().strftime("%B %d, %Y")
    
    letter_content = f"""
{data.user_name}
{data.user_address}

{current_date}

{data.creditor_name}
{data.creditor_address}

RE: Tender of Payment for {data.bill_file_name}

Dear Sir/Madam,

I am hereby tendering payment for the above-referenced bill in accordance with applicable law and commercial practice.

Please find enclosed the endorsed instrument for the amount due. This tender constitutes full payment and satisfaction of any claimed obligation.

If you cannot accept this tender, please return the instrument unendorsed within ten (10) days of receipt.

Thank you for your attention to this matter.

Sincerely,

{data.user_name}
    """.strip()
    
    return letter_content

def generate_ptp_letter(data: PTPLetterData) -> str:
    """Generate a promise to pay letter based on provided data"""
    current_date = datetime.now().strftime("%B %d, %Y")
    
    letter_content = f"""
{data.user_name}
{data.user_address}

{current_date}

{data.creditor_name}
{data.creditor_address}

RE: Promise to Pay - Account Number: {data.account_number}

Dear Sir/Madam,

I hereby promise to pay the sum of {data.promise_amount} on or before {data.promise_date} for the above-referenced account.

This promise to pay is made in good faith and represents my commitment to resolve this matter.

Please acknowledge receipt of this letter and confirm acceptance of this payment arrangement.

Sincerely,

{data.user_name}
    """.strip()
    
    return letter_content

def generate_fcra_letter(data: FCRALetterData) -> str:
    """Generate an FCRA dispute letter based on provided data"""
    current_date = datetime.now().strftime("%B %d, %Y")
    
    bureaus_text = ", ".join([bureau.value.title() for bureau in data.selected_bureaus])
    
    letter_content = f"""
{data.user_name}
{data.user_address}

{current_date}

To: {bureaus_text}

RE: Dispute of Credit Report Information - Account Number: {data.account_number}

Dear Credit Bureau,

I am writing to dispute the following information in my credit file:

Account Number: {data.account_number}
Reason for Dispute: {data.reason}

{data.violation_template}

I am requesting that this item be removed or corrected. Enclosed are copies of documents supporting my position.

Please reinvestigate this matter and delete or correct the disputed item as soon as possible.

Sincerely,

{data.user_name}
    """.strip()
    
    return letter_content

@router.post("/generate-tender-letter", response_model=LetterGenerationResponse)
async def generate_tender_letter_endpoint(data: TenderLetterData) -> LetterGenerationResponse:
    """
    Generate a tender letter for bill payment.
    
    Creates a formal tender letter that can be sent along with bill payment
    to establish legal tender and protect against future claims.
    
    **Parameters:**
    - **data**: Tender letter data including names, addresses, and bill information
    
    **Returns:**
    - Generated letter content
    - Letter type and generation timestamp
    """
    try:
        letter_content = generate_tender_letter(data)
        
        return LetterGenerationResponse(
            message="Tender letter generated successfully",
            letter_content=letter_content,
            letter_type=LetterType.TENDER
        )
        
    except Exception as e:
        raise APIError(
            status_code=500,
            error_code=ErrorCode.PROCESSING_ERROR,
            message="Failed to generate tender letter",
            details=str(e)
        )

@router.post("/generate-ptp-letter", response_model=LetterGenerationResponse)
async def generate_ptp_letter_endpoint(data: PTPLetterData) -> LetterGenerationResponse:
    """
    Generate a promise to pay letter.
    
    Creates a formal promise to pay letter that establishes a payment commitment
    and can be used in debt negotiation or settlement discussions.
    
    **Parameters:**
    - **data**: Promise to pay data including payment terms and account information
    
    **Returns:**
    - Generated letter content
    - Letter type and generation timestamp
    """
    try:
        letter_content = generate_ptp_letter(data)
        
        return LetterGenerationResponse(
            message="Promise to pay letter generated successfully",
            letter_content=letter_content,
            letter_type=LetterType.PTP
        )
        
    except Exception as e:
        raise APIError(
            status_code=500,
            error_code=ErrorCode.PROCESSING_ERROR,
            message="Failed to generate promise to pay letter",
            details=str(e)
        )

@router.post("/generate-fcra-letter", response_model=LetterGenerationResponse)
async def generate_fcra_letter_endpoint(data: FCRALetterData) -> LetterGenerationResponse:
    """
    Generate an FCRA dispute letter.
    
    Creates a formal dispute letter for credit reporting agencies under the
    Fair Credit Reporting Act (FCRA) to challenge inaccurate credit information.
    
    **Parameters:**
    - **data**: FCRA dispute data including account information and dispute reasons
    
    **Returns:**
    - Generated letter content
    - Letter type and generation timestamp
    """
    try:
        letter_content = generate_fcra_letter(data)
        
        return LetterGenerationResponse(
            message="FCRA dispute letter generated successfully",
            letter_content=letter_content,
            letter_type=LetterType.FCRA
        )
        
    except Exception as e:
        raise APIError(
            status_code=500,
            error_code=ErrorCode.PROCESSING_ERROR,
            message="Failed to generate FCRA dispute letter",
            details=str(e)
        )

@router.post("/generate-letter", response_model=LetterGenerationResponse)
async def generate_letter_generic(request: LetterGenerationRequest) -> LetterGenerationResponse:
    """
    Generic letter generation endpoint that routes to specific generators.
    
    **Parameters:**
    - **request**: Letter generation request specifying type and data
    
    **Returns:**
    - Generated letter content based on the requested type
    """
    try:
        if request.letter_type == LetterType.TENDER:
            data = TenderLetterData(**request.data)
            letter_content = generate_tender_letter(data)
        elif request.letter_type == LetterType.PTP:
            data = PTPLetterData(**request.data)
            letter_content = generate_ptp_letter(data)
        elif request.letter_type == LetterType.FCRA:
            data = FCRALetterData(**request.data)
            letter_content = generate_fcra_letter(data)
        else:
            raise APIError(
                status_code=400,
                error_code=ErrorCode.VALIDATION_ERROR,
                message=f"Unsupported letter type: {request.letter_type}"
            )
        
        return LetterGenerationResponse(
            message=f"{request.letter_type.value.title()} letter generated successfully",
            letter_content=letter_content,
            letter_type=request.letter_type
        )
        
    except APIError:
        raise
    except Exception as e:
        raise APIError(
            status_code=500,
            error_code=ErrorCode.PROCESSING_ERROR,
            message="Failed to generate letter",
            details=str(e)
        )