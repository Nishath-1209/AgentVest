import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  History,
  Trash2,
  BrainCircuit,
  Search,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
} from "lucide-react";
import { api } from "../services/api";
import StatusBadge from "../components/common/StatusBadge";
import EmptyState from "../components/common/EmptyState";
import { useToast } from "../context/ToastContext";

export default function ResearchHistoryPage() {
  const [history, setHistory] = useState([]);
  const [filterTicker, setFilterTicker] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const { showToast } = useToast();

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Failed to load history from API:", err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await api.deleteHistory(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      showToast("Research run deleted", "info");
    } catch {
      showToast("Failed to delete record", "error");
    }
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const filtered = filterTicker.trim()
    ? history.filter((h) =>
        h.symbol?.toUpperCase().includes(filterTicker.trim().toUpperCase())
      )
    : history;

  return (
    <div className="page-history">
      {/* Header */}
      <div className="stock-view-header">
        <div>
          <span className="stock-view-eyebrow">PERSISTENT RESEARCH LOGS</span>
          <h1 className="stock-view-symbol">Research History</h1>
          <p className="section-subtitle">
            Saved multi-agent research runs, Gemini executive summaries, and historical agent statuses.
          </p>
        </div>

        {/* Filter Input */}
        <div className="history-filter-box">
          <Search size={16} />
          <input
            type="text"
            value={filterTicker}
            onChange={(e) => setFilterTicker(e.target.value)}
            placeholder="Filter by ticker (e.g. AAPL)..."
          />
        </div>
      </div>

      {loading ? (
        <div className="panel">
          <p className="subtle-instruction">Loading research history...</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title={filterTicker ? "No Matching Records" : "No Past Research Runs"}
          description={
            filterTicker
              ? `No saved research runs match '${filterTicker}'.`
              : "Completed multi-agent analyses will be automatically recorded here."
          }
          actionLabel="Launch AI Advisor"
          actionTo="/advisor"
        />
      ) : (
        <div className="history-list-cards">
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            let summary = null;
            try {
              summary =
                typeof item.summary_json === "string"
                  ? JSON.parse(item.summary_json)
                  : item.summary_json;
            } catch {
              summary = null;
            }

            return (
              <div
                key={item.id}
                className={`panel history-card ${isExpanded ? "expanded" : ""}`}
                onClick={() => toggleExpand(item.id)}
              >
                <div className="history-card-header">
                  <div className="history-card-title-group">
                    <span className="history-symbol">{item.symbol}</span>
                    <span className="history-date">
                      <Calendar size={13} />
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                    <span className="history-period-pill">
                      {item.period} · {item.news_days}d news
                    </span>
                  </div>

                  <div className="history-card-badges-row">
                    <StatusBadge
                      status={item.assessment}
                      label={item.assessment?.replace(/_/g, " ")}
                      size="sm"
                    />
                    <StatusBadge
                      status={item.synthesis_status}
                      label={`Gemini: ${item.synthesis_status}`}
                      size="sm"
                    />

                    <Link
                      to={`/advisor?ticker=${item.symbol}`}
                      className="btn-history-re-run"
                      onClick={(e) => e.stopPropagation()}
                      title="Re-run in Advisor"
                    >
                      <BrainCircuit size={15} />
                      <span>Advisor</span>
                    </Link>

                    <button
                      type="button"
                      className="btn-history-delete"
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Delete record"
                    >
                      <Trash2 size={15} />
                    </button>

                    <div className="expand-indicator">
                      {isExpanded ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Preview / Executive Summary */}
                {summary?.executive_summary && (
                  <p className="history-preview-text">
                    {summary.executive_summary}
                  </p>
                )}

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="history-expanded-body">
                    <div className="expanded-agent-row">
                      <div className="expanded-stat">
                        <small>Technical Outlook</small>
                        <strong>{item.technical_outlook}</strong>
                      </div>
                      <div className="expanded-stat">
                        <small>News Sentiment</small>
                        <strong>{item.news_sentiment}</strong>
                      </div>
                      <div className="expanded-stat">
                        <small>Price Agent</small>
                        <strong>{item.price_status}</strong>
                      </div>
                      <div className="expanded-stat">
                        <small>News Agent</small>
                        <strong>{item.news_status}</strong>
                      </div>
                      <div className="expanded-stat">
                        <small>Report Agent</small>
                        <strong>{item.report_status}</strong>
                      </div>
                    </div>

                    {summary && (
                      <div className="expanded-synthesis-details">
                        {summary.supporting_evidence?.length > 0 && (
                          <div className="detail-bullet-group">
                            <h5>Supporting Evidence</h5>
                            <ul>
                              {summary.supporting_evidence.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {summary.key_risks?.length > 0 && (
                          <div className="detail-bullet-group">
                            <h5>Key Risks</h5>
                            <ul>
                              {summary.key_risks.map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
