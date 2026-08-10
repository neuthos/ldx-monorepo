# Locked L-DX Ringi Output Contracts

Apply these user-approved contracts exactly. Do not add sheets, scoring systems, estimates, or implementation decisions without new approval.

## Contents

- Shared rules and Q&A ledger
- Agile breakdown workbook
- Test coverage workbook
- FE, BE, and E2E design documents
- Spreadsheet quality gates

## Shared rules

- Write all artifact prose in English.
- Preserve cited Japanese Ringi text and place its English translation immediately below it.
- Use the same Epic, Story, Task, Test Case, Test Data, Question, and Decision IDs across every artifact.
- Treat the Ringi as the PRD; do not add a PRD row or PRD ID column.
- Cite current code and historical evidence when a test or design obligation comes from blast radius rather than explicit Ringi text.
- Mark all artifacts `DRAFT` until their dependent decisions are `USER-APPROVED`.
- Do not include secrets, unrelated `.env` values, or machine-specific repository paths.
- Do not write implementation code or edit FE/BE/E2E.

## 1. `questions-and-decisions.md`

Use the append-only structure in `workflow.md`. Keep every question, raw user answer, resolution, evidence reference, and superseding decision. Never create another Q&A file for later rounds.

## 2. `agile-breakdown.xlsx`

Create exactly one sheet named `Agile Breakdown`.

Place source title/revision, analysis status, indexed branch/HEAD baselines, and a legend above the table. Then write one hierarchical table ordered as:

```text
Epic 1
  Story 1
    Task 1
    Task 2
  Story 2
    Task 3
Epic 2
  ...
```

Use these columns in this order:

1. `Row Type` — `Epic`, `Story`, or `Task`
2. `ID`
3. `Parent ID`
4. `Category` — blank for Epic/Story; exactly `FE`, `BE`, or `QA` for Task
5. `Title`
6. `Outcome / Description`
7. `Acceptance Criteria`
8. `Evidence References`
9. `Test Case IDs`
10. `Dependencies`
11. `Risk Level`
12. `Blocking Question IDs`
13. `Status`
14. `Story Points`

Rules:

- Use Epic for a bird's-eye business outcome, Story for user-observable behavior, and Task for a repository-owner handoff.
- Put Story Points only on Task rows and leave every value blank for the team.
- Never estimate Story Points, hours, file counts, or delivery dates.
- Make every Task small enough for one repository-specific implementation session and independently verifiable after its dependencies.
- Keep FE/BE/QA dependencies and contract sequencing explicit.
- Link every behavior-changing Task to Test Case IDs that act as the implementation agent's test-first proof.
- Do not include RED/GREEN/REFACTOR columns; repository-specific implementation agents manage that cycle.
- Use exactly `Critical`, `High`, `Medium`, or `Low` for `Risk Level`.
- Use exactly `Draft`, `Blocked`, or `Ready for Handoff` for `Status`.

## 3. `test-coverage.xlsx`

Create exactly three sheets in this order:

1. `Coverage Summary`
2. `Test Cases`
3. `Test Data & Boundaries`

### `Coverage Summary`

Keep this sheet summary-only. Do not add a requirement traceability table.

Place source/revision and indexed baselines at the top. Add a confidence table with:

| Confidence Metric | Complete/Covered | Total | Confidence % | Evidence and Gaps |
| --- | ---: | ---: | ---: | --- |
| Ringi Interpretation Confidence | formula input | formula input | formula | evidence |
| Blast Radius Confidence | formula input | formula input | formula | evidence |
| Test Coverage Confidence | formula input | formula input | formula | evidence |

Use the definitions in `analysis-checklist.md`. Show whole percentages and formulas. Do not create an aggregate confidence score.

Below it, create a domain table with exactly three columns:

| Domain Tag | Status | Notes |
| --- | --- | --- |

Use only `Tested` or `Not Tested` in `Status`. Define `Tested` in the workbook as design coverage, not an executed/passed test. Include every mandatory domain and any additional identified risk domain. Explain concrete Test Case IDs or the gap in `Notes`.

Do not include the removed columns/table:

- Ringi Source / Requirement mapping table
- Epic ID / Story ID / Task IDs mapping table
- Affected Categories
- Risk Level
- Test Case IDs
- Coverage Status
- Blocking Question IDs
- Gap Explanation

Those relationships live in the Test Cases sheet and internal validation, not in the summary.

### `Test Cases`

Use these columns in this order:

1. `Test ID`
2. `Evidence Type` — `Ringi`, `User Decision`, `Blast Radius`, `Historical Regression`, or a semicolon-separated combination
3. `Evidence Source`
4. `Epic ID`
5. `Story ID`
6. `Task ID`
7. `Category` — exactly `UT BE`, `UT FE`, or `QA`
8. `Test Level` — `Unit`, `Integration`, `E2E`, or `Manual UI`
9. `Feature / Module / Flow`
10. `Risk Level`
11. `Domain Tags`
12. `Test Title`
13. `Coverage Intent`
14. `Preconditions`
15. `User Role`
16. `Test Data IDs`
17. `Fixture / Setup Reference`
18. `Detailed Execution Steps`
19. `Expected Result`
20. `Regression Scope`
21. `Blocking Question IDs`
22. `Status`

Format `Evidence Source` as multiline evidence. Use the applicable blocks:

```text
Ringi — <sheet/page/cell>
JP: <exact Japanese>
EN: <English translation>

Code — <MCP project>: <qualified symbol or path and relationship>
History — <short SHA>: <subject and relevance>
Decision — <DEC-ID>: <approved result>
```

A test may originate solely from blast radius or a historical regression. Do not force a Ringi pointer when none exists.

Category and level mapping:

- `UT BE` + `Unit`: Odoo addon model/controller/business-invariant proof.
- `UT FE` + `Unit`: frontend unit/component/hook/service proof.
- `QA` + `Integration`: FE/BE contract or integrated flow proof owned by QA.
- `QA` + `E2E`: critical Playwright business journey.
- `QA` + `Manual UI`: visual, Japanese-language, accessibility, or exploratory proof that automation should not replace.
- Use exactly `Critical`, `High`, `Medium`, or `Low` for `Risk Level`.
- Use exactly `Draft`, `Blocked`, `Ready for TDD`, `Existing Coverage`, or `Manual Only` for `Status`.

Do not include:

- `RED — Expected Failure`
- `GREEN — Minimum Behavior`
- `REFACTOR Boundary`
- `Automation Target`
- `Repository`
- `PRD ID`

The planned test itself is the TDD-first proof. The repository implementation session handles RED, minimum GREEN, and REFACTOR execution.

Detailed-step rules:

- Make QA Integration/E2E/Manual flows complete and numbered, even when the business journey crosses several pages.
- Include verified fixture/helper calls, arguments, exact routes, Page Object methods, selectors, field values, clicks, assertions, cleanup, and serialized dependencies.
- Use real codebase evidence such as `doCreateSalesSlipWith...` only when the exact helper exists.
- Use verified stable selectors such as `data-testid` only when found or explicitly approved as a new contract.
- Write `PENDING — not found in current evidence` and block the row instead of inventing a URL, selector, fixture, or expected result.
- Keep lower-layer tests focused; do not duplicate every unit boundary in Playwright.

### `Test Data & Boundaries`

Use these columns in this order:

1. `Data ID`
2. `Evidence Source`
3. `Story ID`
4. `Task ID`
5. `Domain Tags`
6. `Entity / Field / State / Role`
7. `Business Meaning`
8. `Data Origin` — `Ringi Value`, `Existing Fixture`, or `Proposed Test Data`
9. `Partition / Boundary`
10. `Exact Input Value`
11. `Setup / Fixture`
12. `Transport Value`
13. `Stored Value`
14. `Displayed Value`
15. `Expected Behavior`
16. `JST / Closing / Archive Context`
17. `Privilege Context`
18. `Japanese Input`
19. `Volume / Concurrency`
20. `Cleanup`
21. `Test Case IDs`
22. `Blocking Question IDs`

Use feature-specific, recognizable values suitable for automation and manual testing. Preserve identifier strings and leading zeros. When a value is proposed, follow verified L-DX conventions and label it as proposed. Never use unexplained dummy values.

## 4. `fe-design.md`

Make this document directly consumable by FE implementers and QA/E2E designers.

Use these sections:

```markdown
# FE Design — <Ringi name>
## Status, baselines, and approved decisions
## Objective, scope, and non-goals
## Bilingual Ringi evidence
## Current frontend architecture and historical evidence
## Screen and route flow
## Component, state, hook, service, and type design
## FE/BE contract dependencies
## Loading, empty, validation, error, and permission states
## Japanese i18n and accessibility
## Stable selector and Page Object contract
## FE unit/component test design
## QA-consumable flow and test data references
## Blast radius, compatibility, performance, and risks
## Repository-agent handoff
```

Include unchanged elements that E2E Page Objects need to traverse the complete flow. Distinguish existing verified selectors from approved new selector requirements. Do not invent component, URL, payload, or UX decisions.

## 5. `be-design.md`

Make this document directly consumable by BE implementers and FE integrators.

Use these sections:

```markdown
# BE Design — <Ringi name>
## Status, baselines, and approved decisions
## Objective, scope, and non-goals
## Bilingual Ringi evidence
## Current Odoo architecture and historical evidence
## Addon, model, controller, service, and job impact
## Approved request/response and data contracts
## Validation and error semantics
## Transactions, concurrency, and idempotency
## Privilege, ACL, record-rule, and security design
## Decimal, rounding, JST, archival, closing, and zero/null semantics
## Migration, defaults, and backward compatibility
## Performance and observability
## Odoo addon test design
## FE integration contract
## Blast radius, rollout, rollback, and risks
## Repository-agent handoff
```

Disclose that graph coverage is limited to `ldx_addons`. Specify stable approved contracts so FE can integrate without guessing. Do not choose payload, field, error, migration, or permission behavior without approval.

## 6. `e2e-design.md`

Make this document directly consumable by QA automation implementers and manual QA.

Use these sections:

```markdown
# E2E Design — <Ringi name>
## Status, baselines, and approved decisions
## Objective, scope, and non-goals
## Ringi and blast-radius evidence
## Existing scenarios, Page Objects, fixtures, and history
## Coverage strategy across UT BE, UT FE, Integration, E2E, and Manual UI
## Page Object design, including unchanged required elements
## Detailed business flows with real routes and selectors
## Fixture/API setup and feature-specific test data
## Shared preview state, serialization, cleanup, and recovery
## Japanese UI, permission, error, boundary, and regression coverage
## Risks, gaps, and blocked selectors/fixtures
## Repository-agent handoff
```

Derive each flow from the approved FE design and verified existing automation architecture. Reuse existing Page Objects and helpers where they fit. Detail existing coverage before proposing a new scenario. Do not treat E2E as the server-side security boundary or duplicate all lower-layer cases.

## Spreadsheet quality

- Use a professional, consistent L-DX style across both workbooks.
- Freeze headers, enable filters, wrap long text, choose readable widths/heights, and use dropdown validation for controlled statuses/categories.
- Use formulas for derived values, including confidence percentages.
- Render and inspect every sheet before delivery.
- Scan for `#REF!`, `#DIV/0!`, `#VALUE!`, `#NAME?`, and `#N/A` formula errors.
- Keep the final workbook as `.xlsx`; do not leave inspection sidecars or temporary renders in the Ringi output directory.
