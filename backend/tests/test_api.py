import numpy as np
import pandas as pd
from fastapi.testclient import TestClient
from app.main import app
from app.agents.price_agent import analyze_frame, calculate_indicators
from app.services.market_data import MarketDataError

client = TestClient(app)

def sample_history(n=100):
    index = pd.bdate_range("2025-01-01", periods=n)
    close = np.linspace(100, 140, n)
    return pd.DataFrame({"Open": close - 0.5, "High": close + 1,
                         "Low": close - 1, "Close": close,
                         "Volume": np.full(n, 100000)}, index=index)

def test_health():
    assert client.get("/health").json()["status"] == "ok"

def test_indicators():
    df = calculate_indicators(sample_history())
    assert pd.isna(df["SMA20"].iloc[18])
    assert df["SMA20"].iloc[19] > 0
    assert 0 <= df["RSI14"].iloc[-1] <= 100
    assert df["BBUpper"].iloc[-1] >= df["BBLower"].iloc[-1]

def test_analysis_shape():
    result = analyze_frame("TEST", "1y", sample_history())
    assert result["symbol"] == "TEST"
    assert len(result["history"]) == 100
    assert result["price"] == 140
    assert result["trend"] in {"bullish", "bearish", "mixed", "insufficient_data"}

def test_api_mocked(monkeypatch):
    from app.api.routes import stocks
    monkeypatch.setattr(stocks, "analyze_stock", lambda symbol, period: {"symbol": symbol, "period": period, "price": 123})
    response = client.get("/api/v1/stocks/AAPL?period=1y")
    assert response.status_code == 200
    assert response.json()["price"] == 123

def test_invalid_symbol():
    assert client.get("/api/v1/stocks/invalid%20ticker").status_code == 422

def test_invalid_period():
    assert client.get("/api/v1/stocks/AAPL?period=bad").status_code == 422

def test_provider_failure(monkeypatch):
    from app.api.routes import stocks
    def fail(symbol, period):
        raise MarketDataError("Provider unavailable")
    monkeypatch.setattr(stocks, "analyze_stock", fail)
    assert client.get("/api/v1/stocks/AAPL").status_code == 503

def test_system_status():
    res = client.get("/api/v1/system/status")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "services" in data
    assert "yfinance" in data["services"]
    assert "finnhub" in data["services"]
    assert "finbert" in data["services"]
    assert "astra_db" in data["services"]
    assert "gemini" in data["services"]
    assert "sqlite" in data["services"]
    # Verify no raw secrets are leaked
    raw_text = res.text
    assert "AstraCS:" not in raw_text
    assert "AIza" not in raw_text

def test_cors_preflight_for_vercel():
    """Verify that OPTIONS preflight requests from deployed Vercel frontend succeed."""
    headers = {
        "Origin": "https://agent-vest.vercel.app",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "authorization,content-type",
    }
    res = client.options("/health", headers=headers)
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "https://agent-vest.vercel.app"

def test_health_fast_without_ml():
    """Verify that /health responds immediately with status ok."""
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

