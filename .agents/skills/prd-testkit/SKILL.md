---
name: prd-testkit
description: "End-to-end PRD test kit generator for the QA team: extracts requirements from a PRD into an editable HTML review page, then (on a second invocation) generates the traceability matrix, test cases, and answer keys as new tabs in the same page. Use whenever the user mentions a PRD, ringi, requirement extraction, test design, traceability matrix, test cases, answer key, or wants to continue/review an existing docs/{prd}/ page — even if they just say 'process this PRD', 'lanjut test design', or 'buka ringi-156'. Manages docs/{prd}/index.html, requirements.json, and design.json; never invents PRD content."
---

# PRD Test Kit

Two-agent pipeline behind one review page per PRD:

```
docs/{prd}/
├── prd.txt             ← PRD text (extracted by you from pdf/docx/md)
├── requirements.json   ← source of truth for requirements (updated via HTML Save)
├── design.json         ← test-designer output (TM + TC + AK + audit)
└── index.html          ← generated review page (never hand-edit)
```

Skill assets: `assets/template.html` (the page) and `scripts/serve.py` (save server) — resolve them relative to this SKILL.md's directory.

Detect the mode from the user's request:

## Mode 1 — new PRD → requirements review page

Trigger: user provides a PRD file (pdf/docx/md/txt) or says to process a new PRD.

1. **Resolve folder.** PRD name becomes the folder slug under `docs/` (e.g. `ringi-157` from the file/ringi name; reuse the user's wording — if they name a folder, use it exactly).
2. **Extract text** into `docs/{prd}/prd.txt`. PDF: use the pdf document tools (`open_document` + `read_document`) or `pdftotext -layout`. DOCX: use the docx document tools or `textutil -convert txt`. MD/TXT: copy as-is. If extraction yields garbage, stop and report — do not hand-wave a PRD.
3. **Dispatch the `requirement-extractor` agent** with input `docs/{prd}/prd.txt` (absolute path) and output directory `docs/{prd}/` (absolute path). Wait for its result and verify `requirements.json` exists and parses.
4. **Render the page.** Read `assets/template.html`, then replace the expression `/*__DATA__*/ null` (exactly as formatted, space included) with a JSON literal of this payload (compact, single line is fine):

```json
{ "prd_name": "<PRD name>", "docs_dir": "docs/<prd>", "requirements": <contents of requirements.json>, "design": null }
```

   When embedding, escape the string `</script>` inside the JSON as `<\/script>` (test data contains injection probes) and `/*__THEME__*/` as the theme CSS (leave the marker when `assets/theme.css` is absent — the baseline CSS is the working floor). Write the result to `docs/{prd}/index.html`.
5. **Start the save server (mandatory):** run in background `python3 <skill-dir>/scripts/serve.py docs/{prd} 8765` (use 8766+ if the port is busy) and give the user `http://127.0.0.1:8765/index.html`. The page saves via POST only — there is NO download fallback; if the user opens the file as `file://`, the page shows a banner with the exact serve command.
6. **Report** requirement counts, the not-testable ones, and the top ambiguity questions. Then STOP — no test design in this mode. Tell the user: review the Requirement tab (edit / add / delete; anything not deleted counts as approved), press Save, then invoke this skill again to continue.

## Mode 2 — continue → test design tabs

Trigger: user references the prd folder / html path / prd name and wants test design, the matrix, or the next step ("lanjut", "buat test case", "generate test design").

1. **Resolve `docs/{prd}/`.** Read `requirements.json`. If missing, tell the user to run Mode 1 first.
2. **Locate code manifests** `BE.txt` and `FE.txt`: check `docs/{prd}/` first, then the repo root. A manifest whose `PWD:` is empty or unreadable is passed as-is — the test-designer degrades gracefully. Never fill a manifest's PWD yourself; ask the user.
3. **Backup**: if `design.json` already exists, rename it to `design.backup.json` (overwriting any older backup) before regenerating — the team may have hand-edited it via the LLM-context flow.
4. **Dispatch the `test-designer` agent** with: requirements.json path, both manifest paths, output directory `docs/{prd}/`. Verify `design.json` parses.
5. **Re-render `index.html`** exactly as Mode 1 step 4, with `"design": <contents of design.json>`.
6. **Report**: TM/TC/AK counts, change-expected TMs (the upcoming-change safety nets), oracle-pending TCs, conflicts detected, and where the page is.

## Styling — mandatory: design-taste-frontend

The review page is an **app screen** (a working review tool: tabs, tables, modal), so its presentation MUST follow the repo's `design-taste-frontend` skill:

1. Before the FIRST render in this repo, invoke the `design-taste-frontend` skill and read its `references/app-screens.md` whole — the page run does not apply.
2. Deal the test kit's app style once: `node <design-taste-frontend>/scripts/draw.mjs --app --kind internal-tool --brief "QA test-design review page (requirements, traceability matrix, test cases)" --out .taste-skill/prd-testkit` — then distill the dealt direction (palette, type, panel/table/border treatment) into `assets/theme.css` inside THIS skill's folder. Deal once, reuse for every PRD; redeal only if the user asks for a new look.
3. On every render, inline `assets/theme.css` into the `<style id="theme">` block by replacing the marker `/*__THEME__*/` (if theme.css is absent, leave the marker — the template's baseline CSS is a working floor).
4. Theme overrides presentation only: NEVER rename element IDs, classes, or script hooks (`__PRDTESTKIT__` data marker, `/*__DATA__*/`, tab/nav structure, save button, copy buttons, modal) — tabs, save, copy-CSV/TSV, copy-LLM-context and the answer-key modal depend on them.
5. After the first themed render, follow the app-screen run's look-and-fix loop (screenshot + `inspect.mjs --app`) once per repo, not per PRD.

## Mode 0 — re-render only

Trigger: the user says refresh / re-render / update the page, and `docs/{prd}/requirements.json` exists. Skip the agents entirely: read the JSONs and rebuild `index.html` (Mode 1 step 4, with `"design"` set to the parsed `design.json` or `null`). Use this after an ingest prompt has updated a JSON elsewhere.

## The ingest loop (how the team's informal inputs become clean artifacts)

The Requirements view's **Copy to Agent** button copies a path-based prompt for a new agent session. Save edits first so the agent reads the same inputs from disk. The prompt names `requirements.json`, `prd.txt`, and the BE/FE manifests (resolve manifests in the PRD folder first, then the repo root).

When running that prompt:
- Analyze only entries with `ai_analyzed: false` in `ambiguities`, `qa_log`, `mom_notes`, and `supporting_docs`. Missing or invalid flags become false; only literal boolean true is archived. Initialize new inputs with false, including extractor ambiguities on the first render/save.
- Validate the input against the full PRD, existing requirements, and current BE/FE code. Trace dependencies across screens when relevant. Clear team decisions may extend PRD scope; do not reject an input just because the PRD omits it. Code reveals current behavior and dependencies, but cannot alone establish intended business rules. Unresolved conflicts or missing evidence stay pending.
- Update or add atomic English requirements with source input IDs and exact PRD/code evidence. Preserve existing IDs, references, and verbatim quotes; allocate new IDs above the existing maximum. A repeated pass must not duplicate coverage.
- Improve the input's writing without changing facts or uncertainty. Before the first wording change, preserve its editable fields in `original_input`. Keep document facts, numbers, labels, and quotations intact.
- Retain all inputs and answers in their original arrays. Each processed entry gets `analysis: {outcome, summary, req_refs, evidence}`; outcome is `updated`, `added`, `already_covered`, `not_applicable`, or `pending`. Summary explains the decision and coverage impact (or blocking question); evidence contains source references. Set true only once the entry is fully resolved and its supported requirement changes and links have been saved and verified. Already-covered inputs may be archived with linked REQs; irrelevant inputs need a clear reason. Empty, unanswered, partial, conflicting, and unverified inputs remain false.
- Recompute counts from retained data, validate strict JSON and references, report changed REQs and pending blockers, then re-render using Mode 0. This pass does not generate test design.

Keep both input states inside the Requirements page: each Ambiguities, Q&A log, MOM notes, and Supporting documents section has its own **Pending** and **Archived** tabs with counts. Sections switch independently; there is no Archived sidebar page. Pending shows false entries; Archived shows true entries, their content, analysis outcome, linked REQs, and evidence. Edit reopens an archived input in that section's Pending tab and clears stale `analysis`; ordinary input edits also invalidate analysis. The flag records completed analysis, not merely that an agent read the entry. Legacy true entries without analysis remain visible with an explicit missing-details message.

TM work goes through the TM tab's **Copy to Agent** button — its prompt enforces preview-before-write and makes the agent own TC/AK coherence: test cases are never edited directly, TC and answer-key changes are decided by that agent as consequences of TM changes. The TC tab exports instead: **Copy to Confluence** (filter-aware markdown that Confluence Cloud converts on paste) and three per-team TDD context buttons — **Copy BE context** (L-DX_Backend: be-unit + api-integration), **Copy FE context** (ldx-frontend: fe-unit), **Copy Automation context** (L-DX-E2E: e2e specs) — each a self-contained prompt embedding that team's TCs, answer keys, linked TM behaviours and requirements, with ask-for-the-PRD-first / review-when-done rules, plus a compact one-line Reference list of the other teams' TCs and a rule to propose suspected cross-team tests to QA instead of implementing them silently.

After that agent has rewritten the JSON, re-render with Mode 0. Mode 2 still backs `design.json` up to `design.backup.json` before regenerating with the test-designer agent.

## Rules

- `requirements.json` is the only source of truth for requirements; `index.html` is generated output — regenerate it, never hand-edit it. Regeneration never touches `prd.txt`.
- The HTML Save writes `requirements.json` only. TM/TC edits go through the TM tab's "Copy to Agent" prompt into a new LLM session, whose output replaces `design.json` — which is why Mode 2 backs it up first. Test cases are never edited directly: that agent owns the TC/answer-key adjustments implied by every TM change; the TC tab's copy buttons only export (Confluence markdown, per-team TDD contexts).
- Never run both phases in one invocation unless the user explicitly asks; the review checkpoint between them is the point of the flow.
- Ambiguities (AMB) shown in the page come from the extractor; if the user resolves one while reviewing, they note it in the REQ row — the next test-designer run picks it up from requirements.json.
- TM/TC IDs are positional, not append-only. The matrix renders in array order (sorted by the four group columns), and the team expects the last row to carry the highest `ID-CHECK-NNN`: when new entries are inserted at their sorted position mid-array, renumber the shifted `tm_id`s afterward so display order matches ID order again. Remap every cross-reference in the same pass — `test_cases[].tm_ids`, `meta.expected_changes[].linked_tms`, TM/TC notes, and slashed shorthands like `ID-CHECK-036/037` (a plain `ID-CHECK-NNN` string replace misses the shorthand tail) — then validate that `tm_id`s are sequential in array order and every reference resolves.
- Keep all paths relative to the repo root in what you print; use absolute paths when dispatching agents.
