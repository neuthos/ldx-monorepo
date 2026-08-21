# R114 — Filter and Column Corrections (As-Built Spec)

**Sheet**: R114 - All (`10MSZ_G7mSkLyd8FywJyHI5WAKmew8K-rfZ_UnsEDu-8`) · **Sync ID**: `r114-a7f3d9` · **Generated**: 2026-08-21 by `brainstorming` (retroactive/as-built run)

> Mode note: implementation for PRD rows 1–20 (phase 1) and most of 21–60 is already merged (FE PR #18661 + branch history). This spec documents **as-built behavior**, flags doc-vs-code deltas, and raises open points as sheet Question rows — it does not gate the existing implementation.

## 1. Objective, Scope, Non-goals

- **Objective**: unify list-screen filters and column definitions across 60 ERP pages per the R114 PRD (verbatim source: `docs/ringi/prd/R114-prd.md`): merged code+name pickers, product hierarchy (グループ階層１..５) filters, season/PIC/store-group filters, Seamless customer page filters, column renames, and Excel downloads.
- **Scope**: FE list/filter screens + standard Odoo `search_read` domains; BE fields verified read-only (all exist; no controller changes needed).
- **Non-goals**: storing `final_delivery_date` (see §4 caveat); new BE endpoints; rows 1–20 re-verification beyond existing E2E.

## 2. Current state (evidence)

- FE `feat/ringi-114-page-40-60` @ `cfe979c46d` (PR #18661 MERGED to `target/august-2026`; R114 range `072e3d8cc7^..HEAD`, 690 files). 19 jest suites / 131+ TC green; PR-scoped coverage 80.82% stmts.
- Shared selector families: `src/components/Templates/Selector/*` (50+) and `src/components/InSeasonAnalysisFilters/*` (covers the full rows-21–54 vocabulary: 階層1–5, 商品区分, シーズン, 表示シーズン=PeriodControl/DisplaySeason, デザイナー→user-select=DesignerSelector, merged 得意先/店舗 code+name, 店舗グループ1–3, 担当者=PICSelector).
- BE: all row-55–60 filter fields exist (§4). L-Pedia: RINGI-114 index page `1777893429`; precedent RINGI-7 (code+name pickers) with documented name-only exceptions (倉庫名, シーズン); row-30 decision recorded **pending** in L-Pedia.
- E2E `feat/ringi-114` @ `2b3d103a`: manifest `_ringi114-pages.ts` covers rows 1–20 only (20 pages, 4 POMs); L1×3/L2/L3 specs exist; rows 21–60 = coverage gap. `ai/test-author/r114-traceability` @ `d11a0d03` deletes those specs (behind/alternative — no merge value).

## 3. Traceability — BR/FR (1:1 with sheet TM; 11 BR, 63 FR)

Status legend: `Pending` = as-built documented, awaiting approval · `Question` = open point (see Q&A).

| FR | Status | Screen / Page (route) | Functional Requirement | BR |
|---|---|---|---|---|
| FR-R114-01 | Pending | Product Master Registration `/common/product-master-information/product-master-registration` | Filter by 商品区分, ブランド, アイテム, グループ階層１..５, シーズン, 展開カラー, 展開サイズ | BR-01 |
| FR-R114-02 | Pending | Material Search `/common/product-master-information/material-search` | Merge 資材コード+資材名 into one picker; add グループ階層１..５ filters | BR-01 |
| FR-R114-03 | Pending | Material Master `/common/product-master-information/material-detail` | Merge 仕入先コード+仕入先名; filter by 商品区分, グループ階層１..５, 展開カラー | BR-01 |
| FR-R114-04 | Pending | Services `/common/product-master-information/services` | Merge サービスコード+サービス名; add グループ階層１..５ and JANコード filters | BR-01 |
| FR-R114-05 | Pending | Service Create `.../services/create` | Filter by グループ階層１..５ and シーズン | BR-01 |
| FR-R114-06 | Pending | Store List `/common/common-features/common-settings/store-lists` | Merge 店舗コード+店舗名; add 担当者/登録日/更新日/登録者 filters; split 登録日 and 更新日 columns | BR-01 |
| FR-R114-07 | Pending | Store Master `/common/common-features/common-settings/store-master` | Add 店舗グループ1/2/3 | BR-01 |
| FR-R114-08 | Pending | Customer List `/common/common-features/common-settings/customer-lists` | Merge 得意先コード+名; add 担当者/登録日/登録者 filters; add 登録日/登録者 columns incl. download | BR-01 |
| FR-R114-09 | Pending | Billing To Master `/common/common-features/common-settings/billing-to-master` | Add 19 fields (郵便番号…締め日) to the master form | BR-01 |
| FR-R114-10 | Pending | AP by Supplier `/production-control/production-order-information/account-payable/account-payable-by-supplier` | Collapse duplicate 仕入計上部門 filter to one | BR-02 |
| FR-R114-11 | Pending | AP Management `.../account-payable-management` | Collapse duplicate 仕入計上部門 filter to one | BR-02 |
| FR-R114-12 | Pending | Payment Schedule `.../payment-schedule` | Collapse duplicate 仕入計上部門 filter to one | BR-02 |
| FR-R114-13 | Pending | Sales Return List `/inventory-control/returns-disposal-evaluation-changes/return-process-for-sales-change` | Add 返品先仮想倉庫 filter | BR-03 |
| FR-R114-14 | Pending | Purchase Return List `.../return-process-for-purchase-change` | Add 返品先 and 返品先仮想倉庫 filters | BR-03 |
| FR-R114-15 | Pending | Transfer Between Stores Analysis `/in-season-management/analysis/transfer-between-stores-analysis` | Add 商品区分 filter | BR-04 |
| FR-R114-16 | Pending | Continued Product Analysis `.../continued-product-analysis` | Add 商品区分 filter | BR-04 |
| FR-R114-17 | Pending | Price Change `/in-season-management/price-setting/price-change-setting/price-change` | Add ブランド filter | BR-04 |
| FR-R114-18 | Pending | EC Order Received List `/seamless-customer-management/ec-order-received/list` | Add 計上部門 filter | BR-04 |
| FR-R114-19 | Pending | EC Order Return `.../ec-order-received/return` | Add 担当者 and 計上部門 filters | BR-04 |
| FR-R114-20 | Pending | Plan Progress Control `/plan-product-development/image-and-specification-information/plan-progress-control` | Add グループ階層１..５ and 商品区分 filters | BR-04 |
| FR-R114-21 | Pending | MD Map Display `.../md-format-display` | Add グループ階層１..５, 商品区分, シーズン filters | BR-05 |
| FR-R114-22 | Pending | Quotation List `/production-control/production-order-information/quotation-list` | Add グループ階層１..５ and 商品区分 filters | BR-05 |
| FR-R114-23 | Pending | Order List `.../order-list` | Add グループ階層１..５ and 商品区分 filters | BR-05 |
| FR-R114-24 | Pending | Production Process Control `/production-control/production-progress-information/production-process-control` | Merge 工場/仕入先/倉庫 code+name; add 生産担当者, グループ階層１..５, 商品区分 | BR-05 |
| FR-R114-25 | Pending | Material Replenishment Rule `/in-season-management/material-control/material-replenishment-rule-setting` | Merge 資材コード+資材名 | BR-05 |
| FR-R114-26 | Question | Replenishment Product List `.../replenishment-product-list` | Merge 資材コード+資材名 — filter file exists pre-R114; confirm already-satisfied | BR-05 |
| FR-R114-27 | Pending | Material Inventory/Order History `.../material-inventory-order-history` | Merge 資材コード+資材名 | BR-05 |
| FR-R114-28 | Pending | Inventory History `/inventory-control/arrival-purchase-process/inventory-history` | Add グループ階層１..５ filters | BR-06 |
| FR-R114-29 | Pending | Reservation List `/inventory-control/reservation-instruction` | Add 店舗, 取り寄せ元店舗, ブランド, アイテム filters | BR-06 |
| FR-R114-30 | Question | Shipment Information List `/inventory-control/shipment-process/shipment-information-list` | Remove 商品名 column; add 倉庫名, グループ階層１..５, シーズン — L-Pedia records the column removal as pending; no FE trace | BR-06 |
| FR-R114-31 | Question | Disposal Registration `.../disposal-registration` | Add 商品 filter — page exists; no R114 trace | BR-06 |
| FR-R114-32 | Pending | Inventory Adjustment List `.../inventory-adjustment-list` | Add 商品 filter | BR-06 |
| FR-R114-33 | Question | Customer Order Safety Stock `.../customer-order-safety-inventory-setting` | Add ブランド/アイテム — filter file pre-dates R114 | BR-06 |
| FR-R114-34 | Question | Setting Product Class `/md-plan-analysis/top-down/setting-product-class` | グループ階層１..５, カラー, サイズ, シーズン, 商品区分 — rides shared selector; no page-level trace | BR-06 |
| FR-R114-35 | Question | Bubble Chart `.../bubble-chart-analysis` | グループ階層１..５, シーズン, 得意先, 商品区分 — filter file exists (R114-touched) but consumer wiring unverified | BR-06 |
| FR-R114-36 | Question | Pareto Analysis `.../pareto-analysis` | Same set as FR-35 — no file located | BR-06 |
| FR-R114-37 | Question | Product Maximum for Allocation `/in-season-management/allocation-process/product-maximum-setting-for-allocation` | グループ階層１..５, カラー, サイズ, merged 入庫先倉庫 — no trace | BR-06 |
| FR-R114-38 | Question | Create Template for Allocation `.../create-template-for-allocation` | Same set as FR-37 — no trace | BR-06 |
| FR-R114-39 | Question | Movement Slip `/in-season-management/analysis/stock-transfer/movement-slip` | 店舗移動分析 商品区分 — PRD row 39 alias ambiguity (vs row 15 店間移動分析 / menu entry 店舗移動分析-移動伝票) | BR-07 |
| FR-R114-40 | Pending | Markdown Analysis `.../markdown/analysis` | Add カラー/サイズ filters | BR-07 |
| FR-R114-41 | Pending | Markdown Analysis (Gross Profit) `.../markdown/analysis-gross-profit` | Add カラー/サイズ filters | BR-07 |
| FR-R114-42 | Pending | Wholesale Shipment Rate `.../analysis/wholesale-shipment-rate` | 商品区分, ブランド, アイテム, グループ階層１..５, シーズン, merged 得意先 code+name | BR-08 |
| FR-R114-43 | Pending | Category Transition `.../analysis/category-transition` | Merged 商品/得意先/店舗 code+name, ブランド, アイテム, 階層1–5, シーズン, 店舗グループ1–3, 担当者 | BR-08 |
| FR-R114-44 | Pending | Season Analysis `.../analysis/season-analysis` | 表示シーズン, merged 得意先/店舗, 店舗グループ1–3, 担当者 | BR-08 |
| FR-R114-45 | Pending | Category Analysis `.../analysis/category` | Same set as FR-44 | BR-08 |
| FR-R114-46 | Pending | Each Product Analysis `.../analysis/each-product-analysis` | + 商品区分, ブランド, アイテム, 階層1–5, シーズン, デザイナー user-select, 登録担当者 | BR-08 |
| FR-R114-47 | Pending | Ranking Analysis `.../analysis/ranking-analysis` | Same set as FR-46 | BR-08 |
| FR-R114-48 | Pending | Color Analysis `.../analysis/color-analysis` | 表示シーズン + full product/store set | BR-08 |
| FR-R114-49 | Pending | Size Analysis `.../analysis/size-analysis` | Same set as FR-48 | BR-08 |
| FR-R114-50 | Question | Summary Table with Pictures `.../analysis/summary-table-with-pictures` | カラー, サイズ, 階層1–5, 商品区分, ブランド, アイテム, シーズン — not in R114 diff | BR-09 |
| FR-R114-51 | Question | Aggregation Organization `.../analysis/aggregation-organization` | 担当者 — pic_id exists since 2024; add vs ensure? | BR-09 |
| FR-R114-52 | Pending | Aggregation Product `.../analysis/aggregation-product` | Full product/store/designer set (PRD row 52) | BR-09 |
| FR-R114-53 | Pending | Sales Detail Aggregation `.../analysis/sales-detail-aggregation` | 店舗グループ1–3 filters | BR-09 |
| FR-R114-54 | Pending | Aggregation Customer `.../analysis/aggregation-customer` | 計上部門 filter | BR-09 |
| FR-R114-55 | Pending | Shooting Instructions `/ec-shop-management/ec-product-setting/shooting-instructions/list` | Add 商品, 発注先, 最終納期 FromTo, 納品日 FromTo filters | BR-10 |
| FR-R114-56 | Pending | EC Safety Stock `/ec-shop-management/initial-setting/ec-shop-master-management/safety-stock-setting/safety-stock-setting-list` | Add ブランド/アイテム filters | BR-10 |
| FR-R114-57 | Pending | Customer List (B001) `/seamless-customer-management/customer-list/customer-list` | Add 会員登録日/都道府県/性別/生年月日 filters | BR-11 |
| FR-R114-58 | Pending | Customer List (B001) — download | Add Excel download incl. new fields | BR-11 |
| FR-R114-59 | Pending | Purchase History List `.../customer-purchase-history` | Add 購買履歴番号/取引日/店舗/担当者/登録日/登録者/更新日 filters | BR-11 |
| FR-R114-60 | Pending | Purchase History Register `.../customer-purchase-history/register` | 店舗 picker; merge 担当者ID+担当者 into one user selector | BR-11 |
| FR-R114-61 | Pending | Point History List `.../customer-point/history-list` | Rename 取引番号⇒購買履歴番号, 年月日⇒取引日 | BR-11 |
| FR-R114-62 | Pending | Point History List — filters | Add 取引日/授与日/店舗/利用内容/登録日/登録者/更新日 filters | BR-11 |
| FR-R114-63 | Pending | Point History List — download | Add Excel download | BR-11 |

BR one-liners (merged cells in sheet): BR-01 master-data lists use merged code+name pickers with R114 corrections · BR-02 AP/payment lists show one 仕入計上部門 filter · BR-03 return lists expose return-destination virtual warehouse filters · BR-04 planning/EC lists carry corrected product/classification filters · BR-05 production/material lists use merged code+name and hierarchy filters · BR-06 inventory/allocation lists expose corrected product/classification/warehouse filters · BR-07 markdown/transfer analyses expose color/size/classification filters · BR-08 sales analyses share one standardized filter family · BR-09 aggregation reports expose their R114 filter sets · BR-10 EC settings lists expose brand/item and shooting date filters · BR-11 Seamless customer pages expose corrected filters, columns, downloads.

## 4. Domain & impact

- Models: `membership.master` (prefecture_id_1 L172, gender L208, dob L211), `membership.point.history` (transaction_number/transaction_date/transaction_store_id/usage_detail_id/date_awarded/purchase_history_id), `membership.purchase.history` (+lines; pic_name), `ec.product.request` (3 delivery dates). All R114 filter fields exist BE-side; FE uses standard `search_read` — no controller change.
- **`final_delivery_date` caveat**: non-stored compute = max(photograph, measurement, manuscript delivery date) (`ldx_ec/models/ec_product_request.py` L27, L245–260). FE translates the 最終納期 range into an OR/AND domain over the three source fields (jest-verified). Server-side SQL filtering on the computed field itself would need a stored variant — recorded as out-of-scope unless QA rejects the OR-domain behavior.
- Masters pre-exist (size.master, first/second/third store group masters, calendar.*) — no-impact.

## 5. Contracts (FE↔BE)

- Selector convention: `[code] name` labels, fallback bare name; `ilike` for free text; ranges → `>=`/`<=` with `to_BE_DateString` UTC start/end-of-day; aliases registration→`create_date`, updated→`write_date` (jest-locked).
- Known convention tension (RINGI-7 vs L-Pedia name-only 倉庫名/シーズン) → Q&A #4.

## 6. BOUNDARIES walkthrough (spec-level; statuses/TC-refs owned by test-plan stage)

- **B**oundary values: date FromTo completeness (partial range skipped — jest-locked); Applies.
- **O**rdering: lists keep default sort `create_date desc, id desc`; Applies (minor).
- **U**nicode & encoding: JP terms verbatim in labels/i18n keys; Applies (charset only).
- **N**ullability: unset filters emit no domain leaf; empty options; Applies.
- **D**ata-validity: `prefecture_id_1` mapping; merged-member exclusion `['status','!=','merged']`; Applies.
- **A**ccess: `hasWriteAccess` gates register/download buttons; Applies.
- **R**equired-ness: store/virtual-store/warehouse required on register; Applies.
- **I**18n: every changed string via `t()` with en/ja locales; Applies.
- **E**rror handling: search onError paths (modal, membership fetch); Applies.
- **S**ecurity/permission: read-only list + gated write actions; standard Odoo ACL; Applies (no change).
Detailed probes → spec-test-plan-agent.

## 7. Impact & gap inventory

See `docs/ringi/research/R114-impact-gap.md` (classified: covered / no-impact / out-of-scope / PENDING). Gaps → Question rows FR-26/30/31/33–38/50/51/39 + E2E rows 21–60 coverage gap (test-plan scope).

## 8. Doc-vs-code deltas

1. Rows 26/31/33/34/35/50: filter implementations exist on disk but pre-date the R114 commit range (likely earlier phase) — treated as already-satisfied pending confirmation (Q&A #5).
2. Rows 36/37/38: no implementation located — needs explicit decision (Q&A #5).
3. Row 30: L-Pedia records the 商品名 removal decision as pending; no FE trace (Q&A #1).
4. Row 39 alias: PRD 店舗移動分析 vs menu 店舗移動分析-移動伝票 vs row 15 店間移動分析 (Q&A #2).
5. Row 51: pic_id filter exists since 2024 — add vs ensure (Q&A #3).
6. E2E: manifest covers rows 1–20 only; `ai/test-author/r114-traceability` is non-additive (deletes specs).

## 9. Decisions & open questions

Decisions recorded as-built: OR-domain translation for 最終納期 (non-stored compute); registration/updated date aliases; download scope = current filter domain + merged exclusion. Open questions live in sheet Q&A (5 rows: #1 row-30 removal, #2 row-39 alias, #3 row-51 add-vs-ensure, #4 season code+name convention, #5 pre-existing/missing filter rows 26/31/33–38/50).
