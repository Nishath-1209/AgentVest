# AgentVest Phase 3 — Windows setup

This archive is a complete Phase 1–3 project based on the Phase 2 starter. Back up any local changes before copying files over your existing project. It does not include `.env` secrets, virtual environments, or node_modules.

## Backend terminal (from AgentVest/backend)

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m pytest -v
python -m uvicorn app.main:app --reload
```

If you do not have a virtual environment, create one first: `py -3.11 -m venv .venv`.

## Frontend terminal (from AgentVest/frontend)

```powershell
npm install
npm run dev
```

Ensure `backend/.env` contains `FRONTEND_ORIGIN=http://localhost:5173` and `frontend/.env` contains `VITE_API_BASE_URL=http://127.0.0.1:8000`.

Visit `http://127.0.0.1:8000/health`, `http://127.0.0.1:8000/docs`, and `http://localhost:5173`. Search AAPL or RELIANCE.NS. The backend uses yfinance and requires internet access; market data can be delayed, missing, or rate-limited.

## Endpoints

- `GET /health`
- `GET /api/v1/stocks/AAPL?period=1y`
- `GET /api/v1/stocks/RELIANCE.NS?period=6mo`

Periods: `6mo`, `1y`, `2y`, `5y`. Invalid ticker/period: HTTP 422. Provider failure/no data: HTTP 503.

## Design notes

- Historical prices are adjusted (auto_adjust=True), so don't assume they match unadjusted exchange prints.
- Market data timestamps are dates of the most recent daily bar; do not label these real-time.
- Currency is deliberately not guessed from ticker suffix; `currency` is `unknown` until verified metadata is integrated.
- RSI uses Wilder smoothing with 14-period seed. SMA20/SMA50 have warm-up nulls. MACD uses EMA12/26 and EMA9 signal. Bands use SMA20 ± 2 population standard deviations. Annualized volatility uses daily return standard deviation × sqrt(252).
- Tests use synthetic prices and do not require network access.
- This is a deterministic technical analysis module, not a Gemini agent yet. Phase 4 will introduce news analysis.
