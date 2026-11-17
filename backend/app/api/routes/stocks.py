from fastapi import APIRouter, HTTPException, Query
from app.agents.price_agent import analyze_stock
from app.services.market_data import MarketDataError

router = APIRouter(prefix="/api/v1/stocks", tags=["stocks"])

@router.get("/{symbol}")
def stock_analysis(symbol: str, period: str = Query(default="1y", pattern="^(6mo|1y|2y|5y)$")):
    try:
        return analyze_stock(symbol, period)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except MarketDataError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
