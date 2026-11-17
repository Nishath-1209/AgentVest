
from unittest.mock import MagicMock, patch

import pytest

from app.agents.report_agent import analyze_financial_report


@patch("app.agents.report_agent.get_gemini_client")
@patch("app.agents.report_agent.search_report")
def test_report_analysis(mock_search, mock_client):
    mock_search.return_value = [{
        "report_id": "report-123",
        "filename": "annual_report.pdf",
        "page_number": 12,
        "text": "Revenue increased by 12 percent.",
        "similarity": 0.92,
    }]

    response = MagicMock()
    response.text = (
        "Revenue increased by 12 percent [Source 1]."
    )

    mock_client.return_value.models.generate_content.return_value = response

    result = analyze_financial_report(
        ticker="AAPL",
        question="How did revenue change?",
    )

    assert result["ticker"] == "AAPL"
    assert "12 percent" in result["answer"]
    assert result["sources"][0]["page_number"] == 12

    mock_client.return_value.models.generate_content.assert_called_once()


@patch("app.agents.report_agent.get_gemini_client")
@patch("app.agents.report_agent.search_report")
def test_no_report_matches(mock_search, mock_client):
    mock_search.return_value = []

    result = analyze_financial_report(
        ticker="AAPL",
        question="What was the revenue?",
    )

    assert result["sources"] == []
    assert "No relevant" in result["answer"]
    mock_client.assert_not_called()


def test_empty_question():
    with pytest.raises(ValueError):
        analyze_financial_report(
            ticker="AAPL",
            question="   ",
        )


def test_empty_ticker():
    with pytest.raises(ValueError):
        analyze_financial_report(
            ticker=" ",
            question="What was the revenue?",
        )
