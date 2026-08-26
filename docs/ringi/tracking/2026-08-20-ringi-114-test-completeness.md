# Ringi-114 — Test Completeness Tracking

Date: 2026-08-20
Branch: FE `feat/ringi-114-page-40-60` @ `7a55834e04` (unpushed) · BE `target/july-2026` (no changes needed) · E2E `feat/ringi-114` @ `2b3d103a`

## 1. Scope reconciliation (PENTING)

Ada tiga angka scope yang berbeda dan semuanya benar pada kurun waktunya:

| Sumber | Angka | Keterangan |
| --- | --- | --- |
| Design doc canonical (LDX space, 2026-06-22, id 1745420295) | **20 baris matriks → 18 page-spec** | AP×3 digabung jadi 1 spec. Fase P1–P4. |
| E2E `tests/functionality/ringi-114/_ringi114-pages.ts` (2026-07-03) | **20 halaman** (TC-R114-001..020) | Hanya fase pertama ringi. L3 smoke 20/20. |
| E2E `ai/test-author/r114-traceability` (2026-07-20) | **40 TC → 209 checks** | Belum di-merge ke `feat/ringi-114`. |
| PRD sheet (milik user) | **60 baris** | Baris 55–60 = halaman Seamless/EC (sudah diimplement FE commit `6824e546e3`). Baris 21–54 = fase 2 + koreksi lain. |

Kesimpulan: PRD bertumbuh dari 20 → 60 baris. Coverage E2E saat ini HANYA mencakup baris 1–20.
**Baris 21–60 belum ter-representasi di manifest E2E manapun.** Daftar baris 21–54 hanya ada di PRD sheet user.

## 2. FE — file yang disentuh ringi-114 di branch ini

8 commit ringi-114 unik (di atas merge-base `ace2a13488`):
`7ce860eb8e` phase2 corrections · `a5d6b5bef5` translate fixes · `68327ae8e5` inventory history · `534a9ac568` PR review fixes · `6824e546e3` page 40–60 · `d28586bf81`+`23e44a9b78` in-season filters · `7a55834e04` shooting instructions (amended, tanpa .swp)

Total **90 file**: 8 locale en/ja (4 pasang), 2 docs, 1 config, 60 source, 19 test baru, + 2 file uncommitted (konversi i18n filter 58 & 60).

Daftar lengkap: lihat `git log --name-only` per commit di atas.

### Unit-test gap (41 file source TANPA test)

InSeasonAnalysisFilters (19): customerFilters, PICSelector, DisplaySeason, Brand/ColorPreset/Color/Designer/Item/OrderPic/ProductClassification/Season/SizePreset/Size Selector, NestedProductClassifications, productAttributeFilter, First/Second/ThirdStoreGroup, storeFilter

Lainnya (22): useProductSize, convertDateFilter (pure helper — prioritas tinggi), fetchStoreGroup, ShootingInstructions List/index + FilterShootingInstructions, ListReservationInstruction, useReserveSearch, DisposalRegistration, AggregationCustomer Filter, ProductClassFilter, FilterWholesaleShipmentRate, FilterProductSearch (Markdown), FilterBubleChartAnalysis, FilterProducts (SettingProductClass), B001, FilterB001, B005, HistoryList/components, FilterCustomerPointHistory, B09A, FilterCustomerPurchaseHistory, purchaseHistory

Prioritas disarankan:
- **P1**: 4 filter baru page 55–60 (FilterShootingInstructions, FilterB001, FilterCustomerPurchaseHistory, FilterCustomerPointHistory) + B005 components (rename kolom) — perubahan terbaru, belum pernah direview.
- **P2**: convertDateFilter + fetchStoreGroup + useProductSize (pure logic, murah).
- **P3**: 19 komponen InSeasonAnalysisFilters (pola seragam — bisa 1 pola test parameterized).
- **P4**: page index besar (B001/B09A/B005/purchaseHistory/ShootingInstructions index) — butuh mock berat; pertimbangkan cukup L2 di E2E.

## 3. E2E (L-DX-E2E @ feat/ringi-114)

Struktur: `tests/scenario/` = journey lintas layar (efektif "integration"); `tests/functionality/` = per layar. Suite ringi-114 berlapis:
- **L1** component contract (UserSelector, merged code+name, cascading classification)
- **L2** network domain-payload (assert domain search_read yang dikirim FE)
- **L3** page smoke (20 halaman dari `_ringi114-pages.ts`)

POM ada untuk 4 halaman: MaterialMaster, StoreMasterList, BillingToMaster, ContinuedProductAnalysis.
5 spec TC-AUTO-* hijau. Suite L1/L2/L3 (commit `2b3d103a`) belum ada follow-up "green".

**Gap**: baris PRD 21–60 tidak ada di manifest. Perlu: (a) PRD sheet dari user untuk daftar baris 21–54 + nomor halaman↔route, (b) extend `_ringi114-pages.ts`, (c) L2 FILTER_CASES per halaman yang filter-nya berubah.

## 4. Rekomendasi strategi testing (menjawab pertanyaan user #3)

UI E2E full-matrix per halaman = over-engineering untuk ringi-114 (perubahan mayoritas: field filter → domain Odoo, rename kolom, download). Yang paling mendeteksi regresi:

1. **Unit (FE)**: domain builder + render field filter (P1–P2 di atas).
2. **L2 domain-payload (E2E repo)**: assert payload search_read nyata per halaman — ini "integration" FE↔BE sesungguhnya, murah, stabil.
3. **L3 smoke per halaman** untuk wiring + i18n render.
4. **L1 contract** untuk komponen bersama (selector) sekali, bukan per halaman.
5. UI E2E interaksi penuh (klik semua field) HANYA untuk 4 halaman ber-POM yang sudah ada polanya (BTM/StoreMaster/MaterialMaster/CPA) bila QA menuntut TC eksplisit.

## 5. Open decisions (PENDING)

1. ~~Sumber daftar baris PRD 21–54~~ **TERJAWAB 2026-08-21**: user memberikan sheet PRD lengkap baris 1–60 (lihat §7). Turunkan manifest dari situ.
2. Eksekusi 41 unit test: batch P1→P4 (disarankan) atau semua sekaligus. → P1–P3 selesai; P4 berjalan.
3. E2E: lanjut di `feat/ringi-114` atau gabung dulu `ai/test-author/r114-traceability` (40 TC manifest). **TETAP PENDING** — keputusan user (repo E2E sedang checkout `feat/ringi-100`).

## 6. Progress log

### 2026-08-20 — P1 unit test SELESAI (USER-APPROVED: "P1 dulu")

Keputusan user sesi ini: P1 dulu; sheet PRD 21–54 menyusul dari user; E2E ditunda (repo E2E sedang checkout `feat/ringi-100`).

5 file test baru di FE `feat/ringi-114-page-40-60` — **29 TC, semua hijau**; eslint 0 error; prettier pass; `yarn type-check` tidak menambah error baru (baseline error pre-existing di PaymentStatementTabTable & CreatePaymentOverviewModal):

| File test | TC | Cakupan |
| --- | --- | --- |
| `ECShopManagement/.../ShootingInstructions/List/partials/__tests__/FilterShootingInstructions.test.tsx` | 6 | render 4 field; domain `final_delivery_date` → OR `|` + 3 source fields `photograph/measurement/manuscript_delivery_date` >=/<= UTC start/end-of-day; `delivery_date` range; range parsial di-skip; submit kosong → `[]` |
| `SeamlessCustomerManagement/components/FilterB001/__tests__/FilterB001.test.tsx` | 4 | 12 field + tombol; status options exclude `merged`; grade options dari hook; submit nilai + condition default `and` |
| `.../CustomerPurchaseHistory/List/__tests__/FilterCustomerPurchaseHistory.test.tsx` | 5 | render 7 field; domain leaf per field; alias registration→`create_date`, updated→`write_date` dengan batas UTC; range parsial di-skip |
| `.../CustomerPoint/HistoryList/__tests__/FilterCustomerPointHistory.test.tsx` | 6 | render 8 field; opsi usage-detail master di Select; domain leaf; `date_awarded` dipertahankan + alias create/write_date; range parsial di-skip |
| `.../CustomerPoint/HistoryList/__tests__/columns.test.ts` | 8 | 17 kolom berurutan; key fallback `transaction_time`; rename judul child-membership (namespace `seamless_customer_purchase_history:child_membership_*`); render point_state/date/time; format currency `point_qty`/`after_balance`; flag hidden/delete/sorter |

Catatan penting:
- **User mengedit paralel**: `FilterCustomerPurchaseHistory.tsx` + `FilterCustomerPointHistory.tsx` dikonversi dari FilterContainer → `FilterLayout` + `DateConfig` (18:38, di tengah sesi). Test mengikuti implementasi baru (domain range kini memakai `to_BE_DateString` UTC, bukan `.format(FORMAT_DATE)` polos).
- Tidak ada file source yang diubah oleh sesi ini; tidak ada commit (butuh approval terpisah).
- Teknik: FilterLayout asli + `fireEvent.submit` dibungkus `act(async)` (jsdom tidak dispatch submit dari klik; onFinish antd asinkron); selector & RangePicker di-mock dengan `id`/`onChange` injeksi Form.Item.

Sisa pekerjaan unit test: P2 (convertDateFilter, fetchStoreGroup, useProductSize), P3 (19 komponen InSeasonAnalysisFilters), P4 (page index besar). E2E menunggu sheet PRD 21–54 + keputusan branch.

### 2026-08-20 — P1 di-commit; P2 SELESAI

- P1 committed: `a60c618b58` `test(ringi-114): add P1 unit tests for 4 new filters and B005 columns` (5 file, 844 baris; hanya file test, WIP user tetap unstaged).
- P2 unit test — 3 file baru, **19 TC semua hijau**; eslint 0 error; prettier pass; `yarn type-check` 0 error baru. **Belum di-commit** (menunggu instruksi):
  - `src/helpers/__tests__/convertDateFilter.test.ts` (8 TC): empty → `''`; start/end UTC via `to_BE_DateString({withTime,toUtc,adjust})`; varian lokal `convertStartOfDay/EndOfDay` TANPA `toUtc`; input string/Date/moment ekuivalen.
  - `src/services/options/__tests__/fetchStoreGroup.test.ts` (6 TC): pemetaan first/second/third → model master yang benar (master lain tidak dipanggil); domain `['name','ilike',q]` + `limit 20` + `fields ['code','name']`; `initialValue` menambah leaf `['id','=',v]`; `searchText` undefined → `''`; label `[code] name` vs `name`; respons tanpa records → undefined.
  - `src/data/__tests__/useProductSize.test.tsx` (5 TC): POST `/dataset/size.master/search_read/` dengan `fields` default `[]` / custom; urlOptions diteruskan ke `useUrlQuery`; fallback `data: []`; `isError` saat reject.

Sisa: P3 (19 komponen InSeasonAnalysisFilters — 1 pola parameterized), P4 (page index). E2E menunggu sheet PRD 21–54 + keputusan branch.

### 2026-08-20 — P2 di-commit; P3 SELESAI

- P2 committed: `aa3622f76c` `test(ringi-114): add P2 unit tests for convertDateFilter, fetchStoreGroup, useProductSize` (3 file, 19 TC).
- P3 unit test — 1 file `src/components/InSeasonAnalysisFilters/__tests__/ringi114.test.tsx`, **21 TC semua hijau**; eslint 0 error (1 warning `no-restricted-imports` formik — tak terhindarkan, komponen yang dites berbasis formik); prettier pass; `yarn type-check` 0 error baru. **Committed: `fa4481e10a`.**
  - 15 selector parameterized (PIC/Designer/OrderPic + Brand/Color/ColorPreset/Item/ProductClassification/Season/Size/SizePreset + First/Second/ThirdStoreGroup + DisplaySeason): kontrak label gabungan `[code] name` (varian `login`, `code`, `fiscal_year_id`; fallback nama tanpa kode), `name`/`data-cy` FSelect, value = id. Catatan: `useProductCategory` (ProductClassificationSelector) mengembalikan baris tuple `[id, name, code]` — fixture berbeda dari selector lain.
  - `NestedProductClassifications` (3 TC): 5 level, opsi `[code] name`, level dalam disabled sampai parent dipilih, perubahan parent mencenting semua descendant (second..fifth → null).
  - 3 agregator: rename label `common:customer` (customerFilters) & `common:store` (storeFilter); productAttributeFilter 14 baris berurutan. Factory memanggil hook formik → harus dieksekusi dalam komponen anak di bawah FormikProvider (render-prop formik dievaluasi sebelum Provider terpasang).

Sisa: P4 (page index besar — butuh mock berat; pertimbangkan cukup L2 di E2E). E2E menunggu sheet PRD 21–54 + keputusan branch.

## 7. PRD sheet 1–60 (diberikan user 2026-08-21) — dasar plan E2E, BELUM DIEKSEKUSI

Baris 1–20 sudah ter-cover manifest `_ringi114-pages.ts` (L3 smoke 20/20). Baris 21–60 inilah yang harus masuk manifest:

| Baris | Layar | Perubahan PRD |
| --- | --- | --- |
| 21 | MDマップ表示 | 階層1–5, 商品区分, シーズン |
| 22 | 見積一覧 | 階層1–5, 商品区分 |
| 23 | 発注一覧 | 階層1–5, 商品区分 |
| 24 | 生産工程管理 | merge 工場/仕入先/倉庫 code+name, 生産担当者, 階層1–5, 商品区分 |
| 25–27 | 資材補充ルール設定 / 補充商品一覧 / 資材在庫・発注履歴 | merge 資材コード+資材名 |
| 28 | 在庫履歴 | 階層1–5 |
| 29 | 取置一覧 | 店舗, 取り寄せ元店舗, ブランド, アイテム |
| 30 | 出荷明細一覧 | hapus 商品名, 倉庫名, 階層1–5, シーズン |
| 31–32 | 在庫払出 / 在庫調整一覧 | フィルター追加【商品】 |
| 33 | 受注安全在庫設定 | ブランド, アイテム |
| 34 | 商品区分設定 | 階層1–5, カラー, サイズ, シーズン, 商品区分 |
| 35–36 | バブルチャート / パレート分析 | 階層1–5, シーズン, 得意先, 商品区分 |
| 37–38 | 配分用商品設定 / 店舗毎配分作成 | 階層1–5, カラー, サイズ, merge 入庫先倉庫 code+name |
| 39 | 店舗移動分析 | 商品区分 |
| 40–41 | マークダウン分析 (+粗利計算) | カラー, サイズ |
| 42 | 卸出荷率 | 商品区分, ブランド, アイテム, 階層1–5, シーズン, merge 得意先 code+name |
| 43 | カテゴリー別推移分析 | merge 商品/得意先/店舗 code+name, ブランド, アイテム, 階層1–5, シーズン, 店舗グループ1–3, 担当者 |
| 44–45 | シーズン別分析 / カテゴリー別分析 | 表示シーズン, merge 得意先/店舗, 店舗グループ1–3, 担当者 |
| 46–47 | 商品別分析 / ランキング分析 | 商品区分, ブランド, アイテム, 階層1–5, シーズン, デザイナー→user選択式, 登録担当者, merge 得意先/店舗, 店舗グループ1–3, 担当者 |
| 48–49 | カラー分析 / サイズ分析 | 表示シーズン, 商品区分, ブランド, アイテム, 階層1–5, シーズン, merge 得意先/店舗, 店舗グループ1–3 |
| 50 | 絵型付集計表 | カラー, サイズ, 階層1–5, 商品区分, ブランド, アイテム, シーズン |
| 51 | 組織・部門別集計 | 担当者 |
| 52 | 商品別集計 | 商品区分, ブランド, アイテム, カラー, サイズ, 階層1–5, シーズン, デザイナー→user選択式, 登録担当者, merge 得意先/店舗, 店舗グループ1–3, 担当者 |
| 53 | 売上明細集計 | 店舗グループ1–3 |
| 54 | 得意先別集計 | 計上部門 |
| 55 | 撮影・採寸・原稿指示一覧 | フィルター追加【商品】【発注先】【最終納期】FromTo【納品日】FromTo |
| 56 | EC安全在庫設定 | ブランド, アイテム |
| 57 | 顧客一覧 | フィルター追加【会員登録日】【都道府県】【性別】【生年月日】, DL追加 |
| 58 | 顧客購買履歴一覧 | フィルター追加【購買履歴番号】【取引日】【店舗】【担当者】【登録日】【登録者】【更新日】 |
| 59 | 顧客購買登録 | 店舗, merge 担当者ID+担当者 |
| 60 | 顧客ポイント履歴一覧 | rename 取引番号⇒購買履歴番号 & 年月日⇒取引日, フィルター追加【取引日】【授与日】【店舗】【利用内容】【登録日】【登録者】【更新日】, DL追加 |

Catatan pemetaan: baris 43–54 = layar analisa in-season (pola filter seragam — selector sudah ter-unit-test di P3; kontrak label `[code] name` = L1 E2E existing). Baris 55–60 = sudah ter-implement FE commit `6824e546e3` + amend, dan filter/kolomnya sudah ter-unit-test di P1.

### Plan eksekusi E2E (menunggu approval branch — decision #3)

1. Resolve branch: lanjut `feat/ringi-114` @ `2b3d103a` ATAU merge `ai/test-author/r114-traceability` @ `d11a0d03` dulu (PENDING user).
2. Extend `tests/functionality/ringi-114/_ringi114-pages.ts`: tambah 40 entri (baris 21–60) — butuh mapping layar↔route; ambil dari router FE (`src/pages/`), bukan dari nama Jepang PRD.
3. L3 smoke per entri baru (render + i18n) — pola sama dengan 20 existing.
4. L2 FILTER_CASES: baris dengan perubahan filter/domain (21–24, 28–38, 42–54, 55–58, 60) — assert payload `search_read` per field; reuse kontrak domain dari unit test P1–P3.
5. L1 contract selector bersama sudah ada (UserSelector merged code+name, cascading classification — persis NestedProductClassifications P3).
6. UI interaksi penuh hanya untuk 4 halaman ber-POM bila QA menuntut (BTM/StoreMaster/MaterialMaster/CPA).

### 2026-08-21 — P3 di-commit; P4 SELESAI; PRD 1–60 diterima

- P3 committed: `fa4481e10a` (21 TC).
- **P4 committed: `204178ddcf`** — 4 file, **16 TC semua hijau**; eslint 0 error; prettier pass; type-check 0 error baru. Scope = file yang benar-benar berubah karena ringi-114:
  - `MDExecution/__tests__/ringi114.test.tsx` (5 TC): AggregationCustomer Filter (OrganizationSelector tanpa `searchField`), ProductClassFilter (label `common:productClassification`, selector bersama, value passthrough), FilterWholesaleShipmentRate (selector Template `.Formik` ter-bind ke `brand_id`/`item_id`/`product_classification_id`/`product_id`, FRangePicker, PIC).
  - `PSAnalysisMDPlan/__tests__/ringi114.test.tsx` (3 TC): FilterBubleChartAnalysis (selector bersama + DebounceSelect tersisa), SettingProductClass FilterProducts (ProductSelector bersama).
  - `SeamlessCustomerManagement/__tests__/ringi114-pages.test.tsx` (5 TC): B001 — DownloadExcel `membership.master` dengan `['status','!=','merged']` + leaf domain baru `prefecture_id_1`/`gender`/`create_date` range (DateConfig UTC)/`dob` range YYYY-MM-DD; B005 & B09A — domain filter di-append ke scope `['membership_id','in',[id]]`; ShootingInstructions index — filter domain mengalir ke list hook.
  - `ListReservationInstruction.ringi114.test.tsx` (3 TC): pemetaan domain order-view (`ec_reserve_order_line_ids.*` untuk product/pic) vs line-view (`ec_reserve_order_id.*` untuk state/store/pic); summary memakai pemetaan order-view.
- **Di luar scope P4** (bukan perubahan ringi-114, tetap tanpa unit test — legacy): `useReserveSearch`, `FilterProductSearch` (BundleSetting). Halaman `purchaseHistory` register (965 baris, form besar) dan page `DisposalRegistration` dibebankan ke L2 E2E sesuai rekomendasi strategi §4; `buildDisposalListDomain` sudah ter-test existing.

**Status akhir unit test ringi-114: 13 suite, 85 TC, semua hijau** (P1 29 + P2 19 + P3 21 + P4 16). Semua commit di `feat/ringi-114-page-40-60`: `a60c618b58`, `aa3622f76c`, `fa4481e10a`, `204178ddcf`. Tidak ada push.

E2E: menunggu keputusan branch (decision #3) — plan eksekusi 6 langkah ada di §7.

### 2026-08-21 (lanjutan) — UT untuk commit user f6ba83f49f SELESAI

Commit user `f6ba83f49f` (filter fix + selection download + convert fields di halaman customer) dianalisis; sebagian besar sudah ter-cover P1/P4 (konversi FilterLayout sempat dites paralel saat WIP). Gap ditutup dengan **12 TC baru, committed `3421ab6d06`** (14 suite / **92 TC total** hijau; eslint 0 error; type-check 0 error baru):

- `Register/partials/__tests__/formComponents.ringi114.test.tsx` (4 TC): StoreSelector — domain kosong saat load (tanpa leaf ilik sisa), fields kini termasuk `code`, label `[code] name` + fallback nama, search OR `['|',[name,ilik,q],[code,ilik,q]]` setelah debounce 800ms, lookup id untuk nilai tersimpan.
- `SeamlessCustomerManagement/__tests__/ringi114-pages.test.tsx` (+5 TC): B001 — `dataIds` dari seleksi checkbox + convertFields gender (`male→common:male`) & status (dari `status_options`); B005 — model `membership.point.history`, convertFields `point_state` (`done/pending/cancelled→common:*`), `dataIds` dari seleksi tabel, filter berada DI BAWAH blok member info (assert urutan DOM).

Bagian f6ba83f49f yang tetap tanpa UT: konversi PIC `Number(values.pic_id)` di halaman register (965 baris — page-level, kandidat L2 E2E) dan perubahan locale JSON.

### 2026-08-21 (coverage) — PR #18661 scoped coverage >80% SELESAI

PR `L-DX-ERP/ldx-frontend#18661` (Ringi 114 Page 40-60, MERGED, base `target/august-2026`, 33 file source). Script `scripts/pr-coverage.sh` (jest coverage scoped ke file source yang berubah di PR) disimpan di repo FE (di-`.eslintignore`).

Baseline: **62.98%** stmts. Ditutup dengan test tambahan, **committed `cfe979c46d`** (39 TC baru; total suite ringi-114 → 19 file / 131 TC hijau; eslint 0 error; type-check 0 error baru):

- `purchaseHistory.tsx` **0% → 66%** (5 TC): render form register, PIC `Number(char id)`, wiring StoreSelector → main virtual warehouse, modal search EC orders (domain `order_receive_number` ilike) + apply `reference_slip_no`. Teknik: native input setter + event `input` (input kustom tak merespons `fireEvent.change`), Modal antd di-stub inline (run 321 dtk → 3 dtk).
- `AggregationCustomer/Filter.tsx` **32% → 84%** (2 TC): opsi fiscal year ter-sort `date_from`; pilihan fiscal+monthly → `useCalendarMasterGroup({column: 'calendar_month_calendar', year})`; label periode via `optionsMonth.*`; submit → `onSearch` (start/end_period required).
- `B001.tsx` **64% → 95%**: domain base (OR block nama/telepon, `=%` keyword, status ilike, grade) + hitungan `'|'` = 11 saat `condition: 'or'`.
- `formComponents.tsx` **56% → 90%**: + `VirtualWarehouseSelector` (scope `warehouse_attached_store_id` + `is_virtual_warehouse`, tanpa leaf ilik kosong, search setelah debounce, lookup nilai terbatas store sama).
- `B005/B09A` member-aware: mock `getMembershipData` memanggil `onSuccess` → scope `['membership_id','in',[id,...child_ids]]` terverifikasi + JSX member/summary ter-cover.
- `components.tsx` (kolom B005) **66% → ~85%**: render `date_awarded`/`registration_date`/`write_date` + onCell kolom komposit + titik point_state.

**Overall akhir: 80.82% stmts / 81.44% lines** (branch 63.16%, funcs 63.63% — gate memakai stmts/lines).

### 2026-08-21 (E2E) — Implementasi E2E dimulai di feat/ringi-114 (PENDING-001 terjawab)

- `c00a7540` manifest `_ringi114-pages.ts` +40 halaman (rows 21–60, JRN-008) — L3 smoke otomatis mencakup 60 halaman.
- `+1 commit` POM-005 `AnalysisFilterPage` (pages/in-season-management/analysis-filter.pom.ts) + 3 FILTER_CASES L2 (brand_id, season_id 表示シーズン, customer_accounting_department_id) ter-wire ke wholesale-shipment-rate/season-analysis/aggregation-customer (JRN-009 dimulai).
- FE `d862eeb83f`: kontrak testid EC-002/013/025 (TDD, 16/16 hijau).
- Sisa paket E2E per kontrak §8: POM-001..004 Seamless journeys + sisa FILTER_CASES + r114-page-root untuk ±38 halaman + ekseskusi Answerkey TC-057..063/072 (butuh environment APP_URL).

### 2026-08-21 (L2 hijau — sesi berjalan, belum selesai)

Run pertama L2 ringi-114 (preview-e2e-avco, auth suite OK): **3 passed / 5 failed**. Perbaikan ter-commit di E2E (`fix(ringi-114)`): POM analysis kini match endpoint nyata `/in_season_analysis/{wholesale_v2,season_product_category,aggregation_by_customer}` + continued-product v2; domain = body (flat/params.domain); tombol submit fallback `form button[type=submit]`.

Diagnosis tersisa (sesi lanjutan):
1. **Locale env = Jepang** — tombol search = 「検索」 bukan "Search" → fallback locator perlu `button:has-text("検索")`.
2. **Dropdown antd async** — klik option pertama kadang timeout; perlu waitFor dropdown visible sebelum klik.
3. **Aggregation-customer butuh chain required**: fiscal_year_id → radio aggregation (input[type=radio] pertama) → org → submit; submit tanpa itu tak menembak request (validasi antd).
4. Continuous-product v2: POM sudah diarahkan ke endpoint baru — perlu rerun; kemungkinan env deploy tertinggal (verifikasi `ldx_version`).

### 2026-08-21 (final) — L2 E2E INTEGRATION HIJAU ✅

`npx playwright test tests/functionality/ringi-114/L2-domain-payload.spec.ts` @ preview-e2e-avco: **6 passed / 2 skipped / 0 failed** (commit E2E `94e1ec6f`). Fix yang mendatangkan hijau:
1. Selector `:visible` — FilterLayout merender salinan field tersembunyi; klik selalu mengenai instance hidden.
2. Opsi dropdown: klik level-DOM + polling lazy (antd "not stable"; opsi termuat malas — dropdown "No data" sampai fetch master selesai).
3. Tombol: fallback `button_search`/`btnSearch`/submit-form/"Search"/"検索"/"Display" (season-analysis memakai tombol Display).
4. Aggregation-customer chain required: fiscal_year_id → radio TERAKHIR (annually, bebas periode; radio pertama = monthly → periode wajib) → periods bila muncul → org → submit.
5. Continuous-product v2: domain fallback ke seluruh body (payload flat).
6. Dua env-gap terverifikasi → TC sheet `Question` + skip beralasan (test code siap, flag aktivasi): TC-R114-042 wholesale (build env pra-wholesale_v2), TC-R114-044 season (calendar.season 0 records).

Semua L1/L3 suite ringi-114 lainnya tidak berubah dari baseline (L3 kini 60 halaman via manifest).

### 2026-08-21 (implementasi batch) — L3 60 halaman + journey Seamless

- **L3 smoke (TC-072)**: 52 passed / 3 failed (inventory-adjustment-list, markdown-analysis, +1; 7.9m) — mayoritas 60 halaman hijau; 3 gagal perlu investigasi env/route.
- **Journey Seamless (TC-057..063)**, commit E2E `76b802ca`: TC-060 **hijau parsial** (store picker + store.master fetch); 6 lain = **env deploy gap terverifikasi**: preview-e2e menjalankan build Seamless pra-`f6ba83f49f` (filter lama tanpa Form ids, tanpa field B001 baru, tanpa rename kolom point, tanpa download). Kode journey siap; flag `R114_B001_V2`/`R114_SEAMLESS_V2`. Fixture membership via UI (B001 detail link, id numerik — API direct ditolak ACL test user).
- Sheet Testcases: TC-057..063 Remarks + status diperbarui (Question utk env-gap, TC-060 Approved parsial).
- Sisa implementasi: 25 L2 integration (pola POM-005), 3 halaman L3 gagal, jest utk 25 unit fase-1 yang klaimnya kosong.
