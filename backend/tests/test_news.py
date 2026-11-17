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
