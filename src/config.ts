import type { LayerVisibility } from './types'

export const DATA_FILES = {
  metadata: '/data/metadata.json',
  boundary: '/data/district_boundary.geojson',
  saltPans: '/data/saltpan_inventory.geojson',
  referenceTraining: '/data/reference_training_salt.geojson',
  probabilityBounds: '/data/probability_bounds.json',
  probabilityPreview: '/data/probability_preview_4326.png',
  modelComparison: '/data/model_comparison.json',
  confusionMatrices: '/data/confusion_matrices.json',
  featureImportance: '/data/feature_importance.json',
  coastalSummary: '/data/coastal_summary.json',
  sieveComparison: '/data/sieve_comparison.json',
  worldcoverComparison: '/data/worldcover_comparison.json',
} as const

export const DEFAULT_LAYERS: LayerVisibility = {
  boundary: true,
  saltPans: true,
  probability: false,
  referenceTraining: false,
}

export const MAP_CONFIG = {
  center: [78.1348, 8.805] as [number, number],
  defaultZoom: 9.3,
  minZoom: 7.5,
  maxZoom: 16,
  bounds: [77.67, 8.32, 78.39, 9.38] as [number, number, number, number],
  attribution: 'ESA Sentinel-2 L2A • ESA WorldCover • Tamil Nadu GIS • Thoothukudi Salt Intelligence',
}

export const BASE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#0B0D10' },
    },
  ],
}

export const COLORS = {
  bg: '#0B0D10',
  panel: '#14181E',
  panel2: '#1A1F27',
  border: 'rgba(255, 255, 255, 0.09)',
  text: '#E8EAED',
  muted: '#98A2B3',
  accent: '#F2C94C', // Gold / Amber
  accentGlow: 'rgba(242, 201, 76, 0.35)',
  saltFill: '#F2C94C',
  saltOutline: '#E5B836',
  trainingFill: '#56B4E9',
  trainingOutline: '#2D87B8',
  boundaryFill: '#14181E',
  boundaryStroke: '#64748B',
  ok: '#7BD88F',
  bad: '#FF6B5E',
}
