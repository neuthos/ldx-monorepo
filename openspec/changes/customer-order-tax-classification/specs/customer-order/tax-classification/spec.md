## Purpose

Let Customer Order lines record a per-line Tax Category so tax-exempt, reduced, and standard
rates can coexist on a single order, downstream Sales stays Invoice-System compliant, and
changing rates across many lines does not require manual per-line edits.

## ADDED Requirements

### Requirement: Tax Category selector on Customer Order line
The system SHALL provide a Tax Category selector on each Customer Order product line,
positioned between the Discount and Unit Price fields, offering the active ordinary tax rates
registered in the Tax Category Master.

#### Scenario: Selector shows active ordinary rates
- **WHEN** a user opens Order Entry and adds a product line
- **THEN** the Tax Category dropdown lists the active ordinary tax rates registered in the Tax
  Category Master (for example 10%, 8%, 0%)
- **AND** archived tax rates and tax-exempt/tax-free master records are not offered

### Requirement: Default Tax Category resolution for new lines
When a user does not explicitly select a Tax Category for a new line, the system SHALL resolve
a default in this order: the product's configured default tax rate, then the current default
Sales tax, then no Tax Category. The system SHALL NOT hard-code a fixed default such as 10%.

#### Scenario: Product default tax applies
- **WHEN** a user adds a line for a product that has its own default tax rate configured and
  does not select a Tax Category
- **THEN** the line's Tax Category is set to the product's default tax rate

#### Scenario: Falls back to default Sales tax
- **WHEN** a user adds a line for a product without its own default tax rate and does not
  select a Tax Category
- **THEN** the line's Tax Category is set to the current default Sales tax

#### Scenario: Falls back to no Tax Category
- **WHEN** neither the product nor the Sales configuration has a default tax rate and the user
  does not select a Tax Category
- **THEN** the line is saved with no Tax Category

### Requirement: No Tax Category is distinct from an explicit 0% selection
The system SHALL treat "no Tax Category" as a value distinct from an explicit ordinary "0%"
selection, in storage, display, and tax calculation.

#### Scenario: Null Tax Category survives reload as null
- **WHEN** a line is saved with no Tax Category and the order is reopened
- **THEN** the line still shows no Tax Category, not 0%

#### Scenario: Explicit 0% survives reload as 0%
- **WHEN** a line is saved with Tax Category explicitly set to 0% and the order is reopened
- **THEN** the line still shows 0%, not blank

### Requirement: Existing lines preserve their saved Tax Category
The system SHALL preserve a Customer Order line's previously saved Tax Category when an update
to that line does not change the Tax Category field, and SHALL NOT re-resolve product or
default tax for it.

#### Scenario: Later product default change does not affect saved lines
- **WHEN** a product's default tax rate is changed after a Customer Order line referencing that
  product was saved with a resolved Tax Category
- **THEN** the previously saved line keeps its original Tax Category unchanged

### Requirement: Apply to All bulk Tax Category update
The system SHALL let a user apply one Tax Category to multiple lines through a dedicated
checkbox and selector in the "Apply to All" dialog. The system SHALL NOT change any line's Tax
Category when the checkbox is left unchecked. When checked, the update SHALL affect the rows
the user selected, or, when none are selected, every active row in the current product group;
it SHALL NOT affect rows outside that scope, and it SHALL NOT act as a sticky default for lines
added afterward.

#### Scenario: Checked Apply to All updates target lines
- **WHEN** a user selects several 10% lines, opens Apply to All, checks Tax Category, chooses
  8%, and applies
- **THEN** every targeted line's Tax Category becomes 8%
- **AND** the Tax Amount and Order Total (Incl. Tax) are recalculated

#### Scenario: Unchecked Apply to All leaves lines untouched
- **WHEN** a user opens Apply to All, leaves the Tax Category checkbox unchecked, sets the
  dropdown to a different rate, and applies
- **THEN** no line's Tax Category changes

### Requirement: Tax Amount and Order Total (Incl. Tax) summary
The system SHALL compute and display a Tax Amount and an Order Total (Incl. Tax) for the order,
without persisting them, calculated from each line's post-discount net amount, grouped by Tax
Category, and rounded once per group using the order's existing Sales rounding policy at the
transaction currency's precision.

#### Scenario: Single-rate totals
- **WHEN** an order has one line at quantity 2, unit price 10,000, and Tax Category 10%
- **THEN** Tax Amount is 2,000 and Order Total (Incl. Tax) is 22,000

#### Scenario: Reduced-rate totals
- **WHEN** an order has one line at quantity 1, unit price 10,000, and Tax Category 8%
- **THEN** Tax Amount is 800 and Order Total (Incl. Tax) is 10,800

#### Scenario: Non-taxable line contributes zero tax
- **WHEN** an order has one line at quantity 1, unit price 10,000, and Tax Category 0%
- **THEN** Tax Amount is 0 and Order Total (Incl. Tax) is 10,000

#### Scenario: Mixed-rate totals are grouped and summed per rate
- **WHEN** an order has one line at quantity 1, unit price 10,000, Tax Category 10%, and a
  second line at quantity 1, unit price 5,000, Tax Category 8%
- **THEN** the tax-exclusive total is 15,000, Tax Amount is 1,400 (1,000 + 400), and Order
  Total (Incl. Tax) is 16,400

#### Scenario: Discount is applied before tax
- **WHEN** a line has a discount reducing its net unit price before tax is calculated
- **THEN** Tax Amount is calculated on the post-discount net amount, not the pre-discount price

### Requirement: Tax Category propagates unchanged to Sales
The system SHALL propagate each line's saved Tax Category snapshot, unchanged, to Sales records
created directly from the Customer Order and to Sales records created from a Customer
Order-originated Shipment. The system SHALL NOT re-resolve product or default tax at
Sales-creation time on these paths.

#### Scenario: Direct Customer Order to Sales propagation
- **WHEN** Sales is created directly from a Customer Order line with a saved Tax Category
- **THEN** the resulting Sales line carries the exact same Tax Category

#### Scenario: Shipment-originated Sales propagation
- **WHEN** Sales is created from a Shipment that originated from a Customer Order line with a
  saved Tax Category
- **THEN** the resulting Sales line carries the exact same Tax Category as the source Customer
  Order line

### Requirement: Customer Order-originated Shipment stays tax-neutral
The system SHALL NOT persist or display a Customer Order tax value on a Shipment generated from
a Customer Order.

#### Scenario: Generated shipment exposes no Customer Order tax
- **WHEN** a Shipment is generated from a Customer Order with lines carrying Tax Categories
- **THEN** the Shipment's own tax-related fields remain unset and no Customer Order Tax
  Category is shown on the Shipment

### Requirement: Post-closing-date and permission behavior unchanged
The system SHALL NOT alter the existing restriction preventing Customer Order registration
after the closing date, and SHALL NOT alter existing authority/guest access restrictions or
archival behavior, as a result of this feature.

#### Scenario: Closing-date restriction still applies
- **WHEN** a user attempts to register a Customer Order after the closing date
- **THEN** registration is blocked exactly as it was before this feature, regardless of Tax
  Category

### Requirement: Apply to All performance stays within existing bounds
The system SHALL apply a bulk Tax Category update to all target lines within the same
performance characteristics as the existing Apply to All feature (a single bulk update rather
than one call per row).

#### Scenario: Bulk apply completes as a single operation
- **WHEN** a user applies a Tax Category to many lines via Apply to All
- **THEN** the update completes without a separate round trip per line
