"""FastAPI app: request id middleware, error format, router registry."""

import logging
import uuid
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse

from aigri.api.errors import error_body, install_error_handlers
from aigri.api.routers import all_routers

log = logging.getLogger("aigri.api")

REQUEST_ID_HEADER = "X-Request-ID"


def create_app() -> FastAPI:
    app = FastAPI(
        title="AiGRI API",
        version="0.1.0",
        docs_url="/api/v1/docs",
        openapi_url="/api/v1/openapi.json",
    )

    @app.middleware("http")
    async def request_id(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        rid = request.headers.get(REQUEST_ID_HEADER) or uuid.uuid4().hex
        request.state.request_id = rid
        try:
            response = await call_next(request)
        except Exception:
            log.exception("unhandled error", extra={"request_id": rid})
            response = JSONResponse(
                error_body(
                    "internal_error",
                    "Something went wrong on our side. Nothing was changed. Try again shortly.",
                ),
                status_code=500,
            )
        response.headers[REQUEST_ID_HEADER] = rid
        return response

    install_error_handlers(app)
    for router in all_routers():
        app.include_router(router, prefix="/api/v1")
    return app


app = create_app()
