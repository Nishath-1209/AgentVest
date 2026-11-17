from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "AgentVest API"
    environment: str = "development"
    frontend_origin: str = "http://localhost:5173"
    gemini_api_key: str = ""
    finnhub_api_key: str = ""
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
