---
name: tdd-sheet-update
description: "Sync human decisions from a per-ringi TDD Google Sheet and manage the Done gate. Use when the user supplies an Excel/sheet link (or ringi id) and asks to update/check/review statuses: read Treacibility Matrix, Q&A, and Testcases; report Editted/Rejected rows with their Remarks reasons; set Metadata.Status to Done only when the gate passes. Writes are limited to Metadata (Status/ID/Last Updated At) per the locked contract at .agents/skills/tdd-sheet-contract.md."
---

# TDD Sheet Update (status sync + Done gate)

Human decisions live in the per-ringi TDD Google Sheet — statuses on `Treacibility
Matrix` / `Testcases` rows, answers in `Q&A`, reasons in `Remarks`. This skill ingests
those decisions, reports what changed, and is the ONLY writer of `Metadata.Status =
Done`. It never edits TM/Q&A/Testcases content; it never resolves Editted/Rejected rows
(it reports them for the next brainstorm/test-plan run to ingest).

**Everything below follows the locked contract:** `.agents/skills/tdd-sheet-contract.md`.
If the sheet's structure disagrees with the contract, stop and tell the user — never
improvise.

## Invocation

- Default execution context: **long-running goal** (`/goal` in Claude Code / ZCode /
  Codex). This skill is part of a pipeline, not an interactive chat loop.
- Input: the sheet URL or spreadsheet id (or a ringi id the operator resolves to a sheet
  in folder `1eFHQSvv0LXLTl7UzH0na-k1FuK5lFK0h` via `list_spreadsheets`).
- Read-only boundary: target repos are untouched; only the named spreadsheet is written,
  and only in the cells the contract allows.

## Tools

Use the project-scoped `gsheets` MCP tools, or one-shot from the control plane:

```bash
./scripts/gsheets-mcp-call.sh get_sheet_data '{"spreadsheet_id":"<ID>","sheet":"<tab>","range":"<A1>"}'
./scripts/gsheets-mcp-call.sh update_cells '{"spreadsheet_id":"<ID>","sheet":"Metadata","range":"B6:B8","data":[["<new-id>"]]}'
```

If the `gsheets` server is unavailable, stop and report — do not fall back to browser
automation for this skill.

## Procedure

1. **Resolve the spreadsheet** from the input; `list_sheets` to confirm the locked tab
   set exists.
2. **Read all three tabs fully** (from the contract's data-start rows: TM row 10,
   Testcases row 13, Q&A row 2):
   - TM `A:H` — statuses, BR/FR-IDs, Remarks.
   - Testcases `A:H` — statuses, TC-IDs, Remarks.
   - Q&A `A:E` — statuses, Answers.
3. **Classify and report** (this is the main deliverable — make it readable):
   - `Approved` count per tab.
   - Every `Editted` row: ID + the human's edited content + the Remarks reason verbatim.
   - Every `Rejected` row: ID + Remarks reason verbatim.
   - Every `Question` / `Pending` row still open.
   - Every Q&A row still `Draft` (unanswered).
4. **Apply the Done gate** (contract definition):
   - All TM data rows = `Approved` AND all Testcases data rows = `Approved` AND no
     `Question` rows remain AND no Q&A row is `Draft`.
   - If the gate passes: write `Metadata` — `Status` = `Done`, fresh random `ID`, and
     `Last Updated At` = now (`YYYY/MM/DD HH:MM`), and say so.
   - If not: leave `Metadata.Status` as-is, and list exactly which rows block the gate.
5. **When Editted/Rejected rows exist:** tell the user the next pipeline step that must
   ingest them (`brainstorming` re-run for spec-level rows, `spec-test-plan-agent`
   re-run for testcase rows), quoting each ID + reason so nothing gets lost. Do not
   attempt the ingestion yourself.

## Rules

- Never modify: statuses on TM/Testcases rows, Q&A Answers, Answerkey tabs, the `Issue`
  tab, any legend/options rows (TM rows 1–8, Testcases rows 1–11).
- Never set `Done` while anything is unresolved — a wrong `Done` unblocks the contract
  agent prematurely.
- Reasons in `Remarks` are human words: quote them verbatim (Japanese included,
  untranslated) in reports and hand-offs.
- Spreadsheet writes are limited to `Metadata!B6:B8` (ID / Status / Last Updated At).
- Idempotent: re-running with no human changes must not rewrite Metadata (compare
  before writing).
