
"""Phase 6: Multi-agent investment research orchestration."""

from concurrent.futures import ThreadPoolExecutor

from app.agents.price_agent import analyze_stock
from app.agents.news_agent import analyze_news
from app.agents.report_agent import analyze_financial_report
from app.services.market_data import validate_symbol
from app.agents.synthesis_agent import synthesize_research

REPORT_QUESTION = (
    "Summarize the company's financial performance, "
    "major financial risks, and outlook. Cite the report evidence."
)


def _run_agent(name, function, *args, **kwargs):
    """Run one agent and isolate failures."""
    try:
        return {
            "status": "ok",
            "data": function(*args, **kwargs),
            "error": None,
        }
    except Exception:
        # Avoid exposing API keys, tokens or provider internals.
        return {
            "status": "error",
            "data": None,
            "error": f"{name} analysis is currently unavailable.",
        }


def _technical_outlook(price_data):
    if not price_data:
        return "unavailable"

    return price_data.get("trend", "insufficient_data")


def _research_assessment(price_data, news_data):
    """Produce a transparent, rule-based research assessment."""
    trend = _technical_outlook(price_data)

    sentiment = (
        news_data.get("overall_sentiment", "insufficient_data")
        if news_data else "insufficient_data"
    )

    if trend == "bullish" and sentiment == "positive":
        return "positive_alignment"

    if trend == "bearish" and sentiment == "negative":
        return "negative_alignment"

    if trend in ("bullish", "bearish") and sentiment in (
        "positive", "negative"
    ):
        return "mixed_signals"

    return "insufficient_or_mixed_evidence"


def analyze_investment(
    symbol: str,
    period: str = "1y",
    days: int = 7,
    report_id: str | None = None,
    include_report: bool = True,
    include_synthesis: bool = False,
) -> dict:
    """
    Coordinate independent research agents.

    Report analysis is optional because a report may not
    have been uploaded for the requested ticker.
    """
    ticker = validate_symbol(symbol)

    if period not in {"6mo", "1y", "2y", "5y"}:
        raise ValueError("Unsupported analysis period")

    if not 1 <= days <= 30:
        raise ValueError("News days must be between 1 and 30")

    tasks = {
        "price": (analyze_stock, (ticker, period), {}),
    }

    # Existing Finnhub integration excludes these exchanges.
    news_supported = not ticker.endswith((".NS", ".BO"))

    if news_supported:
        tasks["news"] = (analyze_news, (ticker, days), {})

    if include_report:
        tasks["report"] = (
            analyze_financial_report,
            (ticker, REPORT_QUESTION),
            {"report_id": report_id},
        )

    results = {}

    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {
            name: executor.submit(
                _run_agent, name, function, *args, **kwargs
            )
            for name, (function, args, kwargs) in tasks.items()
        }

        for name, future in futures.items():
            results[name] = future.result()

    if not news_supported:
        results["news"] = {
            "status": "unsupported",
            "data": None,
            "error": "News analysis does not support .NS or .BO tickers.",
        }

    if not include_report:
        results["report"] = {
            "status": "skipped",
            "data": None,
            "error": None,
        }

    # Normalize agent-specific empty-data responses.
    news_result = results["news"]
    if (
        news_result["status"] == "ok"
        and news_result["data"].get("status") == "no_news"
    ):
        news_result["status"] = "no_data"

    report_result = results["report"]
    if (
        report_result["status"] == "ok"
        and not report_result["data"].get("sources")
    ):
        report_result["status"] = "no_data"

    price_data = results["price"]["data"]
    news_data = results["news"]["data"]

    assessment = _research_assessment(price_data, news_data)
    if include_synthesis:
        synthesis = synthesize_research(
            symbol=ticker,
            agents=results,
            assessment=assessment,
        )
    else:
        synthesis = {
            "status": "skipped",
            "data": None,
            "error": None,
        }
    return {
        "symbol": ticker,
        "period": period,
        "news_days": days,
        "assessment": assessment,
        "technical_outlook": _technical_outlook(price_data),
        "news_sentiment": (
            news_data.get("overall_sentiment", "insufficient_data")
            if news_data else "insufficient_data"
        ),
        "agents": results,
        "synthesis": synthesis,
        "disclaimer": (
            "This is automated investment research, not personalized "
            "financial advice. Technical signals, news sentiment and "
            "report analysis may be incomplete, delayed or inaccurate."
        ),
    }
