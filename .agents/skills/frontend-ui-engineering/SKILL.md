---
name: frontend-ui-engineering
description: Produces L-DX frontend design plans for Next.js, TypeScript, Ant Design, Tailwind, i18n, existing templates, and Odoo-backed workflows. Use when planning or reviewing a screen, form, list, filter, modal, interaction, or UI state; never use it to implement UI from this control plane.
---

# Plan L-DX Frontend UI

Design within existing L-DX patterns. Do not create components or modify the frontend repository here.

## Graph-first design workflow

1. Use `search_graph` to find the page/view, similar screens, shared components, API/data service, hooks/context, and tests/mocks.
2. Use `trace_path` to map UI → service/route and upstream consumers of shared components.
3. Inspect specific symbols with `get_code_snippet` and read frontend-local rules.
4. Query backend and E2E projects when the screen changes a contract or critical workflow.

Plan around established structure: thin `src/pages`, feature logic in `src/views`, reuse `src/components/Templates` selectors/inputs, existing API service patterns, Ant Design forms/layout, Tailwind styling, translated user-facing strings, notification utilities, permission context, and explicit loading/error/empty states. Verify every pattern in current code before prescribing it.

## Human decision gate

The user must decide workflow, labels/copy, field behavior, validation, defaults, permissions, destructive confirmations, responsive priorities, accessibility trade-offs, and which states are in scope. Figma/spec/code conflicts must be surfaced, never resolved silently. Do not invent UX or accept existing UI as the desired requirement.

## TDD planning contract

For each UI behavior, specify a failing user-observable test first:

- render and state transitions;
- validation and submit payload;
- API success/error/loading/empty behavior;
- permissions and disabled/hidden actions;
- i18n and relevant date/number formatting;
- keyboard/focus behavior for interactive controls.

Prefer FE unit/component tests with existing mocks and semantic queries. Add an Odoo test for backend invariants and Playwright only for approved critical flows. Require RED → minimal GREEN → REFACTOR → typecheck/lint/focused tests → regression suite in the frontend handoff.

## Output

Return current graph evidence, approved UX state table, component reuse map, FE↔BE contract impact, accessibility/i18n considerations, TDD cases, pending decisions, and a frontend-agent handoff.
