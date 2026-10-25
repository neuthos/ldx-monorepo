#!/usr/bin/env python3
"""Mode 0 runner for prd-testkit: pick a PRD folder and re-render index.html.

Usage: python3 rerender.py [docs/<prd-folder>]

Without an argument it lists docs/* folders that contain requirements.json
and asks you to pick one. After rendering it reuses the running save server
or starts a new one, then prints the page URL. Mode 0 only: no agents run.
"""
import json
import re
import socket
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen

SKILL_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = SKILL_DIR.parents[2]
DOCS = REPO_ROOT / "docs"
BASE_PORT = 8765
PORT_RANGE = 20
BSLASH = chr(92)  # keeps the </script> escape visible next to the regex below


def candidates():
    if not DOCS.is_dir():
        return []
    return sorted(
        p.name for p in DOCS.iterdir()
        if p.is_dir() and (p / "requirements.json").is_file()
    )


def pick(arg):
    if arg:
        slug = arg.removeprefix("docs/").strip("/")
        if "/" in slug or slug.startswith("."):
            sys.exit(f"error: invalid folder name: {arg}")
        if not (DOCS / slug / "requirements.json").is_file():
            sys.exit(f"error: docs/{slug} has no requirements.json (run Mode 1 first)")
        return slug
    names = candidates()
    if not names:
        sys.exit("error: no PRD folders with requirements.json under docs/ (run Mode 1 first)")
    if not sys.stdin.isatty():
        sys.exit(f"error: pass a folder name, e.g. rerender.py {names[0]}")
    print("PRD folders in docs/:")
    for i, name in enumerate(names, 1):
        print(f"  {i}) {name}")
    while True:
        try:
            choice = input("Pick one (number or name, q to quit): ").strip()
        except EOFError:
            sys.exit(0)
        if choice.lower() == "q":
            sys.exit(0)
        if choice in names:
            return choice
        if choice.isdigit() and 1 <= int(choice) <= len(names):
            return names[int(choice) - 1]
        print("  not in the list, try again")


def render(slug):
    folder = DOCS / slug
    req = json.loads((folder / "requirements.json").read_text(encoding="utf-8"))
    design_path = folder / "design.json"
    design = None
    if design_path.is_file():
        design = json.loads(design_path.read_text(encoding="utf-8"))
    payload = {
        "prd_name": (req.get("meta") or {}).get("prd_name") or slug,
        "docs_dir": f"docs/{slug}",
        "requirements": req,
        "design": design,
    }
    data = re.sub(
        r"</script", lambda m: "<" + BSLASH + "/script", json.dumps(payload),
        flags=re.IGNORECASE,
    )
    template = (SKILL_DIR / "assets" / "template.html").read_text(encoding="utf-8")
    if "/*__DATA__*/ null" not in template:
        sys.exit("error: marker '/*__DATA__*/ null' not found in assets/template.html")
    html = template.replace("/*__DATA__*/ null", data)
    theme = SKILL_DIR / "assets" / "theme.css"
    if theme.is_file():
        html = html.replace("/*__THEME__*/", theme.read_text(encoding="utf-8"))
    (folder / "index.html").write_text(html, encoding="utf-8")
    return req, design


def port_open(port):
    with socket.socket() as s:
        s.settimeout(0.3)
        return s.connect_ex(("127.0.0.1", port)) == 0


def serves_slug(port, slug):
    for needle in (f'"docs_dir":"docs/{slug}"', f'"docs_dir": "docs/{slug}"'):
        try:
            if needle in urlopen(f"http://127.0.0.1:{port}/index.html", timeout=1).read().decode("utf-8", "replace"):
                return True
        except Exception:
            return False
    return False


def ensure_server(slug):
    for port in range(BASE_PORT, BASE_PORT + PORT_RANGE):
        if not port_open(port):
            subprocess.Popen(
                [sys.executable, str(SKILL_DIR / "scripts" / "serve.py"), str(DOCS / slug), str(port)],
                cwd=str(REPO_ROOT), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                start_new_session=True,
            )
            for _ in range(20):
                if port_open(port):
                    return port, "started"
                time.sleep(0.25)
            sys.exit(
                f"error: save server did not start — run manually: "
                f"python3 .agents/skills/prd-testkit/scripts/serve.py docs/{slug} {port}"
            )
        if serves_slug(port, slug):
            return port, "already running"
    sys.exit(f"error: no free port in {BASE_PORT}-{BASE_PORT + PORT_RANGE - 1}")


def main():
    slug = pick(sys.argv[1] if len(sys.argv) > 1 else None)
    req, design = render(slug)
    port, state = ensure_server(slug)
    counts = (req.get("meta") or {}).get("counts") or {}
    print(f"Rendered docs/{slug}/index.html (Mode 0)")
    if counts:
        print(f"  requirements: {counts.get('requirements', '?')}"
              f" (testable {counts.get('testable', '?')}, not-testable {counts.get('not_testable', '?')})")
    print(f"  design: {'TM/TC tabs included' if design else 'none yet (Mode 2 will generate it)'}")
    print(f"  server {state}: http://127.0.0.1:{port}/index.html")


if __name__ == "__main__":
    main()
