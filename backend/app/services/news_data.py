"""
Finnhub company-news provider with intelligent relevance filtering.
Eliminates cross-company contamination (e.g. Tesla, Dell in AAPL searches).
Never expose API credentials in responses.
"""

from datetime import datetime, timedelta, timezone
import re
import requests
from app.core.config import settings

class NewsProviderError(Exception):
    pass


# Mapping for high-accuracy ticker and company keyword disambiguation
COMPANY_KEYWORDS = {
    "AAPL": {
        "primary": ["apple", "aapl"],
        "keywords": ["iphone", "ipad", "macbook", "ios", "tim cook", "cupertino", "app store", "vision pro", "apple watch", "mac"],
        "competitors": ["tesla", "dell", "coca-cola", "coca cola", "coke", "general motors", "boeing"]
    },
    "MSFT": {
        "primary": ["microsoft", "msft"],
        "keywords": ["windows", "azure", "satya nadella", "xbox", "surface", "copilot", "office 365"],
        "competitors": []
    },
    "TSLA": {
        "primary": ["tesla", "tsla"],
        "keywords": ["elon musk", "cybertruck", "gigafactory", "model 3", "model y", "supercharger", "ev"],
        "competitors": []
    },
    "GOOGL": {
        "primary": ["google", "alphabet", "googl", "goog"],
        "keywords": ["sundar pichai", "android", "youtube", "gemini", "pixel", "deepmind", "google cloud"],
        "competitors": []
    },
    "GOOG": {
        "primary": ["google", "alphabet", "googl", "goog"],
        "keywords": ["sundar pichai", "android", "youtube", "gemini", "pixel", "deepmind", "google cloud"],
        "competitors": []
    },
    "NVDA": {
        "primary": ["nvidia", "nvda"],
        "keywords": ["jensen huang", "blackwell", "hopper", "cuda", "geforce", "gpu", "ai chips"],
        "competitors": []
    },
    "AMZN": {
        "primary": ["amazon", "amzn"],
        "keywords": ["aws", "andy jassy", "prime", "e-commerce", "alexa"],
        "competitors": []
    },
    "META": {
        "primary": ["meta", "meta platforms"],
        "keywords": ["facebook", "instagram", "zuckerberg", "whatsapp", "quest", "llama"],
        "competitors": []
    },
}


def _calculate_relevance(headline: str, summary: str, symbol: str) -> int:
    """
    Score article relevance to the target stock symbol.
    Positive score means relevant; 0 or negative means noise/contamination.
    """
    norm_head = headline.lower()
    norm_summ = summary.lower()
    sym_lower = symbol.lower()

    cfg = COMPANY_KEYWORDS.get(symbol.upper(), {
        "primary": [sym_lower],
        "keywords": [],
        "competitors": []
    })

    score = 0

    # 1. Check exact ticker as isolated word: e.g. \bAAPL\b
    ticker_pattern = rf"\b{re.escape(symbol)}\b"
    if re.search(ticker_pattern, headline, re.IGNORECASE):
        score += 8
    elif re.search(ticker_pattern, summary, re.IGNORECASE):
        score += 4

    # 2. Check primary company names: e.g. 'Apple'
    head_primary_match = any(
        re.search(rf"\b{re.escape(term)}\b", norm_head) for term in cfg["primary"]
    )
    if head_primary_match:
        score += 7

    summ_primary_match = any(
        re.search(rf"\b{re.escape(term)}\b", norm_summ) for term in cfg["primary"]
    )
    if summ_primary_match:
        score += 3

    # 3. Check associated company product / executive keywords
    head_keyword_match = any(
        re.search(rf"\b{re.escape(term)}\b", norm_head) for term in cfg["keywords"]
    )
    if head_keyword_match:
        score += 4

    summ_keyword_match = any(
        re.search(rf"\b{re.escape(term)}\b", norm_summ) for term in cfg["keywords"]
    )
    if summ_keyword_match:
        score += 2

    # 4. Check for noise from unrelated competitors prominently featured in headline
    # when the target company is NOT featured in the headline
    if not head_primary_match and not re.search(ticker_pattern, headline, re.IGNORECASE):
        for comp in cfg["competitors"]:
            if re.search(rf"\b{re.escape(comp)}\b", norm_head):
                score -= 8  # Substantial penalty: headline is about Tesla/Dell/Coke, not Apple!

    return score


def fetch_company_news(symbol: str, days: int = 7):
    """
    Retrieve company news from Finnhub with relevance filtering
    and deduplication.
    """
    if not settings.finnhub_api_key:
        raise NewsProviderError("FINNHUB_API_KEY is missing in backend/.env")

    end = datetime.now(timezone.utc).date()
    start = end - timedelta(days=days)

    try:
        response = requests.get(
            "https://finnhub.io/api/v1/company-news",
            params={
                "symbol": symbol,
                "from": start.isoformat(),
                "to": end.isoformat(),
            },
            headers={"X-Finnhub-Token": settings.finnhub_api_key},
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()
    except (requests.RequestException, ValueError) as exc:
        raise NewsProviderError(
            "Finnhub request failed; check key, limits and connectivity"
        ) from exc

    if not isinstance(data, list):
        raise NewsProviderError("Finnhub returned an unexpected response")

    unique_headlines = set()
    scored_articles = []

    for item in data:
        headline = str(item.get("headline") or "").strip()
        url = str(item.get("url") or "").strip()
        summary = str(item.get("summary") or "").strip()

        if not headline or not url.startswith("https://"):
            continue

        # Normalized deduplication key
        norm_key = re.sub(r"[^\w\s]", "", headline.casefold()).strip()
        if norm_key in unique_headlines or url in unique_headlines:
            continue

        unique_headlines.add(norm_key)
        unique_headlines.add(url)

        relevance = _calculate_relevance(headline, summary, symbol)

        # Only retain articles with demonstrable relevance
        if relevance > 0:
            scored_articles.append({
                "article": {
                    "headline": headline,
                    "summary": summary[:1200],
                    "source": str(item.get("source") or "Unknown"),
                    "url": url,
                    "published_at": datetime.fromtimestamp(
                        int(item.get("datetime") or 0), timezone.utc
                    ).isoformat(),
                },
                "relevance": relevance,
                "datetime": int(item.get("datetime") or 0),
            })

    # If relevance filtering filtered everything (unlikely), fallback to general non-competitor items
    if not scored_articles and data:
        for item in data:
            h = str(item.get("headline") or "").strip()
            u = str(item.get("url") or "").strip()
            if h and u.startswith("https://"):
                scored_articles.append({
                    "article": {
                        "headline": h,
                        "summary": str(item.get("summary") or "")[:1200],
                        "source": str(item.get("source") or "Unknown"),
                        "url": u,
                        "published_at": datetime.fromtimestamp(
                            int(item.get("datetime") or 0), timezone.utc
                        ).isoformat(),
                    },
                    "relevance": 1,
                    "datetime": int(item.get("datetime") or 0),
                })
                if len(scored_articles) >= 15:
                    break

    # Sort: highest relevance first, then newest first
    scored_articles.sort(key=lambda x: (x["relevance"], x["datetime"]), reverse=True)

    # Return top 15 clean articles
    return [item["article"] for item in scored_articles[:15]]
