import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  TrendingUp,
  Search,
  Bookmark,
  BookmarkCheck,
  Activity,
  Layers,
  Sparkles,
  Info,
  BrainCircuit,
  Newspaper,
  Calendar,
  BarChart2,
  Sliders,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar,
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

const fmtVol = (val) => {
  if (val == null) return "N/A";
  if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(2)}K`;
  return String(val);
};

export default function StockAnalysisPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTicker = searchParams.get("ticker") || "AAPL";
  const [ticker, setTicker] = useState(initialTicker);
  const [period, setPeriod] = useState("1y");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const { isSaved, addToWatchlist, removeFromWatchlist } = useWatchlist();

  const runAnalysis = async (symbolToFetch, periodToFetch) => {
    const symbol = (symbolToFetch || ticker).trim().toUpperCase();
    if (!symbol) return;

    setError("");
    setLoading(true);

    try {
      const data = await api.getStockAnalysis(symbol, periodToFetch || period);
      setResult(data);
      setSearchParams({ ticker: symbol });
    } catch (err) {
      setError(err.message || "Failed to load stock data");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const paramTicker = searchParams.get("ticker");
    if (paramTicker && paramTicker !== ticker) {
      setTicker(paramTicker);
      runAnalysis(paramTicker, period);
    } else if (!result) {
      runAnalysis(ticker, period);
    }
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    runAnalysis(ticker, period);
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (ticker) {
      runAnalysis(ticker, newPeriod);
    }
  };

  const indicators = result?.indicators;
  const isBookmarked = isSaved(ticker);
  const isIndianTicker = ticker.endsWith(".NS") || ticker.endsWith(".BO");

  // Latest bar or currently hovered bar
  const activeBar = hoveredPoint || (result?.history ? result.history[result.history.length - 1] : null);

  return (
    <div className="page-stocks">
      {/* Search and Period Bar */}
      <section className="search-controls-card">
        <form onSubmit={handleSubmit} className="stock-search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="Enter ticker (e.g. AAPL, NVDA, RELIANCE.NS)..."
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </form>

        <div className="period-selector-group">
          {["6mo", "1y", "2y", "5y"].map((p) => (
            <button
              key={p}
              type="button"
              className={`period-btn ${period === p ? "active" : ""}`}
              onClick={() => handlePeriodChange(p)}
            >
              {p === "6mo" ? "6 Months" : p === "1y" ? "1 Year" : p === "2y" ? "2 Years" : "5 Years"}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <ErrorAlert message={error} onRetry={() => runAnalysis(ticker, period)} />
      )}

      {loading && <LoadingSkeleton type="metrics" />}

      {result && !loading && (
        <>
          {/* Header & Watchlist Action */}
          <div className="stock-view-header">
            <div>
              <span className="stock-view-eyebrow">EQUITY QUANTITATIVE TECHNICALS</span>
              <h1 className="stock-view-symbol">
                {result.symbol}{" "}
                <span className="stock-view-date">· As of {result.as_of}</span>
              </h1>
            </div>

            <div className="stock-header-actions">
              <StatusBadge status={result.trend} label={`Trend: ${result.trend}`} />

              <button
                type="button"
                className={`btn-watchlist-toggle ${isBookmarked ? "saved" : ""}`}
                onClick={() =>
                  isBookmarked
                    ? removeFromWatchlist(result.symbol)
                    : addToWatchlist(result.symbol)
                }
              >
                {isBookmarked ? (
                  <>
                    <BookmarkCheck size={16} />
                    <span>In Watchlist</span>
                  </>
                ) : (
                  <>
                    <Bookmark size={16} />
                    <span>Add to Watchlist</span>
                  </>
                )}
              </button>

              <Link
                to={`/advisor?ticker=${result.symbol}`}
                className="btn-primary-action-pill"
                title="Launch Multi-Agent Advisor"
              >
                <BrainCircuit size={16} />
                <span>AI Advisor</span>
              </Link>

              {!isIndianTicker && (
                <Link
                  to={`/news?ticker=${result.symbol}`}
                  className="btn-secondary-action-pill"
                  title="View News Intelligence"
                >
                  <Newspaper size={16} />
                  <span>News</span>
                </Link>
              )}
            </div>
          </div>

          {/* Interactive OHLC Inspector Bar */}
          {activeBar && (
            <div className="ohlc-inspect-strip">
              <div className="inspect-item">
                <span className="inspect-label">Session Date</span>
                <strong className="inspect-value">{activeBar.date}</strong>
              </div>
              <div className="inspect-item">
                <span className="inspect-label">Open</span>
                <strong className="inspect-value">${fmt(activeBar.open)}</strong>
              </div>
              <div className="inspect-item">
                <span className="inspect-label">High</span>
                <strong className="inspect-value text-positive">${fmt(activeBar.high)}</strong>
              </div>
              <div className="inspect-item">
                <span className="inspect-label">Low</span>
                <strong className="inspect-value text-negative">${fmt(activeBar.low)}</strong>
              </div>
              <div className="inspect-item">
                <span className="inspect-label">Close</span>
                <strong className="inspect-value">${fmt(activeBar.close)}</strong>
              </div>
              <div className="inspect-item">
                <span className="inspect-label">Trading Volume</span>
                <strong className="inspect-value">{fmtVol(activeBar.volume)}</strong>
              </div>
            </div>
          )}

          <div className="disclaimer-callout">
            <Info size={16} />
            <span>
              Prices are auto-adjusted historical values from Yahoo Finance. Wilder RSI, MACD, and Bollinger Bands are calculated deterministically. Technical indicators are descriptive market analytics and do not constitute guaranteed price forecasts.
            </span>
          </div>

          {/* Metrics Grid */}
          <div className="metrics-grid">
            <MetricCard
              title="Last Close Price"
              value={`$${fmt(result.price)}`}
              change={result.change}
              changePercent={result.change_percent}
              trend={result.change >= 0 ? "up" : "down"}
              subtext="Latest daily session"
              icon={TrendingUp}
            />
            <MetricCard
              title={`Period Return (${period})`}
              value={`${fmt(result.period_return_percent)}%`}
              trend={result.period_return_percent >= 0 ? "up" : "down"}
              subtext={`Cumulative holding return over ${period}`}
              icon={Activity}
            />
            <MetricCard
              title="Annualized Volatility"
              value={`${fmt(result.annualized_volatility_percent)}%`}
              subtext="Standard deviation of daily returns × √252"
              icon={Layers}
            />
            <MetricCard
              title="RSI (14-Day Wilder)"
              value={fmt(indicators?.rsi14, 2)}
              subtext={
                indicators?.rsi14 > 70
                  ? "Overbought territory (>70)"
                  : indicators?.rsi14 < 30
                  ? "Oversold territory (<30)"
                  : "Momentum in 30-70 band"
              }
            />
            <MetricCard
              title="SMA 50 vs 20"
              value={`$${fmt(indicators?.sma50)}`}
              subtext={`SMA 20: $${fmt(indicators?.sma20)}`}
            />
            <MetricCard
              title="EMA 20"
              value={`$${fmt(indicators?.ema20)}`}
              subtext="Exponential moving average (20-day)"
            />
          </div>

          {/* Main Price & Moving Averages & Bollinger Bands Chart */}
          <div className="panel chart-panel">
            <div className="panel-header-row">
              <div>
                <h3>Price, Moving Averages (SMA 20, SMA 50) & Bollinger Bands</h3>
                <span className="panel-sub-label">
                  Hover over any point to inspect session OHLCV metrics
                </span>
              </div>
            </div>
            <div style={{ width: "100%", height: 380 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={result.history}
                  margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                  onMouseMove={(state) => {
                    if (state && state.activePayload && state.activePayload.length > 0) {
                      setHoveredPoint(state.activePayload[0].payload);
                    }
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <CartesianGrid stroke="#27364b" strokeDasharray="3 3" opacity={0.6} />
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
                    name="Close"
                    stroke="#68e0bc"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="sma20"
                    name="SMA 20"
                    stroke="#ffca74"
                    strokeWidth={1.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="sma50"
                    name="SMA 50"
                    stroke="#92a9ff"
                    strokeWidth={1.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="bb_upper"
                    name="Upper Band (2σ)"
                    stroke="#ad8ad6"
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="bb_lower"
                    name="Lower Band (2σ)"
                    stroke="#ad8ad6"
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Oscillators: RSI and MACD */}
          <div className="charts-split-grid">
            {/* RSI Chart */}
            <div className="panel chart-panel">
              <div className="panel-header-row">
                <h3>Relative Strength Index (RSI 14)</h3>
                <span className="panel-sub-label">Wilder Smoothing Method</span>
              </div>
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={result.history}
                    margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid stroke="#27364b" strokeDasharray="3 3" opacity={0.5} />
                    <XAxis
                      dataKey="date"
                      stroke="#8392ae"
                      minTickGap={35}
                      tickFormatter={(d) => d.slice(5)}
                    />
                    <YAxis
                      stroke="#8392ae"
                      domain={[0, 100]}
                      ticks={[30, 50, 70]}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#121b2d",
                        border: "1px solid #29364d",
                        borderRadius: "8px",
                      }}
                      formatter={(val) => [fmt(val, 2), "RSI 14"]}
                    />
                    <ReferenceLine y={70} stroke="#fb7185" strokeDasharray="3 3" label="70 Overbought" />
                    <ReferenceLine y={50} stroke="#64748b" strokeDasharray="2 2" />
                    <ReferenceLine y={30} stroke="#34d399" strokeDasharray="3 3" label="30 Oversold" />
                    <Line
                      type="monotone"
                      dataKey="rsi14"
                      name="RSI 14"
                      stroke="#ffca74"
                      strokeWidth={1.8}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* MACD Chart */}
            <div className="panel chart-panel">
              <div className="panel-header-row">
                <h3>MACD (12, 26, 9)</h3>
                <span className="panel-sub-label">Fast EMA - Slow EMA vs Signal</span>
              </div>
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={result.history}
                    margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid stroke="#27364b" strokeDasharray="3 3" opacity={0.5} />
                    <XAxis
                      dataKey="date"
                      stroke="#8392ae"
                      minTickGap={35}
                      tickFormatter={(d) => d.slice(5)}
                    />
                    <YAxis stroke="#8392ae" domain={["auto", "auto"]} />
                    <Tooltip
                      contentStyle={{
                        background: "#121b2d",
                        border: "1px solid #29364d",
                        borderRadius: "8px",
                      }}
                      formatter={(val, name) => [fmt(val, 2), name]}
                    />
                    <ReferenceLine y={0} stroke="#64748b" />
                    <Line
                      type="monotone"
                      dataKey="macd"
                      name="MACD Line"
                      stroke="#68e0bc"
                      strokeWidth={1.8}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="macd_signal"
                      name="Signal Line"
                      stroke="#fb7185"
                      strokeWidth={1.8}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Technical Signals Summary */}
          <div className="panel summary-panel">
            <div className="panel-header-row">
              <h3>Technical Research Summary</h3>
              <StatusBadge status={result.trend} label={`Overall: ${result.trend}`} />
            </div>
            <ul className="signals-list">
              {(result.summary || []).map((sig, idx) => (
                <li key={idx} className="signal-item">
                  <span className="signal-bullet" />
                  <span>{sig}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
