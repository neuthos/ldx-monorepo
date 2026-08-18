#!/usr/bin/env bash
# Usage:
#   gsheets-copy-template.sh "<new spreadsheet title>"   -> copies the TDD template into the Drive folder
#   gsheets-copy-template.sh --delete <spreadsheet-id>   -> removes a copy again
# Prints the new spreadsheet id + URL as JSON on stdout.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
CONTROL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"

TEMPLATE_ID="1ZEXFbzolW2VvDzm_h_Vp8DKutl0ACfVZ_CdKqgPA4Mo"
FOLDER_ID="1eFHQSvv0LXLTl7UzH0na-k1FuK5lFK0h"
export GS_KEY="${SERVICE_ACCOUNT_PATH:-$CONTROL_ROOT/.zcode/gsheets-service-account.json}"
export GS_TEMPLATE="$TEMPLATE_ID"
export GS_FOLDER="$FOLDER_ID"

if [[ ! -f "$GS_KEY" ]]; then
  printf 'Service account key missing at %s\n' "$GS_KEY" >&2
  exit 1
fi

if [[ "${1:-}" == "--delete" ]]; then
  export GS_DELETE_ID="${2:?spreadsheet id required}"
else
  export GS_TITLE="${1:?new spreadsheet title required}"
fi

NODE_PATH="$HOME/.zcode/mcp-servers/node_modules" exec node -e '
const { google } = require("googleapis");
const key = require(process.env.GS_KEY);
const auth = new google.auth.JWT({
  email: key.client_email,
  key: key.private_key,
  scopes: ["https://www.googleapis.com/auth/drive"],
});
const drive = google.drive({ version: "v3", auth });

(async () => {
  if (process.env.GS_DELETE_ID) {
    await drive.files.delete({ fileId: process.env.GS_DELETE_ID });
    console.log(JSON.stringify({ deleted: process.env.GS_DELETE_ID }));
    return;
  }
  const res = await drive.files.copy({
    fileId: process.env.GS_TEMPLATE,
    requestBody: {
      name: process.env.GS_TITLE,
      parents: [process.env.GS_FOLDER],
    },
  });
  console.log(JSON.stringify({
    id: res.data.id,
    title: res.data.name,
    url: `https://docs.google.com/spreadsheets/d/${res.data.id}/edit`,
  }));
})().catch((e) => { console.error(e.message); process.exit(1); });
'
