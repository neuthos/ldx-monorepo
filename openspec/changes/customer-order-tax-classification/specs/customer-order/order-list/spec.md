## Purpose

Let the Order List show and filter Customer Order delivery dates, and make sure its date
columns are named correctly so "Order Date" always means the order's own date, not its delivery
date.

## ADDED Requirements

### Requirement: Delivery Date filter on Order List
The system SHALL add a Delivery Date filter, using calendar selection, to the Order List,
positioned to the right of the Order Date filter.

#### Scenario: Delivery Date filter narrows results
- **WHEN** a user sets a Delivery Date filter range on the Order List
- **THEN** only orders whose Delivery Date falls within that range are shown

### Requirement: Delivery Date column on Order List
The system SHALL add a Delivery Date column to the Order List table and to its downloadable
export, displayed in the standard date format, showing each order's registered Delivery Date.

#### Scenario: Delivery Date column shows registered data
- **WHEN** a user opens the Order List
- **THEN** a Delivery Date column is present showing each order's Delivery Date in the standard
  date format

#### Scenario: Delivery Date included in export
- **WHEN** a user downloads the Order List
- **THEN** the exported file includes the Delivery Date column

### Requirement: Order Date header rename
The system SHALL rename the Order List table header previously labeled "Order Delivery Date" to
"Order Date". The underlying data behind that column SHALL NOT change.

#### Scenario: Header shows renamed label
- **WHEN** a user opens the Order List
- **THEN** the column previously labeled "Order Delivery Date" is labeled "Order Date"
- **AND** it still shows the same underlying order date values as before
