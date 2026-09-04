# R114 — Code Design

**Spec**: [R114-spec.md](./R114-spec.md)  
**Scope**: FE filter/column corrections across 60 ERP pages (63 FRs)  
**Constraint**: No new BE endpoints — all filter fields already exist; standard `search_read` only.

---

## 1. Design Principles

- Reuse existing infrastructure: `src/components/Templates/Selector/*` and `src/components/InSeasonAnalysisFilters/*`
- No new selector components unless the entity has no existing selector
- All merged pickers use `searchField="code_name"` → renders `[code] name` label
- Unset filter → emit no domain leaf (never push empty clause to domain array)
- Date aliases are jest-locked: `registration_date → create_date`, `updated_date → write_date`

---

## 2. Implementation Patterns

All 63 FRs fall into one of five patterns.

---

### Pattern A — Add filter to analysis screen (InSeasonAnalysisFilters)

**Applies to**: FR-15, 16, 17, 21, 22, 23, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 52, 53, 54

These pages already use `InSeasonAnalysisFiltersAdvanced`. Adding a filter = adding a key to `includes`.

```tsx
// Before
const filterFields = ['period_control.season_id', 'store.id']

// After (e.g. FR-15: add 商品区分)
const filterFields = [
  'period_control.season_id',
  'product_attribute.classification_id',  // ← add
  'store.id',
]
```

If the filter key does not yet exist in the filter registry, add it in two places:

```ts
// 1. src/components/InSeasonAnalysisFilters/utils.ts
//    Map key → filter component function
export const available_in_season_filters = {
  ...existingFilters,
  'product_attribute.classification_id': productClassificationFilter,
}

// 2. src/data.types.ts → InSeasonAnalysisFilterDataModel
interface InSeasonAnalysisFilterDataModel {
  product_attribute?: {
    classification_id?: number  // ← add field
    // ...
  }
}
```

---

### Pattern B — Merge code+name picker

**Applies to**: FR-02, 03, 04, 06, 08, 24, 25, 27, 42, 43, 60

Replace two separate code/name inputs with one selector using `searchField="code_name"`.

```tsx
// Before — two separate inputs
<Input name="supplier_code" placeholder="仕入先コード" />
<Input name="supplier_name" placeholder="仕入先名" />

// After — one merged selector
import { SupplierSelector } from 'components/Templates/Selector/SupplierSelector'

<SupplierSelector
  name="supplier_id"
  searchField="code_name"  // renders [code] name in dropdown
  valueField="id"
/>
```

Domain mapping change:

```ts
// Before (two separate domain leaves)
const domain = [
  ...(supplier_code ? [['supplier_code', 'ilike', supplier_code]] : []),
  ...(supplier_name ? [['supplier_name', 'ilike', supplier_name]] : []),
]

// After (single ID match)
const domain = [
  ...(supplier_id ? [['supplier_id', '=', supplier_id]] : []),
]
```

---

### Pattern C — Collapse duplicate filter

**Applies to**: FR-10, 11, 12

Three AP screens have two identical `仕入計上部門` filter inputs. Remove one render and one domain leaf.

```tsx
// Before
<DivisionSelector name="purchase_division_id"   label="仕入計上部門" />
<DivisionSelector name="purchase_division_id_2" label="仕入計上部門" />  // ← remove

// After
<DivisionSelector name="purchase_division_id" label="仕入計上部門" />
```

```ts
// Before domain
const domain = [
  ...(val ? [['purchase_division_id', '=', val]] : []),
  ...(val ? [['purchase_division_id', '=', val]] : []),  // ← remove
]

// After domain
const domain = [
  ...(val ? [['purchase_division_id', '=', val]] : []),
]
```

---

### Pattern D — Column changes + Excel download

**Column rename** (FR-61 — Point History List):

```tsx
// Before
{ key: 'transaction_number', header: '取引番号' }
{ key: 'date',               header: '年月日' }

// After
{ key: 'transaction_number', header: '購買履歴番号' }
{ key: 'date',               header: '取引日' }
```

**Column split** (FR-06 — Store List: split 登録日/更新日):

```tsx
// Before — one combined column
{ key: 'create_update_date', header: '登録日/更新日' }

// After — two separate columns
{ key: 'create_date', header: '登録日' }
{ key: 'write_date',  header: '更新日' }
```

**Excel download** (FR-08, 58, 63) — follow existing download pattern:

```tsx
<DownloadButton
  disabled={!hasWriteAccess}
  onClick={() =>
    handleDownload({
      domain: currentFilterDomain,      // same domain as the current search
      fields: downloadFields,
      filename: 'customer-list.xlsx',
    })
  }
/>
```

> Download scope = current filter domain + `['status', '!=', 'merged']` exclusion (jest-locked).

---

### Pattern E — FR-55: 最終納期 OR-domain translation

`final_delivery_date` is a non-stored compute field (`ec_product_request.py` L245–260).  
Server-side SQL filtering is not available. FE translates the date range into an OR domain across three source fields.

```ts
// src/views/ECShopManagement/.../components/shootingInstructionsFilter.ts

const FINAL_DELIVERY_SOURCES = [
  'photograph_delivery_date',
  'measurement_delivery_date',
  'manuscript_delivery_date',
] as const

function buildFinalDeliveryDomain(from?: string, to?: string): Domain {
  if (!from && !to) return []

  return buildOrDomain(
    FINAL_DELIVERY_SOURCES.flatMap((field) => {
      const clauses: Domain = []
      if (from) clauses.push([field, '>=', toBEDateString(from, 'start')])
      if (to)   clauses.push([field, '<=', toBEDateString(to, 'end')])
      return clauses
    })
  )
}
```

---

## 3. Seamless Customer Screens (FR-57..63)

These touch `membership.master`, `membership.point.history`, and `membership.purchase.history`.  
All BE fields already exist (read-only). No controller changes.

### FR-57/58 — Customer List (B001): new filters + download

```ts
// New filter fields and their domain mapping
interface CustomerListFilters {
  member_registration_date?: [string, string]  // → alias create_date range
  prefecture_id_1?: number
  gender?: 'male' | 'female' | 'other'
  date_of_birth?: [string, string]
}

function buildCustomerListDomain(filters: CustomerListFilters): Domain {
  const { member_registration_date, prefecture_id_1, gender, date_of_birth } = filters
  return [
    ...dateRangeDomain('create_date', member_registration_date),
    ...(prefecture_id_1 ? [['prefecture_id_1', '=', prefecture_id_1]] : []),
    ...(gender          ? [['gender', '=', gender]]                   : []),
    ...dateRangeDomain('date_of_birth', date_of_birth),
    ['status', '!=', 'merged'],  // existing — do not remove
  ]
}
```

### FR-59 — Purchase History List: new filters

```ts
interface PurchaseHistoryFilters {
  purchase_history_number?: string   // 購買履歴番号
  transaction_date?: [string, string]
  store_id?: number
  pic_id?: number                    // 担当者
  create_date?: [string, string]     // 登録日
  create_uid?: number                // 登録者
  write_date?: [string, string]      // 更新日
}
```

### FR-60 — Purchase History Register: merge 担当者 picker

```tsx
// Before — two separate fields
<Input name="pic_id"   label="担当者ID" />
<Input name="pic_name" label="担当者" />

// After — one user selector
import { UserSelector } from 'components/Templates/Selector/UserSelector'

<UserSelector
  name="pic_id"
  searchField="code_name"
  valueField="id"
  label="担当者"
/>
```

### FR-61/62/63 — Point History List: rename columns + filters + download

```tsx
// Column renames (FR-61)
{ key: 'transaction_number', header: '購買履歴番号' }  // was 取引番号
{ key: 'transaction_date',   header: '取引日' }         // was 年月日

// New filter fields (FR-62)
interface PointHistoryFilters {
  transaction_date?: [string, string]
  date_awarded?: [string, string]
  store_id?: number
  usage_detail_id?: number           // 利用内容
  create_date?: [string, string]     // 登録日
  create_uid?: number                // 登録者
  write_date?: [string, string]      // 更新日
}
```

---

## 4. FR → Target File Map

| FR | Screen | Target File(s) |
|---|---|---|
| FR-01 | Product Master Registration | `src/views/Common/ProductMaster/ProductMasterRegistration/components/*Filter.tsx` |
| FR-02 | Material Search | `src/views/Common/ProductMaster/MaterialSearch/components/*Filter.tsx` |
| FR-03 | Material Master | `src/views/Common/ProductMaster/MaterialDetail/components/*Filter.tsx` |
| FR-04 | Services | `src/views/Common/ProductMaster/Services/components/*Filter.tsx` |
| FR-05 | Service Create | `src/views/Common/ProductMaster/Services/create/components/*Filter.tsx` |
| FR-06 | Store List | `src/views/Common/CommonSettings/StoreLists/components/*Filter.tsx` + column def |
| FR-07 | Store Master | `src/views/Common/CommonSettings/StoreMaster/components/*Filter.tsx` |
| FR-08 | Customer List | `src/views/Common/CommonSettings/CustomerLists/components/*Filter.tsx` + column def + download |
| FR-09 | Billing To Master | `src/views/Common/CommonSettings/BillingToMaster/components/BillingToMasterForm.tsx` |
| FR-10 | AP by Supplier | `src/views/ProductionControl/AccountPayable/APBySupplier/components/*Filter.tsx` |
| FR-11 | AP Management | `src/views/ProductionControl/AccountPayable/APManagement/components/*Filter.tsx` |
| FR-12 | Payment Schedule | `src/views/ProductionControl/AccountPayable/PaymentSchedule/components/*Filter.tsx` |
| FR-13 | Sales Return List | `src/views/InventoryControl/Returns/SalesReturn/components/*Filter.tsx` |
| FR-14 | Purchase Return List | `src/views/InventoryControl/Returns/PurchaseReturn/components/*Filter.tsx` |
| FR-15 | Transfer Between Stores Analysis | `*Filter.tsx` → add `product_attribute.classification_id` to `includes` |
| FR-16 | Continued Product Analysis | Same as FR-15 |
| FR-17 | Price Change | `*Filter.tsx` → add `product_attribute.brand_id` |
| FR-18 | EC Order Received List | `*Filter.tsx` → add `organization.division_id` |
| FR-19 | EC Order Return | `*Filter.tsx` → add `pic_id`, `organization.division_id` |
| FR-20 | Plan Progress Control | `*Filter.tsx` → add hierarchy 1–5, `classification_id` |
| FR-21..23 | MD Map / Quotation / Order List | `*Filter.tsx` → add hierarchy 1–5, `classification_id` |
| FR-24 | Production Process Control | `*Filter.tsx` → merge factory/supplier/warehouse pickers + new filters |
| FR-25 | Material Replenishment Rule | `*Filter.tsx` → merge 資材コード+資材名 |
| FR-26 | Replenishment Product List | Confirm already satisfied — no change if verified |
| FR-27 | Material Inventory/Order History | `*Filter.tsx` → merge 資材コード+資材名 |
| FR-28 | Inventory History | `*Filter.tsx` → add hierarchy 1–5 |
| FR-29 | Reservation List | `*Filter.tsx` → add store, source store, brand, item |
| FR-30 | Shipment Information List | Remove 商品名 column; add 倉庫名, hierarchy 1–5, season |
| FR-31 | Disposal Registration | `*Filter.tsx` → add 商品 filter |
| FR-32 | Inventory Adjustment List | `*Filter.tsx` → add 商品 filter |
| FR-33 | Customer Order Safety Stock | Confirm already satisfied — no change if verified |
| FR-34..38 | Setting Product Class / Bubble Chart / Pareto / Allocation | Confirm already satisfied or implement if missing |
| FR-39 | Movement Slip | Confirm alias: 店舗移動分析-移動伝票 = row-39 target |
| FR-40 | Markdown Analysis | `*Filter.tsx` → add color, size |
| FR-41 | Markdown Analysis (Gross Profit) | Same as FR-40 |
| FR-42 | Wholesale Shipment Rate | `*Filter.tsx` → add full product set + merged 得意先 |
| FR-43 | Category Transition | `*Filter.tsx` → add merged product/customer/store + full set |
| FR-44 | Season Analysis | `*Filter.tsx` → 表示シーズン + merged customer/store + store groups + pic |
| FR-45 | Category Analysis | Same as FR-44 |
| FR-46 | Each Product Analysis | `*Filter.tsx` → add full product/store/designer set |
| FR-47 | Ranking Analysis | Same as FR-46 |
| FR-48 | Color Analysis | `*Filter.tsx` → 表示シーズン + full product/store set |
| FR-49 | Size Analysis | Same as FR-48 |
| FR-50 | Summary Table with Pictures | Confirm already satisfied — no change if verified |
| FR-51 | Aggregation Organization | Confirm existing `pic_id` filter is sufficient — no change |
| FR-52 | Aggregation Product | `*Filter.tsx` → add full product/store/designer set |
| FR-53 | Sales Detail Aggregation | `*Filter.tsx` → add store groups 1–3 |
| FR-54 | Aggregation Customer | `*Filter.tsx` → add `organization.division_id` |
| FR-55 | Shooting Instructions | `*Filter.tsx` → add 商品, 発注先, 最終納期 (OR-domain), 納品日 |
| FR-56 | EC Safety Stock | `*Filter.tsx` → add brand, item |
| FR-57 | Customer List (B001) | `*Filter.tsx` → add 会員登録日, 都道府県, 性別, 生年月日 |
| FR-58 | Customer List (B001) download | Add Excel download button |
| FR-59 | Purchase History List | `*Filter.tsx` → add 7 new filter fields |
| FR-60 | Purchase History Register | Merge 担当者ID+担当者 into `UserSelector` |
| FR-61 | Point History List — columns | Rename 取引番号→購買履歴番号, 年月日→取引日 |
| FR-62 | Point History List — filters | `*Filter.tsx` → add 7 new filter fields |
| FR-63 | Point History List — download | Add Excel download button |

---

## 5. Key Shared Utilities

```ts
// Date range → domain (already exists, use as-is)
toBEDateString(date, 'start')  // UTC start-of-day
toBEDateString(date, 'end')    // UTC end-of-day

// Unset filter guard — always wrap filter values:
const leaf = (value: any, clause: Domain[0]): Domain =>
  value != null && value !== '' ? [clause] : []

// OR-domain builder (for FR-55 最終納期):
function buildOrDomain(clauses: Domain): Domain {
  if (clauses.length === 0) return []
  if (clauses.length === 1) return clauses
  return clauses.reduce((acc, clause) => ['|', ...acc, clause] as Domain)
}

// Merged-member exclusion — always present on membership.master queries:
['status', '!=', 'merged']
```

---

## 6. Recommended Implementation Order

| Priority | FRs | Reason |
|---|---|---|
| 1 | FR-10, 11, 12 | Trivial — remove one line per screen |
| 2 | FR-15, 16, 17, 18, 19, 20 | One filter add to existing `includes` |
| 3 | FR-21..54 | Bulk — same pattern, analysis screens |
| 4 | FR-02, 03, 04, 24, 25, 27 | Picker merge, moderate change |
| 5 | FR-06, 07, 08 | Picker merge + column split + download |
| 6 | FR-55 | OR-domain logic, needs unit test |
| 7 | FR-57..63 | New model fields, highest test coverage needed |

---

## 7. Testing Notes

Every filter change must cover (per BOUNDARIES checklist):

- **B** — partial date range (from only, to only, both, neither)
- **N** — unset filter emits no domain leaf
- **A** — `hasWriteAccess` gates download button
- **S** — merged exclusion `['status','!=','merged']` present on all membership queries
- **I** — `t()` wraps every new label string (en + ja locale keys)

For FR-55 specifically: jest-verify the OR-domain output for all combinations of the three source fields.
