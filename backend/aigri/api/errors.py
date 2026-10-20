"""Error format from api-conventions.md: {"error": {"code", "message", "details"}}."""

from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

_CODES = {
    400: "validation_error",
    401: "not_signed_in",
    403: "forbidden",
    404: "not_found",
    409: "conflict",
    422: "unprocessable",
    429: "rate_limited",
}
_MESSAGES = {
    400: "That request was not valid. Nothing was changed. Check the details and try again.",
    401: "You are not signed in. Nothing was changed. Sign in and try again.",
    403: "You do not have access to this. Nothing was changed.",
    404: "We could not find that. Check the link and try again.",
    409: "That no longer matches the current state. Nothing was changed. Refresh and try again.",
    422: "Something in that request could not be accepted. Nothing was changed.",
    429: "Too many requests. Nothing was changed. Wait a little and try again.",
}


class ApiError(Exception):
    def __init__(
        self,
        status: int,
        code: str,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message
        self.details = details or {}


def error_body(code: str, message: str, details: dict[str, Any] | None = None) -> dict[str, Any]:
    return {"error": {"code": code, "message": message, "details": details or {}}}


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def _api_error(_: Request, exc: ApiError) -> JSONResponse:
        return JSONResponse(error_body(exc.code, exc.message, exc.details), status_code=exc.status)

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        code = _CODES.get(exc.status_code, "error")
        message = _MESSAGES.get(exc.status_code, "Something went wrong. Nothing was changed.")
        return JSONResponse(error_body(code, message), status_code=exc.status_code)

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        fields = [{"loc": [str(p) for p in e["loc"]], "type": e["type"]} for e in exc.errors()]
        return JSONResponse(
            error_body("validation_error", _MESSAGES[400], {"fields": fields}), status_code=400
        )
