"""Worker entry point: heartbeat plus the outbox publisher loop (T-01.12). Scheduler jobs: later."""

import asyncio
import logging
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

from aigri.core import outbox
from aigri.core.clock import now
from aigri.core.db import make_engine

log = logging.getLogger("aigri.worker")
PUBLISH_INTERVAL_S = 1.0

_last_beat = 0.0


class _Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        age = time.monotonic() - _last_beat
        ok = self.path == "/health" and age < 30
        self.send_response(200 if ok else 503)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"status":"ok"}' if ok else b'{"status":"down"}')

    def log_message(self, format: str, *args: object) -> None:  # noqa: A002
        return


async def publisher_loop() -> None:
    """Deliver committed outbox events to the registered consumers, forever."""
    engine = make_engine()
    retry_at: dict[str, float] = {}
    while True:
        try:
            await outbox.publish_pending(engine, retry_at=retry_at)
        except Exception:
            log.exception("outbox publish pass failed")
        await asyncio.sleep(PUBLISH_INTERVAL_S)


def main() -> None:
    global _last_beat
    server = HTTPServer(("0.0.0.0", 8001), _Handler)  # noqa: S104
    threading.Thread(target=server.serve_forever, daemon=True).start()
    outbox.load_consumers()
    threading.Thread(target=lambda: asyncio.run(publisher_loop()), daemon=True).start()
    while True:
        _last_beat = time.monotonic()
        print(f"worker heartbeat {now().isoformat()}", flush=True)
        time.sleep(10)


if __name__ == "__main__":
    main()
