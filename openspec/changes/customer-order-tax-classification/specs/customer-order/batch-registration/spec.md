## Purpose

Let Customer Orders imported in bulk carry Tax Category, Shipping Address, and Delivery Date
the same way manually registered orders do, without disturbing already-saved import patterns.

## ADDED Requirements

### Requirement: Tax Category batch field
The system SHALL add an optional Tax Category column to Customer Order bulk upload. A supplied
blank cell SHALL resolve a default Tax Category the same way an interactively created line does
(product default, then Sales default, then none). A supplied non-blank value not registered in
the Tax Category Master SHALL be rejected as a field error.

#### Scenario: Blank cell resolves default on a new line
- **WHEN** a bulk upload row creates a new order line with the Tax Category cell blank
- **THEN** the line's Tax Category resolves using the same product/default rule as an
  interactively created line

#### Scenario: Blank cell re-resolves default on an existing-line update
- **WHEN** a bulk upload row updates an existing order line and its Tax Category cell is
  present but blank
- **THEN** the line's Tax Category is re-resolved using the product/default rule

#### Scenario: Invalid Tax Category value is rejected
- **WHEN** a bulk upload row supplies a Tax Category value not registered in the Tax Category
  Master
- **THEN** the row is rejected with a field error and no line is silently defaulted

### Requirement: Absent Tax Category column preserves existing value
When an existing saved import pattern does not include the Tax Category column, an update
performed with that pattern SHALL preserve the order line's currently saved Tax Category
unchanged.

#### Scenario: Old saved pattern without the column leaves Tax Category untouched
- **WHEN** a bulk update uses a saved import pattern created before this feature, which has no
  Tax Category column
- **THEN** existing lines keep their currently saved Tax Category

### Requirement: Shipping Address batch field
The system SHALL add an optional Shipping Address column to Customer Order bulk upload,
accepting "ShipTo1" or "ShipTo2". A blank cell on a newly created order SHALL default to
Shipping Address 1. An absent column on an update SHALL preserve the order's existing Shipping
Address.

#### Scenario: Blank Shipping Address defaults to Shipping Address 1 on create
- **WHEN** a bulk upload row creates a new order with the Shipping Address cell blank
- **THEN** the order's Shipping Address is set to Shipping Address 1

#### Scenario: Absent Shipping Address column preserves existing value on update
- **WHEN** a bulk update uses a saved import pattern without a Shipping Address column
- **THEN** the order's existing Shipping Address is preserved

### Requirement: New import patterns include the new columns; saved patterns are unaffected
The system SHALL include Tax Category and Shipping Address as available fields when a user
creates a new Customer Order import pattern. The system SHALL NOT add these fields to
already-saved import patterns; a user may add them manually.

#### Scenario: New pattern offers the new fields
- **WHEN** a user creates a new Customer Order bulk import pattern
- **THEN** Tax Category and Shipping Address are available fields to include

#### Scenario: Existing saved pattern is unchanged
- **WHEN** a user opens a Customer Order bulk import pattern that was saved before this feature
- **THEN** the pattern still does not include Tax Category or Shipping Address unless the user
  adds them manually

### Requirement: Delivery Date batch field
The system SHALL add Delivery Date as a selectable field/option in Customer Order Batch
Registration Settings, as a column in the batch registration table, and in the generated sample
file.

#### Scenario: Delivery Date available in options, table, and sample file
- **WHEN** a user opens Customer Order Batch Registration Settings
- **THEN** Delivery Date is offered as a field option, appears as a column in the batch
  registration table, and appears in the downloaded sample file
