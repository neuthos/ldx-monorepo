# Ringi 100 — Phase 3 Cancellation (Arrival / Shipment / Store Sales / Store Sales Return) — Technical Spec

**Sync ID:** `r100p3-e2b61f` — must match the TDD sheet Metadata `ID`; a mismatch means the sheet or this file is stale.
**TDD Sheet:** `Ringi 100 - Phase 3 - TDD` (folder `1eFHQSvv0LXLTl7UzH0na-k1FuK5lFK0h`) — Treacibility Matrix rows 10–42 are the 1:1 BR/FR mirror of this spec.
**Status:** awaiting human bulk review in the sheet (5 open Questions in Q&A tab).

## 1. Context

Ringi 100 introduces a governed two-step slip cancellation (Confirmed → 取消待ち → 取消確定). Phase 1/2 (approved, on `feat/ringi-100-cancellation` BE / `feat/ringi-100-phase-2` FE) covers Sales, Sales Return, Purchase, Purchase Return. Phase 3 adds **Arrival Slip (入荷伝票)**, **Shipment Slip (出荷伝票)**, **Store Sales (店舗売上)**, and **Store Sales Return (店舗売上返品)** per four PRDs (user-pasted 2026-08-19). The approved phase 1/2 code is the architectural source of truth; this spec replicates it (USER-APPROVED direction in the prior session — re-confirmation requested via sheet Q&A).

## 2. Model & screen mapping (graph + text-search evidence)

| PRD doc | Model (evidence) | "Confirmed" | Screens (L-Pedia / menu.json) |
|---|---|---|---|
| Arrival Slip | `stock.picking` `transfer_type='arrival'` (`base/stock_picking.py:318`) | `state='done'` (Waiting=`draft`) | Arrival Slip List (`/inventory-control/arrival-purchase-process/arrival-slip-info-list`), Arrival Slip Registration, Arrival Slip Batch Registration |
| Shipment Slip | `stock.picking` `transfer_type='shipment'` | `state='done'` | Shipment Slip List (INV-050-001), Shipment Slip Registration (INV-050-003), Shipment Slip Batch Registration (INV-050-004) |
| Store Sales | `store.sales` `sales_operation_type='sales'` (STS-) (`transactions/store_sales.py:85–110`) | `state='done'` | Store Sales Entry / Registration / Batch Registration / Information |
| Store Sales Return | `store.sales` `sales_operation_type='return'` (RSTS-) | `state='done'` | shared Store Sales Entry + Registration (return side) |

Linked-slip fields (all `stock_picking.py` unless noted): `order_id`→`order.master` (:444), `account_payable_id/ids`→`account.move` (:483/:487), `sale_order_id`→`sale.order` (:532), `order_receipt_slip_id`→`receipt.order` (:623), `shipment_slip_id` (:480, movement pair). `store_sales.py`: `sale_order_id` (:153), `return_store_slip_id` (:157), `sales_return_slip_ids`→`warehouse.return.instruction` (:164). `ldx_ec`: `ec.order.receive.store_sales_id`, `ec.order.return.store_sales_id` (`ec_order_return.py:507`; text-search evidence — outside graph scope).

## 3. BR/FR summary (1:1 with TM rows 10–42)

- **BR-01 Arrival (FR-01..06)**: list batch + status/Paid-purchase guards; registration buttons + related-slips modal; batch registration 取消 op (atomic total failure); BE confirm effects (inventory deduct, movement→return to Shipment From, lot deletion, outstanding recalc on `order.master`, history "Arrival Cancellation"); cascade (Order unchanged + Create Arrival reactivated, Shipment Confirmed→cancelled, Purchase Draft→deleted / Confirmed+unpaid→cancelled / Paid→blocker); info list + downloads (取消区分 + 5 columns).
- **BR-02 Shipment (FR-07..12)**: list batch + blockers (Sales billing-confirmed; Arrival Confirmed); registration; batch registration; BE revert + history "Shipment Cancellation"; cascade (Sales Draft→cancel / Confirmed+billing-draft→chain / billing-confirmed→blocker; Arrival Waiting→deleted / Confirmed→blocker; Customer Order Create Shipment re-enabled); info + downloads.
- **BR-03 Store Sales (FR-13..17)**: Entry list 4-type modal (STS/RST pending+confirm), mixed partial success; registration; batch registration (+linked-return-confirmed error); BE revert + history "Sales Cancellation" + cascade (RSTS draft→cancel/confirmed→blocker; EC order→Cancel; Sales without return→chain; with return→blocker); info list ("Cancelled" label) + downloads.
- **BR-04 Store Sales Return (FR-18..21)**: registration (return side); batch registration (RSTS numbers); BE deduct + history "Return Cancellation" + cascade (EC return→cancel; Sales Return→cancel; original STS unchanged); list side shared with FR-13.
- **BR-05 Common UX (FR-22..25)**: reason modal contract (Input Error / Request from Business Partner, etc. / Others; details required only for Others; apply-to-all; never overwrite existing reason); standard related-slips modal (Type incl. Billing Creation/Deposit/Payment Creation/Payment | Related Slip | "Blocks Cancellation"/"Affected" | Open in new tab + top-of-modal messages); 取消区分 as separate `cancellation_type` field + filters (phase 1/2 approved approach); 締め closing guard.
- **BR-06 Authority (FR-26)**: four items (Arrival/Shipment/Store Sales/Store Sales Return Slip Cancellation), Read/Write/Approve/Write+Approve, no guest — consistent with RINGI-139's four-level model (L-Pedia `1790050310`).
- **BR-07 Chain semantics (FR-27 Question, FR-28)**: cross-domain cascade = full phase-1 chain reuse (prior approval, re-confirm in Q&A-1); movement pair = ONE chain, arrival-side initiation, mark-before-cascade, loop-safe, reverse direction blocked.
- **BR-08 Payment/point/external blockers (FR-29..32 Questions)**: see §5 inventory + Q&A-2..5.
- **BR-09 Labels (FR-33)**: Store Sales Information renders 取消確定 as "Cancelled" (PRD Store Sales 2.6); other screens use "Cancellation Confirmed".

## 4. Backend architecture (replication of approved phase 1/2 pattern)

- 4 services in `ldx_core/services/flow/`: `arrival_cancellation.py`, `shipment_cancellation.py`, `store_sales_cancellation.py`, `store_sales_return_cancellation.py` — anatomy of `SalesCancellationService` (`cancellation_sales.py`): `_is_confirmed` (discriminator + `state='done'` + not terminal), `_check` → `CancellationGuardError` (reuse), `draft_cancel`/`confirm_cancel`/`release_cancel`/`preview`, `_cascade_targets` → `{type, record_id, number, block, metadata}`.
- Fields: six `cancellation_*` fields added to `stock.picking` (mirror `sale_order.py:297–317`); `store.sales` already has them (`store_sales.py:222–244`).
- Controllers: `POST /api/v2/{arrival|shipment|store-sales|store-sales-return}/cancel/{preview,draft,confirm,release}`, `require_perm(menu,'write'|'approve')`, guard-error envelope `{success:false, message, column, affected}`; schemas in `ldx_core/schemas/`.
- Multi-process batch (list): 8 new methods in `wizard/multi_process.py` (`.1`/`.2` variant codes) + `CANCELLATION_BATCH_PERMISSIONS` + `_batch_selection_domain`; partial success per slip; Store Sales Entry = one type, four methods.
- Batch registration upload: `batch_cancel` + `process_batch_cancellation` hooks on `stock.picking` and `store.sales`, shared `validate_cancellation_upload` (`cancellation_batch.py`) — atomic total failure.
- Closing guard: `change.lock.date.history.is_date_period_closed`; date fields — `store.sales.sales_date` (resolved: `ldx_core/account_closing/store_sales.py`), `stock.picking` pending (candidates `scheduled_date`/`date_done`).
- Cycle safety: origin marked 取消確定 before cascade; cascades skip cancelled records; preview flattens with visited-set.
- eMenu/authority: four new keys in `utils/constant_menu.py` + User/Group Authority Master data; Store Sales & Return under "Store Sales Return Batch Registration Settings" group per PRD.

## 5. Impact Analysis & Requirements Gap Inventory (store.sales cancel)

13 modules extend `store.sales` (text-search `_inherit` sweep). Dispositions:

| # | Item | Evidence | Disposition | Status |
|---|---|---|---|---|
| 1–3 | Inventory revert; Sales+AR via chain; RSTS/EC/Sales-Return cascade | spec §3–4 | covered (reverse) | — |
| 4 | Point payment deduct at `create_sale_order` | `ldx_ec/models/store_sales.py:242→283` | block (Q&A-2) | PENDING |
| 5 | Point grant (`ext.point.history`) | `ext_point/models/store_sales.py:13` | block (Q&A-2) | PENDING |
| 6 | Coupon consumption (no restore machinery) | `_create_coupon_history` | block (Q&A-2) | PENDING |
| 7 | RSTS point refund + reward retract | `_get_point_retract` @ `base_sales_channel.py:267` | block on RSTS (Q&A-2) | PENDING |
| 8 | Tax free `tax.free.process` | `base/account_tax_free.py:25` | block (Q&A-2) | PENDING |
| 9 | Formal receipt (領収書) | `formal_receipt.py:18` | block (Q&A-2 option b) | PENDING |
| 10 | External origin (Smaregi/POSCM/TeamStore) | `external_link/store_sales.py:14–18`, `ext_poscm`, `ext_teamstore:8` | block or allow (Q&A-3; quantify share first) | PENDING |
| 11 | POS closing snapshot | `pos_closing.py:109` | block or accept-stale (Q&A-4) | PENDING |
| 12 | Daily sales linkage | `daily_sale_id` | same as 11 | PENDING |
| 13 | Membership purchase history / RFM / DRsum / MD (read-based) | `rfm_setting.py:130+` etc. | verify state filters (`state != 'cancel'`) | — |
| 14 | EC reserve order fulfillment state | `ec_reserve_order.store_sales_id` | accept-stale (documented) | — |
| 15 | Bypass: `_cancel_store_sales` phase-1 path | `cancellation_sales.py:521` | Q&A-5 | PENDING |

## 6. BOUNDARIES (spec-level; TC-level statuses belong to test-spec)

B boundary values / closing date inclusive — applies (guards + precision follow field decimals). O ordering — duplicates in upload rejected (`seen_ids`), already-processed rejected, batch partial-success skip rules, STS/RST split. U unicode — 取消待ち/取消確定/取消理由/取消理由詳細 verbatim from i18n; sample files 新規/更新 vs New/Update; multibyte remarks. N null/empty — `cancellation_type` tri-state; blank slip no; blank details vs Others; slip without links → empty preview. D data volume — chunk 50 (`BATCH_PROCESS`), large-file atomic validation, boundedMap concurrency 4. A access — `require_perm` 16 endpoints, batch permission map, Read=view-only, no guest. R race — FOR UPDATE + savepoint + post-lock re-check; double-submit; same slip in two batches. I integration — guard errors as envelope rows; `ldx_ec`-absent no-op (`_detach_ec_order` pattern). E environment — timezone-aware `cancellation_date`; EN/JP completeness. S state transitions — Confirmed→取消待ち→取消確定; release only from 取消待ち; invalid transitions guarded; 締め freeze.

## 7. Decisions

- Prior-session USER-APPROVED, now re-confirmation requested via sheet: full-chain reuse (FR-27/Q&A-1), blocker approach for payment/point (FR-29/Q&A-2). "Cancelled" label for Store Sales Information is PRD-explicit this time (FR-33, no longer PENDING).
- Code-vs-code deltas locked: batch modal = custom composition on MultiProcessTools (`extraForm` CancellationReasonForm); no affected/blocker modal in the batch flow — registration screens only (now PRD-aligned).

## 8. L-Pedia sources

Shipment Slip List (INV-050-001, `1775566850`), Shipment Slip Registration (INV-050-003, `1776517127`), Shipment Slip Batch Registration (INV-050-004, `1782349825`), RINGI-139 four-level authority model (`1790050310`). Not found in L-Pedia: Store Sales Entry/Registration manual, Arrival Slip List manual, any RINGI-100 page — consider adding post-implementation.

## 9. Handoff (advisory)

BE (`feat/ringi-100-cancellation`) → FE (branch off phase-2) → E2E (`feat/ringi-100`), per-repo packets as in §4 + the existing reusable components (`src/services/Cancellation/*`, `CancellationPanelCore`, `generateMultiProcessTypes`, E2E batch-registration page objects). Next pipeline steps: human bulk-review in sheet → `tdd-sheet-update` (Done gate) → `/spec-test-plan-agent` → contract agent.
