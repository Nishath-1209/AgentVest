
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

# Import API routers
from app.api.routes.health import router as health_router
from app.api.routes.stocks import router as stocks_router
from app.api.routes.news import router as news_router


# Initialize FastAPI
app = FastAPI(
    title=settings.app_name,
    description=(
        "AgentVest - Multi-Agent Investment Research Platform. "
        "Phase 3: Stock Price Analysis. "
        "Phase 4: Financial News Sentiment Analysis."
    ),
    version="0.4.0",
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
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)


# Register API routes
app.include_router(health_router)
app.include_router(stocks_router)
app.include_router(news_router)


# Root endpoint
@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to AgentVest API",
        "version": "0.4.0",
        "status": "running",
        "features": {
            "stock_price_analysis": "available",
            "financial_news_analysis": "available",
            "financial_report_analysis": "planned",
            "multi_agent_advisor": "planned",
        },
        "documentation": "/docs",
    }
