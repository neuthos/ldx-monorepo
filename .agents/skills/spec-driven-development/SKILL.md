---
name: spec-driven-development
description: Produces an evidence-backed, user-approved L-DX feature specification before repository-specific implementation planning. Use for new features or material behavior changes spanning the frontend, Odoo addons, APIs, data, or E2E flows when requirements need a durable source of truth.
---

# Specify an L-DX Change

Write a specification in this control-plane repository only. Do not implement target changes.

## Preconditions

- Confirm intent through `interview-me` when requirements remain ambiguous.
- Call `list_projects`, check relevant index revisions, and use graph tools to document current behavior.
- Read the current target-local rules and relevant backend ADRs before proposing architecture.
- Distinguish user requirements from codebase observations.

## Specification structure

```markdown
# Specification: [name]
## Objective and user outcome
## Approved scope and non-goals
## Current-state evidence
## Functional behavior and business rules
## FE design impact
## Odoo addon/model/controller/data impact
## API and cross-repository contracts
## Security, permissions, JST/timezone, performance, and observability
## TDD strategy and acceptance examples
## Migration, rollout, and rollback constraints
## Decision ledger
## Open questions
```

Reference graph-resolved symbols, routes, paths, callers, tests, and E2E flows. Treat Odoo XML, ACL, manifest, and dynamic model findings as explicit fallback evidence.

## Human decision gates

Never turn an assumption into specification text. Record material choices as `PENDING` until the user explicitly approves them. This includes behavior, scope, API shape, field semantics, error handling, permissions, data migration, UI state, test exclusions, rollout, and accepted risk.

Do not advance from requirements to technical design, or from design to task breakdown, while a dependent decision is pending. Mark the entire spec `DRAFT` until the user approves it; only then mark it `APPROVED`.

## TDD planning contract

Specify tests before implementation details:

1. State each behavior as an observable example that will fail first.
2. Assign the lowest sufficient layer: FE unit/component with existing services/mocks, Odoo addon test for model/controller/business invariants, or Playwright for critical integrated flow.
3. Cover happy path, validation/error, permissions, boundary/empty data, backward compatibility, and JST business-day cases as applicable.
4. Link each acceptance criterion to at least one planned RED test.
5. Require RED evidence, minimal GREEN change, REFACTOR with green tests, focused checks, then regression checks in each repository handoff.

Do not invent coverage percentages or test exclusions. Require explicit user approval.

## Completion

Finish with an approval request that lists every decision the user is accepting. Planning starts only from an approved version.
