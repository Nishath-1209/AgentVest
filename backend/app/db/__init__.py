"""Database package for AgentVest persistence."""
from app.db.database import (
    init_db,
    save_report_meta,
    list_reports,
    get_report_by_id,
    get_watchlist_symbols,
    add_watchlist_symbol,
    remove_watchlist_symbol,
    save_history_entry,
    list_history_entries,
    get_history_entry_by_id,
    delete_history_entry,
)

__all__ = [
    "init_db",
    "save_report_meta",
    "list_reports",
    "get_report_by_id",
    "get_watchlist_symbols",
    "add_watchlist_symbol",
    "remove_watchlist_symbol",
    "save_history_entry",
    "list_history_entries",
    "get_history_entry_by_id",
    "delete_history_entry",
]
