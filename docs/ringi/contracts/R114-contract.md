# R114 Filter and Column Corrections — FE/BE/E2E Contract

**Source design:** `docs/ringi/specs/R114-spec.md` · **Source test plan:** `docs/ringi/test-plans/R114-test-spec.md` · **Sheet:** R114 - All (`10MSZ_G7mSkLyd8FywJyHI5WAKmew8K-rfZ_UnsEDu-8`, Status=Done)
**Contract status:** Ready for implementation (1 PENDING: E2E branch) · **Scope:** FE / BE / E2E · **Sync ID:** `r114-e5f8b4`

## 1. Contract Summary

### TL;DR
FE exposes stable `data-cy`/`data-testid` hooks on the R114 filter sets (majority already present and jest-verified); BE needs zero changes (all fields exist; standard `search_read`); E2E extends `_ringi114-pages.ts` by 40 pages (rows 21–60) + L2 FILTER_CASES + 3 Seamless journeys. Implementation can start on `feat/ringi-114` once the branch decision is confirmed.

### Coverage and confidence
- E2E test-plan rows mapped: 21/21 (8 E2E Testing + 13 E2E Integration). 100%.
- Pages mapped: 60 (60 existing FE routes / 0 proposed / 0 pending).
- Element contracts: 28 (22 Existing / 6 Proposed).
- BE/API contracts: 6 (6 Existing / 0 Proposed).
- Confidence: 85% — grounded in session-verified FE code, jest suites, BE model sweep, E2E manifest read; codebase-memory MCP unavailable this session (disclosed; evidence = targeted reads + research agents).

### Decisions and status
- `USER-APPROVED`: unify ALL selectors to `[code] name` incl. シーズン/倉庫名 (Q&A #4); existing Aggregation-Organization PIC filter sufficient (Q&A #3); rows 26–39/50 verified implemented (Q&A #1/#2/#5).
- `Existing`: routes ×60; shared selectors `InSeasonAnalysisFilters`; Seamless filters+jest coverage; 4 E2E POMs.
- `Proposed`: 40 manifest entries + 3 new POMs + 6 `data-testid` additions.
- `PENDING-001`: E2E branch — continue `feat/ringi-114` vs merge `ai/test-author/r114-traceability` (evidence: latter deletes the 6 r114 specs → non-additive; recommendation: continue on `feat/ringi-114`). Owner: user.

## 2. Scope and Contract Principles
In: R114 filter/column/download behaviors rows 1–60. Out: BE changes, L-Pedia doc updates, storing `final_delivery_date`. Selector policy: `data-cy` (repo convention) for business elements; label-based only where i18n-stable; row identity via record `id`. Ownership: FE owns selectors/semantics, BE owns data/error/state (unchanged), E2E consumes via POM.

## 3. E2E Journey and Page Map

| Journey ID | Test-plan IDs | Actor / Data | Ordered pages and routes | Business outcome | Status |
|---|---|---|---|---|---|
| JRN-R114-001 | TC-R114-057 | QA + member w/ prefecture/gender/dob | `/seamless-customer-management/customer-list/customer-list` | 4 new filters scope non-merged members | Existing page / Proposed journey |
| JRN-R114-002 | TC-R114-058 | QA + 2 selected rows | same as JRN-001 | selection download w/ gender+status conversion | Existing |
| JRN-R114-003 | TC-R114-059 | QA + member + purchase lines | `.../customer-purchase-history` | 7 filters apply to membership-scoped list | Existing |
| JRN-R114-004 | TC-R114-060 | QA + store w/ virtual WH | `.../customer-purchase-history/register` | store picker auto-fills virtual store/WH; merged PIC saves pic_id+pic_name | Existing |
| JRN-R114-005 | TC-R114-061 | QA + point history rows | `.../customer-point/history-list` | renamed headers 購買履歴番号/取引日 | Existing |
| JRN-R114-006 | TC-R114-062 | QA + usage_detail master | same as JRN-005 | 7 filters incl. 利用内容 | Existing |
| JRN-R114-007 | TC-R114-063 | QA | same as JRN-005 | download converts point_state | Existing |
| JRN-R114-008 | TC-R114-072 | QA + master fixtures | 40 routes rows 21–60 (see FE-mapping) | L3 smoke: pages load, filters render | Proposed (manifest ext.) |
| JRN-R114-009 | TC-R114-001..004,006,008,015..025,028..030,042..049,055 (13 grouped) | QA | L2 per route | `search_read` domain payloads match jest-locked contracts | Existing specs pattern / Proposed cases |

## 4. FE ↔ E2E Element Contract (key inventory; full set = per-filter `data-cy` below)

| Contract ID | Page / Component | Element / purpose | Locator | Status | POM action | Links |
|---|---|---|---|---|---|---|
| EC-001 | B001 filter | submit | `data-cy="submit-search-current-filter"` | Existing | `search()` | FR-57, TC-057 |
| EC-002 | B001 list | download button (DownloadExcel root) | `data-testid` on component root — none today | **Proposed** `data-testid="b001-download"` | `download()` | FR-58, TC-058 |
| EC-003 | B001 table | row checkbox | antd rowSelection (Table partials) | Existing — unstable | select via row key `id` | TC-058 |
| EC-004 | Purchase history filter | search | `data-cy="submit_filter"` (FilterLayout btnSearch on Seamless pages) | Existing | `search()` | FR-59 |
| EC-005..011 | Seamless filters | 7 fields (transaction_number input, store/pic selectors, 4 range pickers) | Form.Item names `transaction_number`…`updated_date` (FilterLayout ids) | Existing | `fill(field,value)` | FR-59/62 |
| EC-012 | Register store picker | store selector | `data-cy="storeSelector"` | Existing | `selectStore(code)` | FR-60 |
| EC-013 | Register PIC | user selector | component `UserSelector` value prop — no hook | **Proposed** `data-testid="purchase-register-pic"` | `selectPic(login)` | FR-60 |
| EC-014 | Point history headers | renamed columns | header text via POM `getTableHeaders()` | Existing | `assertHeaders()` | FR-61 |
| EC-015 | Point history usage detail | select | `#usage_detail_id` (antd id) | Existing — unstable | `selectUsage(name)` | FR-62 |
| EC-016 | Shooting filter | search | `data-cy="btnSearch"` | Existing | `search()` | FR-55 |
| EC-017..019 | Shooting filter | product/PIC/ranges | Form ids `ec_product_id`…`delivery_date` | Existing | fill helpers | FR-55 |
| EC-020..024 | InSeason filters | PIC/classification/brand/item/season selectors | `data-cy` `misc.pic_id`, `product_attribute.*`, `store.*_store_group_id`, `period_control.season_id` | Existing (jest-locked) | shared `AnalysisFilterPOM` | FR-21..54 |
| EC-025 | Analysis pages page root | smoke anchor | — | **Proposed** `data-testid="r114-page-root"` per page | `assertLoaded()` | TC-072 |
| EC-026 | Wholesale filter fields | brand/item/classification/product | `data-cy` `brand`, `item`, `product_classification`, product Formik | Existing | fill | TC-042 |
| EC-027 | Register virtual WH | auto-filled value | `#transaction_store_virtual_warehouse_id` | Existing | `assertValue()` | TC-060 |
| EC-028 | B001 filter fields | prefecture/gender/dob/registration | Form ids `prefecture_id`…`dob` | Existing | fill | TC-057 |

## 5. E2E POM Contract

| POM ID | Page Object | Route | Methods | Contracts | Fixtures | Status |
|---|---|---|---|---|---|---|
| POM-001 | CustomerListPOM | customer-list | `search`, `fillFilters`, `selectRows`, `download` | EC-001..003,028 | member w/ 4 attrs | Proposed |
| POM-002 | PurchaseHistoryPOM | customer-purchase-history | `search`, `fillFilters`, `assertScoped` | EC-004..011 | member+lines | Proposed |
| POM-003 | PurchaseRegisterPOM | /register | `selectStore`, `assertAutoVirtualWH`, `selectPic`, `save` | EC-012,013,027 | store w/ vWH | Proposed |
| POM-004 | PointHistoryPOM | history-list | `assertHeaders`, `fillFilters`, `download` | EC-014,015 | point rows | Proposed |
| POM-005 | AnalysisFilterPOM (shared) | rows 21–54 routes | `fill`, `search`, `assertDomain` | EC-020..026 | masters tree | Proposed |
| Existing | MaterialMaster/StoreMasterList/BillingToMaster/ContinuedProductAnalysis | rows 1–20 | (existing, unchanged) | — | — | Existing |

## 6. BE ↔ FE/E2E Data Contract (all Existing; standard `search_read`)

| ID | Model | Key fields | Semantics | Tests |
|---|---|---|---|---|
| BC-001 | membership.master | prefecture_id_1, gender, dob, create_date | writable; `['status','!=','merged']` exclusion FE-side | TC-057/058 |
| BC-002 | membership.purchase.history(+lines) | transaction_number(_ilike), transaction_date, transaction_store_id, pic, create/write_date aliases | ranges UTC start/end-of-day | TC-059/060 |
| BC-003 | membership.point.history | transaction_number, date_awarded, usage_detail_id, purchase_history_id (renames) | usage_detail master XML-backed | TC-061..063 |
| BC-004 | ec.product.request | 3 delivery dates; final_delivery_date non-stored max() | OR-domain over sources; no server-side SQL filter on computed | TC-055 |
| BC-005 | classification masters 1–5 / season / calendar | code+name `[code] name` options | unified per Q&A #4 | TC-021..054 |
| BC-006 | store group masters 1–3, size.master | options via search_read limit 20 | — | TC-006/007/033 |

## 7. Traceability
All 21 E2E rows → JRN-001..009 → element/BE contracts above (TC→JRN in §3). Unit/Integration FE rows covered by jest suites (see test-spec Remarks). Gap: none besides PENDING-001.

## 8. Owner Work Packets
**FE** (small): 1) add `data-testid="b001-download"` + `purchase-register-pic` + per-page `r114-page-root` (EC-002/013/025). **BE**: none. **E2E** (order): 1) resolve PENDING-001 (branch); 2) extend `_ringi114-pages.ts` rows 21–60 (JRN-008); 3) POM-005 shared analysis POM + L2 FILTER_CASES (JRN-009); 4) POM-001..004 Seamless journeys; 5) Answerkey tabs TC-057..063/072 execution.

## 9. PENDING Decisions
| ID | Decision | Owner | Blocking | Resolution |
|---|---|---|---|---|
| PENDING-001 | E2E branch: continue `feat/ringi-114` (recommended — `ai/test-author` deletes specs) | user | all E2E work | confirm branch |

## 10. Acceptance Criteria
All 21 E2E rows mapped; locators evidence-backed or Proposed+FE-owned; downstream pages included (B001→details, register→list); BE semantics explicit; packets dependency-ordered; no repo modified, no test executed.
