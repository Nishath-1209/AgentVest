# AgentVest Phase 4 — Financial News Intelligence

## Upgrade strategy
This ZIP is the Phase 3 project plus the Phase 4 additions. Back up your existing working folder first. Your Phase 3 stock analysis routes and charts are preserved.

## Windows PowerShell — backend
```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```
Set `FINNHUB_API_KEY=...` in `backend/.env`. Do not commit it. Leave Gemini blank. The first FinBERT inference downloads model weights and can be slow; allow disk space and internet access.

```powershell
python -m pytest -v
python -m uvicorn app.main:app --reload
```

## Windows PowerShell — frontend (second terminal)
```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```
Open http://localhost:5173 and search AAPL. The stock analysis runs first; news then loads. For direct testing open http://127.0.0.1:8000/api/v1/news/AAPL?days=7.

## Notes
- Finnhub company news is North America focused. .NS and .BO symbols are intentionally rejected by the news endpoint, while the existing price analysis still supports them.
- Scores are simple headline-label counts: (positive - negative) / total, not calibrated market forecasts.
- FinBERT is run locally, with no Gemini dependency. Check model licensing before commercial use.
- Tests mock Finnhub and FinBERT and therefore do not verify live API access.
- Finnhub may rate limit or restrict access by plan; check your account's permissions.
