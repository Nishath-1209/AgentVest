from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.agents.news_agent import analyze_news
from app.services.news_data import NewsProviderError

client = TestClient(app)
SAMPLE = [{"headline": "Company beats estimates", "summary": "Revenue rises", "source": "Example", "url": "https://example.com/a", "published_at": "2026-11-17T00:00:00+00:00"},
          {"headline": "Company misses guidance", "summary": "Revenue falls", "source": "Example", "url": "https://example.com/b", "published_at": "2026-11-16T00:00:00+00:00"}]

def fake_classifier(texts, **kwargs):
    return [{"label": "positive", "score": 0.91}, {"label": "negative", "score": 0.88}]

def test_sentiment_aggregation():
    with patch('app.agents.news_agent.fetch_company_news', return_value=[x.copy() for x in SAMPLE]), patch('app.agents.news_agent.load_classifier', return_value=fake_classifier):
        result = analyze_news('AAPL')
    assert result['count'] == 2
    assert result['distribution'] == {'positive': 1, 'negative': 1, 'neutral': 0}
    assert result['overall_sentiment'] == 'neutral'
    assert result['sentiment_score'] == 0

def test_empty_news():
    with patch('app.agents.news_agent.fetch_company_news', return_value=[]):
        assert analyze_news('AAPL')['status'] == 'no_news'

def test_news_route_mock():
    with patch('app.api.routes.news.analyze_news', return_value={'symbol': 'AAPL', 'count': 0}):
        response = client.get('/api/v1/news/AAPL')
    assert response.status_code == 200 and response.json()['symbol'] == 'AAPL'

def test_invalid_symbol():
    assert client.get('/api/v1/news/invalid%20ticker').status_code == 422

def test_indian_symbol_not_supported():
    assert client.get('/api/v1/news/RELIANCE.NS').status_code == 422

def test_invalid_days():
    assert client.get('/api/v1/news/AAPL?days=99').status_code == 422

def test_provider_failure():
    with patch('app.api.routes.news.analyze_news', side_effect=NewsProviderError('Provider unavailable')):
        assert client.get('/api/v1/news/AAPL').status_code == 503

def test_relevance_filtering_aapl():
    from app.services.news_data import _calculate_relevance, fetch_company_news
    # Apple articles should have high positive relevance
    assert _calculate_relevance("Apple reports record iPhone sales", "Revenue jumps 10%", "AAPL") > 0
    assert _calculate_relevance("Tim Cook outlines AI strategy in Cupertino", "New Apple Intelligence features", "AAPL") > 0
    assert _calculate_relevance("AAPL shares reach new all-time high", "Strong quarterly performance", "AAPL") > 0

    # Unrelated articles featuring competitors without mentioning Apple in headline should be penalized/filtered
    assert _calculate_relevance("Tesla cuts Model Y prices in Europe", "Elon Musk comments on production", "AAPL") <= 0
    assert _calculate_relevance("Dell shares surge on AI server demand", "Michael Dell outlines growth", "AAPL") <= 0
    assert _calculate_relevance("Coca-Cola beats earnings estimates", "Beverage sales rise", "AAPL") <= 0

def test_fetch_company_news_filters_competitors(monkeypatch):
    from app.services import news_data
    monkeypatch.setattr(news_data.settings, "finnhub_api_key", "test_key")
    raw_finnhub = [
        {"headline": "Apple launches new iPhone with M4 chip", "summary": "Cupertino company updates lineup", "url": "https://example.com/apple1", "datetime": 1700000000},
        {"headline": "Tesla opens new Gigafactory in Germany", "summary": "Electric vehicles rollout continues", "url": "https://example.com/tesla1", "datetime": 1700000100},
        {"headline": "Dell expands enterprise server lineup", "summary": "Hardware manufacturer beats quarterly estimates", "url": "https://example.com/dell1", "datetime": 1700000200},
        {"headline": "Tech rally: Apple and Microsoft drive index higher", "summary": "Big tech gains momentum", "url": "https://example.com/market1", "datetime": 1700000300},
    ]

    class FakeResponse:
        def raise_for_status(self): pass
        def json(self): return raw_finnhub

    monkeypatch.setattr(news_data.requests, "get", lambda *args, **kwargs: FakeResponse())
    articles = news_data.fetch_company_news("AAPL")
    headlines = [a["headline"] for a in articles]

    assert "Apple launches new iPhone with M4 chip" in headlines
    assert "Tech rally: Apple and Microsoft drive index higher" in headlines
    assert "Tesla opens new Gigafactory in Germany" not in headlines
    assert "Dell expands enterprise server lineup" not in headlines

