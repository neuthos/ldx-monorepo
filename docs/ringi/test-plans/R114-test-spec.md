# R114 Filter and Column Corrections — Test Plan (sync r114-e5f8b4)

## 1. Summary
As-built retroactive plan over 63 FRs (11 BR). Coverage strategy: existing FE jest suites (19 files/131+ TC, PR-scoped coverage 80.82%) already lock selector contracts, domain building, and page wiring → Unit rows reference them; Integration rows lock per-screen `search_read` payloads (L2); E2E rows cover the 40 unmanifested pages (rows 21–60) as L3 smoke + 3 Seamless journeys. Pyramid by rows: Unit 50 (69%) / Integration 13 (18%) / E2E 9 (13% — justified: consolidated PRD page journeys; existing L3 already covers rows 1–20). BOUNDARIES: B/O/U/N/D/A/R/I/E all Covered except S = standard ACL, no change. Confidence high for rows 42–60 (jest-verified), medium for inline-filter rows (2,3,5,6,9,13,14,16,18,20–25,30,36–38,50 — smoke-level only). Unknowns: none PENDING; E2E branch decision recorded (continue on feat/ringi-114; ai/test-author branch is non-additive).

## 2. Data Preparation Summary
Master fixtures: product classification L1–5 tree (code+name), season master w/ fiscal_year_id, brand/item/color/size/size-preset codes, store groups 1–3, calendar year+periods, membership (parent+child, status active/merged), purchase-history line + point history w/ usage_detail, EC product request w/ 3 delivery dates + empty-date variant, prefecture/gender/dob variants. Failure variants: empty search_text (empty domain), partial date range (skipped leaf), non-stored final_delivery_date (OR-domain translation), JP-only names (charset), member w/o children.

## 3. Test Cases
| Test ID | Functional Requirement Covered | Test Types | Test Categories | Test Scenario | Test Step |
|---|---|---|---|---|---|
| TC-R114-001 | FR-R114-01 | Frontend Unit Testing | Happy Path | Product Master Registration form renders the corrected field set (reworded per as-built audit: the screen is a form, not a list) | Render the registration form; assert the product type (商品区分), product code, and product name inputs are present |
| TC-R114-002 | FR-R114-02 | E2E Integration Testing | Happy Path | Material Search merges material code+name | Open material-search; pick one merged 資材 picker; assert single ilike field payload |
| TC-R114-003 | FR-R114-03 | Frontend Unit Testing | Happy Path | Material Master form renders the merged supplier picker and material fields (reworded per as-built audit) | Render the material form; assert the merged supplier picker (supplier_code + supplier_name), material type, code, and name inputs are present |
| TC-R114-004 | FR-R114-04 | E2E Integration Testing | Happy Path | Services list merges service code+name and adds hierarchy+JAN filters | Set merged サービス picker + 階層1–5 + JANコード; assert domain |
| TC-R114-005 | FR-R114-05 | Frontend Unit Testing | Happy Path | Service create filters by hierarchy and season | Render create filter; select 階層1–5 + シーズン; assert values reach form state |
| TC-R114-006 | FR-R114-06 | E2E Integration Testing | Happy Path | Store List merges store code+name and splits date columns | Set merged 店舗 picker + 担当者/登録日/登録者; assert domain + two separate date columns render |
| TC-R114-007 | FR-R114-07 | Frontend Unit Testing | Happy Path | Store Master registration exposes store groups 1–3 | Open store-master form; assert 店舗グループ1/2/3 fields present |
| TC-R114-008 | FR-R114-08 | E2E Integration Testing | Happy Path | Customer master list merges code+name and adds PIC/date filters + columns | Set merged 得意先 + 担当者/登録日/登録者; assert domain; assert 登録日/登録者 columns + download contains them |
| TC-R114-009 | FR-R114-09 | Frontend Unit Testing | Happy Path | Billing To Master registration adds the 19 new fields | Render form; assert 郵便番号..締め日 fields present and persisted keys |
| TC-R114-010 | FR-R114-10 | Frontend Unit Testing | Happy Path | AP by Supplier collapses duplicate accounting-department filter | Render filter; assert exactly one 仕入計上部門 control |
| TC-R114-011 | FR-R114-11 | Frontend Unit Testing | Happy Path | AP Management collapses duplicate accounting-department filter | Same as TC-R114-010 on .../account-payable-management |
| TC-R114-012 | FR-R114-12 | Frontend Unit Testing | Happy Path | Payment Schedule collapses duplicate accounting-department filter | Same as TC-R114-010 on payment-schedule |
| TC-R114-013 | FR-R114-13 | Frontend Unit Testing | Happy Path | Sales return list adds return virtual warehouse filter | Assert 返品先仮想倉庫 select present and wired |
| TC-R114-014 | FR-R114-14 | Frontend Unit Testing | Happy Path | Purchase return list adds return-to + virtual warehouse filters | Assert both 返品先 and 返品先仮想倉庫 wired |
| TC-R114-015 | FR-R114-15 | E2E Integration Testing | Happy Path | Transfer-between-stores analysis adds 商品区分 | Set 商品区分; assert domain leaf classification |
| TC-R114-016 | FR-R114-16 | E2E Integration Testing | Happy Path | Continued product analysis adds 商品区分 | Same pattern on continued-product-analysis |
| TC-R114-017 | FR-R114-17 | E2E Integration Testing | Happy Path | Price change list adds brand filter | Set ブランド; assert brand_id leaf |
| TC-R114-018 | FR-R114-18 | E2E Integration Testing | Happy Path | EC order list adds accounting department | Set 計上部門; assert department leaf |
| TC-R114-019 | FR-R114-19 | E2E Integration Testing | Happy Path | EC order return adds PIC + accounting department | Set both; assert two leaves |
| TC-R114-020 | FR-R114-20 | E2E Integration Testing | Happy Path | Plan progress control adds hierarchy + classification | Set 階層1–5 + 商品区分; assert leaves |
| TC-R114-021 | FR-R114-21 | E2E Integration Testing | Happy Path | MD map display adds hierarchy/classification/season | Set filters; assert domain |
| TC-R114-022 | FR-R114-22 | E2E Integration Testing | Happy Path | Quotation list adds hierarchy + classification | Set filters; assert domain |
| TC-R114-023 | FR-R114-23 | E2E Integration Testing | Happy Path | Order list adds hierarchy + classification | Set filters; assert domain |
| TC-R114-024 | FR-R114-24 | E2E Integration Testing | Happy Path | Production process control merges factory/supplier/warehouse and adds PIC | Set merged pickers + 生産担当者 + 階層 + 商品区分; assert domain |
| TC-R114-025 | FR-R114-25 | Frontend Unit Testing | Happy Path | Material replenishment rule merges material code+name | Assert single merged picker wired |
| TC-R114-026 | FR-R114-26 | Frontend Unit Testing | Happy Path | Replenishment product list merges material code+name | Same on replenishment-product-list |
| TC-R114-027 | FR-R114-27 | Frontend Unit Testing | Happy Path | Material inventory/order history merges material code+name | Assert FilterFabric merged picker |
| TC-R114-028 | FR-R114-28 | E2E Integration Testing | Happy Path | Inventory history adds hierarchy L1–5 | Set 階層; assert five leaves |
| TC-R114-029 | FR-R114-29 | E2E Integration Testing | Happy Path | Reservation list adds store/source-store/brand/item | Set 店舗+取り寄せ元店舗+ブランド+アイテム; assert ec_reserve mapping per jest contract |
| TC-R114-030 | FR-R114-30 | E2E Integration Testing | Happy Path | Shipment information list drops 商品名 and adds warehouse/hierarchy/season | Assert column absent; set 倉庫名+階層+シーズン; assert domain |
| TC-R114-031 | FR-R114-31 | Frontend Unit Testing | Happy Path | Disposal registration adds product filter | Assert DisposalListFilter product → line_ids.product… mapping |
| TC-R114-032 | FR-R114-32 | Frontend Unit Testing | Happy Path | Inventory adjustment list adds product filter | Assert product leaf (jest-covered) |
| TC-R114-033 | FR-R114-33 | Frontend Unit Testing | Happy Path | Customer-order safety stock adds brand/item | Assert brand_id/item_id leaves |
| TC-R114-034 | FR-R114-34 | Frontend Unit Testing | Happy Path | Setting product class adds hierarchy/color/size/season/classification | Assert selector set renders |
| TC-R114-035 | FR-R114-35 | Frontend Unit Testing | Happy Path | Bubble chart exposes the shared analysis filter family | Assert InSeasonAnalysisFilters composition |
| TC-R114-036 | FR-R114-36 | Frontend Unit Testing | Happy Path | Pareto analysis exposes the shared analysis filter family | Same on pareto-analysis |
| TC-R114-037 | FR-R114-37 | Frontend Unit Testing | Happy Path | Allocation product maximum adds hierarchy/color/size + merged warehouse | Assert filter set incl. merged 入庫先倉庫 |
| TC-R114-038 | FR-R114-38 | Frontend Unit Testing | Happy Path | Allocation template creation adds same set | Same on create-template-for-allocation |
| TC-R114-039 | FR-R114-39 | Frontend Unit Testing | Happy Path | Movement slip adds 商品区分 | Assert classification leaf (FilterMovementSlip) |
| TC-R114-040 | FR-R114-40 | Frontend Unit Testing | Happy Path | Markdown analysis adds color/size | Assert color_id/size_id leaves |
| TC-R114-041 | FR-R114-41 | Frontend Unit Testing | Happy Path | Markdown gross-profit analysis adds color/size | Same on analysis-gross-profit |
| TC-R114-042 | FR-R114-42 | E2E Integration Testing | Happy Path | Wholesale shipment rate sends the full corrected payload | Set 商品区分/ブランド/アイテム/階層/シーズン/merged 得意先; assert domain (jest-locked contracts) |
| TC-R114-043 | FR-R114-43 | E2E Integration Testing | Happy Path | Category transition sends merged product/customer/store + groups + PIC | Set all; assert domain |
| TC-R114-044 | FR-R114-44 | E2E Integration Testing | Happy Path | Season analysis uses 表示シーズン + merged customer/store + groups + PIC | Set; assert display-season leaf + merged pickers |
| TC-R114-045 | FR-R114-45 | E2E Integration Testing | Happy Path | Category analysis matches season-analysis set | Set; assert domain parity |
| TC-R114-046 | FR-R114-46 | E2E Integration Testing | Happy Path | Each-product analysis adds designer user-select + registered PIC | Set デザイナー (user list) + 登録担当者; assert leaves |
| TC-R114-047 | FR-R114-47 | E2E Integration Testing | Happy Path | Ranking analysis matches each-product set | Set; assert parity |
| TC-R114-048 | FR-R114-48 | E2E Integration Testing | Happy Path | Color analysis sends display-season + full set | Set; assert domain |
| TC-R114-049 | FR-R114-49 | E2E Integration Testing | Happy Path | Size analysis matches color-analysis set | Set; assert parity |
| TC-R114-050 | FR-R114-50 | Frontend Unit Testing | Happy Path | Summary table with pictures exposes its filter set | Assert composition |
| TC-R114-051 | FR-R114-51 | Frontend Unit Testing | Happy Path | Aggregation organization existing PIC filter confirmed sufficient | Assert pic_id select present and functional (no new filter) |
| TC-R114-052 | FR-R114-52 | E2E Integration Testing | Happy Path | Aggregation product sends full product/store/designer set | Set; assert domain |
| TC-R114-053 | FR-R114-53 | Frontend Unit Testing | Happy Path | Sales detail aggregation adds store groups 1–3 | Assert store_group_1..3 leaves |
| TC-R114-054 | FR-R114-54 | Frontend Unit Testing | Happy Path | Aggregation customer adds accounting department | Assert customer_accounting_department_id leaf |
| TC-R114-055 | FR-R114-55 | E2E Integration Testing | Happy Path | Shooting instructions sends product/order-dest/final-delivery/delivery ranges | Set 商品+発注先+最終納期 FromTo+納品日 FromTo; assert OR-domain over 3 source dates + UTC bounds |
| TC-R114-056 | FR-R114-56 | Frontend Unit Testing | Happy Path | EC safety stock adds brand/item | Assert leaves |
| TC-R114-057 | FR-R114-57 | E2E Testing | Happy Path | B001 customer list filters by the four new fields | Journey: set 会員登録日 range+都道府県+性別+生年月日 range; results scope to non-merged members |
| TC-R114-058 | FR-R114-58 | E2E Testing | Happy Path | B001 downloads the current selection with conversions | Select 2 rows; download; assert gender/status columns converted |
| TC-R114-059 | FR-R114-59 | E2E Testing | Happy Path | Purchase history list applies all seven filters | Set 購買履歴番号+取引日+店舗+担当者+登録日+登録者+更新日; assert scoped results |
| TC-R114-060 | FR-R114-60 | E2E Testing | Happy Path | Purchase register uses store picker and merged PIC user selector | Pick 店舗 (auto virtual store/warehouse); pick 担当者; save; assert pic_id+pic_name stored |
| TC-R114-061 | FR-R114-61 | E2E Testing | Happy Path | Point history shows renamed columns | Assert 購買履歴番号 and 取引日 headers |
| TC-R114-062 | FR-R114-62 | E2E Testing | Happy Path | Point history applies the seven filters incl. usage detail | Set all incl. 利用内容; assert scoped rows |
| TC-R114-063 | FR-R114-63 | E2E Testing | Happy Path | Point history downloads with point_state conversion | Download; assert done/pending/cancelled localized |
| TC-R114-064 | FR-R114-44,48 | Frontend Unit Testing | Boundaries | All season selectors show [code] name (unified convention) | Assert label format across shared selectors (jest-covered DisplaySeason) |
| TC-R114-065 | FR-R114-55 | Frontend Unit Testing | Boundaries | Partial final-delivery range is skipped | Fill only From; assert no domain leaf (jest-covered) |
| TC-R114-066 | FR-R114-57 | Frontend Unit Testing | Edge case | Empty B001 filter submits empty domain | Submit with no fields; assert [] domain |
| TC-R114-067 | FR-R114-57 | Frontend Unit Testing | Edge case | OR-condition prefixes the B001 domain | condition=or with 8 fields; assert 11 '|' separators (jest-covered) |
| TC-R114-068 | FR-R114-60 | Frontend Unit Testing | Edge case | Merged-member rows are excluded/flagged | membership status=merged; assert download domain ['status','!=','merged'] + child row styling |
| TC-R114-069 | FR-R114-60 | Frontend Unit Testing | Boundaries | JP-only names render verbatim | Fixture with JP names; assert charset preserved in options |
| TC-R114-070 | FR-R114-57,59,60 | Frontend Unit Testing | Negative path | Write actions gated by hasWriteAccess | Without write access; assert register/download buttons disabled |
| TC-R114-071 | FR-R114-42..49 | Frontend Unit Testing | Happy Path | Shared selector family emits [code] name options with bare-name fallback | Assert option contracts (jest-covered ringi114.test) |
| TC-R114-072 | FR-R114-21..60 | E2E Testing | Happy Path | L3 smoke for the 40 unmanifested pages | Extend _ringi114-pages.ts rows 21–60; each page loads with filters rendered |
