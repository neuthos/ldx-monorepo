## Why

Customer Order Registration/Detail has no "Tax Category" field, so orders cannot record tax
selection and downstream invoicing cannot separate consideration/tax by rate as the Invoice
System (Qualified Invoice Preservation Method) requires. There is also no "Apply to All" for
tax, so changing rates across many lines is manual and slow. A 2026-08-17 addendum to the same
approval (No. 0141) adds five more Customer Order fields (Delivery Date, a Remarks rename,
Internal Memo, Prepayment Amount, Custom Shipping Address) plus Order List and Batch
Registration changes that ride the same screens.

> Note: this exact PRD (Approval No. 0141) already has an extensively researched design,
> contract, and test plan under `docs/ringi/specs/2026-08-14-customer-order-tax-classification-design.md`
> (+ matching `contracts/` and `test-plans/` files), tracked internally as Ringi 141, with 25
> user-approved decisions (`DEC-01`–`DEC-25`) and no open questions. This OpenSpec change is a
> deliberate parallel capture of the same PRD in the `openspec/` convention; it must stay
> consistent with those approved decisions rather than re-litigate them.

## What Changes

- Add a nullable, line-level `税区分` (Tax Category) to Customer Order product lines, selected
  from active ordinary Tax Master records, defaulting via Product Master → default Sales Tax →
  null (never hard-coded to 10%).
- Add a Tax Category checkbox/selector to the "Apply to All" (`全行に適用`) dialog, scoped to
  selected rows or the current product group, affecting only existing rows.
- Add nonstored, computed "Tax Amount" (`税額`) and "Order Total (Incl. Tax)" (`受注金額（税込）`)
  summary fields, grouped by tax category and rounded per the existing Sales rounding policy.
- Add optional "Tax Category" and "Shipping Address" columns to Customer Order Bulk Upload,
  with blank-cell-resolves / absent-column-preserves semantics; existing saved import patterns
  are unaffected.
- Propagate the saved Tax Category snapshot to Sales (direct and Shipment-originated) without
  making Shipment a fiscal owner of Customer Order tax.
- Add "Delivery Date" (optional, calendar) below Order Date on Order Entry.
- Rename "Remarks" to "Delivery Note Remarks" (label only; existing shipping-slip reflection
  unchanged).
- Add "Internal Memo" (text) below Delivery Note Remarks, reflected on the shipping slip.
- Add "Prepayment Amount" (default "No"; "Yes" activates the amount input), reflected on the
  shipping slip.
- Extend Shipping Address with a "Custom" option that expands required (Recipient Name, Postal
  Code, Country, Prefecture, Address) and optional (Recipient Name Furigana, Building Name,
  Phone Number) inputs, reflected on the shipping slip.
- Add a "Delivery Date" filter and table column to the Order List; rename its "Order Delivery
  Date" header to "Order Date".
- Add "Delivery Date" as an option/column in Order Bulk Registration Settings.
- No change to: post-closing-date registration restriction, Apply-to-All performance
  characteristics, rounding method source (Contract Master), authority/guest restrictions, or
  archival behavior.

## Capabilities

### New Capabilities
- `customer-order/tax-classification`: Line-level Tax Category on Customer Order — selection,
  defaulting, Apply to All, computed Tax Amount / Order Total (Incl. Tax), and propagation to
  Sales.
- `customer-order/fulfillment-details`: Order Entry/Detail additions — Delivery Date, Delivery
  Note Remarks rename, Internal Memo, Prepayment Amount, and Custom Shipping Address, each
  reflected on the generated shipping slip.
- `customer-order/order-list`: Order List Delivery Date filter/column and the Order Date header
  rename.
- `customer-order/batch-registration`: Customer Order Bulk Upload additions — Tax Category,
  Shipping Address, and Delivery Date fields/columns, including saved-pattern compatibility.

### Modified Capabilities
- (none — no pre-existing `openspec/specs/` capabilities to modify; `openspec/specs/` is
  currently empty in this repo)

## Impact

- Order Entry / Order Details screens (`INV-100-002`, `INV-100-003`): line-item table, Apply to
  All dialog, summary/total area, header panel fields, Shipping Address block.
- Order List screen: filters, table columns/header, Excel/download export.
- Order Bulk Upload / Batch Registration Settings: field config, sample file, saved import
  patterns.
- Downstream shipping slip generation: Delivery Date, Delivery Note Remarks, Internal Memo,
  Prepayment Amount, Shipping Address fields.
- Downstream Sales creation (direct and Shipment-originated): tax propagation.
- Tax Category Master (read-only dependency; no changes to the master itself).
