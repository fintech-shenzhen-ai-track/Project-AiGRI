"""Router registry. Each feature adds ONE line to ROUTER_MODULES in its first task.

A module named here lives at ``aigri/api/routers/<name>.py`` and exposes ``router``
(a ``fastapi.APIRouter``). Merge conflicts in this list are resolved by keeping all lines.
"""

from importlib import import_module

from fastapi import APIRouter

ROUTER_MODULES: list[str] = [
    "health",  # 01
    "packs",  # 01
    "client_wallet",  # 12
    "insurer_wallet",  # 12
]


def all_routers() -> list[APIRouter]:
    routers: list[APIRouter] = []
    for name in ROUTER_MODULES:
        module = import_module(f"{__name__}.{name}")
        routers.append(module.router)
    return routers
