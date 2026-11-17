import re
import pandas as pd
import yfinance as yf

SYMBOL_PATTERN = re.compile(r"[A-Z0-9^][A-Z0-9.^-]{0,19}")

class MarketDataError(Exception):
    pass

def validate_symbol(symbol: str) -> str:
    symbol = symbol.strip().upper()
    if not SYMBOL_PATTERN.fullmatch(symbol):
        raise ValueError("Invalid ticker symbol. Example: AAPL or RELIANCE.NS")
    return symbol

def get_history(symbol: str, period: str = "1y") -> pd.DataFrame:
    if period not in {"6mo", "1y", "2y", "5y"}:
        raise ValueError("Period must be one of: 6mo, 1y, 2y, 5y")
    try:
        frame = yf.Ticker(symbol).history(period=period, interval="1d", auto_adjust=True)
    except Exception as exc:
        raise MarketDataError("Market data provider unavailable; please retry later") from exc
    if frame is None or frame.empty:
        raise MarketDataError(f"No historical price data found for {symbol}")
    required = {"Open", "High", "Low", "Close", "Volume"}
    if not required.issubset(frame.columns):
        raise MarketDataError("Market data is missing required OHLCV columns")
    frame = frame.sort_index().copy()
    frame = frame.dropna(subset=["Close"])
    if len(frame) < 35:
        raise MarketDataError("Insufficient historical data (minimum 35 trading days)")
    return frame
