# AgentVest

LLM-based multi-agent stock analysis and investment research platform.

## Phase 1–2 scope
React UI + FastAPI API, health check, ticker validation and tests. No real market data or Gemini integration yet.

## Backend (Windows PowerShell)
```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn app.main:app --reload
```
API: http://127.0.0.1:8000/docs

Run tests in another terminal with activated venv: `python -m pytest -q`.

## Frontend (new terminal)
```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```
UI: http://localhost:5173

## Roadmap
- Phase 3: Real market data and price agent
- Phase 4: News and sentiment
- Phase 5: RAG + Astra DB
- Phase 6: LangGraph + Gemini advisor
- Phase 7+: Authentication, history, reports, testing and deployment

Do not commit `.env` or API keys.
