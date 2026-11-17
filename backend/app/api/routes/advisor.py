
"""Phase 6: Multi-Agent Investment Advisor API."""

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
    days: int = Query(default=7, ge=1, le=30),
    report_id: str | None = Query(default=None),
    include_report: bool = Query(default=True),
):
    """Run the Price, News and Report Agents."""

    try:
        return await run_in_threadpool(
            analyze_investment,
            symbol=symbol,
            period=period,
            days=days,
            report_id=report_id,
            include_report=include_report,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc
