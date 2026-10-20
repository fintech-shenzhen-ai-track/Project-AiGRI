"""GET /api/v1/health (exempt from gate(), see tools-and-tiers.md). FR-01.15."""

import asyncio
from typing import Literal

import asyncpg
import httpx
from fastapi import APIRouter
from pydantic import BaseModel

from aigri.core.config import Settings, get_settings

router = APIRouter(tags=["health"])

Status = Literal["ok", "down"]


class ComponentHealth(BaseModel):
    status: Status
    detail: str | None = None


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    components: dict[str, ComponentHealth]


def _asyncpg_dsn(url: str) -> str:
    return url.replace("postgresql+asyncpg://", "postgresql://")


async def _db(s: Settings) -> ComponentHealth:
    try:
        conn = await asyncpg.connect(_asyncpg_dsn(s.database_url), timeout=s.health_timeout_s)
        try:
            await conn.fetchval("select 1")
        finally:
            await conn.close()
        return ComponentHealth(status="ok")
    except Exception as exc:
        return ComponentHealth(status="down", detail=type(exc).__name__)


async def _ollama(s: Settings, client: httpx.AsyncClient) -> ComponentHealth:
    try:
        r = await client.get(f"{s.llm_base_url}/api/tags")
        r.raise_for_status()
        names = {m.get("name") for m in r.json().get("models", [])}
        missing = [m for m in (s.llm_model, s.llm_vision_model) if m not in names]
        if missing:
            return ComponentHealth(status="down", detail="models missing: " + ", ".join(missing))
        return ComponentHealth(status="ok")
    except Exception as exc:
        return ComponentHealth(status="down", detail=type(exc).__name__)


async def _http_ok(client: httpx.AsyncClient, url: str) -> ComponentHealth:
    try:
        r = await client.get(url)
        r.raise_for_status()
        return ComponentHealth(status="ok")
    except Exception as exc:
        return ComponentHealth(status="down", detail=type(exc).__name__)


@router.get("/health", response_model=HealthResponse, operation_id="get_health")
async def get_health() -> HealthResponse:
    s = get_settings()
    async with httpx.AsyncClient(timeout=s.health_timeout_s) as client:
        names = ["db", "ollama", "minio", "worker", "mock_sms", "mock_email", "mock_wallet"]
        results = await asyncio.gather(
            _db(s),
            _ollama(s, client),
            _http_ok(client, f"{s.minio_endpoint}/minio/health/live"),
            _http_ok(client, f"{s.worker_url}/health"),
            _http_ok(client, f"{s.mock_sms_url}/health"),
            _http_ok(client, f"{s.mock_email_url}/health"),
            _http_ok(client, f"{s.mock_wallet_url}/health"),
        )
    components = dict(zip(names, results, strict=True))
    overall: Literal["ok", "degraded"] = (
        "ok" if all(c.status == "ok" for c in components.values()) else "degraded"
    )
    return HealthResponse(status=overall, components=components)
