# Data Audit & Authoritative Layer Selection
**Project:** Thoothukudi Salt Pan Intelligence  
**Study Area:** Thoothukudi (Tuticorin) District, Tamil Nadu, India  
**Date:** 2026-10-14  
**Author:** Geospatial Software Engineer & GIS Analyst  

---

## 1. Executive Summary

This document establishes the authoritative data baseline for the **Thoothukudi Salt Pan Intelligence** interactive dashboard. All geospatial datasets, satellite imagery products, machine-learning models, and evaluation reports were audited on disk in `D:\Thoothukudi_WorldCover` and cross-verified against the final verification audit.

---

## 2. Inventory of Audited Datasets

### 2.1 Study Area & District Boundary
- **Candidate Files Inspected:**
  1. `_district_mask_temp.gpkg` (EPSG:4326, 1 feature, MultiPolygon)
  2. `D:\QGIS\thoothukodi.shp` (EPSG:4326, 1 feature, MultiPolygon)
  3. `_scratch_saltpan_cleanup\District_UTM_for_10km.gpkg` (EPSG:32643)
- **Authoritative Selection:** `_district_mask_temp.gpkg` / `thoothukodi.shp`
- **Verification:** Both files contain the identical official Survey of India / Tamil Nadu administrative boundary for Thoothukudi district (total bounds: `[77.6728°E, 8.3216°N, 78.3854°E, 9.3727°N]`).
- **Dashboard Role:** Authoritative district boundary mask and baseline spatial extent.

### 2.2 Salt Pan Inventory Layers (Vector)
- **Candidate Files Inspected:**
  1. `outputs/ml_benchmark/predictions/saltpan_inventory.gpkg`
     - **Count:** 2,698 polygons
     - **Area:** 1,631.96 ha
     - **CRS:** EPSG:32643
     - **Columns:** `['id', 'area_m2', 'area_ha', 'class_name']`
     - **Status:** **Authoritative Final Output**. Derived from full-scene Sentinel-2 Random Forest inference + spatial sieve filter ($1,000\text{ m}^2$ MMU) + polygonization. Fully reconciled in audit.
  2. `Thoothukudi_FINAL_SaltPan_Inventory.gpkg`
     - **Count:** 908 polygons, Area: 912.79 ha
     - **Status:** Legacy 15 km coastal buffer subset; superseded by benchmark district mapping.
  3. `Thoothukudi_SaltPans_FINAL.gpkg`
     - **Count:** 3,979 polygons, Area: 13,674.68 ha
     - **Status:** Intermediate candidate blocks before coastal distance and spectral cleanup.
  4. `Thoothukudi_SaltPan_FINAL.gpkg` & `Thoothukudi_SaltPan_VERIFIED.gpkg`
     - **Count:** 490 to 513 polygons, Area: ~1,161 to 1,242 ha
     - **Status:** Manual training/validation reference sets; superseded as the district inventory.
- **Authoritative Selection:** `outputs/ml_benchmark/predictions/saltpan_inventory.gpkg`

### 2.3 Prediction & Probability Rasters
- **Candidate Files Inspected:**
  1. `outputs/ml_benchmark/predictions/saltpan_prediction_cleaned.tif`
     - **Dimensions:** $8,491 \times 10,617$ pixels ($90,148,947$ total pixels)
     - **Resolution:** $20.0\text{ m} \times 20.0\text{ m}$ ($400\text{ m}^2$ per pixel)
     - **CRS:** EPSG:32643
     - **Valid Pixels:** 44,402 salt pixels ($1,776.08\text{ ha}$)
     - **Status:** **Authoritative Cleaned Classification Raster**.
  2. `outputs/ml_benchmark/predictions/saltpan_probability.tif`
     - **Dimensions:** $8,491 \times 10,617$ pixels
     - **Data Type:** Float32 (probabilities in range $[0.0000, 0.9952]$)
     - **NoData:** $-9999.0$
     - **Status:** **Authoritative Probability Surface**.
  3. `outputs/ml_benchmark/predictions/saltpan_prediction_raw.tif`
     - **Status:** Intermediate pre-sieve binary prediction ($46,830\text{ px} = 1,873.20\text{ ha}$).
  4. `THOOTHUKUDI_SALT_PANS_FINAL_3_5KM.tif`
     - **Dimensions:** $9,536 \times 6,429$ pixels
     - **CRS:** `None` (Ungeoreferenced display raster).
     - **Status:** Rejected as non-georeferenced.

### 2.4 Satellite Imagery & Context Layers
- **Sensors Used:** European Space Agency **Sentinel-2 Level-2A (MSI)**
- **Acquisitions:**
  - `S2B_MSIL2A_20260810T050649_N0512_R019_T43PHK` (2026-08-10, 6 bands)
  - `S2B_MSIL2A_20260810T050649_N0512_R019_T44PKR` (2026-08-10, 6 bands)
  - `S2C_MSIL2A_20260904T050651_N0512_R019_T43PHL` (2026-09-04, 6 bands)
- **Spectral Bands:** B02 (Blue), B03 (Green), B04 (Red), B08 (NIR), B11 (SWIR-1), B12 (SWIR-2).
- **Supporting Layer:** ESA WorldCover 2021 10m Land Cover.
  - Class 62: Sparse/bare vegetation proxy (not salt pan ground truth).
  - Class 80: Permanent open water (used for coastal water masking).
  - Note: Not Resourcesat-2 or LISS-III.

### 2.5 Machine Learning Benchmark & Validation Results
- **Benchmark Location:** `outputs/ml_benchmark/`
- **Validated Sample Size:** 8,426 polygons (501 salt pan, 7,925 non-salt; 15.82:1 imbalance ratio).
- **Models Benchmarked:** Logistic Regression, Random Forest, Extra Trees, XGBoost, SVM (RBF), QDA, Gradient Boosting.
- **Selected Spatial Holdout Results:**
  - **Winning Model (Holdout F1):** SVM (RBF Kernel)
    - Accuracy: **99.51%**
    - Salt-Pan Precision: **100.0%**
    - Salt-Pan Recall: **80.0%**
    - Salt-Pan F1: **88.89%**
    - Confusion Matrix: $TN=201, FP=0, FN=1, TP=4$
  - **Production District Classifier:** Random Forest (300 trees)
    - ROC-AUC: **1.000**, PR-AUC: **1.000**, Precision: **1.000**, Salt-Pan F1: **75.0%**
- **Documented Caveat:** Spatial-block holdout had polygon ID collision and minority class spatial backfilling. Independent external field-verified ground truth was unavailable.

---

## 3. Discrepancy Reconciliation Summary

| Processing Stage | Source Artifact | Area (ha) | Polygons / Pixels | Explanation |
|---|---|:---:|:---:|---|
| Raw Model Prediction | `saltpan_prediction_raw.tif` | 1,873.20 ha | 46,830 px | Pixel-level classification before spatial filtering |
| Sieve Post-Processing | `saltpan_prediction_cleaned.tif` | 1,776.08 ha | 44,402 px | Removed 2,428 isolated noise pixels ($< 1,000\text{ m}^2$) |
| Vector Polygonization | `saltpan_inventory.gpkg` | 1,631.96 ha | 2,698 polys | Removed 2,549 sub-MMU vector slivers ($< 1,000\text{ m}^2$) |

Each metric is distinct and describes its own exact artifact.
