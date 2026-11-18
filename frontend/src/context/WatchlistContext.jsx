import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { useToast } from "./ToastContext";

const WatchlistContext = createContext();

export function WatchlistProvider({ children }) {
  const [watchlist, setWatchlist] = useState(["AAPL", "MSFT", "GOOGL", "NVDA"]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    const fetchWatchlist = async () => {
      setLoading(true);
      try {
        const res = await api.getWatchlist();
        if (active) {
          const items = Array.isArray(res) ? res : (res?.watchlist || []);
          if (items.length > 0) {
            setWatchlist(items);
          }
        }
      } catch (err) {
        console.warn("Could not load watchlist from API, using default/localStorage:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchWatchlist();
    return () => { active = false; };
  }, []);

  const addToWatchlist = useCallback(async (symbol) => {
    const sym = symbol.trim().toUpperCase();
    if (!sym) return;

    if (watchlist.includes(sym)) {
      showToast(`${sym} is already in your watchlist`, "info");
      return;
    }

    try {
      await api.addWatchlist(sym);
      setWatchlist((prev) => [...prev, sym]);
      showToast(`${sym} added to watchlist`, "success");
    } catch {
      setWatchlist((prev) => [...prev, sym]);
      showToast(`${sym} added to watchlist (local)`, "success");
    }
  }, [watchlist, showToast]);

  const removeFromWatchlist = useCallback(async (symbol) => {
    const sym = symbol.trim().toUpperCase();
    try {
      await api.removeWatchlist(sym);
      setWatchlist((prev) => prev.filter((s) => s !== sym));
      showToast(`${sym} removed from watchlist`, "info");
    } catch {
      setWatchlist((prev) => prev.filter((s) => s !== sym));
      showToast(`${sym} removed from watchlist (local)`, "info");
    }
  }, [showToast]);

  const isSaved = useCallback((symbol) => {
    if (!symbol) return false;
    return watchlist.includes(symbol.trim().toUpperCase());
  }, [watchlist]);

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        loading,
        addToWatchlist,
        removeFromWatchlist,
        isSaved,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error("useWatchlist must be used within WatchlistProvider");
  }
  return context;
}
