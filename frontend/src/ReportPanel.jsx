
import { useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

export default function ReportPanel({ ticker = "" }) {
  const [symbol, setSymbol] = useState(ticker);
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  async function uploadReport(event) {
    event.preventDefault();
    setError("");
    setResult(null);

    const normalizedTicker = symbol.trim().toUpperCase();

    if (!normalizedTicker || !file) {
      setError("Enter a stock ticker and select a PDF.");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError("PDF must be smaller than 25 MB.");
      return;
    }

    setUploading(true);
    setReport(null);

    try {
      const formData = new FormData();
      formData.append("ticker", normalizedTicker);
      formData.append("file", file);

      const response = await fetch(
        `${API_BASE}/api/reports/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "PDF upload failed."
        );
      }

      setReport(data);
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function askQuestion(event) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!report?.report_id) {
      setError("Upload a financial report first.");
      return;
    }

    if (!question.trim()) {
      setError("Enter a question.");
      return;
    }

    setAnalyzing(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/reports/ask`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ticker: report.ticker,
            question: question.trim(),
            report_id: report.report_id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Report analysis failed."
        );
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <section className="report-panel">
      <h2>Financial Report Analysis</h2>
      <p>
        Upload a financial PDF and ask questions
        using Astra DB and Gemini AI.
      </p>

      <form onSubmit={uploadReport}>
        <label htmlFor="report-ticker">
          Stock Ticker
        </label>

        <input
          id="report-ticker"
          value={symbol}
          onChange={(event) => {
            setSymbol(event.target.value);
            setReport(null);
            setResult(null);
          }}
          placeholder="Example: AAPL"
          maxLength={20}
          required
        />

        <label htmlFor="report-file">
          Financial Report (PDF)
        </label>

        <input
          id="report-file"
          type="file"
          accept=".pdf,application/pdf"
          onChange={(event) => {
            setFile(event.target.files?.[0] || null);
            setReport(null);
            setResult(null);
          }}
          required
        />

        <button type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : "Upload Report"}
        </button>
      </form>

      {report && (
        <div className="report-success">
          <h3>Report Uploaded Successfully</h3>
          <p><strong>File:</strong> {report.filename}</p>
          <p><strong>Ticker:</strong> {report.ticker}</p>
          <p>
            <strong>Pages:</strong> {report.pages_extracted}
          </p>
          <p>
            <strong>Chunks:</strong> {report.chunks_indexed}
          </p>
        </div>
      )}

      {report && (
        <form onSubmit={askQuestion}>
          <h3>Ask a Question</h3>

          <textarea
            value={question}
            onChange={(event) =>
              setQuestion(event.target.value)
            }
            placeholder="What was the revenue growth?"
            rows={4}
            maxLength={2000}
            required
          />

          <button type="submit" disabled={analyzing}>
            {analyzing
              ? "Analyzing..."
              : "Analyze Financial Report"}
          </button>
        </form>
      )}

      {error && (
        <p className="report-error" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="report-answer">
          <h3>AI Analysis</h3>

          <div className="report-answer-text">
            {result.answer}
          </div>

          {result.sources?.length > 0 && (
            <div className="report-sources">
              <h4>Sources</h4>

              {result.sources.map((source, index) => (
                <div key={`${source.report_id}-${index}`}>
                  <strong>
                    Source {source.source_number}
                  </strong>
                  <p>File: {source.filename}</p>
                  <p>Page: {source.page_number}</p>
                  {typeof source.similarity === "number" && (
                    <p>
                      Similarity:{" "}
                      {source.similarity.toFixed(3)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
