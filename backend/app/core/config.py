from typing import List, Optional, Union
from pathlib import Path
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BASE_DIR = Path(__file__).resolve().parent.parent.parent
_ROOT_DIR = _BASE_DIR.parent
_ENV_FILES = (
    str(_ROOT_DIR / ".env"),
    str(_BASE_DIR / ".env"),
    ".env",
)


class Settings(BaseSettings):
    PROJECT_NAME: str = "Campus Resource Exchange API"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    # Database configuration - defaults to PostgreSQL with psycopg driver
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/campus_resources"

    # Authentication & Security
    # In production, set JWT_SECRET_KEY via environment variable (.env)
    JWT_SECRET_KEY: str = "cre-insecure-dev-secret-key-replace-in-production-32-bytes-min!"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Optional initial administrator bootstrap (populated only via .env)
    ADMIN_BOOTSTRAP_EMAIL: Optional[str] = None
    ADMIN_BOOTSTRAP_PASSWORD: Optional[str] = None
    ADMIN_BOOTSTRAP_NAME: str = "System Administrator"

    # CORS configuration
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]

    model_config = SettingsConfigDict(
        env_file=_ENV_FILES,
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
