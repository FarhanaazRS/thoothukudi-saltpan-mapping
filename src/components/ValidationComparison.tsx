import { useState, useRef } from 'react'
import type { DashboardData } from '../state/useDashboardData'
import type { LayerVisibility, SaltPanProperties } from '../types'
import { MapView, type MapViewHandle } from './MapView'

interface ValidationComparisonProps {
  data: DashboardData
}

export function ValidationComparison({ data }: ValidationComparisonProps) {
  const { boundary, saltPans, referenceTraining, probabilityBounds, sieveComparison } = data
  const mapRef = useRef<MapViewHandle>(null)
  const [layers, setLayers] = useState<LayerVisibility>({
    boundary: true,
    saltPans: true,
    probability: false,
    referenceTraining: true, // turned ON for this comparison page
  })
  const [selectedFeature, setSelectedFeature] = useState<SaltPanProperties | null>(null)

  const sieve = sieveComparison.data

  const toggleLayer = (key: keyof LayerVisibility) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="validation-page">
      {/* ── Top Metric Cards ─────────────────────────────────────────────────── */}
      <section className="kpis" aria-label="Validation & Post-Processing KPIs">
        <div className="kpi" title="Stage 1: Initial pixel-wise Random Forest prediction before spatial morphological filtering">
          <span className="badge badge-purple">Stage 1: Raw Output</span>
          <h3>Raw Prediction Area</h3>
          <p className="kpi-value">1,873.20 ha</p>
          <p className="kpi-sub">46,830 pixels • 20m resolution</p>
        </div>

        <div className="kpi" title="Stage 2: Morphological sieve filtering removing isolated pixel clumps < 1,000 m²">
          <span className="badge badge-cyan">Stage 2: Sieve Filter</span>
          <h3>Cleaned Raster Area</h3>
          <p className="kpi-value">1,776.08 ha</p>
          <p className="kpi-sub">-97.12 ha (-5.18%) • 2,428 noise px</p>
        </div>

        <div className="kpi" title="Stage 3: Vectorization and Minimum Mapping Unit (MMU >= 1,000 m²) vector pruning">
          <span className="badge badge-gold">Stage 3: Final Inventory</span>
          <h3>Final Vector Inventory</h3>
          <p className="kpi-value">1,631.96 ha</p>
          <p className="kpi-sub">-144.12 ha (-8.11%) • 2,698 parcels</p>
        </div>

        <div className="kpi" title="Total cumulative reduction across all post-processing stages">
          <span className="badge badge-green">Spatial Regularization</span>
          <h3>Total Area Delta</h3>
          <p className="kpi-value">-241.24 ha</p>
          <p className="kpi-sub">-12.88% total post-processing delta</p>
        </div>

        <div className="kpi" title="Total reference polygons digitized for model training and supervision">
          <span className="badge badge-cyan">Ground Context</span>
          <h3>Reference Training Set</h3>
          <p className="kpi-value">501 Polygons</p>
          <p className="kpi-sub">Digitized from Sentinel-2 / GIS</p>
        </div>
      </section>

      {/* ── Main Map Workspace (Reference vs Predicted) ──────────────────────── */}
      <section className="workspace" style={{ marginTop: '16px' }}>
        {/* Left Column: Layer Controls & Context */}
        <aside className="card filters" aria-label="Layer Controls">
          <div className="card-head">
            <h3>Comparison Layers</h3>
            <span className="small muted">Dual Overlay</span>
          </div>

          <fieldset>
            <legend>Dual-Layer Visualization</legend>

            <label className="layer-toggle">
              <input
                type="checkbox"
                checked={layers.referenceTraining}
                onChange={() => toggleLayer('referenceTraining')}
              />
              <span className="swatch swatch-cyan" />
              <strong>Reference Training Set</strong>
            </label>
            <div className="layer-desc">
              501 digitized reference parcels (Cyan) used for model supervision
            </div>

            <label className="layer-toggle" style={{ marginTop: '8px' }}>
              <input
                type="checkbox"
                checked={layers.saltPans}
                onChange={() => toggleLayer('saltPans')}
              />
              <span className="swatch swatch-gold" />
              <strong>Predicted Vector Inventory</strong>
            </label>
            <div className="layer-desc">
              2,698 model-predicted parcels (Gold) across Thoothukudi
            </div>

            <label className="layer-toggle" style={{ marginTop: '8px' }}>
              <input
                type="checkbox"
                checked={layers.probability}
                onChange={() => toggleLayer('probability')}
              />
              <span className="swatch swatch-amber" />
              <strong>Probability Heatmap</strong>
            </label>
            <div className="layer-desc">
              Continuous RF confidence surface (20m preview)
            </div>

            <label className="layer-toggle" style={{ marginTop: '8px' }}>
              <input
                type="checkbox"
                checked={layers.boundary}
                onChange={() => toggleLayer('boundary')}
              />
              <span className="swatch swatch-boundary" />
              <strong>District Boundary</strong>
            </label>
            <div className="layer-desc">
              Official Survey of India administrative boundary
            </div>
          </fieldset>

          <div className="provenance-card" style={{ marginTop: '16px' }}>
            <strong>Visual Inspection Protocol</strong>
            <div>
              Cyan polygons indicate ground reference parcels used during training.
              Gold polygons denote the full-district ML prediction.
              Co-occurrence verifies model recall on known saltern complexes.
            </div>
          </div>

          <div className="provenance-card" style={{ marginTop: '12px' }}>
            <strong>Evaluation Warning</strong>
            <div>
              Do not conflate visual overlay on training samples with independent validation.
              Holdout evaluation metrics (metrics.json) are reported separately.
            </div>
          </div>
        </aside>

        {/* Center Map */}
        <main className="map-wrapper" style={{ padding: 0 }}>
          <MapView
            ref={mapRef}
            boundary={boundary.data ?? null}
            saltPans={saltPans.data ?? null}
            referenceTraining={referenceTraining.data ?? null}
            probabilityBounds={probabilityBounds.data ?? null}
            layers={layers}
            selectedId={selectedFeature?.id ?? null}
            onSelect={setSelectedFeature}
          />
        </main>

        {/* Right Column: Sieve Comparison Inspector */}
        <aside className="card inspector" aria-label="Post-Processing Details">
          <div className="card-head">
            <h3>Post-Processing Impact</h3>
            <span className="badge badge-gold">3 Stages</span>
          </div>

          {sieve ? (
            <div className="inspector-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sieve.stages.map((st, idx) => (
                  <div
                    key={st.stage}
                    style={{
                      padding: '10px 12px',
                      background: 'var(--panel-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px', color: idx === 2 ? 'var(--accent)' : 'inherit' }}>
                        {idx + 1}. {st.stage}
                      </strong>
                      <span className="small num" style={{ fontWeight: 700 }}>
                        {st.area_ha.toFixed(2)} ha
                      </span>
                    </div>
                    <div className="small muted" style={{ marginTop: '3px' }}>
                      Artifact: <code>{st.artifact}</code>
                    </div>
                    <div className="small muted">
                      Count: {st.count.toLocaleString()} {st.units}
                    </div>
                    {st.change_ha !== 0 && (
                      <div
                        className="small"
                        style={{
                          marginTop: '4px',
                          color: 'var(--bad)',
                          fontWeight: 600,
                        }}
                      >
                        Change: {st.change_ha.toFixed(2)} ha ({st.change_pct.toFixed(1)}%)
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="provenance-card" style={{ marginTop: '16px' }}>
                <strong>Sieve vs. MMU Distinction</strong>
                <p className="small muted" style={{ marginTop: '4px', lineHeight: 1.5 }}>
                  <strong>Raster Sieving</strong> operates morphologically on adjacent 20m pixels to eliminate isolated salt-and-pepper noise.
                  <strong> Vector MMU filtering</strong> operates on polygon geometric area (≥1,000 m²) to remove sub-resolution sliver polygons along road edges and tidal ditches.
                </p>
              </div>
            </div>
          ) : (
            <p className="muted small">Loading sieve analysis data...</p>
          )}
        </aside>
      </section>

      {/* ── Diagnostic Caveats & Scientific Verification Panel ──────────────── */}
      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-purple">Scientific Integrity</span>
            <h3>Validation Status &amp; Spatial Diagnostic Audit</h3>
          </div>
          <span className="small muted">Documented Project Baseline</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '12px' }}>
          <div className="provenance-card">
            <strong>1. Independent Field Validation Status: UNAVAILABLE</strong>
            <p className="small muted" style={{ marginTop: '4px' }}>
              No physical in-situ field points or external ground surveys were collected for this study. All validation metrics derive strictly from partitioned spatial-block holdouts of digitized polygons.
            </p>
          </div>

          <div className="provenance-card">
            <strong>2. Candidate vs. Prediction Diagnostics</strong>
            <p className="small muted" style={{ marginTop: '4px' }}>
              Comparison between training polygons and full-district predictions measures reproduction of annotated complexes, not external model generalization. Area agreement across known saltern clusters confirms detection consistency without false exclusions.
            </p>
          </div>

          <div className="provenance-card">
            <strong>3. Regularization vs. Accuracy</strong>
            <p className="small muted" style={{ marginTop: '4px' }}>
              The 241.24 ha reduction between raw raster (1,873.20 ha) and final vector inventory (1,631.96 ha) reflects intentional minimum mapping unit regularization. A smaller mapped footprint indicates spatial noise removal, not classifier error.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
