# FE ↔ E2E selector contract reference

Use this reference when choosing or reviewing selectors. The exact project convention wins if repository evidence establishes one.

## Status rules

- **Existing:** cite the exact FE/E2E file, symbol, and selector string. If only a visible label or role exists, say so and classify the selector mechanism accurately.
- **Existing — unstable:** the element is found, but the locator depends on a class, generated ID, DOM order, or changing text. Add a proposed stable alias rather than hiding the risk.
- **Proposed:** the element is required but no stable selector exists. FE owns adding the selector; E2E must not implement a workaround as the contract.
- **PENDING:** the element, page, behavior, or identity cannot be determined from the supplied documents/evidence.

## Preferred selector order

1. Stable feature-prefixed `data-testid` for dynamic or business-critical controls.
2. Accessible role + stable accessible name for standard controls.
3. Stable label association for a form field when the label is intentionally user-facing and localized behavior is known.
4. Existing project-specific test attribute only when its convention and stability are evidenced.

Avoid using as a primary contract:

- CSS utility or styling classes;
- generated React/Odoo IDs;
- array indexes or `nth()` without a stable row identity;
- mutable business values as the only locator;
- localized text when a stable test attribute or role/name is available.

## Repeated row pattern

Define a row root and an identity strategy. Examples:

```text
data-testid="customer-order-tax-line"
data-line-key="<stable line/product key>"
data-testid="customer-order-tax-line-tax-classification"
data-testid="customer-order-tax-line-tax-rate"
```

The contract must state whether E2E finds a row by product code, SKU, backend line ID, or another stable identity. If the identity is not available before save, mark the identity strategy `PENDING` instead of relying on row position.

## Naming guidance

- Prefix by feature and business surface, not by component implementation: `customer-order-tax-*`.
- Name by user purpose: `...-register-button`, `...-tax-classification-select`, `...-apply-all-modal`, `...-summary-tax-amount`.
- Use one selector per semantic contract. Do not ask E2E to infer that two unrelated controls share a selector.
- Keep Japanese labels in the contract when they are visible: `税区分 (Tax Classification)`, `全行に適用 (Apply to All)`, `税額 (Tax Amount)`, `受注金額(税込) (Order Amount Including Tax)`.
