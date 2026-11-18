import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Newspaper,
  Search,
  ExternalLink,
  PieChart as PieIcon,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Info,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { api } from "../services/api";
import StatusBadge from "../components/common/StatusBadge";
import MetricCard from "../components/common/MetricCard";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import ErrorAlert from "../components/common/ErrorAlert";

const COLORS = {
  positive: "#68e0bc",
  negative: "#ff9090",
  neutral: "#ffca74",
};

export default function NewsIntelligencePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTicker = searchParams.get("ticker") || "AAPL";
  const [ticker, setTicker] = useState(initialTicker);
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchNews = async (symbolToFetch, daysToFetch) => {
    const symbol = (symbolToFetch || ticker).trim().toUpperCase();
    if (!symbol) return;

    if (symbol.endsWith(".NS") || symbol.endsWith(".BO")) {
      setError(
        "Finnhub company news provider focuses on North American equities (e.g. AAPL, MSFT, NVDA). Indian exchange tickers (.NS, .BO) are not currently supported by Finnhub."
      );
      setData(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.getNews(symbol, daysToFetch || days);
      setData(res);
      setSearchParams({ ticker: symbol });
    } catch (err) {
      setError(err.message || "Failed to load financial news");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const paramTicker = searchParams.get("ticker");
    if (paramTicker && paramTicker !== ticker) {
      setTicker(paramTicker);
      fetchNews(paramTicker, days);
    } else if (!data) {
      fetchNews(ticker, days);
    }
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchNews(ticker, days);
  };

  const handleDaysChange = (newDays) => {
    setDays(newDays);
    if (ticker) {
      fetchNews(ticker, newDays);
    }
  };

  const pieData = data?.distribution
    ? Object.entries(data.distribution).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        key: name,
      }))
    : [];

  return (
    <div className="page-news">
      {/* Controls Bar */}
      <section className="search-controls-card">
        <form onSubmit={handleSubmit} className="stock-search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="Enter US ticker (e.g. AAPL, MSFT, TSLA)..."
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Analyzing..." : "Fetch News"}
          </button>
        </form>

        <div className="period-selector-group">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              type="button"
              className={`period-btn ${days === d ? "active" : ""}`}
              onClick={() => handleDaysChange(d)}
            >
              {d} Days Lookback
            </button>
          ))}
        </div>
      </section>

      {error && (
        <ErrorAlert message={error} onRetry={() => fetchNews(ticker, days)} />
      )}

      {loading && (
        <div className="loading-state-block">
          <LoadingSkeleton type="metrics" />
          <p className="loading-helper-text">
            Fetching headlines and running FinBERT neural inference...
          </p>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Header */}
          <div className="stock-view-header">
            <div>
              <span className="stock-view-eyebrow">FINANCIAL NEWS INTELLIGENCE</span>
              <h1 className="stock-view-symbol">
                {data.symbol}{" "}
                <span className="stock-view-date">· Past {data.days} Days</span>
              </h1>
            </div>
            <StatusBadge
              status={data.overall_sentiment}
              label={`Overall: ${data.overall_sentiment}`}
            />
          </div>

          <div className="disclaimer-callout">
            <Info size={16} />
            <span>
              Sentiment is classified using ProsusAI/FinBERT locally. Model confidence reflects classification certainty on text semantics, not future market direction.
            </span>
          </div>

          {/* Metrics */}
          <div className="metrics-grid">
            <MetricCard
              title="Overall Sentiment"
              value={data.overall_sentiment.toUpperCase()}
              subtext="Aggregate FinBERT evaluation"
              icon={Newspaper}
            />
            <MetricCard
              title="Headlines Analyzed"
              value={data.count}
              subtext={`Filtered for ${data.symbol} relevance`}
            />
            <MetricCard
              title="Sentiment Score"
              value={data.sentiment_score == null ? "N/A" : data.sentiment_score.toFixed(2)}
              subtext="(Positive - Negative) / Total"
            />
          </div>

          {/* Sentiment Distribution and Breakdown */}
          {data.count > 0 && (
            <div className="news-intelligence-grid">
              {/* Pie Chart Card */}
              <div className="panel chart-panel">
                <h3>Sentiment Distribution</h3>
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={85}
                        innerRadius={45}
                        paddingAngle={4}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {pieData.map((entry) => (
                          <Cell
                            key={entry.key}
                            fill={COLORS[entry.key.toLowerCase()] || "#999"}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Counts Breakdown Card */}
              <div className="panel breakdown-card">
                <h3>Classification Breakdown</h3>
                <div className="sentiment-breakdown-bars">
                  {["positive", "neutral", "negative"].map((type) => {
                    const count = data.distribution?.[type] || 0;
                    const pct = data.count > 0 ? (count / data.count) * 100 : 0;
                    return (
                      <div key={type} className="breakdown-item">
                        <div className="breakdown-label-row">
                          <span className={`label-sentiment ${type}`}>
                            {type.toUpperCase()}
                          </span>
                          <span className="count-value">
                            {count} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="progress-bar-track">
                          <div
                            className={`progress-bar-fill ${type}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Articles Feed */}
          <section className="news-articles-section">
            <h3 className="section-title">Analyzed Headlines & Excerpts</h3>
            {data.articles?.length === 0 ? (
              <p className="empty-subtle-text">
                No articles were found matching the relevance criteria for {data.symbol} in this period.
              </p>
            ) : (
              <div className="news-feed-list">
                {data.articles.map((item, idx) => (
                  <article key={`${item.url}-${idx}`} className="news-feed-card">
                    <div className="news-card-meta">
                      <span className="news-source-tag">
                        {item.source} · {new Date(item.published_at).toLocaleDateString()}
                      </span>
                      <span className={`sentiment-pill ${item.sentiment}`}>
                        {item.sentiment} ({Math.round((item.confidence || 0) * 100)}%)
                      </span>
                    </div>
                    <h4 className="news-card-headline">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="external-news-link"
                      >
                        <span>{item.headline}</span>
                        <ExternalLink size={14} />
                      </a>
                    </h4>
                    {item.summary && (
                      <p className="news-card-summary">{item.summary}</p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
