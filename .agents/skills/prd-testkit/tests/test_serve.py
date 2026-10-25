"""Local-server regression: idle browser connections must not block GET or Save."""
import json
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import time
import unittest
from urllib.request import Request, urlopen


class ServerTest(unittest.TestCase):
    def test_idle_connections_do_not_block_read_or_save(self):
        script = Path(__file__).resolve().parents[1] / "scripts" / "serve.py"
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "index.html").write_text("RINGI 151 review 日本語", encoding="utf-8")
            with socket.socket() as probe:
                probe.bind(("127.0.0.1", 0))
                port = probe.getsockname()[1]
            process = subprocess.Popen(
                [sys.executable, str(script), directory, str(port)],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            )
            connections = []
            try:
                deadline = time.monotonic() + 5
                while True:
                    try:
                        connections.append(socket.create_connection(("127.0.0.1", port), timeout=1))
                        break
                    except ConnectionRefusedError:
                        if time.monotonic() >= deadline:
                            raise
                        time.sleep(0.02)
                connections.append(socket.create_connection(("127.0.0.1", port), timeout=1))
                url = f"http://127.0.0.1:{port}"
                with urlopen(url + "/index.html", timeout=2) as response:
                    self.assertIn("日本語", response.read().decode("utf-8"))
                content = json.dumps({"ambiguities": [], "mom_notes": [{"note": "税 🙂", "ai_analyzed": False}]}, ensure_ascii=False)
                request = Request(url + "/save", data=json.dumps({"filename": "requirements.json", "content": content}).encode(), headers={"Content-Type": "application/json"})
                with urlopen(request, timeout=2) as response:
                    self.assertTrue(json.load(response)["ok"])
                self.assertEqual((root / "requirements.json").read_text(encoding="utf-8"), content)
            finally:
                for connection in connections:
                    connection.close()
                process.terminate()
                process.wait(timeout=5)


if __name__ == "__main__":
    unittest.main()
