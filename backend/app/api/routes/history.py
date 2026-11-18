"""
Research History API routes backed by SQLite.
Stores completed multi-agent runs, Gemini executive summaries, and metadata.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.db.database import (
    save_history_entry,
    list_history_entries,
    get_history_entry_by_id,
    delete_history_entry,
)

router = APIRouter(
    prefix="/api/v1/history",
    tags=["Research History"],
)


class HistoryCreateRequest(BaseModel):
    id: str | None = None
    symbol: str = Field(min_length=1, max_length=20)
    created_at: str | None = None
    period: str = Field(default="1y")
    news_days: int = Field(default=7, ge=1, le=30)
    assessment: str = Field(default="insufficient_or_mixed_evidence")
    technical_outlook: str = Field(default="unavailable")
    news_sentiment: str = Field(default="insufficient_data")
    price_status: str = Field(default="unknown")
    news_status: str = Field(default="unknown")
    report_status: str = Field(default="unknown")
    synthesis_status: str = Field(default="unknown")
    summary_json: str | dict | list = Field(default="{}")
    full_result_json: str | dict | list = Field(default="{}")


@router.get("")
@router.get("/")
def get_history(ticker: str | None = Query(default=None)):
    """Retrieve saved research runs, optionally filtered by stock symbol."""
    return list_history_entries(ticker)


@router.get("/{history_id}")
def get_history_run(history_id: str):
    """Retrieve details for a single research run."""
    entry = get_history_entry_by_id(history_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Research history record not found")
    return entry


@router.post("")
@router.post("/")
def save_research_history(request: HistoryCreateRequest):
    """Save a completed multi-agent advisor research run."""
    entry_data = request.model_dump()
    saved = save_history_entry(entry_data)
    return saved


@router.delete("/{history_id}")
def delete_history_run(history_id: str):
    """Delete a research run from history."""
    deleted = delete_history_entry(history_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Research history record not found")
    return {"status": "ok", "id": history_id, "message": "Record deleted"}
