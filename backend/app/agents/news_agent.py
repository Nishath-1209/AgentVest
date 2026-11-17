"""FinBERT inference and aggregate article sentiment."""
from functools import lru_cache
from app.services.news_data import fetch_company_news

@lru_cache(maxsize=1)
def load_classifier():
    from transformers import pipeline
    return pipeline("text-classification", model="ProsusAI/finbert", device=-1)


def analyze_news(symbol: str, days: int = 7):
    articles = fetch_company_news(symbol, days)
    if not articles:
        return {"symbol": symbol, "days": days, "status": "no_news", "count": 0,
                "overall_sentiment": "insufficient_data", "sentiment_score": None,
                "distribution": {"positive": 0, "negative": 0, "neutral": 0}, "articles": []}
    classifier = load_classifier()
    texts = [(a["headline"] + ". " + a["summary"])[:1000] for a in articles]
    predictions = classifier(texts, truncation=True, max_length=512, batch_size=8)
    counts = {"positive": 0, "negative": 0, "neutral": 0}
    for article, pred in zip(articles, predictions):
        label = pred["label"].lower()
        if label not in counts:
            raise ValueError("Unexpected FinBERT label")
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
