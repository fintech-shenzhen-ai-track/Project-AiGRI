"""Worker entry point. Phase A: heartbeat only (scheduler and outbox publisher: T-01.12)."""

import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

from aigri.core.clock import now

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


def main() -> None:
    global _last_beat
    server = HTTPServer(("0.0.0.0", 8001), _Handler)  # noqa: S104
    threading.Thread(target=server.serve_forever, daemon=True).start()
    while True:
        _last_beat = time.monotonic()
        print(f"worker heartbeat {now().isoformat()}", flush=True)
        time.sleep(10)


if __name__ == "__main__":
    main()
