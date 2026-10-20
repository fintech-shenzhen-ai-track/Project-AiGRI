"""GET /api/v1/packs and /api/v1/packs/{code} (exempt from gate(), see tools-and-tiers.md)."""

from fastapi import APIRouter

from aigri.api.errors import ApiError
from aigri.core import packs

router = APIRouter(tags=["packs"])


@router.get("/packs", response_model=list[packs.Pack], response_model_exclude_none=True)
def list_packs() -> list[packs.Pack]:
    return packs.all_packs()


@router.get("/packs/{code}", response_model=packs.Pack, response_model_exclude_none=True)
def get_pack(code: str) -> packs.Pack:
    try:
        return packs.get_pack(code)
    except packs.PackNotFound:
        raise ApiError(404, "not_found", "That country pack does not exist.") from None
