---
name: planning-and-task-breakdown
description: Converts an approved L-DX specification into ordered, repository-specific implementation handoffs with dependencies, acceptance criteria, and test-first verification. Use when FE, Odoo backend, and/or Playwright work must be sequenced without editing those repositories from this control plane.
---

# Plan L-DX Work

Produce plans and handoffs only. Never write code, create branches, run target tests, or mutate FE/BE/E2E from this repository.

## Planning sequence

1. Require an approved objective, scope, non-goals, and decision ledger. Stop if material choices remain pending.
2. Use codebase-memory to resolve relevant symbols, routes, tests, callers/callees, and blast radius in every affected project.
3. Divide work by repository ownership:
   - FE: page/view, components, API/data services, types, hooks/context, i18n, mocks/tests.
   - BE: addon, manifest/dependencies, model/controller/utils, security/XML/data, tests, migration and JST handling.
   - E2E: scenario, Page Object, API/setup helpers, fixtures/config, shared state and serialization.
4. Model dependencies explicitly. Approve the contract before parallel FE/BE work; serialize database/migration and stateful E2E chains.
5. Create small handoff packets that each leave its target repository verifiable.

## Human decision gate

Do not choose repository ownership, contract shape, delivery order with product consequences, scope cuts, migration strategy, test exclusions, or rollout policy. Present evidence and trade-offs, record a recommendation as advisory, and wait for explicit user selection before finalizing dependent tasks.

Do not modify an existing user plan unless explicitly asked. Create a new artifact or respond in conversation as requested.

## TDD task shape

Every behavior-changing task must use this order:

```markdown
### Task: [approved behavior]
- Repository and base assumption:
- Graph evidence / symbols:
- RED: exact failing test or reproduction to add first
- GREEN: minimum approved behavior to satisfy it
- REFACTOR: cleanup boundaries while keeping tests green
- Focused verification:
- Regression verification:
- Acceptance criteria:
- Dependencies:
- Risks and pending decisions:
```

Prefer FE unit/component coverage and Odoo addon tests for behavior they can prove cheaply. Add Playwright only for critical user journeys or contracts that lower layers cannot prove. Account for the E2E shared preview database and sequential chains.

## Plan output

Include objective, scope/non-goals, current-state evidence, contract table, dependency order, repo work packets, TDD matrix, acceptance criteria, rollout/rollback concerns, risks, unknowns, and a self-contained prompt for each target-repository agent.
