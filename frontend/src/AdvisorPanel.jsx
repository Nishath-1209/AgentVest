
import { useEffect, useRef, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

const ASSESSMENTS = {
  positive_alignment: "Positive Signal Alignment",
  negative_alignment: "Negative Signal Alignment",
  mixed_signals: "Mixed Market Signals",
  insufficient_or_mixed_evidence: "Inconclusive Evidence",
};

function readable(value) {
  return String(value ?? "Unavailable")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ResearchList({ title, items, emptyMessage }) {
  return (
    <div className="advisor-research-section">
      <h4>{title}</h4>

      {Array.isArray(items) && items.length > 0 ? (
        <ul>
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>{emptyMessage}</p>
      )}
    </div>
  );
}

export default function AdvisorPanel({ ticker = "" }) {
  const [symbol, setSymbol] = useState(ticker);
  const [period, setPeriod] = useState("1y");
  const [days, setDays] = useState(7);

  const [includeReport, setIncludeReport] = useState(false);
  const [reportId, setReportId] = useState("");

  // Phase 7: Optional Gemini synthesis
  const [includeSynthesis, setIncludeSynthesis] = useState(false);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestController = useRef(null);

  useEffect(() => {
    return () => {
      requestController.current?.abort();
    };
  }, []);

  async function runAnalysis(event) {
    event.preventDefault();

    const normalized = symbol.trim().toUpperCase();

    if (!normalized) {
      setError("Enter a stock ticker.");
      return;
    }

    requestController.current?.abort();

    const controller = new AbortController();
    requestController.current = controller;

    setLoading(true);
    setError("");
    setResult(null);

    const params = new URLSearchParams({
      period,
      days: String(days),
      include_report: String(includeReport),
      include_synthesis: String(includeSynthesis),
    });

    if (includeReport && reportId.trim()) {
      params.set("report_id", reportId.trim());
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/v1/advisor/${encodeURIComponent(normalized)}?${params}`,
        {
          signal: controller.signal,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Investment analysis failed."
        );
      }

      if (!controller.signal.aborted) {
        setResult(data);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(
          err.message || "Unable to contact the advisor."
        );
      }
    } finally {
      if (requestController.current === controller) {
        requestController.current = null;
        setLoading(false);
      }
    }
  }

  const agents = result?.agents || {};

  const price = agents.price?.data;
  const news = agents.news?.data;
  const report = agents.report?.data;

  // Phase 7: Structured synthesis response
  const synthesis = result?.synthesis;
  const synthesisData = synthesis?.data;

  return (
    <section className="advisor-panel">
      <h2>Multi-Agent Investment Advisor</h2>

      <p>
        Combine technical indicators, financial news sentiment,
        optional financial report research, and Gemini-powered
        AI research synthesis.
      </p>

      <form onSubmit={runAnalysis}>
        <label htmlFor="advisor-ticker">
          Stock Ticker
        </label>

        <input
          id="advisor-ticker"
          value={symbol}
          onChange={(event) =>
            setSymbol(event.target.value)
          }
          placeholder="Example: AAPL"
          maxLength={20}
          required
        />

        <label htmlFor="advisor-period">
          Price History
        </label>

        <select
          id="advisor-period"
          value={period}
          onChange={(event) =>
            setPeriod(event.target.value)
          }
        >
          <option value="6mo">6 Months</option>
          <option value="1y">1 Year</option>
          <option value="2y">2 Years</option>
          <option value="5y">5 Years</option>
        </select>

        <label htmlFor="advisor-days">
          News Lookback
        </label>

        <select
          id="advisor-days"
          value={days}
          onChange={(event) =>
            setDays(Number(event.target.value))
          }
        >
          <option value={7}>7 Days</option>
          <option value={14}>14 Days</option>
          <option value={30}>30 Days</option>
        </select>

        {/* Phase 5: Optional report research */}
        <label className="advisor-checkbox">
          <input
            type="checkbox"
            checked={includeReport}
            onChange={(event) =>
              setIncludeReport(event.target.checked)
            }
          />
          Include Financial Report Analysis
        </label>

        {includeReport && (
          <>
            <label htmlFor="advisor-report-id">
              Report ID (optional)
            </label>

            <input
              id="advisor-report-id"
              value={reportId}
              onChange={(event) =>
                setReportId(event.target.value)
              }
              placeholder="Paste an uploaded report ID"
            />
          </>
        )}

        {/* Phase 7: Gemini synthesis toggle */}
        <label className="advisor-checkbox">
          <input
            type="checkbox"
            checked={includeSynthesis}
            onChange={(event) =>
              setIncludeSynthesis(event.target.checked)
            }
          />
          Enable Gemini AI Synthesis
        </label>

        <p className="advisor-synthesis-note">
          When enabled, Gemini combines available agent
          evidence into a structured research summary.
          This may increase analysis time and API usage.
        </p>

        <button type="submit" disabled={loading}>
          {loading
            ? "Analyzing..."
            : "Run Investment Research"}
        </button>
      </form>

      {error && (
        <p className="advisor-error" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="advisor-results">

          {/* Overall research assessment */}
          <div className="advisor-summary">
            <small>
              Research Assessment — {result.symbol}
            </small>

            <h3>
              {ASSESSMENTS[result.assessment] ||
                readable(result.assessment)}
            </h3>

            <p>
              This assessment compares technical trends
              and news sentiment. Report findings are
              shown separately.
            </p>
          </div>

          {/* Technical and news overview */}
          <div className="advisor-grid">
            <article>
              <small>Technical Outlook</small>

              <h3>
                {readable(result.technical_outlook)}
              </h3>

              <p>
                Latest price:{" "}
                {typeof price?.price === "number"
                  ? price.price.toFixed(2)
                  : "Unavailable"}
              </p>

              <p>
                RSI:{" "}
                {typeof price?.indicators?.rsi14 ===
                "number"
                  ? price.indicators.rsi14.toFixed(2)
                  : "Unavailable"}
              </p>

              <p>
                As of:{" "}
                {price?.as_of || "Unavailable"}
              </p>
            </article>

            <article>
              <small>News Sentiment</small>

              <h3>
                {readable(result.news_sentiment)}
              </h3>

              <p>
                Articles analyzed:{" "}
                {news?.count ?? 0}
              </p>

              <p>
                Sentiment score:{" "}
                {typeof news?.sentiment_score ===
                "number"
                  ? news.sentiment_score.toFixed(3)
                  : "Unavailable"}
              </p>
            </article>
          </div>

          {/* Technical evidence */}
          <div className="advisor-detail">
            <h3>Technical Evidence</h3>

            {price?.summary?.length ? (
              <ul>
                {price.summary.map(
                  (signal, index) => (
                    <li key={index}>{signal}</li>
                  )
                )}
              </ul>
            ) : (
              <p>
                No technical evidence available.
              </p>
            )}
          </div>

          {/* Phase 5: Financial report findings */}
          <div className="advisor-detail">
            <h3>Financial Report Findings</h3>

            {agents.report?.status === "ok" ? (
              <>
                <p className="advisor-report-answer">
                  {report?.answer}
                </p>

                {report?.sources?.length > 0 && (
                  <div className="advisor-sources">
                    <h4>Report Sources</h4>

                    {report.sources.map(
                      (source, index) => (
                        <p key={index}>
                          [Source{" "}
                          {source.source_number}]{" "}
                          {source.filename} — Page{" "}
                          {source.page_number}
                        </p>
                      )
                    )}
                  </div>
                )}
              </>
            ) : (
              <p>
                {agents.report?.status ===
                "skipped"
                  ? "Report analysis was not requested."
                  : agents.report?.status ===
                      "no_data"
                    ? "No indexed report evidence was found."
                    : agents.report?.error ||
                      "Report analysis unavailable."}
              </p>
            )}
          </div>

          {/* Phase 7: Gemini AI Research Synthesis */}
          <div className="advisor-detail advisor-ai-synthesis">
            <h3>Gemini AI Research Synthesis</h3>

            {synthesis?.status === "ok" &&
            synthesisData ? (
              <>
                <div className="advisor-ai-summary">
                  <h4>Executive Summary</h4>
                  <p>
                    {synthesisData.executive_summary}
                  </p>
                </div>

                <ResearchList
                  title="Supporting Evidence"
                  items={
                    synthesisData.supporting_evidence
                  }
                  emptyMessage="No supporting evidence provided."
                />

                <ResearchList
                  title="Conflicting Signals"
                  items={
                    synthesisData.conflicting_signals
                  }
                  emptyMessage="No conflicting signals identified."
                />

                <ResearchList
                  title="Key Risks"
                  items={synthesisData.key_risks}
                  emptyMessage="No specific risks identified in the available evidence."
                />

                <ResearchList
                  title="Evidence Gaps"
                  items={synthesisData.evidence_gaps}
                  emptyMessage="No additional evidence gaps reported."
                />
              </>
            ) : synthesis?.status === "skipped" ? (
              <p>
                AI synthesis was not requested.
                Enable Gemini AI Synthesis and
                run the analysis to generate a summary.
              </p>
            ) : synthesis?.status ===
              "insufficient_data" ? (
              <p className="advisor-warning">
                Insufficient agent evidence is
                available for AI synthesis.
              </p>
            ) : synthesis?.status === "error" ? (
              <p className="advisor-warning" role="alert">
                {synthesis.error ||
                  "Gemini AI synthesis is currently unavailable."}
                {" "}
                Other research results remain available.
              </p>
            ) : (
              <p>
                No AI synthesis result is available.
              </p>
            )}
          </div>

          {/* Agent execution status */}
          <div className="advisor-detail">
            <h3>Agent Status</h3>

            <div className="advisor-status">
              {[
                "price",
                "news",
                "report",
              ].map((name) => (
                <div key={name}>
                  <span>
                    {readable(name)} Agent
                  </span>

                  <strong>
                    {readable(
                      agents[name]?.status
                    )}
                  </strong>
                </div>
              ))}

              <div>
                <span>
                  Gemini Synthesis
                </span>

                <strong>
                  {readable(
                    synthesis?.status
                  )}
                </strong>
              </div>
            </div>

            {Object.entries(agents).map(
              ([name, agent]) =>
                agent?.error ? (
                  <p
                    key={name}
                    className="advisor-warning"
                  >
                    {readable(name)}:{" "}
                    {agent.error}
                  </p>
                ) : null
            )}
          </div>

          <p className="advisor-disclaimer">
            {result.disclaimer}
          </p>
        </div>
      )}
    </section>
  );
}
