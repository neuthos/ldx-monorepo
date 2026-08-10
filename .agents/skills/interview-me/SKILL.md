---
name: interview-me
description: Elicits and confirms L-DX requirements before architecture or planning begins. Use when a request leaves product behavior, affected FE/BE/E2E scope, users, success criteria, edge cases, permissions, data semantics, or test expectations ambiguous, or when the user explicitly asks to be interviewed.
---

# Interview for L-DX Requirements

Extract intent without filling gaps yourself. Ask one focused question at a time and wait for the answer.

## Process

1. State a one-sentence hypothesis and list what remains unknown.
2. Use codebase-memory only to establish current behavior and affected surfaces; never let existing code decide desired behavior.
3. Ask the highest-impact unresolved question first, with 2–3 concrete choices when helpful.
4. Update the confirmed/unknown list after each answer.
5. Continue until user, outcome, scope, success, constraints, non-goals, and affected repositories are explicit.
6. Restate the requirement and request an explicit approval.

Ask about L-DX-specific ambiguity where applicable:

- FE screen, role, permissions, validation, loading/error/empty states, i18n, and API expectations;
- Odoo addon/model/controller, business invariants, access rules, transactions, timezone/JST behavior, jobs, and backward compatibility;
- E2E critical flow, setup data, shared chain state, and whether Playwright coverage is necessary.

## Human decision gate

Do not choose an answer, silently accept a default, or interpret “best practice” as a product decision. Record each resolved item as `USER-APPROVED`; keep all others `PENDING`. “Whatever you think” means the options are still too broad—reduce them and ask again. Do not produce a spec or plan while any material requirement is pending.

## TDD planning questions

For every behavior, ask how failure will be observed first:

- What example should fail before implementation?
- What is the expected result and error behavior?
- Which roles, empty/boundary values, and JST date edges matter?
- Is the proof best placed in FE unit/component tests, an Odoo addon test, or a serialized Playwright scenario?
- What existing behavior must remain green?

Do not invent coverage expectations. Have the user approve acceptance examples and acceptable exclusions.

## Output

Return a confirmed intent block:

```markdown
- Outcome:
- User/role:
- FE scope:
- BE scope:
- E2E scope:
- Success and acceptance examples:
- Constraints:
- Out of scope:
- Approved decisions:
- Pending decisions:
```

Proceed downstream only after the user explicitly confirms it.
