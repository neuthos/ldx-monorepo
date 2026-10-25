#!/usr/bin/env bash
# prd-testkit Mode 0 from the terminal: pick a PRD folder, re-render, serve.
exec python3 "$(dirname "$0")/.agents/skills/prd-testkit/scripts/rerender.py" "$@"
