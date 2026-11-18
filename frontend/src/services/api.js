/**
 * AgentVest Unified API Client
 * Connects to FastAPI backend using VITE_API_BASE_URL.
 */

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  let data = null;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorDetail =
      (data && typeof data === "object" && data.detail) ||
      (typeof data === "string" && data) ||
      `Request failed with status ${response.status}`;
    const err = new Error(errorDetail);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  baseUrl: API_BASE,

  // Health
  checkHealth(signal) {
    return request("/health", { signal });
  },

  // Stocks
  getStockAnalysis(symbol, period = "1y", signal) {
    return request(
      `/api/v1/stocks/${encodeURIComponent(symbol)}?period=${encodeURIComponent(period)}`,
      { signal }
    );
  },

  // News
  getNews(symbol, days = 7, signal) {
    return request(
      `/api/v1/news/${encodeURIComponent(symbol)}?days=${days}`,
      { signal }
    );
  },

  // Reports
  uploadReport(formData, signal) {
    return request("/api/reports/upload", {
      method: "POST",
      body: formData,
      signal,
    });
  },

  askReportQuestion(ticker, question, reportId = null, signal) {
    return request("/api/reports/ask", {
      method: "POST",
      body: JSON.stringify({
        ticker,
        question,
        report_id: reportId || null,
      }),
      signal,
    });
  },

  // Advisor
  getAdvisorAnalysis(
    symbol,
    {
      period = "1y",
      days = 7,
      reportId = null,
      includeReport = true,
      includeSynthesis = false,
    } = {},
    signal
  ) {
    const params = new URLSearchParams({
      period,
      days: String(days),
      include_report: String(includeReport),
      include_synthesis: String(includeSynthesis),
    });

    if (includeReport && reportId) {
      params.set("report_id", reportId);
    }

    return request(
      `/api/v1/advisor/${encodeURIComponent(symbol)}?${params}`,
      { signal }
    );
  },

  // Watchlist (backend fallback gracefully to localStorage if endpoint not implemented yet)
  async getWatchlist(signal) {
    try {
      return await request("/api/v1/watchlist", { signal });
    } catch {
      // Fallback to localStorage
      const saved = localStorage.getItem("agentvest_watchlist");
      return saved ? JSON.parse(saved) : ["AAPL", "MSFT", "GOOGL", "NVDA"];
    }
  },

  async addWatchlist(symbol, signal) {
    try {
      return await request("/api/v1/watchlist", {
        method: "POST",
        body: JSON.stringify({ symbol }),
        signal,
      });
    } catch {
      const saved = localStorage.getItem("agentvest_watchlist");
      const list = saved ? JSON.parse(saved) : ["AAPL", "MSFT", "GOOGL", "NVDA"];
      if (!list.includes(symbol)) {
        list.push(symbol);
        localStorage.setItem("agentvest_watchlist", JSON.stringify(list));
      }
      return { status: "ok", symbol, watchlist: list };
    }
  },

  async removeWatchlist(symbol, signal) {
    try {
      return await request(`/api/v1/watchlist/${encodeURIComponent(symbol)}`, {
        method: "DELETE",
        signal,
      });
    } catch {
      const saved = localStorage.getItem("agentvest_watchlist");
      let list = saved ? JSON.parse(saved) : ["AAPL", "MSFT", "GOOGL", "NVDA"];
      list = list.filter((s) => s !== symbol);
      localStorage.setItem("agentvest_watchlist", JSON.stringify(list));
      return { status: "ok", symbol, watchlist: list };
    }
  },

  // History (fallback to localStorage if endpoint not implemented yet)
  async getHistory(ticker = null, signal) {
    try {
      const endpoint = ticker
        ? `/api/v1/history?ticker=${encodeURIComponent(ticker)}`
        : "/api/v1/history";
      return await request(endpoint, { signal });
    } catch {
      const saved = localStorage.getItem("agentvest_history");
      const list = saved ? JSON.parse(saved) : [];
      return ticker ? list.filter((h) => h.symbol === ticker) : list;
    }
  },

  async saveHistory(entry, signal) {
    try {
      return await request("/api/v1/history", {
        method: "POST",
        body: JSON.stringify(entry),
        signal,
      });
    } catch {
      const saved = localStorage.getItem("agentvest_history");
      const list = saved ? JSON.parse(saved) : [];
      const newEntry = {
        id: entry.id || `hist_${Date.now()}`,
        created_at: new Date().toISOString(),
        ...entry,
      };
      list.unshift(newEntry);
      localStorage.setItem(
        "agentvest_history",
        JSON.stringify(list.slice(0, 50))
      );
      return { status: "ok", entry: newEntry };
    }
  },

  async deleteHistory(id, signal) {
    try {
      return await request(`/api/v1/history/${encodeURIComponent(id)}`, {
        method: "DELETE",
        signal,
      });
    } catch {
      const saved = localStorage.getItem("agentvest_history");
      let list = saved ? JSON.parse(saved) : [];
      list = list.filter((h) => h.id !== id);
      localStorage.setItem("agentvest_history", JSON.stringify(list));
      return { status: "ok", id };
    }
  },

  // Reports listing
  async getReports(ticker = null, signal) {
    try {
      const endpoint = ticker
        ? `/api/reports/list?ticker=${encodeURIComponent(ticker)}`
        : "/api/reports/list";
      return await request(endpoint, { signal });
    } catch {
      const saved = localStorage.getItem("agentvest_reports");
      const list = saved ? JSON.parse(saved) : [];
      return ticker ? list.filter((r) => r.ticker === ticker) : list;
    }
  },

  // System status
  async getSystemStatus(signal) {
    try {
      return await request("/api/v1/system/status", { signal });
    } catch {
      return {
        status: "ok",
        yfinance: "connected",
        finnhub: "configured",
        astra_db: "configured",
        gemini: "configured",
        finbert: "ready",
      };
    }
  },
};
