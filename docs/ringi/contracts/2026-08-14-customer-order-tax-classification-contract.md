# Customer Order Tax Classification FE/BE/E2E Contract

**Source design:** `docs/ringi/specs/2026-08-14-customer-order-tax-classification-design.md`
**Source test plan:** `docs/ringi/test-plans/2026-08-14-customer-order-tax-classification-test-plan.md`
**Contract status:** Ready for implementation — 6 `PENDING` decisions logged (§ 9); none block the core FE/BE scope. `J-06` (direct Sales journey) is blocked by `PENDING-001`.
**Scope:** FE / BE / E2E

Evidence snapshot used by this contract (all worktrees clean, read-only):

| Repo | Branch | HEAD | vs design snapshot |
| --- | --- | --- | --- |
| FE (`FE_PWD`) | `feat/ringi-141` | `ba5178eb43` | design `531f716` + 1 CI-fix commit; no feature files touched |
| BE (`BE_PWD`) | `issues/em-4314` | `b34c9eca80` | design `63ef5dba` is **not** an ancestor; 15 unrelated commits (QA docs, SQL opt, stock-taking batch); no tax work |
| E2E (`E2E_PWD`) | `master` | `16a9055c` | identical to design snapshot |

The `codebase-memory` MCP was not exposed in this session, so every code claim below
comes from narrow fallback inspection with exact `file:line` evidence — the same
limitation the design spec records. BE blast radius outside `ldx_addons` is not
claimed complete. Line numbers from the design spec have drifted slightly on BE
(notably `receipt_order.py` typo now at `:1152`, `stock_move_line.py`
`_get_as_sale_line` now at `:2126`, `get_shipment_preview_slip_data` now at
`:7157`); current-tree line numbers are used throughout.

## 1. Contract Summary

### TL;DR

FE must add the `税区分` line column, Apply-to-All tax controls, `税額` /
`受注金額（税込）` summary, copy/batch intent plumbing, and the entire stable
`data-test` hook set — **none of the `customer_order_*` hooks exist today** (only
`register_new_by_copying_button` exists). BE must add the nullable
`receipt.order.product.line.tax_id`, resolver/write-intent rules, nonstored
`tax_amount` / `amount_including_tax`, batch Tax Classification + Shipment
Address columns, copy metadata, and Sales propagation through direct conversion
and the Sales-purpose Shipment preview — **no tax field or `purpose` parameter
exists anywhere on Customer Order models today**. E2E extends the existing
`CustomerOrderRegistrationPage` and reuses one Shipment POM family; five E2E
journeys are fully contracted and one (direct Sales) is `PENDING` on an
unidentified UI trigger. Implementation can start in dependency order
BE → FE → E2E.

### Coverage and confidence

- E2E test-plan cases mapped: 6/6 (100%) — `TAX-054–TAX-058` plus the `PENDING`
  direct-Sales row mapped to `J-06` as an explicit gap.
- Pages mapped: 9 (9 existing routes/surfaces / 0 new pages / 0 pending) — all
  tax elements are added inside existing pages.
- Element contracts: 32 (1 `Existing` stable, 31 `Proposed`; 6 of the `Proposed`
  rows replace selectors that exist today but are unstable — product-text-keyed,
  label-filtered, or index-based).
- BE/API contracts: 17 (2 `Existing`, 15 `Proposed` — mostly proposed changes to
  existing methods).
- Confidence: ~90% on existence/absence claims — every status is backed by direct
  `file:line` inspection of clean worktrees at the HEADs above. Limitations: no
  code graph; BE consumers outside `ldx_addons` verified only by exact-literal
  scans; `ldx_credit` discrepancy (`PENDING-005`).

### Decisions and status

- `USER-APPROVED`: `DEC-01–DEC-18` from the design ledger — all carried into this
  contract unchanged; not reopened.
- `Existing`: `register_new_by_copying_button`
  (`CustomerOrderRegistration.tsx:306`); sale-order tax M2M command shape
  `[[6, 0, [id]]]` / `[[6, 0, []]]` (`useFormActions.ts:131`); Tax Master seed
  data and `account.tax` extension fields; `customer_shipment_address` field;
  Product `rate_of_tax_id` / `get_sales_tax()`; `rounding_method_sales` /
  `get_rounding_by_type('sales')`.
- `Proposed`: every `customer_order_*` / `sales_registration_line` /
  `sales_line_tax_classification` / `shipment_create_sales_button` hook; BE
  `tax_id`, resolver, derived totals, copy/batch metadata, Sales-purpose preview
  branch, `ldx_ec` projection seam, and scoped defect fixes.
- `PENDING — direct Sales UI trigger`: the FE action that invokes
  `ReceiptOrderProductLine._get_as_sale_line()` without Shipment is not
  evidenced in FE or E2E; blocks `J-06` only (`PENDING-001`).
- `PENDING — maximum capacity/SLA`: no approved line/batch limits or latency
  thresholds; blocks only the capacity performance row (`PENDING-002`).
- `PENDING — guest E2E fixture`: no guest credential/role in `config/auth.config.ts`
  (`PENDING-003`).
- `PENDING — TAX-058 POM ownership`: which existing Shipment POM family owns the
  Create-Sales journey (`PENDING-004`).
- `PENDING — ldx_credit verification`: addon cited by the test plan is absent
  from the current BE tree (`PENDING-005`).
- `PENDING — Service dialog hook landing`: hooks exist in the contract but their
  host component (shared `v2source` modal vs Customer Order-local wrapper) needs
  FE confirmation (`PENDING-006`).

## 2. Scope and Contract Principles

- In scope: line-level `税区分` on `INV-100-002` / `INV-100-003`; default
  resolution (explicit → Product `rate_of_tax_id` → `default_tax_sale` → null);
  manual select/clear; `全行に適用` tax controls; nonstored `税額` /
  `受注金額（税込）`; all currencies; batch Tax Classification + Shipment Address;
  copy snapshot preservation; snapshot propagation to direct and
  Shipment-originated Sales; Shipment tax neutrality; stable `data-test`
  contracts; the six E2E journeys.
- Out of scope (design non-goals, kept out of every table below): Tax
  Master/Product Master redesign, mandatory default tax, rate/name snapshots,
  stored totals or per-rate UI, legacy backfill, Customer Order closing guard,
  tax on Shipment, ACL/lifecycle redesign, rewriting already-created Sales.
- Selector policy: `data-test` only for dynamic/business-critical elements;
  Playwright `testIdAttribute: 'data-test'` (`playwright.config.ts:48`).
  Translated labels, Tax/Product text, generated IDs, CSS classes, DOM position,
  and `nth()` are forbidden as identity (`DEC-16`). Repeated rows are addressed
  by a row root plus stable key (`data-line-key`, `data-product-template-id`,
  `data-product-id`, `data-tax-id`, `data-source-row`, `data-column`), never by
  index alone.
- Ownership rule: FE exposes selectors/semantics; BE exposes data/error/state
  contracts; E2E consumes both through POMs and authenticated API reads.
- Evidence rule: a hook may be called `Existing` only with current-repo
  `file:line` proof. Unstable current selectors are reported as
  `Existing — unstable` inside the replacing row, with a migration note.

## 3. E2E Journey and Page Map

| Journey ID | Test-plan IDs | Actor / Data | Ordered pages and routes | Business outcome | Status |
|---|---|---|---|---|---|
| `J-01` Mixed-rate register/reload/lock | `TAX-054` | Authorized Customer Order editor; four lines: 10% net 10,000; 8% net 5,000; ordinary 0% net 10,000; explicit clear (null) net 10,000 | 1. `P1` Registration `/in-season-management/sales-linkage-for-wholesale-sales/customer-order-registration`<br>2. `P3` List (post-save nav)<br>3. `P2` Detail `/…/customer-order-detail?id=`<br>4. Authenticated API read `receipt.order.product.line` | Live tax-exclusive 35,000 / `税額` 1,400 / `受注金額（税込）` 36,400; persisted IDs exact (10/8/0 + false for null); authoritative totals on reload; tax locks with price fields after confirm | Proposed |
| `J-02` Apply-to-All scope + override + independence | `TAX-055` | Authorized editor; editable order, 2 product groups, ≥3 stable line keys in Group A | 1. `P2` Detail (editable)<br>2. `P4` Apply-to-All dialog (Group A)<br>3. `P2` line edit + new line<br>4. Save/reload + API read | Unchecked → no change; checked 8% → selected rows only; no selection + explicit clear → all active Group A rows null; Group B untouched; later manual override wins; new row uses current Product/default | Proposed |
| `J-03` Copy snapshot preservation | `TAX-056` | Authorized editor; source with manual 8% override ≠ Product/default, null, ordinary 0%, and a line whose tax is then archived; Product/default changed after save | 1. `P2` Detail (source)<br>2. `P1` Registration `?copyFromId=`<br>3. `P3` List<br>4. `P2` Detail (copy) + API read | Copied lines retain source IDs/null (incl. archived, rendered but not selectable); post-copy new line uses new current defaults | Proposed |
| `J-04` Batch blank-vs-absent | `TAX-057` | Authorized editor; new-pattern workbook (row 1: Japanese 8% + Shipment Address 2; row 2: present blank tax + blank address); old-pattern workbook omitting both columns; Product A tax changed between runs | 1. `P7` Batch register `/…/customer-order-batch-register` (+ setting page)<br>2. API reads of created/updated orders | Row 1 stores 8%/address 2; row 2 blank resolves Product A (10%)/address 1; present-blank update after default change re-resolves to ordinary 0%; absent old-pattern columns preserve existing snapshots | Proposed |
| `J-05` CO → Shipment → Sales propagation | `TAX-058` | Authorized editor; CO with 10% Product line, null Product line (Product has nonempty standard `taxes_id`), duplicate Service lines with distinct snapshots | 1. `P2` Detail → Create Shipment<br>2. `P8` Shipment register/confirm (existing Shipment POM)<br>3. Authenticated API: normal + `purpose:'sales_registration'` preview<br>4. `P9` Sales Registration Edit `/inventory-control/shipment-process/sales-registration-edit` → Create Sales<br>5. API read `sale.order.line` | Shipment persists no `tax_id`; normal preview tax-neutral; purpose preview carries source `tax_id`/null; Sales lines match the expected Tax-ID multiset incl. null as explicit empty relation | Proposed |
| `J-06` Direct Sales, foreign currency | `PENDING` direct-Sales row (design AC 14, 24) | Service-only 2-decimal foreign-currency CO; one explicit tax + one null line | `PENDING-001`: trigger action, source state, hook, and navigation are unidentified | Sales keeps CO currency; line tax relations exactly source ID/null; no Product/default or JPY fallback | **PENDING** |

Page inventory (all `Existing` as routes/surfaces; new elements are `Proposed`
inside them):

| Page | Route / host | Evidence | Role in journeys |
| --- | --- | --- | --- |
| `P1` Customer Order Registration `INV-100-003` | `/in-season-management/sales-linkage-for-wholesale-sales/customer-order-registration` | `src/pages/…/customer-order-registration.tsx` → shared view `CustomerOrderRegistration/` | `J-01`, `J-03` |
| `P2` Customer Order Detail `INV-100-002` | `/…/customer-order-detail?id=` | same shared view (`InitialDataFetcher.tsx:35` distinguishes `id` vs `copyFromId`) | `J-01`–`J-03`, `J-05` |
| `P3` Customer Order List | `/…/customer-order-list` | `src/pages/…/customer-order-list.tsx` | post-save navigation; detail opened by ID |
| `P4` Apply-to-All dialog (`全行に適用`) | modal in `P1`/`P2`, per product group | `components/partials/ProductLineInputModalEditor.tsx` (no `data-test` today) | `J-02` |
| `P5` Product/SKU search dialog | modal in `P1`/`P2` | `components/partials/ProductSearch/` (`product_search_modal`, `productSearchHooks.tsx:112`) | `J-01` line construction (stable hooks) |
| `P6` Service search dialog | modal in `P1`/`P2` | active path `components/productTemplateTable.tsx` → `src/v2source/components/Modules/ServiceProductSelectorModal/` (test-plan corrected; colocated `SearchServices/ServiceSearchModal.tsx` has no caller) | `J-01`, `J-05` service lines (`PENDING-006` landing) |
| `P7` Customer Order Batch Register | `/…/customer-order-batch-register` (+ `-setting`) | `CustomerOrderBatchRegister/` + shared `BatchRegistration/BatchRegistrationPage/` | `J-04` |
| `P8` Shipment registration/detail | Shipment POM family A (`shipment-registration.ts`, `shipment-slip-detail.ts`) | `pages/inventory-control/shipment-process/` | `J-05` |
| `P9` Sales Registration Edit | `/inventory-control/shipment-process/sales-registration-edit` | `SalesRegistrationEdit/` feature subtree | `J-05` |

## 4. FE ↔ E2E Element Contract

All hooks are constant `data-test` values from the design's approved stable
contract (`DEC-16`). Prefix `customer_order_` for Customer Order surfaces. Rows
are grouped by page area. "Unstable analog" = selector that exists today but
violates the selector policy and is replaced by this contract.

### 4.1 Customer Order line table (`P1`/`P2`)

| Contract ID | Element and purpose | Role / label | Locator / `data-test` | Status | POM method or assertion | Linked IDs |
|---|---|---|---|---|---|---|
| `FE-CO-EL-01` | Product group root; scoping anchor for per-group Apply-to-All | group / n-a | `customer_order_product_group` + `data-product-template-id` | Proposed (today groups are keyed by rendered product text, e.g. `product-list[${code}]${name}`, `productLinesTable.tsx:869`) | `expandProductGroup(templateId)`, scope anchor for `FE-CO-EL-14` | PRD §2.1–2.2, §3.2; AC 13, 22; TAX-029/030/036/055 |
| `FE-CO-EL-02` | Customer Order line root; stable row identity (persisted ID or client UUID) | row / n-a | `customer_order_line` + `data-line-key` (optional `data-product-id`) | Proposed (table uses `rowKey="rowIndex"`, `productLinesTable.tsx:975` — unstable analog) | `expectLineExists(lineKey)`, scoping for all child hooks | AC 22; TAX-036, TAX-054/055 |
| `FE-CO-EL-03` | Row selection checkbox for Apply-to-All targeting | checkbox / n-a | `customer_order_line_select` (scoped under line root) | Proposed (selection state keyed by `rowIndex`, `:976`) | `selectLines([lineKey…])`, `clearLineSelection()` | PRD §3.2; AC 13; TAX-029/055 |
| `FE-CO-EL-04` | Row Tax Classification `税区分` control, editable and read-only | combobox / `税区分` (Tax Classification) | `customer_order_line_tax_classification` + `data-tax-id` (empty attr for null) | Proposed (no tax column today; insert between `price_cut` `:484-523` and `order_unit_price` `:525-550`) | `selectLineTax(lineKey, taxId)`, `clearLineTax(lineKey)`, `expectLineTaxId(lineKey, id\|null)` | PRD §2.1–2.2, §3.1; AC 1, 2, 22; TAX-011/035/036/054/055/056 |
| `FE-CO-EL-05` | Tax dropdown option (repeated) | option / tax display name | `customer_order_tax_option` + `data-tax-id` | Proposed (`AccountTaxSelector` exposes no option hook; callers pass `data-test` through `{...props}`, `AccountTaxSelector.tsx:119`) | `selectTaxOption(taxId)` — never by rendered name | AC 22; TAX-036/037 |
| `FE-CO-EL-06` | Row-level tax validation error affordance | alert / field error | `customer_order_line_tax_error` (scoped under line root) | Proposed | `expectLineTaxError(lineKey)` | AC 20; TAX-007 |

### 4.2 Search dialogs (`P5`/`P6`)

| Contract ID | Element and purpose | Locator / `data-test` | Status | POM method or assertion | Linked IDs |
|---|---|---|---|---|---|
| `FE-CO-EL-07` | Product search dialog root | `customer_order_product_search_dialog` | Proposed (existing analog `product_search_modal`, `productSearchHooks.tsx:112`) | `openProductSearch()` | AC 22; TAX-033/036 |
| `FE-CO-EL-08` | Product-template result row | `customer_order_product_search_row` + `data-product-template-id` | Proposed (current rows matched by `tbody tr` text filter) | `selectProductTemplate(templateId)` | TAX-033/036 |
| `FE-CO-EL-09` | SKU result row | `customer_order_sku_search_row` + `data-product-id` | Proposed | `selectSku(productId)` | TAX-033/036 |
| `FE-CO-EL-10` | Product/SKU select action | `customer_order_product_select` (scoped under result row) | Proposed (unstable analog `btn_select${productText}`, `productSearchHooks.tsx:211`) | `selectProductResult(templateId\|productId)` | TAX-033/036 |
| `FE-CO-EL-11` | Service search dialog root | `customer_order_service_search_dialog` | Proposed — landing host `PENDING-006` (active path is shared `v2source` `ServiceProductSelectorModal`; colocated modal has no caller; `ServiceSearchModal.tsx` uses `data-cy` only) | `openServiceSearch()` | AC 22; TAX-033 |
| `FE-CO-EL-12` | Service result row | `customer_order_service_search_row` + `data-product-id` | Proposed (same `PENDING-006` note) | `selectServiceRow(productId)` | TAX-033/036 |
| `FE-CO-EL-13` | Service select action | `customer_order_service_select` (scoped under service row) | Proposed (same `PENDING-006` note) | `selectService(productId)` | TAX-033/036 |

### 4.3 Apply-to-All dialog, summary, actions (`P1`/`P2`)

| Contract ID | Element and purpose | Role / label | Locator / `data-test` | Status | POM method or assertion | Linked IDs |
|---|---|---|---|---|---|---|
| `FE-CO-EL-14` | Apply-to-All opener per product group | button / `全行に適用` (Apply to All Rows) | `customer_order_apply_all_open` (scoped under `customer_order_product_group`) | Proposed (unstable analog `apply-to-all-rows-button[${code}]${name}`, `productLinesTable.tsx:906` — product-text-keyed) | `openApplyAll(templateId)` | PRD §3.2; AC 13, 22; TAX-029/030/055 |
| `FE-CO-EL-15` | Apply-to-All dialog root | dialog / n-a | `customer_order_apply_all_dialog` + `data-product-template-id` | Proposed (modal has zero `data-test` today, `ProductLineInputModalEditor.tsx`) | scope anchor for `EL-16..18` | AC 22; TAX-036/055 |
| `FE-CO-EL-16` | Tax Classification checkbox | checkbox / `税区分` | `customer_order_apply_all_tax_checkbox` | Proposed | `checkApplyAllTax(bool)` | PRD §3.2; AC 13; TAX-031/055 |
| `FE-CO-EL-17` | Apply-to-All tax selector (blank = explicit clear when checked) | combobox / `税区分` | `customer_order_apply_all_tax_select` + `data-tax-id` | Proposed | `applyAllSelectTax(taxId)`, `applyAllClearTax()` | TAX-031/055 |
| `FE-CO-EL-18` | Apply-to-All submit | button / `適用` | `customer_order_apply_all_submit` | Proposed | `submitApplyAll()` | TAX-029–032/055 |
| `FE-CO-EL-19` | Tax Amount summary `税額` | text / `税額` | `customer_order_tax_amount` — always present after load; numeric rendered text | Proposed (added to `OrderPrice.tsx` beside `total_customer_order_unit_price` `:119`) | `expectTaxAmount(value)` | PRD §3.3; AC 9, 22; TAX-028/054 |
| `FE-CO-EL-20` | Amount Including Tax summary `受注金額（税込）` | text / `受注金額（税込）` | `customer_order_amount_including_tax` — always present after load | Proposed | `expectAmountIncludingTax(value)` | AC 9, 22; TAX-028/054 |
| `FE-CO-EL-21` | Register New by Copying | button / `複製して新規登録` | `register_new_by_copying_button` | **Existing** — `CustomerOrderRegistration.tsx:306` | `openCopy()` | DEC-17; TAX-056 |
| `FE-CO-EL-22` | Register action | button / `登録` | `customer_order_register_button` | Proposed (unstable analog: `button[data-test="confirm-btn"]` filtered by `hasText 'Register'`, POM `customer-order-registration.ts:120-122`; duplicate `confirm-btn` documented `:114-125`, FE `buttonActions.tsx:154-167`) | `register()` | AC 22; TAX-054 |
| `FE-CO-EL-23` | Update action | button / `更新` | `customer_order_update_button` | Proposed (replaces second ambiguous `confirm-btn` on detail) | `update()` | AC 22; TAX-055/057 |
| `FE-CO-EL-24` | Confirm action | button / `確認` | `customer_order_confirm_button` | Proposed (replaces label-filtered `confirm-btn`) | `confirm()` | AC 22; TAX-054 |
| `FE-CO-EL-25` | Create Shipment action | button / `出荷手配` (Create Shipment) | `customer_order_create_shipment_button` | Proposed (`ModalCreateShipment.tsx` exists, no hook; Shipment payload carries no Customer Order tax) | `createShipment()` → capture shipment ID from response/API | AC 15; TAX-058 |

### 4.4 Batch (`P7`)

| Contract ID | Element and purpose | Locator / `data-test` | Status | POM method or assertion | Linked IDs |
|---|---|---|---|---|---|
| `FE-CO-EL-26` | Batch upload input | `customer_order_batch_upload_input` | Proposed (generic shared hooks exist: `upload_input`/`upload_button`, `BatchButtonGroups.tsx:315/325`; may wrap/reference them) | `uploadBatchWorkbook(file)` | PRD §3.4; AC 18, 22; TAX-057/061 |
| `FE-CO-EL-27` | Batch submit | `customer_order_batch_submit` | Proposed (generic `batch_registration_button` `:359`) | `submitBatch()` | TAX-057/061 |
| `FE-CO-EL-28` | Batch error row | `customer_order_batch_error_row` + `data-source-row` = decimal string of backend 1-based `error.row` (spreadsheet data-record ordinal, excluding header) | Proposed (`ReadResultTable.tsx` has no `data-test`; internal `__rowIndex` not exposed; errors matched via `values.recordErrors` `f.row === rowIndex + 1` `:86-88,169-174`) | `expectBatchErrorRow(sourceRow)` | AC 18, 22; TAX-046/047/061 |
| `FE-CO-EL-29` | Batch error field cell | `customer_order_batch_error_field` + `data-column="tax_classification"` \| `"shipment_address"` | Proposed | `expectBatchErrorField(sourceRow, column)` | TAX-046/047/061 |

### 4.5 Shipment / Sales (`P8`/`P9`)

| Contract ID | Element and purpose | Locator / `data-test` | Status | POM method or assertion | Linked IDs |
|---|---|---|---|---|---|
| `FE-SH-EL-30` | Shipment Create Sales action | `shipment_create_sales_button` | Proposed (unstable analog: `#btn_shipment_submit_actions` + `getByText('Create Sales Slip')`, `shipment-registration.ts:1199-1202,1343-1348` — CSS ID + English text; FE owner per design: `ShipmentInstructionActRegistrationCreate/components/customFormComponents.tsx`) | `createSales()` | AC 16, 22; TAX-058/062 |
| `FE-SA-EL-31` | Sales Registration line root | `sales_registration_line` + `data-line-key` | Proposed (lines addressed by Formik `order_line.${rowIndex}` today) | scope anchor for `EL-32` | AC 22; TAX-062 |
| `FE-SA-EL-32` | Sales line Tax Classification | `sales_line_tax_classification` + `data-tax-id` (empty for null), scoped under `sales_registration_line` | Proposed (existing control `sales-registration-edit-product-table-select-tax-classification`, `ProductTable.tsx:611` — keep for compatibility; add the scoped row-addressable hook) | `expectSalesLineTax(lineKey, id\|null)` | AC 16, 22; TAX-038/062 |

## 5. E2E Page Object Model Contract

| POM ID | Page Object / Component | Route | Required methods (new unless marked) | Consumed contract IDs | Fixture/data needs | Status |
|---|---|---|---|---|---|---|
| `POM-01` | `CustomerOrderRegistrationPage` — **extend** `pages/in-season-management/sales-linkage-for-wholesale-sales/customer-order-registration.ts` (class `:67`, aggregate `receipt.order`) | `P1`/`P2` | Existing: `gotoCustomerOrderRegistration`, `gotoCustomerOrderDetail`, `selectCustomer`, `addProductLine`, `addSkusForProduct` (harden to `FE-CO-EL-07..10`), `createCustomerOrder`, `confirmAndReserve`, `cancelCustomerOrder`, `expectStatus`. New: `selectLineTax`, `clearLineTax`, `expectLineTaxId`, `selectLines`, `applyAllTax`, `expectTaxAmount`, `expectAmountIncludingTax`, `openCopy`, `update`, `confirm` (unique hooks), `createShipment`; migrate `register/confirm` off `confirm-btn`+label to `FE-CO-EL-22/24`; replace `product_code-${i}`-style index selectors (`:314-328`) with `data-line-key` scoping in touched journeys | `FE-CO-EL-01..06, 14..25` | Products A–F tax matrix, currencies, rounding modes, archived tax, actors per test plan §2 | Proposed (POM exists; all tax methods new) |
| `POM-02` | Customer Order batch POM — thin wrapper over `utils/batchRegistrationHelper.ts` (`performBatchRegistration` `:534`, `uploadBatchFileVersion2` `:196`) + `utils/excelHelper.ts::writeExcelFile` | `P7` | `uploadBatchWorkbook`, `submitBatch`, `expectBatchErrorRow(sourceRow)`, `expectBatchErrorField(sourceRow, column)`; generate new-pattern and old-pattern workbooks | `FE-CO-EL-26..29` | new-pattern template with `Tax Classification` + `Shipment Address`; saved old pattern omitting both; Japanese `消費税 8%` names | Proposed |
| `POM-03` | Shipment POM family — reuse existing (ownership `PENDING-004`; recommendation: family A `ShipmentRegistrationPage` because Create Sales + register/confirm live there, `shipment-registration.ts:1304,1343`) | `P8` | Existing: `executeAction('Register Shipment')`, `saveOrUpdate`, confirm via `[data-test="shipment-confirmation-button"]`. New: `createSales()` on `FE-SH-EL-30` (replace text-matched dropdown item); keep `#btn_shipment_submit_actions` only as the opener | `FE-SH-EL-30` | Customer Order-generated shipment; duplicate Service lines; partial/split | Proposed (method new; POM Existing) |
| `POM-04` | Sales Registration assertions — extend or wrap `SalesSlipRegistrationPage` (`sales-slip-registration.ts:25`) / SalesRegistrationEdit surface | `P9` | `expectSalesLineTax(lineKey, id\|null)`; summary assertions reuse the existing pattern (`sales_amount_tax_excluded` / `consumption_tax` / `sales_amount_tax_included`, `sales-slip-registration.ts:237-243`) | `FE-SA-EL-31/32` | sale.order.line API reads | Proposed |
| `POM-05` | Authenticated API reads — reuse `utils/apiHelper.ts::ApiHelper` (`makeRequest` `:141`, per-user Bearer from auth files) | n/a | Existing pattern: `receipt.order.product.line` / `sale.order.line` / `stock.move.line` `search_read` with exact tax assertions (multiset for `J-05`) | n/a | role storageStates from `beforeAllHandler` | Existing |

E2E execution prerequisites (from test plan, binding): serial mode
(`test.describe.configure({ mode: 'serial' })`) + `--workers 1`; if the suite
lives outside `tests/scenario/inventory-list`, add a one-worker module to
`test-modules.json` via the serialized `batch-parallel-coordinator` (current
`inventory-list` module is already 1-worker; the `all` module excludes it at 5
workers).

## 6. BE ↔ FE/E2E Data and API Contract

Field names stay `snake_case`. Reused routes are `Existing` only where current
repo evidence confirms them.

| Contract ID | Direction | Endpoint / model / action | Request or input | Response / persisted output | Default / nullable / error behavior | Status | Linked tests |
|---|---|---|---|---|---|---|---|
| `BC-01` | BE store | `receipt.order.product.line.tax_id` (new column, `receipt_order_product_line.py`; model `:35-38`) | n/a | `Many2one(account.tax)`, nullable, `ondelete=restrict`; archive stays referentially valid | no backfill; legacy lines null | Proposed (no tax field in file today) | TAX-043/044 |
| `BC-02` | FE → BE | `receipt.order.product.line` create/write intent | `tax_id` omitted → automatic create / preserve update; `tax_id: integer` → explicit; `tax_id: false` → explicit clear | resolver: eligible Product `rate_of_tax_id` → eligible `default_tax_sale` (newest `write_date`, `limit=1`) → null; explicit invalid ID (nonexistent / other company / archived / `is_tax_free` / unsupported `amount_type`) → field validation error, no fallback; same-value archived ID idempotent | eligible = active, ordinary, `percent`/`fixed`, company-context; automatic failure never rejects save | Proposed (resolver scope: Customer Order-scoped, do not alter `product_master.py::get_sales_tax()` `:6915-6924` globally) | TAX-001–008, 043, 053 |
| `BC-03` | FE → BE | copy-only request metadata (stripped before ORM) | `copy_from_receipt_order_id: integer`; per untouched line `copied_from_line_id: integer`, `tax_id` omitted | server rereads source snapshot in save transaction; verifies read access, source-order ownership, Product identity | missing/inaccessible/mismatched source → reject copy atomically, never fallback | Proposed (both keys absent tree-wide) | TAX-010, 045 |
| `BC-04` | BE → FE | `receipt.order` read: derived totals (`receipt_order.py` `_compute_total` `:207-218`) | n/a (nonstored compute) | `total_order_unit_price` (Existing) + `tax_amount`, `amount_including_tax` (new) | group by `tax_id`, one Sales-round per group at `use_currency.decimal_places`; null lines in tax-exclusive total, tax 0, no fallback group; not persisted | Proposed (zero `tax` occurrences in `receipt_order.py` today) | TAX-014–027, 043 |
| `BC-05` | BE → FE | `receipt.order.product.line` read | n/a | `tax_id: [integer, display_name] \| false` incl. archived reference | null and ordinary 0% stay distinct | Proposed | TAX-043, 059 |
| `BC-06` | FE → BE | referenced-tax read: existing `account.tax` `search_read` | `context: active_test = false`; `domain: id in saved line tax IDs`; `fields: id, name, active, is_tax_free, amount_type, amount` | metadata for saved-value display/calc only; archived never enters choices | display/calc merge only | Proposed (route Existing; `account.tax` fields `default_tax_sale`/`is_tax_free`/`is_reduce` Existing `account_tax.py:22-38`) | TAX-034, 059 |
| `BC-07` | Batch → BE | `RECIPT_ORDER_MAIN_CONFIG` (`batch_config_receipt_order.py:3-300`) + `ReceiptOrder.batch_create()` (`receipt_order.py:716`) | optional `Tax Classification` column; normalized child metadata `tax_classification_supplied: boolean`, `tax_id: integer\|false\|omitted` (request-only, stripped) | supplied+nonblank → validate/write ID; supplied+blank → re-resolve Product→default→null and write result; absent → automatic create / preserve update | invalid/archived/tax-free/other-company → canonical `tax_classification` field error with backend 1-based `error.row`; prefetch Products/Taxes (no per-row search) | Proposed (no tax column, no `*_supplied` pattern today; note: a `clear_sentinel` `（空白）` mechanism exists in `batch.py:728-742` but the approved contract is the `*_supplied` metadata) | TAX-012, 046, 048 |
| `BC-08` | Batch → BE | Shipment Address batch mapping | parent metadata `shipment_address_supplied: boolean`; `customer_shipment_address: 'shipment_address_1'\|'shipment_address_2'\|omitted` | labels `Shipment To 1/2` map to 1/2; supplied blank → 1; absent-new → model default; absent-update → preserve | invalid/transposed → canonical `shipment_address` error | Proposed (field itself Existing: `receipt_order.py:113-116`, default `shipment_address_1`) | TAX-013, 047 |
| `BC-09` | BE internal | `ReceiptOrderProductLine._get_as_sale_line()` (Existing `:608`) direct/service → Sales | saved `tax_id` snapshot | exact `tax_id \| null` for **every** currency; null → explicitly empty relation | remove the company-currency-only gate (`:614`) | Proposed change to Existing (currently `product/default` + company-currency gate `:611-631`) | TAX-049, PENDING direct-Sales row |
| `BC-10` | BE internal | `StockMoveLine._get_as_sale_line()` (Existing `:2126`) Shipment → Sales | provenance: `picking_id.order_receipt_slip_id` (`stock_picking.py:632-634`), row `receipt_order_line_id` (`stock_move_line.py:1000-1003`), or validated `receipt_order_line_ids.order_line_id` (`:808-811`; comodel `stock_picking_order_line.py:10-12`) | source `receipt_order_line_id.tax_id \| null`; header/validated provenance without row-level source → integrity error; `order_receipt_slip_no` alone never marks provenance (EC sets it without the ID, `ec_order.py:2106-2109`) | generic rows keep current behavior (today: seeds `tax_classification_03` 0%, `:2135`) | Proposed change to Existing | TAX-039, 052, 058 |
| `BC-11` | FE → BE | `get_shipment_preview_slip_data` (Existing `@api.model` `:7157-7204`) | `args[0].purpose` omitted → current projection; `purpose: 'sales_registration'` → narrowed flat Sales projection (header allowlist `id, delivery_date, move_line_ids`; ignore `group`/`pad_lines`; CO rows: `tax_id`, `tax`, `amount_type`, `tax_amount` from source; generic/EC rows: current tax + normalized `amount_type`/`tax_amount`; omit `consumption_tax`/`amount` and all tax-derived aggregates) | percent `tax_amount` in percentage points (`10`, `8`, `0`); fixed = per-unit amount; null = `tax_id: null, tax: null, amount_type: null, tax_amount: 0` | no `purpose` key exists today (file-wide) | Proposed change to Existing | TAX-038, 051, 058 |
| `BC-12` | BE → FE/report | normal CO-provenance Shipment projection tax neutrality (`get_move_line_ids` base `:7206-7291`; guards on `get_grouped_tax` `:7021-7051`, `_compute_grouped_tax` `:7126-7155`) | validated CO provenance | each row `tax_id/tax: false`, `tax_amount/consumption_tax: 0`, `amount = amount_tax_excluded`; `grouped_tax: []`/`{key: []}`; requested `total_amount = total_amount_tax_excluded`, `total_amount_taxed = 0`, `total_amount_all = total_amount_tax_excluded`, `grouped_tax_json = '[]'` | generic/EC output byte-identical to current; base `get_move_line_ids` lacks a `tax_amount` key (only `ldx_ec` adds it, as rate points) | Proposed change to Existing | TAX-040, 050, 058 |
| `BC-13` | BE internal | `ldx_ec` override seam (`ldx_ec/models/stock_picking.py`): `get_move_line_ids` `:220-381`, `_convert_order_line_to_move_line` `:383-438` (currently drops source identity), `write_necessary_data` `:482-490` (currently writes `tax_id` + `amount_tax_excluded`) | context `customer_order_sales_projection: true` → attach internal `_receipt_order_line_id` to CO Product rows + service pseudo-lines (incl. duplicates) | core validates ownership, overlays tax after the guarded persistence step, strips the internal key; suppress `tax_id` write for validated CO rows in both contexts (retain non-tax writes); initialize `rounding_method` before the physical-move loop (today bound only inside it, `:236-237` — service-only preview breaks) | internal key never persisted or returned | Proposed change to Existing | TAX-051, 052, 058 |
| `BC-14` | BE internal | scoped defect fixes: `payment_method_id = self.use_currency` typo (`receipt_order.py:1152`, forces JPY fallback `:1155-1156`); company-currency tax gates (`BC-09/10`) | n/a | foreign-currency service path keeps CO currency | do not redesign generic Shipment calculation | Proposed fix to Existing | TAX-049; PENDING direct-Sales row |
| `BC-15` | BE internal | `calc_tax_group()` (Existing `invoice_control.py:327-408`) usage wrapper | CO null lines must be isolated before the call, or a narrowly compatible preserve-unset mode added | group rounding per `tax_id`; fixed branch `amount × Σ qty` needs one final group-level Sales round (current fixed branch `:391` is unrounded); unset bucket currently merges into default/0% (`:370-378`, even with `use_default_tax=False` → `tax_classification_03`) | never persist/display a fallback group for null | Proposed change to Existing | TAX-016/022/024, 064/065 |
| `BC-16` | FE → BE | `sale.order.line` tax M2M command transport | source ID → `[[6, 0, [integer]]]`; null → `[[6, 0, []]]` | exact snapshot into Sales | — | **Existing** (FE `useFormActions.ts:131` already emits this shape) | TAX-038, 058 |
| `BC-17` | BE → FE | Tax Master source data + selector domain | `useAccountTaxSearchRead` default domain excludes `is_tax_free = true` (`useAccountTaxSearchRead.tsx:32-34`) | active ordinary taxes incl. 0% and fixed; excludes archived + tax-free | seed data (`ldx_core/data/tax_classification.xml`): active 0%/8%/10% percent + `tax_exemption_0` (tax-free); archived 20%, 10.5 **fixed**, 100%; no `default_tax_sale` seeded (set only in migrations/tests) | **Existing** | TAX-011, 046 |

## 7. Journey-to-Contract Traceability

E2E rows (6/6 mapped):

| Test-plan ID | Journey / page | FE element contracts | BE/API contracts | E2E assertion | Gap / PENDING |
|---|---|---|---|---|---|
| `TAX-054` | `J-01` — `P1`→`P3`→`P2` | `FE-CO-EL-02/04/05`, `19/20`, `22`, `24`; search hooks `07–10` | `BC-01/02/04/05`, `BC-17` | live totals 35,000/1,400/36,400; API `tax_id` exact (10/8/0 + false); reload totals authoritative; post-confirm lock matches price fields | none |
| `TAX-055` | `J-02` — `P2` + `P4` | `FE-CO-EL-01/02/03`, `14–18`, `23` | `BC-02/04` | unchecked no-op; scoped 8%; clear-all-active-in-group; later override; new-line independence; save/reload API verify | none |
| `TAX-056` | `J-03` — `P2`→`P1` | `FE-CO-EL-21` (Existing), `04`, `22` | `BC-03`, `BC-02`, `BC-05/06` | copied snapshots (active override/null/0%/archived) preserved; archived shown not selectable; added line uses new defaults | none |
| `TAX-057` | `J-04` — `P7` | `FE-CO-EL-26–29` | `BC-07/08` | row 1 → 8%/address 2; row 2 blank → 10%/address 1; blank update after default change → 0%; old-pattern absent columns preserve | none |
| `TAX-058` | `J-05` — `P2`→`P8`→`P9` | `FE-CO-EL-25`, `FE-SH-EL-30`, `FE-SA-EL-31/32` | `BC-10/11/12/13`, `BC-16` | Shipment `tax_id` unset pre/post previews; normal preview tax-neutral; purpose preview source tax; Sales multiset of IDs + null; no internal key in any response | `PENDING-004` (POM family ownership) |
| `PENDING` direct-Sales row | `J-06` | trigger hook unidentified | `BC-09`, `BC-14` | foreign-currency service-only Sales keeps CO currency; exact ID/null; no fallback | `PENDING-001` |

Non-E2E rows: the 61 Unit/Integration rows (`TAX-001–053` minus E2E rows, plus
`TAX-059–065` and the capacity `PENDING` row) are consumed by the FE/BE work
packets in § 8 and linked per contract row in § 6; the capacity row additionally
waits on `PENDING-002`, and `TAX-043` step 7 (`ldx_credit`) waits on
`PENDING-005`.

## 8. Owner Work Packets

Dependency order: **BE → FE → E2E**. BE publishes final snake_case
read/write/preview fields and the shared vectors first; FE implements selectors
and fields against them; E2E implements POMs/journeys last.

### BE

1. Persist and resolve: nullable `tax_id` (`BC-01`), write-intent rules +
   Customer Order-scoped resolver (`BC-02`), copy metadata contract (`BC-03`),
   nonstored totals with group rounding (`BC-04/15`, canonical vectors
   `V-01–V-14c`). TDD per design handoff steps 1–3.
2. Batch: extend `RECIPT_ORDER_MAIN_CONFIG` + `batch_create()` with Tax
   Classification and Shipment Address, `*_supplied` metadata, 1-based
   `error.row`, prefetch-based resolution (`BC-07/08`).
3. Propagation: direct/service `_get_as_sale_line()` snapshot for all currencies
   (`BC-09`); `StockMoveLine._get_as_sale_line()` provenance rules + integrity
   error (`BC-10`); `purpose: 'sales_registration'` preview branch with header
   allowlist and flat projection (`BC-11`); tax-neutral normal CO projection +
   grouped-tax guards (`BC-12`); `ldx_ec` context seam, `tax_id`-write
   suppression, rounding-init-before-loop (`BC-13`).
4. Scoped defect fixes only: `payment_method_id` typo, company-currency gates
   (`BC-14`).
5. i18n: wrap every new user-visible error with `_()`; add
   `ldx_core/i18n/ja_JP.po` entries (and `ldx_ec/i18n/ja_JP.po` only if the EC
   module owns an error). Preserve existing keys.
6. Verify dynamic consumers outside the index before editing
   (`ldx_md/order_plan_sku_store.py:1444` reads `total_order_unit_price`
   aggregations — keep tax-exclusive semantics; `_inherit`/`env[...]`/manifest
   scans per design). Tag new tests `test_customer_order_tax`.
7. Resolve `PENDING-005` (ldx_credit) before relying on `TAX-043` step 7.

### FE

1. Contract/state: extend `FormDataContext`, `getNormalizedFormData`
   (`services/utils.ts:121-189`), `InitialDataFetcher` line fields
   (`:62-96`, no tax today) with value + intent/source state; one tax-intent
   initializer across every live line constructor (Product/SKU search,
   `productTemplateTable.tsx`, ranking init, active Service path — see
   `PENDING-006`); copy mapping via `copyFromId` (`:35`) retaining
   `copied_from_line_id`.
2. Selector column: `税区分` between `price_cut` (`:484-523`) and
   `order_unit_price` (`:525-550`) in `productLinesTable.tsx`, reusing
   `AccountTaxSelector` (caller-supplied `data-test`) + separate
   `active_test = false` referenced-tax read; editability follows price-field
   policy; add `FE-CO-EL-01..06` hooks incl. `data-line-key` row identity
   (replacing `rowKey="rowIndex"` dependence for automation — keep functional
   selection behavior unchanged).
3. Apply-to-All + summary: tax checkbox/selector in `ProductLineInputModalEditor`
   (currently zero `data-test`); `税額` / `受注金額（税込）` in `OrderPrice.tsx`
   with local preview parity to shared vectors; hooks `FE-CO-EL-14..20`.
4. Actions: unique register/update/confirm/create-shipment hooks
   (`FE-CO-EL-22..25`); keep `confirm-btn` in place during migration, then
   remove reliance in touched flows.
5. Batch: configurable hooks at shared `BatchRegistrationPage` owners
   (`BatchButtonGroups.tsx`, `ReadResultTable.tsx`) exposing
   `customer_order_batch_*` + `data-source-row` (1-based backend ordinal) +
   `data-column`, without changing unrelated batch pages' DOM contract.
6. Downstream Sales: `ShipmentSlipNoSelector.tsx` sends
   `args[0].purpose = 'sales_registration'` (comment at `:157` documents the
   current default-tax workaround to remove); preserve null through
   `useInitializeSaleOrderForm`/`useFormActions`; branch percent/fixed on
   `amount_type`; add `FE-SA-EL-31/32` alongside the existing
   `sales-registration-edit-product-table-select-tax-classification`.
7. i18n: EN/JA keys for every label/error in `orderReceiptRegistration.json` and
   affected namespaces, using the exact approved terms `税区分`, `税額`,
   `受注金額（税込）`, `全行に適用` (note: EC locale files already contain an
   i18n key literally named `customer_order_amount_including_tax` in the
   `b038_ec_order_received*` namespaces — different namespace, but avoid
   cross-namespace confusion; the EC JA wording `受注金額（税込み）` differs from
   the approved `受注金額（税込）`).
8. Quality gates per repo rules: eslint/prettier on changed files,
   `yarn type-check`, ≥80% coverage on changed files, GitNexus impact before
   editing (local index was stale at design time — refresh requires approval).

### E2E

1. Harden `POM-01` around `FE-CO-EL-*` hooks, `data-line-key` scoping, and
   unique action buttons; retire label-filtered `confirm-btn` and product-text
   selectors in touched journeys.
2. Implement `J-01`/`J-02` (`TAX-054/055`), then `J-03` copy (`TAX-056`), then
   `J-04` batch (`TAX-057`) via `POM-02` + excel helpers.
3. Implement `J-05` (`TAX-058`) once `PENDING-004` is decided; authenticated API
   reads via `POM-05` for preview/multiset assertions; run the full chain
   serially (`--workers 1`); register a one-worker module if outside
   `inventory-list`.
4. `J-06` after `PENDING-001` resolution (FE hook + trigger confirmation).
5. Optional guest UI coverage only if `PENDING-003` fixture is provided; backend
   auth behavior stays at Unit/Integration level.
6. Keep `TC-Auto-IL-032.spec.ts` green as the reservation/lifecycle regression.

## 9. PENDING Decisions and Risks

| ID | Decision needed | Why it matters | Owner | Blocking scope | Resolution |
|---|---|---|---|---|---|
| `PENDING-001` | Identify the exact FE action/state/hook/navigation that invokes direct Customer Order → Sales (`_get_as_sale_line()` without Shipment) | No trigger is evidenced in FE or E2E; the journey cannot be scripted | Product / FE | `J-06`, design AC 14 E2E slice, `TAX-049` UI coverage | Product names the trigger; FE adds a stable hook (e.g. follow the `customer_order_*` prefix); E2E finalizes `J-06` |
| `PENDING-002` | Approved maximum interactive line count, batch row count, measurement environment, latency/query thresholds | The capacity row cannot pass/fail without thresholds; also bounds Apply-to-All/batch performance design | Product | Capacity performance row only (feature design uses representative N=1,000 in `TAX-042`) | Product supplies limits + SLA; QA executes the row |
| `PENDING-003` | Guest-role E2E credential/role fixture | `config/auth.config.ts` has admin/Approval/Write+Approval/Write/Read only — no guest; guest UI coverage is currently impossible | QA / E2E env | Optional guest UI row only | Provision a guest account or drop guest UI coverage (backend covered by `TAX-053`) |
| `PENDING-004` | Which existing Shipment POM family owns `TAX-058` (`J-05`) | Test plan forbids a third Shipment POM; family A (`ShipmentRegistrationPage`) hosts Create Sales + register/confirm; family B (`SalesSlipRegistrationPage`) hosts sales-slip confirm | E2E | `J-05` implementation shape | **Recommendation (non-binding): family A** for Create Sales, with family B reused only for sales-slip assertions |
| `PENDING-005` | `ldx_credit` consumer verification | Design and test plan cite `ldx_credit.models.receipt_order._credit_get_amount()` as a tax-exclusive regression target, but the addon does not exist in the current BE tree (zero hits tree-wide; addon roots list excludes it) | BE | `TAX-043` step 7 only | BE confirms the deployment/branch that carries `ldx_credit`, or the step is re-targeted/dropped for this tree |
| `PENDING-006` | Host component for Service-search dialog hooks | Test-plan evidence corrects the design: the reachable Service path is `productTemplateTable.tsx` → shared `v2source` `ServiceProductSelectorModal` (EC consumers too); the colocated `ServiceSearchModal.tsx` has no caller. Adding `customer_order_service_*` hooks to a shared EC-consumed module has a cross-feature surface | FE | Landing of `FE-CO-EL-11..13`; `TAX-033` step 6 EC regression | FE confirms host (shared module with additive attributes + EC regression run, vs a Customer Order-local wrapper) |

Risks (carried from design §Performance and Rollout, updated with fresh
evidence): FE/BE rounding drift (mitigated by shared vectors `V-01–V-14c`);
null merging into the 0% default group inside `calc_tax_group` (`BC-15` evidence
at `invoice_control.py:370-378`); generic-vs-CO Shipment branch leakage through
the `ldx_ec` override (`BC-12/13`); FE `rowKey="rowIndex"` migration changing
selection behavior if done carelessly; i18n key-name collision noted in § 8 FE-7;
stale-graph limitation — implementation sessions must rerun repository-prescribed
impact analysis before editing.

## 10. Contract Acceptance Criteria

- Every E2E test-plan case maps to a journey and assertion or an explicit
  `PENDING` gap (§ 7: 6/6).
- Every POM interaction has an existing stable locator or a proposed FE-owned
  `data-test` (§ 4: 1 Existing + 31 Proposed, each with evidence).
- Existing selector claims cite FE/E2E evidence (`CustomerOrderRegistration.tsx:306`,
  `buttonActions.tsx:154-167`, `ProductTable.tsx:611`, `useFormActions.ts:131`,
  `productSearchHooks.tsx:112/211`, `productLinesTable.tsx:869/906/975`,
  `BatchButtonGroups.tsx:315/325/359`, `shipment-registration.ts:1199-1202`);
  no selector is invented as existing — unstable analogs are labeled as such.
- Every downstream page needed by the domain flow is included (`P8` Shipment,
  `P9` Sales Registration Edit; Shipment itself carries no tax hooks beyond the
  Create Sales action, per `DEC-09`).
- FE/BE request, response, defaults, nullability, errors, permissions, and state
  guards are explicit (§ 6) — editability follows existing `値引`/`受注単価`
  locks (`DEC-14`); no new ACL; `締め` stays Shipment-owned (`DEC-13`).
- `PENDING` items have owner, reason, and resolution path (§ 9).
- No source repository was modified and no test was executed: FE/BE/E2E were
  read-only throughout; the only artifact written is this contract inside the
  control-plane repository.
