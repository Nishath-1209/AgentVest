from fastapi.testclient import TestClient
from app.main import app
from app.db.database import save_report_meta, list_reports, get_report_by_id

client = TestClient(app)


def test_save_and_list_reports_meta():
    meta = save_report_meta(
        report_id="test-rep-123",
        ticker="AAPL",
        filename="apple_q4_2025.pdf",
        pages_extracted=12,
        chunks_indexed=36,
    )
    assert meta["report_id"] == "test-rep-123"
    assert meta["ticker"] == "AAPL"

    # Query directly from DB
    reports = list_reports("AAPL")
    matching = [r for r in reports if r["report_id"] == "test-rep-123"]
    assert len(matching) == 1
    assert matching[0]["filename"] == "apple_q4_2025.pdf"

    # Query single report
    single = get_report_by_id("test-rep-123")
    assert single is not None
    assert single["pages_extracted"] == 12


def test_reports_api_endpoints():
    save_report_meta(
        report_id="api-test-456",
        ticker="MSFT",
        filename="msft_annual_2025.pdf",
        pages_extracted=20,
        chunks_indexed=60,
    )

    # Test GET /api/reports/list
    res1 = client.get("/api/reports/list")
    assert res1.status_code == 200
    assert isinstance(res1.json(), list)
    assert any(r["report_id"] == "api-test-456" for r in res1.json())

    # Test GET /api/reports?ticker=MSFT
    res2 = client.get("/api/reports?ticker=MSFT")
    assert res2.status_code == 200
    assert all(r["ticker"] == "MSFT" for r in res2.json())

    # Test GET /api/reports/{report_id}
    res3 = client.get("/api/reports/api-test-456")
    assert res3.status_code == 200
    assert res3.json()["filename"] == "msft_annual_2025.pdf"

    # Test non-existent report
    res4 = client.get("/api/reports/non-existent-id")
    assert res4.status_code == 404
