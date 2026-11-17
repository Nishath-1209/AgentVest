
import pymupdf
import pytest

from app.services.pdf_processor import (
    extract_pdf_pages,
    chunk_pdf_pages,
    process_pdf,
)


def test_extract_pdf_pages(tmp_path):
    pdf_path = tmp_path / "sample.pdf"

    document = pymupdf.open()

    page1 = document.new_page()
    page1.insert_text(
        (72, 72),
        "Annual revenue increased by 12 percent."
    )

    page2 = document.new_page()
    page2.insert_text(
        (72, 72),
        "Operating expenses decreased."
    )

    document.save(str(pdf_path))
    document.close()

    pages = extract_pdf_pages(str(pdf_path))

    assert len(pages) == 2
    assert pages[0]["page_number"] == 1
    assert pages[1]["page_number"] == 2
    assert "Annual revenue" in pages[0]["text"]

    result = process_pdf(str(pdf_path))
    assert result["pages_extracted"] == 2
    assert result["total_chunks"] >= 2


def test_chunking_preserves_page_number():
    pages = [{
        "page_number": 5,
        "text": "Revenue increased. " * 100,
    }]

    chunks = chunk_pdf_pages(
        pages,
        chunk_size=200,
        overlap=30,
    )

    assert len(chunks) > 1
    assert all(chunk["page_number"] == 5 for chunk in chunks)


def test_invalid_overlap():
    with pytest.raises(ValueError):
        chunk_pdf_pages(
            [{"page_number": 1, "text": "Test"}],
            chunk_size=100,
            overlap=100,
        )


def test_missing_pdf():
    with pytest.raises(FileNotFoundError):
        extract_pdf_pages("missing.pdf")
