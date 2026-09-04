## Purpose

Capture the delivery date, delivery note, internal memo, prepayment, and custom shipping
address information that Order Entry needs, and hand each of them off correctly to the shipping
slip generated from the order.

## ADDED Requirements

### Requirement: Delivery Date field
The system SHALL provide an optional Delivery Date field on Order Entry/Order Details,
positioned below the Order Date field, selectable via a calendar control. The system SHALL
persist the value and reflect it in the Delivery Date of the shipping slip generated from the
order.

#### Scenario: Delivery Date saved and reflected on shipping slip
- **WHEN** a user sets a Delivery Date on Order Entry and registers the order, then a shipping
  slip is created for it
- **THEN** the Delivery Date is saved on the order and shown as the shipping slip's Delivery
  Date

#### Scenario: Delivery Date remains optional
- **WHEN** a user registers an order without setting a Delivery Date
- **THEN** registration succeeds and the order has no Delivery Date

### Requirement: Delivery Note Remarks field (renamed)
The system SHALL rename the Order Entry panel field previously labeled "Remarks" to "Delivery
Note Remarks". The field's existing text-input behavior and its existing reflection into the
shipping slip's Delivery Note Remarks SHALL be unchanged.

#### Scenario: Renamed label with existing behavior preserved
- **WHEN** a user opens Order Entry
- **THEN** the field previously labeled "Remarks" is labeled "Delivery Note Remarks"
- **AND** text entered there still saves and appears as the shipping slip's Delivery Note
  Remarks

### Requirement: Internal Memo field
The system SHALL provide an Internal Memo text field on Order Entry, positioned below Delivery
Note Remarks. The system SHALL persist it and reflect it in the Internal Memo of the shipping
slip generated from the order.

#### Scenario: Internal Memo saved and reflected on shipping slip
- **WHEN** a user enters text in Internal Memo and registers the order, then a shipping slip is
  created for it
- **THEN** the Internal Memo text is saved on the order and shown as the shipping slip's
  Internal Memo

### Requirement: Prepayment Amount field
The system SHALL provide a Prepayment Amount control that defaults to "No" with its amount
input disabled. Selecting "Yes" SHALL enable the amount input. The system SHALL reflect the
resulting value on the shipping slip generated from the order.

#### Scenario: Default is No with input disabled
- **WHEN** a user opens Order Entry for a new order
- **THEN** Prepayment Amount defaults to "No" and its amount input is disabled

#### Scenario: Selecting Yes enables the amount input
- **WHEN** a user changes Prepayment Amount to "Yes"
- **THEN** the amount input becomes enabled

#### Scenario: Prepayment amount reflected on shipping slip
- **WHEN** a user sets Prepayment Amount to "Yes" with a value and registers the order, then a
  shipping slip is created for it
- **THEN** the shipping slip shows the same Prepayment Amount value

### Requirement: Custom Shipping Address
The system SHALL default Shipping Address to "Shipping Address 1" and SHALL offer a "Custom"
option. Selecting Custom SHALL expand required inputs (Recipient Name, Postal Code, Country,
Prefecture, Address) and optional inputs (Recipient Name Furigana, Building Name, Phone
Number). The system SHALL block Register and show a field error when a required Custom input is
blank. On successful registration, the system SHALL reflect the entered Custom address values
on the shipping slip generated from the order.

#### Scenario: Blank required Custom field blocks registration
- **WHEN** a user selects Custom Shipping Address, leaves a required input blank, and clicks
  Register
- **THEN** registration is blocked and a field error is shown for the blank required input

#### Scenario: Complete Custom address saves and reflects on shipping slip
- **WHEN** a user selects Custom Shipping Address, fills all required inputs, and registers the
  order, then a shipping slip is created for it
- **THEN** registration succeeds and the shipping slip shows the entered Custom address values

### Requirement: Shipment-creation modal overrides only fields it fills in
When a shipment is created for an order carrying Delivery Date, Internal Memo, Prepayment
Amount, or Custom Shipping Address values, the system SHALL use the value the operator entered
in the shipment-creation modal for a field only when that modal field was filled in; a modal
field left blank SHALL fall back to the order's existing value rather than clearing it.

#### Scenario: Modal field left blank falls back to the order's value
- **WHEN** an order has an Internal Memo saved, and the operator creates a shipment through the
  shipment-creation modal without entering a memo there
- **THEN** the generated shipping slip's Internal Memo shows the order's saved value, not blank

#### Scenario: Modal field filled in overrides the order's value
- **WHEN** an order has an Internal Memo saved, and the operator enters a different memo in the
  shipment-creation modal
- **THEN** the generated shipping slip's Internal Memo shows the value entered in the modal
