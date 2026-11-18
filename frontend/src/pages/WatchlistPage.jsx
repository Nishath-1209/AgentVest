import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  Plus,
  Trash2,
  TrendingUp,
  BrainCircuit,
  Search,
  ExternalLink,
  Activity,
  Layers,
} from "lucide-react";
import { useWatchlist } from "../context/WatchlistContext";
import { api } from "../services/api";
import StatusBadge from "../components/common/StatusBadge";
import EmptyState from "../components/common/EmptyState";
import LoadingSkeleton from "../components/common/LoadingSkeleton";

const fmt = (val, d = 2) =>
  val == null
    ? "N/A"
    : Number(val).toLocaleString(undefined, { maximumFractionDigits: d });

export default function WatchlistPage() {
  const { watchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const [newTicker, setNewTicker] = useState("");
  const [stocksData, setStocksData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchPrices = async () => {
      if (watchlist.length === 0) {
        setStocksData({});
        return;
      }
      setLoading(true);
      const dataMap = {};
      await Promise.allSettled(
        watchlist.map(async (sym) => {
          try {
            const res = await api.getStockAnalysis(sym, "1y");
            if (active) dataMap[sym] = res;
          } catch {
            if (active) dataMap[sym] = null;
          }
        })
      );
      if (active) {
        setStocksData(dataMap);
        setLoading(false);
      }
    };

    fetchPrices();
    return () => { active = false; };
  }, [watchlist]);

  const handleAdd = (e) => {
    e.preventDefault();
    const clean = newTicker.trim().toUpperCase();
    if (clean) {
      addToWatchlist(clean);
      setNewTicker("");
    }
  };

  return (
    <div className="page-watchlist">
      {/* Page Header */}
      <div className="stock-view-header">
        <div>
          <span className="stock-view-eyebrow">PORTFOLIO TRACKING</span>
          <h1 className="stock-view-symbol">My Research Watchlist</h1>
          <p className="section-subtitle">
            Monitored stock tickers with live price movements, trend classifications, and one-click deep research links.
          </p>
        </div>

        {/* Add Ticker Form */}
        <form onSubmit={handleAdd} className="watchlist-add-form">
          <input
            type="text"
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
            placeholder="Add ticker (e.g. MSFT)..."
            required
            maxLength={15}
          />
          <button type="submit">
            <Plus size={16} />
            <span>Add</span>
          </button>
        </form>
      </div>

      {watchlist.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Your Watchlist is Empty"
          description="Add tickers to easily track prices, technical trends, and launch research workflows."
          actionLabel="Analyze Popular Stocks"
          actionTo="/stocks"
        />
      ) : (
        <div className="watchlist-table-container panel">
          <table className="watchlist-data-table">
            <thead>
              <tr>
                <th>Ticker Symbol</th>
                <th>Last Close</th>
                <th>Daily Change</th>
                <th>1Y Return</th>
                <th>Volatility</th>
                <th>Trend</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((sym) => {
                const stock = stocksData[sym];
                const isLoaded = Boolean(stock);
                const isPositive = (stock?.change || 0) >= 0;

                return (
                  <tr key={sym} className="watchlist-table-row">
                    <td>
                      <div className="table-symbol-cell">
                        <strong>{sym}</strong>
                        {stock?.as_of && (
                          <span className="table-date-sub">{stock.as_of}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {isLoaded ? `$${fmt(stock.price)}` : loading ? "Loading..." : "N/A"}
                    </td>
                    <td>
                      {isLoaded ? (
                        <span
                          className={`change-cell ${
                            isPositive ? "positive" : "negative"
                          }`}
                        >
                          {isPositive ? "+" : ""}
                          {fmt(stock.change)} ({isPositive ? "+" : ""}
                          {fmt(stock.change_percent)}%)
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td>
                      {isLoaded ? (
                        <span
                          className={`change-cell ${
                            (stock.period_return_percent || 0) >= 0
                              ? "positive"
                              : "negative"
                          }`}
                        >
                          {fmt(stock.period_return_percent)}%
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td>
                      {isLoaded
                        ? `${fmt(stock.annualized_volatility_percent)}%`
                        : "N/A"}
                    </td>
                    <td>
                      {isLoaded ? (
                        <StatusBadge status={stock.trend} size="sm" />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="text-right">
                      <div className="table-action-btns">
                        <Link
                          to={`/stocks?ticker=${sym}`}
                          className="btn-table-action"
                          title="View Stock Analysis"
                        >
                          <TrendingUp size={15} />
                          <span>Technicals</span>
                        </Link>
                        <Link
                          to={`/advisor?ticker=${sym}`}
                          className="btn-table-action btn-advisor"
                          title="Run Multi-Agent Advisor"
                        >
                          <BrainCircuit size={15} />
                          <span>Advisor</span>
                        </Link>
                        <button
                          type="button"
                          className="btn-table-delete"
                          onClick={() => removeFromWatchlist(sym)}
                          title="Remove from Watchlist"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
