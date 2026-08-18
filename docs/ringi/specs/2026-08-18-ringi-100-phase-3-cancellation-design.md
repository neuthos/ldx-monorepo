# Ringi 100 Phase 3 — Slip Cancellation for Arrival, Shipment, Store Sales & Store Sales Return — Design Spec

**Date:** 2026-08-18
**Status:** User-Approved design; spec pending final review
**Target repos:** BE (`BE_PWD` = `L-DX_Backend`, branch `feat/ringi-100-cancellation` @ `0adb86298f`) / FE (`FE_PWD` = `ldx-frontend`, branch `feat/ringi-100-phase-2` @ `8115f1dcc8`) / E2E (`E2E_PWD` = `L-DX-E2E`, branch `feat/ringi-100` @ `2e2e9fd6`)

---

## Context

Ringi 100 introduces a governed two-step slip cancellation (取消) across the L-DX system. Phase 1/2 — already implemented, UAT-adjusted and approved — covers Sales Slip, Sales Return Slip, Purchase Slip, and Purchase Return Slip. Phase 3 extends the same capability to **Arrival Slip (入荷伝票)**, **Shipment Slip (出荷伝票)**, **Store Sales (店舗売上)**, and **Store Sales Return (店舗売上返品)**, per four English PRD documents supplied by the user (pasted texts, 2026-08-18).

The approved phase 1/2 code is the architectural source of truth. Where the PRD text is stale relative to the approved UI, the code wins; the two known deltas are recorded under "Doc-vs-code deltas (locked)" below.

All code citations below were resolved via the `codebase-memory` graph (projects `ldx-backend`, `ldx-frontend`, `ldx-e2e`, indexed 2026-08-18 from the branches above) plus targeted file reads of the returned paths. Backend graph scope is `ldx_addons` only; the `ldx_ec` linkage (`ec.order.return.store_sales_id`) was verified by fallback text search and is flagged as such.

## Requirements (PRD / FR / BR)

**Source PRD:** four English PRD documents (user-pasted 2026-08-18):

1. *Arrival slip (en)* — Arrival Slip Cancellation
2. *Shipment slip (en)* — Shipment Slip Cancellation
3. *Store sales (en)* — Store Sales Cancellation (originally mis-pasted as a duplicate of the Shipment doc; correct document supplied 2026-08-18 later in session)
4. *Store sales return (en)* — Store Sales Return Cancellation

The PRDs carry numbered modification items and scenario tests instead of formal FR/BR IDs. Requirement references in this spec use the form `PRD-<doc> <section>#<no>` (e.g. `PRD-Arrival 2.1#4`). The scenario-test sections (3.x.y) are carried wholesale into Acceptance Criteria.

### Requirement digest (per document)

**Common to all four docs** (identical wording across PRDs; cite as `PRD-All`):

| Ref | Requirement (PRD EN verbatim, condensed) |
|-----|------------------------------------------|
| PRD-All 2.x-list#1 | Add 【Batch Cancellation】 button; checkbox-selected slips processed per Slip |
| PRD-All 2.x-list#2–3 | Status guard: only Confirmed or Pending Cancellation selectable; "Cancellation Confirmed" never selectable; per-doc blocker errors (see matrix) |
| PRD-All 2.x-list#4,8 | Status options / 【Cancellation Classification】(取消区分) + filter for Pending Cancellation / Cancellation Confirmed |
| PRD-All 2.x-list#5–6 | Batch modal → Cancellation Reason Entry Modal: reason Required (Input Error / Request from Business Partner, etc. / Others); details Required only for Others; Execute gated until complete; reason applies to all selected slips |
| PRD-All 2.x-list#7 | List items: Cancellation Date, Cancellation Registrant, Cancellation Approver, Cancellation Reason, Cancellation Reason Details |
| PRD-All 2.x-list#9 | Never overwrite an already-entered Cancellation Reason / Details |
| PRD-All 2.x-list#10 | Slips dated before the closing process cannot be edited |
| PRD-All 2.x-batchreg | Batch Registration: add 【Cancellation】 Registration Operation; slip-no required; invalid / already-cancelled errors; reason validation; sample file; result status = Pending Cancellation; total failure (one error ⇒ all records cancelled) |
| PRD-All 2.x-authority | User ID Master / Group Authority Master item per slip type: Read / Write (Pending only) / Approve (Confirm only) / Write + Approve; no guest users |
| PRD-All 2.x-download | Download data: cancellation classification + 5 cancellation columns |

**Per-document specifics:**

| Ref | Requirement |
|-----|-------------|
| PRD-Arrival 2.0 | Cancel behaviour: deduct arrival inventory; Movement ⇒ return inventory to Shipment From; recalc Free/Reserved/Total; record "Arrival Cancellation" movement history; delete Lot Number; recalc Outstanding Order Quantity |
| PRD-Arrival 2.0 (linked table) | Order Slip (Order Confirmed) ⇒ unchanged, reactivate Create Arrival Slip in Production Process Control; Shipment Slip (Confirm) ⇒ Cancelled; Purchase Draft ⇒ Deleted; Purchase Confirm + Not Paid ⇒ Cancelled; Purchase Confirm + **Paid ⇒ BLOCKER** |
| PRD-Arrival 2.1.1 | Batch types: Batch Arrival Pending Cancellation / Batch Arrival Cancellation Confirmed; partial success |
| PRD-Shipment 2.0 | Add back deducted inventory; recalc Available/Free/Total; record "Shipment Cancellation" movement history |
| PRD-Shipment 2.0 (linked table) | Sales Draft ⇒ Cancelled; Sales Confirm + Billing Draft ⇒ Cancelled; Sales Confirm + **Billing Confirmed ⇒ BLOCKER**; Arrival Waiting ⇒ Cancelled (deleted); Arrival **Confirm ⇒ BLOCKER**; Customer Order Confirm ⇒ Create Shipment re-enabled |
| PRD-Shipment 2.1.1 | Batch types: Batch Shipment Pending / Confirmed; partial success |
| PRD-StoreSales 2.0 | Add back deducted inventory; recalc; record "Sales Cancellation" movement history |
| PRD-StoreSales 2.0 (linked table) | Store Sales Return Draft ⇒ Cancelled; Store Sales Return **Confirm ⇒ BLOCKER**; EC Customer Order Confirm ⇒ Cancelled (status → "Cancel"); Sales Slip without Sales Return ⇒ Cancelled; Sales Slip **with Sales Return ⇒ BLOCKER** |
| PRD-StoreSales 2.4#8 | Batch-upload error: "Cancellation is not allowed because Store Sales Return Registration has already been processed." |
| PRD-StoreSalesReturn 2.0 | Deduct return inventory; recalc; record "Return Cancellation" movement history |
| PRD-StoreSalesReturn 2.0 (linked table) | Store Sales Slip Confirm ⇒ unchanged; EC Customer Order Return Confirm ⇒ Cancelled; Sales Return Slip Confirm ⇒ Cancelled |
| PRD-StoreSalesReturn 2.2 | One Entry-list modal with four types: Batch Store Sales Pending / Confirmed + Batch Store Sales Return Pending / Confirmed; mixed selection partial success |

### Japanese terms preserved (verbatim — from codebase i18n / domain vocabulary)

- 取消 (cancellation), 取消待ち (Pending Cancellation), 取消確定 (Cancellation Confirmed), 取消区分 (Cancellation Classification)
- 取消理由 (Cancellation Reason), 取消理由詳細 (Cancellation Reason Details)
- Reason options per code i18n keys: `input_error` / `client_request` / `other` (PRD EN: Input Error / Request from Business Partner, etc. / Others)
- 入荷伝票 (Arrival Slip), 出荷伝票 (Shipment Slip), 店舗売上 (Store Sales), 店舗売上返品 (Store Sales Return)
- 締め (closing process / period closing), 新規/更新 (New/Update registration operations in sample files)
- 請求 (billing), 前受金 (deposit), 仕入 (purchase), 売上返品 (sales return), EC受注 (EC order) — from `eCancellationRelatedEntity` comments in `cancellation_sales.py`

> The source PRDs were supplied in English. JP labels above come from the existing phase 1/2 code/i18n and must be reused, not re-translated.

## Objective

Add the governed cancellation lifecycle (Confirmed → 取消待ち → 取消確定) to Arrival Slip, Shipment Slip, Store Sales, and Store Sales Return — list batch cancellation, registration-screen cancellation, batch-registration upload, filters/columns/downloads, and authority items — by replicating the approved phase 1/2 architecture without refactoring it.

## Scope

- BE: 4 new cancellation services + 4 controllers (16 endpoints) + `cancellation_*` fields on `stock.picking` + 4 eMenu/authority items + 8 multi-process methods + 4 batch-registration configs + inventory/lot/outstanding side effects + tests.
- FE: 4 services via existing factory, list wiring for 3 list screens (Store Sales Entry covers both STS/RSTS), registration panels for 3 registration screens, 4 batch-registration pages, filters/columns/download configs, i18n.
- E2E: page objects + specs covering PRD scenario sections 3.1–3.8 for all four documents.

## Non-goals

- No refactor of phase 1/2 services, controllers, or FE components (they are approved; only additive reuse).
- No changes to non-cancellation flows (confirmation, creation, downloads other than added columns).
- No new cancellation behaviour for `return_purchase` / `return_sales` transfer types on `stock.picking` (fields exist model-wide; services restrict by `transfer_type`).
- No consignment-flow redesign (regression verification only).
- No schema/data migration beyond additive Odoo fields and authority/menu data.

## Domain Model

Graph-resolved evidence (project `ldx-backend` unless noted):

- **Aggregates & roots:**
  - *Arrival Slip aggregate* — root `stock.picking` (`transfer_type='arrival'`); lines via `stock.move` / `stock.move.line` (`StockMoves.create_or_link_to_arrival_slip_group` @ `ldx_core/base/stock_move.py:854`). Invariant: arrival qty is added to inventory once, at confirm (`state='done'`).
  - *Shipment Slip aggregate* — root `stock.picking` (`transfer_type='shipment'`). Invariant: shipment qty is deducted once at confirm; Available/Free/Total inventory consistent.
  - *Store Sales / Store Sales Return aggregate* — root `store.sales` (`StoreSales` @ `ldx_core/transactions/store_sales.py:85`), discriminated by `sales_operation_type` ('sales' → `STS-`, 'return' → `RSTS-`, `get_slip_no` @ store_sales.py:92). Invariant: sales deducts / return adds inventory at `state='done'`.
- **Entities read/cascaded:** `order.master` (Order Slip, `stock_picking.order_id` @ base/stock_picking.py:444), `account.move` (Purchase, `account_payable_id/ids` @ :483/:487), `sale.order` (Sales, `stock_picking.sale_order_id` @ :532; `store_sales.sale_order_id` @ transactions/store_sales.py:153), `receipt.order` (Customer Order, `order_receipt_slip_id` @ :623), inter-store movement pair (`stock_picking.shipment_slip_id` @ :480 — "Arrival Slip Related Shipment Slip"), `store.sales` returns (`return_store_slip_id` @ store_sales.py:157), `warehouse.return.instruction` (`sales_return_slip_ids` @ store_sales.py:164), `ec.order.receive` / `ec.order.return` (`store_sales_id` @ `ldx_ec/models/ec_order_return.py:507` — **text-search evidence, outside graph scope**).
- **Value Objects (contract-level):** `CancellationReason` (`input_error|client_request|other`), `CancellationType` (`pending_cancellation|cancellation_confirmed`), affected-row `{type, record_id, number, block, metadata}` (`_affected_item` @ `cancellation_sales.py:172`), guard envelope `{success, record_id, message, column, affected}`.
- **Bounded contexts:** Inventory Control (arrival/shipment — `stock.picking`), Store Sales, Sales, Purchase/AR-AP, EC (via `ldx_ec`, kept optional to `ldx_core` per `_detach_ec_order` pattern @ cancellation_sales.py:484). Seams: service-to-service cascade calls mirror phase 1/2 (`_confirm_connected_chain` @ cancellation_sales.py:879).

## DDD Impact — Which `D` Changes

- **Behavior before:** Arrival/Shipment/Store-Sales/Store-Sales-Return slips have no cancellation path (only status flip via `_action_cancel` used by cascades from other domains, e.g. `_cancel_store_sales` @ cancellation_sales.py:506). `store.sales` already carries `cancellation_*` fields (store_sales.py:222–244, pre-existing patch) but no service consumes them for its own lifecycle.
- **Behavior after:** each of the four slip types gets the governed two-step cancellation with guards, cascades, audit fields, preview, batch entry points, and authority — identical semantics to phase 1/2.
- **Invariants at risk:** inventory add-back/deduction exactly reverses the slip's effect (Free/Reserved/Total consistency); lot numbers created by a cancelled arrival are removed only when unconsumed; outstanding order quantity returns to pre-arrival value; cancellation is terminal (取消確定 never re-enterable); reason never overwritten; closing-locked slips immutable.
- **Cross-context impact:** cancellation now crosses Inventory ↔ Sales ↔ Purchase ↔ Store Sales ↔ EC with full-chain reuse (USER-APPROVED): guards of the target domain apply from the originating domain's cancel (e.g. a confirmed billing on the linked Sales Slip blocks a Store Sales cancellation and appears in its preview).
- **External consumers outside `ldx_addons`:** `ldx_ec` (`ec.order.receive`, `ec.order.return`) — linked via `store_sales_id`; `ldx_core` must stay independent of `ldx_ec` (no-op pattern). Verified by text search (graph covers `ldx_addons` only).

## FE / BE / E2E Contracts

**Backend** (`ldx_addons`, graph-resolved):

- Service pattern to replicate: `SalesCancellationService` @ `ldx_core/services/flow/cancellation_sales.py` (lifecycle, `CancellationGuardError`, `_cascade_targets`, `preview`, `_lock`/savepoint). Shared upload validation: `validate_cancellation_upload` @ `ldx_core/services/flow/cancellation_batch.py:34`.
- New files: `ldx_core/services/flow/arrival_cancellation.py`, `shipment_cancellation.py`, `store_sales_cancellation.py`, `store_sales_return_cancellation.py`.
- Controller pattern: `SalesCancellationController` @ `ldx_core/controllers/v2/sales/sales_cancellation_view.py` (preview/draft/confirm/release; `require_perm`). New: `/api/v2/arrival/cancel/*`, `/api/v2/shipment/cancel/*`, `/api/v2/store-sales/cancel/*`, `/api/v2/store-sales-return/cancel/*` + schemas in `ldx_core/schemas/`.
- Fields: add the six `cancellation_*` fields to `stock.picking` (definitions mirror `sale.order` @ `ldx_core/transactions/sale_order.py:297–317`); `store.sales` unchanged.
- Multi-process: `wizard/multi_process.py` — add method pairs to `MULTI_PROCESS_DATABASE_LOAD_MAPPING`/method map (pattern: `sales_pending_cancel` @ :529) and `CANCELLATION_BATCH_PERMISSIONS` @ :31; keep `_batch_selection_domain` behaviour @ :59.
- Batch registration: generic engine `controllers/batch.py` (`preprocessFunction` hook @ :82, `cancellation_permissions` @ :255); model hooks `batch_cancel` + `process_batch_cancellation` (pattern @ `ldx_core/transactions/sale_order.py:2919/2954`) on `stock.picking` and `store.sales`.
- Menu/authority: `eMenu` additions in `ldx_core/utils/constant_menu.py` (pattern @ :116/:135/:151).
- Inventory revert pattern: `action_revert_inventory` @ `sale_order.py:5901` and `warehouse_return_instruction.py:3974`; picking cancel path `_action_cancel`; closing guard `change.lock.date.history.is_date_period_closed` (usage @ cancellation_sales.py:244).

**Frontend** (`ldx-frontend`, graph/text resolved):

- Service factory: `createProtectedCancellationService` @ `src/services/Cancellation/cancellation.service.ts:67` → four new instances; entity union `CancelPreviewEntity` @ `src/services/Cancellation/types.ts:58` extended with `order_slip`, `store_sales_return`, `ec_order_return`.
- List wiring pattern: `SlipList.tsx` @ `src/views/InventoryControl/ArrivalPurchaseProcess/PurchaseSlipList/partials/SlipList/SlipList.tsx:249` (`MultiProcessTools` + `extraForm` `CancellationReasonForm` + `disableMethods` + `onBeforeSubmit` eligibility/preview).
- Types: `generateMultiProcessTypes` @ `src/components/MultiProcessTools/utils/generateMultiProcessTypes.ts` (existing `arrival_slip`/`shipment_slip` entries; store-sales entry gains four cancel methods per PRD-StoreSalesReturn 2.2).
- Eligibility: `getCancellationEligibilityFailures` @ `src/services/Cancellation/batchEligibility.ts:20` extended with new modes.
- Registration panel: `CancellationPanelCore` @ `src/components/Cancellation/CancellationPanelCore.tsx` (adapter `CancellationServiceAdapter` @ :106); thin wrappers per screen (pattern `PurchaseCancellationPanel`).
- Batch-registration pages: pattern `PurchaseSlipCancellationBatchRegistrationPage.tsx`; sequences helper `getCancellationBatchSequences` @ `src/services/Cancellation/batchRegistration.ts`; routes `batchRegistration.ts:3`.
- Presentation: `listPresentation.ts` (`getCancellationDisplayFields`), `CancellationDetailDescriptions.tsx`, `affectedLinks.ts`, `boundedMap.ts` (concurrency-4 preview fan-out). Locked approach (follows phase 1/2): 取消区分 is the **separate `cancellation_type` field** with its own filter — the PRD's alternative of extending the main Status selection is NOT used.

**E2E** (`L-DX-E2E`, graph-resolved):

- Page-object pattern: `pages/inventory-control/arrival-purchase-process/purchase-slip-cancellation-batch-registration.ts` (`gotoUploadPage`, `uploadCancellationFile`, `submitCancellationBatch`, `assertUploadSuccess`, `assertUploadFailedPaid`, `assertPerRowErrors`) and its three siblings; four new page objects for the new pages.
- Specs: extend the ringi-100 suite (existing TC-010…061) with the four PRD scenario sets.

**API / data contracts:** single-`record_id` POST JSON for all 16 endpoints; success `{success, record_id, cancellation_type}`; guard failure `{success:false, record_id, message, column, affected[]}` with affected rows `{type, record_id, number, block, metadata}` (uniform keys validated FE-side by `validateProtectedEnvelope` @ cancellation.service.ts:30). Fields `snake_case`. Multi-process + batch-registration envelopes reuse the existing queue/batch contracts (`num_of_data*`, `error_list`).

## Data Flow

1. **Registration screen (single slip):** panel opens → `preview` (read-only `_cascade_targets`, flattened transitively across chained services) → reason form (gated) → `draft` → `cancellation_type='pending_cancellation'` + audit fields (main `state` untouched) → `confirm` (approve authority) → mark terminal → revert inventory/side effects → cascaded services run their own guarded confirm → response/refresh. Blocker rows (`block:true`) disable submission client-side and fail the guard server-side.
2. **List batch (multi-process):** checkbox selection → FE `onBeforeSubmit` eligibility + bounded preview pre-check → MultiProcessTools queue job (method pair per domain) → BE permission map → per-slip service call inside savepoint; `CancellationGuardError` becomes a per-slip error row (partial success); result list surfaces failures.
3. **Batch registration upload:** sample file (per-domain columns via `getCancellationBatchSequences`) → `batch_cancel` preprocess (`validate_cancellation_upload`: duplicate/blank/invalid/already-cancelled/reason rules) → any error ⇒ total failure, nothing written; all valid ⇒ per-row `process_batch_cancellation` → `draft_cancel` (status 取消待ち).
4. **Closing lock:** every mutation path checks `is_date_period_closed` for the slip's date field ⇒ guard error.

## Error Handling & Edge Cases (BOUNDARIES)

- **B** Applies: decimal precision of reverted quantities follows existing field precision; closing-date boundary inclusive per `is_date_period_closed` phase 1/2 behaviour; `cancellation_date` stored UTC, displayed timezone-aware (`router_timezone_awareness`). Negative/zero qty lines are out of scope (creation-time validation owns them).
- **O** Applies: duplicate slip numbers in one upload rejected (`seen_ids` in `validate_cancellation_upload`); already-processed slips rejected (`_reject_if_cancelled`); re-selecting a Pending slip allowed (re-mark), Cancellation Confirmed never re-selectable; multi-process chunks of 50 (`BATCH_PROCESS`); per-domain sample files prevent slip-number column transposition; service domains always include the `transfer_type`/`sales_operation_type` discriminator so Arrival/Shipment and STS/RSTS never cross.
- **U** Applies: JP terms listed above reused verbatim from i18n; sample-file headers 新規/更新 for JP locale, New/Update for EN (existing `allowedValues` pattern); `cancellation_remarks` free text multibyte-safe; EN/JP translation completeness required for all new strings.
- **N** Applies: `cancellation_type` tri-state (False / pending / confirmed) drives filters, buttons, guards; empty remarks valid unless reason `other`; blank slip number in file ⇒ per-row error; slip without linked records ⇒ empty `affected`, cancellation proceeds.
- **D** Applies: zero/one/many selected slips (button disabled when none); large files validated fully before any write; long cascade previews bounded FE-side (`boundedMap`, concurrency 4); multi-process queue chunking handles volume.
- **A** Applies: `require_perm(menu,'write'|'approve')` on all 16 endpoints; batch methods mapped in `CANCELLATION_BATCH_PERMISSIONS`; Read ⇒ view-only; guest users receive no authority; FE mirrors via `disableMethods` + `useCancellationAuthorization`. Ownership-based rules N/A (authority is group-based).
- **R** Applies: FE submit disabled while pending; BE `SELECT … FOR UPDATE` + savepoint + post-lock re-check (pattern `_confirm_connected_chain`); double-submit and concurrent cancel/confirm on one slip collapse to the first winner; the same slip in two concurrent batches is serialized by the row lock and guard.
- **I** Applies: guard failures are envelope rows, not HTTP errors — batch partial success preserved; queue-job per-slip failure does not abort siblings; `ldx_core` keeps `ldx_ec` optional (no-op when fields absent, pattern `_detach_ec_order`); FE validates envelope shape and surfaces malformed responses as errors.
- **E** Applies: timezone conversion at router + display; EN/JP locales; browser/screen N/A for BE.
- **S** Applies: valid path Confirmed → 取消待ち → 取消確定; release only from 取消待ち; invalid transitions raise guard errors (cancel a Draft; confirm a non-Pending; re-cancel terminal); movement pair mid-state (shipment done + arrival draft) handled by per-slip guards on both sides; period closing freezes edits (締め); no archival lifecycle beyond `active` flag domains.

## Acceptance Criteria & Verification

Observable criteria (per-repo commands live in the handoff):

1. All scenario tests in PRD 3.1–3.8 for each of the four documents pass: list button/modal + status errors + blocker errors + reason-modal gating + mixed-selection partial success (incl. STS/RSTS mix, PRD-StoreSalesReturn 3.1.5) + filters/columns + no-overwrite + closing-date lock + registration button display control + batch-registration error checks/rollback/result-status + download data columns + authority gating (Read/Write/Approve/Write+Approve).
2. Backend integration (PRD 3.7): inventory added back / deducted correctly with Available/Free/Reserved/Total recalculated; movement history records "Arrival Cancellation" / "Shipment Cancellation" / "Sales Cancellation" / "Return Cancellation"; lots created by a cancelled arrival are deleted (unconsumed only); outstanding order quantity recalculated (increased).
3. Linked-slip integration (PRD 3.8) per the cascade matrix in Domain Model — including full-chain reuse blockers surfacing in the originating preview (e.g. Purchase Paid blocks Arrival cancel; billing-confirmed blocks Shipment/Store Sales cancel through the Sales chain).
4. Batch upload is atomic on any error; batch list flow is partial-success per slip; reason never overwritten on re-cancel.
5. No regression in phase 1/2 cancellation tests (Sales/Sales Return/Purchase/Purchase Return suites stay green) and consignment flows verified unaffected.

> This repo is read-only; verification runs in each target repo's own session.

## Doc-vs-code deltas (locked — code is truth)

1. The list-screen Batch Cancellation modal is the custom composition on top of `MultiProcessTools` (`extraForm` → `CancellationReasonForm`), not a bespoke modal outside it.
2. The batch (list) flow shows **no** affected-slips/blocker modal; affected/blocker information appears only on the registration screen via `CancellationPanelCore`'s preview modal. Batch failures surface in the multi-process result/error list.

## Decisions (recorded)

- **USER-APPROVED** — Cascade depth: cancelling Store Sales (and, by the same principle, Arrival/Shipment) runs the target domain's full phase 1/2 cancellation chain (guards + cascades), not a bare status flip. Preview is transitively flattened.
- **USER-APPROVED** — Approach A: replicate the phase 1/2 pattern per domain; four new service classes; shared logic reused as-is; no refactor of approved code.
- **USER-APPROVED** — Scope: all four documents in phase 3; Store Sales PRD re-supplied after the initial mis-paste.
- **USER-APPROVED** — Store Sales Information list label: 取消確定 renders as **"Cancelled"** on that screen per PRD-StoreSales 2.6 (display-label only; the stored value and all other documents use 取消確定 / "Cancellation Confirmed"). Filters and downloads on that screen follow the same label.
- **USER-APPROVED (direction)** — Payment/point side effects are handled by a **guard blocker**, not by reversal: slips whose confirmation consumed irreversible financial/member resources refuse cancellation. Per-item scope (inventory items 4–15) remains `PENDING` (PENDING-1…PENDING-4 in the inventory section).

## Store Sales / Store Sales Return — Cancellation Side-Effects Inventory

Systematic inventory of everything a confirmed `store.sales` slip consumes or feeds, found by text-searching `_inherit = 'store.sales'` and cross-module references across `ldx_addons` (13 extending modules + referencing models). The PRDs are silent on all of these; the USER-APPROVED direction is a **guard blocker** (slips with irreversible side effects refuse cancellation), with per-item scope still `PENDING`.

**Covered by existing design (no action):**

| # | Item | Evidence |
|---|------|----------|
| 1 | Inventory deduction (store virtual warehouse) | revert in the new cancellation service |
| 2 | Sales Slip + AR | full chain STS→Sales (phase 1 guards) |
| 3 | Linked RSTS / EC order / Sales Return | cascade matrix above |

**Blocker candidates (consumed at confirm, no reversal machinery exists):**

| # | Item | Evidence | Proposed disposition (non-binding) |
|---|------|----------|-----------------------------------|
| 4 | Point payment — member balance deducted (`membership.point.history` negative) at `create_sale_order` | `ldx_ec/models/store_sales.py:242→283` | BLOCK |
| 5 | Point grant/reward — `ext.point.history`, base/special grant; expiry cron reads it | `ext_point/models/store_sales.py:13` | BLOCK |
| 6 | Coupon consumption — `ec.coupon.history`; no restore method exists anywhere | `ldx_ec/models/store_sales.py` `_create_coupon_history` | BLOCK |
| 7 | RSTS point refund + reward retract (positive refund of `point_usage`, negative retract × percentage) | `_get_point_retract` @ `ldx_ec/models/base_sales_channel.py:267` | BLOCK on RSTS |
| 8 | Tax free (免税) — `tax.free.process` + amounts on slip; no cancel handling | `ldx_core/base/account_tax_free.py:25` | BLOCK |
| 9 | Formal Receipt (領収書) — issued document linked to slip | `formal_receipt.store_sales_id` @ `ldx_core/transactions/formal_receipt.py:18` | BLOCK |
| 10 | External-origin slips — Smaregi (`smaregi_link_id`, `smaregi_dispose_*`, `smaregi_is_cancellation`), POSCM import (`ext_poscm` `_create_sale_order_or_return`), TeamStore (`teamstore_id`) | `external_link/models/store_sales.py:14–18`, `ext_poscm/models/ext_poscm_sales.py`, `ext_teamstore/models/store_sales.py:8` | BLOCK (⚠️ quantify share first — see PENDING-3) |

**Snapshot / aggregate / analytics (verify, not block):**

| # | Item | Evidence | Proposed disposition |
|---|------|----------|----------------------|
| 11 | POS closing snapshot aggregates store sales at closing | `pos_closing.py:109` | PENDING-2: block cancel after POS closing, or accept staleness |
| 12 | Daily sales linkage | `daily_sale_id` | same as 11 |
| 13 | Membership purchase history (feeds RFM) — created at `create_sale_order` | `ldx_ec/models/store_sales.py:246–248` | verify/accept stale |
| 14 | RFM / purchase analysis / DR summary / MD digest & daily report — read-based | `ldx_ec/models/rfm_setting.py:130+`, `ext_drsum`, `ldx_md` | verification item: queries must filter `state != 'cancel'` |
| 15 | EC reserve order (取り置き) fulfillment state | `ec_reserve_order.store_sales_id` | verify/accept stale |

**No system impact:** cash/change/gift-cert display amounts (`change_amount`, `marketable_securities_overpayment_amount`).

**Additional facts resolved by this inventory:**
- Closing-lock date field for `store.sales` = **`sales_date`** (resolves pin-point 1 for this model): `ldx_core/account_closing/store_sales.py` `_check_sales_date` guards `create_sale_order`/`create_sale_return` today; the cancellation guard mirrors it. `ldx_account_closing` also guards `unlink`/`action_archive` by `sales_date`.
- Smaregi already models its own cancellation concept (`smaregi_is_cancellation`) — a future integration hook, out of phase 3 scope.

**PENDING decisions from this inventory:**

- [PENDING-1] Final blocker condition set: items 4–8 only, or 4–10 (include formal receipt + external-origin)? Consequence: more conditions = more slips uncancellable.
- [PENDING-2] POS-closed / daily-sales-closed slips (11–12): block cancellation, or accept stale aggregates as known limitation?
- [PENDING-3] External-origin share (10): if a large fraction of store sales is Smaregi/POSCM-imported, blocking them makes cancellation nearly unusable — quantify from production data before deciding.
- [PENDING-4] Phase-1 bypass alignment: `_cancel_store_sales` (`cancellation_sales.py:521`) calls `_action_cancel()` directly and would bypass the new blocker. Options: leave + document (zero code change, inconsistent behavior), align it (small change, but changes approved phase-1 Sales-cancel behavior for point/coupon-paid store sales), or surface as a blocker row in the Sales preview.



## Open Questions

Product decisions PENDING-1…PENDING-4 are listed in the inventory section above. Implementation pin-points (discoverable in-code, non-blocking, to be confirmed by the implementing repo):

1. Closing-lock date field per model — **resolved for `store.sales`: `sales_date`** (see inventory); still pending for `stock.picking` (candidates: `scheduled_date`/`date_done`).
2. Exact flag re-activating "Create Arrival Slip" (order.master side; candidate `order_slip_created` @ base/stock_picking.py:521) and "Create Shipment" (receipt.order side; candidate `sales_slip_created` @ :630).
3. Lot-deletion query semantics (only lots created by the arrival, unconsumed elsewhere).
4. Outstanding-quantity recalculation entry point on `order.master`.
5. New process-code numbering for the eight multi-process methods (follow the `.1`/`.2` variant convention).

## Implementation Handoff (advisory)

Execute each block in a separate agent session rooted at the target repo. Read that repo's root `CLAUDE.md`/`AGENTS.md` first and follow its conventions and verification commands.

### BE — `BE_PWD` (L-DX_Backend, base `feat/ringi-100-cancellation`)

- **Goal:** implement phase 3 cancellation backend per this spec.
- **Scoped files/symbols:** `ldx_core/services/flow/` (4 new services), `ldx_core/controllers/v2/` (4 new controllers + registrations), `ldx_core/schemas/` (4 new schema sets), `ldx_core/base/stock_picking.py` (6 fields), `ldx_core/wizard/multi_process.py` (8 methods + permissions), `ldx_core/controllers/batch.py` (config + `cancellation_permissions`), `ldx_core/transactions/stock_picking`-side hooks (`batch_cancel`, `process_batch_cancellation`) + `store.sales` hooks, `ldx_core/utils/constant_menu.py` (4 eMenu keys), authority/menu data files, `ldx_core/tests/test_ringi_100_*` (4 new suites).
- **Ordered steps:** fields → services (guards/cascades/preview per matrix) → controllers+schemas → eMenu/authority → multi-process methods → batch-registration configs/hooks → side-effect integration (revert/lot/outstanding/create-arrival & create-shipment reactivation flags; pin-points 1–4) → tests.
- **Acceptance criteria:** spec criteria 1–5 (backend portions); all new + phase 1/2 test suites green.
- **Cross-repo dependencies:** endpoint paths and envelope shapes are consumed verbatim by the FE handoff; eMenu route strings must match FE routes.

### FE — `FE_PWD` (ldx-frontend, base `feat/ringi-100-phase-2`)

- **Goal:** phase 3 cancellation UI per this spec (list, registration, batch registration, filters/columns/downloads, i18n).
- **Scoped files/symbols:** `src/services/Cancellation/*` (4 services, entity union, eligibility modes, routes), `src/components/MultiProcessTools/utils/generateMultiProcessTypes.ts`, list views (Arrival Slip List, Shipment Slip List, Store Sales Entry), registration views ×3 (thin `CancellationPanelCore` wrappers + `useCancellationAuthorization` modes), 4 new `*CancellationBatchRegistrationPage` views + routes, download column configs, i18n EN/JP.
- **Ordered steps:** services/types → generateMultiProcessTypes + list wiring → registration panels → batch-registration pages → filters/columns/downloads → i18n → unit tests.
- **Acceptance criteria:** spec criteria 1 (UI portions) + 4; existing suites green.
- **Cross-repo dependencies:** requires BE endpoints/menus deployed for integration; route strings must match BE `eMenu` values.

### E2E — `E2E_PWD` (L-DX-E2E, base `feat/ringi-100`)

- **Goal:** phase 3 cancellation E2E coverage per PRD scenario sections.
- **Scoped files/symbols:** 4 new batch-registration page objects (pattern: `pages/inventory-control/arrival-purchase-process/purchase-slip-cancellation-batch-registration.ts`), new specs continuing the ringi-100 TC numbering, fixtures for movement pairs / EC links / linked blockers.
- **Ordered steps:** page objects → specs per document (3.1→3.8) → fixtures → run + stabilize.
- **Acceptance criteria:** spec criteria 1–3 executed end-to-end green.
- **Cross-repo dependencies:** runs against FE+BE phase 3 branches merged/deployed together.
