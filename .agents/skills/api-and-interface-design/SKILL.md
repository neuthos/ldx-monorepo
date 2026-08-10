---
name: api-and-interface-design
description: Designs user-approved contracts between the L-DX Next.js frontend, Odoo addons/controllers, and Playwright consumers. Use for endpoint, payload, model boundary, error, pagination, compatibility, or cross-repository contract changes before implementation handoffs are written.
---

# Design L-DX Interfaces

Design contracts before implementation and preserve the read-only boundary.

## Analyze the current contract

1. Query `ldx-frontend` for routes, API/data services, request builders, response transforms, types, and consumers.
2. Query `ldx-backend` for matching Odoo controllers, model methods, utils, security boundaries, and tests.
3. Query `ldx-e2e` for API helpers and user flows that depend on the contract.
4. Trace both directions and report affected symbols. Verify dynamic Odoo routes/models and XML/security with targeted fallback search.

Respect established L-DX evidence: FE API/form fields commonly use `snake_case`, response adaptation belongs in the service layer, and Odoo behavior may span controllers, models, manifests, ACLs, XML, and inherited models. Confirm the actual local pattern rather than generalizing it.

## Contract artifact

Define method/route, authentication and role, request fields, response fields, errors, validation, pagination/order, idempotency, transactions, timezone/date semantics, compatibility, FE transform, and E2E-visible behavior. Show before/after for changed contracts.

## Human decision gate

Never choose endpoint semantics, field names/types, required/optional status, defaults, errors, authorization, compatibility breaks, pagination, or deprecation policy. Existing behavior is a contract fact, not permission to preserve or change it. Present options and blast radius; the user must explicitly approve the final contract before FE and BE plans proceed.

## TDD planning contract

- Start with contract tests/examples that fail against the current behavior.
- Plan Odoo tests for controller/model validation, permissions, transactions, errors, and JST/date behavior.
- Plan FE tests for request construction, response transformation, error/UI states, and existing mocks.
- Plan Playwright only for a critical integrated contract observable by the user.
- Include backward-compatibility and negative cases, then order RED → GREEN → REFACTOR.

## Output

Return graph evidence, approved contract table, consumer/provider blast radius, compatibility and migration notes, TDD matrix, open decisions, and separate FE/BE/E2E handoff boundaries.
