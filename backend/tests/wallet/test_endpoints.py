"""T-12.03: wallet routes are gated, shaped and stubbed; the router graph stays clean."""

from collections.abc import Iterator

import pytest
from fastapi import Request
from fastapi.testclient import TestClient

from aigri.api.app import create_app
from aigri.gateway.actor import Actor, install_actor_resolver
from aigri.gateway.testing import route_problems

ROLE: dict[str, str | None] = {"role": None}


@pytest.fixture
def client() -> Iterator[TestClient]:
    async def resolver(request: Request) -> Actor | None:
        role = ROLE["role"]
        return Actor(kind="person", role=role, user_id="u") if role else None

    install_actor_resolver(resolver)
    yield TestClient(create_app())
    install_actor_resolver(None)
    ROLE["role"] = None


def test_router_graph_is_clean() -> None:
    assert route_problems(create_app()) == []


def test_unauthenticated_is_401(client: TestClient) -> None:
    assert client.get("/api/v1/client/wallet").status_code == 401


def test_client_reads(client: TestClient) -> None:
    ROLE["role"] = "client_owner"
    body = client.get("/api/v1/client/wallet").json()
    assert body["balance"] == {"amount_minor": 0, "currency": "IDR"}
    assert body["sandbox"] is True
    page = client.get("/api/v1/client/wallet/transactions?filter=in").json()
    assert page == {"items": [], "next_cursor": None}
    assert client.get("/api/v1/client/wallet/transactions?filter=bad").status_code in (400, 422)
    assert (
        client.get("/api/v1/client/wallet/statement.csv")
        .headers["content-type"]
        .startswith("text/csv")
    )


def test_client_cannot_read_insurer_wallet(client: TestClient) -> None:
    ROLE["role"] = "client_owner"
    assert client.get("/api/v1/insurer/wallet").status_code == 403


def test_insurer_reads_and_finance_only_writes(client: TestClient) -> None:
    ROLE["role"] = "underwriter_adjuster"
    body = client.get("/api/v1/insurer/wallet").json()
    assert len(body["integrity"]) == 4 and all(c["ok"] for c in body["integrity"])
    assert client.get("/api/v1/insurer/wallet/payouts").json()["items"] == []
    assert client.get("/api/v1/insurer/wallet/money-in").json()["items"] == []
    assert client.get("/api/v1/insurer/wallet/reconciliation?product=x").json()["product"] == "x"
    fund = {"amount_minor": 5, "currency": "IDR"}
    assert client.post("/api/v1/insurer/wallet/funding", json=fund).status_code == 403
    ROLE["role"] = "finance"
    assert client.post("/api/v1/insurer/wallet/funding", json=fund).status_code == 501
    alert = {"low_balance_alert_minor": 5, "currency": "IDR"}
    assert client.put("/api/v1/insurer/wallet/alert-level", json=alert).status_code == 501


def test_client_movements_are_stubbed_and_validated(client: TestClient) -> None:
    ROLE["role"] = "client_owner"
    assert (
        client.post(
            "/api/v1/client/wallet/top-up", json={"amount_minor": 5, "currency": "IDR"}
        ).status_code
        == 501
    )
    # a float-free, positive integer amount is required
    assert client.post(
        "/api/v1/client/wallet/withdrawals",
        json={"amount_minor": 0, "currency": "IDR", "payout_account_id": "a"},
    ).status_code in (400, 422)
