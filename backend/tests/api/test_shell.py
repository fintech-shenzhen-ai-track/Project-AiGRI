"""T-01.04: error format, request id, health route, router registry."""

from fastapi.testclient import TestClient

from aigri.api.app import create_app
from aigri.api.routers import ROUTER_MODULES, all_routers
from aigri.core.rls import tenant_policy_sql


def client() -> TestClient:
    return TestClient(create_app(), raise_server_exceptions=False)


def test_health_reports_every_component_and_never_raises() -> None:
    r = client().get("/api/v1/health")
    assert r.status_code == 200
    body = r.json()
    assert set(body["components"]) == {
        "db",
        "ollama",
        "minio",
        "worker",
        "mock_sms",
        "mock_email",
        "mock_wallet",
    }
    assert body["status"] in {"ok", "degraded"}


def test_request_id_generated_and_echoed() -> None:
    c = client()
    assert c.get("/api/v1/health").headers["x-request-id"]
    assert c.get("/api/v1/health", headers={"X-Request-ID": "abc"}).headers["x-request-id"] == "abc"


def test_unknown_route_uses_error_format() -> None:
    r = client().get("/api/v1/nope")
    assert r.status_code == 404
    err = r.json()["error"]
    assert err["code"] == "not_found" and err["message"] and err["details"] == {}


def test_registry_loads_all_modules() -> None:
    assert len(all_routers()) == len(ROUTER_MODULES)


def test_openapi_has_health() -> None:
    spec = create_app().openapi()
    assert "/api/v1/health" in spec["paths"]


def test_tenant_policy_sql_shape() -> None:
    sql = "\n".join(tenant_policy_sql("claims"))
    assert "FORCE ROW LEVEL SECURITY" in sql
    assert "app.insurer_id" in sql and "app.client_id" in sql and "superadmin" in sql
