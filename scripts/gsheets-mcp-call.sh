#!/usr/bin/env bash
# Usage: gsheets-mcp-call.sh <tool_name> <json_arguments>
# Calls one gsheets-mcp tool over stdio and prints the text result.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
TOOL="${1:?tool name required}"
ARGS="${2:-{\}}"

(printf '%s\n%s\n%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"cli","version":"0.1"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/call\",\"params\":{\"name\":\"$TOOL\",\"arguments\":$ARGS}}"; \
 sleep "${GSMCP_WAIT:-8}") \
| "$SCRIPT_DIR/gsheets-mcp" 2>/dev/null \
| python3 -c "
import json, sys
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        d = json.loads(line)
    except Exception:
        continue
    if d.get('id') == 2:
        r = d.get('result', {})
        c = r.get('content', [])
        if c:
            print(c[0].get('text', ''))
        else:
            print(json.dumps(d))
        break
"
