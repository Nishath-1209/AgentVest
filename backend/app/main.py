
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes.advisor import router as advisor_router
# Import API routers
from app.api.routes.health import router as health_router
from app.api.routes.stocks import router as stocks_router
from app.api.routes.news import router as news_router
from app.api.routes.reports import router as reports_router


# Initialize FastAPI
app = FastAPI(
    title=settings.app_name,
    description=(
        "AgentVest - Multi-Agent Investment Research Platform. "
        "Phase 3: Stock Price Analysis. "
        "Phase 4: Financial News Sentiment Analysis. "
        "Phase 5: Financial Report Analysis using RAG, "
        "Astra DB, Sentence Transformers, and Google Gemini."
    ),
    version="0.5.0",
)


# Configure CORS
allowed_origins = list(
    set(
        [
            settings.frontend_origin,
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# Register API routes
app.include_router(health_router)
app.include_router(stocks_router)
app.include_router(news_router)
app.include_router(reports_router)
app.include_router(advisor_router)

# Root endpoint
@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to AgentVest API",
        "version": "0.6.0",
        "status": "running",
        "features": {
            "stock_price_analysis": "available",
            "financial_news_analysis": "available",
            "financial_report_analysis": "beta",
            "multi_agent_advisor": "beta",
        },
        "documentation": "/docs",
    }
