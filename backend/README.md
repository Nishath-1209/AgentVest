---
title: AgentVest Backend API
emoji: 📈
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# AgentVest Multi-Agent Backend API

FastAPI backend powering the AgentVest investment research platform.

## Endpoints
- Health Check: `/health`
- System Status: `/api/v1/system/status`
- Interactive Swagger Documentation: `/docs`

## Configuration
Set environment variables under Space **Settings** -> **Variables and secrets**:
- `ENVIRONMENT=production`
- `FRONTEND_ORIGIN=https://*.vercel.app`
- `FINNHUB_API_KEY`
- `GEMINI_API_KEY`
- `ASTRA_DB_API_ENDPOINT`
- `ASTRA_DB_APPLICATION_TOKEN`
- `ASTRA_DB_KEYSPACE`
