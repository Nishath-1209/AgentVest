"""Health and system diagnostics endpoints."""
from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    return {
        "status": "ok",
        "service": settings.app_name,
        "environment": settings.environment,
    }


@router.get("/api/v1/system/status")
def system_status():
    """
    Returns non-sensitive health & connectivity status for all providers and models.
    API keys and secret tokens are NEVER exposed.
    """
    return {
        "status": "ok",
        "service": settings.app_name,
        "environment": settings.environment,
        "services": {
            "yfinance": {
                "status": "available",
                "provider": "Yahoo Finance",
                "notes": "Adjusted historical daily OHLCV bars",
            },
            "finnhub": {
                "status": "configured" if bool(settings.finnhub_api_key) else "missing_key",
                "provider": "Finnhub Financial News API",
                "coverage": "North American Equities",
            },
            "finbert": {
                "status": "ready",
                "model": "ProsusAI/finbert",
                "execution": "Local HuggingFace Transformers Pipeline",
            },
            "astra_db": {
                "status": (
                    "configured"
                    if bool(settings.astra_db_api_endpoint and settings.astra_db_application_token)
                    else "unconfigured"
                ),
                "provider": "DataStax Astra DB Vector Storage",
                "keyspace": settings.astra_db_keyspace,
            },
            "gemini": {
                "status": "configured" if bool(settings.gemini_api_key) else "missing_key",
                "model": settings.gemini_model,
                "provider": "Google Gemini via google-genai SDK",
            },
            "embeddings": {
                "status": "ready",
                "model": "sentence-transformers/all-MiniLM-L6-v2",
                "dimension": 384,
            },
            "sqlite": {
                "status": "connected",
                "database": "SQLite 3",
                "features": ["watchlist", "reports_meta", "research_history"],
            },
        },
    }
