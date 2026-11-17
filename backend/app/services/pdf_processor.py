
from pathlib import Path
import re

import pymupdf


MAX_PDF_BYTES = 25 * 1024 * 1024


def extract_pdf_pages(pdf_path: str) -> list[dict]:
    """
    Extract text from a PDF, preserving page numbers.
    """
    path = Path(pdf_path)

    if not path.is_file():
        raise FileNotFoundError("PDF file not found")

    if path.suffix.lower() != ".pdf":
        raise ValueError("Only PDF files are supported")

    if path.stat().st_size > MAX_PDF_BYTES:
        raise ValueError("PDF exceeds the 25 MB limit")

    pages = []

    with pymupdf.open(str(path)) as document:
        if document.needs_pass:
            raise ValueError("Password-protected PDFs are not supported")

        for page_number, page in enumerate(document, start=1):
            text = page.get_text("text")
            text = re.sub(r"\s+", " ", text).strip()

            if text:
                pages.append({
                    "page_number": page_number,
                    "text": text,
                })

    return pages


def chunk_pdf_pages(
    pages: list[dict],
    chunk_size: int = 1000,
    overlap: int = 150,
) -> list[dict]:
    """
    Split page text into overlapping chunks.

    Each chunk retains its source page number.
    """
    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive")

    if overlap < 0 or overlap >= chunk_size:
        raise ValueError("overlap must be >= 0 and < chunk_size")

    chunks = []
    chunk_id = 0

    for page in pages:
        text = page["text"]
        start = 0

        while start < len(text):
            end = min(start + chunk_size, len(text))

            if end < len(text):
                boundary = text.rfind(" ", start, end)
                if boundary > start + chunk_size // 2:
                    end = boundary

            content = text[start:end].strip()

            if content:
                chunks.append({
                    "chunk_id": chunk_id,
                    "page_number": page["page_number"],
                    "text": content,
                })
                chunk_id += 1

            if end >= len(text):
                break

            start = max(start + 1, end - overlap)

    return chunks


def process_pdf(pdf_path: str) -> dict:
    pages = extract_pdf_pages(pdf_path)
    chunks = chunk_pdf_pages(pages)

    return {
        "filename": Path(pdf_path).name,
        "pages_extracted": len(pages),
        "total_chunks": len(chunks),
        "chunks": chunks,
    }
