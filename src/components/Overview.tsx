import { useState, useRef } from 'react'
import type { DashboardData } from '../state/useDashboardData'
import type { SaltPanProperties, LayerVisibility } from '../types'
import { MapView, type MapViewHandle } from './MapView'
import { DEFAULT_LAYERS } from '../config'

interface OverviewProps {
  data: DashboardData
  selectedFeature?: SaltPanProperties | null
  onSelectFeature?: (feat: SaltPanProperties | null) => void
}

export function Overview({ data, selectedFeature: propFeature, onSelectFeature: propOnSelect }: OverviewProps) {
  const { metadata, boundary, saltPans, referenceTraining, probabilityBounds } = data
  const [layers, setLayers] = useState<LayerVisibility>(DEFAULT_LAYERS)
  const [localFeature, setLocalFeature] = useState<SaltPanProperties | null>(null)
  const mapRef = useRef<MapViewHandle>(null)

  const selectedFeature = propFeature !== undefined ? propFeature : localFeature

  const meta = metadata.data
  const kpis = meta?.kpis

  const toggleLayer = (key: keyof LayerVisibility) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSelectFeature = (feat: SaltPanProperties | null) => {
    if (propOnSelect) {
      propOnSelect(feat)
    } else {
      setLocalFeature(feat)
    }
  }

  const handleZoomToSelected = () => {
    if (selectedFeature && selectedFeature.centroid_lon && selectedFeature.centroid_lat) {
      mapRef.current?.zoomToPolygon(selectedFeature.centroid_lon, selectedFeature.centroid_lat, selectedFeature.id)
    }
  }

  return (
    <div className="overview">
      {/* ── KPI Row ──────────────────────────────────────────────────────────── */}
      <section className="kpis" aria-label="Key Performance Indicators">
        <div
          className="kpi"
          title="Source: outputs/ml_benchmark/predictions/saltpan_inventory.gpkg&#10;Total area of 2,698 vectorized salt pan polygons after 1,000 m² MMU filter."
        >
          <span className="badge badge-gold">Authoritative Inventory</span>
          <h3>Final Mapped Salt Area</h3>
          <p className="kpi-value">
            {kpis ? `${kpis.total_saltpan_area_ha.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ha` : '...'}
          </p>
          <p className="kpi-sub">
            Verified vector polygons • MMU ≥ 1,000 m²
          </p>
        </div>

        <div
          className="kpi"
          title="Source: outputs/ml_benchmark/predictions/saltpan_inventory.gpkg&#10;Total distinct contiguous salt pan parcels identified across Thoothukudi district."
        >
          <span className="badge badge-gold">Vector Parcels</span>
          <h3>Mapped Polygons</h3>
          <p className="kpi-value">
            {kpis ? kpis.total_polygons.toLocaleString() : '...'}
          </p>
          <p className="kpi-sub">
            Contiguous salt pan parcels in Thoothukudi
          </p>
        </div>

        <div
          className="kpi"
          title="Source: outputs/ml_benchmark/results/metrics.json&#10;Spatial-block holdout evaluation (206 polygons: 201 non-salt, 5 salt). Top F1-score model: SVM RBF (Holdout accuracy 99.51%, Precision 100%, Recall 80%)."
        >
          <span className="badge badge-purple">Spatial Holdout</span>
          <h3>Top Benchmark Acc.</h3>
          <p className="kpi-value">
            {kpis ? `${(kpis.top_holdout_accuracy * 100).toFixed(1)}%` : '...'}
          </p>
          <p className="kpi-sub">
            SVM RBF • Holdout Salt-F1: 88.9% (Prec: 100%)
          </p>
        </div>

        <div
          className="kpi"
          title="Source: outputs/ml_benchmark/models/RandomForest_pipeline.pkl&#10;Production full-district classifier: Random Forest (300 trees, ROC-AUC: 1.000, PR-AUC: 1.000, Precision: 100% on validation)."
        >
          <span className="badge badge-green">Production Model</span>
          <h3>Classifier Precision</h3>
          <p className="kpi-value">
            {kpis ? `${(kpis.production_precision * 100).toFixed(0)}%` : '...'}
          </p>
          <p className="kpi-sub">
            Random Forest (300 trees) • Zero false alarms
          </p>
        </div>

        <div
          className="kpi"
          title="Source: outputs/ml_benchmark/predictions/saltpan_prediction_cleaned.tif&#10;Post-sieve classification raster: 44,402 salt pixels at 20m resolution (1,776.08 ha) after removing isolated <1,000 m² pixel noise from raw raster (1,873.20 ha)."
        >
          <span className="badge badge-cyan">Sieve Filter</span>
          <h3>Cleaned Raster Area</h3>
          <p className="kpi-value">
            {kpis ? `${kpis.cleaned_raster_area_ha.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ha` : '...'}
          </p>
          <p className="kpi-sub">
            44,402 valid pixels at 20m • Raw: 1,873.2 ha
          </p>
        </div>
      </section>

      {/* ── Main Workspace (Filters + Map + Inspector) ───────────────────────── */}
      <section className="workspace">
        {/* Left Column: Layer Controls */}
        <aside className="card filters" aria-label="Map Layer Controls">
          <div className="card-head">
            <h3>Map Layers</h3>
            <span className="small muted">Display</span>
          </div>

          <fieldset>
            <legend>Primary GIS Layers</legend>

            <label className="layer-toggle">
              <input
                type="checkbox"
                checked={layers.saltPans}
                onChange={() => toggleLayer('saltPans')}
              />
              <span className="swatch swatch-gold" />
              <strong>Salt Pan Inventory</strong>
            </label>
            <div className="layer-desc">
              Authoritative 2,698 vector polygons (1,631.96 ha)
            </div>

            <label className="layer-toggle" style={{ marginTop: '6px' }}>
              <input
                type="checkbox"
                checked={layers.boundary}
                onChange={() => toggleLayer('boundary')}
              />
              <span className="swatch swatch-boundary" />
              <strong>District Boundary</strong>
            </label>
            <div className="layer-desc">
              Survey of India / Tamil Nadu administrative boundary
            </div>

            <label className="layer-toggle" style={{ marginTop: '6px' }}>
              <input
                type="checkbox"
                checked={layers.probability}
                onChange={() => toggleLayer('probability')}
              />
              <span className="swatch swatch-amber" />
              <strong>Probability Surface</strong>
            </label>
            <div className="layer-desc">
              Sentinel-2 RF confidence heatmap (preview derivative)
            </div>

            <label className="layer-toggle" style={{ marginTop: '6px' }}>
              <input
                type="checkbox"
                checked={layers.referenceTraining}
                onChange={() => toggleLayer('referenceTraining')}
              />
              <span className="swatch swatch-cyan" />
              <strong>Reference Training</strong>
            </label>
            <div className="layer-desc">
              501 reference training polygons (off by default)
            </div>
          </fieldset>

          <div className="provenance-card" style={{ marginTop: '16px' }}>
            <strong>Sensor Provenance</strong>
            <div>Sentinel-2 MSI Level-2A (20m)</div>
            <div style={{ marginTop: '4px' }}>Bands: B02, B03, B04, B08, B11, B12</div>
            <div style={{ marginTop: '4px', opacity: 0.8 }}>Dates: Aug 10 &amp; Sep 04, 2026</div>
          </div>
        </aside>

        {/* Center Column: Map Workspace */}
        <main className="map-wrapper" style={{ padding: 0 }}>
          <MapView
            ref={mapRef}
            boundary={boundary.data ?? null}
            saltPans={saltPans.data ?? null}
            referenceTraining={referenceTraining.data ?? null}
            probabilityBounds={probabilityBounds.data ?? null}
            layers={layers}
            selectedId={selectedFeature?.id ?? null}
            onSelect={handleSelectFeature}
          />
        </main>

        {/* Right Column: Feature Inspector */}
        <aside className="card inspector" aria-label="Feature Detail Inspector">
          <div className="card-head">
            <h3>Parcel Inspector</h3>
            {selectedFeature && (
              <span className="badge badge-gold">ID #{selectedFeature.id}</span>
            )}
          </div>

          {selectedFeature ? (
            <div className="inspector-body">
              <table className="attr-table">
                <tbody>
                  <tr>
                    <th>Feature ID</th>
                    <td>#{selectedFeature.id}</td>
                  </tr>
                  <tr>
                    <th>Classification</th>
                    <td style={{ color: 'var(--accent)' }}>Salt Pan</td>
                  </tr>
                  <tr>
                    <th>Area (Hectares)</th>
                    <td>{Number(selectedFeature.area_ha).toFixed(2)} ha</td>
                  </tr>
                  <tr>
                    <th>Area (m²)</th>
                    <td>{Number(selectedFeature.area_m2).toLocaleString()} m²</td>
                  </tr>
                  {selectedFeature.centroid_lon && selectedFeature.centroid_lat && (
                    <>
                      <tr>
                        <th>Longitude</th>
                        <td>{Number(selectedFeature.centroid_lon).toFixed(4)}°E</td>
                      </tr>
                      <tr>
                        <th>Latitude</th>
                        <td>{Number(selectedFeature.centroid_lat).toFixed(4)}°N</td>
                      </tr>
                    </>
                  )}
                  <tr>
                    <th>CRS</th>
                    <td>EPSG:32643 (UTM 43N)</td>
                  </tr>
                  <tr>
                    <th>Source Layer</th>
                    <td className="small" style={{ wordBreak: 'break-all' }}>saltpan_inventory.gpkg</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  className="btn"
                  onClick={handleZoomToSelected}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Zoom to Parcel
                </button>
                <button
                  className="btn"
                  onClick={() => handleSelectFeature(null)}
                  style={{ background: 'transparent' }}
                  title="Clear Selection"
                >
                  Clear
                </button>
              </div>

              <div className="provenance-card">
                <strong>Parcel Geometry Note</strong>
                <div>Filtered by Minimum Mapping Unit (MMU ≥ 1,000 m²). Sieve post-processing removed single-pixel artifacts.</div>
              </div>
            </div>
          ) : (
            <div className="inspector-body" style={{ color: 'var(--muted)', fontSize: '13px' }}>
              <p>
                Click any gold salt pan polygon on the map to inspect its verified geospatial area, coordinates, and classification parameters.
              </p>
              <div className="provenance-card">
                <strong>District Geography</strong>
                <div>Thoothukudi salt production is concentrated along the Gulf of Mannar coastal plain, characterized by high solar irradiance and low seasonal precipitation.</div>
              </div>
              <div className="provenance-card" style={{ marginTop: '8px' }}>
                <strong>Validation Status</strong>
                <div>Evaluated via spatial block holdout. Independent external ground truth points are currently unavailable.</div>
              </div>
            </div>
          )}
        </aside>
      </section>
    </div>
  )
}
