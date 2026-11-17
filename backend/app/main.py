from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes.health import router as health_router
from app.api.routes.stocks import router as stocks_router

app = FastAPI(title=settings.app_name, version="0.3.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set([settings.frontend_origin, "http://localhost:5173", "http://127.0.0.1:5173"])),
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)
app.include_router(health_router)
app.include_router(stocks_router)

@app.get("/")
def root():
    return {"message": "Welcome to AgentVest API", "docs": "/docs", "version": "0.3.0"}
