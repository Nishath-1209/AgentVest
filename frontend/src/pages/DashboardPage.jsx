import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  TrendingUp,
  Newspaper,
  FileText,
  BrainCircuit,
  Search,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Bookmark,
  Activity,
  Layers,
  Clock,
  History,
  CheckCircle2,
  AlertTriangle,
  Info,
  Server,
  Database,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { api } from "../services/api";
import MetricCard from "../components/common/MetricCard";
import StatusBadge from "../components/common/StatusBadge";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import ErrorAlert from "../components/common/ErrorAlert";
import { useWatchlist } from "../context/WatchlistContext";

const fmt = (val, d = 2) =>
  val == null
    ? "N/A"
    : Number(val).toLocaleString(undefined, { maximumFractionDigits: d });

export default function DashboardPage() {
  const [ticker, setTicker] = useState("AAPL");
  const [stockData, setStockData] = useState(null);
  const [newsData, setNewsData] = useState(null);
  const [recentHistory, setRecentHistory] = useState([]);
  const [agentStatus, setAgentStatus] = useState({
    fastapi: "checking",
    priceAgent: "active",
    newsAgent: "ready",
    ragAgent: "configured",
    synthesisAgent: "gemini-3.5",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { watchlist } = useWatchlist();

  const fetchOverview = async (symbol) => {
    setLoading(true);
    setError("");
    try {
      const stockRes = await api.getStockAnalysis(symbol, "1y");
      setStockData(stockRes);

      // Attempt news fetch if supported (North American tickers)
      if (!symbol.endsWith(".NS") && !symbol.endsWith(".BO")) {
        try {
          const newsRes = await api.getNews(symbol, 7);
          setNewsData(newsRes);
        } catch {
          setNewsData(null);
        }
      } else {
        setNewsData(null);
      }
    } catch (err) {
      setError(err.message || "Failed to load stock overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview(ticker);
  }, [ticker]);

  // Load recent research history & system diagnostics
  useEffect(() => {
    let active = true;
    api
      .getHistory()
      .then((hist) => {
        if (active && Array.isArray(hist)) {
          setRecentHistory(hist.slice(0, 4));
        }
      })
      .catch(() => {});

    api
      .checkHealth()
      .then((h) => {
        if (active) {
          setAgentStatus((prev) => ({
            ...prev,
            fastapi: h?.status === "ok" ? "online" : "degraded",
          }));
        }
      })
      .catch(() => {
        if (active) {
          setAgentStatus((prev) => ({ ...prev, fastapi: "offline" }));
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const sym = ticker.trim().toUpperCase();
    if (sym) fetchOverview(sym);
  };

  const indicators = stockData?.indicators;
  const isIndianTicker = ticker.endsWith(".NS") || ticker.endsWith(".BO");

  return (
    <div className="page-dashboard">
      {/* Hero Welcome Banner */}
      <section className="dashboard-hero-card">
        <div className="hero-text-content">
          <div className="hero-eyebrow">
            <Sparkles size={15} />
            <span>AGENTVEST AI PLATFORM · COMPLETED MULTI-AGENT ARCHITECTURE</span>
          </div>
          <h1 className="hero-title">
            Intelligent Investment Research,{" "}
            <span className="accent-gradient">Grounded in Evidence</span>
          </h1>
          <p className="hero-description">
            Autonomous multi-agent orchestration combining quantitative price
            indicators, FinBERT financial news sentiment, and RAG-powered
            document intelligence synthesized by Google Gemini.
          </p>

          <div className="hero-actions-row">
            <Link to={`/advisor?ticker=${ticker}`} className="btn-primary-glow">
              <BrainCircuit size={18} />
              <span>Launch Advisor for {ticker}</span>
            </Link>
            <Link to={`/stocks?ticker=${ticker}`} className="btn-secondary-surface">
              <TrendingUp size={18} />
              <span>Inspect Technicals</span>
            </Link>
            <Link to={`/news?ticker=${ticker}`} className="btn-secondary-surface">
              <Newspaper size={18} />
              <span>Explore News</span>
            </Link>
          </div>
        </div>

        {/* Quick Ticker Switcher */}
        <div className="dashboard-ticker-selector">
          <form onSubmit={handleSearchSubmit} className="quick-symbol-search">
            <Search size={16} />
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="Change stock..."
              maxLength={15}
            />
            <button type="submit">Inspect</button>
          </form>
          <div className="symbol-chips">
            {["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "RELIANCE.NS"].map((sym) => (
              <button
                key={sym}
                type="button"
                className={`symbol-chip ${ticker === sym ? "active" : ""}`}
                onClick={() => setTicker(sym)}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Error state */}
      {error && <ErrorAlert message={error} onRetry={() => fetchOverview(ticker)} />}

      {/* Selected Stock KPI Section */}
      <section className="dashboard-section">
        <div className="section-header-row">
          <div>
            <h2 className="section-title">
              {ticker} Market Summary
            </h2>
            <span className="section-subtitle">
              {stockData?.as_of ? `Daily Trading Bar · As of ${stockData.as_of} · Yahoo Finance Source` : "Real-time Yahoo Finance Data"}
            </span>
          </div>
          <div className="header-badges-row">
            {stockData?.trend && (
              <StatusBadge status={stockData.trend} label={`Trend: ${stockData.trend}`} />
            )}
            <div className="quick-nav-pills">
              <Link to={`/stocks?ticker=${ticker}`} className="btn-pill-xs">
                Technicals
              </Link>
              {!isIndianTicker && (
                <Link to={`/news?ticker=${ticker}`} className="btn-pill-xs">
                  News
                </Link>
              )}
              <Link to={`/reports?ticker=${ticker}`} className="btn-pill-xs">
                Reports
              </Link>
              <Link to={`/advisor?ticker=${ticker}`} className="btn-pill-xs btn-advisor">
                Advisor
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton type="metrics" />
        ) : stockData ? (
          <div className="metrics-grid">
            <MetricCard
              title="Last Close Price"
              value={`$${fmt(stockData.price)}`}
              change={stockData.change}
              changePercent={stockData.change_percent}
              trend={stockData.change >= 0 ? "up" : "down"}
              subtext="Adjusted historical close"
              icon={TrendingUp}
            />
            <MetricCard
              title="Period Return (1Y)"
              value={`${fmt(stockData.period_return_percent)}%`}
              trend={stockData.period_return_percent >= 0 ? "up" : "down"}
              subtext="1-year cumulative holding return"
              icon={Activity}
            />
            <MetricCard
              title="Annualized Volatility"
              value={`${fmt(stockData.annualized_volatility_percent)}%`}
              subtext="Historical standard deviation (x√252)"
              icon={Layers}
            />
            <MetricCard
              title="RSI (14-Day Wilder)"
              value={fmt(indicators?.rsi14, 1)}
              subtext={
                indicators?.rsi14 > 70
                  ? "Overbought territory (>70)"
                  : indicators?.rsi14 < 30
                  ? "Oversold territory (<30)"
                  : "Neutral momentum range (30-70)"
              }
            />
            <MetricCard
              title="SMA 50 vs 20"
              value={`$${fmt(indicators?.sma50)}`}
              subtext={`SMA 20: $${fmt(indicators?.sma20)}`}
            />
            <MetricCard
              title="FinBERT News Sentiment"
              value={
                isIndianTicker
                  ? "EXCLUDED (.NS)"
                  : newsData
                  ? newsData.overall_sentiment.toUpperCase()
                  : "NOT LOADED"
              }
              subtext={
                isIndianTicker
                  ? "Finnhub supports US equities"
                  : newsData
                  ? `${newsData.count} headlines analyzed`
                  : "Fetching latest headlines..."
              }
              icon={Newspaper}
            />
          </div>
        ) : null}
      </section>

      {/* Main Grid: Chart + News Sentiment Card */}
      <div className="dashboard-grid-layout">
        {/* Left Column: Historical Performance Chart & Overview */}
        <div className="dashboard-main-col">
          <div className="panel chart-panel">
            <div className="panel-header-row">
              <div>
                <h3>{ticker} Historical Performance & Trend</h3>
                <span className="panel-sub-label">
                  Close price vs SMA 20 & SMA 50 over the past 1 year
                </span>
              </div>
              <Link to={`/stocks?ticker=${ticker}`} className="link-action">
                Full Technical Indicators & Bollinger Bands <ArrowRight size={14} />
              </Link>
            </div>

            {loading ? (
              <LoadingSkeleton type="chart" />
            ) : stockData?.history ? (
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stockData.history}
                    margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid stroke="#27364b" strokeDasharray="3 3" opacity={0.5} />
                    <XAxis
                      dataKey="date"
                      stroke="#8392ae"
                      minTickGap={40}
                      tickFormatter={(d) => d.slice(5)}
                    />
                    <YAxis
                      stroke="#8392ae"
                      domain={["auto", "auto"]}
                      tickFormatter={(v) => `$${fmt(v, 0)}`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#121b2d",
                        border: "1px solid #29364d",
                        borderRadius: "8px",
                        color: "#eef2ff",
                      }}
                      formatter={(val, name) => [`$${fmt(val)}`, name]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="close"
                      name="Close Price"
                      stroke="#68e0bc"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="sma20"
                      name="20-Day SMA"
                      stroke="#ffca74"
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="sma50"
                      name="50-Day SMA"
                      stroke="#92a9ff"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : null}
          </div>

          {/* Technical Trend Classification & Signals */}
          {stockData?.summary?.length > 0 && (
            <div className="panel summary-panel">
              <div className="panel-header-row">
                <h3>Technical Signals & Trend Classification</h3>
                <StatusBadge status={stockData.trend} label={`Trend: ${stockData.trend}`} />
              </div>
              <ul className="signals-list">
                {stockData.summary.map((sig, idx) => (
                  <li key={idx} className="signal-item">
                    <span className="signal-bullet" />
                    <span>{sig}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* News Sentiment Overview Preview */}
          {!isIndianTicker && newsData && newsData.count > 0 && (
            <div className="panel news-overview-panel">
              <div className="panel-header-row">
                <div className="header-with-icon">
                  <Newspaper size={18} className="brand-accent" />
                  <h3>Recent News Intelligence ({ticker})</h3>
                </div>
                <Link to={`/news?ticker=${ticker}`} className="link-action">
                  All {newsData.count} Articles & Sentiment Pie <ArrowRight size={14} />
                </Link>
              </div>

              <div className="news-preview-grid">
                {newsData.articles.slice(0, 3).map((art, idx) => (
                  <div key={idx} className="news-preview-card">
                    <div className="preview-meta">
                      <span>{art.source}</span>
                      <span className={`sentiment-pill ${art.sentiment}`}>
                        {art.sentiment} ({Math.round(art.confidence * 100)}%)
                      </span>
                    </div>
                    <a
                      href={art.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="preview-headline"
                    >
                      {art.headline}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Watchlist Snapshot, Recent Research Runs & Agent Status */}
        <div className="dashboard-side-col">
          {/* Watchlist Snapshot */}
          <div className="panel watchlist-summary-panel">
            <div className="panel-header-row">
              <h3>Watchlist Snapshot</h3>
              <Link to="/watchlist" className="link-action">
                View All ({watchlist.length}) <ArrowRight size={14} />
              </Link>
            </div>
            <div className="watchlist-items-list">
              {watchlist.slice(0, 5).map((sym) => (
                <div key={sym} className="watchlist-row-item">
                  <span className="row-symbol">{sym}</span>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn-pill-xs"
                      onClick={() => setTicker(sym)}
                    >
                      Inspect
                    </button>
                    <Link
                      to={`/advisor?ticker=${sym}`}
                      className="btn-pill-xs btn-advisor"
                    >
                      Advisor
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Research History Snapshot */}
          <div className="panel history-summary-panel">
            <div className="panel-header-row">
              <h3>Recent Research Runs</h3>
              <Link to="/history" className="link-action">
                All History <ArrowRight size={14} />
              </Link>
            </div>
            {recentHistory.length === 0 ? (
              <p className="subtle-note">
                No past research runs yet. Launch the{" "}
                <Link to="/advisor">AI Advisor</Link> to generate an assessment.
              </p>
            ) : (
              <div className="recent-history-list">
                {recentHistory.map((h) => (
                  <div key={h.id} className="recent-history-row">
                    <div className="hist-symbol-group">
                      <span className="hist-symbol">{h.symbol}</span>
                      <span className="hist-date">
                        {new Date(h.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <StatusBadge
                      status={h.assessment}
                      label={h.assessment?.replace(/_/g, " ")}
                      size="sm"
                    />
                    <Link
                      to={`/advisor?ticker=${h.symbol}`}
                      className="btn-pill-xs btn-advisor"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Agent Architecture Status */}
          <div className="panel agent-status-panel">
            <div className="panel-header-row">
              <h3>Agent Core Health</h3>
              <Link to="/settings" className="link-action">
                Diagnostics <ArrowRight size={14} />
              </Link>
            </div>
            <div className="agent-status-list">
              <div className="agent-status-row">
                <div className="agent-label-group">
                  <Server size={14} />
                  <span>FastAPI Core</span>
                </div>
                <StatusBadge
                  status={agentStatus.fastapi === "online" ? "ok" : "error"}
                  label={agentStatus.fastapi}
                  size="sm"
                />
              </div>

              <div className="agent-status-row">
                <div className="agent-label-group">
                  <Activity size={14} />
                  <span>Agent 1: Price Analyst</span>
                </div>
                <StatusBadge status="ok" label="Active" size="sm" />
              </div>

              <div className="agent-status-row">
                <div className="agent-label-group">
                  <Newspaper size={14} />
                  <span>Agent 2: News Analyst</span>
                </div>
                <StatusBadge status="ok" label="FinBERT" size="sm" />
              </div>

              <div className="agent-status-row">
                <div className="agent-label-group">
                  <Database size={14} />
                  <span>Agent 3: Report RAG</span>
                </div>
                <StatusBadge status="ok" label="Astra DB" size="sm" />
              </div>

              <div className="agent-status-row">
                <div className="agent-label-group">
                  <Sparkles size={14} />
                  <span>Gemini Synthesis Core</span>
                </div>
                <StatusBadge status="ok" label="Gemini 3.5" size="sm" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attribution and Limitations Callout */}
      <div className="dashboard-attribution-footer">
        <Info size={16} className="brand-accent" />
        <div className="attribution-text">
          <strong>Data Attribution & Limitations:</strong> Historical prices supplied by Yahoo Finance (auto-adjusted daily bars). Financial headlines provided by Finnhub. Sentiment scored locally with ProsusAI/FinBERT. Report excerpts indexed in DataStax Astra DB and synthesized by Google Gemini. Market data may be delayed or revised. Automated research metrics do not constitute personalized financial advice.
        </div>
      </div>
    </div>
  );
}
