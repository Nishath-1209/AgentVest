
from unittest.mock import MagicMock, patch

from app.services.vector_store import (
    index_report,
    search_report,
)


@patch("app.services.vector_store.embed_texts")
@patch("app.services.vector_store.get_collection")
def test_index_report(mock_collection, mock_embed):
    collection = MagicMock()
    mock_collection.return_value = collection

    mock_embed.return_value = [[0.1] * 384]

    chunks = [{
        "chunk_id": 0,
        "page_number": 12,
        "text": "Annual revenue increased by 12 percent.",
    }]

    result = index_report(
        chunks=chunks,
        filename="apple_annual_report.pdf",
        ticker="AAPL",
    )

    assert result["ticker"] == "AAPL"
    assert result["chunks_indexed"] == 1
    assert result["report_id"]

    collection.insert_many.assert_called_once()

    documents = collection.insert_many.call_args.args[0]

    assert documents[0]["page_number"] == 12
    assert len(documents[0]["$vector"]) == 384


@patch("app.services.vector_store.embed_texts")
@patch("app.services.vector_store.get_collection")
def test_search_report(mock_collection, mock_embed):
    collection = MagicMock()
    mock_collection.return_value = collection

    mock_embed.return_value = [[0.1] * 384]

    collection.find.return_value = [{
        "report_id": "report-123",
        "filename": "apple_annual_report.pdf",
        "page_number": 12,
        "text": "Annual revenue increased by 12 percent.",
        "$similarity": 0.92,
    }]

    results = search_report(
        question="How much did revenue increase?",
        ticker="AAPL",
    )

    assert len(results) == 1
    assert results[0]["page_number"] == 12
    assert results[0]["similarity"] == 0.92

    collection.find.assert_called_once()


def test_index_empty_report():
    try:
        index_report(
            chunks=[],
            filename="empty.pdf",
            ticker="AAPL",
        )
    except ValueError:
        pass
    else:
        raise AssertionError("Expected ValueError")
