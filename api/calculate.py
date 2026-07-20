"""Private Swiss Ephemeris calculation endpoint for the Omyear backend."""

from http.server import BaseHTTPRequestHandler
import hmac
import json
import os

from pipeline.engines.calculate import calculate


MAX_BODY_BYTES = 64 * 1024


class handler(BaseHTTPRequestHandler):
    def _json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        self._json(200, {"status": "ok", "service": "omyear-calculation"})

    def do_POST(self) -> None:
        expected = os.environ.get("BACKEND_SHARED_SECRET", "")
        supplied = self.headers.get("x-omyear-secret", "")
        if not expected or not hmac.compare_digest(supplied, expected):
            self._json(401, {"error": "unauthorized"})
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self._json(400, {"error": "invalid_content_length"})
            return
        if content_length <= 0 or content_length > MAX_BODY_BYTES:
            self._json(413, {"error": "request_too_large"})
            return

        try:
            input_data = json.loads(self.rfile.read(content_length))
            result = calculate(input_data)
        except (KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
            self._json(400, {"error": "invalid_input", "detail": str(error)[:240]})
            return
        except Exception:
            self._json(500, {"error": "calculation_failed"})
            return

        self._json(200, result)
