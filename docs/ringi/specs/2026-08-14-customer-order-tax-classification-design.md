# Customer Order Tax Classification + 2026/08/17 Additional Changes — Design Spec

**Date:** 2026-08-14; revised 2026-08-20 (PRD §3.6 additional changes ingested)
**Sync ID:** `r141-7c4e19` — must match the TDD sheet Metadata `ID`; a mismatch means the
sheet or this file is stale.
**TDD Sheet:** spreadsheet `1ypvhoNWqvy81_NuEnQj28F26syOUTEZUqqtc2yjNmK0` — Treacibility
Matrix rows 3–22 are the 1:1 BR/FR mirror of this spec.
**Status:** In progress — Part 1 (`税区分`) decisions remain `USER-APPROVED`; Part 2
(PRD §3.6) carries 7 open Q&A rows in the sheet and 4 `Question` FR rows.
**Approval source:** Approval No. 0141, “Addition of the Item ‘Tax Classification’”, plus
“3.6. Additional changes (2026/8/17)” and the extended Scenario Test list 01–17.
**Target repositories:** FE (`FE_PWD`), BE (`BE_PWD`), E2E (`E2E_PWD`)

## Context

Approval No. 0141 requests line-level Tax Classification on Customer Order Detail
(`INV-100-002`) and Customer Order Registration (`INV-100-003`). The business needs
ordinary 0%, reduced 8%, standard 10%, and future Tax Master rates to coexist on a
single order. The choice must be retained upstream so downstream Sales can use it,
while Shipment remains a logistics boundary and does not own Customer Order tax.

The 2026/08/17 addendum (`PRD §3.6`) extends the same approval with five Customer Order
header items — `納期`, the `納品書備考` rename, `社内メモ`, `前払金額` and a Custom
`出荷住所` — plus three Customer Order List changes and one Batch Registration option, and
it grows the Scenario Test list from 01–10 to 01–17. Those items share the Customer Order
aggregate with the tax work but touch a different seam: what the order hands to the
shipment slip it generates, and how the list names and filters its dates. They are
specified in “Additional Changes (PRD §3.6, 2026/08/17)” below and tracked as `BR-02`–`BR-04`.

The supplied PRD is an English rendering headed “Japanese.” It contains numbered sections
and scenarios but no formal FR/BR identifiers, so this spec keeps the source identifiers
`PRD §1.2`, `PRD §2.x`, `PRD §3.x`, `PRD §3.6.x` and `Scenario 01–17` as traceability
anchors **and** mints the `BR-01`–`BR-05` / `FR-01`–`FR-20` identifiers that the TDD sheet
requires, mapping each one back to its source row. Japanese UI terms from the PRD and the
supplied screenshots are preserved verbatim; English renderings are glosses, never
replacements.

## Evidence and Code-Intelligence Limits

The repositories were resolved from `.env`, validated as Git working trees, and read
under their repository-local rules.

**Part 1 (`税区分`) snapshot — unchanged from the original design:** FE `target/july-2026`
at `531f716`; BE `target/july-2026` at `63ef5dba`; E2E `master` at `16a9055`. At that time
the configured `codebase-memory` projects were unavailable, so every Part 1 finding below
rests on narrow fallback source inspection and Odoo dynamic-relation searches, not a
complete graph blast radius.

**Part 2 (PRD §3.6) snapshot — 2026-08-20, graph available:** the `codebase-memory`
projects are exposed and their indexed HEADs match the checked-out worktrees exactly:

| Project | Repository | Branch | HEAD | Graph |
| --- | --- | --- | --- | --- |
| `ldx-frontend` | `FE_PWD` | `fix/em-4229-galang` | `76f01cd32f` | 34,761 nodes / 101,159 edges — in sync |
| `ldx-backend` | `BE_PWD/ldx_addons` | `development` | `439d483a60` | 34,806 nodes / 237,644 edges — in sync |
| `ldx-e2e` | `E2E_PWD` | `feat/ringi-100` | `2e2e9fd6` | 3,076 nodes / 6,587 edges — in sync |

Residual limits that still apply to every claim in this document:

- The backend graph covers `ldx_addons` only. Odoo field, `_inherit`, `env['model']`,
  comodel, manifest, XML-ID, route, and ACL relationships were resolved by exact-literal
  text search; BE blast radius outside `ldx_addons` is **not** claimed complete.
- Part 1 line numbers were captured on `target/july-2026` and have drifted on
  `development`. Implementation sessions must re-resolve every symbol against the branch
  they actually edit.
- The E2E worktree sits on `feat/ringi-100`, which does **not** contain
  `pages/in-season-management/sales-linkage-for-wholesale-sales/customer-order-registration.ts`.
  That page object exists on `master` (verified with `git ls-tree master`). E2E work must
  branch from the line that owns the Customer Order page object.
- Neither Part 1 nor Part 2 revalidated the FE/BE feature branches that will actually host
  the work (`feat/ringi-141` for FE per the contract document). Revalidate before editing.

## Requirements (PRD / FR / BR)

- **Source PRD:** Approval No. 0141, created 2026-06-17 by Kawakami, plus the
  “3.6. Additional changes (2026/8/17)” addendum and Scenario Tests 01–17.
- **Development classification:** Modification of Existing Function.
- **Screens:** `INV-100-002` Customer Order Detail, `INV-100-003` Customer Order
  Registration, the Customer Order List, and Customer Order Batch Registration Setting.
- **Formal FR/BR IDs:** none in the supplied source. This spec therefore **mints** them and
  keeps them 1:1 with the TDD sheet Treacibility Matrix (see “BR/FR identifiers” below).
  The short forms `BR-01…BR-05` / `FR-01…FR-20` used in this document expand in the sheet
  to `BR-Ringi-141-Customer-Order-Tax-Classification-nn` /
  `FR-Ringi-141-Customer-Order-Tax-Classification-nn`.

| Source trace | Original source wording | Approved interpretation |
| --- | --- | --- |
| `PRD §1.2` | “Because the item ‘Tax Classification’ does not exist, a tax cannot be selected and registered.” | Persist nullable `tax_id` as the `税区分` snapshot on every Customer Order product line. |
| `PRD §1.2` | “Support for tax-exempt and non-taxable transactions (the need for 0%).” | Ordinary active 0% is selectable. Null is also valid but remains distinct from 0%. The special `is_tax_free = true` flow is excluded. |
| `PRD §1.2` | Retain tax classification “at the customer order stage (upstream)” for downstream invoice-system compliance. | Sales receives the saved Customer Order snapshot. Shipment does not persist or own it. |
| `PRD §1.2` | “Support for tax rates that differ by product (such as the reduced tax rate).” | Each line may use a different active ordinary Tax Master record. The list is data-driven, not hard-coded to 10/8/0, and preserves existing percentage/fixed Tax Master semantics. |
| `PRD §2.1–2.2` | Modify `INV-100-002 / INV-100-003`; add Tax Classification to details and Apply to All Rows; add Tax Amount and Customer Order Amount (Including Tax). | Modify both shared Customer Order registration/detail views and their read/write contract. |
| `PRD §3.1`, `Scenario 01` | “Select from the taxes registered in the Tax Classification Master. 10% is displayed by default.” | **Approved override:** do not hard-code 10%. On new-line save: explicit value → Product Master `rate_of_tax_id` → current default Sales Tax → null. Place `税区分` between `値引` and `受注単価`. |
| `PRD §3.2`, `Scenario 07–09` | Add Tax Classification to Apply to All Rows. Unchecked must not modify rows. | Add a checkbox and selector to `全行に適用`. Affect selected rows, or all active rows in the current product group if none are selected. It is not a sticky default for later rows. |
| `PRD §3.3`, `Scenario 02–06` | Calculate Tax Amount and Customer Order Amount (Including Tax); price cut applies before tax. | Use the existing net `order_unit_price` after `値引`, group by `tax_id`, then round tax once per group with current Sales rounding and transaction-currency precision. Show aggregate `税額` and `受注金額（税込）`. |
| `PRD §3.4` | Batch Tax Classification is optional; blank uses the default value “(Product Master or Tax Master).” | A supplied blank cell—for either a new line or an existing-line update—re-resolves Product → default Sales Tax → null. An absent column in an old saved pattern preserves an existing snapshot. Invalid nonblank values are field errors. |
| `PRD §3.4` | Shipment Address is optional; values are “Shipment To 1” / “Shipment To 2”; blank defaults to “Shipment To 1.” | Map to existing `customer_shipment_address` values `shipment_address_1` / `shipment_address_2`. Supplied blank and absent-on-new use address 1; absent-on-update preserves. |
| `PRD §3.4` | New import patterns contain both new items; saved patterns remain unchanged and can be edited manually. | Preserve saved pattern compatibility exactly. |
| `PRD §3.5` | “Registration is not possible after the closing date (no change from the existing specification).” | **Approved correction to match current behavior:** do not add a Customer Order create/write closing guard. `締め` remains enforced in the Shipment flow. |
| `PRD §3.5` | Apply-to-All performance must match current behavior. | One bulk form-state update and one O(n) summary recomputation; no per-row remote call. |
| `PRD §3.5` | “Rounding method: Follows the Contract Master (no change from the existing specification).” | Use latest `res.company.rounding_method_sales`; do not snapshot the method. Apply it to every transaction currency using that currency's precision. |
| `PRD §3.5` | Permissions and archive behavior are unchanged; guest users cannot use the function. | No ACL, route permission, Customer Order lifecycle, or archive redesign. Existing archived tax snapshots remain readable. |
| `Scenario 02` | Qty 2 × 10,000 at 10% → tax 2,000; including tax 22,000. | Preserve when the configured rounding method yields those exact integers. |
| `Scenario 03` | Qty 1 × 10,000 at 8% → tax 800; including tax 10,800. | Preserve. |
| `Scenario 04` | Qty 1 × 10,000 at 0% → tax 0; including tax 10,000. | Preserve ordinary 0% as a real `tax_id`. |
| `Scenario 05` | Mixed 10% and 8%: untaxed 15,000; tax 1,400; including tax 16,400. | Preserve by grouping by `tax_id`. |
| `Scenario 06` | Tentative per-line calculation and floor example; “Please read this in line with the actual specification as appropriate.” | **Approved override:** current Sales calculation wins—rounded line bases, tax grouping, and current `rounding_method_sales`, not unconditional floor. |
| `Scenario 10` | Tax Classification and overall totals must be correctly saved and displayed after reload. | Persist only line `tax_id`; recompute nonstored totals authoritatively on read. |
| `PRD §3.6.1` | Add “Delivery Date” (`納期`) below “Customer Order Date” in the panel. Calendar selection. Not a required field. | New optional date on `receipt.order`, rendered under `order_receipt_date` in `OrderInformation.tsx`. Storage field and shipment propagation are open Q&A-1 / Q&A-2. |
| `PRD §3.6.1` | Item “Delivery Slip Notes”: change the item name of “Remarks” in the panel; on shipment creation reflect it in the shipment slip’s “Delivery Slip Notes” (as per the current specification). | Label-only rename of the existing `receipt.order.remarks` input (`納品書備考`). The reflection already exists: shipment creation writes `remarks` into `stock.picking.delivery_slip_note`. |
| `PRD §3.6.1` | Item “Internal Memo”: insert below “Delivery Slip Notes”. Input, L-DX text standard. Reflect it in “Internal Memo” on the shipment slip. | New persisted text on `receipt.order` (`社内メモ`), propagated into the existing `stock.picking.internal_remarks`. Precedence against the shipment-creation modal is open Q&A-4. |
| `PRD §3.6.1` | Add “Advance Payment Amount” (`前払金額`): “No” by default; “Yes” enables the amount input; reflect the value on the shipment slip. | New persisted `with_advance_payment` / `advance_payment_amount` pair on `receipt.order`, mirroring the existing Shipment Slip Registration control and propagated to the same picking fields. Amount-required rule is open Q&A-5. |
| `PRD §3.6.1` | Shipment Address: “Shipment Address 1” by default; add “Custom”; expand inputs. Required: Recipient Name, Postal Code, Country, Prefecture, Address. Optional: Recipient Name (Phonetic), Building Name, Phone Number. Reflect on the shipment slip. | Add `custom` to `receipt.order.customer_shipment_address` plus eight persisted address fields; validated at Register; mapped onto the picking address payload, which already accepts `custom`. Field naming is open Q&A-3. |
| `PRD §3.6.2 (list)` | Add the “Delivery Date” filter, calendar selection, to the right of Customer Order Confirmation Date. | New filter in `FilterReceiptList.tsx` immediately after the `confirmed_date` column, using the list’s existing `RangePicker` date-filter convention. |
| `PRD §3.6.2 (list)` | Add “Delivery Date” to the table. Standard L-DX date format. Registered data. | New `delivery_date` column in the `order_receipt_list` header dictionaries with `format: 'date'`, and in the Excel `dateFields`. |
| `PRD §3.6.2 (list)` | Rename the table field “Customer Order Due Date” → “Customer Order Date” (`受注納期` → `受注日`). | Relabel the existing `order_receipt_date` column in EN/JA `order_receipt_list.json`. The underlying field does not change. Rename scope beyond the list header is open Q&A-7. |
| `PRD §3.6.2 (batch)` | Add “Delivery Date” to the Customer Order Information Batch Registration options and table. | Add one `parent` field to `RECIPT_ORDER_MAIN_CONFIG` and one sequence to the FE `getDefaultSequences`, which also feeds the sample file. Whether the other §3.6.1 items join batch is open Q&A-6. |
| `Scenario 11` | Delivery Date appears below Order Date, is calendar-enterable, and saves with the order. | Covered by `FR-10`. |
| `Scenario 12` | The former “Remarks” field is named “Delivery Note Remarks”; text saves and transfers to the shipment slip. | Covered by `FR-11`. The English rendering “Delivery Note Remarks” and “Delivery Slip Notes” refer to the same `納品書備考` item; the FE reuses the existing `delivery_slip_notes` resource key. |
| `Scenario 13` | Internal Memo appears below Delivery Note Remarks; text saves and transfers to the shipment slip. | Covered by `FR-12`. |
| `Scenario 14` | Prepayment Amount appears **below Total Gross Profit**; “No” default with the amount field disabled; “Yes” enables it; value transfers to the shipment slip. | Covered by `FR-13`. Scenario 14 fixes the placement in the summary area (`OrderPrice.tsx`), not in the information panel. |
| `Scenario 15` | Custom is selectable for Shipment Address; inputs expand; blank required fields block Register with an error; complete input saves and transfers to the shipment slip. | Covered by `FR-14`. |
| `Scenario 16` | The list table gains Delivery Date, the filter narrows results, and the “Order Delivery Date” header becomes “Order Date”. | Covered by `FR-15`, `FR-16`, `FR-17`. |
| `Scenario 17` | Batch Registration Settings gain Delivery Date in the options, the table, and the sample file. | Covered by `FR-18`. |

### BR/FR identifiers (1:1 with the TDD sheet Treacibility Matrix)

| BR | Business requirement | FR | Screen / Page | Functional requirement | Sheet status |
| --- | --- | --- | --- | --- | --- |
| `BR-01` | A Customer Order can record, calculate and carry a per-line Tax Classification so downstream Sales is invoice-system compliant. | `FR-01` | Customer Order Registration / Detail (`customer-order-registration`, `customer-order-detail`) | `税区分` column between `値引` and `受注単価`, populated from active ordinary Tax Master records and locked with the existing price fields. | Pending |
| | | `FR-02` | – | New-line default resolution: explicit value → Product `rate_of_tax_id` → current `default_tax_sale` → null. No hard-coded 10%. | Pending |
| | | `FR-03` | – | Write intent: omitted-on-create resolves, omitted-on-update preserves, `tax_id: false` clears. Null stays distinct from ordinary 0%. | Pending |
| | | `FR-04` | Customer Order Registration / Detail | `全行に適用` gains a Tax Classification checkbox and selector; unchecked changes nothing; scope is the selected rows or every active row of the current product group. | Pending |
| | | `FR-05` | Customer Order Registration / Detail | Nonstored `税額` and `受注金額（税込）` grouped by `tax_id`, rounded once per group with `rounding_method_sales` at transaction-currency precision, on the net amount after `値引`. | Pending |
| | | `FR-06` | Customer Order Registration (`?copyFromId=`) | Register New by Copying preserves every source line’s snapshot, including null and archived; lines added after the copy resolve current defaults. | Pending |
| | | `FR-07` | Customer Order Batch Registration | Batch accepts optional Tax Classification and Shipment Address columns with supplied-blank versus absent-column semantics. | Pending |
| | | `FR-08` | – | Direct Customer Order → Sales writes the exact snapshot for every currency, without Product/default fallback. | Pending |
| | | `FR-09` | Shipment Slip / Sales Registration | Customer Order-generated Shipment stays tax-neutral; Shipment-originated Sales reads the source snapshot through the `sales_registration` preview purpose. | Pending |
| `BR-02` | The Customer Order screen captures the delivery, note, memo, prepayment and custom-address information the warehouse and the customer need, and hands it to the shipment slip. | `FR-10` | Customer Order Registration / Detail | “Delivery Date” (`納期`) below “Customer Order Date”: optional calendar input, persisted on the order. | Question |
| | | `FR-11` | Customer Order Registration / Detail | The panel’s “Remarks” item is renamed “Delivery Slip Notes” (`納品書備考`); its existing reflection into the shipment slip’s Delivery Slip Note is unchanged. | Pending |
| | | `FR-12` | Customer Order Registration / Detail | “Internal Memo” (`社内メモ`) below Delivery Slip Notes: persisted on the order and written to the shipment slip’s Internal Memo when a shipment is created. | Question |
| | | `FR-13` | Customer Order Registration / Detail | “Advance Payment Amount” (`前払金額`) below Total Gross Profit: No by default with the amount disabled, Yes enables it, and the value reaches the shipment slip. | Question |
| | | `FR-14` | Customer Order Registration / Detail | Shipment Address gains “Custom”, expanding required Recipient Name / Postal Code / Country / Prefecture / Address and optional Phonetic / Building Name / Phone, validated at Register and reflected on the shipment slip. | Pending |
| `BR-03` | The Customer Order List shows and filters delivery dates and names its date columns correctly. | `FR-15` | Customer Order List (`customer-order-list`) | Delivery Date filter, calendar selection, positioned to the right of Customer Order Confirmation Date. | Pending |
| | | `FR-16` | Customer Order List | Delivery Date column in the list table and in the Excel download, in the standard L-DX date format. | Pending |
| | | `FR-17` | Customer Order List | Rename the `order_receipt_date` column header from “Customer Order Due Date” (`受注納期`) to “Customer Order Date” (`受注日`) in EN and JA. | Question |
| `BR-04` | Customer Orders imported in bulk can carry the same delivery date as manually registered ones. | `FR-18` | Customer Order Batch Registration Setting (`customer-order-batch-register-setting`) | Delivery Date added to the batch field options, the batch table, and the generated sample file. | Pending |
| `BR-05` | The change stays automatable and bilingual. | `FR-19` | Customer Order Registration / Detail / List / Batch | Every new or touched automation surface exposes the stable `data-test` contract; no translated text, product text or row index is identity. | Pending |
| | | `FR-20` | – | Every new label, option and error has EN and JA resources, and every Japanese domain term in this spec survives verbatim. | Pending |

### Japanese terms preserved

`税区分`, `税区分マスタ`, `税額`, `受注金額（税込）`, `全行に適用`, `値引`,
`受注単価`, `出荷住所`, `商品マスタ`, `税マスタ`, `消費税`, `締め`, `税率`,
`適格請求書保存方式`, `請求書`, `ゲストユーザー`, `受注登録`, `免税`,
`納期`, `受注日`, `受注納期`, `受注確定日`, `納品書備考`, `社内メモ`, `前払金額`,
`受注伝票`, `出荷伝票`, `得意先`.

Terms introduced by PRD §3.6 and their approved English renderings: `納期` = Delivery Date;
`受注日` = Customer Order Date; `受注納期` = the old (incorrect) Customer Order Due Date
label being replaced; `納品書備考` = Delivery Slip Notes (the PRD’s Scenario 12 wording
“Delivery Note Remarks” denotes the same item); `社内メモ` = Internal Memo; `前払金額` =
Advance Payment Amount (Scenario 14 renders it “Prepayment Amount”). Neither English
rendering replaces the Japanese term in code, resources or downstream planning.

The attached English PRD did not contain full Japanese requirement sentences. These
terms come from the supplied screenshots/context and are not represented as a verbatim
Japanese PRD quotation.

## User-Approved Decision Ledger

| ID | Status | Decision |
| --- | --- | --- |
| `DEC-01` | `USER-APPROVED` | New-line default resolution: explicit UI/import value → Product Master `rate_of_tax_id` → current default Sales Tax → null. No hard-coded 10%. |
| `DEC-02` | `USER-APPROVED` | Default Sales Tax and line tax may be empty. Null is distinct from ordinary 0%, contributes zero tax, and remains null through Sales. |
| `DEC-03` | `USER-APPROVED` | Resolve and persist when the Customer Order line is saved. Later Product/default changes do not mutate saved lines; genuinely new lines use current masters. |
| `DEC-04` | `USER-APPROVED` | Existing update omission preserves the snapshot; explicit ID replaces it; explicit clear is encoded as `tax_id: false` and stores null without fallback. |
| `DEC-05` | `USER-APPROVED` | Snapshot only `tax_id`, not rate/name. Tax rate changes operationally use a new Tax Master record and archive the old one. |
| `DEC-06` | `USER-APPROVED` | Calculate from net after `値引`, group by `tax_id`, and round tax once per group using Sales rounding. Derived totals are not persisted. |
| `DEC-07` | `USER-APPROVED` | Tax applies to all currencies using transaction-currency precision. Rounding still uses current `rounding_method_sales`. |
| `DEC-08` | `USER-APPROVED` | Direct Customer Order → Sales and Shipment → Sales use the saved snapshot. Null never re-resolves downstream. |
| `DEC-09` | `USER-APPROVED` | Customer Order-generated Shipment does not persist/populate or expose tax for the Customer Order flow. Its generic `stock.move.line.tax_id` remains unset; Sales preview/create dereferences Customer Order source identity instead. |
| `DEC-10` | `USER-APPROVED` | `全行に適用` uses existing selected/current-product-group scope and does not affect future lines. |
| `DEC-11` | `USER-APPROVED` | Reuse the existing Tax Master Page/API unchanged. Offer active ordinary taxes; exclude archived and `is_tax_free = true`. |
| `DEC-12` | `USER-APPROVED` | No legacy backfill. Existing Customer Order lines remain null and create null-tax Sales. |
| `DEC-13` | `USER-APPROVED` | Customer Order closing behavior remains unchanged; closing is Shipment-owned. |
| `DEC-14` | `USER-APPROVED` | Tax editability follows existing `値引` / `受注単価` permissions and lifecycle locks. |
| `DEC-15` | `USER-APPROVED` | Architecture A: nullable line `tax_id`; backend-authoritative resolution/calculation; FE live preview; no Shipment tax ownership. |
| `DEC-16` | `USER-APPROVED` | Stable `data-test` hooks are mandatory; automation cannot depend on translated text, Product text, or row index. |
| `DEC-17` | `USER-APPROVED` | Register New by Copying preserves every source line's tax snapshot, including manual override or null. Lines added after copying use current defaults. |
| `DEC-18` | `USER-APPROVED` | In batch update, a present blank Tax Classification cell invokes current Product/default/null resolution; an absent old-pattern column preserves the saved snapshot. |

## Objective

Make `税区分` an explicit, nullable, line-level Customer Order snapshot; calculate
`税額` and `受注金額（税込）` consistently with Sales rounding across currencies; and
propagate the snapshot to Sales without turning Shipment into a fiscal owner.

## Scope

### In scope

- Line-level Tax Classification on `INV-100-002` and `INV-100-003`.
- Product/default/null resolution on Customer Order line creation.
- Manual selection and explicit clear while the line is editable.
- `全行に適用` checkbox/selector with existing target scope.
- Nonstored aggregate `税額` and `受注金額（税込）`.
- All transaction currencies and their configured precision.
- Existing Tax Master and Product Master as default sources.
- Customer Order batch fields Tax Classification and Shipment Address.
- Exact snapshot propagation to direct Sales and Shipment-originated Sales.
- Stable FE `data-test` contracts and representative E2E vertical journeys.
- Copy flow retaining the source tax snapshot.
- PRD §3.6.1 Customer Order header items: `納期`, the `納品書備考` rename, `社内メモ`,
  `前払金額`, and the Custom `出荷住所` with its eight address inputs, including their
  propagation into the generated shipment slip.
- PRD §3.6.2 Customer Order List: `納期` filter and column, and the `受注納期` → `受注日`
  header rename.
- PRD §3.6.2 Batch Registration Setting: `納期` in the options, the batch table, and the
  sample file.

### Non-goals

- No Tax Master Page or Tax Master API redesign.
- No Product Master page redesign; reuse existing `rate_of_tax_id`.
- No mandatory default tax and no hard-coded 10% fallback.
- No Tax Master name/rate snapshot and no stored rounding method.
- No stored tax totals or per-rate summary UI.
- No legacy data backfill.
- No Customer Order closing-date validation; Shipment behavior remains current.
- No tax persistence/control on Customer Order-generated Shipment and no redesign of
  generic or EC Shipment tax behavior.
- No ACL, guest permission, archive, cancellation, reservation, or Customer Order state
  redesign.
- No automatic rewrite of already-created Sales when Customer Order tax changes later.
- No redesign of the Shipment Slip Registration screen, its advance-payment accounting
  flow, or `stock.picking` address handling; the Customer Order only feeds fields that
  already exist there.
- No migration of the unused `receipt.order.delivery_slip_note` column and no change to the
  existing `remarks` → `stock.picking.delivery_slip_note` mapping. `FR-11` is a label change.
- No new batch columns beyond Delivery Date (plus the Part 1 Tax Classification and
  Shipment Address columns) unless Q&A-6 says otherwise.
- No backfill of `納期`, `社内メモ`, `前払金額` or custom-address values onto existing
  Customer Orders or already-created shipment slips.
- No implementation in this control-plane session.

## Current-State Findings

All paths in this section are repository-relative fallback evidence.

### Backend

- `ReceiptOrder` is the real Customer Order aggregate root:
  `ldx_addons/ldx_core/transactions/receipt_order.py:55`. It owns
  `product_line_ids` and current untaxed totals (`:205–218`, `:237`).
- `ReceiptOrderProductLine` is the line entity:
  `ldx_addons/ldx_core/transactions/receipt_order_product_line.py:35`. It currently
  has no tax snapshot. `_compute_total()` (`:573`) rounds `order_unit_price ×
  confirmed_order_qty` using Sales rounding and transaction-currency precision.
- `ReceiptOrderProductLine._get_as_sale_line()` (`:608`) currently re-resolves
  Product/default tax and only does so for company currency (`:613–631`). That loses
  a Customer Order override and violates the approved all-currency rule.
- Product Master exposes `rate_of_tax_id` and `get_sales_tax()` at
  `ldx_addons/ldx_core/product/product_master.py:326` and `:6915`. The existing helper
  already resolves Product tax before `default_tax_sale`.
- Tax configuration extends `account.tax` with `default_tax_sale`, `is_tax_free`, and
  `is_reduce` in `ldx_addons/ldx_core/account/account_tax.py:22–39`. Active ordinary
  0%, 8%, 10%, and a distinct Tax Free record exist in
  `ldx_addons/ldx_core/data/tax_classification.xml`.
- `res.company.rounding_method_sales` and `get_rounding_by_type('sales')` are defined
  in `ldx_addons/ldx_core/base/res_company.py:291` and `:413`.
- `calc_tax_group()` at
  `ldx_addons/ldx_core/utils/account_control/invoice_control.py:327` is the current
  Sales grouping/rounding reference. It defaults unset tax unless isolated; Customer
  Order null lines must not inherit that fallback during aggregate calculation.
- Customer Order Shipment creation begins at `ReceiptOrder.create_shipment()` and
  `_generate_shipment_and_picking_order_line()` in
  `ldx_addons/ldx_core/transactions/receipt_order.py:1038` and `:1069`.
- Shipment move lines already retain the source link
  `stock.move.line.receipt_order_line_id` at
  `ldx_addons/ldx_core/base/stock_move_line.py:1046`. No new tax transit field is
  required.
- Shipment → Sales currently derives Product/default tax in
  `StockMoveLine._get_as_sale_line()` at
  `ldx_addons/ldx_core/base/stock_move_line.py:2187`, despite having the source line
  reference.
- Shipment Sales preview currently derives tax in
  `StockPicking.get_shipment_preview_slip_data()` and `get_move_line_ids()` at
  `ldx_addons/ldx_core/base/stock_picking.py:7275` and `:7323`. The same preview method
  also feeds Shipment documents/screens, so changing `get_move_line_ids()` globally
  would leak Customer Order tax into the Logistics projection.
- Installed `ldx_ec` overrides `StockPicking.get_move_line_ids()` in
  `ldx_addons/ldx_ec/models/stock_picking.py:220`. It appends Customer Order service
  pseudo-lines through `_convert_order_line_to_move_line()` (`:383`) but currently drops
  source `receipt.order.product.line` identity. A source-aware Sales projection must
  therefore cover this override while keeping generic/EC Shipment output current and
  making validated Customer Order Logistics output tax-neutral.
- Customer Order provenance is available on the Shipment header as
  `stock.picking.order_receipt_slip_id` (`stock_picking.py:645`), on each generated
  Product move line as `receipt_order_line_id`, and on partial/waiting flows through
  `stock.picking.receipt_order_line_ids.order_line_id`. `order_receipt_slip_no` is not a
  provenance marker: EC and other external/logistics flows also populate that free-text
  field. In particular, EC sets the number while `order_receipt_slip_id` is false
  (`ldx_addons/ldx_ec/models/ec_order.py:2107–2109` and
  `ldx_addons/ldx_ec/tests/test_ec_order_received.py:447–448`).
- The effective `ldx_ec.get_move_line_ids()` invokes `write_necessary_data()` as part of
  its existing preview behavior and currently writes Product/default `tax_id` onto
  physical `stock.move.line` rows. For a Customer Order-generated Shipment this
  contradicts the approved tax-free Logistics boundary even though it is not the saved
  Customer Order snapshot. The implementation must suppress the `tax_id` write for
  validated Customer Order rows in both normal and Sales-purpose previews, while
  retaining existing non-tax writes and all generic/EC side effects. The same override
  currently initializes `rounding_method` only inside the physical-move loop and then
  reuses it for Customer Order service pseudo-lines, so a service-only preview can fail
  before producing any row.
- In the service-only branch of
  `ReceiptOrder._generate_shipment_and_picking_order_line()`, the current
  `if not currency_id` block mistakenly assigns `payment_method_id = self.use_currency`
  (`receipt_order.py:1158–1163`). It consequently falls back to JPY and blocks the
  approved foreign-currency service path.
- Customer Order batch configuration and normalization are
  `ldx_addons/ldx_core/utils/batches/batch_config_receipt_order.py` and
  `ReceiptOrder.batch_create()` at
  `ldx_addons/ldx_core/transactions/receipt_order.py:723`. Neither currently maps tax;
  the address field already exists as `customer_shipment_address` with default
  `shipment_address_1` (`receipt_order.py:113`).

### Frontend

- Registration and detail routes share the Customer Order Registration view under
  `src/views/MDExecution/SalesLinkageForWholeSales/CustomerOrder/CustomerOrderRegistration/`.
- `services/data.types.ts::FormDataContext`, `services/utils.ts::getNormalizedFormData`,
  and `services/InitialDataFetcher.tsx` currently omit tax from types, writes, and reads.
- `components/productLinesTable.tsx` renders `price_cut` at `:484` and
  `order_unit_price` at `:525`; the new `税区分` column belongs between them.
- Product addition at `productLinesTable.tsx:670` and Product search do not currently
  request or retain `rate_of_tax_id`.
- Lines are also constructed through `components/productTemplateTable.tsx`,
  `services/InitializeFromRankingAnalysis.tsx`, and
  `components/partials/SearchServices/ServiceSearchModal.tsx`; all must use the same
  tax-intent initializer. The colocated `hooks/useFormInitializer.ts` has no live caller;
  `services/InitialDataFetcher.tsx` is the active read/copy initializer.
- `components/partials/ProductLineInputModalEditor.tsx` is the existing
  Apply-to-All editor; it has no tax control.
- `components/OrderPrice.tsx` currently shows untaxed purchase/order/gross-profit
  totals and already uses `roundingMethodUsage: 'sales'`.
- `data/useAccountTaxSearchRead.tsx` and
  `components/Templates/Selector/AccountTaxSelector.tsx` provide the reusable Tax
  selector path. The default hook excludes `is_tax_free = true`.
- `data/useContract.tsx` and `components/Templates/Input/Input.tsx` expose and apply
  `rounding_method_sales`.
- `components/ModalCreateShipment.tsx` sends operational Shipment data without a new
  Customer Order tax field.
- Sales creation from Shipment consumes preview tax in
  `src/views/InventoryControl/ShipmentProcess/SalesRegistrationEdit/components/partials/ShipmentSlipNoSelector.tsx:157`,
  whose current comment explicitly states that Shipment has no tax and therefore uses
  a default. This seam must instead use the source Customer Order snapshot.
- Customer Order batch UI lives under
  `src/views/MDExecution/SalesLinkageForWholeSales/CustomerOrderBatchRegister/` and uses
  the shared batch-registration framework.
- Copy mode is driven by `copyFromId` in `services/InitialDataFetcher.tsx:35–37` and
  strips persisted line identity while constructing new lines (`:186`). It must retain
  the source `tax_id` as an approved copied snapshot.

### E2E

- `pages/in-season-management/sales-linkage-for-wholesale-sales/customer-order-registration.ts`
  identifies the aggregate as `receipt.order`, but its POM currently covers only core
  fields and register/confirm/reserve/cancel. It documents an ambiguous duplicate
  `confirm-btn` and uses Product text/indexed row selectors.
- `tests/scenario/inventory-list/std-case/TC-Auto-IL-032.spec.ts` is the only current
  non-EC Customer Order flow found. It covers register → reserve → cancel, not tax,
  batch, Shipment, or Sales propagation.
- Existing Sales Slip batch fixtures demonstrate per-line Tax Classification, mixed
  8%/10%, and summary selectors under
  `pages/inventory-control/sales-and-billing-process/`.
- The Playwright configuration uses `data-test` as its test-ID attribute. Preview DB
  runs must remain serialized with one worker.

## Domain Model

### Aggregates and entities

- **Aggregate root:** `receipt.order` in the Wholesale Ordering bounded context.
- **Owned entity:** `receipt.order.product.line`. It owns the saved `TaxSelection` for
  the ordered Product/Service line.
- **Reference entities:** `product.product` / Product Master, `account.tax`,
  `res.currency`, and `res.company` supply current defaults or calculation policy but
  do not own the Customer Order snapshot.
- **Downstream entities:** `stock.picking` / `stock.move.line` fulfill logistics;
  `sale.order` / `sale.order.line` own the eventual Sales fiscal line.

### Conceptual value objects

- **TaxSelection:** `tax_id | null`; null and an ordinary 0% Tax Master record are
  unequal values.
- **Ordinary Tax Classification:** `is_tax_free = false` with an existing line-level
  Sales calculation type (`amount_type = 'percent' | 'fixed'`); grouped/division tax
  definitions are not selectable line classifications in this contract.
- **Money:** amount plus transaction currency and currency precision.
- **SalesRoundingPolicy:** current `rounding_method_sales`; evaluated, not snapshotted.
- **TaxGroup:** one `tax_id`, the sum of rounded line bases, and summed quantity; percent
  uses group base while fixed uses group quantity.
- **ShipmentAddress:** existing `shipment_address_1 | shipment_address_2` selection.

### Aggregate invariants

1. A saved Customer Order line retains its `tax_id | null` until an authorized edit or
   exact copy writes another snapshot.
2. Product/Tax defaults resolve only for a genuinely new automatic line; they never
   mutate existing or legacy lines.
3. Null never becomes ordinary 0% or a later default during Customer Order calculation
   or Sales conversion.
4. Header totals are derived deterministically from saved lines, current Sales rounding,
   and transaction-currency precision; they are not persisted.
5. Customer Order-generated Shipment retains only source-line identity, not ownership
   of the Customer Order tax.
6. Direct and Shipment-originated Sales receive the exact source snapshot, for every
   currency.
7. Register New by Copying preserves each source line snapshot; lines manually added
   after copy are new automatic lines and resolve current defaults.

### Bounded-context seams

- **Product Catalog → Wholesale Ordering:** default suggestion only.
- **Tax Configuration → Wholesale Ordering:** selectable record/default and current
  rate; Tax Master UI/API remain unchanged.
- **Contract/Company → Wholesale Ordering:** current Sales rounding policy.
- **Wholesale Ordering → Logistics:** source line reference and fulfillment data only.
- **Wholesale Ordering → Sales:** immutable-at-conversion `tax_id | null` snapshot.
- **Batch Ingestion → Wholesale Ordering:** same application invariant as interactive
  creation; no separate default algorithm.

## DDD Impact — Which `D` Changes

The affected domain behavior (the “D”) is **Customer Order tax assignment and its
faithful propagation into Sales**.

- **Behavior before:** Customer Order lines do not retain tax. Direct Sales and
  Shipment-originated Sales re-resolve Product/default tax, and the direct path skips
  Product/default tax for foreign currency.
- **Behavior after:** every new line resolves or explicitly receives `tax_id | null` at
  save; every existing line retains that snapshot; totals are visible on Customer
  Order; Sales consumes the snapshot; Shipment remains logistics-only.
- **State transitions:** existing Customer Order price-field editability, confirm,
  reserve, cancel, Shipment creation, Sales creation, archive, and `締め` behavior remain
  unchanged. Copy creates new line entities but intentionally carries source tax
  snapshots.
- **Invariants at risk:** null-vs-0, Product/default drift, FE/BE rounding drift,
  cross-currency loss, archived snapshot loss, and accidental fiscal coupling to
  Shipment.
- **Cross-context impact:** Product/Tax/Contract are read sources; Logistics retains a
  reference; Sales conversion changes. Generic Shipment behavior remains unchanged.
- **External consumers outside `ldx_addons`:** not proven complete because the graph was
  unavailable and BE index scope is limited. Implementation must search `_inherit`,
  `env['receipt.order.product.line']`, comodels, routes, ACLs, and module manifests before
  editing.

## Architecture

The approved architecture stores one optional `tax_id` on
`receipt.order.product.line`. The backend owns default resolution, validation,
authoritative derived totals, and downstream propagation. The FE mirrors the numeric
algorithm only to provide immediate unsaved-form feedback. No tax amount, rate/name
snapshot, or rounding method is persisted.

### Persisted fields

```text
receipt.order.product.line.tax_id
  type: Many2one(account.tax) | null
  stored: yes
  deletion policy: restrict; archive remains referentially valid
```

There is no data backfill. Module/schema upgrade adds a nullable column; every legacy
line therefore remains null.

### Derived read fields

```text
receipt.order.total_order_unit_price  existing tax-exclusive amount
receipt.order.tax_amount              new, nonstored
receipt.order.amount_including_tax     new, nonstored
```

No per-rate breakdown is required in the Customer Order response or UI.

### Write semantics

| Operation | `tax_id` intent | Backend behavior |
| --- | --- | --- |
| New automatic line | field omitted | Resolve eligible Product `rate_of_tax_id` → eligible `default_tax_sale` → null. |
| New manual line | positive ID | Validate company/context and ordinary classification; store ID. |
| New explicit clear | `tax_id: false` explicitly | Store null; do not fallback. |
| Existing unchanged line | field omitted | Preserve snapshot, including null or archived reference. |
| Existing manual change | positive ID | Validate and replace snapshot. |
| Existing explicit clear | `tax_id: false` explicitly | Store null; do not fallback. |
| Copied line | source-order/line metadata; `tax_id` omitted | Backend rereads and preserves source ID or null; do not run Product/default resolution. This is distinct from a newly added line after copy. |
| Batch existing-line blank | Tax column present, cell blank | Re-resolve eligible Product → eligible default Sales Tax → null and write the resolved ID/null. |
| Batch existing-line absent | Tax column absent from saved pattern | Preserve snapshot. |

The FE requires a nonpersisted intent marker so displaying an automatic preview does not
turn it into a manual override. Serializers must omit unchanged/automatic values, send a
positive ID for manual selection, and send explicit false for a manual clear. The copy
flow must preserve copied intent separately from automatic-new intent.

Automatic candidates are usable only when they are active, ordinary
(`is_tax_free = false`), use an existing supported `amount_type` (`percent` or `fixed`),
are accessible in the current company context, and are otherwise valid for the existing
Sales selector. An unusable Product candidate is treated as absent and resolution
continues to the default Sales Tax; an unusable/missing default continues to null. If
multiple eligible records carry `default_tax_sale`, retain the current deterministic lookup order
(`write_date desc`, `limit = 1`). Automatic-candidate failure does not reject the save.
By contrast, an invalid explicit user/import ID is a validation error and never silently
falls back.

Copy intent uses this exact request-only contract:

```text
receipt.order create payload:
  copy_from_receipt_order_id: integer | omitted

each untouched copied one2many line value:
  copied_from_line_id: integer
  tax_id: omitted
```

The Customer Order create application layer consumes and strips both metadata fields
before ORM persistence. It verifies read access to the source order/line, that every
source line belongs to `copy_from_receipt_order_id`, and that source/new Product identity
matches. It then reads and writes the source line's current `tax_id | null` in the save
transaction. Missing, inaccessible, or mismatched source metadata rejects the copy; it
does not fallback. If the user changes or clears tax on a copied line before save, FE
omits `copied_from_line_id` for that line and sends the normal explicit ID/false intent.
Thus an archived source snapshot is copied without making arbitrary archived IDs valid
for ordinary creates.

An archived tax already stored on an existing line remains readable and valid for
unrelated writes/downstream use. Official selectors and batch lookup cannot newly
select archived or `is_tax_free = true` records. A copied archived
snapshot is a trusted snapshot-transfer exception and must use the exact server-verified
metadata contract
above rather than relaxing validation for arbitrary direct writes. If an existing-line
payload redundantly sends the exact currently stored archived ID, treat it as idempotent;
a different archived or otherwise ineligible ID remains invalid.

## Calculation Contract

`order_unit_price` is already the unit value after `price_cut`; do not subtract `値引`
twice.

The calculation uses exactly the same `product_line_ids` recordset and per-line net
amounts as existing `receipt.order.total_order_unit_price`; it introduces no independent
state filter. Service lines are included because they are Customer Order product-line
entities. A line removed through the existing one2many lifecycle is absent; any
cancelled/state-specific quantity or amount treatment remains whatever the existing
untaxed total applies.

For each included line:

```text
line_base = sales_round(
  order_unit_price * confirmed_order_qty,
  receipt_order.use_currency.decimal_places
)
```

Then:

1. Add every line base—including null-tax lines—to the tax-exclusive total.
2. Keep null lines outside default-tax resolution; they contribute tax 0.
3. Group non-null lines by `tax_id`, not Tax name/rate/row adjacency.
4. Sum line bases per group and apply current `rounding_method_sales` at transaction-
   currency precision.
5. For `amount_type = 'percent'`, calculate
   `group_base × account.tax.amount / 100`, rounded once per group.
6. For `amount_type = 'fixed'`, preserve the current Sales basis
   `account.tax.amount × Σ line qty` for that Tax ID, without percentage conversion, then
   apply the approved Sales rounding once to that group at transaction-currency
   precision. FE mirrors the same result.
7. `tax_amount = Σ group_tax`.
8. `amount_including_tax = total_order_unit_price + tax_amount`.

`calc_tax_group()` is the reference for Sales grouping/rounding but currently maps an
unset tax through default logic. The Customer Order implementation must either isolate
null lines before calling it or add a narrowly compatible preserve-unset mode. It must
not persist or display a fallback group for null. Its fixed branch supplies the approved
quantity basis but currently returns that product without a final `simple_round`; the
Customer Order wrapper applies the one group-level Sales round required above without
globally changing unrelated consumers.

The FE pure calculation must use identical vectors and rounding semantics:

- `rounding`: half-up.
- `round_up`: away from zero.
- `round_down`: toward zero.
- precision: `receipt.order.use_currency.decimal_places`.

Canonical shared vectors (all amounts are in the transaction currency):

| Vector | Lines / tax | Method / precision | Tax-exclusive | Tax | Including tax |
| --- | --- | --- | ---: | ---: | ---: |
| `V-01` | qty 2 × net unit 10,000; 10% | any / 0 | 20,000 | 2,000 | 22,000 |
| `V-02` | qty 1 × net unit 10,000; 8% | any / 0 | 10,000 | 800 | 10,800 |
| `V-03` | qty 1 × net unit 10,000; ordinary 0% | any / 0 | 10,000 | 0 | 10,000 |
| `V-04` | 10,000 at 10% + 5,000 at 8% | any / 0 | 15,000 | 1,400 | 16,400 |
| `V-05` | qty 1 × net unit 10,000; null | any / 0 | 10,000 | 0 | 10,000 |
| `V-06a` | qty 1 × net unit 999 after `値引`; 10% | `rounding` / 0 | 999 | 100 | 1,099 |
| `V-06b` | same as `V-06a` | `round_up` / 0 | 999 | 100 | 1,099 |
| `V-06c` | same as `V-06a` | `round_down` / 0 | 999 | 99 | 1,098 |
| `V-07` | two lines, each net unit 5, same 10% group | `round_down` / 0 | 10 | 1 | 11 |
| `V-08a` | qty 1 × net unit 10.05; 8% | `rounding` / 2 | 10.05 | 0.80 | 10.85 |
| `V-08b` | same as `V-08a` | `round_up` / 2 | 10.05 | 0.81 | 10.86 |
| `V-08c` | same as `V-08a` | `round_down` / 2 | 10.05 | 0.80 | 10.85 |
| `V-09` | qty 1 × net unit 1.2345; 10% | `rounding` / 3 | 1.235 | 0.124 | 1.359 |
| `V-10a` | qty 1 × net unit -999; 10% | `rounding` / 0 | -999 | -100 | -1,099 |
| `V-10b` | same as `V-10a` | `round_up` / 0 | -999 | -100 | -1,099 |
| `V-10c` | same as `V-10a` | `round_down` / 0 | -999 | -99 | -1,098 |
| `V-11` | qty 1.5 × net unit 100.05; 8% | `rounding` / 2 | 150.08 | 12.01 | 162.09 |
| `V-12` | qty 2 × net unit 100; fixed 3/unit | `rounding` / 2 | 200.00 | 6.00 | 206.00 |
| `V-13` | qty 1.5 × net unit 100.05; fixed 3/unit | `rounding` / 2 | 150.08 | 4.50 | 154.58 |
| `V-14a` | two lines, each qty .75 × net unit 100; same fixed 3.333/unit | `rounding` / 2 | 150.00 | 5.00 | 155.00 |
| `V-14b` | same as `V-14a` | `round_up` / 2 | 150.00 | 5.00 | 155.00 |
| `V-14c` | same as `V-14a` | `round_down` / 2 | 150.00 | 4.99 | 154.99 |

`V-07` distinguishes approved group rounding from per-line tax rounding. `V-05` must
remain persisted/read as null even though its numeric result equals ordinary 0%.
`V-09–V-11` pin configured nonstandard precision, signed rounding direction, and
fractional quantity without relying on binary floating-point expectations. `V-12–V-13`
pin the fixed-tax quantity basis; `V-14a–V-14c` pin its group-rounding behavior. In
`V-14c`, incorrect per-line round-down would produce 4.98 instead of the required 4.99.

A later company rounding change recomputes existing order totals because rounding is
not snapshotted. A later in-place edit of the referenced Tax Master name/rate also
affects the order because only `tax_id` is stored; the approved operational rule is to
create a new tax record and archive the old one instead of editing a used rate.

## FE / BE / E2E Contracts

### Backend (`ldx-backend`)

- Add `tax_id` and authoritative resolver/write validation to
  `ReceiptOrderProductLine` in
  `ldx_addons/ldx_core/transactions/receipt_order_product_line.py`.
- Add nonstored `tax_amount` and `amount_including_tax` on `ReceiptOrder` in
  `ldx_addons/ldx_core/transactions/receipt_order.py`.
- Use one Customer Order-scoped default resolver for interactive, one2many, and batch
  creates. Do not change `product.product.get_sales_tax()` globally because it has
  unrelated consumers.
- Extend `RECIPT_ORDER_MAIN_CONFIG` and `ReceiptOrder.batch_create()` for optional Tax
  Classification and Shipment Address.
- Replace Product/default re-resolution with source snapshot propagation in
  `ReceiptOrderProductLine._get_as_sale_line()` for direct/service conversion.
- In `StockMoveLine._get_as_sale_line()`, use `receipt_order_line_id.tax_id | null` when
  Customer Order provenance exists; retain current generic Shipment behavior otherwise.
  Treat only `picking_id.order_receipt_slip_id`, the row's
  `receipt_order_line_id`, or a validated
  `picking_id.receipt_order_line_ids.order_line_id` relation as Customer Order
  provenance. If the header/validated picking relation identifies Customer Order origin
  but the Product move line has lost its row-level source, raise an integrity error
  instead of falling back. Never infer provenance from `order_receipt_slip_no` alone.
- Keep the normal `StockPicking.get_move_line_ids()` response shape compatible for
  Shipment/report consumers. When validated Customer Order provenance exists, however,
  neutralize Logistics tax values on every Product/service row:
  `tax_id = false`, `tax = false`, `tax_amount = 0`, `consumption_tax = 0`, and
  `amount = amount_tax_excluded`. Also prevent the effective
  `ldx_ec.write_necessary_data()` seam from writing `tax_id`; it may retain the existing
  non-tax `amount_tax_excluded` write. Generic/EC Shipments retain their current values
  and persistence behavior.
  In `get_shipment_preview_slip_data()`, read the opt-in from
  `args[0].purpose = 'sales_registration'` and overlay source tax only in that branch.
  Omitted purpose retains current behavior for generic/EC Shipments; a validated
  Customer Order Shipment uses the tax-neutral Logistics projection above. Its
  `grouped_tax` is `[]` when ungrouped or a group-keyed map of empty lists when grouped;
  `total_amount` equals `total_amount_tax_excluded`; requested
  `total_amount_taxed = 0`, `total_amount_all = total_amount_tax_excluded`, and
  `grouped_tax_json = '[]'`. `_compute_grouped_tax()` and `get_grouped_tax()` must use the
  same Customer Order guard so computed Shipment fields cannot reintroduce Product/
  default tax. The opt-in response uses
  a header allowlist of `id`, `delivery_date`, and `move_line_ids` only; requested extra
  header fields are stripped. It keeps current operational move-line fields. For Customer
  Order provenance it sets source `tax_id`, `tax`, and raw Tax Master `amount_type` /
  `tax_amount`; for a generic/EC Shipment it preserves the tax already chosen by current
  Product/default/EC behavior and normalizes corresponding `amount_type` / raw
  `tax_amount` from that Tax ID. It strips generic tax-derived move-line
  `consumption_tax` / `amount` and therefore cannot return
  `grouped_tax`, `grouped_tax_json`, `total_amount`, `total_amount_taxed`,
  `total_amount_all`, or any other value previously calculated from Product/default tax.
  In this purpose, ignore supplied `group` and `pad_lines` values and always return the
  flat projection; ordinary callers still retain current behavior.
- For the purpose branch only, call the effective (possibly `ldx_ec`-overridden)
  `get_move_line_ids()` with context `customer_order_sales_projection = true`. The
  `ldx_ec` override attaches internal `_receipt_order_line_id` to every Customer Order
  Product row and service pseudo-line, including duplicate Service Products. Core
  validates/dereferences that source and strips the internal key before returning JSON.
  The override attaches provenance only; it does not overlay Customer Order tax before
  its `write_necessary_data()` seam. For validated Customer Order rows it returns the
  tax-neutral Logistics values and skips the `tax_id` update in both normal and purpose
  contexts. Core performs the Sales tax overlay only after the effective method returns,
  so neither the snapshot nor the internal key is persisted. Existing generic/EC tax
  writes and all existing non-tax writes remain unchanged. Initialize the Sales rounding
  method before the physical-move loop so a service-only Customer Order preview is valid.
  Without the context flag, Customer Order output remains tax-neutral and generic/EC
  output remains exactly current.
- Do not add/populate a Customer Order tax field on `stock.picking` or Shipment lines.
  Generic tax-related fields already exist on `stock.move.line`; for a newly generated
  Customer Order Shipment, its generic `tax_id` remains unset before and after normal or
  Sales-purpose preview. This scoped guard does not remove the field or alter its use by
  generic/EC Shipments.
- For Customer Order source branches, remove the existing company-currency-only tax
  gate. Also correct the service-only Customer Order typo that assigns
  `payment_method_id = self.use_currency` instead of `currency_id = self.use_currency`.
  Keep generic Shipment behavior unchanged.

### API/data shapes

Backend field names remain `snake_case`.

```text
receipt.order.product.line read:
  tax_id: [integer, display_name] | false

receipt.order.product.line create/write intent:
  tax_id omitted       -> automatic create / preserve update
  tax_id: integer      -> explicit selection
  tax_id: false        -> explicit clear

receipt.order copy-only metadata (request-only, stripped before ORM):
  copy_from_receipt_order_id: integer
  copied_from_line_id: integer per untouched copied line

normalized batch child-line metadata (request-only, stripped before ORM):
  tax_classification_supplied: boolean
  tax_id: integer | false | omitted

normalized batch parent-order metadata (request-only, stripped before ORM):
  shipment_address_supplied: boolean
  customer_shipment_address: 'shipment_address_1' | 'shipment_address_2' | omitted

  tax supplied + nonblank -> validate and write integer
  tax supplied + blank    -> resolve now and write resolved integer or false
  tax not supplied        -> automatic new-line create / preserve existing-line update

  address supplied + blank  -> write shipment_address_1
  address not supplied/new order -> model default shipment_address_1
  address not supplied/update -> preserve existing address

receipt.order read:
  total_order_unit_price: number
  tax_amount: number
  amount_including_tax: number

referenced Tax read for saved-line rendering/calculation:
  existing account.tax/search_read
  context: active_test = false
  domain: id in saved line tax IDs
  fields: id, name, active, is_tax_free, amount_type, amount
  usage: current-value display/calculation only; never merge archived rows into choices

Sales preview line:
  tax_id: integer | null
  tax: string | null
  amount_type: 'percent' | 'fixed' | null
  tax_amount: number

get_shipment_preview_slip_data request:
  args[0].purpose omitted                -> current generic/EC projection;
                                             tax-neutral Customer Order Logistics projection
  args[0].purpose: 'sales_registration'  -> narrowed flat Sales projection

normal Shipment/report response for validated Customer Order provenance:
  each row tax_id / tax: false
  each row tax_amount / consumption_tax: 0
  each row amount: amount_tax_excluded
  grouped_tax: [] ungrouped | {group_key: []} grouped
  total_amount: total_amount_tax_excluded (same scalar/grouped shape)
  requested total_amount_taxed: 0
  requested total_amount_all: total_amount_tax_excluded
  requested grouped_tax_json: '[]'

sales_registration purpose response:
  header allowlist: id, delivery_date, move_line_ids
  ignore/strip every other requested header field
  ignore group / pad_lines request values; always return flat move_line_ids
  keep current non-tax-derived operational move-line fields
  Customer Order row -> set tax_id / tax / amount_type / tax_amount from source line
  generic/EC row -> preserve current tax ID/name; normalize amount_type/tax_amount by ID
  omit move-line consumption_tax / amount
  omit all generic preview aggregates/computed tax fields

internal BE projection seam (never returned):
  context customer_order_sales_projection: true
  each Customer Order Product/service projection row:
    _receipt_order_line_id: integer
  validate source ownership, overlay tax, then strip _receipt_order_line_id

FE JSON-RPC sale.order.line tax_id command (exact transport shape):
  source tax ID -> [[6, 0, [integer]]]
  source null   -> [[6, 0, []]]

BE Python ORM equivalent after JSON decoding:
  source tax ID -> [(6, 0, [integer])]
  source null   -> [(6, 0, [])]
```

For `amount_type = 'percent'`, Sales-preview `tax_amount` uses percentage points
(`10`, `8`, `0`), not a ratio (`0.10`, `0.08`). For `amount_type = 'fixed'`, it is the
Tax Master fixed amount per unit in the transaction currency. `tax_id` distinguishes
null from ordinary 0%; null preview lines therefore use `tax_id = null`, `tax = null`,
`amount_type = null`, and `tax_amount = 0`.

### Frontend (`ldx-frontend`)

- Extend `FormDataContext`, initializer reads, normalized writes, and copy mapping with
  tax value plus client-only intent/source state.
- Extend Product search fields with `rate_of_tax_id` for immediate automatic preview.
- Reuse `AccountTaxSelector` / `useAccountTaxSearchRead` with active ordinary filtering;
  do not create a Customer Order-specific Tax Master endpoint.
- Separately fetch saved referenced Tax IDs with `active_test = false` and merge them only
  into current-value display/calculation data. Archived records never enter selectable
  options.
- Insert `税区分` between `値引` and `受注単価` in `productLinesTable.tsx`.
- Use the same selector in editable/read-only modes; existing archived snapshots render
  but are absent from new choices.
- Add Tax Classification checkbox/selector to
  `ProductLineInputModalEditor.tsx`. Checked + blank means explicit clear; unchecked
  means no change.
- Update `OrderPrice.tsx` with `税額` and `受注金額（税込）`. Keep existing Customer Order
  amount tax-exclusive and gross profit tax-exclusive.
- Compute an immediate local preview while editing. Preserve the current successful-
  submit navigation to the Customer Order list: generic create returns the order ID and
  generic write returns a boolean. On the next detail open/reload,
  `InitialDataFetcher.tsx` fetches saved line `tax_id` plus backend `tax_amount` and
  `amount_including_tax`, which then become authoritative. If a future flow stays on the
  form after save, it must explicitly refetch rather than assume create/write returned
  those fields.
- Preserve source tax intent in `copyFromId`; new lines added later remain automatic.
- Route every live line-construction path—Product/SKU search,
  `productTemplateTable.tsx`, ranking-analysis initialization, and Service search—through
  one tax-intent initializer. Do not implement the feature only in the currently unused
  `hooks/useFormInitializer.ts`.
- Extend batch UI/config consumption without changing the generic batch framework's
  atomicity or partial-success semantics.
- Update Shipment-to-Sales form mapping so a null preview stays null and does not invoke
  a Product/default fallback. That caller sends
  `args[0].purpose = 'sales_registration'`; normal `useShipmentPreview` and document
  callers omit it. Preserve null through Sales form initialization, local calculation,
  and save serialization; branch percentage/fixed local calculation on `amount_type`,
  and emit the exact empty M2M command defined above.
- Add English and Japanese i18n resources for every new label/error.

### Stable `data-test` contract

Every value is constant; translated labels, Tax names, Product code/name, and positional
row indices are forbidden as identity.

| Element | Required `data-test` | Stable metadata / rule |
| --- | --- | --- |
| Product group root | `customer_order_product_group` | `data-product-template-id`; do not encode code/name in selector. |
| Customer Order line | `customer_order_line` | `data-line-key`: persisted line ID or client UUID; optional `data-product-id`. |
| Row selection | `customer_order_line_select` | Scope beneath the line root. |
| Row Tax Classification | `customer_order_line_tax_classification` | Same hook in editable/read-only state; expose `data-tax-id`, empty for null. |
| Product search dialog | `customer_order_product_search_dialog` | Constant dialog root. |
| Product-template result | `customer_order_product_search_row` | `data-product-template-id`; never locate by Product text. |
| SKU result | `customer_order_sku_search_row` | `data-product-id`; never locate by Product text/index. |
| Product/SKU select action | `customer_order_product_select` | Scope below the corresponding result row. |
| Service search dialog | `customer_order_service_search_dialog` | Constant dialog root. |
| Service result | `customer_order_service_search_row` | Required `data-product-id`; never locate by Service text/index. |
| Service select action | `customer_order_service_select` | Scope below the Service result row. |
| Tax option | `customer_order_tax_option` | Required `data-tax-id`; never locate by translated name. |
| Row tax error | `customer_order_line_tax_error` | Scope beneath the line root. |
| Apply-to-All opener | `customer_order_apply_all_open` | Scope beneath `customer_order_product_group`; never encode Product text. |
| Apply-to-All root | `customer_order_apply_all_dialog` | Expose `data-product-template-id`. |
| Apply checkbox | `customer_order_apply_all_tax_checkbox` | Constant. |
| Apply selector | `customer_order_apply_all_tax_select` | Expose current `data-tax-id`. |
| Apply submit | `customer_order_apply_all_submit` | Constant. |
| Tax Amount | `customer_order_tax_amount` | Always present after load; numeric rendered text. |
| Amount including tax | `customer_order_amount_including_tax` | Always present after load; numeric rendered text. |
| Register New by Copying | `register_new_by_copying_button` | Existing stable hook; never locate by translated button text. |
| Register action | `customer_order_register_button` | Unique; do not reuse ambiguous `confirm-btn`. |
| Update action | `customer_order_update_button` | Unique. |
| Confirm action | `customer_order_confirm_button` | Unique. |
| Create Shipment action | `customer_order_create_shipment_button` | Unique. |
| Batch upload input | `customer_order_batch_upload_input` | Constant; may wrap/reference the shared upload input. |
| Batch submit | `customer_order_batch_submit` | Constant. |
| Batch error row | `customer_order_batch_error_row` | Required `data-source-row`: decimal string of the backend's 1-based data-record ordinal (`error.row`, excluding the spreadsheet header), never the FE's zero-based array index. |
| Batch error field | `customer_order_batch_error_field` | Required canonical `data-column="tax_classification"` or `"shipment_address"`. |
| Shipment Create Sales action | `shipment_create_sales_button` | Unique; never locate by English action text. |
| Sales Registration line | `sales_registration_line` | Required `data-line-key`: persisted ID or client UUID. |
| Sales line Tax Classification | `sales_line_tax_classification` | Scope beneath `sales_registration_line`; expose `data-tax-id`. |

A client UUID remains stable for an unsaved line's form lifetime. After persistence,
the database line ID is authoritative. Repeated child selectors are always scoped via
`[data-test="customer_order_line"][data-line-key="…"]`.

### E2E (`ldx-e2e`)

- Extend the existing wholesale `CustomerOrderRegistrationPage`; do not build a second
  POM for the same screen.
- Replace Product-text/index targeting in touched journeys with the stable row/group
  contract above.
- Add page methods for select/clear tax, Apply-to-All, totals, save/reload, copy, and
  Customer Order → Shipment navigation.
- Reuse Shipment/Sales POMs only where selectors are unique; add narrow stable hooks to
  touched FE actions otherwise.
- Verify persisted `tax_id` and downstream Sales through authenticated API reads, not
  only formatted text.
- Keep the full currency/rate/rounding matrix in FE/BE unit tests. E2E covers
  representative vertical slices: mixed rate, null, one foreign currency, batch, copy,
  and downstream propagation.
- Run shared preview tests serially with `--workers 1`.

## Data Flow

### Interactive new line

1. FE loads active ordinary Tax Master records once and Product `rate_of_tax_id` for
   preview.
2. FE displays explicit/Product/default/null without marking an untouched automatic
   preview as explicit intent.
3. User may select a tax or explicitly clear it.
4. On save, FE omits automatic intent, sends ID for manual selection, or sends false for
   clear.
5. Backend resolves omitted new-line tax inside the save transaction using current
   Product/default state and persists `tax_id | null`.
6. Generic create returns the new order ID (write returns a boolean), and the existing
   success flow returns to the Customer Order list. On the next detail open/reload, FE
   performs its existing `search_read` initialization and renders saved line tax plus
   authoritative derived totals.

### Existing-line edit

1. Read returns `[id, name] | false`, including an archived stored reference.
2. FE reads referenced Tax metadata with `active_test = false` for archived-value display
   and live calculation, without adding it to choices.
3. Unchanged tax is omitted from the write and therefore preserved.
4. Manual selection sends an active ordinary ID; explicit clear sends false.
5. Existing price-field lifecycle/permission rules decide whether the control is
   editable.
6. After save, backend recalculates totals with current Sales rounding.

### Register New by Copying

1. `copyFromId` loads source lines and their tax snapshots.
2. FE creates new unsaved lines, retains `copied_from_line_id`, and sends the request-only
   `copy_from_receipt_order_id` order-level create-payload metadata.
3. Backend validates the source relationship, rereads the source snapshot in the save
   transaction, and persists it without Product/default re-resolution. That transactional
   reread is authoritative and appears on the next detail read if the source changed
   while the copy form was open; create itself still returns only the new order ID.
4. A line added after copy is not copied intent and uses the normal current resolver.
5. A copied archived tax remains the inherited initial snapshot and propagates to Sales;
   it is not offered as a new option. While existing price-field rules permit editing,
   the user may still replace it with an active ordinary tax or clear it.

### Apply to All Rows

1. User opens the current product group's `全行に適用` dialog.
2. If the tax checkbox is off, confirmation does not touch tax.
3. If on, the selected tax or clear intent (serialized as `tax_id: false`) is assigned in
   one state update to selected rows, or all active rows in that group when none are
   selected.
4. FE recalculates once. A later per-line manual override wins.
5. Future rows resolve independently.

### Batch

1. A new/default pattern contains optional `Tax Classification` and `Shipment Address`;
   a saved old pattern is not modified.
2. Nonblank Tax Classification resolves by name to an active ordinary company-context
   tax and becomes explicit intent.
3. A supplied blank Tax Classification on a new line or existing-line update invokes
   Product → default Sales Tax → null. Batch normalization retains column-presence
   metadata until `batch_create()` writes the resolved ID/false.
4. An absent Tax Classification column from an old saved pattern preserves an existing
   line snapshot; it remains normal automatic omission for a genuinely new line.
5. Supplied blank Shipment Address becomes `shipment_address_1`; exact accepted labels
   map to address 1/2. An absent column uses address 1 for a new Customer Order and
   preserves the current order address on update.
6. Invalid Tax/Address values use existing batch row/column error behavior. Existing
   atomicity/partial-success semantics remain unchanged.
7. Resolver/query design prefetches Products and Taxes; it does not search per row.

### Direct Customer Order → Sales

1. Direct/service conversion calls `ReceiptOrderProductLine._get_as_sale_line()`.
2. The method writes the saved `tax_id` to Sales for every currency.
3. Null writes an explicitly empty Sales tax relation; no fallback runs.

### Customer Order → Shipment → Sales

1. Customer Order creates Shipment with its existing operational payload and source
   `receipt_order_line_id`; it does not add/populate tax on Shipment. Normal Logistics
   reads neutralize tax line values/aggregates and do not persist `stock.move.line.tax_id`.
2. The Sales Registration caller sends
   `args[0].purpose = 'sales_registration'` to `get_shipment_preview_slip_data`; normal
   Shipment and document callers omit purpose and retain their current projection.
3. Sales preview/create sees Customer Order provenance and dereferences the source line.
   A Product move line whose Shipment retains `order_receipt_slip_id` or a validated
   `receipt_order_line_ids.order_line_id` relation but lacks its row-level
   `receipt_order_line_id` is an integrity error; it never enters the generic
   Product/default branch. `order_receipt_slip_no` alone is ignored for provenance.
4. In the Sales-purpose context, the effective `ldx_ec` override carries an internal
   source ID on Product rows and service pseudo-lines. Core validates it, uses it to keep
   duplicate Service Products distinct, overlays tax only after the override's guarded
   persistence step, and strips it before response. Customer Order rows never persist
   Shipment `tax_id`; existing generic/EC and non-tax preview side effects remain.
5. The Sales projection contains source `tax_id | null`; it is not persisted as a
   Customer Order tax field on Shipment.
6. Sales line receives the exact snapshot for every currency.
7. Generic/EC Shipment without Customer Order provenance retains its current
   Product/default/EC tax behavior in both preview and create; Sales-purpose preview only
   adds `amount_type` and removes generic monetary aggregates.
8. Partial/split Shipment lines retain their source reference. Already-created Sales are
   never rewritten by a later Customer Order edit.

## Additional Changes (PRD §3.6, 2026/08/17)

### Current-state findings

Backend — `ldx-backend` graph in sync at `development` `439d483a60`; Odoo field and
relationship claims come from exact-literal text search inside `ldx_addons`.

- `receipt.order` (`ldx_addons/ldx_core/transactions/receipt_order.py`) already owns
  `order_receipt_date` (`:107`), a two-option `customer_shipment_address` selection
  defaulting to `shipment_address_1` (`:113`), the computed
  `customer_shipment_address_name` (`:117`), `remarks` (`:121`), and an **unused**
  `delivery_slip_note` (`:124`). `delivery_schedule_date` (`:157`) exists but is explicitly
  marked `# DEPRECATED: not use anymore`.
- No `receipt.order` field exists today for `納期`, `社内メモ`, `前払金額`, or a custom
  shipment address.
- `_generate_shipment_and_picking_order_line()` resolves the address block at
  `receipt_order.py:1283–1301` and builds `picking_payload` at `:1305–1335`. It maps
  `shipment_address_1|2` to the picking's `address_1|address_2`, copies the customer
  master's address values, and writes `'delivery_slip_note': self.remarks`. It never sends
  `recepient_name_phonetic`, `internal_remarks`, `with_advance_payment`,
  `advance_payment_amount`, or `delivery_date`.
- The waiting-shipment payload overrides those defaults: `picking_payload.update(
  shipment_payload)` runs after the order-derived values (`receipt_order.py:1338–1339`), so
  anything the shipment modal sends wins today.
- `stock.picking` already exposes every destination field, so **no new Shipment field is
  required**: `shipment_address` including a `custom` option
  (`ldx_addons/ldx_core/base/stock_picking.py:572–576`), `postal_code` / `country_id` /
  `prefectures_id` / `address` / `building_name` / `phone` (`:577–582`), `recepient_name`
  and `recepient_name_phonetic` (`:765`, `:767`), `internal_remarks` (`:378`, DB label
  “Remarks”, rendered as Internal Memo on the Shipment screens), `delivery_slip_note`
  (`:623`), `with_advance_payment` (`:716`), `advance_payment_amount` (`:726`),
  `advance_payment_residual` (`:729`), and `delivery_date` (`:369`).
- `StockPicking._action_check_ap_payment()` (`stock_picking.py:1992–2005`) raises
  `Advance payment amount is required` when `with_advance_payment` is true and
  `advance_payment_amount <= 0`. Propagating “Yes” without a positive amount therefore
  breaks downstream Sales creation — the reason Q&A-5 exists.
- Batch: `RECIPT_ORDER_MAIN_CONFIG`
  (`ldx_addons/ldx_core/utils/batches/batch_config_receipt_order.py`) already carries
  `order_receipt_date` as `type: 'datetime'` (`:56–63`) and `remarks` as `type: 'string'`
  (`:182–188`); `ReceiptOrder.batch_create()` (`receipt_order.py:723`) consumes it.

Frontend — `ldx-frontend` graph in sync at `fix/em-4229-galang` `76f01cd32f`.

- The information panel is
  `.../CustomerOrder/CustomerOrderRegistration/components/OrderInformation.tsx`: the
  Shipment Address `Select` (`data-test="shipment_address"`, `:242`) sits immediately above
  the Customer Order Date `FDatePicker` (`data-test="order_receipt_date"`, label
  `customer_order_date`, required, `:256–270`). `納期` belongs directly beneath it.
- The panel’s “Remarks” input lives in `components/createShipment.tsx:231–239` — label
  `common:remarks`, `name="remarks"`, `data-test="remarks"` — bound to
  `receipt.order.remarks`. This is the item PRD §3.6.1 renames, and it is also where
  `社内メモ` is inserted.
- Summary totals live in `components/OrderPrice.tsx`; `total_gross_profit` (`:131–141`) is
  the anchor Scenario 14 names for `前払金額`.
- `components/ShipmentToAddress.tsx` already implements the exact Custom behavior — options
  `address_1` / `address_2` / `custom`, an Apply button, and `applyValue()` writing
  `recipient_name`, `recipient_name_phonetic`, `postal_code`, `country_id`,
  `prefecture_id`, `address`, `building_name`, `phone`. It is consumed only by
  `ModalCreateShipmentWaiting.tsx:509` and its twin under
  `SalesLinkage/CustomerOrderDetailList/partials/`, **not** by the order panel. `FR-14`
  reuses this component rather than writing a second address widget.
- The approved Advance Payment control pattern already exists on Shipment Slip
  Registration: `ShipmentInstructionActRegistrationCreate/components/ShipmentActionsComponent.tsx:128–185`
  renders an `FRadio` Yes/No bound to `with_advance_payment` that clears
  `advance_payment_amount` on No and disables the `FInputNumberDecimal` unless Yes.
- Resource keys to reuse rather than mint: `internal_memo` and `delivery_slip_notes`, both
  already used by
  `ShipmentInstructionActRegistrationList/components/Filters.tsx:585–612`.
- Header form values are read for both detail and `copyFromId` mode by
  `services/InitialDataFetcher.tsx` (only line identity is stripped) and serialized by
  `services/utils.ts`; both list `remarks`, `customer_shipment_address` and
  `order_receipt_date` today, so new header fields inherit copy behavior automatically once
  added to the same lists.
- Customer Order List: `views/MDExecution/SalesLinkage/CustomerOrderList/CustomerOrderList.tsx`
  builds its table from `useColumnsV2('order_receipt_list')`, so headers come from
  `public/locales/{en,ja}/order_receipt_list.json` → `headers[]`. JA currently holds
  `{"name": "受注納期", "accessor": "order_receipt_date", "format": "date"}` — the exact row
  `FR-17` renames. `DownloadExcel` receives
  `dateFields={['order_receipt_date', 'confirmed_date']}` (`:338`).
- The list filter panel is `src/components/FilterContainer/partials/FilterReceiptList.tsx`;
  `confirmed_date` (label `order_receipt_list:customer_order_confirmation_date`,
  `data-test="customer-order-confirmation-date-range-picker"`) is the anchor `FR-15` inserts
  after, and every date filter there is a `RangePicker`.
- Batch options come from
  `CustomerOrderBatchRegister/hooks.ts::getDefaultSequences()`, which feeds both the setting
  page and the generated `customer_order_batch_registration_sample` file, so `FR-18` is one
  sequence entry plus its BE config twin.

E2E — `ldx-e2e` graph in sync at `feat/ringi-100` `2e2e9fd6`.

- `pages/in-season-management/sales-linkage-for-wholesale-sales/customer-order-registration.ts`
  is **absent from this branch** and present on `master`. No Customer Order List or Batch
  page object was found on either line. E2E work must start from the branch that owns the
  page object and extend it; it must not fork a second Customer Order page object.

### Domain model delta

The aggregate root is unchanged: `receipt.order` in the Wholesale Ordering bounded context.
PRD §3.6 adds header-level attributes to that same root; it introduces no new aggregate,
entity, or lifecycle state.

- **New value objects on the root:** `DeliveryDate` (`納期`, a plain optional date, no
  ordering constraint against `order_receipt_date` unless a rule is approved),
  `InternalMemo` (`社内メモ`, free text), `AdvancePaymentIntent` (`前払金額`: a boolean and
  a monetary amount that are valid only together), and `CustomShipmentAddress` (a five-part
  required core plus three optional parts, valid only when
  `customer_shipment_address = 'custom'`).
- **Bounded-context seam:** Wholesale Ordering → Logistics stays a one-way projection at
  shipment creation. The Customer Order remains the source of intent; `stock.picking` stays
  the operational owner. Nothing here makes Logistics recompute or write back.
- **Which `D` changes:** the affected domain behavior is **what a Customer Order hands to
  the shipment slip it generates**. Before, only the address selection, the customer
  master’s address values, and `remarks` crossed the seam. After, the order also carries an
  operator-authored custom address, an internal memo, and a prepayment intent, and it
  records its own `納期` for planning and search.
- **Invariants added:**
  1. `advance_payment_amount` is meaningful only when `with_advance_payment` is true, and
     clearing the flag clears the amount (Q&A-5 decides whether a positive amount is
     mandatory at Register).
  2. The five required custom-address parts exist whenever
     `customer_shipment_address = 'custom'`, and are irrelevant otherwise.
  3. Selecting `shipment_address_1|2` keeps the customer master as the address source of
     truth; only `custom` makes the order the source.
  4. A generated shipment slip is a snapshot: later edits to the Customer Order never
     rewrite an existing `stock.picking`.
- **Invariants at risk:** silent divergence between the order-level custom address and the
  shipment modal’s own address widget (Q&A-4); prepayment intent reaching a picking without
  a positive amount and failing at Sales creation (Q&A-5); a `納期` column colliding with the
  renamed `受注日` column in saved list layouts and download templates.

### Architecture — persisted fields

All new state is header-level on `receipt.order`; backend field names stay `snake_case`.

```text
receipt.order.delivery_date            Date | null            # 納期 — FR-10 (name pending Q&A-1)
receipt.order.internal_remarks         Text | null            # 社内メモ — FR-12
receipt.order.with_advance_payment     Boolean, default False # 前払金額 Yes/No — FR-13
receipt.order.advance_payment_amount   Float | null           # currency = use_currency — FR-13
receipt.order.customer_shipment_address
        Selection ['shipment_address_1', 'shipment_address_2', 'custom']  # FR-14, extended
receipt.order.recipient_name           Char | null            # required when custom
receipt.order.recipient_name_phonetic  Char | null            # optional
receipt.order.postal_code              Char | null            # required when custom
receipt.order.country_id               Many2one(res.country) | null        # required when custom
receipt.order.prefecture_id            Many2one(res.country.state) | null  # required when custom
receipt.order.address                  Char | null            # required when custom
receipt.order.building_name            Char | null            # optional
receipt.order.phone                    Char | null            # optional
```

Every field is nullable and unbackfilled, so existing Customer Orders keep their current
behavior: `customer_shipment_address` still defaults to `shipment_address_1`, and an order
that never chose `custom` never evaluates the custom-address constraint.

The eight address field names above assume the corrected spelling; `stock.picking` uses the
legacy `recepient_name`, `recepient_name_phonetic` and `prefectures_id`. Q&A-3 decides
whether the order mirrors the legacy spelling or keeps the corrected names behind an
explicit mapping. Whichever wins, the FE form already speaks the corrected names
(`ShipmentToAddress.applyValue()`), so exactly one translation layer is needed — never two.

### Write and propagation contract

| Order field | Shipment slip target (`stock.picking`) | Rule |
| --- | --- | --- |
| `remarks` (`納品書備考`) | `delivery_slip_note` | Unchanged from today. `FR-11` renames the label only. |
| `internal_remarks` (`社内メモ`) | `internal_remarks` | New payload entry at shipment creation. Precedence versus the waiting-shipment modal is Q&A-4. |
| `with_advance_payment` / `advance_payment_amount` (`前払金額`) | same two fields | New payload entries. `advance_payment_residual` stays computed on the picking; the order never writes it. |
| `customer_shipment_address = 'custom'` | `shipment_address = 'custom'` plus the eight address fields | The order’s own values replace the customer-master lookup. `address_1`/`address_2` keep the existing customer-master behavior verbatim. |
| `delivery_date` (`納期`) | `delivery_date` — **only if Q&A-2 approves** | The PRD does not state propagation; the picking field exists. Until answered, the order stores and displays `納期` without sending it. |

Propagation happens exactly where the existing mapping already happens
(`_generate_shipment_and_picking_order_line()`), for every Customer Order → Shipment path:
the panel’s Create Shipment action, the waiting-shipment modal, and the list-level batch
shipment generator. No second propagation site is introduced.

### FE contract additions

- `OrderInformation.tsx`: add the `納期` `FDatePicker` directly below Customer Order Date,
  optional, `format="YYYY/MM/DD"`, disabled with the existing `isFormDisabled` rule. Extend
  `customerShipmentAddressOptions` with `custom`, and render the expanded address block
  beneath the selector when `custom` is chosen, reusing `ShipmentToAddress.tsx` rather than
  a new widget.
- `createShipment.tsx`: change the Remarks item label from `common:remarks` to the existing
  `delivery_slip_notes` resource, keeping `name="remarks"` and the `data-test="remarks"`
  hook stable so current automation does not break; add the `社内メモ` input immediately
  below it, bound to `internal_remarks`, using the existing `internal_memo` resource.
- `OrderPrice.tsx`: add `前払金額` below `total_gross_profit`, mirroring
  `ShipmentActionsComponent.tsx` — an `FRadio` Yes/No bound to `with_advance_payment` that
  clears `advance_payment_amount` on No, plus an `FInputNumberDecimal` disabled unless Yes.
  Keep the existing tax-exclusive gross-profit semantics untouched.
- `services/data.types.ts`, `services/utils.ts` and `services/InitialDataFetcher.tsx`: add
  every new field to the form type, the normalized write, and the read/copy list. The copy
  flow inherits them for free because header values are copied wholesale.
- `services/validationSchema.ts`: require Recipient Name, Postal Code, Country, Prefecture
  and Address only when `customer_shipment_address === 'custom'`; require a positive
  `advance_payment_amount` when `with_advance_payment` is true if Q&A-5 approves that rule.
- `FilterReceiptList.tsx`: insert a `delivery_date` `RangePicker` immediately after the
  `confirmed_date` column, using the same `Form.Item` shape and a `data-test` hook.
- `public/locales/{en,ja}/order_receipt_list.json`: rename the `order_receipt_date` header
  (`受注納期` → `受注日`; EN “Customer Order Due Date” → “Customer Order Date”) and add a
  `delivery_date` header with `format: 'date'`. Add `delivery_date` to the list’s
  `dateFields` for the Excel download.
- `CustomerOrderBatchRegister/hooks.ts`: add a `delivery_date` sequence with
  `type: 'date'`, optional, positioned next to `order_receipt_date`.
- Add EN and JA resources for every new label, radio option and validation message.

### BE contract additions

- `ldx_addons/ldx_core/transactions/receipt_order.py`: declare the fields above; extend the
  `customer_shipment_address` selection with `custom`; add a create/write constraint for the
  custom-address required set and for the advance-payment pair; extend
  `_generate_shipment_and_picking_order_line()`’s address resolution and `picking_payload`
  with the new entries.
- `ldx_addons/ldx_core/utils/batches/batch_config_receipt_order.py`: add one `parent` field
  entry for `delivery_date` (`type: 'date'`) with EN and JA display names, and mirror it in
  `ReceiptOrder.batch_create()` normalization.
- `ldx_addons/ldx_core/i18n/ja_JP.po`: Japanese for every new user-visible label and error.
- Nothing on `stock.picking` changes. Every destination field already exists, and the
  Shipment Slip screens keep their current behavior.

### Stable `data-test` contract additions

| Element | Required `data-test` | Rule |
| --- | --- | --- |
| Delivery Date input | `customer_order_delivery_date` | Constant; expose the ISO value in `data-value` so automation never parses the localized display. |
| Delivery Slip Notes input | `remarks` (unchanged) | Keep the existing hook across the label rename so current specs keep passing. |
| Internal Memo input | `customer_order_internal_memo` | Constant. |
| Advance payment Yes/No | `customer_order_with_advance_payment` | Constant; expose the chosen value in `data-value`. |
| Advance payment amount | `customer_order_advance_payment_amount` | Constant; disabled state must be queryable. |
| Shipment Address selector | `shipment_address` (unchanged) | Keep; the `custom` option carries `data-address-option="custom"`. |
| Custom address block root | `customer_order_custom_address` | Present only when `custom` is selected. |
| Custom address inputs | `customer_order_custom_address_<field>` | `<field>` ∈ `recipient_name`, `recipient_name_phonetic`, `postal_code`, `country_id`, `prefecture_id`, `address`, `building_name`, `phone`; scoped beneath the block root. |
| Custom address field error | `customer_order_custom_address_error` | Required `data-field` naming the offending input. |
| List Delivery Date filter | `customer-order-delivery-date-range-picker` | Follows the list’s existing kebab-case filter hook convention. |
| List Delivery Date column | column key `delivery_date` | Located by column key, never by header text — the header text is being renamed in this same change. |
| Batch Delivery Date option | `customer_order_batch_field_delivery_date` | Constant. |

### Data flow

**Register a Customer Order with §3.6 values.** The user picks `納期`, types
`納品書備考` and `社内メモ`, chooses Yes plus an amount for `前払金額`, and selects
`出荷住所 = Custom`, which expands the eight inputs. Register validates the five required
custom fields client-side and again in the backend constraint, then persists all of it on
`receipt.order`. Reload reads it back through the existing `search_read` initializer.

**Create a shipment from that order.** `_generate_shipment_and_picking_order_line()`
resolves the address block — `custom` reads the order’s own fields instead of the customer
master — and adds `internal_remarks`, `with_advance_payment` and `advance_payment_amount`
(plus `delivery_date` if Q&A-2 approves) to `picking_payload`. The waiting-shipment modal’s
payload still merges last, so Q&A-4 decides whether that merge is narrowed for these
fields. Downstream Sales creation reads the picking, so the prepayment reaches
`_action_check_ap_payment()` exactly as a manually registered shipment does.

**List and search.** `納期` is a stored order field, so the list filter is a plain domain
range and the column is a plain read; no computed or joined value is involved. The
`受注納期` → `受注日` rename touches presentation only — accessor, domain and download key
all remain `order_receipt_date`.

**Batch.** A new-pattern workbook may carry a Delivery Date column; `batch_create()`
normalizes it like the existing `order_receipt_date`. A saved old pattern that omits the
column is unchanged and keeps working, and an omitted column preserves the stored value on
update — the same blank-versus-absent rule Part 1 defines for Tax Classification.

## Error Handling & Edge Cases (BOUNDARIES)

- **B — Applies: Boundary values.** Cover 10%, 8%, ordinary 0%, null, supported decimal
  percentage and fixed Tax Master values, zero quantity, fractional quantity/price,
  existing accepted signed values, and numeric limits enforced by current fields.
  Verify all three Sales rounding modes at 0-, 2-, and configured nonstandard currency
  precision, including signed values and fractional quantity. A differentiating group-
  rounding vector is two JPY lines of base 5 at 10%
  with round-down: group base 10 produces tax 1, not per-line 0 + 0. Existing validation
  remains responsible for NaN/non-finite input.
- **O — Applies: Ordering.** Row reorder cannot change totals. Group by `tax_id`, not
  name or adjacency. Apply-to-All followed by manual override must survive reload.
  Distinct batch fields cannot transpose. Batch duplicate-Product behavior remains
  current. Duplicate Service Products with different source taxes retain distinct source
  IDs in Sales projection. Repeated/partial downstream processing uses each source line
  and never rewrites earlier Sales.
- **U — Applies: Unicode and encoding.** Preserve all listed Japanese terms verbatim;
  add both English and Japanese i18n keys. Japanese/multibyte Tax names must render,
  search, persist, reload, and import without corruption. Automation never locates by
  translated text. Emoji/RTL introduce no new input semantics, but master-provided text
  must not crash rendering.
- **N — Applies: Null and empty.** Omitted create, omitted update, explicit false,
  ordinary 0%, supplied blank batch cell, absent saved-pattern column, and whitespace
  normalized by the existing batch framework are distinct. Supplied blank update
  re-resolves; absent update preserves. Null lines remain in tax-exclusive
  total and contribute zero tax without fallback. Supplied blank Shipment Address maps
  to 1; absent-on-new uses 1 and absent-on-update preserves.
  Zero contributing lines produce tax 0 and including-tax equal to current untaxed total.
- **D — Applies: Data volume.** Cover zero/one/many and current maximum practical lines
  and batch rows. Resolution must avoid N+1 queries; aggregation is O(n). Apply-to-All
  retains current responsiveness and performs one form-state update/recalculation.
- **A — Applies: Access and permissions.** Existing guest/no-auth/expired-session and
  read/write lifecycle rules remain authoritative. Tax lookup and validation are
  company-context scoped. Official surfaces reject nonexistent, another-company,
  archived, or `is_tax_free = true` new choices. Copy preservation is a scoped trusted
  exception, not a general permission bypass. No new Tax Master, Shipment, or Sales
  privilege is introduced.
- **R — Applies: Race conditions.** If Product/default changes after FE preview but
  before save, untouched automatic intent resolves the latest backend value. A late Tax
  fetch cannot overwrite manual selection/clear. A newly selected tax archived before
  save is rejected rather than silently replaced. An existing archived snapshot survives
  unrelated writes. Concurrent editing and double-submit retain existing behavior; this
  design adds no optimistic locking.
- **I — Applies: Integration failures.** Failed FE Tax/Product lookup preserves form
  intent and uses existing notification/retry behavior; it must not become an explicit
  clear. Validation/save failure cannot partially persist an interactive order.
  Universal batch atomicity/partial-success behavior remains unchanged. Sales conversion
  failure does not mutate the Customer Order snapshot or put tax on Shipment. Customer
  Order provenance indicated by `order_receipt_slip_id` or a validated
  `receipt_order_line_ids.order_line_id` relation with a broken row-level source
  reference is an integrity error, not permission to re-resolve current defaults.
  `order_receipt_slip_no` alone never triggers this rule because EC/external flows also
  use it. The narrowed Sales preview never carries generic tax-derived totals. Backend
  values are authoritative on detail reopen.
- **E — Applies: Environment.** Arithmetic is locale-independent; display uses existing
  currency formatting and transaction precision. Timezone does not affect arithmetic;
  existing JST Shipment closing behavior remains unchanged. Validate English/Japanese
  resources and desktop horizontal table scrolling. Current E2E coverage is Desktop
  Chromium, `Asia/Tokyo`, `en-US`; broader browser/mobile matrices are not new gates.
- **S — Applies: State transitions.** Tax follows price-field locks. Confirmed,
  cancelled, final, Shipment-created, reservation, and cancellation behavior remain
  current. Saved lines survive reload; new lines use current defaults; copy lines retain
  source snapshots. Legacy null stays null. Archived snapshots propagate. Rounding
  changes recompute totals; in-place Tax Master edits affect the referenced record by
  design. Partial Shipments use the source line at each conversion. `締め` remains
  Shipment-owned.

### PRD §3.6 delta — per letter

The Part 1 analysis above stands unchanged. These are the additional obligations the
§3.6 items introduce.

- **B — Applies.** `納期` boundaries: far past, far future, leap day, and the same day as
  `受注日`. No ordering rule between `納期` and `受注日` is specified, so none is enforced;
  if the business wants one, it is a new requirement, not an implicit constraint.
  `前払金額`: 0, negative, the order total, above the order total, and maximum decimal
  precision for the order currency. Zero and negative are the dangerous pair, because
  `_action_check_ap_payment()` rejects `<= 0` only later, at Sales creation. `社内メモ` and
  `納品書備考` need their maximum-length behavior pinned to the L-DX text standard, and
  postal code / phone need their existing master-side formats, not new ones.
- **O — Applies.** The eight custom-address inputs are the classic transposition trap:
  Recipient Name versus Recipient Name (Phonetic), Postal Code versus Phone, Address versus
  Building Name. Every test must use distinct values per field and assert each one
  separately on the generated shipment slip. On the list, `納期` and the renamed `受注日`
  are two date columns of the same format — assert by column key, never by header text or
  position, and check the Excel download column order too.
- **U — Applies.** Japanese, multibyte and full-width input in `社内メモ`, `納品書備考`,
  Recipient Name and its phonetic reading must persist, reload, reach the shipment slip and
  survive the Excel download without corruption. The phonetic field is specifically a
  kana field in practice. Every new label needs both EN and JA resources, and the
  `受注納期` → `受注日` rename must land in both dictionaries — an EN-only rename silently
  leaves JA users on the old wrong label.
- **N — Applies.** `納期` empty is valid and must stay null, never today’s date. Empty
  `社内メモ` must not overwrite an existing shipment memo with an empty string if Q&A-4
  chooses order-wins. `前払金額` No must clear the amount rather than leaving a stale
  value. Custom-address optional fields empty are valid; required fields blank or
  whitespace-only must block Register with a field-level error, per Scenario 15. Switching
  from `custom` back to `address_1` must not carry the custom values into the shipment.
- **D — Applies.** The list gains one stored column and one range filter, so no query
  growth beyond the existing pattern; confirm the new filter is a plain domain range and
  does not trigger a per-row read. Batch: the Delivery Date column must not add a per-row
  query, matching the existing `order_receipt_date` handling.
- **A — Applies.** No new permission is introduced. The new fields inherit the Customer
  Order’s existing read/write/editability rules, including the guest block and the
  confirmed-order lock. Every new input must be disabled exactly when the existing panel
  fields are.
- **R — Applies.** If a shipment is generated while the order form is open, the picking
  already holds a snapshot; a later order edit must not rewrite it. Double-submitting
  Register must not create two orders — existing behavior, not redefined here. The
  address-selector Apply button is a two-step interaction: selecting `custom` and never
  pressing Apply must not half-apply.
- **I — Applies.** A shipment-creation failure must not leave the order partially updated,
  and a validation failure on the custom-address block must not persist any of the eight
  fields. If Q&A-2 approves `納期` propagation, a picking that rejects the value must fail
  loudly rather than silently dropping it.
- **E — Applies.** `納期` is a date, not a timestamp: it must not shift across the JST
  boundary the way `order_receipt_date` (a `Datetime`) can. Verify the list filter, the
  column, the download and the batch import all agree in `Asia/Tokyo`. The expanded custom
  address block must remain usable on the standard desktop widths the panel already
  supports.
- **S — Applies.** State transitions: draft → confirmed locks the new fields with the rest
  of the panel; shipment-created orders keep their values but no longer rewrite the
  picking; cancelled and archived orders keep them readable. Register New by Copying
  carries every new header field, including a custom address — which is intended, since the
  copy is a new order for the same customer. Legacy orders stay null everywhere.

## Acceptance Criteria & Verification

1. `税区分` appears between `値引` and `受注単価` on registration/detail and follows
   existing price-field editability.
2. The selector includes active ordinary company-context taxes, including ordinary 0%
   and existing supported fixed taxes, and excludes archived and `is_tax_free = true`
   choices.
3. New interactive and batch lines resolve explicit → Product `rate_of_tax_id` → current
   `default_tax_sale` → null, with no hard-coded 10%.
4. Create omission, update omission, and explicit clear produce their three specified
   outcomes.
5. Save/reload preserves ID or null; later Product/default changes affect only genuinely
   new automatic lines.
6. Register New by Copying preserves active, null, and archived source snapshots through
   save/reload and downstream Sales. The active case must be a manual override different
   from the current Product/default tax; change Product/default again before the
   downstream assertion to prove no resolver false-positive. A copied line may still be
   changed/cleared while editable, and a line added after copying uses current resolution.
7. No migration/backfill changes a legacy line, and legacy null stays null downstream.
8. An archived stored snapshot remains displayable, survives unrelated edits, and
   propagates; it cannot be newly selected through official surfaces.
9. Existing tax-exclusive Customer Order amount is unchanged. `tax_amount` and
   `amount_including_tax` follow the approved group calculation and are not stored.
10. Null and ordinary 0% both add zero tax but remain distinguishable in saved/read data.
11. JPY and at least one foreign currency match shared FE/BE vectors for all three Sales
    rounding methods and transaction-currency precision.
12. Changing `rounding_method_sales` changes derived totals on reread without changing
    saved tax or persisting rounding.
13. Apply-to-All uses selected/current-group scope, unchecked causes no change, checked
    blank clears, and later manual override survives reload.
14. Direct/service Customer Order → Sales writes the exact saved tax or null for every
    currency without fallback; the service-only foreign-currency path retains the
    Customer Order currency instead of falling back to JPY.
15. Customer Order → Shipment adds/populates no tax in its create payload/UI. Its normal
    Shipment/report response neutralizes every line tax value and tax-derived aggregate
    exactly as specified, and the generated Shipment's generic
    `stock.move.line.tax_id` remains unset after both normal and Sales-purpose preview.
    `_compute_grouped_tax()` cannot reintroduce tax. The generic field still exists and
    generic/EC Shipments retain their existing behavior.
16. The explicit Sales Registration preview branch overlays exact Customer Order source
    tax/null without persisting Customer Order tax or internal projection metadata;
    Customer Order rows suppress the Shipment `tax_id` write, while existing generic/EC
    and non-tax preview side effects remain unchanged. Generic/EC rows retain current tax
    behavior while gaining `amount_type`. Only `order_receipt_slip_id`, a
    row `receipt_order_line_id`, or a validated
    `receipt_order_line_ids.order_line_id` relation marks Customer Order provenance;
    number-only EC/external Shipments remain generic. A missing row-level source under
    validated Customer Order provenance raises an integrity error rather than falling
    back, and service-only preview initializes Sales rounding before iterating rows.
17. Shipment-originated Sales creation through `StockMoveLine._get_as_sale_line()` writes
    the exact Customer Order tax/null. Product rows, duplicate Service pseudo-lines, and
    partial/split Shipments retain source identity; internal projection metadata is
    absent from JSON and earlier Sales are not rewritten.
18. Batch accepts both optional fields; a supplied blank Tax cell re-resolves on new or
    update while an absent old-pattern column preserves an existing snapshot. Supplied
    blank and absent-on-new Shipment Address use address 1; absent-on-update preserves.
    It reports invalid Tax/Address with stable row/column identity and avoids per-row Tax/
    Product queries.
19. New import patterns include both fields; saved patterns remain unmodified and usable.
20. Tax Master Page/API, permissions, archive behavior, Customer Order lifecycle, and
    Shipment closing behavior remain unchanged.
21. Every new label/error has English/Japanese i18n resources and preserves the listed
    Japanese terms.
22. Every new/touched automation surface satisfies the stable `data-test` contract.
23. FE and BE share calculation vectors; unit/integration tests cover the full matrix.
24. E2E serial vertical slices cover interactive mixed/null, copy, one foreign currency,
    batch, direct Sales, and Shipment-originated Sales.
25. Each `PRD §3.1–3.5` requirement and `Scenario 01–10` maps to at least one FE or BE
    test and a representative E2E assertion where practical.

26. `納期` renders directly below `受注日` on Customer Order Registration and Detail, is a
    calendar input, is not required, saves, and reloads with the entered value
    (`FR-10`, Scenario 11).
27. The panel item formerly labeled “Remarks” reads “Delivery Slip Notes” (`納品書備考`) in
    EN and JA, keeps its existing `data-test` hook and field binding, and its text still
    reaches the shipment slip’s Delivery Slip Note on shipment creation (`FR-11`,
    Scenario 12).
28. `社内メモ` renders directly below `納品書備考`, saves, reloads, and reaches the shipment
    slip’s Internal Memo when a shipment is created (`FR-12`, Scenario 13).
29. `前払金額` renders below Total Gross Profit with No selected and the amount input
    disabled; choosing Yes enables it; the saved pair reaches the shipment slip’s
    `with_advance_payment` and `advance_payment_amount` (`FR-13`, Scenario 14).
30. Choosing No clears the amount rather than leaving a stale value, and a Customer
    Order-generated shipment carrying a prepayment does not fail
    `_action_check_ap_payment()` at Sales creation.
31. Shipment Address offers Custom alongside Shipment Address 1 and 2, defaults to
    Shipment Address 1, and expands the input block only when Custom is selected
    (`FR-14`, Scenario 15).
32. Registering with any of Recipient Name, Postal Code, Country, Prefecture or Address
    blank shows a field-level error and saves nothing; completing them saves, and all eight
    values — including the optional Phonetic, Building Name and Phone — appear on the
    generated shipment slip with no field transposed (`FR-14`, Scenario 15).
33. Selecting Shipment Address 1 or 2 keeps today’s customer-master behavior byte for byte;
    switching away from Custom does not leak custom values onto the shipment slip.
34. The Customer Order List shows a Delivery Date column in the standard L-DX date format,
    populated from registered data, and includes it in the Excel download (`FR-16`,
    Scenario 16).
35. The Customer Order List offers a Delivery Date filter immediately to the right of
    Customer Order Confirmation Date, and it narrows results (`FR-15`, Scenario 16).
36. The list header for `order_receipt_date` reads “Customer Order Date” / `受注日` in both
    dictionaries, and no other screen’s label regresses (`FR-17`, Scenario 16).
37. Customer Order Batch Registration Setting offers Delivery Date in the field options and
    the batch table, and the generated sample file contains it (`FR-18`, Scenario 17).
38. A saved old batch pattern that omits Delivery Date still imports unchanged, and an
    absent column on update preserves the stored value.
39. Register New by Copying carries `納期`, `納品書備考`, `社内メモ`, the prepayment pair and
    a custom address into the new order, and the copy can then be edited independently.
40. Every new label, radio option and validation message has EN and JA resources, and every
    Japanese term listed in this spec appears verbatim in the delivered resources.

> Verification commands run only in separate sessions rooted at the target repository.
> No target repository is modified or tested from this control-plane task.

## Performance and Rollout

- Database change: one nullable Customer Order line relation plus nonstored header fields.
- Data migration: none; no backfill.
- Query behavior: prefetch Tax/Product data in batch; no per-line Tax Master request.
- UI behavior: one active-choice Tax fetch plus at most one batched referenced-ID Tax
  fetch (only when saved lines require it), one bulk Apply-to-All state update, and O(n)
  grouping.
- Rollout dependency: BE contract/calculation first, FE integration second, E2E last.
- Backward compatibility: old read clients ignore new fields; old saved batch patterns
  continue without mutation; legacy null semantics are intentional.
- Operational constraint: a new rate is a new Tax Master record; archive the old record.
- Rollback: code rollback leaves a nullable unused column/snapshots; no destructive data
  rollback is required. Do not drop populated tax snapshots during rollback.
- Main risks: incomplete graph blast-radius evidence, FE/BE rounding drift, null fallback
  inside shared helpers, generic-vs-Customer-Order Shipment branch leakage, broken source
  provenance, and copy-metadata validation. Each is pinned in the handoffs and acceptance
  criteria.

PRD §3.6 additions:

- Database change: twelve nullable header fields plus one extra selection value on
  `receipt.order`. Nothing on `stock.picking`; every destination field already exists.
- Data migration: none. No backfill onto existing orders and no rewrite of shipment slips
  that were already generated.
- Query behavior: `納期` is a stored scalar, so the new list column, filter and download
  entry are plain reads and a plain domain range — no join, no per-row query.
- Rollout dependency: BE fields and payload first, FE panel/list/batch second, E2E last.
  The three §3.6 areas — order panel, list, batch — are independently shippable behind the
  same BE change.
- Backward compatibility: existing orders keep `customer_shipment_address =
  shipment_address_1` and null everywhere else; saved batch patterns without the Delivery
  Date column keep importing unchanged.
- Rollback: code rollback leaves twelve unused nullable columns. Do not drop populated
  custom-address, memo or prepayment values during rollback.
- Main §3.6 risks: an eight-field address block that transposes silently, a prepayment
  intent that fails only later inside `_action_check_ap_payment()`, a JA-only or EN-only
  header rename, and precedence ambiguity against the waiting-shipment modal (Q&A-4). Each
  is pinned in the BOUNDARIES delta, the acceptance criteria and the handoffs.

## Open Questions

Part 1 (`税区分`) has none: every material product, scope, architecture, migration,
calculation, copy, currency, Shipment and testability decision remains `USER-APPROVED`
(`DEC-01`–`DEC-18`).

Part 2 (PRD §3.6) has seven. Each one is a row in the TDD sheet’s `Q&A` tab with concrete
options; answer them there, in the `Answer` column. Recommendations below are advisory and
**non-binding** — no dependent work should start until the row is answered.

| Q&A | FR | Question | Options | Recommendation |
| --- | --- | --- | --- | --- |
| `Q&A-1` | `FR-10` | Where is `納期` stored on `receipt.order`? | a) new `delivery_date` field; b) revive the deprecated `delivery_schedule_date`; c) another name | (a) — `delivery_schedule_date` is explicitly marked deprecated and may hold stale legacy values that would surface as real `納期` data. |
| `Q&A-2` | `FR-10` | Does `納期` propagate to the shipment slip’s existing `stock.picking.delivery_date` when a shipment is created? | a) no, the order records it only; b) yes, always; c) yes, only when the picking’s own value is empty | (a) — PRD §3.6.1 asks for propagation on every other new item and is silent here, and the picking field already has its own meaning in the logistics flow. |
| `Q&A-3` | `FR-14` | How are the eight custom-address fields named on `receipt.order`? | a) corrected spelling (`recipient_name`, `prefecture_id`) with an explicit map to the picking’s legacy names; b) mirror the picking’s legacy spelling (`recepient_name`, `prefectures_id`) for a 1:1 payload | (a) — the FE form already uses the corrected names, so (a) needs one translation layer while (b) needs one on the FE side instead and entrenches the typo. |
| `Q&A-4` | `FR-12`, `FR-14` | When the waiting-shipment modal also supplies an address, notes or a memo, which value reaches the picking? | a) the modal wins (today’s behavior — `picking_payload.update(shipment_payload)`); b) the order wins; c) the modal wins only for values it actually supplies, and blanks fall back to the order | (c) — it preserves the operator’s explicit shipment-time input without letting an untouched modal field silently erase order-level data. |
| `Q&A-5` | `FR-13` | Is a positive `前払金額` required at Register when Yes is selected? | a) yes, block Register with amount ≤ 0; b) no, allow Yes with a blank amount | (a) — `_action_check_ap_payment()` already rejects `<= 0`, so (b) simply defers the same failure to Sales creation, far from where the user made the mistake. |
| `Q&A-6` | `FR-18` | Do `社内メモ`, `前払金額` and the custom address also join Batch Registration? | a) no, Delivery Date only, exactly as §3.6.2 states; b) yes, add all of them; c) add a named subset | (a) — the PRD lists only Delivery Date; anything more is new scope and new columns in the sample file. |
| `Q&A-7` | `FR-17` | How far does the `受注納期` → `受注日` rename reach? | a) the Customer Order List header only; b) also the Batch Registration column label; c) every screen that labels `order_receipt_date` | (a) — §3.6.2 names the list table field specifically, and the registration panel already reads `customer_order_date`. |

## Implementation Handoff (Advisory)

These blocks are prompts for separate implementation sessions rooted at each target
repository. They are advisory only and are not executed from this control-plane task.

### BE — `BE_PWD`

- **Goal:** Make `receipt.order.product.line` own nullable Customer Order tax, expose
  authoritative derived totals, and propagate snapshots to Sales without storing them on
  Customer Order-generated Shipment.
- **Base assumption:** `target/july-2026` near inspected `63ef5dba`; revalidate branch,
  HEAD, clean worktree, ADRs, and current graph before editing.
- **Scoped files/symbols:**
  - `ReceiptOrderProductLine` / `_compute_total()` / `_get_as_sale_line()` —
    `ldx_addons/ldx_core/transactions/receipt_order_product_line.py`.
  - `ReceiptOrder` / `_compute_total()` / `batch_create()` /
    `_generate_shipment_and_picking_order_line()` —
    `ldx_addons/ldx_core/transactions/receipt_order.py`.
  - `RECIPT_ORDER_MAIN_CONFIG` —
    `ldx_addons/ldx_core/utils/batches/batch_config_receipt_order.py`.
  - `calc_tax_group()` —
    `ldx_addons/ldx_core/utils/account_control/invoice_control.py`.
  - `StockMoveLine.receipt_order_line_id` / `_get_as_sale_line()` —
    `ldx_addons/ldx_core/base/stock_move_line.py`.
  - `StockPicking._action_create_sales()` / `get_shipment_preview_slip_data()` /
    `get_move_line_ids()` / `get_grouped_tax()` / `_compute_grouped_tax()` —
    `ldx_addons/ldx_core/base/stock_picking.py`.
  - Effective preview override `StockPicking.get_move_line_ids()` /
    `_convert_order_line_to_move_line()` / `write_necessary_data()` —
    `ldx_addons/ldx_ec/models/stock_picking.py`.
  - Backend Japanese translations for new user-visible errors:
    `ldx_addons/ldx_core/i18n/ja_JP.po` and, only if the owning error remains in the EC
    module, `ldx_addons/ldx_ec/i18n/ja_JP.po`.
  - References only: `product_master.py::get_sales_tax()`, `account_tax.py`,
    `res_company.py::get_rounding_by_type()`.
  - **PRD §3.6 additions** — `ReceiptOrder` field block and
    `_generate_shipment_and_picking_order_line()` address resolution/`picking_payload`
    (`ldx_addons/ldx_core/transactions/receipt_order.py:107–128`, `:1283–1339`);
    `RECIPT_ORDER_MAIN_CONFIG` plus `ReceiptOrder.batch_create()`; JA resources in
    `ldx_addons/ldx_core/i18n/ja_JP.po`.
  - **Read-only references for §3.6** — `stock.picking` already owns every destination
    field: `ldx_addons/ldx_core/base/stock_picking.py:369` (`delivery_date`), `:378`
    (`internal_remarks`), `:572–582` (`shipment_address` incl. `custom` + address block),
    `:623` (`delivery_slip_note`), `:716`/`:726`/`:729` (advance payment),
    `:765`/`:767` (`recepient_name`, `recepient_name_phonetic`), and
    `:1992–2005` (`_action_check_ap_payment()`). **Do not modify `stock.picking`.**
- **Relevant rules/evidence:** Read root `CLAUDE.md`; inspect relevant ADRs; add
  `from __future__ import annotations` to edited first-party Python modules where local
  rules require it; annotate pure-data surfaces; register new tests in the applicable
  `ldx_addons/ldx_core/tests/__init__.py` and `ldx_addons/ldx_ec/tests/__init__.py`. Use
  repository-prescribed graph impact before editing; current control-plane graph evidence
  is incomplete.
- **Ordered steps (TDD):**
  1. Add failing tests for create/update/null/default resolution and exact copy metadata,
     including null/archived sources and an active manual override deliberately different
     from Product/default. Change Product/default before save/downstream assertion to
     prove snapshot preservation, then cover access/product mismatch rejection, reload,
     and no legacy backfill assumption.
  2. Add failing tests for every canonical calculation vector, including grouped
     rounding, percent/fixed amount types, null without fallback, signed values,
     fractional quantity, nonstandard precision, all currencies, and changing Sales
     rounding.
  3. Add nullable `tax_id`, scoped resolver/write rules, and nonstored header totals.
  4. Extend batch config/normalization with Tax Classification and Shipment Address;
     preserve supplied-blank-vs-absent metadata for both fields, prove blank Tax update
     re-resolution, address-1 defaulting, absent-column update preservation, and query
     counts.
  5. Add failing direct/service and Shipment-originated Sales propagation tests,
     including null, the service-only foreign-currency regression, partial Shipment,
     generic Shipment/report regression, and broken Customer Order source-reference
     rejection using header ID and the validated picking-line relation. Prove an EC or
     external number-only Shipment remains generic. Request generic total/group fields
     in Sales purpose and prove the response allowlist strips them. In `ldx_ec`, cover a
     Product row, a service-only preview, service pseudo-lines, duplicate Service Product
     with different source taxes, no Customer Order Shipment `tax_id`/metadata
     persistence after both normal and purpose previews, retained generic/EC and non-tax
     preview side effects, tax-neutral Customer Order normal responses/computed fields,
     and exact generic/EC context-off response compatibility. Test every neutral scalar
     and grouped aggregate, then send `group`/`pad_lines` in purpose-mode tests and prove
     they are ignored in favor of a flat response.
  6. Replace Customer Order-source Product/default resolution with source snapshot in
     direct Sales and stock move conversion. Keep `get_move_line_ids()` generic; add the
     narrowed snapshot response only behind
     `get_shipment_preview_slip_data()` `args[0].purpose = 'sales_registration'`, and
     use the internal context/source-key seam in the effective `ldx_ec` override. Attach
     provenance only in the override, suppress `tax_id` persistence for validated
     Customer Order rows in both normal and purpose contexts, neutralize Customer Order
     Logistics line/aggregate tax values, and overlay Customer Order tax in core only
     after the effective method returns. Guard `get_grouped_tax()` and
     `_compute_grouped_tax()` against reintroducing defaults. Prove the Sales purpose
     omits every internal/stale generic tax-derived value. Do not populate Shipment tax.
  7. Address only scoped existing defects that block the approved contract: the
     company-currency gates, the service-only `currency_id` assignment typo, Sales
     rounding initialization before the preview loop, and any incorrect percentage
     conversion in the Customer Order-backed Sales-preview branch. Do not redesign
     generic Shipment calculation.
  8. Wrap every new user-visible validation, integrity, copy, and batch error with `_()`;
     provide the Japanese translations without changing existing message keys.
  9. Verify Odoo dynamic consumers outside the indexed scope and run reservation plus
     existing Shipment-owned closing regressions.
  10. **PRD §3.6 — start only after the sheet answers Q&A-1…Q&A-7.** Add failing tests
      first: nullable `納期` persists and reloads (and does **not** propagate to the picking
      unless Q&A-2 says otherwise); `社内メモ` reaches `stock.picking.internal_remarks`;
      the advance-payment pair reaches `with_advance_payment` / `advance_payment_amount`
      and survives `_action_check_ap_payment()`; `customer_shipment_address = 'custom'`
      writes all eight order-owned address values onto the picking with **distinct values
      per field** so a transposition fails the test; `address_1`/`address_2` keep today’s
      customer-master behavior byte for byte; the custom-required constraint rejects each
      of the five required fields blank and whitespace-only; and the batch Delivery Date
      column round-trips with the same blank-versus-absent rule as Tax Classification. Then
      implement the fields, the constraint, the payload additions and the batch config, and
      add the Japanese resources. Do not touch `stock.picking`.
- **Acceptance criteria:** AC 2–20, the Backend portion of AC 21, AC 23, the Backend parts
  of AC 25, and the Backend parts of AC 26–40 (persistence, constraints, shipment payload,
  batch config, JA resources).
- **Test registration:** Tag new `ldx_core` and `ldx_ec` coverage
  `test_customer_order_tax` so the first verification command executes both modules.
- **Verification commands:**

  ```bash
  venv/bin/python odoo-bin -c config/testing.l-dx.conf --test-tags=test_customer_order_tax --test-enable --stop-after-init
  venv/bin/python odoo-bin -c config/testing.l-dx.conf --test-tags=test_customer_order_reservation --test-enable --stop-after-init
  venv/bin/python odoo-bin -c config/testing.l-dx.conf --test-tags=test_receipt_order_account_closing --test-enable --stop-after-init
  ```

- **Cross-repository dependencies:** Publish final snake_case read/write/preview fields
  and shared numeric vectors to FE before FE implementation. E2E depends on seeded Product,
  Tax, currency, and downstream fixtures.

### FE — `FE_PWD`

- **Goal:** Add line Tax Classification, Apply-to-All, aggregate totals, copy behavior,
  stable automation hooks, batch exposure, and downstream null-safe Sales mapping.
- **Base assumption:** `target/july-2026` near inspected `531f716`; revalidate branch,
  HEAD, worktree, root `AGENTS.md`/`CLAUDE.md`, and graph before editing.
- **Scoped files/symbols:**
  - Customer Order types/normalizer/initializer:
    `CustomerOrderRegistration/services/data.types.ts`, `services/utils.ts`,
    `services/InitialDataFetcher.tsx`.
  - Line/Product/Service construction: `components/productLinesTable.tsx`,
    `components/productTemplateTable.tsx`, `services/InitializeFromRankingAnalysis.tsx`,
    `components/partials/ProductSearch/ProductSearchModal.tsx`, and
    `components/partials/SearchServices/ServiceSearchModal.tsx`.
  - Customer Order actions/selectors: `CustomerOrderRegistration.tsx`,
    `components/buttonActions.tsx`, `components/createShipment.tsx`, and
    `components/ModalCreateShipment.tsx`.
  - Apply-to-All: `components/partials/ProductLineInputModalEditor.tsx`.
  - Summary: `components/OrderPrice.tsx`.
  - Reusable tax/rounding: `data/useAccountTaxSearchRead.tsx`,
    `components/Templates/Selector/AccountTaxSelector.tsx`, `data/useContract.tsx`,
    `components/Templates/Input/Input.tsx`.
  - Batch: `src/views/MDExecution/SalesLinkageForWholeSales/CustomerOrderBatchRegister/`.
  - Shared batch hook owners:
    `src/components/BatchRegistration/BatchRegistrationPage/BatchButtonGroups.tsx`,
    `BatchRegistrationPage.tsx`, and `ReadResultTable.tsx`; expose configurable hooks so
    unrelated batch pages retain their current DOM contract.
  - Downstream Sales mapping:
    `src/views/InventoryControl/ShipmentProcess/SalesRegistrationEdit/components/partials/ShipmentSlipNoSelector.tsx`,
    `components/ProductTable.tsx`, `hooks/useInitializeSaleOrderForm.ts`,
    `hooks/useFormActions.ts`, and `services/utils.ts` in the same feature subtree.
  - Shipment Create Sales action and generic-preview regression:
    `src/views/InventoryControl/ShipmentProcess/ShipmentInstructionActRegistration/ShipmentInstructionActRegistrationCreate/components/customFormComponents.tsx`
    and `src/data/useShipmentPreview.tsx`.
  - EN/JA locale files for the affected namespaces.
  - **PRD §3.6 additions** — `components/OrderInformation.tsx` (`納期` below
    `order_receipt_date`; `custom` in `customerShipmentAddressOptions`; expanded address
    block), `components/createShipment.tsx:231–239` (label rename + `社内メモ`),
    `components/OrderPrice.tsx:131–141` (`前払金額` below `total_gross_profit`),
    `components/ShipmentToAddress.tsx` (reuse — do not fork a second address widget),
    `services/validationSchema.ts`,
    `src/components/FilterContainer/partials/FilterReceiptList.tsx` (filter after
    `confirmed_date`),
    `src/views/MDExecution/SalesLinkage/CustomerOrderList/CustomerOrderList.tsx`
    (`dateFields`), `public/locales/{en,ja}/order_receipt_list.json` (rename + new column),
    and `CustomerOrderBatchRegister/hooks.ts::getDefaultSequences()`.
  - **Pattern reference (read-only)** —
    `ShipmentInstructionActRegistrationCreate/components/ShipmentActionsComponent.tsx:128–185`
    for the advance-payment Yes/No + amount control, and
    `ShipmentInstructionActRegistrationList/components/Filters.tsx:585–612` for the existing
    `internal_memo` / `delivery_slip_notes` resource keys.
- **Relevant rules/evidence:** TDD before implementation; API/form fields snake_case;
  no `any`; reuse selectors and `Input.Number.Currency`; all user copy via `t()` with EN
  and JA entries; `data-test` required; ≥80% coverage on changed source files. Run current
  GitNexus impact/detect-changes as required by the target repo; the inspected local index
  was stale and must not be trusted without explicit refresh approval.
- **Ordered steps (TDD):**
  1. Add failing pure tests for automatic/manual/clear/unchanged/copied intent, exact
     copy metadata, normalized payload shapes, and an active copied manual override that
     differs from Product/default before and after the defaults change.
  2. Add shared-vector calculation tests for group rounding, percentage/fixed taxes,
     null, 0%, all currencies, and latest Sales rounding.
  3. Extend types/read/write/copy mapping and Product Tax preview fields across every
     live Product/SKU/ranking/Service line-construction path; leave the unused initializer
     out unless it is first wired into the live screen.
  4. Add the line selector and a separate `active_test = false` read for referenced Tax
     metadata; render/calculate an archived current value without offering it as a new
     choice, allow replace/clear while price fields are editable, preserve the current
     lifecycle lock, and add exact `data-test` row identity.
  5. Add Apply-to-All tax controls/scope and summary fields with immediate preview; keep
     current success navigation and make backend reads authoritative on detail reopen.
  6. Extend batch surfaces and stable row/column errors, including Tax/Address supplied-
     blank-vs-absent semantics. Add configurable hooks at the shared batch owner and map
     `data-source-row` to the backend's 1-based `error.row`, without changing unrelated
     batch pages or generic batch transaction behavior.
  7. Send `args[0].purpose = 'sales_registration'` from Sales Registration only, consume
     `amount_type` plus the narrowed response, and ensure percent/fixed/null each retain
     their semantics; generic Shipment preview/report callers remain current.
  8. Add EN/JA resources and focused component/integration tests; verify copy, unchanged
     guest-access gating, and existing Customer Order regressions.
  9. **PRD §3.6 — start only after the sheet answers Q&A-1…Q&A-7.** TDD as above: form
     type, normalizer and initializer entries for every new field; the `納期` picker below
     Customer Order Date; the label rename that keeps `name="remarks"` and
     `data-test="remarks"` stable; the `社内メモ` input; the `前払金額` radio/amount pair
     that clears the amount on No; the `custom` option with the expanded block reusing
     `ShipmentToAddress`; conditional validation for the five required address fields; the
     list filter, column, rename and `dateFields`; and the batch sequence. Assert the
     rename lands in **both** `en` and `ja` dictionaries. Add the new `data-test` hooks
     exactly as contracted.
- **Acceptance criteria:** AC 1–13, 18–25, FE portions of AC 14–17, and AC 26–40 except
  the purely backend persistence assertions.
- **Verification commands:**

  ```bash
  npx eslint --fix <changed-ts-tsx-files>
  npx prettier --write <changed-ts-tsx-files>
  yarn type-check
  yarn test:ci --runInBand --runTestsByPath <customer-order-tax-test-files>
  ```

- **Cross-repository dependencies:** Implement against the finalized BE read/write and
  Sales-preview shape. Publish stable selectors and shared vectors to E2E.

### E2E — `E2E_PWD`

- **Goal:** Add maintainable serial vertical coverage for Customer Order tax surfaces,
  persistence/copy, batch, and downstream propagation.
- **Base assumption:** the Customer Order page object exists on `master` (verified
  2026-08-20 with `git ls-tree master`) and **not** on the currently checked-out
  `feat/ringi-100`. Branch from the line that owns
  `pages/in-season-management/sales-linkage-for-wholesale-sales/customer-order-registration.ts`
  and revalidate branch, HEAD, worktree, root `CLAUDE.md`, and module ownership before
  editing.
- **Scoped files/symbols:**
  - Extend
    `pages/in-season-management/sales-linkage-for-wholesale-sales/customer-order-registration.ts::CustomerOrderRegistrationPage`.
  - Reuse/extend Shipment and Sales POMs under
    `pages/inventory-control/shipment-process/`.
  - Reuse `utils/batchRegistrationHelper.ts` and existing Excel helpers.
  - Add focused Customer Order tax specs under the appropriate functionality/scenario
    module; retain `TC-Auto-IL-032.spec.ts` as a regression.
  - Update `test-modules.json`/workflow metadata only through the repository's serialized
    `batch-parallel-coordinator` if a new module is introduced.
- **Relevant rules/evidence:** Playwright uses `data-test`; shared preview DB requires
  serial execution and one worker; do not locate by translated text; use API reads to
  verify persisted/downstream `tax_id`; capture/restore any unavoidable global config in
  `finally`.
- **Ordered steps:**
  1. Harden the POM around constant row/group/action selectors and line-key scoping.
  2. Add interactive default/manual/null/Apply-to-All/save-reload and copy coverage for
     null/archived snapshots plus an active manual override different from current
     Product/default. Change Product/default before the downstream assertion, and add a
     new post-copy line that proves it uses the newer defaults.
  3. Add a representative foreign-currency/mixed-rate summary journey, including the
     service-only currency regression; leave the full numeric matrix to FE/BE.
  4. Add valid/blank/invalid batch Tax and Shipment Address cases, including supplied
     blank update versus absent saved-pattern column, stable error identity, and saved-
     pattern compatibility.
  5. Add direct Customer Order → Sales and Customer Order → Shipment → Sales journeys;
     assert the Customer Order Shipment's persisted `tax_id` is empty, its normal preview
     line/aggregate tax values are neutral, its UI exposes no tax, and Sales receives the
     exact source ID/null through the Sales-purpose projection.
  6. Verify an existing guest cannot access/use the new Tax surface, then run the existing
     reservation scenario to protect permissions and lifecycle behavior.
  7. **PRD §3.6 — after FE/BE land.** Extend the same page object (never a second one) with
     `納期`, `納品書備考`, `社内メモ`, `前払金額` and the custom-address block, then add:
     a register/reload journey for the new header fields; a Custom-address journey that
     first submits with each required field blank (expecting a field error and no save) and
     then completes it; a Customer Order → Shipment journey asserting all eight address
     values, the memo and the prepayment on the generated slip **via authenticated API
     reads with distinct per-field values**; and a list journey asserting the Delivery Date
     column by column key, the filter narrowing results, and the renamed header in both
     locales. Add a batch journey covering the Delivery Date column and an old pattern that
     omits it.
- **Acceptance criteria:** AC 1–11, 13–25, and AC 26–39 as representative vertical slices.
- **Verification commands:**

  ```bash
  npx eslint pages/in-season-management/sales-linkage-for-wholesale-sales/customer-order-registration.ts <new-or-changed-test-files> --max-warnings 0
  npx tsc --noEmit
  npx playwright test <new-customer-order-tax-spec> --workers 1
  npx playwright test tests/scenario/inventory-list/std-case/TC-Auto-IL-032.spec.ts --workers 1
  ```

- **Cross-repository dependencies:** Requires deployed BE contract/test data and FE
  selectors. Coordinate shared preview state; never run this chain concurrently.
