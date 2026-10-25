# ldx-monorepo — L-DX cross-project workspace

Shared home for LDX assets that do not belong to a single product repository.
It currently hosts cross-project agent skills and per-PRD review kits used by
QA, and is the intended landing place for future shared tooling (RAG over the
PRD corpus, automation helpers, and similar).

The product repositories live as siblings on the developer machine and are
referenced from here, never modified from here:

| Repository | Role |
| --- | --- |
| `L-DX_Backend` | Odoo backend (ldx_addons) |
| `ldx-frontend` | React frontend |
| `L-DX-E2E` | Cypress end-to-end suite |

## What lives here

| Path | Purpose |
| --- | --- |
| `.agents/skills/` | Reusable skills — `prd-testkit` (PRD → test design review pipeline), `design-taste-frontend` (frontend visual direction) |
| `.agents/agents/` | Agent definitions — `requirement-extractor`, `test-designer` |
| `docs/<prd>/` | One working folder per PRD: `prd.txt`, `requirements.json`, `design.json`, generated `index.html` |
| `prd.sh` | Mode 0 runner: re-render a PRD review page and serve it (`./prd.sh docs/<prd>`) |
| `BE.txt` / `FE.txt` | Code-root manifests consumed by the test-design agent (each points at a sibling repo checkout) |
| `AGENTS.md` | Behavioral guidelines for agents working in this repo, plus the test-design checklist |
| `.taste-skill/` | Design-taste inspection artifacts |
| `skills-lock.json` | Pinned skill versions |

## Current focus: PRD Test Kit

Two-agent pipeline behind one review page per PRD under `docs/`:

1. **Mode 1** — extract requirements from the PRD into `requirements.json`,
   review them on the page, save.
2. **Mode 2** — generate the test design (`design.json`: traceability matrix,
   test cases, answer keys) and render the TM/TC/Audit tabs.
3. **Mode 0** — re-render only, after any JSON is edited on disk.

The Test Cases tab exports TDD context per team (BE = `L-DX_Backend`
be-unit + api-integration, FE = `ldx-frontend` fe-unit, Automation =
`L-DX-E2E` e2e) plus a filter-aware Confluence markdown copy. All design
edits flow through the TM tab's agent prompt; test cases change only as
consequences of TM changes.

Run the regression suites before committing skill changes:

```bash
node --test .agents/skills/prd-testkit/tests/review-page.test.mjs
python3 .agents/skills/prd-testkit/tests/test_serve.py
```

## Conventions

- PRD folders under `docs/` are kebab-case slugs of the document name
  (`ringi-0151`, `ringi-0152`, …). Folder names are stable once created:
  they are recorded in saved JSONs and in every agent prompt the team copies.
- Docs, commit messages, and PR descriptions are in English; `AGENTS.md`
  governs agent behavior in this repo.
- Generated files (`index.html`) are reproducible from the JSONs via
  Mode 0; the JSONs are the source of truth.

## Roadmap

- RAG over the accumulated PRD / requirements / test-design corpus.
- Further cross-project skills and shared automation.
