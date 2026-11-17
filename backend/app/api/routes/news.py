import re
from fastapi import APIRouter, HTTPException, Query
from starlette.concurrency import run_in_threadpool
from app.agents.news_agent import analyze_news
from app.services.news_data import NewsProviderError

router = APIRouter(prefix="/api/v1/news", tags=["News Intelligence"])

@router.get("/{symbol}")
async def get_news(symbol: str, days: int = Query(default=7, ge=1, le=30)):
    symbol = symbol.upper().strip()
    if not re.fullmatch(r"[A-Z0-9^][A-Z0-9.^-]{0,19}", symbol):
        raise HTTPException(status_code=422, detail="Invalid ticker")
    if symbol.endswith(".NS") or symbol.endswith(".BO"):
        raise HTTPException(status_code=422, detail="Finnhub company-news supports North American companies; try AAPL or MSFT")
    try:
        return await run_in_threadpool(analyze_news, symbol, days)
    except NewsProviderError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=503, detail="News sentiment service unavailable; check model download and backend logs") from exc
