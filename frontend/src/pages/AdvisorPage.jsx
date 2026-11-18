import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  BrainCircuit,
  Search,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Newspaper,
  FileText,
  AlertTriangle,
  Bookmark,
  CheckCircle2,
  BookmarkCheck,
  Info,
  Clock,
  Save,
} from "lucide-react";
import { api } from "../services/api";
import StatusBadge from "../components/common/StatusBadge";
import MetricCard from "../components/common/MetricCard";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import ErrorAlert from "../components/common/ErrorAlert";
import { useToast } from "../context/ToastContext";
import { useWatchlist } from "../context/WatchlistContext";

const readable = (val) =>
  String(val ?? "Unavailable")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const ASSESSMENTS = {
  positive_alignment: "Positive Signal Alignment",
  negative_alignment: "Negative Signal Alignment",
  mixed_signals: "Mixed Market Signals",
  insufficient_or_mixed_evidence: "Inconclusive / Mixed Evidence",
};

export default function AdvisorPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTicker = searchParams.get("ticker") || "AAPL";
  const [ticker, setTicker] = useState(initialTicker);
  const [period, setPeriod] = useState("1y");
  const [days, setDays] = useState(7);
  const [includeReport, setIncludeReport] = useState(false);
  const [reportId, setReportId] = useState("");
  const [includeSynthesis, setIncludeSynthesis] = useState(true);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recentReports, setRecentReports] = useState([]);

  const { showToast } = useToast();
  const { isSaved, addToWatchlist, removeFromWatchlist } = useWatchlist();

  // Load available reports from backend API with fallback
  useEffect(() => {
    api
      .getReports()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRecentReports(data);
        } else {
          const saved = localStorage.getItem("agentvest_saved_reports");
          if (saved) setRecentReports(JSON.parse(saved));
        }
      })
      .catch(() => {
        const saved = localStorage.getItem("agentvest_saved_reports");
        if (saved) setRecentReports(JSON.parse(saved));
      });
  }, []);

  const runAdvisor = async (symbolToFetch) => {
    const symbol = (symbolToFetch || ticker).trim().toUpperCase();
    if (!symbol) return;

    setLoading(true);
    setError("");

    try {
      const data = await api.getAdvisorAnalysis(symbol, {
        period,
        days,
        reportId: includeReport && reportId ? reportId.trim() : null,
        includeReport,
        includeSynthesis,
      });

      setResult(data);
      setSearchParams({ ticker: symbol });

      // Automatically persist research run to history
      const historyEntry = {
        id: `run_${Date.now()}`,
        symbol,
        created_at: new Date().toISOString(),
        period,
        news_days: days,
        assessment: data.assessment,
        technical_outlook: data.technical_outlook,
        news_sentiment: data.news_sentiment,
        price_status: data.agents?.price?.status || "unknown",
        news_status: data.agents?.news?.status || "unknown",
        report_status: data.agents?.report?.status || "unknown",
        synthesis_status: data.synthesis?.status || "unknown",
        summary_json: JSON.stringify(data.synthesis?.data || {}),
        full_result_json: JSON.stringify(data),
      };

      await api.saveHistory(historyEntry);
      showToast(`Research completed for ${symbol}`, "success");
    } catch (err) {
      setError(err.message || "Advisor research orchestration failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const paramTicker = searchParams.get("ticker");
    if (paramTicker && paramTicker !== ticker) {
      setTicker(paramTicker);
      runAdvisor(paramTicker);
    }
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    runAdvisor(ticker);
  };

  const agents = result?.agents || {};
  const price = agents.price?.data;
  const news = agents.news?.data;
  const report = agents.report?.data;
  const synthesis = result?.synthesis;
  const synthesisData = synthesis?.data;
  const isBookmarked = isSaved(ticker);

  return (
    <div className="page-advisor">
      {/* Header Banner */}
      <div className="advisor-hero-header">
        <div className="hero-eyebrow">
          <BrainCircuit size={16} />
          <span>FLAGSHIP MULTI-AGENT ADVISOR</span>
        </div>
        <h1 className="stock-view-symbol">Autonomous Investment Research</h1>
        <p className="section-subtitle">
          Orchestrates 4 autonomous agents across technical price data, FinBERT sentiment, and Astra DB vector reports, synthesized into executive commentary by Google Gemini.
        </p>
      </div>

      {/* Control Panel */}
      <div className="panel advisor-controls-card">
        <form onSubmit={handleSubmit} className="advisor-query-form">
          <div className="controls-row-primary">
            <div className="form-group flex-2">
              <label htmlFor="advisor-symbol">Stock Ticker</label>
              <div className="input-with-icon">
                <Search size={16} />
                <input
                  id="advisor-symbol"
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="e.g. AAPL, NVDA, MSFT"
                  required
                />
              </div>
            </div>

            <div className="form-group flex-1">
              <label htmlFor="advisor-period-select">Price Window</label>
              <select
                id="advisor-period-select"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="6mo">6 Months</option>
                <option value="1y">1 Year</option>
                <option value="2y">2 Years</option>
                <option value="5y">5 Years</option>
              </select>
            </div>

            <div className="form-group flex-1">
              <label htmlFor="advisor-days-select">News Lookback</label>
              <select
                id="advisor-days-select"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              >
                <option value={7}>7 Days</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
              </select>
            </div>
          </div>

          {/* Toggles Row */}
          <div className="controls-row-toggles">
            <label className="checkbox-toggle-label">
              <input
                type="checkbox"
                checked={includeReport}
                onChange={(e) => setIncludeReport(e.target.checked)}
              />
              <FileText size={16} />
              <span>Include Financial Report RAG</span>
            </label>

            <label className="checkbox-toggle-label">
              <input
                type="checkbox"
                checked={includeSynthesis}
                onChange={(e) => setIncludeSynthesis(e.target.checked)}
              />
              <Sparkles size={16} />
              <span>Enable Gemini AI Synthesis</span>
            </label>
          </div>

          {/* Optional Report Selection */}
          {includeReport && (
            <div className="report-picker-subpanel">
              <div className="form-group">
                <label>Select Previously Uploaded Report (Optional)</label>
                {recentReports.length > 0 ? (
                  <select
                    value={reportId}
                    onChange={(e) => setReportId(e.target.value)}
                  >
                    <option value="">Query all indexed chunks for {ticker}</option>
                    {recentReports.map((r) => (
                      <option key={r.report_id} value={r.report_id}>
                        {r.ticker} · {r.filename} ({r.chunks_indexed} chunks)
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="subtle-note">
                    No uploaded reports saved locally. You can upload a PDF on the{" "}
                    <Link to="/reports">Report Research</Link> page.
                  </p>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-launch-research"
          >
            <BrainCircuit size={18} />
            <span>{loading ? "Orchestrating Agents..." : "Run Multi-Agent Research"}</span>
          </button>
        </form>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => runAdvisor(ticker)} />}

      {loading && (
        <div className="advisor-loading-state">
          <LoadingSkeleton lines={5} />
          <p className="loading-helper-text">
            Executing Agent 1 (Price), Agent 2 (News), Agent 3 (Report RAG) in parallel...
          </p>
        </div>
      )}

      {result && !loading && (
        <div className="advisor-output-container">
          {/* Top Assessment Card */}
          <div className="advisor-assessment-banner">
            <div className="assessment-badge-group">
              <span className="eyebrow-tag">MULTI-AGENT RESEARCH ASSESSMENT</span>
              <h2 className="assessment-headline">
                {ASSESSMENTS[result.assessment] || readable(result.assessment)}
              </h2>
              <p className="assessment-subtitle">
                Synthesized evaluation for <strong>{result.symbol}</strong> comparing technical momentum signals with FinBERT news sentiment.
              </p>
            </div>

            <div className="assessment-actions-group">
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
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Bookmark size={16} />
                    <span>Watchlist</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Agent Execution Pipeline Status Cards */}
          <div className="pipeline-status-grid">
            <div className="pipeline-step-card">
              <div className="step-header">
                <TrendingUp size={16} />
                <span>Agent 1: Price</span>
              </div>
              <StatusBadge status={agents.price?.status} size="sm" />
              <span className="step-detail">
                {readable(result.technical_outlook)}
              </span>
            </div>

            <div className="pipeline-step-card">
              <div className="step-header">
                <Newspaper size={16} />
                <span>Agent 2: News</span>
              </div>
              <StatusBadge status={agents.news?.status} size="sm" />
              <span className="step-detail">
                {readable(result.news_sentiment)}
              </span>
            </div>

            <div className="pipeline-step-card">
              <div className="step-header">
                <FileText size={16} />
                <span>Agent 3: RAG Report</span>
              </div>
              <StatusBadge status={agents.report?.status} size="sm" />
              <span className="step-detail">
                {agents.report?.status === "ok" ? "Grounded" : readable(agents.report?.status)}
              </span>
            </div>

            <div className="pipeline-step-card">
              <div className="step-header">
                <Sparkles size={16} />
                <span>Gemini Synthesis</span>
              </div>
              <StatusBadge status={synthesis?.status} size="sm" />
              <span className="step-detail">
                {synthesis?.status === "ok" ? "Completed" : readable(synthesis?.status)}
              </span>
            </div>
          </div>

          {/* Gemini AI Synthesis View (Flagship) */}
          {synthesis?.status === "ok" && synthesisData && (
            <div className="panel gemini-synthesis-card">
              <div className="synthesis-header">
                <div className="synthesis-title-row">
                  <Sparkles size={20} className="sparkle-gemini-icon" />
                  <h3>Gemini Evidence-Grounded Research Synthesis</h3>
                </div>
                <span className="model-badge">gemini-3.5-flash-lite</span>
              </div>

              {/* Executive Summary */}
              <div className="synthesis-exec-summary">
                <h4>Executive Summary</h4>
                <p>{synthesisData.executive_summary}</p>
              </div>

              {/* 4 Multi-Column Synthesis Insights */}
              <div className="synthesis-insights-grid">
                <div className="synthesis-insight-box">
                  <h4 className="box-title supporting">Supporting Evidence</h4>
                  <ul>
                    {(synthesisData.supporting_evidence || []).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="synthesis-insight-box">
                  <h4 className="box-title conflicting">Conflicting Signals</h4>
                  <ul>
                    {(synthesisData.conflicting_signals || []).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="synthesis-insight-box">
                  <h4 className="box-title risks">Key Risks</h4>
                  <ul>
                    {(synthesisData.key_risks || []).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="synthesis-insight-box">
                  <h4 className="box-title gaps">Evidence Gaps</h4>
                  <ul>
                    {(synthesisData.evidence_gaps || []).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {synthesis?.status === "error" && (
            <div className="advisor-fallback-banner">
              <AlertTriangle size={18} />
              <span>
                Gemini synthesis was unavailable: {synthesis.error}. Technical, news, and report evidence from other agents remain intact below.
              </span>
            </div>
          )}

          {/* Individual Agent Evidence Sections */}
          <div className="agent-evidence-split">
            {/* Technical Evidence */}
            <div className="panel evidence-card">
              <div className="panel-header-row">
                <h3>Technical Price Evidence</h3>
                <Link to={`/stocks?ticker=${result.symbol}`} className="link-action">
                  View Full Charts
                </Link>
              </div>
              {price?.summary?.length ? (
                <ul className="evidence-list">
                  {price.summary.map((sig, idx) => (
                    <li key={idx}>{sig}</li>
                  ))}
                </ul>
              ) : (
                <p className="empty-subtle-text">
                  {agents.price?.error || "No technical evidence available"}
                </p>
              )}
            </div>

            {/* News Sentiment Evidence */}
            <div className="panel evidence-card">
              <div className="panel-header-row">
                <h3>News Sentiment Evidence</h3>
                <Link to={`/news?ticker=${result.symbol}`} className="link-action">
                  View All Headlines
                </Link>
              </div>
              {news?.articles?.length ? (
                <div className="mini-news-list">
                  {news.articles.slice(0, 4).map((a, i) => (
                    <div key={i} className="mini-news-row">
                      <span className={`mini-sentiment-tag ${a.sentiment}`}>
                        {a.sentiment}
                      </span>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mini-headline"
                      >
                        {a.headline}
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-subtle-text">
                  {agents.news?.error || "No news evidence returned"}
                </p>
              )}
            </div>
          </div>

          {/* Financial Report Findings */}
          {includeReport && (
            <div className="panel evidence-card report-evidence-full">
              <div className="panel-header-row">
                <h3>Financial Report RAG Findings</h3>
                <Link to={`/reports?ticker=${result.symbol}`} className="link-action">
                  Explore Full Report
                </Link>
              </div>
              {agents.report?.status === "ok" && report ? (
                <div className="report-advisor-answer">
                  <p className="report-text-body">{report.answer}</p>
                  {report.sources?.length > 0 && (
                    <div className="sources-chips-row">
                      <span className="sources-label">Citations:</span>
                      {report.sources.map((s, i) => (
                        <span key={i} className="source-chip-pill">
                          [Source {s.source_number}] {s.filename} (p. {s.page_number})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="empty-subtle-text">
                  {agents.report?.error ||
                    (agents.report?.status === "no_data"
                      ? "No indexed financial report found for this ticker in Astra DB."
                      : "Report analysis was not requested.")}
                </p>
              )}
            </div>
          )}

          {/* Research Disclaimer */}
          <div className="advisor-footer-disclaimer">
            <Info size={14} />
            <span>{result.disclaimer}</span>
          </div>
        </div>
      )}
    </div>
  );
}
