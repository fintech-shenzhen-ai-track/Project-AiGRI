"""``gate("<tool>")``: the FastAPI dependency every API route carries (FR-02.2, US-02.1).

The router-graph test (``gateway.testing``) finds it by the ``__gate_tool__`` marker. A route
names exactly one tool from specs/00-shared/tools-and-tiers.md; unknown names fail at import.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Annotated

from fastapi import Depends, Request

from aigri.api.errors import ApiError
from aigri.gateway.actor import Actor, resolve_actor
from aigri.gateway.authorize import Authorized, authorize
from aigri.gateway.errors import GatewayDenied
from aigri.gateway.registry import get_registry

GATE_MARKER = "__gate_tool__"


def gate(tool_name: str) -> Callable[..., Awaitable[Authorized]]:
    get_registry().require(tool_name)  # typo in a route fails at import, not at request time

    async def _gate(
        request: Request, actor: Annotated[Actor, Depends(resolve_actor)]
    ) -> Authorized:
        try:
            ctx = authorize(tool_name, actor)
        except GatewayDenied as exc:
            # Tenant mismatches are shown as 404 so ids do not leak across tenants.
            if exc.reason_code == "tenant":
                raise ApiError(404, "not_found", "We could not find that.") from exc
            raise ApiError(
                403,
                "forbidden",
                "You do not have access to this. Nothing was changed.",
                {"reason": exc.reason_code},
            ) from exc
        request.state.authorized = ctx
        return ctx

    setattr(_gate, GATE_MARKER, tool_name)
    return _gate
