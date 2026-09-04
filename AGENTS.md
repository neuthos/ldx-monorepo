# L-DX Cross-Repository Control Plane

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## Default Communication Style

Always answer concisely and directly:

- Lead with the answer/conclusion first, details after.
- Maximum brevity: bullet points or a few short sentences. No extra context.
- Answer exactly what was asked — do not elaborate or add unasked background.
- Use simple everyday language, no jargon; briefly explain any unavoidable term.
- Write like Hemingway: short sentences, simple words.
- No preamble, no filler, no restating the question, no generic closing offers.
- Keep important caveats, drop everything else.

## Project-Specific Guidelines

Every test must cover the following dimensions — use this as a checklist before writing any code:

| Dimension                    | Minimum useful probes                                                                                                          | Typical failure it exposes                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| **B — Boundary values**      | min, max, zero, negative, just below/at/above limits, overflow, decimal precision, round-half-up/down and truncation direction | off-by-one, overflow, incorrect validation, tax/amount rounding, precision loss |
| **O — Ordering**             | sorted, reversed, duplicates, already processed, repeated submission, distinct values in each field/column                     | order dependence, unstable sorting, duplicate handling, field transposition     |
| **U — Unicode & encoding**   | emoji, RTL, punctuation/special characters, multibyte, Japanese text, mixed scripts, translated labels/errors                  | encoding corruption, validation surprises, clipping, missing translation        |
| **N — Null/empty**           | omitted/undefined, null, empty string, whitespace-only, zero versus null, missing optional field                               | defaulting bugs, null dereference, incorrect required-field behavior            |
| **D — Data volume**          | zero, one, many, maximum supported, pagination/batch boundary                                                                  | empty-state bugs, performance collapse, pagination/count errors                 |
| **A — Access & permissions** | unauthenticated, expired session, wrong role, own record, another user’s record, object-level access                           | privilege escalation, data leakage, incorrect authorization                     |
| **R — Race conditions**      | concurrent create/update, double click/submit, stale read, retry after timeout, idempotency, conflicting state changes         | duplicate records, lost updates, inconsistent totals, non-idempotent commands   |
| **I — Integration failures** | timeout, 4xx, 5xx, partial success, malformed payload, unavailable dependency, retry/recovery                                  | unsafe failure handling, contract drift, partial data corruption                |
| **E — Environment**          | timezone boundary, locale/currency/date format, supported browser/OS, narrow/wide viewport, slow/offline network               | date shifts, formatting errors, responsive/accessibility regressions            |
| **S — State transitions**    | every valid path, invalid jump, re-entry, cancellation, finalized/archived record, period close/reopen                         | illegal transitions, stale actions, lifecycle bypass, irrecoverable workflow    |
