# Ringi 114 — New Pages 61–70 (Filters by Name and Code) — Test Plan

## 1. Summary

**TL;DR:** 20 new test cases (TC-R114-073…092) close the 7 verified FE-only gaps
(FR-R114-64…70) from `docs/ringi/specs/2026-09-17-ringi-114-pages-61-70-design.md`: one
new filter component (page 61) and six code/name merged-picker collapses (pages 63, 65
×3, 66, 68, 69, 70 — using the spec's own row numbering). All are read-side
(`search_read`) changes on already-read-only screens; no BE or E2E manifest changes are
in scope per the design spec.

**Coverage & confidence:** All 7 FRs map to ≥1 TC (traceability table below); confidence
is high for FR-65/67/68/69/70 (direct code evidence, deterministic OR-domain behavior)
and medium for FR-66's third merge (customer-product code+name), whose exact component
shape is an open implementation choice in the spec, not a testing ambiguity — the
behavioral assertion (OR-match on code or name) holds regardless of which component is
built.

**Traceability inventory (FR → TC):**

| FR-ID | TC-IDs | Status |
|---|---|---|
| FR-R114-64 | TC-R114-073…079 | Pending |
| FR-R114-65 | TC-R114-080 | Pending |
| FR-R114-66 | TC-R114-081…084 | Pending |
| FR-R114-67 | TC-R114-085, 086 | Pending |
| FR-R114-68 | TC-R114-087, 088 | Pending |
| FR-R114-69 | TC-R114-089, 090 | Pending |
| FR-R114-70 | TC-R114-091, 092 | Pending |

**Pyramid — target vs actual:** Target ≈ Unit 70% / Integration 15–20% / E2E 5–10% by
rows. Actual: **19/20 (95%) Unit-level** (`Frontend Unit Testing`), **1/20 (5%)
Integration/E2E-level** (`E2E Integration Testing`, TC-R114-079). This is a deliberate
deviation, not an omission: every one of the 7 gaps is pure client-side domain-building
logic against an **already-existing** generic `search_read` endpoint (no new API
contract to integration-test) on **already-existing** pages (no new E2E journey to
manifest beyond the one page — page 61 — that gains real filtering for the first time).
TC-R114-079 covers that one genuinely new journey; adding further Integration/E2E rows
for the six picker-merge FRs would test the same OR-domain logic a second time through a
slower harness, which the project's BOUNDARIES guidance explicitly warns against
("do not manufacture cases to fill the checklist").

**BOUNDARIES summary (delta from this run only — see §"Metadata BOUNDARIES delta"
below for the exact proposed sheet edit):**

| Dim | Applies to this batch? | New TC refs |
|---|---|---|
| B | Yes — FR-64 Rate fields (1–5, no-selection ≠ 0) | TC-R114-074 |
| O | No — no resorting introduced | — |
| U | Yes — all 7 FRs render/preserve JP labels | TC-R114-078, 080, 088 |
| N | Yes — all 7 FRs, unset filter ⇒ no domain leaf | TC-R114-077, 084, 086, 092 |
| D | Partially — no new data-volume path; TC-R114-079 incidentally exercises existing pagination | none appended |
| A | No — no write/permission-gated path touched | — |
| R | No — pure read, no concurrent-write path | — |
| I | No — same `search_read` call/error path as today | — |
| E | Yes — FR-64's 3 date ranges need UTC day-boundary normalization | TC-R114-076 |
| S | No — no lifecycle/state field touched | — |

**Blast-radius summary:** FE-only, `ldx-frontend`. Touches: 1 new component
(`FilterCustomerCarte.tsx`) + 1 page wiring (`B008A.tsx`), 2 i18n string values, and 5
existing filter components collapsing 2 fields into 1 each. No BE model/controller
changes; no new endpoints; no E2E POM changes proposed (TC-R114-079 extends the
`/seamless-customer-management/customer-carte/` page's existing coverage rather than
adding a new one).

**Assumptions, unknowns, PENDING:**

- **[BLOCKER — deferred, not resolved here]** `.agents/skills/tdd-sheet-contract.md`
  (the locked contract this skill is supposed to follow "exactly" for Testcases-tab
  zones, strict status vocab, and cell-merge mechanics) does not exist anywhere in this
  repo, and the live sheet's actual `Testcases` tab format (multi-step text in one
  `Case` cell, `TC-ID` not merged across rows — see `TC-R114-001…072`) does not match
  this skill's own prose description (one step per row, merged `TC-ID`). Per the user's
  explicit direction this run, the sheet content below was **exported to a local
  workbook instead of written live** to `R114 - All`
  (`10MSZ_G7mSkLyd8FywJyHI5WAKmew8K-rfZ_UnsEDu-8`) — see
  `docs/ringi/test-plans/2026-09-17-ringi-114-pages-61-70-tdd-export.xlsx`. Someone with
  the real contract (or write access to confirm the live format) should paste it in.
- **[GAP — treated per user direction]** The sheet's `Treacibility Matrix` tab has **zero
  rows** for FR-R114-64…70 (confirmed via `find_in_spreadsheet`, 0 matches) — the design
  spec itself is still `Status: Draft` and separately flags this exact
  spec-to-canonical-docs sync gap as an Open Question. Per user direction, this run
  treated the spec as source of truth and generated TCs as if TM status were `Pending`
  for all 7 FRs, without writing to the TM tab (out of scope for this skill regardless).
- **[PENDING, from the design spec]** FR-66's third merge (customer-product code+name)
  is sourced from client-side `uniqBy`-derived option lists
  (`useCustomerProduct` @ `CustomerProductRegistration/hooks/useCustomerProduct.ts`), not
  a backend-searchable selector like the other six. TC-R114-083 asserts the
  code-or-name-match *behavior* only, independent of this choice.
- **[PENDING, from the design spec]** Whether `docs/ringi/prd/R114-prd.md` and the
  canonical `R114-spec.md`/`R114-test-spec.md` get updated to append rows 61–70 once
  this addendum is approved — unchanged from the design spec's own Open Questions;
  restated here because it also determines whether these 20 TCs eventually get folded
  into the canonical `Testcases` tab or stay a standalone addendum.

## 2. Data Preparation Summary

- **`membership.carte` fixtures (FR-64):** ≥3 rows under one `membership_id`, with
  distinct `carte_number`/`purchase_history_number` strings (including one JP-unicode
  value, e.g. `カルテ-テスト01`), `customer_service_attitude`/`customer_service_satisfaction`
  at boundary values `1` and `5` (plus one row with both left unset — must not default to
  `0`), `pic_id`/`registration_person` pointing at 2 distinct JP-named users, and
  `customer_service_date`/`registration_date`/`write_date` each spanning a distinct
  month so range boundaries are unambiguous. One row must have only a start or only an
  end date filled at the *fixture* level is not needed — the partial-range case
  (TC-R114-075) is a filter-input state, not a fixture state.
- **Locale fixtures (FR-65, FR-78, FR-80, FR-88):** `en`/`ja` resource bundles loaded as-is
  from `public/locales/{en,ja}/seamless_transaction_list.json` and the relevant `b008a`/
  `common` namespaces — no new keys needed for FR-64 (spec confirms all 9 already exist).
- **`useCustomerProduct` fixture (FR-66):** ≥4 rows with duplicate `product_code`/
  `customer_product_code` pairs (to exercise `uniqBy`) and ≥1 row with a JP
  `customer_product_name`.
- **Factory/Vendor/Store master fixtures (FR-68/69/70):** each needs ≥2 rows with
  independently-distinguishable `code` and `name` (not sharing a common prefix), plus one
  row with a JP `name` (e.g. 大阪工場 / 東京商事 / 渋谷店) to verify the merged `[code] name`
  label renders verbatim.
- **User ID Master fixture (FR-67):** ≥2 users where `login` and `user_id` are not
  substrings of each other, so an OR-match test can distinguish "matched by login" from
  "matched by user_id".
- **Failure/negative variants:** none required — every one of the 7 FRs is a pure
  read-side filter change with no new validation or write path (confirmed by the design
  spec's BOUNDARIES §A/§R/§I, all N/A).

## 3. Test Cases

| Test ID | Functional Requirement Covered | Test Types | Test Categories | Test Scenario | Test Step |
|---|---|---|---|---|---|
| TC-R114-073 | FR-R114-64 | Frontend Unit Testing | Happy Path | Should be able to submit each Customer Carte filter field individually and emit its correct Odoo domain leaf | 1. Render `FilterCustomerCarte` with a mock `onSubmit`. 2. Fill カルテ番号 with `CN-1`; submit; assert domain contains `['carte_number','ilike','CN-1']`. 3. Fill 購買履歴番号 with `PH-9`; submit; assert `['purchase_history_number','ilike','PH-9']`. 4. Select 担当者 via the `UserSelector` (`pic_id='6'`); submit; assert `['pic_id','=','6']`. 5. Select 登録者 (`registration_person='7'`); submit; assert `['registration_person','=','7']`. 6. Set 接客態度 to `3`; submit; assert `['customer_service_attitude','=',3]`. 7. Set 総合接客満足度 to `5`; submit; assert `['customer_service_satisfaction','=',5]`. |
| TC-R114-074 | FR-R114-64 | Frontend Unit Testing | Boundaries | Should clamp the two Rate filters to 1–5 and omit the leaf when nothing is selected | 1. Render with no Rate value set; submit; assert neither `customer_service_attitude` nor `customer_service_satisfaction` appears in the domain (not `0`). 2. Set 接客態度 to the low boundary `1`; submit; assert `['customer_service_attitude','=',1]`. 3. Set 総合接客満足度 to the high boundary `5`; submit; assert `['customer_service_satisfaction','=',5]`. 4. Assert the `<Rate>` control exposes exactly 5 selectable values (1–5), matching `FormSelfScoringCustomerCarte.tsx:17-27`. |
| TC-R114-075 | FR-R114-64 | Frontend Unit Testing | Boundaries | Should skip a Customer Carte date-range filter entirely when only one end is filled | 1. Fill only the start of 接客日時; submit; assert no `customer_service_date` leaves. 2. Fill only the end of 登録日; submit; assert no `registration_date` leaves. 3. Fill only the start of 更新日; submit; assert no `write_date` leaves. 4. Fill both ends of all three; submit; assert each emits its `>=`/`<=` pair. |
| TC-R114-076 | FR-R114-64 | Frontend Unit Testing | Boundaries | Should UTC-normalize all three Customer Carte date ranges using startOfDay/endOfDay, matching FilterCustomerPointHistory's convention | 1. Fill 接客日時 with `[2026-01-01, 2026-01-31]`; submit; assert the leaves equal `DateConfig.to_BE_DateString(start,{withTime:true,toUtc:true,adjust:'startOfDay'})` and the `endOfDay` equivalent for the end date. 2. Repeat for 登録日 and 更新日; assert the same adjust convention applies per field. |
| TC-R114-077 | FR-R114-64 | Frontend Unit Testing | Edge case | Should submit an empty domain when every Customer Carte filter is left blank, leaving the membership-scoped list unfiltered | 1. Render `FilterCustomerCarte`; submit with no fields filled; assert `onSubmit` called with `[]`. 2. Assert `B008A`'s existing `membership_id in [...]` domain leaf is unchanged and no additional narrowing is merged in. |
| TC-R114-078 | FR-R114-64 | Frontend Unit Testing | Boundaries | Should render all nine Customer Carte filter labels verbatim under both locales | 1. Render `FilterCustomerCarte` under the `ja` locale; assert all nine labels (カルテ番号, 接客日時, 接客態度, 総合接客満足度, 購買履歴番号, 担当者, 登録日, 登録者, 更新日) render verbatim with no missing-key fallback. 2. Render under the `en` locale; assert the corresponding English labels resolve with no raw i18n key leaking. |
| TC-R114-079 | FR-R114-64 | E2E Integration Testing | Happy Path | Should narrow the live Customer Carte table when each of the nine filters is submitted from the page | 1. Navigate to `/seamless-customer-management/customer-carte/?id=<membership_id>` with ≥3 seeded carte rows covering distinct values per field. 2. Submit カルテ番号 alone; assert only the matching row(s) remain. 3. Submit 購買履歴番号 alone; assert matching narrowing. 4. Submit 担当者 alone; assert matching narrowing. 5. Submit 登録者 alone; assert matching narrowing. 6. Submit 接客態度 and 総合接客満足度 alone (each in turn); assert exact Rate-match narrowing. 7. Submit each of 接客日時/登録日/更新日 alone; assert boundary-inclusive narrowing. 8. Clear all filters; assert the table returns to the unfiltered membership-scoped list and `MyPagination`'s total reflects the correct unfiltered count. |
| TC-R114-080 | FR-R114-65 | Frontend Unit Testing | Edge case | Should render the Transaction List purchase-history column header as "Purchase History Number" / 購買履歴番号 in both locales | 1. Call `buildTableColumns(t)` with the `en` `seamless_transaction_list` resource; assert the `transaction_number` column's `title` is "Purchase History Number". 2. Call it with the `ja` resource; assert the title is "購買履歴番号". 3. Assert `trading_day`/`store_name`/`purchase_amount` column titles are unchanged — regression guard. |
| TC-R114-081 | FR-R114-66 | Frontend Unit Testing | Happy Path | Should search Customer Product Registration by a single merged 商品コード/商品名 picker using an OR match | 1. Render `Filter` with a `useCustomerProduct` fixture containing distinct `product_code`/`product_name` pairs. 2. Type a partial product code into the merged picker; assert the matching option surfaces. 3. Type a partial product name into the same picker; assert the matching option surfaces. 4. Select an option; submit; assert `onSearch`'s domain narrows by that product (code-or-name OR leaf, or the equivalent id-equality leaf per the shared selector convention). |
| TC-R114-082 | FR-R114-66 | Frontend Unit Testing | Happy Path | Should search Customer Product Registration by a single merged 得意先コード/得意先名 picker using an OR match | 1. Render `Filter` with distinct `customer_code`/`customer_name` fixture pairs. 2. Type a partial customer code; assert the matching option surfaces. 3. Type a partial customer name; assert the matching option surfaces. 4. Select an option; submit; assert `onSearch`'s domain narrows by that customer. |
| TC-R114-083 | FR-R114-66 | Frontend Unit Testing | Happy Path | Should search Customer Product Registration by a single merged 得意先商品コード/得意先商品名 picker sourced from useCustomerProduct's client-side option list | 1. Render `Filter` with a fixture containing duplicate and unique `customer_product_code`/`customer_product_name` pairs. 2. Assert the merged picker's option list is de-duplicated the same way today's separate `optCustomerProductCode`/`optCustomerProductName` lists are. 3. Select by typing the code; assert `onSearch` narrows correctly. 4. Select by typing the name; assert `onSearch` narrows correctly. |
| TC-R114-084 | FR-R114-66 | Frontend Unit Testing | Edge case | Should emit no domain leaf for any of the three merged Customer Product Registration pickers when left unset | 1. Render `Filter`; submit without touching the 商品/得意先/得意先商品 pickers; assert `onSearch`'s domain has no code/name leaves for any of the three pairs. 2. Assert the already-existing 色 (`color_id`) / サイズ (`size_id`) filters (excluded from this spec) still submit unaffected — regression guard. |
| TC-R114-085 | FR-R114-67 | Frontend Unit Testing | Happy Path | Should search User ID Master by a single merged ユーザー名/ユーザーID field using an OR match | 1. Render `FilterUserIDMaster`; expand advanced filters. 2. Type a value matching only `login` (not `user_id`); submit; assert the merged field still narrows via `login`. 3. Type a value matching only `user_id` (not `login`); submit; assert the merged field narrows via `user_id`. |
| TC-R114-086 | FR-R114-67 | Frontend Unit Testing | Edge case | Should leave the merged field and the rest of User ID Master's filters unaffected when unset | 1. Submit `FilterUserIDMaster` with every field blank; assert `onSubmit`'s field values carry no `login`/`user_id` value. 2. Assert 所属店舗 (`department_store_id`, already-existing, excluded from this spec) still submits independently. |
| TC-R114-087 | FR-R114-68 | Frontend Unit Testing | Happy Path | Should search Factory Master by a single merged 工場コード/工場名 FactorySelector that actually syncs, fixing today's non-sync bug | 1. Render `FactoryList`'s `FormSearch` with `FactorySelector` in place of the two `FInput` fields. 2. Type a partial factory code; assert the OR search (`['|',['name','ilike',...],['code','ilike',...]]`) returns the matching factory. 3. Type a partial factory name; assert the same OR search returns the matching factory. 4. Submit; assert the search payload carries one selected factory, not two independently-typed unsynced text values as today. |
| TC-R114-088 | FR-R114-68 | Frontend Unit Testing | Boundaries | Should render a Japanese factory name verbatim in the merged `[code] name` option label | 1. Seed a factory fixture with a JP name (e.g. 大阪工場). 2. Render the merged `FactorySelector`; assert the rendered option label is exactly `[<code>] 大阪工場` with no mangled characters. |
| TC-R114-089 | FR-R114-69 | Frontend Unit Testing | Happy Path | Should search Vendor Master by a single default SupplierSelector instead of two code-only/name-only instances | 1. Render `VendorSearch`'s `FormSearch`; assert only one `SupplierSelector.Formik` renders (no separate code-only and name-only instances). 2. Type a partial supplier code; assert matching suppliers surface. 3. Type a partial supplier name; assert the same field also matches by name — unlike today's split fields. 4. Submit; assert 国 (`country_id`) and the expand-only ステータス (`status`) filters still compose into the search payload unaffected. |
| TC-R114-090 | FR-R114-69 | Frontend Unit Testing | Edge case | Should keep VendorSearch's existing FormSearch test coverage green after collapsing the two SupplierSelector instances | 1. Update the existing `VendorSearch/partials/__tests__/FormSearch.test.tsx` fixtures/assertions that reference the separate code-only/name-only `SupplierSelector` instances to reference the single merged instance. 2. Run the updated suite; assert the country filter, expand/collapse, and status filter assertions all still pass. |
| TC-R114-091 | FR-R114-70 | Frontend Unit Testing | Happy Path | Should search Cart Setting Management by a single merged 店舗コード/店舗名 StoreSelector | 1. Render `B029F`'s `Filter` with `StoreSelector` replacing the two `FSelectDebounce` instances that both wrote to `F.id`. 2. Type a partial store code; assert the matching store surfaces via `StoreSelector`'s OR domain. 3. Type a partial store name; assert the same field also matches by name. 4. Select a store; submit; assert `onSearch` receives a single `F.id` value, unchanged in shape from today. |
| TC-R114-092 | FR-R114-70 | Frontend Unit Testing | Edge case | Should emit no store filter when the merged B029F StoreSelector is left unset | 1. Render `B029F`'s `Filter`; submit without selecting a store; assert `onSearch`'s payload carries no `F.id` leaf. |
