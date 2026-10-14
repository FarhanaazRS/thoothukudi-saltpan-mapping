/**
 * Strict TypeScript Data Models for Thoothukudi Salt Pan Intelligence
 */

export interface SaltPanProperties {
  id: number
  area_m2: number
  area_ha: number
  class_name: string
  centroid_lon?: number
  centroid_lat?: number
  coastal_band?: '0-5km' | '5-10km' | '10-30km' | '>30km'
  perimeter_m?: number
}

export type SaltPanFeature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon, SaltPanProperties>
export type SaltPanCollection = GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, SaltPanProperties>

export interface DistrictProperties {
  district_name: string
}
export type DistrictBoundaryFeature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon, DistrictProperties>
export type DistrictBoundaryCollection = GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, DistrictProperties>

export interface ProbabilityBounds {
  top_left: [number, number]
  top_right: [number, number]
  bottom_right: [number, number]
  bottom_left: [number, number]
  bbox: [number, number, number, number]
  coordinates: [
    [number, number],
    [number, number],
    [number, number],
    [number, number]
  ]
}

export interface ModelBenchmarkRow {
  model: string
  n_test: number
  salt_support: number
  nonsalt_support: number
  overall_accuracy: number
  balanced_accuracy: number
  salt_precision: number
  salt_recall: number
  salt_f1: number
  nonsalt_precision: number
  nonsalt_recall: number
  nonsalt_f1: number
  macro_f1: number
  weighted_f1: number
  salt_iou?: number
  roc_auc: number | null
  pr_auc: number | null
  cv_salt_f1_train?: number
  evaluation_type: string
}

export interface FeatureImportanceItem {
  feature: string
  importance: number
}

export type FeatureImportanceMap = Record<string, FeatureImportanceItem[]>
export type ConfusionMatrixMap = Record<string, number[][]>

export interface CoastalSummaryItem {
  band: '0-5km' | '5-10km' | '10-30km' | '>30km'
  label: string
  description: string
  count: number
  area_ha: number
  pct_area: number
}

export interface SieveStage {
  stage: string
  artifact: string
  units: string
  count: number
  area_ha: number
  change_ha: number
  change_pct: number
  description: string
}

export interface SieveComparisonData {
  stages: SieveStage[]
  total_reduction_ha: number
  total_reduction_pct: number
  notes: string
}

export interface WorldCoverClassItem {
  class_code: number
  class_name: string
  description: string
  parcel_count: number
  pct_parcels: number
  context_role: string
}

export interface DashboardKPIs {
  total_saltpan_area_ha: number
  total_polygons: number
  cleaned_raster_area_ha: number
  raw_raster_area_ha: number
  sieve_mmu_m2: number
  top_holdout_model: string
  top_holdout_accuracy: number
  top_holdout_f1: number
  top_holdout_precision: number
  top_holdout_recall: number
  production_raster_model: string
  production_roc_auc: number
  production_precision: number
  valid_classified_pixels: number
  valid_classified_area_ha: number
  total_district_raster_pixels: number
  valid_pixel_pct: number
}

export interface Metadata {
  project_name: string
  subtitle: string
  version: string
  generated_at: string
  study_area: {
    name: string
    state: string
    bbox: [number, number, number, number]
    center: [number, number]
    default_zoom: number
  }
  sensors: Array<{
    name: string
    provider?: string
    resolution_m?: number
    role?: string
    acquisitions?: Array<{ tile: string; date: string }>
    bands_used?: string[]
  }>
  kpis: DashboardKPIs
  provenance: {
    authoritative_inventory: string
    authoritative_cleaned_raster: string
    authoritative_probability_raster: string
    validation_strategy: string
    independent_field_validation: boolean
    validation_note: string
  }
}

export interface LayerVisibility {
  boundary: boolean
  saltPans: boolean
  probability: boolean
  referenceTraining: boolean
}

