"""Settings from environment variables (FR-01.3).

The app refuses to start on a missing required value.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=None, extra="ignore", case_sensitive=False)

    # Database. The API and worker use aigri_app; Alembic uses the owner role.
    database_url: str
    database_owner_url: str

    sandbox: bool = False
    clock_mode: Literal["real", "demo"] = "real"
    default_pack: str = "ID"
    session_secret: str = Field(min_length=16)
    dev_token: str = ""

    # Object storage (MinIO, D-33)
    minio_endpoint: str = "http://minio:9000"
    minio_access_key: str = "aigri"
    minio_secret_key: str = "aigri-minio-secret"
    minio_bucket: str = "aigri-evidence"

    # Mock services and worker
    mock_sms_url: str = "http://mock-sms:8000"
    mock_email_url: str = "http://mock-email:8000"
    mock_wallet_url: str = "http://mock-wallet:8000"
    worker_url: str = "http://worker:8001"

    # Language model
    llm_provider: str = "ollama"
    llm_base_url: str = "http://ollama:11434"
    llm_model: str = "qwen3:14b"
    llm_vision_model: str = "qwen3-vl:8b"
    llm_fallback_provider: str = ""
    llm_fallback_base_url: str = ""
    llm_fallback_model: str = ""
    llm_fallback_api_key: str = ""

    # Web Push
    vapid_public_key: str = ""
    vapid_private_key: str = ""

    # Thresholds
    phash_max_distance: int = 8
    curation_theta: float = 0.50

    health_timeout_s: float = 2.0


@lru_cache
def get_settings() -> Settings:
    return Settings()
