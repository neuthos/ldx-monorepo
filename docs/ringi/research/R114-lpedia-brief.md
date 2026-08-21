# R114 — L-Pedia Case Brief (research agent output, 2026-08-21)

Space LPedia (root EN/Manuals 1759772677, EN/Ringi 1760460801). Pages: https://l-dx.atlassian.net/wiki/spaces/LPedia/pages/<id>

## Ringi 114 itself
- RINGI-114 — Filter and Column Corrections (id 1777893429, EN/Ringi): INDEX ONLY. Canonical spec = "Ringi-114: Filter and Column Corrections (LDX space)". Frontend correction program across 18 ERP list pages, "in progress (spec updated 2026-06)". Pending decision recorded: "Product Name column unnecessary" on Shipment Information List (= PRD row 30 出荷明細一覧 商品名の項目は不要).

## Precedent ringi
- RINGI-7 — Change filters to selection (code and name) (id 1799520263): master-data pickers show code+name; closest precedent for R114 filter unification. Counter-evidence: Warehouse Name 倉庫名 & Season シーズン filters deliberately name-only on Shipment Information List.
- RINGI-16 — Add Filters (id 1801584653): adds filters incl. JAN-code search in product modal (EC family).
- RINGI-53 — Sales/Purchase Info & Slip List Updates (id 1760722954, shipped 2026-03-15): prior filter/column work, Sales Info List INV-060-005 + EC Customer Order Detail List.
- Shipment Information List manual (id 1777893377): "Shaped by RINGI-57 · RINGI-114 · RINGI-117".

## Domain-term grounding
- 商品区分: no L-Pedia construct; documented equivalent = Category カテゴリー cascade filter (5 levels, Product Classification Masters 1–5) on Shipment Information List filter 5.
- グループ階層１..５: columns 31–35 "Product 1–5 Classification" on Shipment Information List (id 1777893377) ← anchor evidence.
- シーズン: filter 15 from Season Name Master → Name, NAME-ONLY (no code) — conflicts-by-convention with code+name unification.
- 表示シーズン / 撮影・採寸・原稿指示 / 顧客ポイント履歴 / 顧客購買履歴 / バブルチャート / パレート分析 / MDマップ / 組織・部門別集計: NOT FOUND in L-Pedia → spec must source these from PRD + code only.
- 会員: EC Customer Order List (id 1801420802) filter 11 会員番号 (Membership Master, partial match); Excel export shows member NAME not number (display inconsistency relevant to R114 row 57 download).

## Analysis screens rows 21–54
- EN/Manuals tree covers OTC screens only — NO analysis/chart/map manual pages exist. All rows 21–54 grounding = PRD + code.

## Takeaways
- Row 30 (商品名の項目は不要) has a RECORDED PENDING decision in L-Pedia — mirror it as Question row.
- R114 must reconcile code+name (RINGI-7) vs documented name-only exceptions (倉庫名, シーズン) → Question row candidate: should シーズン selector show code too?
- Excel-export naming inconsistencies (membership name vs number) relevant to rows 57/60 download FRs.
