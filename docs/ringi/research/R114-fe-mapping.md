# R114 — FE PRD→Route Mapping (research agent output, 2026-08-21)

FE: ldx-frontend @ feat/ringi-114-page-40-60 cfe979c46d. Menu source: public/locales/ja/menu.json. Route verified vs src/pages/**.

## Verified mappings (route | view | filter implementation)
1 商品マスタ登録 | /common/product-master-information/product-master-registration | Common/ProductMasterInformation/ProductMasterRegistration | partials/Filter.tsx ✓ (NB: menu has 2nd entry 商品マスタ登録=product-duplicated)
2 資材マスタ | /common/product-master-information/material-search | MaterialSearch | inline/shared
3 資材マスタ登録 | /common/product-master-information/material-detail | MaterialMaster | inline/shared
4 サービスマスタ | /common/product-master-information/services | Services/ListService | ProductServiceFilter ✓
5 サービス登録 | .../services/create | CreateService | form screen
6 店舗マスタ | /common/common-features/common-settings/store-lists | StoreMaster/StoreList | inline/shared
7 店舗マスタ登録 | /common/common-features/common-settings/store-master | StoreMaster | form
8 得意先マスタ | .../customer-lists | CustomerMaster/CustomerLists | FilterCustomerList.tsx ✓
9 請求先マスタ | .../billing-to-master | BillingToMaster | inline/shared
10 仕入先別買掛金一覧 | /production-control/.../account-payable-by-supplier | AccountPayableBySupplier | AccountPayableBySupplierFilter ✓
11 買掛金管理表 | .../account-payable-management | AccountPayableManagement | filter ✓
12 支払予定一覧表 | .../payment-schedule | PaymentScheduleList | PaymentScheduleFilter ✓
13 売上返品一覧 | /inventory-control/returns-disposal-evaluation-changes/return-process-for-sales-change | ReturnProcessForSalesChange | inline/shared
14 仕入返品一覧 | .../return-process-for-purchase-change | same dir | inline/shared
15 店間移動分析 | /in-season-management/analysis/transfer-between-stores-analysis | TransferBetweenStoresAnalysis | FilterProduct/FilterProduct.tsx ✓
16 継続品回転分析 | .../continued-product-analysis | ContinuedProductAnalysis | not located
17 売価変更 | /in-season-management/price-setting/.../price-change | Markdown/Index | FilterPriceChangeList + FilterProductSearch ✓
18 EC受注一覧 | /seamless-customer-management/ec-order-received/list | B037 | list filter not located; detail FilterECOrderReceivedDetail ✓
19 EC受注返品 | .../ec-order-received/return | B038A | SearchProducts/FilterProductSearch ✓
20 企画進捗管理 | /plan-product-development/.../plan-progress-control | ProductKnowledgeMenu | not located
21 MDマップ表示 | .../md-format-display | CapDisplay | not located
22 見積一覧 | /production-control/production-order-information/quotation-list | QuotationList | not located
23 発注一覧 | .../order-list | OrderList | not located
24 生産工程管理 | /production-control/production-progress-information/production-process-control | NewProductionProcessControl | TagFilter.tsx ✓
25 資材補充ルール設定 | /in-season-management/material-control/material-replenishment-rule-setting | MaterialReplenishmentRuleSetting | not located
26 補充商品一覧 | .../replenishment-product-list | ReplenishmentproductList | partials/Filter.tsx ✓
27 資材在庫・発注履歴 | .../material-inventory-order-history | MaterialInventoryOrderHistory | FilterFabric.tsx ✓
28 在庫履歴 | /inventory-control/arrival-purchase-process/inventory-history | InventoryHistory | partials/Filter.tsx ✓
29 取置一覧 | /inventory-control/reservation-instruction | ReservationInstructionNew/List | FilterReserve.tsx ✓
30 出荷明細一覧 | /inventory-control/shipment-process/shipment-information-list | ShipmentInformationList | not located (L-Pedia: pending decision "Product Name column unnecessary")
31 在庫払出 | .../disposal-registration | DisposalRegistration | DisposalListFilter ✓ (domainBuilder tested)
32 在庫調整一覧 | .../inventory-adjustment-list | InventoryAdjustList | partials/Filter.tsx ✓
33 受注安全在庫設定 | /in-season-management/sales-linkage-for-wholesale-sales/customer-order-safety-inventory-setting | CustomerOrderSafetyInventorySetting | partials/Filter.tsx ✓
34 商品区分設定 | /md-plan-analysis/top-down/setting-product-class | SettingProductClass | FilterProducts.tsx ✓
35 バブルチャート | .../bubble-chart-analysis | BubbleChartAnalysis | FilterBubleChartAnalysis.tsx ✓
36 パレート分析 | .../pareto-analysis | ParetoAnalysis | not located
37 配分用商品設定 | /in-season-management/allocation-process/product-maximum-setting-for-allocation | ProductMaximumSetting | not located
38 店舗毎配分作成 | .../create-template-for-allocation | NewCreateTemplateForAllocation | not located
39 店舗移動分析 | ⚠ menu only has 店舗移動分析-移動伝票 (.../analysis/stock-transfer/movement-slip) | MovementSlip | FilterMovementSlip.tsx ✓ — PRD alias? QUESTION
40 マークダウン分析 | .../markdown/analysis | MarkdownAnalysis | not located
41 マークダウン分析(粗利) | .../markdown/analysis-gross-profit | MarkdownAnalysisGrossProfit | not located
42 卸出荷率 | .../analysis/wholesale-shipment-rate | WholesaleShipmentRateV2 | FilterWholesaleShipmentRate.tsx ✓
43 カテゴリー別推移分析 | .../analysis/category-transition | CategoryTransition | InSeasonAnalysisFilters ✓
44 シーズン別分析 | .../analysis/season-analysis | SeasonAnalysis | FilterSeasonAnalysis.tsx ✓
45 カテゴリー別分析 | .../analysis/category | CategoryV2/Category | CategoryAnalysisFilter.tsx ✓
46 商品別分析 | .../analysis/each-product-analysis | EachProductAnalysisV2 | EachProductAnalysisFilter + Filters/* ✓
47 ランキング分析 | .../analysis/ranking-analysis | RankingAnalysis | FilterTopData + getAnalysisFilterData ✓
48 カラー分析 | .../analysis/color-analysis | ColorAnalysis (V1; V2 dir exists too) | services/utils.ts InSeasonAnalysisFilters ✓
49 サイズ分析 | .../analysis/size-analysis | SizeAnalysis | services/utils.ts ✓
50 絵型付集計表 | .../analysis/summary-table-with-pictures | SummaryTableWithPictures | InSeasonAnalysisFilters ✓
51 組織・部門別集計 | .../analysis/aggregation-organization | AggregationOrganization | FilterAggregationOrganization.tsx ✓
52 商品別集計 | .../analysis/aggregation-product | AggregationProduct | partials/Filter.tsx ✓
53 売上明細集計 | .../analysis/sales-detail-aggregation | SalesDetailAggregation | not located
54 得意先別集計 | .../analysis/aggregation-customer | AggregationCustomer | components/Filter.tsx ✓
55 撮影・採寸・原稿指示一覧 | /ec-shop-management/ec-product-setting/shooting-instructions/list | ShootingInstructions/List | FilterShootingInstructions.tsx ✓
56 EC安全在庫設定 | /ec-shop-management/.../safety-stock-setting-list | SafetyStockSetting/Lists | partials/Filter.tsx ✓
57 顧客一覧 | /seamless-customer-management/customer-list/customer-list | B001 | filter partial not located (FilterB001 in components/) — ringi114 tests ✓
58 顧客購買履歴一覧 | .../customer-purchase-history | CustomerPurchaseHistory/List | FilterCustomerPurchaseHistory.tsx ✓
59 顧客購買登録 | .../customer-purchase-history/register | Register | formComponents.tsx ✓
60 顧客ポイント履歴一覧 | .../customer-point/history-list | CustomerPoint/HistoryList | FilterCustomerPointHistory.tsx ✓

## Gaps
- Row 39 alias QUESTION (店舗移動分析 vs 店間移動分析 row 15 vs movement-slip menu entry).
- Rows with inline/shared filters (no dedicated partial): 2,3,5,6,9,13,14,16,18,20,21,22,23,25,30,36,37,38,40,41,53,57.
- Shared selector families: components/Templates/Selector/* + components/InSeasonAnalysisFilters/* (covers entire rows 21-54 vocabulary incl. 表示シーズン=PeriodControl/DisplaySeason, designer-as-user=ProductAttribute/DesignerSelector, store/customer code+name merged).
- _ringi114-pages.ts is in E2E repo (agent searched FE only) — E2E state pending impact agent.
