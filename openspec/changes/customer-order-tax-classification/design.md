## Context

This repository is the L-DX cross-repository control plane: the FE (`ldx-frontend`), BE
(`ldx-backend`), and E2E (`ldx-e2e`) implementations live in separate repositories not checked
out here. See proposal.md for motivation.

The same PRD (Approval No. 0141) was already independently researched and approved as
**Ringi 141** in `docs/ringi/specs/2026-08-14-customer-order-tax-classification-design.md`
(+ matching `docs/ringi/contracts/...` and `docs/ringi/test-plans/...`), including 25
user-approved decisions (`DEC-01`–`DEC-25`) and repository-grounded current-state findings
(exact `file:line` evidence from the FE/BE/E2E repos as of their August 2026 snapshots). This
design intentionally reuses that already-approved reasoning rather than re-deriving it, since no
independent codebase access was available in this session to reverify it. Anywhere this design
and the Ringi 141 artifacts could conflict, the Ringi 141 decision ledger is treated as
authoritative and this document defers to it.

## Goals / Non-Goals

**Goals:**
- One backend-authoritative, nullable per-line Tax Category snapshot that never silently
  drifts after save.
- A calculation contract (grouping, rounding, precision) that FE and BE implement identically,
  so a live unsaved-form preview matches the saved result.
- Keep Shipment a logistics boundary: it neither owns nor persists Customer Order tax, even
  while carrying enough source-line identity for Sales to recover it later.
- Reuse existing Tax Master, Product Master, and Sales rounding policy read paths instead of
  introducing new master data or a parallel rounding engine.

**Non-Goals:**
- No redesign of the Tax Master or Product Master screens/APIs.
- No stored tax rate/name snapshot (only the tax record reference) and no stored rounding
  method — both are read live at calculation time.
- No legacy data backfill; existing Customer Order lines remain without a Tax Category.
- No new Customer Order closing-date guard; closing remains Shipment-owned.
- No ACL, guest-permission, or archival redesign.
- No automatic rewrite of Sales records already created before a Customer Order's tax changes.

## Decisions

- **Nullable line-level reference, not a value snapshot.** Store one tax reference per line
  (`tax_id | null`) rather than copying the rate/name. Rationale: a rate correction should
  create a new Tax Master record and archive the old one (an existing operational pattern), so
  a reference stays valid and simpler than reconciling a stale copied rate. Alternative
  considered — snapshot rate/name at save time — rejected because it duplicates data the Tax
  Master already owns and would need its own migration path if Tax Master formatting changes.

- **Null is a distinct value from ordinary 0%.** Both are meaningful and must not collapse into
  each other: null means "not yet classified," explicit 0% means "classified as tax-exempt."
  Write intent is therefore tri-state — field omitted (automatic/preserve), a positive ID
  (explicit selection), or `false` (explicit clear) — rather than a plain optional field with an
  implicit default, so "the user didn't touch this" and "the user cleared this" are
  distinguishable at write time.

- **Resolve and freeze defaults at save time, not at read time.** A new line resolves Product →
  Sales default → null once, when saved. Reading an existing line never re-runs that
  resolution, so a later Product/Tax Master change cannot silently move an already-registered
  order's total. Alternative considered — always resolve live from current masters — rejected
  because it would make historical order totals unstable.

- **Totals are computed, not stored.** Tax Amount and Order Total (Incl. Tax) are derived from
  saved lines, grouped by Tax Category, on every read, rather than persisted alongside the
  order. Rationale: avoids a second source of truth that could drift from the lines if a line
  changes without recomputing the total; the computation is cheap (`O(n)` over lines already
  loaded).

- **Backend is authoritative; frontend mirrors the same algorithm for live preview only.** The
  FE calculates the same grouped/rounded totals client-side so an unsaved form shows accurate
  numbers immediately, but the saved/authoritative values always come from the backend
  computation on read. This avoids a network round trip on every keystroke while guaranteeing
  the persisted number never depends on client arithmetic.

- **Shipment carries source-line identity, not tax.** A Customer Order-generated Shipment keeps
  a reference back to its originating Customer Order line so Sales can later recover the exact
  tax snapshot, but the Shipment's own tax-related fields stay unset. A Shipment preview used
  specifically to build Sales is the one path allowed to read through that reference and surface
  the source tax; every other Shipment view (generic logistics, EC) is unaffected. Alternative
  considered — let Shipment also carry/display tax — rejected because it would make a logistics
  document a second fiscal source of truth, contradicting the PRD's "Shipment remains a
  logistics boundary" framing.

- **Apply to All scope: selected rows, else current product group; never a sticky default.**
  Matches the existing Apply to All convention for other fields (e.g., discount) rather than
  introducing a new scoping rule specific to tax.

- **Batch blank vs. absent are different signals.** A supplied blank cell means "resolve the
  default now"; an absent column (an older saved import pattern) means "don't touch this field
  at all, preserve whatever the line already has." This mirrors how partial-column CSV/Excel
  imports are already handled for other optional Customer Order batch fields.

- **Custom Shipping Address field spelling matches the existing Shipment address fields
  verbatim**, rather than introducing corrected spelling on the Customer Order side. Rationale:
  the Customer Order's custom-address block feeds directly into the Shipment's existing address
  storage, and matching field-for-field lets the two share one address input/translation
  component instead of adding a mapping layer between two different spellings.

- **The shipment-creation modal overrides an order's fulfillment fields (Internal Memo, etc.)
  only for the fields the operator actually filled in.** A blank modal field falls back to the
  order's saved value instead of clearing it, so filling out Order Entry once is not
  accidentally erased by an unrelated blank field in a later shipment-creation step.

## Risks / Trade-offs

- **Risk:** the Shipment preview endpoint already serves generic and EC Shipment views in
  addition to the new Sales-conversion use. A careless change could leak Customer Order tax
  into an unrelated logistics view, or (the opposite failure) leave the Sales-conversion path
  unable to see the tax it needs.
  → **Mitigation:** gate the tax-exposing projection behind an explicit purpose flag used only
  by the Sales-conversion caller; every other caller keeps its current tax-neutral behavior
  unchanged.

- **Risk:** FE and BE could compute grouped percent/fixed tax rounding differently across
  currencies with different decimal precision, producing a save-time total that doesn't match
  what the user saw while editing.
  → **Mitigation:** treat the pinned calculation vectors already validated in the Ringi 141
  design (covering percent/fixed tax, multiple rounding modes, and 0/2/3-decimal currencies) as
  the shared contract both implementations must satisfy identically.

- **Risk:** distinguishing null from explicit 0% is easy to collapse by accident (e.g., a
  serializer that treats `false`/`null`/omitted the same way), silently turning "not yet
  classified" into "confirmed tax-exempt."
  → **Mitigation:** the tri-state write-intent contract (omitted / positive ID / explicit
  `false`) is a spec-level requirement, not an implementation detail, specifically so this
  distinction is testable end to end.

- **Risk:** reusing the Shipment address field's existing (imperfect) spelling on the Customer
  Order side propagates that inconsistency further into the codebase.
  → **Mitigation:** accepted deliberately — the alternative (a translation/mapping layer between
  two spellings for the same concept) adds ongoing maintenance cost for a purely cosmetic gain.

- **Risk:** no backfill means Tax Category adoption is gradual — old orders remain unclassified
  indefinitely, and reports mixing old/new orders will show a mix of null and populated values.
  → **Mitigation:** accepted as an explicit non-goal; the PRD does not request backfill and
  retroactively guessing a tax rate for historical orders would be a fiscal risk in itself.

## Migration Plan

- Additive-only change: one new nullable line-level tax reference field, plus new nonstored
  computed fields on the order. No existing field changes type or is removed (the "Remarks" →
  "Delivery Note Remarks" change is label-only).
- No data backfill step. Every pre-existing Customer Order line simply has no Tax Category after
  the schema/module upgrade.
- Recommended rollout order given the dependency chain (BE resolves/validates/computes; FE
  renders and mirrors the calculation; E2E exercises both): backend first, frontend second, E2E
  coverage last.
- Rollback: because the change is additive and nothing downstream depends on the new field
  being populated, reverting the backend change is safe at any point before it is relied upon by
  other in-flight work; no destructive rollback step (e.g., dropping data) is required.

## Open Questions

- The current UI trigger for converting a Customer Order directly into Sales (not via Shipment)
  was not evidenced in the Ringi 141 research; this affects only which screen an E2E "direct
  Sales propagation" journey drives through, not the tax-propagation behavior itself, which is
  already specified.
- Maximum supported Customer Order line count / batch size and its performance SLA are not
  defined by the source PRD; this affects test-data sizing, not the specified behavior.
