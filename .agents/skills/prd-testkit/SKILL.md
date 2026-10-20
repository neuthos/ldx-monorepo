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
4. **Render the page.** Read `assets/template.html`, then replace the marker `/*__DATA__*/null` with a JSON literal of this payload (compact, single line is fine):

```json
{ "prd_name": "<PRD name>", "docs_dir": "docs/<prd>", "requirements": <contents of requirements.json>, "design": null }
```

   When embedding, escape the string `</script>` inside the JSON as `<\/script>` (test data contains injection probes). Write the result to `docs/{prd}/index.html`.
5. **Offer the save server** (makes Save write directly to requirements.json): run in background `python3 <skill-dir>/scripts/serve.py docs/{prd}` and tell the user to open `http://127.0.0.1:8765/index.html`. If they prefer opening the file directly, the Save button falls back to downloading `requirements.json` — instruct them to replace the file in `docs/{prd}/`.
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

## Rules

- `requirements.json` is the only source of truth for requirements; `index.html` is generated output — regenerate it, never hand-edit it. Regeneration never touches `prd.txt`.
- The HTML Save writes `requirements.json` only. TM/TC edits go through the "Copy LLM context" button into a new LLM session, whose output replaces `design.json` — which is why Mode 2 backs it up first.
- Never run both phases in one invocation unless the user explicitly asks; the review checkpoint between them is the point of the flow.
- Ambiguities (AMB) shown in the page come from the extractor; if the user resolves one while reviewing, they note it in the REQ row — the next test-designer run picks it up from requirements.json.
- Keep all paths relative to the repo root in what you print; use absolute paths when dispatching agents.
