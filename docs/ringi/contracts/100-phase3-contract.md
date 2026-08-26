# Ringi 100 Cancellation Phase 3 — FE/BE/E2E Contract

**Source design:** `docs/ringi/specs/100-phase3-spec.md`
**Source test plan:** `docs/ringi/test-plans/100-phase3-test-spec.md` (78 TCs, all Approved)
**TDD sheet:** Ringi 100 - Phase 3 - TDD (gate `Done`, sync `r100p3-m91x7c`)
**Contract status:** Ready for implementation
**Scope:** FE / BE / E2E

## 1. Contract Summary

### TL;DR
BE adds four cancellation services + 16 endpoints + fields/guards reproducing the approved phase-1/2 pattern for Arrival, Shipment, Store Sales and Store Sales Return, including the five USER-APPROVED blocker decisions. FE reuses the existing cancellation stack (services factory, CancellationPanelCore, CancellationReasonForm, MultiProcessTools wiring) and adds the four domain instances plus classification columns/filters. E2E clones the phase-1/2 page-object pattern into 12 POMs covering 24 journeys. Implementation can start.

### Coverage and confidence
- E2E test-plan cases mapped: 78/78 (100 percent) — 53 E2E-typed TCs consolidated into 24 journeys; 25 unit/integration TCs traced via BE contracts.
- Pages mapped: 15 (2 existing masters/CO + 13 proposed wirings on existing screens).
- Element contracts: 14 (5 Existing-based, 9 Proposed).
- BE/API contracts: 14 (4 Existing-pattern, 10 Proposed).
- Confidence: 87 percent — evidence from session graph exploration (BE feat/ringi-100-cancellation, FE phase-2 components, E2E page objects); Odoo dynamic relations via text sweep; FE branch now feat/ringi-141 (cancellation code untouched).

### Decisions and status
- `USER-APPROVED` (sheet, 2026/08/19): full-chain reuse; minimum financial blocker set (receipt excluded); block-all external origin; block after POS/daily closing; phase-1 path alignment; 'Cancelled' label exception; separate cancellation batch-registration screens (FR-03/09/15/19 rejected).
- `Existing`: CancellationPanelCore/CancellationReasonForm/services factory/MultiProcessTools/listPresentation/boundedMap (FE); SalesCancellationService pattern, guard envelope, batch engine, validate_cancellation_upload, action_revert_inventory, change.lock.date.history (BE); 4 cancellation-batch-registration page objects + helpers (E2E).
- `Proposed`: everything in §4-§6 marked Proposed.
- `PENDING`: see §9.

## 2. Scope and Contract Principles

- In scope: the 29 Approved FRs; the four domains' list/registration/info screens; masters; cross-domain chains; the five approved blocker decisions.
- Out of scope: batch-registration upload FRs (rejected — separate screens as phase 1/2); point/coupon reversal machinery (blocked, not reversed); Issue tab.
- Selector policy: follow the repo's existing `data-test` convention with `{screen}-{element}` kebab naming (evidence: `purchase-slip-list-multi-process-tools`, `btn-create-purchase`); semantic role/name acceptable for stable labeled controls; never CSS classes or nth().
- Ownership rule: FE exposes selectors/semantics; BE exposes data/error/state contracts; E2E consumes both through POM.

## 3. E2E Journey and Page Map

| Journey ID | Test-plan IDs | Actor / Data | Ordered pages and routes | Business outcome | Status |
|---|---|---|---|---|---|
| J-ARR-LIST | TC-26,55,56 | Warehouse user; arrival slips in Waiting/Confirmed/Pending/terminal + Paid-purchase variant | 1. Arrival Slip List (/inventory-control/arrival-purchase-process/arrival-slip-info-list) | Batch cancellation enforced with status guard, Paid blocker, reason gating; mixed-status partial success | Proposed |
| J-ARR-REG | TC-27,58 | Warehouse user; Confirmed/Waiting/Pending/terminal arrivals | 1. Arrival Slip Registration | Buttons by status; related-slips modal (Blocks/Affected/Open); reason flow; closing lock | Proposed |
| J-ARR-DATA | TC-28,57,59 | Cancelled arrivals | 1. Arrival Slip List 2. Arrival Information List 3. Download | Classification + 5 columns + filters in list, info list, both downloads | Proposed |
| J-SHP-LIST | TC-29,60,61 | Warehouse user; Draft/billing-confirmed/arrival-confirmed/Conf cleanliness variants | 1. Shipment Slip List (INV-050-001) | Status guard; Sales-billing + Arrival blockers; both batch types partial success | Proposed |
| J-SHP-REG | TC-30,63 | Warehouse user | 1. Shipment Slip Registration (INV-050-003) | Button matrix; linked-slip error; happy-path reason registration | Proposed |
| J-SHP-CO | TC-31,65 | Customer-order owner | 1. Shipment cancel 2. Customer Order screen | Create Shipment re-enabled and usable; order stays Confirmed | Proposed |
| J-SHP-DATA | TC-32,62,64 | Cancelled shipments | 1. Shipment Slip List 2. Shipment Information List 3. Downloads | Cancellation data present in all four outputs | Proposed |
| J-STS-LIST | TC-33,66 | Store staff; STS+RSTS mixes | 1. Store Sales Entry | Four batch types; mixed STS/RST partial success; status guard; apply-to-all reason | Proposed |
| J-STS-REG | TC-34,68 | Store staff | 1. Store Sales Registration | Button matrix; reason variants; related-slips modal incl. EC/Sales rows | Proposed |
| J-STS-DATA | TC-35,67,70 | Cancelled STS slips | 1. Store Sales Entry 2. Store Sales Information 3. Downloads | 'Cancelled' label exception; PRD column placement; contrast with Shipment label | Proposed |
| J-RST-LIST | TC-48,71,72 | Store staff | 1. Store Sales Entry (return side) | RST pending/confirm types; inverse partial success; Draft error | Proposed |
| J-RST-REG | TC-36,73 | Store staff | 1. Store Sales Registration (return side) | Button matrix; reason; related-slips modal incl. unchanged Store Sales row | Proposed |
| J-RST-DATA | TC-74 | Cancelled RSTS slips | 1. Store Sales Entry 2. Information 3. Downloads | Cancellation data present | Proposed |
| J-AUTH | TC-37,75,76 | Read/Write/Approve/W+A users; guest | 1. Masters 2. Four registration screens | Four authority items exist; gating per level; no guest | Proposed |
| J-ARR-CASCADE | TC-38,39,40 | Confirmed arrivals w/ links | 1. Registration cancel 2. downstream lists | Stock/lot/outstanding reversal; movement pair one-chain; Purchase delete/cancel/block; Order reactivation | Proposed |
| J-SHP-CASCADE | TC-41,42 | Confirmed shipments w/ links | 1. Registration cancel 2. downstream lists | Inventory add-back + history; Sales chain cancel; arrival delete/block; CO re-enable | Proposed |
| J-STS-CASCADE | TC-43,44 | Confirmed STS w/ links | 1. Registration cancel 2. downstream lists | Stock restore + history; RSTS/EC/Sales cascade with full-chain blockers | Proposed |
| J-RST-CASCADE | TC-45 | Confirmed RSTS w/ links | 1. Registration cancel 2. downstream lists | Deduct + history; EC-return + Sales-Return cancel; original STS untouched | Proposed |
| J-CHAIN | TC-46,52 | STS linked to Sales+billing+purchase | 1. Preview modal 2. Sales cancel path | Transitive preview no loops; phase-1 path surfaces new blockers (aligned) | Proposed |
| J-BATCH-ENGINE | TC-47,49,50 | Batch operator users | 1. Lists (multi-process) | Per-method eligibility + partial success; write/approve per method; double-confirm serializes | Proposed |
| J-REGRESSION | TC-51,53 | Existing suites | 1. CI suites | ldx_ec-absent no-op; phase 1/2 suites stay green | Proposed |
| J-DATA-ALL | TC-54 | Cancelled slips all domains | 1. All lists + info lists + downloads | Cancellation columns correct in every output | Proposed |
| J-BLOCKERS | TC-69 | Slips with each blocker condition | 1. List/registration cancel attempts | Right refusal message per blocker (paid, billing, return, financial set, external, POS-closed) | Proposed |
| J-VISIBLE-INTEG | TC-77,78 | Cancelled slips | 1. Inventory screen 2. Movement history 3. Linked-slip lists | Backend effects observable; linked statuses visible; batch flow modal-free | Proposed |

## 4. FE ↔ E2E Element Contract

| Contract ID | Page / Component | Element and purpose | Role / label | Locator / data-test | Status | POM method or assertion | Linked FR/TC |
|---|---|---|---|---|---|---|---|
| EC-01 |Arrival Slip List | MultiProcessTools host w/ cancellation methods | toolbar | data-test="arrival-slip-list-multi-process-tools" | Existing component / Proposed methods | openBatchCancellation(method) | Proposed | FR-01, TC-26,55,56 |
| EC-02 |All four lists | Reason form inside batch modal (CancellationReasonForm) | form | component: src/components/Cancellation/CancellationReasonForm.tsx | Existing (phase-1/2) | fillReason(other, details); assertExecuteDisabled() | Existing | FR-22, TC-26,55 |
| EC-03 |Arrival/Shipment/STS/RST Registration | Cancellation Registration button | button | data-test="{screen}-cancellation-register-btn" | Proposed | registerCancellation() | Proposed | FR-02/08/14/18, TC-27,58,30,63,34,68,36,73 |
| EC-04 |same | Cancellation Confirmed button | button | data-test="{screen}-cancellation-confirm-btn" | Proposed | confirmCancellation() | Proposed | FR-02 etc., TC-27 step6 |
| EC-05 |same | Related-slips preview modal | modal | data-test="{screen}-cancellation-preview-modal"; rows data-test="preview-row-{entity}" | Existing core (CancellationPanelCore) / Proposed entity rows | assertBlockFlag(entity); openRelatedSlip(entity) | Existing+Proposed | FR-23, TC-27,30,34,36 |
| EC-06 |preview modal row | Open link per related slip | link | data-test="preview-row-{entity}-open" | Proposed | openRelatedSlipNewTab(entity) | Proposed | FR-23 |
| EC-07 |All lists | Cancellation Classification filter | select | data-test="{screen}-classification-filter" | Proposed | filterBy('pending_cancellation') | Proposed | FR-24, TC-57,62,67 |
| EC-08 |All lists + info lists | 5 cancellation columns | table cells | columns via listPresentation.getCancellationDisplayFields | Existing helper / Proposed wiring | assertCancelColumns(row) | Existing+Proposed | FR-06/12/17, TC-28,32,35,54 |
| EC-09 |Store Sales Entry | MultiProcessTools 4-method host | toolbar | data-test="store-sales-entry-multi-process-tools" | Proposed | runBatchType('store_sales_pending_cancel') | Proposed | FR-13, TC-33,66,48,71,72 |
| EC-10 |Store Sales Information | Cancelled label cell | cell | i18n key common:cancelled (display-only; value stays cancellation_confirmed) | Proposed label / Existing value | assertLabel('Cancelled') | Proposed | FR-33, TC-70 |
| EC-11 |Customer Order screen | Create Shipment button re-enable | button | Existing screen control | Existing | assertCreateShipmentEnabled(); clickCreateShipment() | Existing | FR-11, TC-31,65 |
| EC-12 |User/Group Authority Masters | 4 cancellation authority items | form fields | master data + existing master screens | Existing screens / Proposed items | assertAuthorityItem('Arrival Slip Cancellation', level) | Proposed | FR-26, TC-75,76 |
| EC-13 |Lists (multi-process results) | Per-slip failure rows | table rows | result list of MultiProcessTools | Existing | assertRowFailed(slipNo) | Existing | TC-56,61,72 |
| EC-14 |Registration screens | Closing-locked disablement | buttons | isBeforeClosingDate prop (Existing panel prop) | Existing | assertButtonsDisabledWhenLocked() | Existing | FR-25, TC-57,62,67 |

## 5. E2E Page Object Model Contract

| POM ID | Page Object / Component | Route | Required methods | Consumed contract IDs | Fixture/data needs | Status |
|---|---|---|---|---|---|---|
| POM-01 |ArrivalSlipListPage | /inventory-control/arrival-purchase-process/arrival-slip-info-list | open; selectRows(n); openBatchCancellation(method); expectStatusError(text); expectBlockerError(text); submitReason(reason, details); assertRowStatus(slip, status) | EC-01,02,07,08,13 | arrival slips variants | Proposed (clone PurchaseSlipList pattern) |
| POM-02 |ArrivalRegistrationPage | arrival detail route | open(slipNo); assertCancelButtonStates(); openPreview(); assertRelatedSlip(entity, block); register(reason); confirm() | EC-03,04,05,06,14 | arrivals per status | Proposed |
| POM-03 |ShipmentSlipListPage | INV-050-001 route | open; selectRows; openBatchCancellation; expectBillingError; expectArrivalError; submitReason; assertRowStatus | EC-01,02,07,08,13 | shipment variants | Proposed |
| POM-04 |ShipmentRegistrationPage | INV-050-003 route | open; assertCancelButtonStates; expectLinkedBillingError; register; confirm | EC-03,04,05,06,14 | shipments per status | Proposed |
| POM-05 |StoreSalesEntryPage | store sales entry route | open; selectMixed(STS,RST); runType(type); assertPartialSuccess(expected); applyReasonToAll | EC-09,02,07,08,13 | STS+RSTS mixes | Proposed |
| POM-06 |StoreSalesRegistrationPage | STS detail route | open; assertCancelButtonStates; register(variant); openPreview; assertRelatedSlip | EC-03,04,05,06,14 | STS per status | Proposed |
| POM-07 |StoreSalesReturnRegistrationPage | RSTS detail route | open; assertCancelButtonStates; register(variant); assertOriginalStoreSalesUntouched | EC-03,04,05,06 | RSTS per status | Proposed |
| POM-08 |CancellationShared | shared | expectReasonModalGating(); assertPreviewContract(); openRelatedSlipNewTab(entity); assertBatchFlowHasNoPreviewModal() | EC-02,05,06,13 | - | Proposed (extract from phase-1/2 helpers) |
| POM-09 |AuthorityMastersPage | masters routes | openUserMaster; assertAuthorityItem; openGroupMaster; assertAuthorityItem | EC-12 | 4 authority users + guest | Proposed |
| POM-10 |CustomerOrderPage | customer order route | open(orderNo); assertCreateShipmentEnabled; createShipment() | EC-11 | confirmed order w/ cancelled shipment | Existing |
| POM-11 |InfoListPages (x3) | info list routes | open; filterClassification(option); assertCancelColumns; downloadAndAssertColumns | EC-07,08,10 | cancelled slips | Proposed |
| POM-12 |InventoryHistoryPage | inventory + movement history | open; assertQuantity(direction); assertHistoryRow('Arrival Cancellation'|'Shipment Cancellation'|'Sales Cancellation'|'Return Cancellation') | - | cancelled slips per domain | Proposed |

## 6. BE ↔ FE/E2E Data and API Contract

| Contract ID | Direction | Endpoint / model / action | Request or input | Response / persisted output | Default / nullable / error behavior | Status | Linked tests |
|---|---|---|---|---|---|---|---|
| BC-01 |FE->BE | POST /api/v2/arrival/cancel/{preview,draft,confirm,release} | record_id; draft: cancellation_reason, cancellation_remarks | success envelope; guard failure {success:false,message,column,affected[]} | strict vocab; require_perm write/approve; closing guard | Proposed | FR-01/02, TC-22 |
| BC-02 |FE->BE | POST /api/v2/shipment/cancel/* | same | same | same | Proposed | FR-07/08, TC-22 |
| BC-03 |FE->BE | POST /api/v2/store-sales/cancel/* | same | same | same + financial/external/POS-closed blockers | Proposed | FR-13/14, TC-22,69 |
| BC-04 |FE->BE | POST /api/v2/store-sales-return/cancel/* | same | same | same | Proposed | FR-18, TC-22 |
| BC-05 |BE | stock.picking cancellation fields | 6 x cancellation_* fields | mirrors sale_order definitions | copy=False; index on cancellation_type | Proposed | FR-01/07 |
| BC-06 |BE | multi_process methods x8 | arrival_/shipment_/store_sales_/store_sales_return_ pending+confirm | queue jobs per slip; per-slip error rows (partial success) | CANCELLATION_BATCH_PERMISSIONS write/approve per method | Proposed | FR-01 etc., TC-47,49 |
| BC-07 |BE | phase-1 alignment | cancellation_sales._cancel_store_sales | surfaces new blockers instead of raw _action_cancel | USER-APPROVED behavior change | Proposed | FR-32, TC-25,52 |
| BC-08 |BE | movement pair chain | arrival confirm cascades shipment | one savepoint; mark-before-cascade; loop-safe | reverse direction blocked by arrival blocker | Proposed | FR-28, TC-24,39 |
| BC-09 |BE | blocker guards (approved) | point/grant/coupon/tax-free; external all; POS-closed | guard errors per condition | receipt NOT blocked (minimum set) | Proposed | FR-29/30/31, TC-09,10,11,69 |
| BC-10 |BE | side effects | revert inventory; history rows; lot deletion; outstanding recalc | per-domain direction | action_revert_inventory pattern | Proposed | FR-04/10/16/20, TC-38,41,43,45,77 |
| BC-11 |BE | eMenu + authority data | 4 keys under PRD groups | User/Group master items | no guest | Proposed | FR-26, TC-75 |
| BC-12 |BE | preview contract | _cascade_targets per domain | affected[] {type,record_id,number,block,metadata} | transitive flatten, visited-set | Proposed | FR-23, TC-46 |
| BC-13 |FE | service factory instances x4 | createProtectedCancellationService prefixes | envelope validation | validateDraftRequest client-side | Proposed (Existing factory) | FR-01 etc. |
| BC-14 |FE | generateMultiProcessTypes additions | 8 method options + domains | ACL-disabled options | follows Existing arrival_slip/shipment_slip entries | Proposed (Existing file) | FR-13, TC-47 |

## 7. Journey-to-Contract Traceability

| Test-plan ID | Journey | FRs | Type | Assertion locus | Gap |
|---|---|---|---|---|---|
| TC-Ringi-100-Cancellation-Phase-3-01 |- | FR-01, FR-07, FR-13, FR-18 | Backend Unit Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-02 |- | FR-01 | Backend Unit Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-03 |- | FR-01 | Backend Unit Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-04 |- | FR-22 | Backend Unit Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-05 |- | FR-25 | Backend Unit Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-06 |- | FR-05 | Backend Unit Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-07 |- | FR-11 | Backend Unit Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-08 |- | FR-16 | Backend Unit Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-09 |- | FR-29 | Backend Unit Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-10 |- | FR-30 | Backend Unit Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-11 |- | FR-31 | Backend Unit Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-12 |- | FR-24 | Frontend Unit Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-13 |- | FR-22 | Frontend Unit Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-14 |- | FR-01 | Frontend Unit Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-15 |- | FR-23 | Frontend Unit Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-16 |- | FR-04 | Integration | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-17 |- | FR-05 | Integration | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-18 |- | FR-10 | Integration | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-19 |- | FR-11 | Integration | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-20 |- | FR-16 | Integration | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-21 |- | FR-20 | Integration | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-22 |- | FR-26 | Integration | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-23 |- | FR-27 | Integration | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-24 |- | FR-28 | Integration | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-25 |- | FR-32 | Integration | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-26 |J-ARR-LIST | FR-01 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-27 |J-ARR-REG | FR-02, FR-23 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-28 |J-ARR-DATA | FR-06 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-29 |J-SHP-LIST | FR-07 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-30 |J-SHP-REG | FR-08, FR-23 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-31 |J-SHP-CO | FR-11 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-32 |J-SHP-DATA | FR-12 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-33 |J-STS-LIST | FR-13, FR-21 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-34 |J-STS-REG | FR-14, FR-23 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-35 |J-STS-DATA | FR-17, FR-33 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-36 |J-RST-REG | FR-18, FR-23 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-37 |J-AUTH | FR-26 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-38 |J-ARR-CASCADE | FR-04 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-39 |J-ARR-CASCADE | FR-28, FR-04 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-40 |J-ARR-CASCADE | FR-05 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-41 |J-SHP-CASCADE | FR-10 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-42 |J-SHP-CASCADE | FR-11, FR-27 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-43 |J-STS-CASCADE | FR-16 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-44 |J-STS-CASCADE | FR-16, FR-27 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-45 |J-RST-CASCADE | FR-20 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-46 |J-CHAIN | FR-27, FR-28, FR-23 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-47 |J-BATCH-ENGINE | FR-01, FR-07 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-48 |J-RST-LIST | FR-13, FR-21 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-49 |J-BATCH-ENGINE | FR-26 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-50 |J-BATCH-ENGINE | FR-01, FR-13 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-51 |J-REGRESSION | FR-16, FR-20 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-52 |J-CHAIN | FR-32, FR-27 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-53 |J-REGRESSION | FR-27, FR-32 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-54 |J-DATA-ALL | FR-06, FR-12, FR-17 | E2E Integration Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-55 |J-ARR-LIST | FR-01, FR-22 | E2E Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-56 |J-ARR-LIST | FR-01 | E2E Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-57 |J-ARR-DATA | FR-06, FR-22, FR-24, FR-25 | E2E Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-58 |J-ARR-REG | FR-02, FR-23 | E2E Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-59 |J-ARR-DATA | FR-06 | E2E Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-60 |J-SHP-LIST | FR-07, FR-22 | E2E Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-61 |J-SHP-LIST | FR-07 | E2E Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-62 |J-SHP-DATA | FR-12, FR-24, FR-25 | E2E Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-63 |J-SHP-REG | FR-08, FR-23 | E2E Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-64 |J-SHP-DATA | FR-12 | E2E Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-65 |J-SHP-CO | FR-11 | E2E Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-66 |J-STS-LIST | FR-13, FR-22 | E2E Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-67 |J-STS-DATA | FR-17, FR-24, FR-25 | E2E Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-68 |J-STS-REG | FR-14 | E2E Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-69 |J-BLOCKERS | FR-29, FR-30, FR-31 | E2E Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-70 |J-STS-DATA | FR-17, FR-33 | E2E Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-71 |J-RST-LIST | FR-13, FR-21, FR-22 | E2E Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-72 |J-RST-LIST | FR-13, FR-21 | E2E Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-73 |J-RST-REG | FR-18 | E2E Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-74 |J-RST-DATA | FR-17, FR-24, FR-25 | E2E Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-75 |J-AUTH | FR-26 | E2E Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-76 |J-AUTH | FR-26 | E2E Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-77 |J-VISIBLE-INTEG | FR-04, FR-10, FR-16, FR-20 | E2E Testing | see journey |  |
| TC-Ringi-100-Cancellation-Phase-3-78 |J-VISIBLE-INTEG | FR-05, FR-11, FR-23 | E2E Testing | see journey |  |

## 8. Owner Work Packets

### BE (first)
1. stock.picking cancellation fields (BC-05) + four services with guards (BC-01..04, BC-09) + movement-pair chain (BC-08) + phase-1 alignment (BC-07).
2. Sixteen endpoints + schemas + require_perm + eMenu/authority data (BC-01..04, BC-11).
3. Multi-process methods x8 + permission map (BC-06); preview contract (BC-12); side effects (BC-10); test suites per TC-01..25.

### FE (parallel after BE contract freeze)
1. Four service instances + entity union additions (BC-13); generateMultiProcessTypes methods (BC-14).
2. Three list wirings + Entry 4-method host + panels x3 (EC-01..09); classification columns/filters (EC-07/08); 'Cancelled' label (EC-10).
3. data-test attributes per §4; unit tests per TC-12..15.

### E2E (after FE selectors land)
1. POM-01..12 cloning the phase-1/2 pattern; journeys J-* mapped to TC-26..78; Answerkey tabs TC-26..78 are the expected-value references.

## 9. PENDING Decisions and Risks

| ID | Decision needed | Why it matters | Owner | Blocking scope | Resolution |
|---|---|---|---|---|---|
| PENDING-001 | Closing-date field for stock.picking (scheduled_date vs date_done) | guard correctness on arrivals/shipments | BE | TC-05 | pin at implementation; store.sales resolved (sales_date) |
| PENDING-002 | Explicit double-confirm race TC (R dimension partial) | BOUNDARIES-R completeness | QA | TC gap after R | add one TC in next sheet pass |
| PENDING-003 | Team generator TC-34..37 numbering offset (fixed in sheet; script untouched) | recurrence in future ringi | Team | future runs | fix scripts/generate-testcases-data.py numbering |

## 10. Contract Acceptance Criteria

- All 78 Approved TCs map to journeys/contracts (§7 complete).
- Every POM interaction has an Existing locator or a Proposed FE-owned data-test following repo convention.
- Existing claims cite session evidence (paths/symbols in §1); none invented.
- Downstream pages (Customer Order, masters, inventory/history) included.
- BE envelopes, guards, defaults, permissions explicit (§6).
- PENDING items carry owner + resolution.
- No source repository modified; no test executed; sheet edits limited to Metadata (Status/ID/timestamp/Contract Spec).
