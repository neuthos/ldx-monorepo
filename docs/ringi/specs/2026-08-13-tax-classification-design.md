# 税区分 (Tax Classification) on Customer Order Registration — Design Spec

**Date:** 2026-08-13
**Status:** User-Approved
**Target repos:** FE (`FE_PWD`) / BE (`BE_PWD`) / E2E (`E2E_PWD`) — all three apply

## Context

Approval No. 0141 (created 2026-06-17 by Kawakami) requests adding the item **税区分
(Tax Classification)** to the wholesale **Customer Order Registration** screens —
**INV-100-002 (Customer Order Detail)** and **INV-100-003 (Customer Order
Registration / 受注登録)**. Today these screens expose **no per-line tax selection
at all**: tax is silently defaulted to the company default sales tax inside
`SaleOrder.batch_create` (`ldx_addons/ldx_core/transactions/sale_order.py:2859`) and
the user cannot see or change it.

The PRD gives three reasons:

1. **Tax-exempt / non-taxable (0%) support** — export deals and qualified
   transactions need a 0% rate that today cannot be selected.
2. **適格請求書保存方式 (Qualified Invoice System / Invoice Method) compliance** —
   per-line 税区分 must be retained upstream (at 受注) so qualified invoices can be
   output downstream.
3. **Reduced rate (8%) vs standard (10%) coexistence** — a line must be able to
   carry 8% where applicable.

Intended outcome: 税区分 becomes an explicit, per-line, user-editable selection on
the 受注登録 screen, bulk-applicable, with 税額 (Tax Amount) and 受注金額(税込)
(Order Amount Including Tax) summary items, and two new batch-import columns.

## Requirements (PRD / FR / BR)

- **Source PRD:** Approval No. 0141 — "Addition of the Item 'Tax Classification'"
  ( 税区分 / Tax Classification), created 2026-06-17 by Kawakami.
- **Screen IDs:** INV-100-002 (Customer Order Detail), INV-100-003 (Customer Order
  Registration / 受注登録).
- **Development Classification:** Modification of Existing Function.

| ID / Section | Original text | Notes |
|----|-------------------------------------------|-------|
| 3.1 | 詳細項目に「税区分」を追加 — Add "Tax Classification" to detail items; select from 税区分マスタ (Tax Classification Master); default 10%; insert between 値引 (Price Cut) and 受注単価 (Customer Order Unit Price). | New inline editable column. |
| 3.2 | 全行に適用 (Apply to All Rows) dialog — add 税区分. | Bulk set tax on every line. |
| 3.3 | Add summary items 税額 (Tax Amount) and 受注金額(税込) (Order Amount Including Tax). | FE-computed (decision #2). |
| 3.4 | Batch Registration Settings — add 税区分 (not required; blank → default tax) and 出荷住所 (Shipment Address; "Shipment To 1"/"Shipment To 2", default "Shipment To 1"). New import patterns include both; already-saved patterns unchanged (manual add). | 税区分 blank default = product→company (decision #1); 出荷住所 = existing partner address (decision #5). |
| 3.5 | No registration after 締め (closing date); Apply-to-All perf must match current screen; rounding follows Contract Master (変更なし / no change); permissions unchanged (ゲストユーザー / guest users cannot use); archival behavior unchanged. | Rounding = company method as-is (decision #3). |
| Reason 1 | Tax-exempt / non-taxable (0%) support for export deals. | 0% master record exists (`tax_classification_03`). |
| Reason 2 | 適格請求書保存方式 (Qualified Invoice Method) compliance — retain per-line 税区分 upstream. | Downstream consumers already read `tax_id`. |
| Reason 3 | Reduced rate (8%) vs standard (10%) coexistence. | 8% (`tax_classification_04`) / 10% (`tax_classification_05`) master records exist. |
| Scenarios 01–10 | 10%: qty 2 × ¥10,000 → 税額 ¥2,000, 税込 ¥22,000; 8% → ¥800/¥10,800; 0% → ¥0/¥10,000; mixed 10%+8% ¥15,000 → 税額 ¥1,400, 税込 ¥16,400; rounding test on ¥999 → ¥99 (floor). | **Rounding examples are ILLUSTRATIVE (floor). Actual rounding = company method (decision #3). E2E derives expected values from the configured company rounding, not these floor examples.** |

- **Japanese terms preserved (verbatim):** 税区分 (Tax Classification), 税区分マスタ
  (Tax Classification Master), 値引 (Price Cut), 受注単価 (Customer Order Unit Price),
  税額 (Tax Amount), 受注金額(税込) (Order Amount Including Tax), 出荷住所 (Shipment
  Address), 全行に適用 (Apply to All Rows), 税額マスタ/税マスタ (Tax Master), 商品マスタ
  (Product Master), 消費税 (Consumption Tax), 締め (Closing Date / Period Closing),
  税率 (Tax Rate), 適格請求書保存方式 (Qualified Invoice Method), 請求書 (Invoice),
  ゲストユーザー (Guest User), 受注登録 (Customer Order Registration). Every Japanese
  domain term from the PRD survives verbatim; an English gloss in parentheses is provided,
  no term is replaced.

## Objective

Make 税区分 an explicit, per-line, user-editable tax selection on the wholesale
受注登録 screen, bulk-applicable and reflected in live 税額 / 受注金額(税込)
summaries, with batch-import support — without weakening the `tax_id`
source-of-truth invariant.

## Scope

**In scope:**

- FE: new 税区分 column (between 値引 and 受注単価), 全行に適用 税区分, 税額 + 受注金額(税込)
  summary, two new batch-import columns (税区分, 出荷住所).
- BE: one targeted change — product-tax default in `batch_create` when 税区分 is blank;
  ensure `tax_id` (and mirrors) are in the order/line read response. No new field, no
  new route, no rounding change.
- E2E: tax-surfaces-only smoke (screen baseline is zero).

## Non-goals

- Broader wholesale 受注登録 E2E coverage beyond the new tax surfaces (decision #6).
- Changing rounding behavior (decision #3 — company method as-is).
- New BE domain field ( `tax_id` already exists and is writable).
- Tax Free (免税, `is_tax_free=True`, store-sales amount-range logic) — distinct flow,
  out of scope unless its record surfaces naturally in the Tax Master list (decision #4).
- Redesigning the 受注登録 screen beyond the listed additions.

## Domain Model

L-DX is domain-driven. This change touches:

- **Aggregate root:** `sale.order`
  (`ldx_addons/ldx_core/transactions/sale_order.py:169`). Invariant: **`tax_id` is the
  single source of truth per order line**; `tax_classification_id` + `tax_ratio` are
  non-stored derived mirrors (`ldx_addons/ldx_core/transactions/sale_order_line.py:246-253`).
  This edit does not weaken the invariant — the UI writes `tax_id`, mirrors recompute.
- **Entities:** `sale.order` (read for grouping, no field change); `sale.order.line`
  (`tax_id` becomes user-editable on this screen — field unchanged, newly exposed).
- **Value Objects (read, not changed):** `TaxRate` = `account.tax.amount/100` (master
  carries 0% `tax_classification_03`, 8% `_04`, 10% `_05`); `Money` rounding governed by
  `res.company.rounding_method`.
- **Bounded contexts:** Sales (受注登録) — primary, owns the edit; Tax (`account.tax`
  master) — read-only dropdown source; Invoicing/Billing, Shipment, Payment — downstream
  consumers that already read `tax_id` (no change needed).

## DDD Impact — Which `D` Changes

The affected **domain behavior** is: *tax assignment on a sales order line at
registration time.*

- **Behavior before:** tax on a wholesale order line is silently defaulted to company
  `default_tax_sale` (`sale_order.py:2859`); user cannot see or change it.
- **Behavior after:** tax is an explicit per-line selection; user can bulk-apply it and
  sees 税額/受注金額(税込) live.
- **Invariants at risk:** none new — `tax_id` source-of-truth holds. Watch-point: FE
  summary must mirror BE grouping/rounding or totals drift (pinned in Data Flow + FE/BE
  Contract).
- **Cross-context impact:** automatic and beneficial — downstream contexts already group
  by `tax_id`.
- **External consumers outside `ldx_addons`:** graph cannot see them (BE index =
  `ldx_addons` only). **Text-search gap:** Odoo core `sale` module's own `tax_id`
  defaulting (`product.taxes_id`, `onchange_product_id`, fiscal position) is invisible to
  the graph — BE handoff must verify via `grep` that the new product-tax default does not
  collide with core auto-tax. Downstream consumers within scope (all read `tax_id`):
  order totals `_amount_all` (`sale_order.py:4098`), billing
  `SalesBilling` (`sales_billing.py:3801`, mirror `:3852-3855`), shipment
  `StockPicking.get_grouped_tax` (`stock_picking.py:7366-7367`), payment
  `PaymentStatement.get_grouped_tax`, billing registration `SaleOrder._register_billing`
  (`sale_order.py:4036`).

## FE / BE / E2E Contracts

Cross-repo contracts and dependencies, each backed by a graph-resolved symbol/path.

- **Backend** (`ldx_addons`):
  - **One functional change:** `SaleOrder.batch_create`
    (`ldx_addons/ldx_core/transactions/sale_order.py:2852`) — when a line's 税区分 is
    blank, default to the **product's own tax** (`product.template.taxes_id`) then
    fallback to company `default_tax_sale` (decision #1). Today only the company
    fallback exists (`sale_order.py:2859-2862, 3147-3148`). New product-tax lookup,
    currently absent.
  - **Read contract:** `tax_id` (+ display mirrors `tax_classification_id`,
    `tax_ratio`) must be present in the order/line read response. `get_line_ids`
    (`sale_order.py:677`) already reads `tax_id`; handoff confirms the full read field set.
  - **No new field, no new route, no rounding change.** Dropdown data = active
    `account.tax` records (decision #4) via existing `/api/v1/tax/list`
    (`TaxController`, `ldx_addons/ldx_core/controllers/v1/tax.py`).

- **Frontend** (`ldx-frontend`, `CustomerOrderRegistration/`):
  - **New 税区分 column** between 値引 (`price_cut`,
    `src/views/MDExecution/SalesLinkageForWholeSales/CustomerOrder/CustomerOrderRegistration/components/productLinesTable.tsx:484`)
    and 受注単価 (`order_unit_price`, `productLinesTable.tsx:525`) — inline dropdown,
    writes `tax_id` (decision #8).
  - **Apply-to-All:** `ProductLineInputModalEditor` (`productLinesTable.tsx:44-264`) — add
    税区分 as a field → sets `tax_id` on all lines in one bulk state update.
  - **Summary:** `OrderPrice.tsx:16-145` — add 税額 + 受注金額(税込). New pure fn
    `calcOrderTax` in `services/utils.ts` (next to `calculateWholesalePrice`,
    `services/utils.ts:223`) groups by `tax_id`, rounds via company method (decisions #2/#3).
  - **Batch import:** `hooks.ts:3-147` (under `CustomerOrderBatchRegister/`) — add 税区分
    column (blank → product/company default) + 出荷住所 column ('Shipment To 1'/'2',
    default 1; maps existing partner shipment address — decision #5).

- **E2E** (`ldx-e2e`, tax-surfaces-only — decision #6):
  - New wholesale 受注登録 page object mirroring
    `pages/seamless-customer-management/ec-customer-order/ec-customer-order-registration.ts`
    (`ECCustomerOrderRegistrationPage`).
  - 税区分 per-line + 全行に適用 assertions.
  - Summary check cloned from
    `pages/inventory-control/sales-and-billing-process/checkSalesAmountSalesSlip.ts:5-148`
    (`checkSalesAmountSalesSlip`), retargeted to 受注 summary data-test selectors.
  - 2 new import columns in a 受注 batch data/verify file mirroring
    `pages/inventory-control/sales-and-billing-process/data/data-sales-slip-batch-registration.ts:3-49`.

- **API / data contracts (backend fields are snake_case):**
  - `tax_id` (int, `account.tax` id) — the writable selection.
  - `tax_classification_id` (int, read-only mirror), `tax_ratio` (float, read-only mirror).
  - Summary (FE-computed, not persisted): `consumption_tax` (税額),
    `amount_including_tax` (受注金額(税込)).

## Data Flow

Step-by-step. Crosses repos at the write/read seam.

**Per-line tax select (detail screen, INV-100-002):**

1. User opens 受注登録; lines load via `sale.order/read` → FE receives `tax_id`
   (+ mirrors) per line.
2. 税区分 dropdown populated once from active `account.tax` master.
3. User changes a line's 税区分 → FE writes `tax_id` on that line's form state →
   `calcOrderTax` recomputes 税額/受注金額(税込) instantly (group by `tax_id`, company
   rounding).
4. Save → `sale.order/write` (or `write_and_action_confirm_sale`,
   `sale_order.py:1704`) persists `tax_id`; mirrors recompute; downstream
   `_amount_all`/billing/shipment follow.

**Apply-to-All (INV-100-002/003):**

1. User opens 全行に適用 modal → selects 税区分 → confirms.
2. FE sets `tax_id` on **all** lines in a single state update (no per-row round-trip —
   perf guard, decision #7).
3. `calcOrderTax` recomputes once for the whole order.
4. Save path same as per-line.

**Batch import (INV-100-003):**

1. Excel row carries 税区分 (optional) + 出荷住所 (optional).
2. `POST /api/dataset/sale.order/batch_creates`
   (`ldx_addons/ldx_core/controllers/main.py:504` → `SaleOrder.batch_create`).
3. **New BE step:** blank 税区分 → resolve product `taxes_id`, else company
   `default_tax_sale` (decision #1). 出荷住所 → existing partner shipment-address pick,
   default 'Shipment To 1' (decision #5).
4. Persist; summary not in batch payload (computed client-side on the resulting order).

**Critical correctness seam — FE mirror must equal BE `calc_tax_group`:**

FE `calcOrderTax` must replicate
`ldx_addons/ldx_core/utils/account_control/invoice_control.py:327` (`calc_tax_group`)
exactly:

1. **Group key = `tax_id`** (NOT `tax_classification_id`).
2. **Subtotal per line** = price unit × qty − 値引 (price cut applied before tax, per
   PRD calc spec).
3. **consumption_tax** per group = `simple_round(company_method, decimal_places,
   group_subtotal × rate/100)`.
4. **Sum** groups for total 税額; 受注金額(税込) = Σ(group_subtotal) + Σ(consumption_tax).

Pinned as a numbered contract so FE and BE cannot drift.

## Error Handling & Edge Cases (BOUNDARIES)

Every letter. **Applies / N/A + how the design handles it.** Silent omission is not
acceptable.

- **B Boundary values** — **Applies.** Decimal precision + rounding direction are the
  core risk. 税額 uses company `rounding_method` (decision #3 — as-is, NOT floor).
  ¥1 fractions handled by `simple_round`. PRD scenario ¥999→¥99 is **floor** and will not
  match HALF-UP — spec flags scenarios as illustrative; E2E derives expected values from
  the *configured* company method. Overflow N/A (currency-scaled). 0% yields exactly ¥0.
- **O Ordering** — **Applies (minor).** Summary groups by `tax_id`; duplicate tax lines
  merge regardless of row order. Column order fixed: 税区分 between 値引 and 受注単価.
  Batch-import column order is positional — handoff pins exact positions.
- **U Unicode & encoding** — **Applies.** All Japanese terms (税区分, 値引, 受注単価, 税額,
  受注金額(税込), 出荷住所, 締め) preserved verbatim. Tax-master names may be JP; display as-is.
  Translation completeness: FE i18n keys for new labels must exist in JP — handoff lists them.
- **N Null/empty** — **Applies, central.** Blank 税区分 in batch → product tax → company
  default (decision #1). Detail-screen new line → default per PRD 3.1 (10% master record,
  unless product tax resolves first per decision #1). **0% vs null:** an explicit 0%
  selection (`tax_id` = 0% record, tax ¥0) is distinct from a blank/unset 税区分 (resolves
  to default) — FE must distinguish blank (unselected) from 0% (a real `tax_id`). Pinned
  in handoff.
- **D Data volume** — **Applies.** Zero lines → 税額 ¥0, 受注金額(税込) ¥0. One / many lines —
  grouping scales linearly. Apply-to-All on max-line order must match current perf
  (decision #7) — one bulk state update, single summary recompute.
- **A Access & permissions** — **Applies.** PRD 3.5: ゲストユーザー (guest users) cannot
  use these items; permissions unchanged. Implementer verifies the existing 受注登録 route
  already gates guest users (no new ACL). Dropdown fetch (`/api/v1/tax/list`) respects
  existing auth.
- **R Race conditions** — **N/A.** No concurrent-write concern — registration is a
  single-user form; tax is part of one order write. Double-submit guard is the screen's
  existing behavior, unchanged.
- **I Integration failures** — **Applies (minor).** Tax-master fetch fails → dropdown
  empty; FE must show a clear error and **block save** (cannot persist a valid order
  without a tax). Exact UX decided in handoff; must not silently save tax-less lines.
- **E Environment** — **Applies.** Timezone/locale: 税額 is a number; locale affects only
  the ¥ display format (existing screen formatting). `decimal_places` read from order
  currency (`calc_tax_group` uses `currency_id.decimal_places`); FE mirror must use the same.
- **S State transitions** — **Applies.** PRD 3.5: **no registration after 締め (closing
  date)** — implementer confirms the existing closing-date guard covers the new tax write
  (tax is part of the same write; expected yes, but verify). Archival behavior unchanged.
  No period-reopen concern (registration-time only).

**Highest-risk letters: B (rounding mismatch), N (0%-vs-blank), S (closing-date guard).**
All three pinned in the handoff.

## Acceptance Criteria & Verification

How to confirm the change works end-to-end. Per-repo verification commands belong in the
handoff, not here — this repo is read-only.

1. **税区分 column present & editable** on 受注登録 detail (INV-100-002) and registration
   (INV-100-003), between 値引 and 受注単価, defaulting per decision #1 (product → company).
2. **Dropdown data-driven** from active `account.tax` master records (decision #4).
3. **Per-line 税区分 change** writes `tax_id`; 税額 + 受注金額(税込) recompute instantly,
   matching `calc_tax_group` output (group by `tax_id`, company rounding).
4. **全行に適用** sets `tax_id` on all lines in one bulk update; summary recomputes once;
   performance matches current screen on a max-line order (decision #7).
5. **税額 / 受注金額(税込)** render and equal: 税額 = Σ per-tax-group rounded consumption
   tax; 受注金額(税込) = Σ untaxed + 税額. Persisted order totals (`_amount_all`) match
   FE-displayed values.
6. **Batch import** accepts 税区分 + 出荷住所 columns; blank 税区分 resolves to
   product→company default; 出荷住所 defaults 'Shipment To 1'; already-saved patterns
   unchanged (manual add only).
7. **0% line** yields ¥0 tax, 受注金額(税込) = untaxed amount; mixed 10%+8% order groups
   correctly.
8. **Closing-date guard** (PRD 3.5): no registration past 締め — verified to cover the new
   tax write.
9. **Permissions**: ゲストユーザー (guest users) cannot access these items; existing ACL
   unchanged.
10. **Downstream**: billing/shipment/payment tax display reflects the per-line selection
    with no extra code change.

> Note: this repo is read-only. Verification commands run in the target repo's own
> session, not here. E2E derives expected numeric values from the *configured company
> rounding method*, not the PRD's floor examples (decision #3).

## Open Questions

All material product decisions are resolved. Remaining items are non-blocking
implementation confirmations, marked `PENDING` until the implementer verifies them.

### USER-APPROVED (locked)

- [USER-APPROVED] Blank 税区分 default → product tax (商品マスタ), fallback company
  `default_tax_sale`. *(New BE product-tax lookup in `batch_create`.)*
- [USER-APPROVED] 税額 / 受注金額(税込) computed **FE-side**, mirroring `calc_tax_group`.
- [USER-APPROVED] Rounding = company method as-is (no change). PRD floor scenarios
  illustrative.
- [USER-APPROVED] Dropdown data-driven from active Tax Master records.
- [USER-APPROVED] 出荷住所 → map existing partner shipment address, default
  'Shipment To 1'.
- [USER-APPROVED] E2E = tax-surfaces-only smoke; broader 受注登録 baseline out of scope.
- [USER-APPROVED] Apply-to-all perf = acceptance criterion, no new infra.
- [USER-APPROVED] Inline dropdown writes `tax_id`; Apply-to-All sets `tax_id` on all lines.

### PENDING (non-blocking implementer confirmations)

- [PENDING] Exact active-filter on the tax-master query (which `account.tax` records
  appear in the dropdown — active-only? sales-type? verify at impl).
- [PENDING] Confirm the specific `res.partner` / `sale.order` shipment-address field for
  出荷住所 + that two addresses exist on the partner.
- [PENDING] BE text-search: verify Odoo core `sale` module's `tax_id` defaulting
  (`product.taxes_id` / `onchange_product_id` / fiscal position) does not collide with the
  new product-tax default — graph cannot see core (`ldx_addons`-only index).
- [PENDING] Confirm the 締め (closing-date) guard covers the tax write (expected yes — it
  gates the whole write).

## Implementation Handoff (advisory)

One block per target repo. These are prompts for separate agent sessions rooted at each
target repo — **not** actions taken here. Follow the repo-root `CLAUDE.md` Implementation
Handoff standard.

### BE — `BE_PWD` (`/Users/galangkeda/Documents/Keda/L-DX_Backend`)

- **Goal:** Add product-tax default to `SaleOrder.batch_create` for blank 税区分; ensure
  `tax_id` + mirrors are in the order/line read response. No new field, no new route, no
  rounding change.
- **Scoped files/symbols (graph-resolved):**
  - `SaleOrder.batch_create` @ `ldx_addons/ldx_core/transactions/sale_order.py:2852`
    (current default `:2859-2862`, line write `:3144-3148`).
  - `SaleOrderLine._compute_tax_classification` @
    `ldx_addons/ldx_core/transactions/sale_order_line.py:937` (read-only mirrors
    `tax_classification_id`/`tax_ratio`, field defs `:246-253` — do NOT add store/inverse).
  - `SaleOrder.get_line_ids` @ `sale_order.py:677` (read contract — confirm `tax_id`).
  - `calc_tax_group` @ `ldx_addons/ldx_core/utils/account_control/invoice_control.py:327`
    (reference only — rounding/grouping source of truth the FE must mirror).
  - `TaxController` @ `ldx_addons/ldx_core/controllers/v1/tax.py` (dropdown data source).
- **Relevant evidence & local rules:** backend fields are snake_case (global rule);
  `tax_id` is Odoo core (writable), `tax_classification_id`/`tax_ratio` are display-only
  mirrors. Master records: `ldx_addons/ldx_core/data/tax_classification.xml`
  (0% `tax_classification_03`, 8% `_04`, 10% `_05`, Tax Free `tax_exemption_0`).
- **Ordered steps:**
  1. In `batch_create`, before the company-default fallback (`:3147-3148`), resolve the
     line's product `taxes_id`; if present use it, else fall back to `default_tax_sale`.
  2. Confirm `get_line_ids`/read returns `tax_id`, `tax_classification_id`, `tax_ratio`.
  3. Text-search (PENDING): verify Odoo core `sale` auto-tax (`onchange_product_id` /
     fiscal position) does not override the new default at ORM create.
  4. Confirm the 締め closing-date guard covers the tax write.
- **Acceptance criteria:** blank 税区分 batch line resolves to product→company default;
  read response carries `tax_id` + mirrors; no rounding behavior change; existing tests
  green.
- **Verification commands:** run the `ldx_core` sale-order/batch test suite (confirm exact
  runner from repo-root `CLAUDE.md`/`AGENTS.md`).
- **Cross-repo dependencies:** FE reads `tax_id` + mirrors from this response; FE summary
  must mirror `calc_tax_group`.

### FE — `FE_PWD` (`/Users/galangkeda/Documents/Keda/ldx-frontend`)

- **Goal:** Expose editable 税区分 column + 全行に適用 + 税額/受注金額(税込) summary + two
  batch-import columns on the wholesale 受注登録 screen.
- **Scoped files/symbols (graph-resolved):**
  - `CustomerOrderRegistration` @
    `src/views/MDExecution/SalesLinkageForWholeSales/CustomerOrder/CustomerOrderRegistration/CustomerOrderRegistration.tsx:36`.
  - Lines table `productLinesTable.tsx` — insert 税区分 between 値引 `price_cut` (`:484`)
    and 受注単価 `order_unit_price` (`:525`); `updateProductLineData` (`:114`),
    `addNewProductLine` (`:670`).
  - Apply-to-All `ProductLineInputModalEditor` @ `productLinesTable.tsx:44-264`.
  - Summary `OrderPrice.tsx:16-145`; new `calcOrderTax` in `services/utils.ts`
    (next to `calculateWholesalePrice` `:223`).
  - Batch import `hooks.ts:3-147` + `CustomerOrderBatchRegistrationPage.tsx:17` under
    `CustomerOrderBatchRegister/`.
  - Route: `/in-season-management/sales-linkage-for-wholesale-sales/customer-order-registration/`.
- **Relevant evidence & local rules:** screen currently has zero tax UI (greenfield); FE
  computes 税区分 summary client-side (decision #2). **Numbered FE↔BE calc contract** (must
  match `calc_tax_group` exactly): (1) group key = `tax_id`; (2) line subtotal = price ×
  qty − 値引; (3) `consumption_tax` per group = `simple_round(company_method,
  decimal_places, group_subtotal × rate/100)`; (4) 税額 = Σ groups, 受注金額(税込) =
  Σ subtotals + 税額. Distinguish **0% selection** from **blank/unset** (BOUNDARIES-N).
- **Ordered steps:**
  1. Fetch active `account.tax` master once; bind to the 税区分 dropdown (decision #4).
  2. Add the inline 税区分 column between 値引 and 受注単価, writing `tax_id` (decision #8).
  3. Add 税区分 to `ProductLineInputModalEditor` → bulk-set `tax_id` on all lines in one
     state update (decision #7).
  4. Implement `calcOrderTax` per the numbered contract; wire 税額/受注金額(税込) into
     `OrderPrice.tsx`.
  5. Add 税区分 + 出荷住所 batch-import columns (decision #1 blank default; decision #5
     shipment-address pick, default 'Shipment To 1').
  6. Add JP i18n keys for all new labels (BOUNDARIES-U).
- **Acceptance criteria:** criteria #1–#6, #9 from this spec.
- **Verification commands:** run the FE test suite + typecheck (confirm exact runner from
  repo-root `CLAUDE.md`/`AGENTS.md`).
- **Cross-repo dependencies:** reads `tax_id`/mirrors + active tax master from BE; summary
  must match BE `calc_tax_group`.

### E2E — `E2E_PWD` (`/Users/galangkeda/Documents/Keda/L-DX-E2E`)

- **Goal:** Tax-surfaces-only smoke coverage for the new 税区分 features (decision #6);
  the broader 受注登録 screen remains out of scope.
- **Scoped files/symbols (graph-resolved):**
  - Mirror `pages/seamless-customer-management/ec-customer-order/ec-customer-order-registration.ts`
    (`ECCustomerOrderRegistrationPage`) into a wholesale 受注登録 page object.
  - Reuse `checkSalesAmountSalesSlip` @
    `pages/inventory-control/sales-and-billing-process/checkSalesAmountSalesSlip.ts:5-148`
    (groups lines by tax, asserts summary fields) — clone + retarget selectors.
  - Mirror `pages/inventory-control/sales-and-billing-process/data/data-sales-slip-batch-registration.ts:3-49`
    for the two new import columns.
  - Generic batch driver `utils/batchRegistrationHelper.ts` (column-agnostic; per-domain
    columns live in the new data file).
- **Relevant evidence & local rules:** wholesale 受注登録 has **zero** E2E baseline today;
  only the EC variant exists. Expected numeric values derived from the **configured
  company rounding method**, NOT the PRD floor examples (decision #3).
- **Ordered steps:**
  1. Create wholesale 受注登録 page object (route + data-test selectors).
  2. Add 税区分 per-line select + 全行に適用 assertions.
  3. Clone `checkSalesAmountSalesSlip` → assert 税額/受注金額(税込) on 受注 selectors.
  4. Add 税区分 + 出荷住所 to the batch-import data/verify file.
- **Acceptance criteria:** criteria #3, #4, #5, #6 (tax surfaces only).
- **Verification commands:** run the E2E suite (confirm exact runner from repo-root
  `CLAUDE.md`/`AGENTS.md`).
- **Cross-repo dependencies:** depends on FE data-test selectors (coordinate names) and BE
  read/batch contract.
