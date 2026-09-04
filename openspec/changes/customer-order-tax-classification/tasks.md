## 1. Backend — Tax Classification data model and defaulting

- [ ] 1.1 Add the nullable line-level Tax Category reference to the Customer Order product line
  model and verify a new line can be created/read with it via a model-level unit test.
- [ ] 1.2 Implement the tri-state write intent (field omitted = automatic/preserve, positive ID
  = explicit selection, explicit `false` = clear) and verify with unit tests for all three
  intents on both create and update.
- [ ] 1.3 Implement new-line default resolution (product default → Sales default → null, no
  hard-coded rate) and verify with unit tests covering each fallback step.
- [ ] 1.4 Verify existing-line preservation: a unit test that changes a product's default tax
  after a line was saved and asserts the saved line's Tax Category is unchanged.
- [ ] 1.5 Reject an invalid/inactive/tax-free explicit Tax Category selection as a validation
  error and verify with a unit test per invalid case (inactive, tax-free, unrelated company).

## 2. Backend — Apply to All and computed totals

- [ ] 2.1 Extend the Apply to All bulk-update endpoint/method with the Tax Category
  checkbox/selector semantics (selected rows, else current product group; unchecked = no-op) and
  verify with a unit test per scope case.
- [ ] 2.2 Implement grouped, rounded Tax Amount / Order Total (Incl. Tax) computation on the
  post-discount net amount, using existing Sales rounding policy and transaction-currency
  precision, and verify against the pinned calculation vectors from the design (single-rate,
  mixed-rate, non-taxable, signed, fractional quantity/price, percent and fixed tax, all
  rounding modes, 0/2/3-decimal currencies).
- [ ] 2.3 Verify the bulk-update path performs one update/recompute rather than one call per
  row (an integration test asserting call/query count).

## 3. Backend — Sales and Shipment propagation

- [ ] 3.1 Propagate the saved Tax Category snapshot to Sales lines created directly from a
  Customer Order and verify with an integration test asserting exact Tax Category equality.
- [ ] 3.2 Propagate the saved Tax Category snapshot to Sales lines created from a Customer
  Order-originated Shipment and verify with an integration test covering the same-currency and
  a foreign-currency case.
- [ ] 3.3 Verify a Customer Order-generated Shipment exposes no tax value (unset tax fields) on
  its own record and in its normal (non-Sales-purpose) preview, with an integration test.
- [ ] 3.4 Verify generic and EC Shipment tax behavior is unchanged by this feature, with a
  regression test on existing non-Customer-Order Shipment flows.

## 4. Backend — Fulfillment detail fields

- [ ] 4.1 Add persisted Delivery Date, Internal Memo, Prepayment Amount (with its "Yes"-requires
  a positive amount rule), and the Custom Shipping Address fields to the Customer Order model,
  and verify with model-level unit tests including the Prepayment Amount validation rule.
- [ ] 4.2 Relabel the existing Remarks field to Delivery Note Remarks and verify its existing
  persistence/shipping-slip reflection is unchanged (regression test).
- [ ] 4.3 Propagate Delivery Date, Internal Memo, Prepayment Amount, and Custom Shipping Address
  to the generated shipping slip on shipment creation, and verify with an integration test per
  field.
- [ ] 4.4 Implement "shipment-creation modal overrides only fields it fills in" (blank modal
  field falls back to the order's value) and verify with a unit test per field: modal blank
  falls back, modal filled overrides.

## 5. Backend — Order List and Batch Registration

- [ ] 5.1 Add Delivery Date to the Order List read/filter query and to its export payload, and
  verify with an integration test asserting filtering and export contents.
- [ ] 5.2 Rename the `order_receipt_date`-backed label to "Order Date" in both English and
  Japanese resources, on the list header and the batch registration column label, and verify
  with a snapshot/resource test.
- [ ] 5.3 Add Tax Category and Shipping Address to Customer Order batch create/update, with
  blank-cell-resolves / absent-column-preserves semantics, and verify with unit tests per case
  (new-line blank, existing-line blank, absent column, invalid value).
- [ ] 5.4 Verify new import patterns include the new fields while previously saved patterns are
  left untouched, with a unit test.
- [ ] 5.5 Add Delivery Date to Customer Order batch create and to the generated sample file, and
  verify with a unit test asserting the sample file contains the new column.

## 6. Frontend — Tax Classification UI

- [ ] 6.1 Add the Tax Category column to the Customer Order line table between Discount and Unit
  Price, sourced from active ordinary Tax Master records, and verify with a component test
  asserting column position and offered options.
- [ ] 6.2 Wire new-line default resolution and the null-vs-explicit-0% distinction into the line
  constructors used by manual add, product-template add, ranking-analysis initialization, and
  service search, and verify each entry point with a component/unit test.
- [ ] 6.3 Add the Tax Category checkbox/selector to the Apply to All editor with the
  selected-rows/current-group scope, and verify with a component test for checked and unchecked
  cases.
- [ ] 6.4 Add Tax Amount and Order Total (Incl. Tax) to the order summary, computed client-side
  with the same grouping/rounding contract as the backend, and verify against the same pinned
  calculation vectors used in backend task 2.2.
- [ ] 6.5 Preserve the source line's Tax Category snapshot in the Register New by Copying flow
  and verify with a component test that a copied null/manual-override/archived snapshot is
  retained.
- [ ] 6.6 Add stable `data-test` selectors for every new Tax Classification control (no reliance
  on translated text, product text, or row index) and verify with a lint/selector-contract
  check.

## 7. Frontend — Fulfillment details UI

- [ ] 7.1 Add the Delivery Date field below Order Date and verify with a component test for
  presence, position, and optionality.
- [ ] 7.2 Relabel the Remarks field to Delivery Note Remarks and verify the label change via a
  snapshot/resource test while its input behavior is unchanged.
- [ ] 7.3 Add the Internal Memo field below Delivery Note Remarks and verify with a component
  test.
- [ ] 7.4 Add the Prepayment Amount control below Total Gross Profit, defaulting to "No" with
  the amount input disabled, enabling on "Yes", and verify with a component test for both
  states.
- [ ] 7.5 Add the Custom Shipping Address option with required/optional input expansion and
  client-side required-field validation blocking Register, and verify with a component test for
  the blank-required-field and complete-input cases.
- [ ] 7.6 Add stable `data-test` selectors for every new fulfillment-detail control and verify
  with the same selector-contract check as 6.6.

## 8. Frontend — Order List and Batch Registration UI

- [ ] 8.1 Add the Delivery Date filter to the right of the Order Date filter and verify with a
  component test.
- [ ] 8.2 Add the Delivery Date column to the Order List table and its export/download
  configuration, using the standard L-DX date format, and verify with a component test.
- [ ] 8.3 Apply the "Order Delivery Date" → "Order Date" header rename in both EN and JA
  resources, on the list and the batch registration column label, and verify with a
  snapshot/resource test.
- [ ] 8.4 Add Tax Category, Shipping Address, and Delivery Date to the batch registration field
  options, table, and sample-file generation, and verify with a component test asserting all
  three appear.

## 9. E2E coverage

- [ ] 9.1 Harden the Customer Order Registration page object with constant row/group/action
  selectors and line-key scoping (prerequisite for reliable tax assertions) and verify the
  existing baseline scenario (`TC-Auto-IL-032` or equivalent) still passes.
- [ ] 9.2 Add an interactive journey covering default resolution (product/Sales/null), manual
  selection, explicit clear, Apply to All (checked and unchecked), and save/reload round-trip,
  and verify it passes headless in CI.
- [ ] 9.3 Add a mixed-tax-rate summary journey (Scenario 05) plus a foreign-currency/service-only
  case, and verify it passes headless in CI.
- [ ] 9.4 Add a batch journey covering valid/blank/invalid Tax Category and Shipping Address,
  including an old saved pattern without the new columns, and verify it passes headless in CI.
- [ ] 9.5 Add a Customer Order → Shipment → Sales journey asserting the Shipment stays
  tax-neutral while Sales receives the exact source Tax Category, and verify it passes headless
  in CI.
- [ ] 9.6 Add a fulfillment-details journey: register Delivery Date / Internal Memo / Prepayment
  Amount / Custom Shipping Address, create a shipment, and assert all values on the generated
  slip via an authenticated API read, including one case where the shipment modal leaves a field
  blank and the order's value survives.
- [ ] 9.7 Add an Order List journey asserting the Delivery Date column and filter and the
  renamed header in both locales, and a Batch Registration Settings journey asserting Delivery
  Date in options/table/sample file.
- [ ] 9.8 Verify an existing guest/unauthorized user still cannot access the new Tax Category or
  fulfillment-detail controls (regression on existing permission behavior).

## 10. Cross-cutting verification

- [ ] 10.1 Run the full new/changed test suite (BE unit + integration, FE unit + component, E2E)
  together and confirm all pass, including the pre-existing regression cases listed above.
- [ ] 10.2 Confirm every new/changed label has both English and Japanese resource entries and
  that every Japanese domain term from the PRD (税区分, 税額, 受注金額（税込）, 全行に適用, 納期,
  納品書備考, 社内メモ, 前払金額, 出荷住所, 受注日) is preserved verbatim in code/resources.
