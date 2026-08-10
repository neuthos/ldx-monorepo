---
name: ldx-ringi-analyze
description: Analyzes L-DX Ringi source files, usually multi-sheet Japanese Excel, PDF, or DOCX, against the indexed Next.js frontend, Odoo ldx_addons backend, and Playwright E2E codebases; conducts evidence-first iterative Q&A; and produces approved Agile breakdown, test-coverage, and FE/BE/E2E design artifacts. Use when a user supplies a Ringi path under docs/ringi or requests Ringi-to-code impact, blast-radius, historical-commit, test-design, or cross-repository implementation-planning analysis.
---

# Analyze an L-DX Ringi

Turn one user-selected Ringi into evidence-backed, user-approved planning artifacts. Preserve the source, investigate all affected repositories read-only, and never fill a product or technical decision gap yourself.

## Read the bundled contracts

Read these files completely at the indicated phase:

- Before any task action, read [references/workflow.md](references/workflow.md).
- Before interrogating domains or code, read [references/analysis-checklist.md](references/analysis-checklist.md).
- Only after all material questions are resolved and artifact generation begins, read [references/output-contracts.md](references/output-contracts.md).

Do not partially read a selected reference.

## Enforce the boundary

- Require an explicit source file or directory whose canonical path is inside the current control plane's `docs/ringi/` tree.
- Treat the source Ringi and every repository from `FE_PWD`, `BE_PWD`, and `E2E_PWD` as read-only.
- Write only planning artifacts in `docs/ringi/<ringi-name>/` inside this control plane.
- Never run target tests, applications, migrations, generators, dependency installation, branch changes, Git mutations, or shared-environment operations.
- Never initialize or refresh codebase-memory indexes unless the user explicitly requests that separate action.
- Never commit unless the user explicitly requests it.

## Preserve human decision authority

Use only these decision states:

- `SOURCE-CONFIRMED`: directly established by the authoritative Ringi.
- `USER-APPROVED`: explicitly answered by the user and recorded in the ledger.
- `PENDING`: a material answer is missing.
- `CONFLICT`: authoritative sources disagree.
- `UNVERIFIABLE`: required evidence is unavailable.

Do not choose or silently assume scope, desired behavior, UX, API/data semantics, validation/error behavior, repository ownership, permissions, decimal/rounding, JST/date, migration, performance/security trade-offs, selectors, fixtures, test exclusions, delivery order, or risk acceptance. Code and historical precedent prove current behavior, not desired behavior.

When any dependent choice is `PENDING`, `CONFLICT`, or `UNVERIFIABLE`:

1. show the confirmed evidence and the unknown;
2. explain the affected artifact or consequence;
3. present concrete options only when they help the user answer;
4. append the question to `questions-and-decisions.md`; and
5. stop dependent work.

## Follow the gated workflow

1. Validate the input and output boundary.
2. Inspect the entire Ringi, including all sheets/pages, Japanese text, screenshots, shapes, callouts, revisions, and attachments.
3. Preserve Japanese evidence and place an English translation below it.
4. Build the atomic behavior and mandatory-domain ledger before inspecting code.
5. Create or append one English `questions-and-decisions.md` round. Ask the Ringi first; ask the user only when the complete document is silent, ambiguous, or conflicting.
6. Stop so the user can answer in the file and say `continue`.
7. On `continue`, re-read the entire source and ledger. Preserve raw answers and record explicit decisions as `USER-APPROVED`.
8. After document questions clear, use codebase-memory graph-first across every affected project, then targeted source/history fallback.
9. Append code-discovered questions below prior rounds and stop again when necessary.
10. When every dependent choice is approved, generate and validate all locked outputs.

Never overwrite previous Q&A rounds or user answers. A later correction must append a superseding decision.

## Use graph-first evidence

Resolve repository paths from `.env` without sourcing it or exposing unrelated values. Read each selected repository's local rules.

For code analysis:

1. Call `list_projects` and `index_status`; record project, indexed root, branch, HEAD, working-tree fingerprint/provenance, and backend scope.
2. Discover capped Ringi branch/commit candidates across refs. Require user-approved repository scope, resolve selected base/head refs to immutable commit SHAs, verify ancestry, and record the approved SHAs. Do not select a phase from its name or keep a mutable ref as the analysis boundary.
3. Require the approved head SHA to equal the indexed HEAD and require same-run observed snapshot/current-tree indexing with an unchanged captured fingerprint before graph-dependent analysis. Matching HEAD and a currently clean source alone are not proof of freshness. Treat every unproven root/revision/working-tree state as `UNVERIFIABLE`, or continue only with an explicitly approved degraded Git/source analysis.
4. Seed each approved committed range with `detect_changes(project=<project>, since=<approved-base-sha>, depth=1)`. Use `scope=all` only when the complete dirty path/hunk/hash manifest was user-approved, freshly indexed during this run, and remains unchanged. Call `get_graph_schema` before custom queries, then use path-scoped `get_architecture`, limited `search_graph`, depth-bounded inbound/outbound `trace_path`, targeted `get_code_snippet`, and row-bounded `query_graph` as applicable.
5. Correlate FE routes/clients, Odoo models/controllers, and E2E flows explicitly. Fast mode has no semantic/similarity or cross-project edges; use exact route, model, payload, and selector evidence unless the current schema proves another relationship.
6. Use targeted fallback only for literals, configuration, Japanese copy, URL/selectors, XML, manifests, ACLs, Odoo dynamic relationships, and graph gaps.
7. Inspect relevant historical commits for affected files and explain the behavioral significance of each selected commit.

The backend graph covers only `BE_PWD/ldx_addons`. Never call it the complete Odoo blast radius without disclosing and checking permitted external consumers.

## Prevent context flooding

- Analyze one approved vertical slice at a time.
- Resolve entry symbols before reading source.
- Fetch only snippets, tests, and commits supporting the current claim.
- Summarize each slice into `Confirmed evidence`, `Inference`, `Unknown`, and `Decision required` before moving on.
- Retain symbol/path/commit pointers instead of full source dumps.
- Deduplicate shared contracts and affected surfaces across slices.
- Do not broad-read repositories, dump full graphs, or load full Git histories.
- Default each pass to 10 graph search results, trace depth 2, 25 query rows, five snippets per repository, 20 Ringi commit candidates per repository, and 10 history commits per affected file. Expand only after narrowing and summarizing the evidence.

## Produce the locked outputs

Create exactly:

1. `questions-and-decisions.md`
2. `agile-breakdown.xlsx` with one `Agile Breakdown` sheet
3. `test-coverage.xlsx` with `Coverage Summary`, `Test Cases`, and `Test Data & Boundaries`
4. `fe-design.md`
5. `be-design.md`
6. `e2e-design.md`

Write artifact prose in English. Keep Japanese text with its translation inside evidence citations.

The Agile workbook follows Ringi/PRD → Epic → Story → Task. Do not create a PRD row. Put Story Points only on Task rows and leave them blank for the team.

The coverage summary reports three formula-derived percentages without an aggregate:

- Ringi Interpretation Confidence
- Blast Radius Confidence
- Test Coverage Confidence

Its domain table has exactly `Domain Tag`, `Status`, and `Notes`. Use only `Tested` and `Not Tested`; define `Tested` as covered by the design, not executed or passed.

In Test Cases, use `UT BE`, `UT FE`, or `QA` as Category and keep `Unit`, `Integration`, `E2E`, or `Manual UI` in a separate Test Level column. Do not include RED, GREEN, REFACTOR, Automation Target, Repository, or PRD ID columns. The test case is the test-first proof that implementation agents will make fail before code changes.

For QA Integration/E2E/Manual cases, write complete numbered flows with verified routes, fixtures/helpers, Page Object methods, selectors, exact data, actions, assertions, cleanup, and serialization. Mark unverified details `PENDING` and block the row; never invent them.

Always produce FE, BE, and E2E design documents. If a repository is confidently unaffected, write a concise `NO CHANGE` conclusion with supporting evidence rather than omitting its document.

## Validate completion

- Verify internal 1:1 coverage from every atomic Ringi behavior to at least one Test Case or explicit `Not Tested` gap, even though no requirement table appears in the summary sheet.
- Verify each blast-radius regression obligation is represented.
- Verify each design claim cites Ringi, graph/source, history, or a user decision.
- Verify test data is Ringi-specific or convention-backed and usable by manual QA.
- Verify spreadsheet formulas, controlled values, rendering, and formula-error scans.
- Verify no temporary renders or inspection sidecars remain in the output directory.
- Verify target repositories remain unmodified.

Finish with links to all artifacts, the three confidence fractions and percentages, unresolved limitations, and separate FE/BE/E2E handoff readiness. Do not report implementation readiness while a dependent decision remains unresolved.
