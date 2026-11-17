
import { useEffect, useState } from "react";

import {
  Activity,
  ChartNoAxesCombined,
  Search,
  ShieldCheck,
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
} from "recharts";

import NewsPanel from "./NewsPanel";
import ReportPanel from "./ReportPanel";
import AdvisorPanel from "./AdvisorPanel";
// FastAPI backend URL
const API = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000"
).replace(/\/$/, "");

// Format numeric values
const fmt = (value, digits = 2) =>
  value == null
    ? "N/A"
    : Number(value).toLocaleString(undefined, {
        maximumFractionDigits: digits,
      });

// Reusable stock chart
function Plot({ data, lines, title, height = 280 }) {
  return (
    <section className="panel">
      <h3>{title}</h3>

      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 8,
              right: 15,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid
              stroke="#27364b"
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="date"
              stroke="#aebbd4"
              minTickGap={45}
              tickFormatter={(value) => value.slice(5)}
            />

            <YAxis
              stroke="#aebbd4"
              domain={["auto", "auto"]}
              width={65}
              tickFormatter={(value) => fmt(value, 1)}
            />

            <Tooltip
              contentStyle={{
                background: "#172337",
                border: "1px solid #38506b",
                color: "#eef2ff",
              }}
            />

            <Legend />

            {lines.map(({ key, color, name }) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={name}
                stroke={color}
                dot={false}
                strokeWidth={2}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

// Main AgentVest application
export default function App() {
  // Backend connection
  const [health, setHealth] = useState("Checking...");

  // Stock analysis
  const [ticker, setTicker] = useState("AAPL");
  const [period, setPeriod] = useState("1y");
  const [result, setResult] = useState(null);

  // News intelligence
  const [newsSymbol, setNewsSymbol] = useState(null);

  // Financial report analysis
  const [reportTicker, setReportTicker] = useState("AAPL");

  // Request states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Check FastAPI backend connection
  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API}/health`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Health check failed");
        }

        return response.json();
      })
      .then((data) => {
        setHealth(
          data.status === "ok"
            ? "Connected"
            : "Unexpected response"
        );
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setHealth("Offline");
        }
      });

    return () => controller.abort();
  }, []);

  // Fetch stock price analysis
  async function search(event) {
    event.preventDefault();

    setError("");
    setResult(null);
    setNewsSymbol(null);

    const symbol = ticker.trim().toUpperCase();

    if (!/^[A-Z0-9^][A-Z0-9.^-]{0,19}$/.test(symbol)) {
      setError(
        "Enter a valid ticker, such as AAPL or RELIANCE.NS"
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API}/api/v1/stocks/${encodeURIComponent(
          symbol
        )}?period=${period}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : `Request failed: HTTP ${response.status}`
        );
      }

      setResult(data);

      // Activate financial news analysis
      setNewsSymbol(symbol);

      // Update report panel's default ticker
      setReportTicker(symbol);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Cannot reach FastAPI. Check port 8000 and CORS."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  const indicators = result?.indicators;

  return (
    <main className="shell">
      {/* HEADER */}
      <header>
        <div className="brand">
          <ChartNoAxesCombined size={30} />

          <span>
            Agent<span className="accent">Vest</span>
          </span>
        </div>

        <span className="tag">
          Major Project · Phase 5
        </span>
      </header>

      {/* HERO SECTION */}
      <section className="hero">
        <p className="eyebrow">
          MULTI-AGENT INVESTMENT RESEARCH
        </p>

        <h1>
          Financial intelligence,
          <br />
          <span className="accent">
            built on evidence.
          </span>
        </h1>

        <p>
          Analyze historical stock prices, explore
          financial news sentiment, and ask AI-powered
          questions about financial reports using
          retrieval-augmented generation.
        </p>

        {/* STOCK SEARCH FORM */}
        <form onSubmit={search}>
          <Search size={20} />

          <input
            aria-label="Stock ticker"
            value={ticker}
            onChange={(event) =>
              setTicker(event.target.value)
            }
            placeholder="AAPL or RELIANCE.NS"
            required
          />

          <select
            aria-label="History period"
            value={period}
            onChange={(event) =>
              setPeriod(event.target.value)
            }
          >
            <option value="6mo">6 months</option>
            <option value="1y">1 year</option>
            <option value="2y">2 years</option>
            <option value="5y">5 years</option>
          </select>

          <button type="submit" disabled={loading}>
            {loading
              ? "Loading..."
              : "Analyze stock"}
          </button>
        </form>

        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
      </section>

      {/* PHASE 3 — STOCK PRICE ANALYSIS */}
      {result && (
        <section className="results">
          <div className="result-heading">
            <div>
              <p className="eyebrow">
                STOCK ANALYSIS
              </p>

              <h2>
                {result.symbol}{" "}
                <span className="subtle">
                  · {result.as_of}
                </span>
              </h2>
            </div>

            <span className="trend">
              {result.trend?.replace(/_/g, " ") ||
                "Unknown"}
            </span>
          </div>

          <p className="subtle">
            Prices are adjusted historical values.
            Currency is not verified by this data
            source; check the listing currency
            before interpreting amounts.
          </p>

          {/* STOCK METRICS */}
          <div className="metrics">
            {[
              ["Last close", fmt(result.price)],
              [
                "Daily change",
                `${fmt(result.change)} (${fmt(
                  result.change_percent
                )}%)`,
              ],
              [
                "Period return",
                `${fmt(
                  result.period_return_percent
                )}%`,
              ],
              [
                "Annualized volatility",
                `${fmt(
                  result.annualized_volatility_percent
                )}%`,
              ],
              [
                "RSI (14)",
                fmt(indicators?.rsi14),
              ],
              [
                "SMA (50)",
                fmt(indicators?.sma50),
              ],
            ].map(([label, value]) => (
              <article key={label}>
                <small>{label}</small>
                <strong>{value}</strong>
              </article>
            ))}
          </div>

          {/* PRICE CHART */}
          <Plot
            data={result.history}
            title="Price, Moving Averages & Bollinger Bands"
            lines={[
              {
                key: "close",
                name: "Close",
                color: "#68e0bc",
              },
              {
                key: "sma20",
                name: "SMA 20",
                color: "#ffca74",
              },
              {
                key: "sma50",
                name: "SMA 50",
                color: "#92a9ff",
              },
              {
                key: "bb_upper",
                name: "Upper Band",
                color: "#ad8ad6",
              },
              {
                key: "bb_lower",
                name: "Lower Band",
                color: "#ad8ad6",
              },
            ]}
          />

          {/* RSI AND MACD */}
          <div className="chart-grid">
            <Plot
              data={result.history}
              title="RSI (14)"
              height={230}
              lines={[
                {
                  key: "rsi14",
                  name: "RSI",
                  color: "#ffca74",
                },
              ]}
            />

            <Plot
              data={result.history}
              title="MACD"
              height={230}
              lines={[
                {
                  key: "macd",
                  name: "MACD",
                  color: "#68e0bc",
                },
                {
                  key: "macd_signal",
                  name: "Signal",
                  color: "#ffca74",
                },
              ]}
            />
          </div>

          {/* TECHNICAL SUMMARY */}
          <section className="panel">
            <h3>Technical Research Summary</h3>

            <ul>
              {(result.summary || []).map(
                (item, index) => (
                  <li key={index}>{item}</li>
                )
              )}
            </ul>

            <p className="subtle">
              {result.disclaimer}
            </p>
          </section>
        </section>
      )}

      {/* PHASE 4 — FINANCIAL NEWS */}
      {newsSymbol && (
        <NewsPanel symbol={newsSymbol} />
      )}

      {/* PHASE 5 — FINANCIAL REPORT RAG */}
      <ReportPanel
        key={reportTicker}
        ticker={reportTicker}
      />
      {/* PHASE 6 — MULTI-AGENT INVESTMENT ADVISOR */}
        <AdvisorPanel
  key={reportTicker}
  ticker={reportTicker}
/>
      {/* PROJECT FEATURES */}
      <section className="cards">
        <article>
          <Activity />

          <h3>Price Analysis</h3>

          <p>
            Historical prices, technical indicators,
            and risk metrics.
          </p>

          <small>
            Phase 3 · Implemented
          </small>
        </article>

        <article>
          <Search />

          <h3>News Intelligence</h3>

          <p>
            Financial headlines and AI-powered
            sentiment analysis.
          </p>

          <small>
            Phase 4 · Implemented
          </small>
        </article>

        <article>
          <ShieldCheck />

          <h3>Report Research</h3>

          <p>
            PDF upload, Astra DB retrieval, and
            Gemini-powered financial report Q&A.
          </p>

          <small>
            Phase 5 · Implemented
          </small>
        </article>
      </section>

      {/* FOOTER */}
      <footer>
        Backend status:{" "}
        <span
          className={
            health === "Connected"
              ? "good"
              : "muted"
          }
        >
          {health}
        </span>
        {" · "}
        Research and educational use only.
        Not personalized financial advice.
      </footer>
    </main>
  );
}
