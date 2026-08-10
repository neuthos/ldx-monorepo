# L-DX Ringi Analysis Checklist

Use this checklist during source interrogation and codebase analysis. Record evidence; do not treat a checklist item as applicable or resolved without proof.

## Contents

- Evidence classes and mandatory domains
- Ringi interrogation and FE/BE/E2E blast-radius surfaces
- Historical evidence and confidence calculations
- Specific test data and detailed QA steps

## Evidence classes

Label every material claim with one of these classes:

- `RINGI`: authoritative source text, screenshot, callout, or approved attachment.
- `USER-APPROVED`: an explicit answer recorded in `questions-and-decisions.md`.
- `GRAPH`: a codebase-memory symbol, edge, route, test, or change result.
- `SOURCE-FALLBACK`: targeted source/config/XML/ACL/literal evidence used because the graph cannot express it.
- `HISTORY`: a relevant commit, blame range, or historical diff.
- `INFERENCE`: a reasoned possibility that still requires confirmation.
- `NOT-FOUND`: searched with the prescribed method but no evidence was found.
- `UNVERIFIABLE`: the required source, index, revision, or repository is unavailable.

Never promote `INFERENCE`, a branch name, a `TestRingi*` name, or existing code precedent into a requirement.

## Mandatory domain review

Review all domains below even when the Ringi is silent. Silence means the domain remains unproven; it does not prove that testing is unnecessary.

1. Decimal precision and scale
2. Rounding mode and rounding stage
3. Timezone and JST business-date behavior
4. Privilege, ACL, record rules, and role-specific UI
5. Archival, active/inactive records, and historical visibility
6. Closing date, locked period, and reopen behavior
7. Zero versus null versus blank versus omitted input
8. Numeric-field semantics per field, including digit-only identifiers such as JAN
9. Japanese language, terminology, encoding, normalization, labels, and layout

Also review:

- validation, error mapping, retries, and partial failure;
- state transitions, transactions, concurrency, and idempotency;
- security, authentication, authorization, injection, and data exposure;
- query shape, pagination, volume, latency, and frontend rendering performance;
- backward compatibility, migration, existing-data behavior, and defaults;
- accessibility, keyboard/focus behavior, loading, empty, and error states;
- observability, auditability, operational recovery, rollout, and rollback;
- external integrations, scheduled jobs, reports, exports, and downstream consumers.

In the workbook domain summary, use only `Tested` or `Not Tested`:

- `Tested`: at least one specific test case covers the domain with approved expected behavior and traceable evidence.
- `Not Tested`: no such test exists, the behavior is unresolved, or evidence is insufficient.

`Tested` describes design coverage, not execution or pass status. Never use `Not Applicable`, `Pending`, or a status that implies a test was run.

## Ringi source interrogation

- Inventory every sheet, page, hidden sheet, attachment, revision note, screenshot, shape, callout, merged region, comment, and formula that can carry meaning.
- Identify the authoritative version. Treat “before correction,” draft, duplicate, or superseded sheets as conflicts until resolved.
- Preserve the exact Japanese source text and add an English translation below it.
- Keep numbers, units, codes, labels, examples, arrows, screen order, and visual grouping intact.
- Split compound prose into atomic observable behaviors without changing meaning.
- Distinguish explicit behavior, example-only content, current-state description, future-state request, and annotation.
- Record unclear terminology in a glossary and question it only after checking the whole source.
- Cross-check repeated requirements across sheets before asking the user.

## Blast-radius surfaces

Check each relevant vertical slice from entry point to persistence and tests.

### Frontend (`ldx-frontend`)

- route/page and navigation entry;
- view/container and state ownership;
- forms, tables, modals, selectors, validation, and error/loading/empty states;
- hooks, contexts, data services, request/response adapters, and types;
- i18n keys and Japanese copy;
- stable selectors and elements needed by Page Objects, including unchanged elements used in the flow;
- unit/component tests, mocks, and contract fixtures.

### Backend (`ldx-backend`, indexed scope `ldx_addons`)

- addon ownership and manifest dependencies;
- controllers/routes, services/utils, models, fields, computes, constraints, and jobs;
- `_name`, `_inherit`, `_inherits`, `env['model.name']`, relational comodels, XML IDs, `inherit_id`, and dynamic dispatch;
- transactions, permissions, ACLs, record rules, XML/data, reports, and exports;
- decimal/rounding, JST/date, archive/closing, null/zero, and migration behavior;
- tests and fixtures connected to affected symbols.

State explicitly that the backend graph covers `ldx_addons`, not every possible external Odoo consumer. Check targeted consumers outside the indexed folder only when available and permitted.

### Automation (`ldx-e2e`)

- existing scenario and test ownership;
- Page Objects and unchanged elements required by the complete flow;
- real route, stable selector, API/setup helper, fixture, and cleanup implementation;
- shared preview database, serialized chains, authentication state, and retry behavior;
- existing manual coverage and gaps that lower layers cannot prove.

## Historical evidence

Before selecting a base/head, use the validated numeric Ringi ID to enumerate local/remote refs and at most 20 matching commits per repository with read-only `git for-each-ref` and `git log --all --extended-regexp --regexp-ignore-case --grep`. Group candidates by branch/phase and show merge/revert evidence. Do not select a branch from its name or commit message.

For each affected file or symbol:

1. Use graph change/diff tools when they answer the question.
2. Use bounded read-only Git history such as `git log --follow -n 10 -- <path>` to find relevant introductions, bug fixes, contract changes, and test regressions.
3. Inspect only selected commits with `git show`.
4. Use targeted `git blame -L` only when line provenance changes the conclusion.
5. Record commit SHA, subject, affected behavior, and why it matters.

Do not load full histories or treat commit messages as authoritative product requirements.

## Confidence calculations

Report three separate whole-number percentages. Show numerator, denominator, formula, branch/HEAD evidence, and gaps. Do not publish an aggregate score.

### Ringi Interpretation Confidence

```text
100 × resolved atomic behavior items / total atomic behavior items
```

Count an item as resolved only when it has an authoritative source pointer, preserved Japanese text, English translation, and an unambiguous observable result from the Ringi or a `USER-APPROVED` decision. Include unresolved items in the denominator. Leave the percentage blank when the denominator is zero.

### Blast Radius Confidence

```text
100 × evidence-complete surface checks / required surface checks
```

Build the denominator from the relevant FE, BE, E2E, history, permission, data, and test surfaces above. Count a surface as complete when graph-first analysis plus permitted targeted verification establishes it as affected or confidently unaffected. Treat stale indexes, missing index provenance, inaccessible sources, unverified dirty-working-tree coverage, unverified dynamic Odoo relations, and unresolved cross-repo contracts as incomplete.

### Test Coverage Confidence

```text
100 × covered behavior-and-risk obligations / total identified obligations
```

Include every atomic Ringi behavior, user-approved decision, blast-radius regression obligation, and mandatory-domain obligation requiring proof. Count an obligation as covered only when it maps to a specific Test Case ID with approved expected behavior and specific test data. A `Not Tested` domain remains in the denominator.

Use spreadsheet formulas for all three percentages. Do not invent caps, weights, or subjective confidence points.

## Specific test data

- Prefer exact values from the Ringi or verified existing fixtures.
- Distinguish `Ringi value`, `Existing fixture`, and `Proposed test data`.
- When proposing data, follow verified L-DX naming, code, field, and relationship conventions; never label invented data as existing.
- Preserve digit-only identifiers as text, including leading zeros.
- Provide values that a manual tester can enter and recognize.
- Specify setup, role, related records, persisted representation, displayed representation, and cleanup.
- Avoid placeholders such as `foo`, `test`, `dummy`, generic IDs, or unexplained random values.

## Detailed QA steps

For QA Integration, E2E, and Manual UI cases, write numbered executable steps. Include verified items where they exist:

- fixture/helper calls and arguments;
- prerequisite records and authentication role;
- real application paths such as `/verified/route`;
- Page Object method names;
- stable `data-testid` or other selectors;
- exact fields and values;
- button/action labels;
- navigation across the complete business flow;
- assertions, cleanup, and serialization requirements.

If an exact URL, selector, fixture, or result is not verified, write `PENDING — not found in current evidence`, link a Blocking Question ID, and mark the test blocked. Never fabricate implementation details.
