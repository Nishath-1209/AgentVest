"""
SQLite persistent storage for AgentVest.
Manages Watchlist, Report Metadata, and Research History.
Thread-safe with WAL mode and auto-initialization.
"""

from datetime import datetime, timezone
from pathlib import Path
import sqlite3
import os
import json

DEFAULT_DB_DIR = Path(__file__).resolve().parent.parent.parent / "data"
CUSTOM_DB_PATH = os.getenv("AGENTVEST_DB_PATH")

if CUSTOM_DB_PATH:
    DB_PATH = Path(CUSTOM_DB_PATH)
    DB_DIR = DB_PATH.parent
else:
    DB_DIR = DEFAULT_DB_DIR
    DB_PATH = DB_DIR / "agentvest.db"


def get_connection() -> sqlite3.Connection:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


def init_db():
    conn = get_connection()
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS watchlist (
                symbol TEXT PRIMARY KEY,
                added_at TEXT NOT NULL
            );
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS reports_meta (
                report_id TEXT PRIMARY KEY,
                ticker TEXT NOT NULL,
                filename TEXT NOT NULL,
                pages_extracted INTEGER NOT NULL,
                chunks_indexed INTEGER NOT NULL,
                uploaded_at TEXT NOT NULL
            );
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS research_history (
                id TEXT PRIMARY KEY,
                symbol TEXT NOT NULL,
                created_at TEXT NOT NULL,
                period TEXT NOT NULL,
                news_days INTEGER NOT NULL,
                assessment TEXT NOT NULL,
                technical_outlook TEXT NOT NULL,
                news_sentiment TEXT NOT NULL,
                price_status TEXT NOT NULL,
                news_status TEXT NOT NULL,
                report_status TEXT NOT NULL,
                synthesis_status TEXT NOT NULL,
                summary_json TEXT NOT NULL,
                full_result_json TEXT NOT NULL
            );
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_reports_ticker ON reports_meta(ticker);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_history_symbol ON research_history(symbol);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_history_created ON research_history(created_at DESC);")


# ==================== REPORTS META STORE ====================

def save_report_meta(report_id: str, ticker: str, filename: str, pages_extracted: int, chunks_indexed: int) -> dict:
    conn = get_connection()
    now = datetime.now(timezone.utc).isoformat()
    with conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO reports_meta 
            (report_id, ticker, filename, pages_extracted, chunks_indexed, uploaded_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (report_id, ticker.upper().strip(), filename, pages_extracted, chunks_indexed, now)
        )
    return {
        "report_id": report_id,
        "ticker": ticker.upper().strip(),
        "filename": filename,
        "pages_extracted": pages_extracted,
        "chunks_indexed": chunks_indexed,
        "uploaded_at": now
    }


def list_reports(ticker: str | None = None) -> list[dict]:
    conn = get_connection()
    if ticker:
        cursor = conn.execute(
            "SELECT * FROM reports_meta WHERE ticker = ? ORDER BY uploaded_at DESC",
            (ticker.upper().strip(),)
        )
    else:
        cursor = conn.execute("SELECT * FROM reports_meta ORDER BY uploaded_at DESC")
    
    return [dict(row) for row in cursor.fetchall()]


def get_report_by_id(report_id: str) -> dict | None:
    conn = get_connection()
    cursor = conn.execute("SELECT * FROM reports_meta WHERE report_id = ?", (report_id,))
    row = cursor.fetchone()
    return dict(row) if row else None


# ==================== WATCHLIST STORE ====================

def get_watchlist_symbols() -> list[str]:
    conn = get_connection()
    cursor = conn.execute("SELECT symbol FROM watchlist ORDER BY added_at DESC")
    rows = cursor.fetchall()
    if not rows:
        # Default seeds if empty
        defaults = ["AAPL", "MSFT", "GOOGL", "NVDA"]
        with conn:
            for s in defaults:
                conn.execute(
                    "INSERT OR IGNORE INTO watchlist (symbol, added_at) VALUES (?, ?)",
                    (s, datetime.now(timezone.utc).isoformat())
                )
        return defaults
    return [row["symbol"] for row in rows]


def add_watchlist_symbol(symbol: str) -> list[str]:
    conn = get_connection()
    sym = symbol.upper().strip()
    with conn:
        conn.execute(
            "INSERT OR IGNORE INTO watchlist (symbol, added_at) VALUES (?, ?)",
            (sym, datetime.now(timezone.utc).isoformat())
        )
    return get_watchlist_symbols()


def remove_watchlist_symbol(symbol: str) -> list[str]:
    conn = get_connection()
    sym = symbol.upper().strip()
    with conn:
        conn.execute("DELETE FROM watchlist WHERE symbol = ?", (sym,))
    return get_watchlist_symbols()


# ==================== RESEARCH HISTORY STORE ====================

def save_history_entry(entry: dict) -> dict:
    conn = get_connection()
    history_id = entry.get("id") or f"run_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    created_at = entry.get("created_at") or datetime.now(timezone.utc).isoformat()
    symbol = entry.get("symbol", "").upper().strip()

    summary_json = entry.get("summary_json") or "{}"
    if isinstance(summary_json, (dict, list)):
        summary_json = json.dumps(summary_json)

    full_result_json = entry.get("full_result_json") or "{}"
    if isinstance(full_result_json, (dict, list)):
        full_result_json = json.dumps(full_result_json)

    with conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO research_history (
                id, symbol, created_at, period, news_days, assessment,
                technical_outlook, news_sentiment, price_status, news_status,
                report_status, synthesis_status, summary_json, full_result_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                history_id,
                symbol,
                created_at,
                entry.get("period", "1y"),
                int(entry.get("news_days", 7)),
                entry.get("assessment", "insufficient_or_mixed_evidence"),
                entry.get("technical_outlook", "unavailable"),
                entry.get("news_sentiment", "insufficient_data"),
                entry.get("price_status", "unknown"),
                entry.get("news_status", "unknown"),
                entry.get("report_status", "unknown"),
                entry.get("synthesis_status", "unknown"),
                summary_json,
                full_result_json,
            )
        )

    return {
        "id": history_id,
        "symbol": symbol,
        "created_at": created_at,
        **entry,
        "summary_json": summary_json,
        "full_result_json": full_result_json,
    }


def list_history_entries(symbol: str | None = None) -> list[dict]:
    conn = get_connection()
    if symbol:
        cursor = conn.execute(
            "SELECT * FROM research_history WHERE symbol = ? ORDER BY created_at DESC LIMIT 50",
            (symbol.upper().strip(),)
        )
    else:
        cursor = conn.execute(
            "SELECT * FROM research_history ORDER BY created_at DESC LIMIT 50"
        )
    return [dict(row) for row in cursor.fetchall()]


def get_history_entry_by_id(history_id: str) -> dict | None:
    conn = get_connection()
    cursor = conn.execute("SELECT * FROM research_history WHERE id = ?", (history_id,))
    row = cursor.fetchone()
    return dict(row) if row else None


def delete_history_entry(history_id: str) -> bool:
    conn = get_connection()
    with conn:
        cursor = conn.execute("DELETE FROM research_history WHERE id = ?", (history_id,))
        return cursor.rowcount > 0


# Auto-initialize database schema on import
init_db()
