
"""Phase 7 tests for Gemini research synthesis."""

import json
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.agents.synthesis_agent import (
    MODEL_NAME,
    _compact_evidence,
    synthesize_research,
)


def sample_agents():
    """Create sample evidence without calling external APIs."""
    return {
        "price": {
            "status": "ok",
            "data": {
                "as_of": "2026-11-17",
                "trend": "bullish",
                "price": 350.42,
                "currency": "USD",
                "change_percent": -0.669,
                "indicators": {
                    "rsi14": 54.82,
                    "sma50": 340.14,
                },
                "summary": [
                    "Price is above the 50-day average"
                ],
                "history": [
                    {"date": "2026-11-17", "close": 350.42}
                ],
            },
        },
        "news": {
            "status": "ok",
            "data": {
                "overall_sentiment": "negative",
                "sentiment_score": -0.4,
                "count": 1,
                "articles": [
                    {
                        "headline": "Example negative headline",
                        "sentiment": "negative",
                        "source": "Example News",
                        "url": "https://example.com/article",
                    }
                ],
            },
        },
        "report": {
            "status": "skipped",
            "data": None,
        },
    }


def sample_synthesis():
    """Create a valid structured Gemini response."""
    return {
        "executive_summary": (
            "Technical indicators are bullish, "
            "while news sentiment is negative."
        ),
        "supporting_evidence": [
            "Price is above the 50-day average."
        ],
        "conflicting_signals": [
            "Bullish technical signals conflict with negative news."
        ],
        "key_risks": [
            "Negative news sentiment may increase uncertainty."
        ],
        "evidence_gaps": [
            "Financial report analysis was skipped."
        ],
    }


def test_compact_evidence_excludes_price_history():
    """Full historical price data should not enter the prompt."""
    evidence = _compact_evidence(sample_agents())

    assert evidence["price"]["status"] == "ok"
    assert evidence["price"]["trend"] == "bullish"
    assert "history" not in evidence["price"]
    assert evidence["news"]["overall_sentiment"] == "negative"
    assert evidence["report"]["status"] == "skipped"


def test_synthesis_success():
    """Valid Gemini JSON should produce a successful result."""
    expected = sample_synthesis()

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = (
        SimpleNamespace(text=json.dumps(expected))
    )

    with patch(
        "app.agents.synthesis_agent.get_gemini_client",
        return_value=mock_client,
    ):
        result = synthesize_research(
            symbol="AAPL",
            agents=sample_agents(),
            assessment="mixed_signals",
        )

    assert result["status"] == "ok"
    assert result["data"] == expected
    assert result["error"] is None

    kwargs = mock_client.models.generate_content.call_args.kwargs

    assert kwargs["model"] == MODEL_NAME
    assert kwargs["config"]["response_mime_type"] == "application/json"
    assert "AAPL" in kwargs["contents"]
    assert "mixed_signals" in kwargs["contents"]


def test_synthesis_invalid_json():
    """Malformed Gemini JSON should return a safe error."""
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = (
        SimpleNamespace(text="not valid json")
    )

    with patch(
        "app.agents.synthesis_agent.get_gemini_client",
        return_value=mock_client,
    ):
        result = synthesize_research(
            "AAPL",
            sample_agents(),
            "mixed_signals",
        )

    assert result["status"] == "error"
    assert result["data"] is None
    assert result["error"] is not None


def test_synthesis_missing_required_field():
    """Responses missing required fields must be rejected."""
    invalid = sample_synthesis()
    del invalid["key_risks"]

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = (
        SimpleNamespace(text=json.dumps(invalid))
    )

    with patch(
        "app.agents.synthesis_agent.get_gemini_client",
        return_value=mock_client,
    ):
        result = synthesize_research(
            "AAPL",
            sample_agents(),
            "mixed_signals",
        )

    assert result["status"] == "error"
    assert result["data"] is None


def test_synthesis_invalid_field_type():
    """List fields must contain only strings."""
    invalid = sample_synthesis()
    invalid["supporting_evidence"] = "Not a list"

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = (
        SimpleNamespace(text=json.dumps(invalid))
    )

    with patch(
        "app.agents.synthesis_agent.get_gemini_client",
        return_value=mock_client,
    ):
        result = synthesize_research(
            "AAPL",
            sample_agents(),
            "mixed_signals",
        )

    assert result["status"] == "error"
    assert result["data"] is None


def test_synthesis_gemini_failure():
    """Gemini outages should not crash the advisor."""
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = RuntimeError(
        "Gemini service unavailable"
    )

    with patch(
        "app.agents.synthesis_agent.get_gemini_client",
        return_value=mock_client,
    ):
        result = synthesize_research(
            "AAPL",
            sample_agents(),
            "mixed_signals",
        )

    assert result["status"] == "error"
    assert result["data"] is None
    assert result["error"] == (
        "AI research synthesis is currently unavailable."
    )


def test_synthesis_insufficient_data():
    """Gemini should not be called when every agent is unavailable."""
    agents = {
        "price": {"status": "error", "data": None},
        "news": {"status": "error", "data": None},
        "report": {"status": "skipped", "data": None},
    }

    with patch(
        "app.agents.synthesis_agent.get_gemini_client"
    ) as mock_client:
        result = synthesize_research(
            "AAPL",
            agents,
            "insufficient_data",
        )

    assert result["status"] == "insufficient_data"
    assert result["data"] is None
    mock_client.assert_not_called()


def test_synthesis_empty_response():
    """An empty Gemini response should be handled safely."""
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = (
        SimpleNamespace(text=None)
    )

    with patch(
        "app.agents.synthesis_agent.get_gemini_client",
        return_value=mock_client,
    ):
        result = synthesize_research(
            "AAPL",
            sample_agents(),
            "mixed_signals",
        )

    assert result["status"] == "error"
    assert result["data"] is None
