from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_watchlist_crud():
    # 1. Fetch watchlist
    res = client.get("/api/v1/watchlist")
    assert res.status_code == 200
    assert "watchlist" in res.json()
    assert isinstance(res.json()["watchlist"], list)

    # 2. Add symbol
    add_res = client.post("/api/v1/watchlist", json={"symbol": "TSLA"})
    assert add_res.status_code == 200
    assert "TSLA" in add_res.json()["watchlist"]

    # 3. Validation failure for invalid symbol
    bad_res = client.post("/api/v1/watchlist", json={"symbol": "bad symbol $$"})
    assert bad_res.status_code == 422

    # 4. Remove symbol
    del_res = client.delete("/api/v1/watchlist/TSLA")
    assert del_res.status_code == 200
    assert "TSLA" not in del_res.json()["watchlist"]


def test_history_crud():
    sample_run = {
        "id": "test-run-999",
        "symbol": "NVDA",
        "period": "1y",
        "news_days": 14,
        "assessment": "positive_alignment",
        "technical_outlook": "bullish",
        "news_sentiment": "positive",
        "price_status": "ok",
        "news_status": "ok",
        "report_status": "skipped",
        "synthesis_status": "ok",
        "summary_json": {
            "executive_summary": "Strong momentum and positive earnings sentiment.",
            "supporting_evidence": ["Price > SMA50", "High sentiment score"],
            "conflicting_signals": [],
            "key_risks": ["Valuation multiples"],
            "evidence_gaps": []
        },
        "full_result_json": {"symbol": "NVDA"}
    }

    # 1. Save run
    save_res = client.post("/api/v1/history", json=sample_run)
    assert save_res.status_code == 200
    assert save_res.json()["id"] == "test-run-999"
    assert save_res.json()["symbol"] == "NVDA"

    # 2. List history
    list_res = client.get("/api/v1/history")
    assert list_res.status_code == 200
    assert any(h["id"] == "test-run-999" for h in list_res.json())

    # 3. Filter history by ticker
    filter_res = client.get("/api/v1/history?ticker=NVDA")
    assert filter_res.status_code == 200
    assert all(h["symbol"] == "NVDA" for h in filter_res.json())

    # 4. Get specific run
    get_res = client.get("/api/v1/history/test-run-999")
    assert get_res.status_code == 200
    assert get_res.json()["assessment"] == "positive_alignment"

    # 5. Delete run
    del_res = client.delete("/api/v1/history/test-run-999")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "ok"

    # 6. Verify 404 after deletion
    not_found_res = client.get("/api/v1/history/test-run-999")
    assert not_found_res.status_code == 404
