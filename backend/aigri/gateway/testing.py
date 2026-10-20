"""Router-graph inspection (US-02.1): which routes lack exactly one ``gate(...)``."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.dependencies.models import Dependant
from fastapi.routing import APIRoute, iter_route_contexts

from aigri.gateway.deps import GATE_MARKER
from aigri.gateway.registry import get_registry

API_PREFIX = "/api/v1"

# tools-and-tiers.md: routes exempt from gate(...).
EXEMPT_EXACT = frozenset({f"{API_PREFIX}/health"})
EXEMPT_PREFIXES = (f"{API_PREFIX}/packs", f"{API_PREFIX}/auth/", f"{API_PREFIX}/dev/")


def _framework_paths(app: FastAPI) -> set[str]:
    """FastAPI's own documentation routes (plain routes, not APIRoutes)."""
    urls = (
        app.openapi_url,
        app.docs_url,
        app.redoc_url,
        app.swagger_ui_oauth2_redirect_url,
    )
    return {u for u in urls if u}


def is_exempt(path: str) -> bool:
    return path in EXEMPT_EXACT or path.startswith(EXEMPT_PREFIXES)


def gate_tools(dependant: Dependant) -> list[str]:
    """Tool names of every gate(...) in a dependant tree, one entry per gate."""
    found: list[str] = []
    marker = getattr(dependant.call, GATE_MARKER, None)
    if marker is not None:
        found.append(marker)
    for sub in dependant.dependencies:
        found.extend(gate_tools(sub))
    return found


def route_problems(app: FastAPI) -> list[str]:
    """Human-readable problems; an empty list means every route is gated or exempt.

    Uses FastAPI's ``iter_route_contexts`` so routes added with ``include_router`` (including
    nested includes and include-level dependencies) are seen with their full dependant tree.
    """
    problems: list[str] = []
    registry = get_registry()
    framework = _framework_paths(app)
    for ctx in iter_route_contexts(app.routes):
        path = ctx.path or ""
        if path in framework:
            continue
        if not isinstance(ctx.original_route, APIRoute):
            problems.append(f"{path}: not an APIRoute (mounts and raw routes bypass gate)")
            continue
        dependant = ctx.dependant
        methods = ",".join(sorted(ctx.methods or []))
        tools = gate_tools(dependant)
        if is_exempt(path):
            if tools:
                problems.append(f"{methods} {path}: exempt route should not carry gate()")
            continue
        if len(tools) != 1:
            problems.append(f"{methods} {path}: expected exactly one gate(), found {len(tools)}")
        elif tools[0] not in registry:
            problems.append(f"{methods} {path}: unknown tool {tools[0]}")
    return problems
