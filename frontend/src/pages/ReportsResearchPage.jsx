import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FileText,
  UploadCloud,
  FileCheck,
  HelpCircle,
  Sparkles,
  BookOpen,
  Info,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { api } from "../services/api";
import StatusBadge from "../components/common/StatusBadge";
import ErrorAlert from "../components/common/ErrorAlert";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import { useToast } from "../context/ToastContext";

export default function ReportsResearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTicker = searchParams.get("ticker") || "AAPL";
  const [ticker, setTicker] = useState(initialTicker);
  const [file, setFile] = useState(null);
  const [uploadedReport, setUploadedReport] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [question, setQuestion] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [qaResult, setQaResult] = useState(null);
  const [qaError, setQaError] = useState("");

  const [recentReports, setRecentReports] = useState([]);
  const { showToast } = useToast();

  // Load existing reports from backend API with fallback
  const loadReportsList = async () => {
    try {
      const data = await api.getReports();
      if (Array.isArray(data) && data.length > 0) {
        setRecentReports(data);
      } else {
        const saved = localStorage.getItem("agentvest_saved_reports");
        if (saved) setRecentReports(JSON.parse(saved));
      }
    } catch {
      const saved = localStorage.getItem("agentvest_saved_reports");
      if (saved) setRecentReports(JSON.parse(saved));
    }
  };

  useEffect(() => {
    loadReportsList();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    const cleanTicker = ticker.trim().toUpperCase();
    if (!cleanTicker) {
      setUploadError("Enter a valid stock ticker");
      return;
    }
    if (!file) {
      setUploadError("Please select a PDF file to upload");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setUploadError("PDF size exceeds the 25 MB limit");
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadedReport(null);
    setQaResult(null);

    const formData = new FormData();
    formData.append("ticker", cleanTicker);
    formData.append("file", file);

    try {
      const res = await api.uploadReport(formData);
      setUploadedReport(res);
      showToast(`Report indexed: ${res.filename} (${res.chunks_indexed} chunks)`, "success");

      // Reload reports list from API
      await loadReportsList();
    } catch (err) {
      setUploadError(err.message || "Failed to upload and index PDF report");
    } finally {
      setUploading(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setAnalyzing(true);
    setQaError("");
    setQaResult(null);

    try {
      const res = await api.askReportQuestion(
        uploadedReport?.ticker || ticker,
        question.trim(),
        uploadedReport?.report_id || null
      );
      setQaResult(res);
    } catch (err) {
      setQaError(err.message || "Failed to analyze question with Gemini RAG");
    } finally {
      setAnalyzing(false);
    }
  };

  const selectExistingReport = (rep) => {
    setTicker(rep.ticker);
    setUploadedReport(rep);
    setQaResult(null);
    setQaError("");
    showToast(`Loaded report: ${rep.filename}`, "info");
  };

  return (
    <div className="page-reports">
      {/* Page Header */}
      <div className="reports-page-header">
        <div>
          <span className="stock-view-eyebrow">RAG DOCUMENT RESEARCH</span>
          <h1 className="stock-view-symbol">Financial Report Intelligence</h1>
          <p className="section-subtitle">
            Upload 10-K, 10-Q, or earnings release PDFs. Chunks are embedded with Sentence Transformers, indexed in Astra DB, and queried using Google Gemini with ground-truth citations.
          </p>
        </div>
      </div>

      <div className="reports-grid-layout">
        {/* Left Column: Upload Form & Report Info */}
        <div className="reports-left-column">
          <div className="panel upload-panel-card">
            <h3>Upload Financial Report (PDF)</h3>

            <form onSubmit={handleUpload} className="report-upload-form">
              <div className="form-group">
                <label htmlFor="ticker-input">Target Stock Ticker</label>
                <input
                  id="ticker-input"
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="e.g. AAPL, MSFT, NVDA"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="pdf-file-input">Select Financial PDF (Max 25 MB)</label>
                <input
                  id="pdf-file-input"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] || null);
                    setUploadError("");
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="btn-upload-submit"
              >
                <UploadCloud size={18} />
                <span>{uploading ? "Extracting & Embedding Chunks..." : "Upload & Index Report"}</span>
              </button>
            </form>

            {uploadError && <ErrorAlert message={uploadError} />}

            {/* Uploaded Report Status Pill */}
            {uploadedReport && (
              <div className="uploaded-success-card">
                <div className="success-header">
                  <CheckCircle2 size={18} className="text-success" />
                  <h4>Report Ready for Q&A</h4>
                </div>
                <div className="report-meta-grid">
                  <div>
                    <small>Report ID</small>
                    <code>{uploadedReport.report_id?.slice(0, 16)}...</code>
                  </div>
                  <div>
                    <small>Filename</small>
                    <strong>{uploadedReport.filename}</strong>
                  </div>
                  <div>
                    <small>Pages Extracted</small>
                    <strong>{uploadedReport.pages_extracted}</strong>
                  </div>
                  <div>
                    <small>Astra DB Chunks</small>
                    <strong>{uploadedReport.chunks_indexed}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Previously Uploaded Reports Selection */}
          {recentReports.length > 0 && (
            <div className="panel recent-reports-card">
              <h3>Indexed Reports Library</h3>
              <p className="subtle-instruction">
                Select a previously indexed report to query immediately:
              </p>
              <div className="recent-reports-list">
                {recentReports.map((rep) => (
                  <div
                    key={rep.report_id}
                    className={`recent-report-row ${
                      uploadedReport?.report_id === rep.report_id ? "selected" : ""
                    }`}
                    onClick={() => selectExistingReport(rep)}
                  >
                    <div className="rep-info">
                      <span className="rep-ticker">{rep.ticker}</span>
                      <span className="rep-name">{rep.filename}</span>
                    </div>
                    <span className="rep-badge">
                      {rep.chunks_indexed} chunks
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Q&A Interface & Evidence Citations */}
        <div className="reports-right-column">
          <div className="panel qa-panel-card">
            <div className="panel-header-row">
              <h3>Ask Question About Financial Report</h3>
              {uploadedReport && (
                <StatusBadge
                  status="ok"
                  label={`Active: ${uploadedReport.ticker}`}
                  size="sm"
                />
              )}
            </div>

            <form onSubmit={handleAskQuestion} className="report-qa-form">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What was the total revenue growth? What are the key risk factors cited in the report?"
                rows={3}
                required
              />
              <button
                type="submit"
                disabled={analyzing || (!uploadedReport && !ticker)}
                className="btn-qa-submit"
              >
                <Sparkles size={16} />
                <span>{analyzing ? "Searching Chunks & Synthesizing..." : "Query with Gemini RAG"}</span>
              </button>
            </form>

            {qaError && <ErrorAlert message={qaError} />}

            {analyzing && (
              <div className="qa-loading-container">
                <LoadingSkeleton lines={4} />
                <p className="loading-helper-text">
                  Retrieving relevant vector chunks from Astra DB and generating grounded response...
                </p>
              </div>
            )}

            {qaResult && !analyzing && (
              <div className="qa-results-container">
                <div className="qa-answer-card">
                  <div className="answer-header">
                    <Sparkles size={18} className="sparkle-icon" />
                    <h4>Grounded AI Answer</h4>
                  </div>
                  <div className="answer-body-text">{qaResult.answer}</div>
                </div>

                {/* Evidence Citations */}
                {qaResult.sources?.length > 0 && (
                  <div className="qa-sources-section">
                    <h4>Retrieved Source Citations ({qaResult.sources.length})</h4>
                    <div className="sources-list">
                      {qaResult.sources.map((src, idx) => (
                        <div key={idx} className="source-citation-card">
                          <div className="source-citation-header">
                            <span className="citation-pill">
                              [Source {src.source_number}]
                            </span>
                            <span className="citation-meta">
                              {src.filename} · Page {src.page_number}
                            </span>
                            {src.similarity != null && (
                              <span className="citation-similarity">
                                Similarity: {Number(src.similarity).toFixed(3)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
