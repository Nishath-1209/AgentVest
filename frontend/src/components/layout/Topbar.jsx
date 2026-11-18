import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sun, Moon, Menu, Bookmark, Sparkles } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useWatchlist } from "../../context/WatchlistContext";

export default function Topbar({ onToggleMobileNav }) {
  const [tickerQuery, setTickerQuery] = useState("");
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { watchlist } = useWatchlist();

  const handleSearch = (e) => {
    e.preventDefault();
    const clean = tickerQuery.trim().toUpperCase();
    if (!clean) return;
    setTickerQuery("");
    navigate(`/stocks?ticker=${encodeURIComponent(clean)}`);
  };

  const handleQuickTicker = (sym) => {
    navigate(`/stocks?ticker=${encodeURIComponent(sym)}`);
  };

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleMobileNav}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>

        {/* Global Search Form */}
        <form onSubmit={handleSearch} className="topbar-search-form">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            value={tickerQuery}
            onChange={(e) => setTickerQuery(e.target.value)}
            placeholder="Search ticker (e.g. AAPL, MSFT, RELIANCE.NS)..."
            className="topbar-search-input"
            aria-label="Global stock search"
          />
          <button type="submit" className="topbar-search-btn">
            Analyze
          </button>
        </form>

        {/* Quick Tickers */}
        <div className="quick-tickers-group">
          {["AAPL", "NVDA", "MSFT", "GOOGL"].map((sym) => (
            <button
              key={sym}
              type="button"
              className="quick-ticker-pill"
              onClick={() => handleQuickTicker(sym)}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      <div className="topbar-right">
        {/* Watchlist Counter Button */}
        <button
          type="button"
          className="topbar-action-btn"
          onClick={() => navigate("/watchlist")}
          title="View Watchlist"
        >
          <Bookmark size={18} />
          <span className="watchlist-count">{watchlist.length}</span>
        </button>

        {/* Flagship AI Advisor Quick Link */}
        <button
          type="button"
          className="topbar-advisor-btn"
          onClick={() => navigate("/advisor")}
          title="Run Multi-Agent Research"
        >
          <Sparkles size={16} />
          <span>Advisor</span>
        </button>

        {/* Dark/Light Theme Toggle */}
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={
            theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
          }
          title={theme === "dark" ? "Light theme" : "Dark theme"}
        >
          {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
        </button>
      </div>
    </header>
  );
}
