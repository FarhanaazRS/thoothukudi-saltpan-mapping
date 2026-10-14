# Implementation Plan: Thoothukudi Salt Pan Intelligence Dashboard
**Application:** Thoothukudi Salt Pan Intelligence  
**Subtitle:** District Mapping & Classification Analytics  
**Date:** 2026-10-14  

---

## 1. Product & Architecture Overview

The **Thoothukudi Salt Pan Intelligence** dashboard is an interactive geospatial analytics application designed to showcase satellite-derived salt pan mapping, spatial distribution, land-use statistics, and machine learning classification benchmarks across Thoothukudi district, Tamil Nadu.

It inherits the design language, dark aesthetic, and component architecture of **Cuddalore Risk Intelligence** while being custom-tailored to multispectral remote sensing and salt-pan detection.

### Core Stack
- **Framework:** React 18.3.1 + TypeScript 5.6.3 + Vite 5.4.9
- **Map Engine:** MapLibre GL JS 4.7.1
- **Styling:** Custom Vanilla CSS design tokens (`#0B0D10` canvas, `#14181E` glass panels, `#F2C94C` gold accent)
- **Data Pipeline:** Python GIS export scripts + static data synchronization (`scripts/sync-data.mjs`)
- **Testing:** Vitest 2.1.3 + React Testing Library + JSDOM

---

## 2. Page & Navigation Structure

| Page Index | Page Name | Status (Prompt 1) | Scope & Features |
|:---:|---|:---:|---|
| **1** | **Overview** | **Implemented** | Verified KPIs, interactive MapLibre map, layer toggles (Boundary, Salt Pans, Probability, Training Polygons), zoom-to-district, polygon inspector, legend. |
| **2** | **Salt Pan Explorer** | *Deferred to Prompt 2* | Ranked parcel table, coastal distance distribution, parcel area histogram, high-resolution inspector. |
| **3** | **Model Lab** | *Deferred to Prompt 2* | 7-model benchmark matrix, ROC/PR curves, confusion matrices, feature importance rankings. |
| **4** | **Validation & Comparison** | *Deferred to Prompt 2* | Sieve filter comparison, raster vs. vector discrepancy analysis, spatial holdout diagnostic inspector. |
| **5** | **Area Analytics** | *Deferred to Prompt 2* | Taluk/coastal zone breakdown, WorldCover comparison, spatial concentration heatmaps. |

---

## 3. Data Flow & Preparation Strategy

1. **District Boundary (`public/data/district_boundary.geojson`):**
   - Derived from `_district_mask_temp.gpkg` reprojected to EPSG:4326.
   - Clean single MultiPolygon geometry (346 KB), loaded on first paint.
2. **Salt Pan Inventory (`public/data/saltpan_inventory.geojson`):**
   - Derived from `outputs/ml_benchmark/predictions/saltpan_inventory.gpkg` reprojected to EPSG:4326.
   - 2,698 polygons with original attributes (`id`, `area_m2`, `area_ha`, `class_name`).
   - Compact payload (~1.86 MB) loaded client-side with click listeners and hover states.
3. **Reference Training Parcels (`public/data/reference_training_salt.geojson`):**
   - Derived from `_tmp/salt_train_32643.gpkg` (501 polygons, reprojected to EPSG:4326).
   - Toggled off by default for provenance verification.
4. **Probability Raster Preview (`public/data/probability_preview_4326.png` & `probability_bounds.json`):**
   - High-quality RGBA preview with amber/gold heatmap colormap, transparent for non-salt / nodata pixels.
   - Displayed via MapLibre's native `image` layer with exact 4-corner georeferencing.
5. **Metadata & Benchmark Summary (`public/data/metadata.json`, `public/data/benchmark_summary.json`):**
   - Structured JSON capturing all verified KPIs, model comparisons, and timestamps.

---

## 4. Prompt 1 Execution Checklist

- [x] Protect existing Cuddalore project (zero modifications).
- [x] Audit Thoothukudi GIS and ML benchmark outputs.
- [x] Formulate authoritative layer selections and documentation.
- [ ] Implement data preparation script (`scripts/prepare_dashboard_data.py`).
- [ ] Export map-ready GeoJSONs, metadata, and raster preview into `dashboard/public/data/`.
- [ ] Create dashboard project files (`package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`).
- [ ] Build design system (`styles.css`), shell (`Shell.tsx`), and types (`types.ts`).
- [ ] Build interactive map component (`MapView.tsx`) with layer controls, legends, fit bounds, and polygon click inspection.
- [ ] Build functional Overview page (`Overview.tsx`) with verified KPI cards and inspector panel.
- [ ] Write automated tests and verify via `tsc --noEmit`, `vitest run`, and `vite build`.
- [ ] Launch development server and conduct live browser testing.
