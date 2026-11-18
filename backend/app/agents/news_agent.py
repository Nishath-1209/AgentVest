"""FinBERT inference and aggregate article sentiment."""
from functools import lru_cache
import os
import requests
from app.services.news_data import fetch_company_news
from app.core.config import settings

@lru_cache(maxsize=1)
def load_classifier():
    import torch
    from transformers import pipeline
    torch.set_num_threads(1)
    return pipeline("text-classification", model="ProsusAI/finbert", device=-1)


def query_hf_finbert(texts: list[str]) -> list[dict] | None:
    """
    Remote serverless FinBERT inference on Hugging Face (0 MB local RAM on Render Free).
    Maintains 100% identical ProsusAI/finbert model classification.
    """
    token = settings.hf_token or os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACE_API_KEY")
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    url = "https://api-inference.huggingface.co/models/ProsusAI/finbert"
    try:
        resp = requests.post(
            url,
            headers=headers,
            json={"inputs": texts, "options": {"wait_for_model": True}},
            timeout=12,
        )
        if resp.status_code == 200:
            data = resp.json()
            results = []
            if isinstance(data, list):
                for item in data:
                    if isinstance(item, list) and item:
                        best = max(item, key=lambda x: x.get("score", 0))
                        results.append({"label": best["label"].lower(), "score": float(best["score"])})
                    elif isinstance(item, dict) and "label" in item:
                        results.append({"label": item["label"].lower(), "score": float(item["score"])})
            if len(results) == len(texts):
                return results
    except Exception:
        pass
    return None


def analyze_news(symbol: str, days: int = 7):
    articles = fetch_company_news(symbol, days)
    if not articles:
        return {"symbol": symbol, "days": days, "status": "no_news", "count": 0,
                "overall_sentiment": "insufficient_data", "sentiment_score": None,
                "distribution": {"positive": 0, "negative": 0, "neutral": 0}, "articles": []}

    texts = [(a["headline"] + ". " + a["summary"])[:1000] for a in articles]

    # Attempt remote serverless FinBERT inference first (preserves 512 MB RAM ceiling)
    predictions = query_hf_finbert(texts)

    # Fall back to local FinBERT pipeline if remote is not configured or unavailable
    if not predictions:
        classifier = load_classifier()
        import torch
        with torch.no_grad():
            raw_preds = classifier(texts, truncation=True, max_length=512, batch_size=2)
        predictions = [{"label": p["label"].lower(), "score": float(p["score"])} for p in raw_preds]

    counts = {"positive": 0, "negative": 0, "neutral": 0}
    for article, pred in zip(articles, predictions):
        label = pred["label"].lower()
        if label not in counts:
            label = "neutral"
        confidence = float(pred["score"])
        counts[label] += 1
        article["sentiment"] = label
        article["confidence"] = round(confidence, 4)
    n = len(articles)
    score = (counts["positive"] - counts["negative"]) / n
    overall = "positive" if score > 0.2 else "negative" if score < -0.2 else "neutral"
    return {"symbol": symbol, "days": days, "status": "ok", "count": n,
            "overall_sentiment": overall, "sentiment_score": round(score, 3),
            "distribution": counts, "articles": articles}

