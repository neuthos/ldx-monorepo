#!/usr/bin/env python3
"""Mini save-server for prd-testkit.

Usage: python3 serve.py docs/<prd-folder> [port]

Serves the given folder (so index.html opens at http://127.0.0.1:<port>/index.html)
and accepts POST /save with JSON {"filename": "...", "content": "..."}.
Only whitelisted filenames inside the served folder may be written.
"""
import json
import os
import sys
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

ALLOWED = {"requirements.json", "design.json"}
DEFAULT_PORT = 8765


class Handler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/save":
            self._json(404, {"ok": False, "error": "not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            filename = os.path.basename(str(body.get("filename", "")))
            content = body.get("content", "")
        except Exception as exc:  # malformed body
            self._json(400, {"ok": False, "error": f"bad request: {exc}"})
            return
        if filename not in ALLOWED:
            self._json(403, {"ok": False, "error": f"filename not allowed: {filename}"})
            return
        try:
            with open(os.path.join(self.directory, filename), "w", encoding="utf-8") as f:
                f.write(content)
        except Exception as exc:
            self._json(500, {"ok": False, "error": str(exc)})
            return
        self._json(200, {"ok": True, "written": filename})

    def _json(self, code, obj):
        payload = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def log_message(self, fmt, *args):  # quieter console
        sys.stderr.write("  %s\n" % (fmt % args))


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    root = os.path.abspath(sys.argv[1])
    if not os.path.isdir(root):
        print(f"error: {root} is not a directory")
        sys.exit(1)
    port = int(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_PORT
    handler = partial(Handler, directory=root)
    with ThreadingHTTPServer(("127.0.0.1", port), handler) as httpd:
        print(f"prd-testkit server: http://127.0.0.1:{port}/index.html  (serving {root})")
        print("POST /save accepts:", ", ".join(sorted(ALLOWED)))
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nbye")


if __name__ == "__main__":
    main()
