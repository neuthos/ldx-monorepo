---
name: code-review-and-quality
description: Performs evidence-backed, read-only review of L-DX frontend, Odoo addon, E2E, or cross-repository changes. Use for PR/diff/design review, blast-radius assessment, test-quality review, and merge-risk reporting; the human retains the final approval decision.
---

# Review L-DX Changes

Review only. Do not fix findings, edit targets, approve a PR, merge, or post external comments unless separately authorized.

## Review workflow

1. Confirm approved requirement/spec, base/head revisions, affected repositories, and diff scope.
2. Read each target's current rules.
3. Use `detect_changes` where applicable, then `search_graph` and inbound/outbound `trace_path` for changed symbols and routes.
4. Review tests before implementation to infer claimed behavior; compare that claim with the approved spec.
5. Assess correctness, architecture, contract compatibility, security, performance, observability, migration/rollback, and maintainability.
6. For Odoo, inspect model inheritance, controllers, manifests, XML IDs/views, ACLs/record rules, transactions, SQL/ORM, and JST date handling beyond graph coverage.
7. For FE, inspect page/view separation, reusable templates, API transforms, permissions, i18n, UI states, and tests/mocks.
8. For E2E, inspect Page Object/helper reuse, stable selectors, assertions, data cleanup, chain order, and shared-environment serialization.

## Human decision gate

Report findings and a non-binding merge recommendation; never make the final approve/request-changes decision. Do not decide whether risk is acceptable, whether a missing test may be waived, or whether an unrelated cleanup belongs in scope. Mark these as user decisions.

## TDD review gate

Require evidence that new behavior began with a failing test or that a bug has a regression reproduction. Evaluate whether the test is at the lowest sufficient layer, fails for the intended reason, asserts behavior rather than implementation, covers negative/permission/JST cases, and protects graph-identified consumers. Missing RED evidence is a finding, not permission to infer it happened.

## Findings format

Lead with actionable findings ordered `Critical`, `High`, `Medium`, `Low`. For each include repository, path/symbol, evidence, impact, required outcome, and missing test. Separate confirmed defects from questions and suggestions. If there are no findings, state residual risks and unverified areas instead of fabricating issues.

Finish with affected flows, verification evidence, pending human decisions, and advisory verdict.
