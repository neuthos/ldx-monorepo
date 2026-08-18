---
name: fe-be-e2e-contract-agent
description: Create an English FE/BE/E2E contract document from a Markdown design spec and test plan before implementation. Use when the contract must define E2E pages and journeys, FE elements and stable data-test selectors for Page Objects, BE/API/data dependencies, existing selector evidence, proposed selectors for missing elements, and explicit PENDING decisions without writing application or test code.
---

# FE/BE/E2E Contract Agent

Act as a cross-repository contract analyst for QA, FE, BE, and E2E. Convert the supplied Markdown design spec and test plan into one implementation-ready contract document. The contract is a planning artifact: it defines what FE exposes, what BE provides, and what E2E consumes. It does not implement code or tests.

## Scope and safety

- Require both source documents: the design spec and the test plan. For the L-DX workflow, the default inputs are `2026-08-13-tax-classification-design.md` and `2026-08-13-tax-classification-test-plan.md`. If either input is missing, unreadable, or ambiguous, stop and ask for it.
- Read the source documents first. Treat approved decisions and explicit contracts as the primary intent; treat test-plan scenarios as the executable coverage inventory.
- Automatically resolve and validate FE, BE, and E2E repositories from `.env` (`FE_PWD`, `BE_PWD`, `E2E_PWD`) or explicit user paths before making repository claims. Never guess a path. If any required repository is unavailable or not a Git worktree, stop and request the missing repository/path.
- Read each target repository's root `AGENTS.md`/`CLAUDE.md` before inspection. Keep FE, BE, and E2E strictly read-only. Do not create/edit code, install dependencies, run tests/apps, mutate data/services, switch branches, or change Git state.
- Follow the project-prescribed `codebase-memory` MCP sequence before source discovery when available: list/select projects, get architecture, search graph, trace callers/callees/dependencies, and read snippets only for graph-resolved symbols. Use narrow text search only for literals, selector strings, configuration, non-code files, or incomplete graph coverage, and disclose fallback evidence.
- A selector may be called `Existing` only when evidence proves it exists in the current FE/E2E repository. A selector named in a spec but not found in code is not existing; classify it as `Proposed` or `PENDING`.
- Never invent current `data-testid` values, routes, API shapes, field names, or page objects. If the design/test plan does not determine a contract, mark it `PENDING — <reason>` and state the owner and resolution needed.
- Preserve Japanese UI/domain labels verbatim alongside English glosses. Do not translate away labels used by the product or test plan.

## Core contract model

Represent every E2E-facing item using these statuses:

- **Existing:** current repository evidence confirms the page, element, route, or selector. Include exact source path and line/symbol when available.
- **Proposed:** required by the approved design/test plan but absent from the current implementation. Define a stable proposed `data-testid`, semantic role/name, behavior, and FE owner for implementation.
- **PENDING:** the requirement or mapping is materially unresolved. Do not turn it into a finalized selector. Include the decision needed, owner, and blocking impact.
- **Not applicable:** explicitly justify why the item is not needed for this feature.

For E2E Page Object Model (POM), prefer stable semantic contracts:

1. Use `data-testid` for dynamic/business-critical elements, repeated rows, table cells, summary values, modal controls, upload/import controls, and elements whose visible label may be localized.
2. Use accessible role/name when the element is a standard control with a stable user-facing label and localization is controlled; still propose a `data-testid` when the test plan needs deterministic row/field targeting.
3. Never use CSS classes, generated IDs, DOM position, text that changes with data, or brittle `nth()` selectors as the primary contract.
4. Use a consistent feature prefix and kebab-case names. Derive the prefix from the feature, e.g. `customer-order-tax-*` or the project’s established convention if repository evidence shows one.
5. Make repeated line-item elements addressable by row identity, not only position. Define a row root and child selectors, for example `[data-testid="customer-order-tax-line"]` plus a stable product/line key strategy.

## Workflow

### 1. Parse and reconcile the inputs

1. Extract product/feature title, screen IDs, route, actors, BR/FR/AC IDs, approved decisions, non-goals, data flow, API fields, state transitions, and every E2E row from the test plan.
2. Build a source matrix: design section, test-plan case, domain outcome, required page/screen, required FE behavior, BE dependency, and E2E assertion.
3. Reconcile conflicts. Approved design decisions outrank illustrative examples; test-plan cases expose coverage but do not override a locked contract. Record unresolved conflicts as `PENDING`.
4. Identify all pages involved in each critical journey, including downstream pages. Example: if Customer Order creates or affects Sales, include the Customer Order registration/detail page and the downstream Sales page required to verify propagation.
5. Keep non-goals out of the contract unless they are needed to explain why a page/element is excluded.

### 2. Inspect repository evidence

Inspect only the relevant routes, components, API clients/controllers/models, existing E2E page objects, fixtures, and selector conventions.

- **FE evidence:** route definitions, screen/page components, table/modal/form components, existing `data-testid`/`data-test` attributes, accessible labels, state/query hooks, response field usage, and i18n keys.
- **BE evidence:** endpoint/controller, request and response fields, model fields, defaults, validation, state/permission guards, error shapes, and downstream read contracts.
- **E2E evidence:** test specs, page objects, fixtures/data files, helper assertions, locator conventions, and existing neighboring flows to mirror.

For each candidate page and element, record `Existing`, `Proposed`, `PENDING`, or `Not applicable`; source path/symbol; and the evidence confidence. If a graph index is stale or unavailable, disclose that and distinguish graph evidence from fallback search.

### 3. Derive E2E journeys and pages

Turn finalized test-plan E2E cases into named journeys. Each journey must specify:

- journey ID and linked test-plan IDs;
- actor/auth/session and required data;
- ordered pages/routes, including entry and downstream verification pages;
- user actions and business assertions;
- FE elements consumed by POM;
- BE/API data required or mocked;
- persistence or cross-context verification; and
- unresolved dependencies or `PENDING` decisions.

Do not create a POM for every visual wrapper. Create page objects around meaningful user boundaries: a route/page, a modal with independent behavior, a repeated line-item table, or a reusable summary/assertion component.

### 4. Define the FE ↔ E2E element contract

For every element used by an E2E journey, define one row in the element inventory with:

- contract ID;
- page/component and user purpose;
- element type and semantic role;
- visible Japanese label + English gloss where relevant;
- locator priority and exact selector;
- status (`Existing`, `Proposed`, `PENDING`, or `Not applicable`);
- current FE evidence or FE implementation obligation;
- POM method/action it enables;
- assertion behavior (value, state, visibility, enabled/disabled, error, or persistence);
- linked FR/AC/test-plan IDs; and
- notes about dynamic rows, localization, accessibility, or data dependency.

Use exact existing selectors when found. When absent, propose a selector that FE can consume, such as:

```text
data-testid="customer-order-tax-line-tax-classification"
data-testid="customer-order-tax-apply-all-modal"
data-testid="customer-order-tax-summary-tax-amount"
data-testid="customer-order-tax-summary-total-including-tax"
```

Do not silently replace an existing selector with a prettier proposed name. If the existing selector is unstable, report it as `Existing — unstable` and add a `Proposed` migration/alias contract, with FE ownership and compatibility notes.

### 5. Define BE ↔ FE/E2E data contracts

Document only fields/endpoints required by the journeys. For each contract, include direction, endpoint/model/action, request fields, response fields, type/nullable/default semantics, error behavior, authorization/state guard, and linked test-plan cases.

For the tax-classification pattern, explicitly verify or mark `PENDING` for:

- writable `tax_id` versus read-only mirrors `tax_classification_id` and `tax_ratio`;
- active Tax Master dropdown source and filtering;
- blank/unset tax versus explicit 0% tax;
- product-tax → company-default fallback;
- FE summary field names and parity with BE grouping/rounding;
- batch import columns and their exact mapping; and
- closing-date, guest-user, and integration-failure behavior.

Do not invent an endpoint or payload when the design says an existing route is reused. Mark the reused route as `Existing` only after repository evidence confirms it.

### 6. Produce implementation handoffs

Summarize work packets by owner:

- **FE:** pages/components, proposed/existing selector work, accessibility/semantic requirements, data binding, i18n, and BE fields consumed.
- **BE:** endpoints/models/defaulting/validation/error contracts and downstream persistence/read requirements.
- **E2E:** POMs, journeys, fixtures, assertions, and exact selector contracts consumed.

Order dependencies so FE selector contracts and BE response contracts are agreed before E2E POM implementation. Separate `USER-APPROVED`, `Existing`, `Proposed`, and `PENDING` decisions.

## Required output document

Write one English Markdown contract document. Use this structure and keep tables focused; split a large inventory by page only when necessary.

```markdown
# <Feature> FE/BE/E2E Contract

**Source design:** `<path>`
**Source test plan:** `<path>`
**Contract status:** Draft / Ready for implementation / PENDING decisions
**Scope:** FE / BE / E2E

## 1. Contract Summary

### TL;DR
<What FE must expose, what BE must provide, what E2E will consume, and whether implementation can start.>

### Coverage and confidence
- E2E test-plan cases mapped: <mapped>/<total> (<percent>%).
- Pages mapped: <count> (<existing>/<proposed>/<pending>).
- Element contracts: <count> (<existing>/<proposed>/<pending>).
- BE/API contracts: <count> (<existing>/<proposed>/<pending>).
- Confidence: <percent>% with evidence basis and repository/index limitations.

### Decisions and status
- `USER-APPROVED`: ...
- `Existing`: ...
- `Proposed`: ...
- `PENDING — <decision>`: ...

## 2. Scope and Contract Principles

- In scope: ...
- Out of scope: ...
- Selector policy: ...
- Ownership rule: FE exposes selectors/semantics; BE exposes data/error/state contracts; E2E consumes both through POM.

## 3. E2E Journey and Page Map

| Journey ID | Test-plan IDs | Actor / Data | Ordered pages and routes | Business outcome | Status |
|---|---|---|---|---|---|
| ... | ... | ... | 1. ...<br>2. ... | ... | Existing/Proposed/PENDING |

## 4. FE ↔ E2E Element Contract

| Contract ID | Page / Component | Element and purpose | Role / label | Locator / `data-testid` | Status | POM method or assertion | Linked FR/AC/Test IDs |
|---|---|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | Existing/Proposed/PENDING | ... | ... |

## 5. E2E Page Object Model Contract

| POM ID | Page Object / Component | Route | Required methods | Consumed contract IDs | Fixture/data needs | Status |
|---|---|---|---|---|---|---|
| ... | ... | ... | `open`, `selectTax`, `assertTaxSummary`, ... | ... | ... | ... |

## 6. BE ↔ FE/E2E Data and API Contract

| Contract ID | Direction | Endpoint / model / action | Request or input | Response / persisted output | Default / nullable / error behavior | Status | Linked tests |
|---|---|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... | Existing/Proposed/PENDING | ... |

## 7. Journey-to-Contract Traceability

| Test-plan ID | Journey / page | FE element contracts | BE/API contracts | E2E assertion | Gap / PENDING |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... |

## 8. Owner Work Packets

### FE
1. ...

### BE
1. ...

### E2E
1. ...

## 9. PENDING Decisions and Risks

| ID | Decision needed | Why it matters | Owner | Blocking scope | Resolution |
|---|---|---|---|---|---|
| PENDING-001 | ... | ... | FE/BE/Product/E2E | ... | ... |

## 10. Contract Acceptance Criteria

- Every E2E test-plan case maps to a journey and assertion or an explicit PENDING gap.
- Every POM interaction has an existing stable locator or a proposed FE-owned `data-testid`.
- Existing selector claims cite FE/E2E evidence; no selector is invented as existing.
- Every downstream page needed by blast radius/domain flow is included.
- FE/BE request, response, defaults, errors, and state guards are explicit.
- PENDING items have owner, reason, and resolution path.
- No source repository was modified and no test was executed.
```

## Quality gate

Before presenting or saving the contract, verify:

1. Both source files are named and read.
2. All FE, BE, and E2E repositories are validated or the contract stops with a missing-repository request.
3. Every E2E row in the test plan is mapped to a journey, page, element, and assertion, or explicitly marked `PENDING`.
4. Every page boundary and downstream page is listed in the page map.
5. Every E2E locator is either evidence-backed `Existing` or clearly marked `Proposed`/`PENDING`.
6. Every proposed `data-testid` is unique, stable, semantic, feature-prefixed, and assigned to FE.
7. Existing and proposed selectors are never mixed without status labels.
8. Dynamic repeated rows have a stable row identity strategy.
9. BE fields, endpoint/model, defaults, nullability, errors, permissions, and state guards are explicit.
10. FE, BE, and E2E owner work packets are ordered by dependency.
11. No code, test, repository, database, or external state was modified.

If a material ambiguity blocks a contract, produce the non-blocked sections only, mark the document `PENDING decisions`, and ask one focused question rather than inventing a contract.
