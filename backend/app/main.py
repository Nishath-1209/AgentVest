from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

# Import API routers
from app.api.routes.health import router as health_router
from app.api.routes.stocks import router as stocks_router
from app.api.routes.news import router as news_router
from app.api.routes.reports import router as reports_router
from app.api.routes.advisor import router as advisor_router
from app.api.routes.watchlist import router as watchlist_router
from app.api.routes.history import router as history_router


# Initialize FastAPI
app = FastAPI(
    title=settings.app_name,
    description=(
        "AgentVest - Multi-Agent Investment Research Platform. "
        "Complete End-to-End Architecture: Stock Analysis, "
        "FinBERT News Sentiment, Astra DB RAG Reports, "
        "Multi-Agent Orchestration, and Gemini Research Synthesis."
    ),
    version="1.0.0",
)


# Configure CORS safely
raw_origins = [orig.strip() for orig in settings.frontend_origin.split(",") if orig.strip()]
valid_origins = [o for o in raw_origins if "*" not in o or o == "*"]
allowed_origins = list(
    set(
        valid_origins
        + [
            "https://agent-vest.vercel.app",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
        ]
    )
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Register API routes
app.include_router(health_router)
app.include_router(stocks_router)
app.include_router(news_router)
app.include_router(reports_router)
app.include_router(advisor_router)
app.include_router(watchlist_router)
app.include_router(history_router)


# Root endpoint
@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to AgentVest API",
        "version": "1.0.0",
        "status": "running",
        "features": {
            "stock_price_analysis": "available",
            "financial_news_analysis": "available",
            "financial_report_analysis": "available",
            "multi_agent_advisor": "available",
            "gemini_research_synthesis": "available",
            "watchlist": "available",
            "research_history": "available",
        },
        "documentation": "/docs",
    }
