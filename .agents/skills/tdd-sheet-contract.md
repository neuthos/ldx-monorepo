# TDD Sheet Contract (LOCKED)

Canonical, locked write-contract for the per-ringi TDD Google Sheet. Both writer skills
(`brainstorming`, `spec-test-plan-agent`) MUST follow this contract exactly. The contract
agent (`fe-be-e2e-contract-agent`) reads Metadata only. **Format is locked: never alter
structure, headers, dropdowns, or validation. If this file and the template disagree, stop
and ask the user — never improvise.**

Last verified against the template on 2026-08-18.

## Identity

| Item | Value |
|---|---|
| Template spreadsheet | `1ZEXFbzolW2VvDzm_h_Vp8DKutl0ACfVZ_CdKqgPA4Mo` ("Template") |
| Drive folder | `1eFHQSvv0LXLTl7UzH0na-k1FuK5lFK0h` |
| Per-ringi working copy | **The SA's Drive storage quota is 0 (verified) — it cannot own files.** Creation flow: the skill tries `scripts/gsheets-copy-template.sh "{Ringi N - Title} - TDD"`; on the quota error it stops with exact manual instructions (user: open the Template → File → Make a copy into folder `1eFHQSvv0LXLTl7UzH0na-k1FuK5lFK0h` with title `{Ringi N - Title} - TDD` → Share to `ldx-76@ldx-project-505914.iam.gserviceaccount.com` as Editor) and resumes as soon as the sheet appears in the folder. Editing user-owned shared sheets needs no quota and works today. |
| MCP | project-scoped `gsheets` server via `scripts/gsheets-mcp`; one-shot calls via `scripts/gsheets-mcp-call.sh <tool> <json>` |
| Tab names (locked, typos included) | `Metadata`, `Treacibility Matrix`, `Q&A`, `Testcases`, `Answerkey TC-{1}`, `Issue` |

## Global rules

1. **Status spellings are strict dropdowns** (`strict: true`). Allowed on TM/Testcases:
   `Pending`, `Approved`, `Editted`, `New`, `Question`, `Rejected`. On Q&A: `Draft`,
   `Forwarded To JP Team`, `Noted`. On Metadata: `Done`, `In progress`. Any other value is
   rejected by the sheet — do not try. **Status colors** are conditional-format rules
   (TEXT_EQ → background) installed on BOTH the template and each working sheet as part of
   sheet setup: TM `A3:A200` and Testcases `A2:A500` — Approved `#d9ead3`,
   Pending `#fff2cc`, Question `#fce5cd`, Editted `#d0e0e3`, Rejected `#f4cccc`,
   New `#d9d9d9`; Q&A `E3:E100` — Draft `#fff2cc`, Forwarded To JP Team `#d0e0e3`,
   Noted `#d9ead3`; Metadata `B7` — Done `#d9ead3`, In progress `#fff2cc`.
2. **Human-owned values — never overwrite:** any cell status `Approved` / `Editted` /
   `Rejected`, the Q&A `Answer` column, and the Answerkey `Result` rows. `Editted` /
   `Rejected` / `Answer` are human input channels the AI must read, not write.
3. **The `Issue` tab is never touched** by any skill. It is a development-time log.
4. **Write zones** — data REPLACES the template's guidance/options rows, starting at
   **TM row 3** and **Testcases row 2** (the template's option-list rows exist to be
   overwritten by real data — that is the intent). Before writing, extend the strict
   status validation over the data rows (TM `A3:A{last}` — `ONE_OF_LIST`:
   Approved/Editted/New/Pending/Question/Rejected; Testcases same; Q&A `E` over its data
   rows: Draft/Forwarded To JP Team/Noted) so every written status is a real dropdown.
   After writing, merge the BR blocks (Source/BR-ID/Business Requirement columns).
   **Screen/Page holds an ldx-frontend page only** (name + route from `menu.json` /
   L-Pedia screen number). Backend-only FRs get `-` in Screen/Page — backend module paths
   live in the spec markdown, not in this column. Multi-item cells (Q&A options, lists)
   use **one item per line** (`\n`), never ` | ` separators.
   Content language: **English**; Source format `PRD <Doc> <sec>` (no `§`); Japanese
   status terms carry an English gloss on first use, e.g.
   "Pending Cancellation (取消待ち)".
5. **IDs are stable and monotonic.** Never renumber existing IDs. New rows take the next
   free number. `{title}` = Metadata `Title` with spaces replaced by `-`
   (e.g. `Ringi-100-Cancellation-Phase-3`).
6. One status cell per FR row (`1 Status = 1 FR`). BR-ID / Business Requirement /
   Source cells are **vertically merged per BR block** (1 BR : many FR).
7. Every mutation updates Metadata: new random `ID`, `Last Updated At` `YYYY/MM/DD HH:MM`,
   and `Status` (`In progress` while any row is Pending/Question; `Done` only when the
   Done gate passes). **ID is the sync checksum**: the same ID is embedded in each
   generated markdown (`{ringi-id}-spec.md`, `-test-spec.md`, `-contract.md`); sheet +
   three specs sharing one ID means they are in sync — a mismatch means one of them is
   stale and must be regenerated.

## Tab contracts

### Metadata (key-value A/B; BOUNDARIES block rows 9–19)

| Row | Field | Written by | Rule |
|---|---|---|---|
| 2 | Title | brainstorming | ringi title, e.g. `Ringi 100 Cancellation - Phase 3` |
| 3 | Ringi Spec | brainstorming | GitHub blob link to `{ringi-id}-spec.md` |
| 4 | Test Spec | spec-test-plan-agent | link to `{ringi-id}-test-spec.md` |
| 5 | Contract Spec | contract agent run | link to `{ringi-id}-contract.md` (or `-` until generated) |
| 6 | ID | any writer | random ID regenerated on every change |
| 7 | Status | any writer | `Done` / `In progress` — `Done` is the contract-agent gate |
| 8 | Last Updated At | any writer | `YYYY/MM/DD HH:MM` |
| 9–19 | BOUNDARIES | spec-test-plan-agent | per letter: `Covered` with TC-IDs in TC Refs, or `None` with the reason text in TC Refs |

### Treacibility Matrix (A:H, data from row 3)

| Col | Field | Rule |
|---|---|---|
| A | Status | `Pending` when brainstorm is confident; `Question` for dummy BR/FR awaiting confirmation (then a Q&A row must exist and Remarks notes it) |
| B | Source | why this exists, from the Ringi document — keep it simple (section/short quote) |
| C | BR-ID | `BR-{title}-{nn}` — merged vertically across the BR's FR rows |
| D | Business Requirement | ONE clear non-technical sentence for the product team — merged with BR-ID |
| E | FR-ID | `FR-{title}-{nn}` |
| F | Screen / Page | ldx-frontend page (from `menu.json` route) touched by this FR |
| G | Functional Requirement | one-liner FR |
| H | Remarks | context; mandatory note when Status = `Question` |

### Q&A (A:F, append)

| Col | Field | Rule |
|---|---|---|
| A | BR-ID / FR-ID | the questioning row's ID (or `-`) |
| B | Question | confirmation question, phrased simply |
| C | Options | concrete answer options to make replying easy — one option per line (`\n`) |
| D | Answer | **human only** |
| E | Status | `Draft` when created; human may set `Forwarded To JP Team` / `Noted` |
| F | AI Updated | **AI only** — awareness marker: written when the answer has been ingested. Format: `Yes — YYYY/MM/DD — <what changed: updated FR-IDs / added FR-IDs / no change>`. Empty = not yet ingested. Answers are NOTED facts: an answer may add new BR/FR — the marker exists precisely so humans can see which answers already produced rows. |

### Testcases (A:H, data from row 2; one step per row)

| Col | Field | Rule |
|---|---|---|
| A | Status | same strict set as TM |
| B | TC-ID | `TC-{title}-{nn}` — written on the first row of the case, merged down |
| C | Covered FR-ID | comma-separated FR-IDs |
| D | Category | `Happy Path` / `Negative path` / `Edge case` / `Error handling` / `Boundaries` |
| E | Test Case Title | "Should be able to …" one-liner — merged down |
| F | Test Type | `Backend Unit Testing` / `Frontend Unit Testing` / `E2E Integration Testing` / `E2E Testing` |
| G | Case | numbered steps, ONE STEP PER ROW (`1. Preparation data…`, `2. …`) |
| H | Remarks | notes for this TC |

### Answerkey TC-{n}

Tab `Answerkey TC-{1}` holds the locked generation prompt in `B1`. For each TC needing an
answer key: `copy_sheet` the template tab, rename to `Answerkey TC-{n}`, fill per the
prompt's output contract (header block + step blocks + `Expectation:` lines). `Result`
rows stay blank for QA.

## Re-brainstorm rules (Editted / Rejected awareness)

1. Before regenerating anything, **read the TM first**. Rows whose status is `Editted` or
   `Rejected` carry human decisions that override the previous brainstorm output.
2. `Editted` FR: keep the FR-ID; adapt the spec and downstream artifacts to the edited
   wording; only the human may move the status back to `Approved`/`Pending`.
3. `Rejected` row: **read the Remarks reason FIRST** — the reason is a decision, not just
   a deletion. It may imply new or modified BR/FR elsewhere (e.g. "rejected because we
   will handle it via the Return flow instead" → propose the corresponding FR as a new
   `Pending` row). Then exclude the rejected row from spec regeneration and downstream
   test/contract output, and record the reason verbatim in the regenerated spec.
4. `Question` rows: regenerate faithfully as dummy BR/FR + Q&A entry until the human
   answers; then materialize the real BR/FR from the answer — which may ADD new BR/FR or
   modify existing ones — and write the `AI Updated` marker (Q&A col F) listing exactly
   which FR-IDs were updated/added.
5. New rows never reuse an ID of an Editted/Rejected row.

## Interaction mode (Excel is the conversation)

The brainstorming skill does **not** ask the user questions one at a time in chat. It runs
the full design flow end to end, and every uncertainty becomes machine-written content:
a TM row with Status `Question` (dummy BR/FR), a matching Q&A row with concrete options,
and a note in Remarks. The human answers everything at once in the Excel (Q&A `Answer`
column; status changes on TM/Testcases rows; reasons usually go in `Remarks`). Chat stays
for approvals the contract cannot encode (design approach selection, scope decisions).

## Done gate (checked by `brainstorming` at the end of every run)

`Metadata.Status` becomes `Done` only when ALL of the following hold:

1. Every Treacibility Matrix data row status = `Approved` (no Pending / Question /
   Editted / Rejected / New).
2. Every Testcases data row status = `Approved` (same rule).
3. No TM/Testcases row carries Status `Question`, and every Q&A row has Status
   `Noted` or `Forwarded To JP Team` (no `Draft` left) — i.e. nothing is still awaiting
   a human answer.

If any row is `Editted` or `Rejected`, the gate does not just fail — those rows carry
human decisions in `Remarks` that the same brainstorming run MUST ingest before finishing
(see Re-brainstorm rules).

## Markdown artifacts (generated in parallel, same content split by audience)

| File | Writer | 1:1 with | Audience/language |
|---|---|---|---|
| `docs/ringi/specs/{ringi-id}-spec.md` | brainstorming | TM | technical — field names, BE/FE components, symbols |
| `docs/ringi/test-plans/{ringi-id}-test-spec.md` | spec-test-plan-agent | Testcases | FE/BE/E2E teams, parallel-ready |
| `docs/ringi/contracts/{ringi-id}-contract.md` | contract-agent run | Testcases (E2E TCs → POM with every element clicked/filled) | end-to-end implementation contract |

## Skill responsibility matrix

| Skill | Metadata | TM | Q&A | Testcases | Answerkey | Markdown |
|---|---|---|---|---|---|---|
| brainstorming | partial (Title/Ringi Spec/ID/timestamp/Status incl. the Done gate) | ✅ | ✅ | — | — | `{ringi-id}-spec.md` |
| spec-test-plan-agent | partial (Test Spec/BOUNDARIES/ID/timestamp/Status) | read-only | — | ✅ | ✅ | `{ringi-id}-test-spec.md` |
| fe-be-e2e-contract-agent | reads `Status` — **must be `Done`** (set by brainstorming's gate) to proceed; writes Contract Spec link afterward | read-only | — | read-only | — | `{ringi-id}-contract.md` |
