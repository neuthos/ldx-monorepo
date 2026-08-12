# BOUNDARIES reference

Use this reference while designing cases. It is a discovery guide, not a requirement to create irrelevant tests. For each dimension, identify the applicable input, state, actor, integration, or environment; choose representative probes; map each probe to a test ID; and record gaps as `PENDING`.

| Dimension | Minimum useful probes | Typical failure it exposes |
|---|---|---|
| **B — Boundary values** | min, max, zero, negative, just below/at/above limits, overflow, decimal precision, round-half-up/down and truncation direction | off-by-one, overflow, incorrect validation, tax/amount rounding, precision loss |
| **O — Ordering** | sorted, reversed, duplicates, already processed, repeated submission, distinct values in each field/column | order dependence, unstable sorting, duplicate handling, field transposition |
| **U — Unicode & encoding** | emoji, RTL, punctuation/special characters, multibyte, Japanese text, mixed scripts, translated labels/errors | encoding corruption, validation surprises, clipping, missing translation |
| **N — Null/empty** | omitted/undefined, null, empty string, whitespace-only, zero versus null, missing optional field | defaulting bugs, null dereference, incorrect required-field behavior |
| **D — Data volume** | zero, one, many, maximum supported, pagination/batch boundary | empty-state bugs, performance collapse, pagination/count errors |
| **A — Access & permissions** | unauthenticated, expired session, wrong role, own record, another user’s record, object-level access | privilege escalation, data leakage, incorrect authorization |
| **R — Race conditions** | concurrent create/update, double click/submit, stale read, retry after timeout, idempotency, conflicting state changes | duplicate records, lost updates, inconsistent totals, non-idempotent commands |
| **I — Integration failures** | timeout, 4xx, 5xx, partial success, malformed payload, unavailable dependency, retry/recovery | unsafe failure handling, contract drift, partial data corruption |
| **E — Environment** | timezone boundary, locale/currency/date format, supported browser/OS, narrow/wide viewport, slow/offline network | date shifts, formatting errors, responsive/accessibility regressions |
| **S — State transitions** | every valid path, invalid jump, re-entry, cancellation, finalized/archived record, period close/reopen | illegal transitions, stale actions, lifecycle bypass, irrecoverable workflow |

## Selection heuristics

- Test the boundary of every numeric, date, text-length, quantity, capacity, permission, and lifecycle rule named in the spec.
- Use distinct values in neighboring fields. For example, do not put the same tax rate, currency, and amount in every field when a mapping/transposition defect is possible.
- For calculations, include values that distinguish rounding direction and intermediate precision, not only whole numbers.
- For generated downstream records, repeat the relevant boundary and state assertions on the generated artifact; a source-page assertion alone does not prove propagation.
- If a dimension is genuinely not applicable, state why (for example, “No user-entered ordering; server receives a single immutable command”).
- If the spec does not define a limit, do not invent one. Mark the missing limit `PENDING` and use only a safe representative case if the behavior is otherwise clear.
