---
name: brainstorming
description: "L-DX control-plane spec skill (long-running /goal pipeline). Turns a Ringi PRD into: a per-ringi TDD Google Sheet (Treacibility Matrix + Q&A + Metadata) and a technical spec markdown {ringi-id}-spec.md. Runs autonomously — uncertainties become Question rows answered in bulk in the sheet, not chat questions. Uses parallel agents: codebase-memory graph, L-Pedia research, impact & gap analysis. Read-only against FE/BE/E2E."
---

# Skill: brainstorming
# Brainstorming Ideas Into L-DX Specs + TDD Sheets

Turn a Ringi PRD into two synchronized deliverables: the per-ringi **TDD Google Sheet**
(BR/FR traceability the product team reviews in bulk) and the technical
**`{ringi-id}-spec.md`** (1:1 with the sheet's Treacibility Matrix, written for
engineers). Uncertainty is not a chat loop — it becomes `Question` rows in the sheet.

This is a **read-only control plane** (`ldx-monorepo`). Implementation never happens here;
FE/BE/E2E are strictly read-only and work is handed off to separate sessions rooted at the
target repo.

## Execution mode

- **Long-running goal by default**: run under `/goal` (Claude Code / ZCode / Codex).
  Do not stop for minor clarifications — the Excel Q&A is the clarification channel.
- **Multiple agents**: fan out the parallel research agents below; do not serialize them.
- Chat checkpoints are reserved for what the sheet cannot encode: destructive actions,
  and the final "spec written — please review" gate. Everything else runs through.

<HARD-GATE>
Do NOT invoke any implementation skill (`writing-plans` included), write any code, scaffold any project, run any mutation (install, migrate, format, generate, stage, commit in target repos, push, rebase, branch switch), or take any implementation action. This skill's terminal state is **the TDD sheet rows + the committed spec + an advisory handoff** — never implementation.
FE/BE/E2E repositories referenced by `.env` (`FE_PWD`/`BE_PWD`/`E2E_PWD`) are strictly read-only. Do not create, edit, move, or delete their files. Outputs live only inside this control-plane repo and in the per-ringi TDD spreadsheet.
This applies to EVERY spec regardless of perceived simplicity.
</HARD-GATE>

## Anti-Pattern: "This Is too simple to need a spec"

Every change goes through this process. "Simple" changes are where unexamined
assumptions cause the most wasted work. The spec can be short, but it must exist.

## Read-Only Boundary

This repo is a control plane. You may **read** FE/BE/E2E and use demonstrably read-only
inspection (`git status/log/diff/show`, repository-approved knowledge-graph queries). You
may NOT mutate them. See repo-root `CLAUDE.md` — Non-Negotiable Read-Only Boundary.

- Write artifacts only inside this control-plane repo (e.g. `docs/ringi/specs/`) and in
  the per-ringi TDD spreadsheet (via the locked contract).
- Preserve unrelated user changes. Never put secrets or unrelated `.env` values into an
  artifact.
- If implementation is requested, prepare a per-repo handoff prompt. Do not perform it.

## Code Intelligence (mandatory)

Per `CLAUDE.md`, use `codebase-memory` MCP **before** any source-file reading or search.
Do not begin code discovery with Grep, Glob, broad Read, or shell search when the MCP is
available.

| MCP project | Scope |
| --- | --- |
| `ldx-frontend` | Repository at `FE_PWD` |
| `ldx-backend` | `BE_PWD/ldx_addons` (deliberately limited — NOT complete backend blast radius) |
| `ldx-e2e` | Repository at `E2E_PWD` |

Mandatory sequence per affected project:

1. `list_projects` — select relevant project explicitly. Query every affected project.
2. `get_architecture` — orientation (use `clusters` to find de-facto module seams).
3. `search_graph` — resolve relevant symbols.
4. `trace_path` — **both directions** for callers/callees/dependencies/transitive blast radius.
5. `get_code_snippet` — only for specific qualified symbols the graph returned.
6. `detect_changes` for diff impact; `query_graph` for relationships higher-level tools miss.

Disclose gaps honestly:
- Backend graph covers `ldx_addons` only — external consumers need text search.
- Odoo `_inherit`/`_name`/comodel strings are **invisible to the graph** (verified
  limitation) — the extension/referencing sweeps in Impact & Gap Analysis are mandatory
  text search.
- Never refresh indexes implicitly; `./scripts/index-all-repo` only on explicit request.

## Parallel research agents (fan out together, all read-only)

Launch these as parallel agents in ONE message — do not serialize:

1. **Repo explorers** (one per affected repo) — the codebase-memory sequence above;
   correlate FE routes/clients, Odoo models/controllers, E2E flows.
2. **L-Pedia researcher** — runs the `l-pedia-search` skill (`.agents/skills/l-pedia-search`)
   for the ringi's domain terms/screens: pulls high-level business flow + prior Ringi
   decisions from the `LPedia` Confluence space (EN/Manuals + EN/Ringi trees), returns a
   cited case brief. JP terms stay verbatim. Gaps become "not found in L-Pedia" notes.
3. **Impact & gap analyst** — the sweeps below over the target aggregates.

Merge their findings before designing; cite each claim to its source (graph symbol,
L-Pedia page, or text-search path).

## Impact & Gap Analysis (standard BA practice, applied to the codebase)

Two standard requirements-engineering activities, made concrete against the repositories:

- **Impact analysis** — identify everything the change affects in the existing system.
  Requirements and approved patterns describe intent and shape, not blast radius.
- **Gap analysis** — behavior that demonstrably exists in code but no requirement
  addresses is a **requirements gap** → a `Question` row, never a silent "not required".

**When it runs** — any of: undoing a flow (cancel/revert/archive/void); extending an
existing document/aggregate; changing status/state semantics others read; touching key
actions (confirm/create/post/closing/import); adding producers/consumers; integrations
writing into existing models; **always** when replicating an approved pattern.

**Techniques, per target aggregate:**

1. **Extension sweep** — text-search `_inherit = '<model>'` / `_inherits` across ALL
   addons (+ FE wrappers). Verified graph limitation: Odoo `_inherit` assignments never
   become graph edges — mandatory text search.
2. **Referencing-model sweep** — relations to the target: histories, snapshots, issued
   documents, reserves, external identifiers (comodel strings — text search).
3. **Behavior-path sweep** — writes of the flow's key actions; reads filtering by its
   state (lists, exports, analytics, crons).
4. **Classify each finding**: `covered` / `no-impact` / `out-of-scope` (recorded user
   decision) / `PENDING` (gap → Question row in the sheet). For undo-type features
   refine `covered` into `reverse` / `block` / `accept-stale`.
5. **Record** in the spec's inventory with evidence; note bypass points (existing entry
   points that skip the new flow/guards).

## Requirements & Japanese Term Preservation

- Ground the spec in the source PRD. Carry exact requirement references and original
  wording into the spec. If an ambiguous PRD point would normally be a chat question, it
  becomes a `Question` BR/FR row + Q&A entry instead.
- **Preserve every Japanese term verbatim** (仕訳, 締め, 取消待ち, …) with an English
  gloss in parentheses at most — never translated away. Applies to FR text, error
  messages, status names, UI strings, and the JP charset under BOUNDARIES-U.

## TDD Sheet synchronization (locked contract)

Follow `.agents/skills/tdd-sheet-contract.md` exactly. This skill's writes:

1. **Locate or create the ringi's sheet**: search folder `1eFHQSvv0LXLTl7UzH0na-k1FuK5lFK0h`
   via `list_spreadsheets`; if absent, try
   `./scripts/gsheets-copy-template.sh "{Ringi N - Title} - TDD"`. The SA cannot own
   files (quota 0), so on the quota error STOP with the manual copy instructions
   (template → File → Make a copy into the folder, title `{Ringi N - Title} - TDD`,
   share to `ldx-76@ldx-project-505914.iam.gserviceaccount.com` as Editor) and resume
   once the sheet appears — never hand-build the sheet.
2. **Metadata (partial)**: `Title`, `Ringi Spec` (blob link to the committed spec),
   fresh `ID`, `Last Updated At`, `Status` = `In progress`. Never touch `Test Spec`,
   `Contract Spec`, or BOUNDARIES (owned by later pipeline stages).
3. **Treacibility Matrix**: data rows from row 10 — one row per FR (`1 Status = 1 FR`);
   BR-ID + Business Requirement + Source merged vertically per BR block; strict status
   vocabulary; `Screen / Page` = ldx-frontend route from `menu.json`.
4. **Q&A**: one row per `Question` with concrete options; Remarks on the TM row notes it.
5. On re-runs: **read the TM first** — ingest `Editted` (keep FR-ID, adapt to the edited
   wording) and `Rejected` rows (**read the Remarks reason first** — it may imply new or
   modified BR/FR; propose those as `Pending`), materialize answered Q&A rows (marking
   Q&A col F `AI Updated` with the changed FR-IDs), then apply the Done gate at the end
   (contract §Done gate): set `Metadata.Status = Done` when everything is `Approved` with
   no `Question`/`Draft` left. Never renumber IDs; never touch human-owned cells.

BR writing rules: BR = one clear non-technical sentence; FR = one-liner with the screen;
Source = simple pointer into the Ringi document.

## Checklist

1. **Execution setup** — confirm `/goal` long-running mode; resolve ringi id + title +
   PRD input; resolve & validate target repos from `.env`.
2. **Sheet setup** — locate/create the ringi TDD sheet (contract §Identity).
3. **Parallel research fan-out** — repo explorers + L-Pedia researcher + impact & gap
   analyst (one message, parallel).
4. **Impact & gap analysis synthesis** — classify every finding; gaps → `PENDING`.
5. **PRD grounding + JP terms** — requirement references; verbatim JP vocabulary.
6. **Design (autonomous)** — work through objective, scope, non-goals, domain model,
   `D` impact, contracts, data flow; approaches: pick the recommended option and record
   alternatives as `Question` rows when a material choice exists; do NOT ask chat
   questions one at a time.
7. **Write the spec** — `docs/ringi/specs/{ringi-id}-spec.md`, technical and 1:1 with
   the TM (field names, BE/FE components, symbols; JP terms verbatim; BOUNDARIES
   walkthrough; Impact Analysis & Requirements Gap Inventory; doc-vs-code deltas;
   decisions incl. those now recorded in sheet statuses).
8. **Write the sheet** — Metadata partial + TM rows + Q&A rows per the contract.
9. **Self-review** — placeholders/consistency/scope/ambiguity + BOUNDARIES + DDD +
   Impact & gap + JP terms + **contract compliance** (statuses strict, zones respected,
   human cells untouched) + BR one-liners readable by the product team.
10. **Commit** the spec (control-plane repo only).
11. **Report & hand off** — one final summary: what was designed, the Question rows
    awaiting bulk answers, the gate result, and the next pipeline step
    (`spec-test-plan-agent` once the gate passes). Emit the advisory per-repo
    implementation handoff. END — do not invoke implementation skills.

## BOUNDARIES Edge-Case Discovery

The spec's Error Handling & Edge Cases section must walk all ten letters (B O U N D A R I
E S — see the tdd-sheet-contract BOUNDARIES block for the canonical letters); state
**Applies / N/A + why** for each; map each applicable letter to TM/FR content. The
BOUNDARIES *status/TC-refs* cells in the sheet belong to `spec-test-plan-agent` — leave
them alone.

## Spec Self-Review

1. **Placeholder scan** — no TBD/TODO/vague requirements.
2. **Internal consistency** — spec ↔ sheet TM are 1:1 (same BR/FR IDs, same counts).
3. **Scope check** — single-handoff sized, or decomposed.
4. **Ambiguity check** — one interpretation only; open points exist ONLY as Question rows.
5. **BOUNDARIES check** — every applicable letter addressed.
6. **DDD check** — aggregates/entities/VOs match `trace_path`; the `D` is named.
7. **Impact & gap check** — inventory complete, every finding classified, gaps are
   Question rows, bypass audit done.
8. **Requirements & Japanese check** — every requirement reference carried; JP terms
   verbatim.
9. **Contract compliance** — statuses strict, write zones, merges, human-owned cells
   untouched, Metadata updated (ID/timestamp/Status).

## Implementation Handoff (advisory)

Terminal step: emit — do not execute — a per-repo handoff per the repo-root `CLAUDE.md`
standard (goal, scoped symbols, evidence, ordered steps, acceptance criteria,
verification, cross-repo dependencies). Remind the user of the pipeline order:
re-run `/brainstorming <sheet-link>` after human edits (it ingests answers and applies
the Done gate) → `spec-test-plan-agent` → contract agent (gated on
`Metadata.Status = Done`).
