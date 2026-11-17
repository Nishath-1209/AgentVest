"""Finnhub company-news provider. Never expose API credentials in responses."""
from datetime import datetime, timedelta, timezone
import requests
from app.core.config import settings

class NewsProviderError(Exception):
    pass


def fetch_company_news(symbol: str, days: int = 7):
    if not settings.finnhub_api_key:
        raise NewsProviderError("FINNHUB_API_KEY is missing in backend/.env")
    end = datetime.now(timezone.utc).date()
    start = end - timedelta(days=days)
    try:
        response = requests.get(
            "https://finnhub.io/api/v1/company-news",
            params={"symbol": symbol, "from": start.isoformat(), "to": end.isoformat()},
            headers={"X-Finnhub-Token": settings.finnhub_api_key},
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()
    except (requests.RequestException, ValueError) as exc:
        raise NewsProviderError("Finnhub request failed; check key, limits and connectivity") from exc
    if not isinstance(data, list):
        raise NewsProviderError("Finnhub returned an unexpected response")
    unique = set()
    articles = []
    for item in sorted(data, key=lambda x: x.get("datetime", 0), reverse=True):
        headline = str(item.get("headline") or "").strip()
        url = str(item.get("url") or "").strip()
        if not headline or not url.startswith("https://"):
            continue
        key = (headline.casefold(), url)
        if key in unique:
            continue
        unique.add(key)
        articles.append({
            "headline": headline,
            "summary": str(item.get("summary") or "")[:1200],
            "source": str(item.get("source") or "Unknown"),
            "url": url,
            "published_at": datetime.fromtimestamp(int(item.get("datetime") or 0), timezone.utc).isoformat(),
        })
        if len(articles) >= 15:
            break
    return articles
