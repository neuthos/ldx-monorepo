# L-DX Ringi Analysis Workflow

Follow these phases in order. Pause whenever a required human decision is unresolved.

## Contents

- Validate input and output boundary
- Interrogate the Ringi and maintain iterative Q&A
- Build graph-first code and history evidence
- Control context growth and resolve code-discovered questions
- Generate and validate approved artifacts

## 1. Validate the input and output boundary

1. Resolve the control-plane root with Git; do not hardcode a machine path.
2. Require one user-supplied Ringi input path. Accept a file or directory only when its canonical path is inside `<control-root>/docs/ringi/`.
3. Reject a path outside that tree or an implicit scan of every Ringi.
4. If the input is a file, use its filename stem for `<ringi-name>` and write only to `docs/ringi/<ringi-name>/`.
5. If the input is a directory, use that directory as the output directory and identify the authoritative source files inside it.
6. Never edit, rename, move, or normalize the source Ringi files.
7. Resolve and validate only `FE_PWD`, `BE_PWD`, and `E2E_PWD` from `.env` without inspecting target code or exposing unrelated values.
8. Before the first artifact write, capture non-mutating working-content baselines for the control plane and all three targets: current branch/HEAD, staged and unstaged per-file diff hashes, and untracked path-plus-content hashes. Also fingerprint the skill package and every pre-existing file in the Ringi output directory. `git status` alone is insufficient because later edits to an already-modified file would be invisible.
9. Keep baseline hashes only as run evidence; never persist raw target diffs or unrelated untracked content in an artifact. These fingerprints cover tracked and non-ignored untracked working content, not Git metadata or ignored artifacts; do not claim otherwise.
10. If multiple possible source versions exist, record the conflict and ask which source is authoritative before dependent analysis.

Write only these artifacts in the output directory:

- `questions-and-decisions.md`
- `agile-breakdown.xlsx`
- `test-coverage.xlsx`
- `fe-design.md`
- `be-design.md`
- `e2e-design.md`

Do not overwrite an existing artifact silently. Inspect it, preserve user answers and unrelated content, and ask before a material replacement.

## 2. Interrogate the entire Ringi first

Use the format-specific spreadsheet, PDF, or document skill. For multi-sheet Excel, inspect workbook structure and cell values, then render every meaningful sheet to capture screenshots, shapes, arrows, callouts, merged layouts, and Japanese copy.

Before asking the user anything:

1. Inventory every source, sheet/page, revision marker, and approval/status clue.
2. Preserve exact Japanese text and create an English translation.
3. Build an internal atomic behavior ledger with precise source pointers.
4. Compare repeated or overlapping content across the full Ringi.
5. Apply the mandatory domain review from `analysis-checklist.md`.
6. Separate confirmed source behavior, interpretation, conflict, and missing information.

Do not inspect existing code to fill a product-requirement gap. Existing code can explain current behavior only after the source interrogation is complete.

## 3. Create or append the Q&A ledger

Create `questions-and-decisions.md` in English. Keep Japanese evidence verbatim inside each question.

Use this structure:

```markdown
# Questions and Decisions — <Ringi name>

## Analysis State
- Source authority: SOURCE-CONFIRMED | PENDING | CONFLICT
- Current phase: WAITING_FOR_USER | READY_FOR_CODE_ANALYSIS | READY_FOR_ARTIFACTS
- Last analyzed source revision:
- Indexed revisions:

## Source Inventory
| Source | Revision/status | Authority | Notes |

## Round 1 — Document Interrogation

### Q-001 — <short title> [PENDING]
- Evidence:
  - Source: <sheet/page/cell>
  - Japanese: <exact text>
  - English: <translation>
- Confirmed:
- Unknown or conflict:
- Question:
- Why this blocks or changes the result:
- Options and consequences: <only when useful>
- User answer:
- Resolution: PENDING

## Approved Decisions
| Decision ID | Question ID | Decision | Evidence | Status |
```

Question rules:

- Ask only when the whole Ringi is silent, ambiguous, or internally conflicting.
- Batch all currently known questions into one round so the user can answer in the file.
- Do not choose an option, answer on the user's behalf, or change a user-written answer.
- Stop after writing a round. Tell the user to answer the ledger and say `continue`.
- On `continue`, re-read the complete source and ledger. Convert explicit answers into `USER-APPROVED` decisions.
- If an answer creates a new dependency or remains ambiguous, append the next numbered round below existing content and stop again.
- Never delete or rewrite prior rounds. Add a correction entry when a decision changes.

If no material document question remains, record that fact and request confirmation to begin codebase analysis rather than inventing questions.

## 4. Build graph-first codebase evidence

Begin only when source authority and document-level behavior are sufficiently resolved for the affected analysis.

1. Revalidate the paths captured in phase 1 and read each selected repository's current `AGENTS.md`/`CLAUDE.md`.
2. Call codebase-memory `list_projects` and `index_status`; record indexed root, branch, and HEAD for `ldx-frontend`, `ldx-backend`, and `ldx-e2e`.
3. Extract a numeric Ringi identifier only when the authoritative source provides one. Use capped read-only ref and commit discovery across all refs before asking which branch/phase is in scope; never infer the range from a branch name.
4. Compare indexed root, branch, HEAD, current working-tree fingerprint, and index-provenance evidence. Use these classifications:
   - `FRESH_SNAPSHOT`: creation and indexing of the specific control-plane snapshot were observed during this run; root, immutable branch/head SHAs, and the captured snapshot fingerprint still match.
   - `FRESH_WORKTREE`: a current-tree reindex was observed during this run; its exact user-approved dirty manifest and staged/unstaged/untracked fingerprint are still identical.
   - `HEAD_MATCH_UNVERIFIED`: branch/HEAD match, but no clean-snapshot provenance or index-time fingerprint exists.
   - `HEAD_MATCH_DIRTY`: branch/HEAD match and the current tree is dirty, but index coverage of that content is unproven.
   - `STALE`, `WRONG_ROOT`, or `SNAPSHOT_MISMATCH`: revision or root evidence does not match.
5. Never classify a pre-existing index as fresh from current cleanliness and matching HEAD alone. Codebase-memory 0.9.0 records neither an index timestamp nor a dirty-tree fingerprint, so an older dirty index can survive after its source becomes clean.
6. Ask the user to select repository scope and base/head refs for every relevant branch or phase. Resolve each selected ref immediately to an immutable commit SHA, show both SHAs, and record those SHAs—not mutable ref names—as the `USER-APPROVED` range. Verify that base SHA is an ancestor of head SHA; if it is not, stop and ask the user to approve the intended range semantics.
7. For requested uncommitted scope, create a read-only dirty manifest containing every changed/untracked path, status, per-file patch or content hash, and hunk summary. Require explicit approval of the complete manifest. If only a subset is approved, do not use graph `scope=all`; use targeted degraded evidence for the subset and keep graph coverage incomplete.
8. Bind graph analysis to the immutable approved range: require the approved head SHA to equal `index_status.git.head_sha` and require `FRESH_SNAPSHOT` or `FRESH_WORKTREE`. Otherwise stop graph-dependent work until the user requests a provably matching reindex, or mark graph analysis `UNVERIFIABLE` and continue only with an explicitly approved degraded Git/source analysis.
9. Treat `HEAD_MATCH_UNVERIFIED` and `HEAD_MATCH_DIRTY` blast-radius surfaces as incomplete. Do not guess that prior or current dirty content is included or excluded.
10. Never refresh automatically. `index-all-repo` replaces shared indexes and snapshots, so run it only as a separately approved user action. Capture index provenance and fingerprints immediately around an approved reindex.
11. For each approved committed range, seed the investigation with `detect_changes(project=<project>, since=<approved-base-sha>, depth=1)` before broader orientation. Add a separate `detect_changes(project=<project>, scope=all, depth=1)` only when the complete dirty manifest was user-approved, its current-tree reindex was observed in this run, and every manifest fingerprint remains unchanged.
12. Call `get_graph_schema` before any custom `query_graph`. Use `get_architecture` only for the selected path and overview aspect.
13. Use `search_graph` for entry symbols, `trace_path` inbound and outbound for blast radius, and `get_code_snippet` only for resolved qualified symbols.
14. Use targeted text/file search only for literals, configuration, Japanese copy, routes/selectors, XML, manifests, ACLs, Odoo dynamic relations, and graph gaps. Label it `SOURCE-FALLBACK`.
15. Correlate FE routes/clients, Odoo models/controllers, and E2E flows rather than analyzing each repository in isolation. Fast mode has no semantic/similarity or cross-project edges; join projects with exact routes, model names, payload fields, and selectors unless `get_graph_schema` explicitly proves an available relationship.
16. Inspect historical commits for affected files using the process in `analysis-checklist.md`.

Do not run tests, applications, generators, migrations, dependency installers, or any command that may write to a target repository or environment.

## 5. Control context growth

Analyze one approved vertical slice at a time:

1. Start from one atomic Ringi behavior or approved decision.
2. Resolve entry symbols with the graph.
3. Trace only connected callers, callees, contracts, tests, and history.
4. Summarize the slice into an evidence packet before loading another slice.
5. Keep four separate buckets: `Confirmed evidence`, `Inference`, `Unknown`, and `Decision required`.
6. Reuse symbol/path/commit references instead of retaining full source files.
7. Fetch only code snippets needed to support a claim.
8. Deduplicate shared surfaces across slices and record cross-slice dependencies once.

Use bounded defaults per pass: `search_graph` limit 10 with a file pattern when possible, `trace_path` depth 2, `query_graph` maximum 25 rows, at most five snippets per repository, at most 20 Ringi commit candidates per repository, and at most 10 history commits per affected file. Expand one bound only after narrowing the query, summarizing the current evidence, and recording why more evidence is required.

Do not broad-read all repositories, dump full graphs, load full Git histories, or keep every source sheet in active context after its evidence is summarized.

## 6. Append code-discovered questions

After blast-radius and history analysis, append a new Q&A round for any material issue such as:

- current code conflicts with the desired Ringi behavior;
- an API, data, permission, migration, selector, fixture, or error contract is absent;
- ownership or sequencing has product consequences;
- an expected result is not stated;
- an existing regression must be preserved or intentionally changed;
- a required repository/index is unavailable.

Show Ringi and code/history evidence side by side. Existing code is not an answer. Stop until the user records an explicit decision.

## 7. Generate the approved artifacts

Proceed only when every material dependency is `USER-APPROVED` or explicitly accepted as an analysis limitation. Read `output-contracts.md` completely before generating files.

Use the project-local planning skills as focused contracts:

- use `context-engineering` for the graph evidence packet;
- apply `spec-driven-development` decision discipline;
- apply `api-and-interface-design` for approved FE/BE contracts;
- apply `frontend-ui-engineering` for approved FE states and QA-consumable UI design;
- apply `planning-and-task-breakdown` for Agile hierarchy and repository handoffs.

This skill remains the orchestrator and produces all locked outputs. Do not implement target code.

When a referenced skill's generic artifact shape conflicts with `output-contracts.md`, follow the locked Ringi output contract. Reuse only the relevant evidence, decision, design, and planning discipline; do not import extra sheets or RED/GREEN/REFACTOR columns.

Generate all content in English while preserving Japanese source text wherever evidence is cited. Keep IDs, terminology, contract fields, risks, test cases, and decisions consistent across all files.

## 8. Validate before completion

1. Verify every atomic Ringi behavior and approved blast-radius obligation is represented by a test case or an explicit `Not Tested` gap.
2. Verify every design claim cites Ringi, graph/source, history, or a user-approved decision.
3. Verify exact routes, selectors, fixtures, and POM methods are real; otherwise mark the row blocked.
4. Verify Story Points are blank and appear only on Task rows.
5. Verify spreadsheet formulas, validations, and confidence metrics; scan for formula errors and render every sheet for visual inspection.
6. Verify all Markdown documents are internally consistent and contain no unresolved assumption disguised as a decision.
7. Compare branch/HEAD, staged and unstaged per-file diff hashes, untracked path-plus-content hashes, skill-package hashes, and pre-existing output-file fingerprints against the phase-1 baselines. Verify only the approved Ringi output artifacts changed. Report target tracked/non-ignored-untracked working content as unchanged only when those fingerprints match; make no claim about Git metadata or ignored artifacts.
8. Do not commit unless the user explicitly requests it.

Finish with artifact links, the three confidence percentages and their fractions, unresolved limitations, and repository-specific handoff readiness. Never report implementation readiness while a dependent decision is pending.
