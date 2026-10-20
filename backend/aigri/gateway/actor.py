"""The caller of a tool. Feature 01 (T-01.15) installs the resolver from the session."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Literal

from fastapi import Request

from aigri.api.errors import ApiError

ActorKind = Literal["person", "agent", "code"]


@dataclass(frozen=True, slots=True)
class Actor:
    kind: ActorKind
    role: str | None = None  # person: membership role, or "token_holder"
    user_id: str | None = None
    insurer_id: str | None = None
    client_id: str | None = None
    label: str = ""


ActorResolver = Callable[[Request], Awaitable[Actor | None]]

_resolver: ActorResolver | None = None


def install_actor_resolver(resolver: ActorResolver | None) -> None:
    """Called once by feature 01 (T-01.15, sessions). Tests install fakes and pass None to reset."""
    global _resolver
    _resolver = resolver


async def resolve_actor(request: Request) -> Actor:
    """FastAPI dependency behind every ``gate(...)``. Fails closed: no resolver or no session
    means 401, never an anonymous pass."""
    actor = await _resolver(request) if _resolver is not None else None
    if actor is None:
        raise ApiError(
            401,
            "not_signed_in",
            "You are not signed in. Nothing was changed. Sign in and try again.",
        )
    return actor
