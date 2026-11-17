
"""Unit tests for Phase 6 Investment Advisor."""

from unittest.mock import patch

import pytest

from app.agents.investment_advisor import analyze_investment


def fake_price(symbol, period):
    return {
        "symbol": symbol,
        "period": period,
        "trend": "bullish",
        "price": 150.0,
        "summary": ["Price is above the 50-day average"],
    }


def fake_news(symbol, days):
    return {
        "symbol": symbol,
        "days": days,
        "status": "ok",
        "overall_sentiment": "positive",
        "sentiment_score": 0.5,
        "articles": [],
    }


def fake_report(ticker, question, report_id=None):
    return {
        "ticker": ticker,
        "question": question,
        "answer": "Revenue increased. [Source 1]",
        "sources": [
            {
                "source_number": 1,
                "filename": "annual_report.pdf",
                "page_number": 3,
            }
        ],
    }


def test_all_agents_succeed():
    with (
        patch(
            "app.agents.investment_advisor.analyze_stock",
            side_effect=fake_price,
        ),
        patch(
            "app.agents.investment_advisor.analyze_news",
            side_effect=fake_news,
        ),
        patch(
            "app.agents.investment_advisor.analyze_financial_report",
            side_effect=fake_report,
        ),
    ):
        result = analyze_investment("AAPL")

    assert result["assessment"] == "positive_alignment"
    assert result["agents"]["price"]["status"] == "ok"
    assert result["agents"]["news"]["status"] == "ok"
    assert result["agents"]["report"]["status"] == "ok"
    assert result["agents"]["report"]["data"]["sources"]


def test_report_skipped():
    with (
        patch(
            "app.agents.investment_advisor.analyze_stock",
            side_effect=fake_price,
        ),
        patch(
            "app.agents.investment_advisor.analyze_news",
            side_effect=fake_news,
        ),
        patch(
            "app.agents.investment_advisor.analyze_financial_report"
        ) as report_mock,
    ):
        result = analyze_investment(
            "AAPL",
            include_report=False,
        )

    assert result["agents"]["report"]["status"] == "skipped"
    report_mock.assert_not_called()


def test_missing_news():
    def no_news(symbol, days):
        return {
            "status": "no_news",
            "overall_sentiment": "insufficient_data",
            "articles": [],
        }

    with (
        patch(
            "app.agents.investment_advisor.analyze_stock",
            side_effect=fake_price,
        ),
        patch(
            "app.agents.investment_advisor.analyze_news",
            side_effect=no_news,
        ),
    ):
        result = analyze_investment(
            "AAPL",
            include_report=False,
        )

    assert result["agents"]["news"]["status"] == "no_data"
    assert result["assessment"] == "insufficient_or_mixed_evidence"


def test_news_failure_does_not_crash_advisor():
    with (
        patch(
            "app.agents.investment_advisor.analyze_stock",
            side_effect=fake_price,
        ),
        patch(
            "app.agents.investment_advisor.analyze_news",
            side_effect=RuntimeError("Provider unavailable"),
        ),
    ):
        result = analyze_investment(
            "AAPL",
            include_report=False,
        )

    assert result["agents"]["news"]["status"] == "error"
    assert result["agents"]["price"]["status"] == "ok"


def test_unsupported_news_exchange():
    with patch(
        "app.agents.investment_advisor.analyze_stock",
        side_effect=fake_price,
    ):
        result = analyze_investment(
            "RELIANCE.NS",
            include_report=False,
        )

    assert result["agents"]["news"]["status"] == "unsupported"
    assert result["agents"]["price"]["status"] == "ok"


@pytest.mark.parametrize(
    "period,days",
    [
        ("3mo", 7),
        ("1y", 0),
        ("1y", 31),
    ],
)
def test_invalid_parameters(period, days):
    with pytest.raises(ValueError):
        analyze_investment(
            "AAPL",
            period=period,
            days=days,
        )
