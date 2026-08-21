# R114 — Impact & Gap Inventory (research agent output, 2026-08-21)

## BE sweep (ldx_addons)
- membership.master (ldx_ec/models/membership_master.py): prefecture_id_1 L172, gender L208, dob L211 — row 57 covered.
- membership.point.history (ldx_ec/models/membership_point_history.py): transaction_number L75, transaction_date L77, transaction_store_id L81, usage_detail_id L84 (+ master XML data), registration_date L100, date_awarded L144, purchase_history_id L136 — row 60 covered.
- membership.purchase.history (+lines, +ldx_account_closing ec copy): transaction_number L81, transaction_date L84, transaction_store_id L87, pic_name L112 — rows 58/59 covered.
- ec.product.request (ldx_ec/models/ec_product_request.py): photograph/measurement/manuscript_delivery_date L58/65/70; final_delivery_date L27 compute L245-260 = non-stored max() of the three (False when empty) — CONFIRMED; guard in ldx_account_closing/models/ec/ec_product_request.py L63-70. FE filter uses source-field OR domain (ut-tested). Caveat: server-side SQL filtering on final_delivery_date impossible without stored variant.
- Masters pre-exist (size.master, first/second/third.store.group.master, calendar.*) — no-impact; no custom controllers needed (standard search_read).

## Doc-vs-code (rows 21-60)
- covered w/ R114 trace: 21 (CapDisplay/MDMapView), 22 (quotation locales+views), 23-24 (NewProductionProcessControl), 25 (MaterialReplenishmentRuleSetting), 27 (MaterialInventoryOrderHistory/FilterFabric), 28 (InventoryHistory Filter), 29 (ReservationInstructionNew), 32 (InventoryAdjustmentList), 40-41 (useInSeasonMarkdown* hooks), 42-49 (shared InSeasonAnalysisFilters; consumers WholesaleShipmentRate/CategoryTransition/SeasonAnalysis/EachProductAnalysisV2/RankingAnalysis/ColorAnalysisV2/AggregationProduct), 52 (AggregationProduct), 53 (FilterSalesDetailAggregation store_group ids — COVERED), 54 (AggregationCustomer accounting dept — COVERED), 55 (ShootingInstructions), 57-60 (CustomerMaster + SeamlessCustomerManagement commits f6ba83f49f/3421ab6d06/cfe979c46d).
- Files EXIST but no R114-range trace (pre-existing, likely earlier phase): 26 (ReplenishmentproductList/Filter), 31 (DisposalRegistration/DisposalListFilter), 33 (CustomerOrderSafetyInventorySetting/Filter), 34 (SettingProductClass/FilterProducts), 35 (BubbleChartAnalysis/FilterBubleChart), 36 (ParetoAnalysis — file not located), 37/38 (Allocation pages — not located), 50 (SummaryTableWithPictures — not in diff).
- PENDING-gap: 30 (no ShipmentDetail file, JP label absent; L-Pedia pending decision), 39 (alias), 51 (pic_id exists since 2024 aa13e0924f3 — add vs ensure).

## E2E state
- feat/ringi-114 @2b3d103a IS the checkout (not ringi-100). _ringi114-pages.ts = 20 pages (rows 1-20), shape {id,label,route,tcIds,Page?}; 4 POMs. L1×3 + L2 + L3 specs. NO entries rows 21-60.
- ai/test-author/r114-traceability @d11a0d03 DELETES the 6 ringi-114 spec files vs feat/ringi-114 — it is behind/alternative, NOT additive → merge decision: effectively "continue on feat/ringi-114" (no value in merging).
