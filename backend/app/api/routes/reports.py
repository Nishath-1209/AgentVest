
from pathlib import Path
from tempfile import TemporaryDirectory
from uuid import uuid4

import pymupdf
from fastapi import (
    APIRouter,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from pydantic import BaseModel, Field

from app.agents.report_agent import analyze_financial_report
from app.services.pdf_processor import (
    MAX_PDF_BYTES,
    process_pdf,
)
from app.services.vector_store import index_report


# Phase 5: Financial Report API
router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"],
)


class ReportQuestion(BaseModel):
    ticker: str = Field(min_length=1, max_length=20)
    question: str = Field(min_length=1, max_length=2000)
    report_id: str | None = None


@router.post("/upload")
async def upload_report(
    file: UploadFile = File(...),
    ticker: str = Form(...),
):
    """
    Upload a financial PDF, extract text,
    generate embeddings and index in Astra DB.
    """

    ticker = ticker.strip().upper()

    if not ticker or len(ticker) > 20:
        raise HTTPException(
            status_code=400,
            detail="A valid stock ticker is required",
        )

    filename = Path(file.filename or "").name

    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported",
        )

    try:
        with TemporaryDirectory() as temp_dir:
            pdf_path = Path(temp_dir) / f"{uuid4()}.pdf"

            # Save the uploaded PDF in chunks.
            total_bytes = 0

            with pdf_path.open("wb") as output:
                while True:
                    chunk = await file.read(1024 * 1024)

                    if not chunk:
                        break

                    total_bytes += len(chunk)

                    if total_bytes > MAX_PDF_BYTES:
                        raise HTTPException(
                            status_code=413,
                            detail="PDF exceeds the 25 MB limit",
                        )

                    output.write(chunk)

            if total_bytes == 0:
                raise HTTPException(
                    status_code=400,
                    detail="Uploaded PDF is empty",
                )

            # Validate that the file is a readable PDF.
            try:
                with pymupdf.open(str(pdf_path)) as document:
                    if document.needs_pass:
                        raise HTTPException(
                            status_code=422,
                            detail="Password-protected PDFs are not supported",
                        )
            except HTTPException:
                raise
            except Exception as exc:
                raise HTTPException(
                    status_code=422,
                    detail="Invalid or unreadable PDF",
                ) from exc

            # Extract text and split into chunks.
            processed = process_pdf(str(pdf_path))

        if not processed["chunks"]:
            raise HTTPException(
                status_code=422,
                detail="No extractable text found in the PDF",
            )

        # Store embeddings and report chunks in Astra DB.
        result = index_report(
            chunks=processed["chunks"],
            filename=filename,
            ticker=ticker,
        )

        return {
            "message": "Financial report indexed successfully",
            "pages_extracted": processed["pages_extracted"],
            **result,
        }

    except HTTPException:
        raise

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    finally:
        await file.close()


@router.post("/ask")
def ask_report_question(request: ReportQuestion):
    """
    Answer a question using relevant financial report
    passages retrieved from Astra DB and Gemini.
    """

    try:
        result = analyze_financial_report(
            ticker=request.ticker,
            question=request.question,
            report_id=request.report_id,
        )

        return result

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc
