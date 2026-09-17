# Ringi 114 — New Pages 61–70 (Filters by Name and Code) — Design Spec

**Date:** 2026-09-17
**Status:** Draft
**Target repos:** FE (`FE_PWD` = `ldx-frontend`) only. No BE or E2E changes are required by this spec.

## Context

The user supplied a new batch of 11 rows (numbered 60–70) continuing the same Ringi 114
("Filters by name and code") PRD sheet whose rows 1–60 are already implemented and merged
(FE PR #18661, tracked in `docs/ringi/specs/R114-spec.md` and
`docs/ringi/tracking/2026-08-20-ringi-114-test-completeness.md`).

Row 60 (顧客ポイント履歴一覧) was verified byte-for-byte identical to the existing PRD row 60
and is already fully implemented (`B005.tsx`, `components.tsx`,
`FilterCustomerPointHistory.tsx`) — it is **excluded from this spec** per user decision.

Of rows 61–70, an as-built audit against the actual FE code (not just docs) found that
**3 of 10 asks are already implemented** (pages 62, 64, 67) and **2 are partially
implemented** (pages 65, 66 — some filters exist, some don't). Per user decision, already-
satisfied items are excluded entirely and partially-done pages are scoped to only their
missing pieces. This spec covers exactly the **7 remaining gaps**.

## Requirements (PRD / FR / BR)

- **Source PRD:** user-supplied table (this session, 2026-09-17), continuing the same R114
  PRD sheet's row numbering (rows 61–70). **Not yet appended** to
  `docs/ringi/prd/R114-prd.md` — recommend syncing that document after this spec is
  approved, continuing FR numbering from the existing `FR-R114-63` (last row in the
  canonical spec).
- **FR IDs covered (newly minted, continuing the canonical sequence):**

| ID | Original text (JP verbatim) | Notes |
|----|------|-------|
| FR-R114-64 | 61 顧客カルテ一覧 フィルター追加【カルテ番号】【接客日時】【接客態度】【総合接客満足度】【購買履歴番号】【担当者】【登録日】【登録者】【更新日】 | Page has zero filters today — full gap |
| FR-R114-65 | 63 取引一覧 "項目名を変更【取引番号】⇒【購買履歴番号】" | Column label unchanged in code — gap |
| FR-R114-66 | 65 得意先商品マスタ登録 商品コードと商品名を１つにまとめる／得意先コードと得意先名を1つにまとめる／得意先商品コードと得意先商品名を1つにまとめる | 3 merge-into-one-picker items; カラー・サイズ already exist — excluded |
| FR-R114-67 | 66 ユーザーIDマスタ ユーザー名とユーザーIDを１つにまとめる | 所属店舗 filter already exists — excluded |
| FR-R114-68 | 68 工場マスタ 工場コードと工場名を1つにまとめる | |
| FR-R114-69 | 69 仕入先マスタ 仕入先コードと仕入先名を1つにまとめる | |
| FR-R114-70 | 70 カート設定管理一覧 店舗コードと店舗名を１つにまとめる | |

- **Excluded (already satisfied, verified against code — not part of this spec):**
  - Row 60 顧客ポイント履歴一覧 — already implemented (see Context).
  - Row 62 顧客カルテ登録 担当者 — `FormSecondDetailCustomerCarte.tsx:50-52` already renders
    `<UserSelector/>` bound to `pic_id`, wired in both register (`B008C1.tsx`) and update
    (`B008C2.tsx:284`).
  - Row 64 原価管理一覧 グループ階層１..５ — `ProductPriceCostFilter.tsx:125-129,165-242`
    already has `first_classification_id`…`fifth_classification_id`.
  - Row 67 資材・付属表 商品検索 — `MaterialorAccessories.tsx:40-46` already has a
    `ProductSelector` labeled exactly `common:productSearch` (商品検索).
  - Row 65's カラー／サイズ — `CustomerProductRegistration/components/Filter/Filter.tsx:169-208`
    already renders `color_id`/`size_id` selects.
  - Row 66's 所属店舗 — `FilterUserIDMaster.tsx:116-124` already renders `department_store_id`
    (`common:department_store` = 所属店舗).

- **Japanese terms preserved:** 顧客カルテ一覧, カルテ番号, 接客日時, 接客態度, 総合接客満足度,
  購買履歴番号, 担当者, 登録日, 登録者, 更新日, 取引一覧, 取引番号, 得意先商品マスタ登録, 商品コード,
  商品名, 得意先コード, 得意先名, 得意先商品コード, 得意先商品名, ユーザーIDマスタ, ユーザー名,
  ユーザーID, 工場マスタ, 工場コード, 工場名, 仕入先マスタ, 仕入先コード, 仕入先名,
  カート設定管理一覧, 店舗コード, 店舗名.

## Objective

Close the 7 verified filter/search gaps across pages 61, 63, 65, 66, 68, 69, 70 by (a)
adding one new filter component (page 61) and (b) merging 6 pairs of synced-but-separate
code/name Select fields into single `[code] name` autocomplete pickers, reusing this
Ringi's already-standardized `Templates/Selector/*` convention.

## Scope

- New `FilterCustomerCarte` component for page 61, wired into `B008A.tsx`.
- One i18n label change for page 63.
- 6 merge-into-one-picker changes across pages 65 (×3), 66, 68, 69, 70.
- FE only. No Odoo model, controller, or migration changes — every target field already
  exists as a stored column and every screen already reads through generic `search_read`
  with an arbitrary domain.

## Non-goals

- Pages 60, 62, 64, 67 and the already-satisfied halves of 65/66 (see exclusions above) —
  no code changes proposed for these.
- Backend field additions or renames — the page 63 rename is a **display label only**; the
  underlying field `transaction_number` is unchanged (same convention already used for the
  row-60 rename).
- E2E manifest coverage — advisory only, not executed here (see Acceptance Criteria).

## Domain Model

Seven items span five bounded contexts, each already established elsewhere in this Ringi:

| FR | Aggregate / root | Entities read | Bounded context |
|----|----|----|----|
| FR-R114-64 | `membership.carte` (root, `_rec_name='carte_number'`) | `membership.carte` (carte_number, customer_service_date, customer_service_attitude, customer_service_satisfaction, purchase_history_number, pic_id, registration_date, registration_person, write_date) | Seamless Customer Management |
| FR-R114-65 | `membership.purchase.history` | same (display-only) | Seamless Customer Management |
| FR-R114-66 | `ldx_core.product.customer_product` (`CustomerProduct`) | product/customer/customer-product code+name pairs | Product Master |
| FR-R114-67 | `res.users` | `login`, `user_id` | Common / Org Master |
| FR-R114-68 | `res.partner` (`partner_classification='factory'`) | `code`, `name` | Production Control — Factory & Vendor |
| FR-R114-69 | `res.partner` (`partner_classification='supplier'`) | `code`, `name` | Production Control — Factory & Vendor |
| FR-R114-70 | `cart.setting` → `store_id` (`res.partner`, `partner_classification='store'`) | `store_id.code`, `store_id.name` | EC Shop Management |

- **Invariants protected:** none of these aggregates have their invariants touched — every
  change is a read-side (search/filter) UI change against existing `search_read` domains.
- **Value Objects:** none introduced; the merged `[code] name` picker is a presentation
  convention, not a domain VO.

## DDD Impact — Which `D` Changes

- **Behavior before:** page 61 has no query/filter capability beyond the selected member
  scope; pages 65/66/68/69/70 require the user to search code and name as two separate,
  independently-typed fields (some synced via `onChange`, some not synced at all — e.g.
  page 68's Factory Master fields don't sync today).
- **Behavior after:** page 61 gains 9 query filters against `membership.carte`; the 6 pairs
  become single autocomplete pickers matching the `[code] name` convention already
  standardized by this Ringi's BR-01 (`docs/ringi/specs/R114-spec.md` §3).
- **Invariants at risk:** none — all seven are read/query-side changes on already-read-only
  list/search screens. No create/write/state-transition path is touched.
- **Cross-context impact:** none — each FR stays within its own bounded context; no
  aggregate references another aggregate's internals as a result of this change.
- **External consumers outside `ldx_addons`:** not applicable — no backend change.

## FE / BE / E2E Contracts

- **Frontend** (`ldx-frontend`):
  - FR-64: `CustomerPointHistoryList`-sibling new file
    `views/SeamlessCustomerManagement/B008/partials/FilterCustomerCarte.tsx` (new), wired
    into `B008A @ src/views/SeamlessCustomerManagement/B008/B008A.tsx:56-73` (the
    `useMembershipCarteSearchRead` domain currently only has the `membership_id in [...]`
    leaf).
  - FR-65: `seamless_transaction_list @ public/locales/{en,ja}/seamless_transaction_list.json:21`
    (key `transaction_number`), consumed by `buildTableColumns @
    src/views/SeamlessCustomerManagement/TransactionList/hooks.tsx:160-162`.
  - FR-66: `Filter @
    src/views/Common/ProductMasterInformation/CustomerProductRegistration/components/Filter/Filter.tsx:120-314`.
  - FR-67: `FilterUserIDMaster @
    src/views/Common/CommonFeatures/UserIDMaster/partials/FilterUserIDMaster.tsx:74-83,150-159`.
  - FR-68: `FormSearch @
    src/views/ProductionControl/FactoryVendorInformation/FactoryList/partials/FormSearch.tsx:27-47`,
    reusing existing `FactorySelector @
    src/components/Templates/Selector/FactorySelector.tsx` (already defaults
    `searchField='code_name'`, `fields=['code','name']` — a ready-made merged picker).
  - FR-69: `FormSearch @
    src/views/ProductionControl/FactoryVendorInformation/VendorSearch/partials/FormSearch.tsx:46-93`,
    collapsing the existing two `SupplierSelector.Formik` instances into one with default
    props (drop the `valueField`/`searchField` overrides that currently split it into
    code-only / name-only instances).
  - FR-70: `Filter @
    src/views/ECShopManagement/InitialSetting/ECCartSettingManagement/B029F/partials/Filter.tsx:30-64`,
    reusing existing `StoreSelector @ src/components/Templates/Selector/StoreSelector.tsx`
    (already used by `FilterCustomerPointHistory.tsx:64-68` for the same res.partner
    store-classification search).
- **Backend** (`ldx-backend`): none touched. Verified stored fields:
  `ldx_ec/models/membership_carte.py:22-59` (carte_number, customer_service_date,
  customer_service_attitude, customer_service_satisfaction, purchase_history_number,
  pic_id, registration_date, registration_person); `ldx_core/base/res_partner.py:248-249`
  (`code`, `name`); `ldx_ec/models/cart_setting.py:17` (`store_id`).
- **E2E** (`ldx-e2e`): none touched by this spec (advisory only, see Acceptance Criteria).
- **API / data contracts:** all 7 items stay on the existing generic
  `/dataset/<model>/search_read` endpoint with an arbitrary `domain` array; no new
  endpoints. Backend field names are `snake_case` throughout (per project convention),
  e.g. `customer_service_date`, `purchase_history_number`.

## Data Flow

1. **FR-64:** user opens `/seamless-customer-management/customer-carte/?id=<membership_id>`
   → selects filter values in `FilterCustomerCarte` → `onSubmit` builds a domain array
   (ilike leaves for text fields, `>=`/`<=` UTC-adjusted leaves for the three date ranges,
   `=` leaves for `pic_id`/`registration_person`/the two `<Rate>` fields) → merged into
   `B008A.tsx`'s existing domain → `useMembershipCarteSearchRead` → `POST
   /dataset/membership.carte/search_read` → table re-renders.
2. **FR-65:** pure display — no runtime data flow change; only the i18n string resolved by
   `t('transaction_number')` changes.
3. **FR-66/67/68/69/70:** user selects one merged picker instead of two separate fields →
   picker's `onChange` sets one form value (`id` or the model's identifying field) →
   existing `handleSearchFactory`/`onSubmit`/`onSearch` domain-builder in each page (already
   present) emits the same `['code'|'name', ...]`-shaped or `[id_field, '=', id]` leaf it
   emits today — the domain-building logic itself is unchanged, only the input UI collapses
   from 2 fields to 1.

## Error Handling & Edge Cases (BOUNDARIES)

- **B** Boundary values: Applies only to FR-64 — `customer_service_attitude` /
  `customer_service_satisfaction` are `<Rate>` fields bounded 1–5 (matches the register
  form at `FormSelfScoringCustomerCarte.tsx:17-27`); filter must clamp/allow only that
  range and treat "no selection" as no domain leaf (not `0`). Date ranges: partial range
  (only start or only end filled) is skipped entirely, matching the existing convention in
  `FilterCustomerPointHistory.tsx:17-39`. N/A for FR-65 (no boundary). N/A for FR-66/67/68/69/70
  (merged pickers carry no new numeric boundary — same `id` equality as before).
- **O** Ordering: N/A — no list resorting; default sorts (`create_date desc, id desc` /
  `customer_service_date desc`) are unchanged by any of the 7 items.
- **U** Unicode & encoding: Applies to all seven — every JP label (カルテ番号, 接客日時,
  接客態度, 総合接客満足度, 購買履歴番号, etc.) must render verbatim in both `ja`/`en` locale
  files; FR-64 needs zero new i18n keys (all already exist in `b008a.json`/`common.json`
  per the Requirements section); FR-65 changes existing key values only, both locales.
- **N** Null/empty: Applies to all seven — an unset filter must emit **no** domain leaf
  (existing convention across every filter component read in this repo), not an empty-string
  or `false` leaf that would incorrectly narrow results.
- **D** Data volume: Applies to FR-64 only in the sense that zero/one/many carte rows must
  paginate correctly with the new domain leaves added — existing `MyPagination` /
  `usePagination` wiring in `B008A.tsx` is unchanged and already handles this. N/A for the
  other six (no new data-volume path).
- **A** Access & permissions: N/A — none of the 7 items touch write/permission-gated
  actions; all are read-only search refinements on screens already gated the same way
  before this change (`hasWriteAccess` continues to gate only the create/delete buttons,
  untouched by this spec).
- **R** Race conditions: N/A — pure read (`search_read`) with no concurrent-write path
  introduced.
- **I** Integration failures: N/A beyond what already exists — same `search_read`
  call/error path every affected screen already uses; no new endpoint, no new failure mode.
- **E** Environment: Applies to FR-64's three date-range filters — must use the same
  `DateConfig.to_BE_DateString(..., { withTime: true, toUtc: true, adjust:
  'startOfDay'|'endOfDay' })` UTC-normalization already used by `FilterCustomerPointHistory.tsx:17-39`,
  so JST-vs-UTC day-boundary behavior stays consistent across the two sibling screens. N/A
  for the other six (no date fields).
- **S** State transitions: N/A — no lifecycle/state field is created, modified, or filtered
  by any of the 7 items.

## Acceptance Criteria & Verification

- FR-64: submitting each of the 9 filters individually narrows the Customer Carte table to
  matching rows only; submitting with all filters empty returns the unfiltered
  membership-scoped list (same as today, before this change).
- FR-65: the Transaction List column header (and any tooltip/export label using the same
  key) reads "Purchase History Number" / 購買履歴番号 in both locales; no other column or
  filter label changes.
- FR-66/67/68/69/70: selecting a value in each merged picker performs the same search that
  today requires selecting the matching code+name pair; typing in the picker searches
  **both** code and name (OR domain), matching the convention already visible in this
  Ringi's other merged pickers (e.g. `CustomerSelector`).
- All seven: no jest suite regresses; every changed/new filter component gets a unit test
  asserting its emitted domain per field (mirroring
  `FilterCustomerPointHistory.test.tsx`'s pattern), and `yarn type-check` / eslint add no
  new errors.

> Note: this repo is read-only. Verification commands run in the target repo's own session,
> not here.

## Open Questions

- [PENDING] FR-66's third merge (customer-product code+name) is sourced from client-side
  `uniqBy`-derived option lists (`useCustomerProduct` data), not a backend-searchable
  selector like the other six — should it become a proper debounced backend selector (new
  FE data hook) or stay a client-side merged-option Select? Either satisfies the ask;
  the FE implementer should pick based on how large `useCustomerProduct`'s result set
  typically is (a large set argues for a backend-searched selector to avoid loading
  everything client-side).
- [PENDING] Should `docs/ringi/prd/R114-prd.md` and the canonical `R114-spec.md` be updated
  to append rows 61–70 / FR-64–70 once this spec is approved, so the canonical Ringi 114
  record stays complete? (This spec was deliberately kept as a separate dated file per
  user's earlier choice, but the canonical docs will drift out of sync with the PRD sheet
  until reconciled.)

## Implementation Handoff (advisory)

### FE — `FE_PWD` (`ldx-frontend`)

- **Goal:** Close the 7 gaps (FR-R114-64 through FR-R114-70) described above.
- **Scoped files/symbols:**
  - New: `src/views/SeamlessCustomerManagement/B008/partials/FilterCustomerCarte.tsx`
    (mirror `src/views/SeamlessCustomerManagement/CustomerPoint/HistoryList/FilterCustomerPointHistory.tsx`
    structurally — same `FilterLayout`/`DateConfig.to_BE_DateString` pattern).
  - Edit: `src/views/SeamlessCustomerManagement/B008/B008A.tsx` (render the new filter,
    merge its domain into the existing `useMembershipCarteSearchRead` call).
  - Edit: `public/locales/en/seamless_transaction_list.json:21` and
    `public/locales/ja/seamless_transaction_list.json:21` (`transaction_number` value only).
  - Edit: `src/views/Common/ProductMasterInformation/CustomerProductRegistration/components/Filter/Filter.tsx`
    (collapse 3 code/name pairs into merged pickers).
  - Edit: `src/views/Common/CommonFeatures/UserIDMaster/partials/FilterUserIDMaster.tsx`
    (collapse `login`+`user_id` into one merged field).
  - Edit: `src/views/ProductionControl/FactoryVendorInformation/FactoryList/partials/FormSearch.tsx`
    (replace two `FInput` fields with one `FactorySelector`).
  - Edit: `src/views/ProductionControl/FactoryVendorInformation/VendorSearch/partials/FormSearch.tsx`
    (replace two configured `SupplierSelector.Formik` instances with one default instance).
  - Edit: `src/views/ECShopManagement/InitialSetting/ECCartSettingManagement/B029F/partials/Filter.tsx`
    (replace two `FSelectDebounce` fields with one `StoreSelector`).
- **Relevant evidence & local rules:** backend fields are `snake_case` (user's global
  CLAUDE.md rule); this Ringi's `[code] name` merged-picker convention is documented in
  `docs/ringi/specs/R114-spec.md` §5 (Contracts); follow existing sibling patterns exactly
  rather than inventing new ones (see Domain Model / Contracts sections above for the exact
  sibling file to mirror per FR).
- **Ordered steps:** 1) FR-65 (trivial, unblock a quick win) → 2) FR-68/69/70 (drop-in
  existing selectors, no new component) → 3) FR-67 (small merge, existing `FInput`s) →
  4) FR-66 (3 merges, one bespoke) → 5) FR-64 (new component, largest item).
- **Acceptance criteria:** see Acceptance Criteria & Verification above.
- **Verification commands:** `yarn jest <changed test paths>`, `yarn type-check`,
  `yarn lint`, run in the FE repo's own session.
- **Cross-repo dependencies:** none — BE and E2E are unaffected by this spec.
