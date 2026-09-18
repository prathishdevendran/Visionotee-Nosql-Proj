"""
Core Configuration Module.

Centralized application settings management using Pydantic Settings.
Loads environment variables from .env files with strong typing.
"""

from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from pathlib import Path

# Identify potential .env locations
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    PROJECT_NAME: str = "Visionote API"
    VERSION: str = "1.0.0"

    # MongoDB Atlas Settings
    MONGODB_URL: str
    DATABASE_NAME: str = "visionote-db"

    # CORS Configuration
    ALLOWED_ORIGINS: Union[str, List[str]] = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.exists() else ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @field_validator("ALLOWED_ORIGINS", mode="after")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip().rstrip("/") for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return [i.strip().rstrip("/") for i in v if isinstance(i, str) and i.strip()]
        return []


settings = Settings()
