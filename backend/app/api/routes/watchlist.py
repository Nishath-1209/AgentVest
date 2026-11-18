"""
Watchlist API routes backed by SQLite.
Supports adding, removing, and listing saved stock tickers.
"""

import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.db.database import (
    get_watchlist_symbols,
    add_watchlist_symbol,
    remove_watchlist_symbol,
)
from app.services.market_data import SYMBOL_PATTERN

router = APIRouter(
    prefix="/api/v1/watchlist",
    tags=["Watchlist"],
)


class WatchlistRequest(BaseModel):
    symbol: str = Field(min_length=1, max_length=20)


@router.get("")
@router.get("/")
def get_watchlist():
    """Retrieve all symbols currently saved in the watchlist."""
    symbols = get_watchlist_symbols()
    return {"watchlist": symbols, "count": len(symbols)}


@router.post("")
@router.post("/")
def add_to_watchlist(request: WatchlistRequest):
    """Add a validated stock symbol to the watchlist."""
    symbol = request.symbol.strip().upper()
    if not SYMBOL_PATTERN.fullmatch(symbol):
        raise HTTPException(
            status_code=422,
            detail="Invalid ticker symbol. Example: AAPL or RELIANCE.NS",
        )

    updated = add_watchlist_symbol(symbol)
    return {
        "status": "ok",
        "symbol": symbol,
        "watchlist": updated,
        "count": len(updated),
    }


@router.delete("/{symbol}")
def remove_from_watchlist(symbol: str):
    """Remove a stock symbol from the watchlist."""
    symbol = symbol.strip().upper()
    updated = remove_watchlist_symbol(symbol)
    return {
        "status": "ok",
        "symbol": symbol,
        "watchlist": updated,
        "count": len(updated),
    }
