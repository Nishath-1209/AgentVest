
"""Phase 7: Multi-Agent Investment Advisor API with Gemini Synthesis."""

from fastapi import APIRouter, HTTPException, Query
from starlette.concurrency import run_in_threadpool

from app.agents.investment_advisor import analyze_investment


router = APIRouter(
    prefix="/api/v1/advisor",
    tags=["Investment Advisor"],
)


@router.get("/{symbol}")
async def get_investment_analysis(
    symbol: str,
    period: str = Query(
        default="1y",
        pattern="^(6mo|1y|2y|5y)$",
    ),
    days: int = Query(
        default=7,
        ge=1,
        le=30,
    ),
    report_id: str | None = Query(default=None),
    include_report: bool = Query(default=True),
    include_synthesis: bool = Query(default=False),
):
    """
    Run the AgentVest multi-agent investment research pipeline.

    Phase 3: Stock Price Analysis
    Phase 4: Financial News Sentiment Analysis
    Phase 5: Financial Report RAG Analysis
    Phase 6: Multi-Agent Research Orchestration
    Phase 7: Gemini-Powered Research Synthesis

    Synthesis is optional to preserve existing API behavior.
    """

    try:
        return await run_in_threadpool(
            analyze_investment,
            symbol=symbol,
            period=period,
            days=days,
            report_id=report_id,
            include_report=include_report,
            include_synthesis=include_synthesis,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc
