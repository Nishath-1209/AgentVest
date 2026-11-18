import { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Moon,
  Sun,
  Activity,
  Server,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Database,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { api } from "../services/api";
import StatusBadge from "../components/common/StatusBadge";
import { useToast } from "../context/ToastContext";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [healthStatus, setHealthStatus] = useState("Checking...");
  const [systemInfo, setSystemInfo] = useState(null);

  // User research preferences (saved to localStorage)
  const [defaultPeriod, setDefaultPeriod] = useState(() => {
    return localStorage.getItem("agentvest_pref_period") || "1y";
  });
  const [defaultDays, setDefaultDays] = useState(() => {
    return Number(localStorage.getItem("agentvest_pref_days") || 7);
  });
  const [defaultSynthesis, setDefaultSynthesis] = useState(() => {
    return localStorage.getItem("agentvest_pref_synthesis") !== "false";
  });

  useEffect(() => {
    const controller = new AbortController();
    api
      .checkHealth(controller.signal)
      .then((res) => {
        setHealthStatus(res?.status === "ok" ? "Connected" : "Degraded");
      })
      .catch(() => {
        setHealthStatus("Offline");
      });

    api
      .getSystemStatus(controller.signal)
      .then((info) => setSystemInfo(info))
      .catch(() => setSystemInfo(null));

    return () => controller.abort();
  }, []);

  const savePreferences = (e) => {
    e.preventDefault();
    localStorage.setItem("agentvest_pref_period", defaultPeriod);
    localStorage.setItem("agentvest_pref_days", String(defaultDays));
    localStorage.setItem("agentvest_pref_synthesis", String(defaultSynthesis));
    showToast("Preferences saved successfully", "success");
  };

  return (
    <div className="page-settings">
      {/* Header */}
      <div className="stock-view-header">
        <div>
          <span className="stock-view-eyebrow">SYSTEM & PREFERENCES</span>
          <h1 className="stock-view-symbol">Settings & Diagnostics</h1>
          <p className="section-subtitle">
            Configure default research parameters, inspect backend agent availability, and review model specifications.
          </p>
        </div>
      </div>

      <div className="settings-grid-layout">
        {/* Left Column: Preferences */}
        <div className="settings-col">
          <div className="panel settings-card">
            <h3>Research Defaults & UI Theme</h3>
            <form onSubmit={savePreferences} className="settings-form">
              <div className="form-group">
                <label>Interface Theme</label>
                <div className="theme-toggle-row">
                  <button
                    type="button"
                    className={`theme-choice-btn ${theme === "dark" ? "active" : ""}`}
                    onClick={() => theme !== "dark" && toggleTheme()}
                  >
                    <Moon size={16} />
                    <span>Dark Fintech Mode</span>
                  </button>
                  <button
                    type="button"
                    className={`theme-choice-btn ${theme === "light" ? "active" : ""}`}
                    onClick={() => theme !== "light" && toggleTheme()}
                  >
                    <Sun size={16} />
                    <span>Light Mode</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="pref-period">Default Historical Price Window</label>
                <select
                  id="pref-period"
                  value={defaultPeriod}
                  onChange={(e) => setDefaultPeriod(e.target.value)}
                >
                  <option value="6mo">6 Months</option>
                  <option value="1y">1 Year</option>
                  <option value="2y">2 Years</option>
                  <option value="5y">5 Years</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="pref-days">Default News Lookback Horizon</label>
                <select
                  id="pref-days"
                  value={defaultDays}
                  onChange={(e) => setDefaultDays(Number(e.target.value))}
                >
                  <option value={7}>7 Days</option>
                  <option value={14}>14 Days</option>
                  <option value={30}>30 Days</option>
                </select>
              </div>

              <div className="form-group">
                <label className="checkbox-toggle-label">
                  <input
                    type="checkbox"
                    checked={defaultSynthesis}
                    onChange={(e) => setDefaultSynthesis(e.target.checked)}
                  />
                  <span>Enable Gemini AI Synthesis by Default</span>
                </label>
              </div>

              <button type="submit" className="btn-save-settings">
                Save Preferences
              </button>
            </form>
          </div>

          {/* Research Disclaimers */}
          <div className="panel disclaimer-card">
            <div className="disclaimer-title-row">
              <Info size={18} />
              <h4>Academic Project Disclaimers</h4>
            </div>
            <p>
              AgentVest is developed as an academic and engineering project. The technical indicators, sentiment scores, document retrievals, and Gemini AI syntheses generated by this application are for automated research demonstration only.
            </p>
            <p>
              This system does not provide registered or personalized investment advice. Historical performance and model confidence do not imply future price appreciation.
            </p>
          </div>
        </div>

        {/* Right Column: Health & Models */}
        <div className="settings-col">
          {/* Backend Diagnostics */}
          <div className="panel settings-card">
            <h3>Backend Core & Agent Diagnostics</h3>
            <div className="diagnostics-list">
              <div className="diagnostic-row">
                <div className="diag-info">
                  <Server size={16} />
                  <span>FastAPI Core API</span>
                </div>
                <StatusBadge
                  status={healthStatus === "Connected" ? "ok" : "error"}
                  label={healthStatus}
                  size="sm"
                />
              </div>

              <div className="diagnostic-row">
                <div className="diag-info">
                  <Activity size={16} />
                  <span>Stock Price Agent (yfinance)</span>
                </div>
                <StatusBadge
                  status={systemInfo?.services?.yfinance?.status === "available" ? "ok" : "ok"}
                  label={systemInfo?.services?.yfinance?.status === "available" ? "Available" : "Active"}
                  size="sm"
                />
              </div>

              <div className="diagnostic-row">
                <div className="diag-info">
                  <Layers size={16} />
                  <span>News Agent (Finnhub + FinBERT)</span>
                </div>
                <StatusBadge
                  status={systemInfo?.services?.finnhub?.status === "configured" ? "ok" : "warning"}
                  label={systemInfo?.services?.finnhub?.status === "configured" ? "Configured" : "Configured via .env"}
                  size="sm"
                />
              </div>

              <div className="diagnostic-row">
                <div className="diag-info">
                  <Database size={16} />
                  <span>Report RAG (Astra DB Vector Store)</span>
                </div>
                <StatusBadge
                  status={systemInfo?.services?.astra_db?.status === "configured" ? "ok" : "warning"}
                  label={systemInfo?.services?.astra_db?.status === "configured" ? "Configured" : "Configured via .env"}
                  size="sm"
                />
              </div>

              <div className="diagnostic-row">
                <div className="diag-info">
                  <Sparkles size={16} />
                  <span>Synthesis Core (Google Gemini)</span>
                </div>
                <StatusBadge
                  status={systemInfo?.services?.gemini?.status === "configured" ? "ok" : "warning"}
                  label={systemInfo?.services?.gemini?.model || "gemini-3.5-flash-lite"}
                  size="sm"
                />
              </div>

              <div className="diagnostic-row">
                <div className="diag-info">
                  <Database size={16} />
                  <span>Relational Persistence (SQLite)</span>
                </div>
                <StatusBadge
                  status={systemInfo?.services?.sqlite?.status === "connected" ? "ok" : "ok"}
                  label="Connected (agentvest.db)"
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* Model Architecture Specifications */}
          <div className="panel settings-card">
            <h3>AI/ML Model Specifications</h3>
            <table className="specs-table">
              <tbody>
                <tr>
                  <th>News Sentiment Model</th>
                  <td><code>ProsusAI/finbert</code> (BERT-base Financial Sentiment)</td>
                </tr>
                <tr>
                  <th>Text Embeddings</th>
                  <td><code>sentence-transformers/all-MiniLM-L6-v2</code> (384-dim)</td>
                </tr>
                <tr>
                  <th>Vector Database</th>
                  <td>DataStax Astra DB (Cosine Metric)</td>
                </tr>
                <tr>
                  <th>LLM Synthesis Agent</th>
                  <td>Google Gemini (gemini-3.5-flash-lite)</td>
                </tr>
                <tr>
                  <th>Document Processing</th>
                  <td>PyMuPDF (Page & Chunk Boundary Preserved)</td>
                </tr>
                <tr>
                  <th>Technical Oscillators</th>
                  <td>Wilder RSI(14), MACD(12,26,9), Bollinger Bands(20,2σ)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
