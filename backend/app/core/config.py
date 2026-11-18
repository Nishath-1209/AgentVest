
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AgentVest API"
    environment: str = "development"
    frontend_origin: str = "http://localhost:5173"

    finnhub_api_key: str = ""
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash-lite"
    hf_token: str = ""

    astra_db_api_endpoint: str = ""
    astra_db_application_token: str = ""
    astra_db_keyspace: str = "default_keyspace"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()
