"""gate() dependency and router-graph test (T-02.03, US-02.1)."""

from collections.abc import Iterator
from typing import Annotated

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from aigri.api.app import create_app
from aigri.api.errors import install_error_handlers
from aigri.gateway.actor import Actor, install_actor_resolver
from aigri.gateway.authorize import Authorized
from aigri.gateway.deps import gate
from aigri.gateway.registry import RegistryError
from aigri.gateway.testing import route_problems


@pytest.fixture(autouse=True)
def _reset_resolver() -> Iterator[None]:
    yield
    install_actor_resolver(None)


def _app() -> FastAPI:
    app = FastAPI()
    install_error_handlers(app)

    @app.get("/api/v1/mine")
    async def mine(ctx: Annotated[Authorized, Depends(gate("client.read"))]) -> dict[str, str]:
        return {"tool": ctx.tool.name}

    return app


def test_real_app_routes_are_all_gated_or_exempt() -> None:
    assert route_problems(create_app()) == []


def test_ungated_route_fails_the_graph_test() -> None:
    app = create_app()

    @app.get("/api/v1/sneaky")
    async def sneaky() -> dict[str, str]:
        return {}

    problems = route_problems(app)
    assert any("/api/v1/sneaky" in p for p in problems)


def test_double_gate_and_unlisted_exemption_fail() -> None:
    app = create_app()

    @app.get("/api/v1/twice", dependencies=[Depends(gate("client.read"))])
    async def twice(ctx: Annotated[Authorized, Depends(gate("insurer.read"))]) -> dict[str, str]:
        return {}

    @app.get("/api/v1/auth/oops", dependencies=[Depends(gate("client.read"))])
    async def exempt_with_gate() -> dict[str, str]:
        return {}

    problems = " ".join(route_problems(app))
    assert "/api/v1/twice" in problems
    assert "/api/v1/auth/oops" in problems  # exempt paths must not carry a gate


def test_gate_on_unknown_tool_fails_at_import() -> None:
    with pytest.raises(RegistryError):
        gate("claim.decied")


def test_no_session_is_401() -> None:
    r = TestClient(_app()).get("/api/v1/mine")
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "not_signed_in"


@pytest.mark.parametrize(
    ("role", "status"),
    [("client_owner", 200), ("finance", 403), ("superadmin", 403), (None, 403)],
)
def test_role_check(role: str | None, status: int) -> None:
    async def resolver(_: object) -> Actor:
        return Actor(kind="person", role=role, user_id="u1")

    install_actor_resolver(resolver)
    r = TestClient(_app()).get("/api/v1/mine")
    assert r.status_code == status
    if status == 403:
        assert r.json()["error"]["details"]["reason"] == "role"


def test_agent_actor_cannot_use_a_person_route() -> None:
    async def resolver(_: object) -> Actor:
        return Actor(kind="agent")

    install_actor_resolver(resolver)
    assert TestClient(_app()).get("/api/v1/mine").status_code == 403


def test_ungated_route_in_included_router_fails_the_graph_test() -> None:
    from fastapi import APIRouter

    router = APIRouter()

    @router.get("/leak")
    async def leak() -> dict[str, str]:
        return {}

    app = create_app()
    app.include_router(router, prefix="/api/v1")
    assert any("/api/v1/leak" in p for p in route_problems(app))
