import math
import numpy as np
import pandas as pd
from app.services.market_data import get_history, validate_symbol


def safe_number(value, digits=4):
    if value is None or pd.isna(value):
        return None
    number = float(value)
    return round(number, digits) if math.isfinite(number) else None


def calculate_indicators(frame: pd.DataFrame) -> pd.DataFrame:
    df = frame.copy().sort_index()
    close = df["Close"].astype(float)
    df["SMA20"] = close.rolling(20, min_periods=20).mean()
    df["SMA50"] = close.rolling(50, min_periods=50).mean()
    df["EMA20"] = close.ewm(span=20, adjust=False).mean()

    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = (-delta.clip(upper=0))
    # Wilder smoothing, seeded with the first 14-period arithmetic mean.
    avg_gain = pd.Series(np.nan, index=df.index, dtype=float)
    avg_loss = pd.Series(np.nan, index=df.index, dtype=float)
    if len(df) > 14:
        avg_gain.iloc[14] = gain.iloc[1:15].mean()
        avg_loss.iloc[14] = loss.iloc[1:15].mean()
        for i in range(15, len(df)):
            avg_gain.iloc[i] = (avg_gain.iloc[i - 1] * 13 + gain.iloc[i]) / 14
            avg_loss.iloc[i] = (avg_loss.iloc[i - 1] * 13 + loss.iloc[i]) / 14
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - 100 / (1 + rs)
    rsi = rsi.mask((avg_loss == 0) & (avg_gain > 0), 100)
    rsi = rsi.mask((avg_loss == 0) & (avg_gain == 0), 50)
    df["RSI14"] = rsi

    ema12 = close.ewm(span=12, adjust=False).mean()
    ema26 = close.ewm(span=26, adjust=False).mean()
    df["MACD"] = ema12 - ema26
    df["MACDSignal"] = df["MACD"].ewm(span=9, adjust=False).mean()
    df["MACDHistogram"] = df["MACD"] - df["MACDSignal"]
    std20 = close.rolling(20, min_periods=20).std(ddof=0)
    df["BBUpper"] = df["SMA20"] + 2 * std20
    df["BBLower"] = df["SMA20"] - 2 * std20
    df["DailyReturn"] = close.pct_change(fill_method=None)
    return df


def analyze_frame(symbol: str, period: str, frame: pd.DataFrame) -> dict:
    df = calculate_indicators(frame)
    last = df.iloc[-1]
    previous = df.iloc[-2]
    close = float(last["Close"])
    change = close - float(previous["Close"])
    daily_return = df["DailyReturn"].dropna()
    annual_volatility = daily_return.std(ddof=1) * np.sqrt(252) * 100 if len(daily_return) > 1 else np.nan
    period_return = (close / float(df.iloc[0]["Close"]) - 1) * 100
    sma50 = safe_number(last["SMA50"])
    sma20 = safe_number(last["SMA20"])
    rsi = safe_number(last["RSI14"])
    macd = safe_number(last["MACD"])
    signal = safe_number(last["MACDSignal"])

    signals = []
    if sma50 is not None:
        signals.append("Price is above the 50-day average" if close > sma50 else "Price is below the 50-day average")
    if rsi is not None:
        signals.append("RSI is above 70 (strong momentum; potentially overbought)" if rsi > 70 else "RSI is below 30 (weak momentum; potentially oversold)" if rsi < 30 else "RSI is in the 30–70 range")
    if macd is not None and signal is not None:
        signals.append("MACD is above its signal line" if macd > signal else "MACD is below its signal line")
    trend = "insufficient_data" if sma50 is None else "bullish" if close > sma50 and macd is not None and macd > signal else "bearish" if close < sma50 and macd is not None and macd < signal else "mixed"

    points = []
    for idx, row in df.iterrows():
        points.append({
            "date": idx.strftime("%Y-%m-%d"),
            "open": safe_number(row["Open"]), "high": safe_number(row["High"]),
            "low": safe_number(row["Low"]), "close": safe_number(row["Close"]),
            "volume": int(row["Volume"]) if pd.notna(row["Volume"]) else None,
            "sma20": safe_number(row["SMA20"]), "sma50": safe_number(row["SMA50"]),
            "ema20": safe_number(row["EMA20"]), "rsi14": safe_number(row["RSI14"]),
            "macd": safe_number(row["MACD"]), "macd_signal": safe_number(row["MACDSignal"]),
            "macd_histogram": safe_number(row["MACDHistogram"]),
            "bb_upper": safe_number(row["BBUpper"]), "bb_lower": safe_number(row["BBLower"])
        })
    return {
        "symbol": symbol, "period": period,
        "as_of": df.index[-1].strftime("%Y-%m-%d"),
        "currency": "unknown",  # yfinance history does not reliably supply currency metadata
        "price": safe_number(close), "change": safe_number(change),
        "change_percent": safe_number(change / float(previous["Close"]) * 100),
        "period_return_percent": safe_number(period_return),
        "annualized_volatility_percent": safe_number(annual_volatility),
        "indicators": {"sma20": sma20, "sma50": sma50, "ema20": safe_number(last["EMA20"]),
                       "rsi14": rsi, "macd": macd, "macd_signal": signal,
                       "macd_histogram": safe_number(last["MACDHistogram"]),
                       "bb_upper": safe_number(last["BBUpper"]), "bb_lower": safe_number(last["BBLower"])},
        "trend": trend, "summary": signals,
        "history": points,
        "disclaimer": "Historical technical research only; not personalized investment advice. Prices may be delayed or revised."
    }


def analyze_stock(symbol: str, period: str = "1y") -> dict:
    normalized = validate_symbol(symbol)
    return analyze_frame(normalized, period, get_history(normalized, period))
