import { useState, useMemo } from 'react'
import type { DashboardData } from '../state/useDashboardData'

interface AreaAnalyticsProps {
  data: DashboardData
}

export function AreaAnalytics({ data }: AreaAnalyticsProps) {
  const { coastalSummary, worldcoverComparison, saltPans, metadata } = data
  const [selectedBand, setSelectedBand] = useState<string>('all')

  const meta = metadata.data
  const kpis = meta?.kpis
  const coastal = Array.isArray(coastalSummary.data) ? coastalSummary.data : []
  const worldcover = Array.isArray(worldcoverComparison.data) ? worldcoverComparison.data : []

  // Top 10 Largest Parcels
  const topParcels = useMemo(() => {
    if (!saltPans.data?.features) return []
    const sorted = [...saltPans.data.features]
      .map((f) => f.properties)
      .sort((a, b) => b.area_ha - a.area_ha)
    return sorted.slice(0, 10)
  }, [saltPans.data])

  // Filtered parcels by coastal band if selected
  const activeBandParcels = useMemo(() => {
    if (!saltPans.data?.features || selectedBand === 'all') return []
    return saltPans.data.features
      .map((f) => f.properties)
      .filter((p) => p.coastal_band === selectedBand)
  }, [saltPans.data, selectedBand])

  const exportCoastalCSV = () => {
    const headers = ['band', 'label', 'description', 'parcel_count', 'area_ha', 'pct_area']
    const rows = coastal.map((c) => [
      c.band,
      `"${c.label}"`,
      `"${c.description}"`,
      c.count,
      c.area_ha.toFixed(2),
      c.pct_area.toFixed(1),
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'thoothukudi_coastal_stratification.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportWorldCoverCSV = () => {
    const headers = ['class_code', 'class_name', 'description', 'parcel_count', 'pct_parcels', 'context_role']
    const rows = worldcover.map((w) => [
      w.class_code,
      `"${w.class_name}"`,
      `"${w.description}"`,
      w.parcel_count,
      w.pct_parcels.toFixed(1),
      `"${w.context_role}"`,
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'thoothukudi_worldcover_comparison.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="analytics-page">
      {/* ── Area KPIs with Explicit Artifact Provenance ──────────────────────── */}
      <section className="kpis" aria-label="Area Analytics KPIs">
        <div className="kpi" title="Artifact: outputs/ml_benchmark/predictions/saltpan_inventory.gpkg&#10;Total area of 2,698 vectorized salt pan polygons after 1,000 m² MMU filter.">
          <span className="badge badge-gold">Final Vector</span>
          <h3>Inventory Mapped Area</h3>
          <p className="kpi-value">
            {kpis?.total_saltpan_area_ha !== undefined ? `${kpis.total_saltpan_area_ha.toFixed(2)} ha` : '1,631.96 ha'}
          </p>
          <p className="kpi-sub">2,698 parcels • MMU ≥ 1,000 m²</p>
        </div>

        <div className="kpi" title="Artifact: outputs/ml_benchmark/predictions/saltpan_prediction_cleaned.tif&#10;Total area of 44,402 valid salt pixels (20m resolution) after morphological sieve filter.">
          <span className="badge badge-cyan">Sieve Raster</span>
          <h3>Cleaned Raster Area</h3>
          <p className="kpi-value">
            {kpis?.cleaned_raster_area_ha !== undefined ? `${kpis.cleaned_raster_area_ha.toFixed(2)} ha` : '1,776.08 ha'}
          </p>
          <p className="kpi-sub">44,402 salt pixels at 20m res</p>
        </div>

        <div className="kpi" title="Artifact: outputs/ml_benchmark/predictions/saltpan_prediction_raw.tif&#10;Total area of 46,830 valid salt pixels (20m resolution) before morphological spatial filtering.">
          <span className="badge badge-purple">Pre-Sieve Raw</span>
          <h3>Raw Prediction Area</h3>
          <p className="kpi-value">
            {kpis?.raw_raster_area_ha !== undefined ? `${kpis.raw_raster_area_ha.toFixed(2)} ha` : '1,873.20 ha'}
          </p>
          <p className="kpi-sub">46,830 pixels • Raw RF threshold</p>
        </div>

        <div className="kpi" title="Artifact: outputs/ml_benchmark/predictions/saltpan_prediction_cleaned.tif&#10;Valid pixels within district raster mask (52,858,018 pixels = 211,432.07 ha).">
          <span className="badge badge-green">Valid Mask</span>
          <h3>District Classified Area</h3>
          <p className="kpi-value">
            {kpis?.valid_classified_area_ha !== undefined ? `${(kpis.valid_classified_area_ha / 1000).toFixed(1)}k ha` : '211.4k ha'}
          </p>
          <p className="kpi-sub">{kpis?.valid_pixel_pct !== undefined ? `${kpis.valid_pixel_pct.toFixed(1)}%` : '58.6%'} valid raster pixels</p>
        </div>

        <div className="kpi" title="Distribution averages across all 2,698 parcels">
          <span className="badge badge-gold">Dimensions</span>
          <h3>Mean / Median Size</h3>
          <p className="kpi-value">0.60 / 0.28 ha</p>
          <p className="kpi-sub">Max: 23.47 ha • Min: 0.10 ha</p>
        </div>
      </section>

      {/* ── Coastal Proximity Section ────────────────────────────────────────── */}
      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-head">
          <div>
            <h3>Coastal Proximity Stratification</h3>
            <span className="small muted">
              Spatial allocation of salt pan parcels across verified coastal distance bands (Thoothukudi_Coastal_5km/10km/30km.gpkg)
            </span>
          </div>
          <button className="btn btn-sm" onClick={exportCoastalCSV} title="Export coastal stratification data to CSV">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Coastal CSV
          </button>
        </div>

        <p className="small muted" style={{ marginTop: '4px', marginBottom: '14px', lineHeight: 1.5 }}>
          Salt production in Thoothukudi depends heavily on coastal seawater intake along the Gulf of Mannar.
          Over 50% of mapped parcel acreage is located within 10 km of the shoreline, with significant secondary concentration in the 10–30 km intermediate coastal plain.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {coastal.map((b) => {
            const isSelected = selectedBand === b.band
            return (
              <div
                key={b.band}
                className="card"
                onClick={() => setSelectedBand(isSelected ? 'all' : b.band)}
                style={{
                  background: isSelected ? 'rgba(242, 201, 76, 0.08)' : 'var(--panel-2)',
                  borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                  cursor: 'pointer',
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-gold" style={{ fontSize: '10px' }}>{b.band}</span>
                  <span className="small num" style={{ fontWeight: 700, color: 'var(--accent)' }}>
                    {b.pct_area.toFixed(1)}% of Area
                  </span>
                </div>
                <h4 style={{ marginTop: '8px', fontSize: '14px' }}>{b.label}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                  <div>
                    <div className="small muted">Parcels</div>
                    <strong>{b.count.toLocaleString()}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="small muted">Mapped Area</div>
                    <strong>{b.area_ha.toFixed(2)} ha</strong>
                  </div>
                </div>
                <p className="small muted" style={{ marginTop: '8px', fontSize: '11.5px', lineHeight: 1.4 }}>
                  {b.description}
                </p>
              </div>
            )
          })}
        </div>

        {selectedBand !== 'all' && (
          <div className="provenance-card" style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Active Filter: {selectedBand} Band ({activeBandParcels.length} parcels)</strong>
              <button className="link small" onClick={() => setSelectedBand('all')}>
                Show All Bands
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Two Column: Ranked Largest Parcels & WorldCover Comparison ─────────── */}
      <div className="workspace-two-col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px', marginTop: '16px' }}>
        {/* Left: Ranked Largest Salt Pan Parcels */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>Ranked Largest Salt Pan Parcels</h3>
              <span className="small muted">Top 10 contiguous saltern complexes in Thoothukudi</span>
            </div>
            <span className="badge badge-gold">Top 10</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" aria-label="Top 10 Largest Salt Pan Parcels">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>ID</th>
                  <th className="num">Area (ha)</th>
                  <th className="num">Area (m²)</th>
                  <th className="num">Perimeter</th>
                  <th>Zone</th>
                  <th>Coordinates</th>
                </tr>
              </thead>
              <tbody>
                {topParcels.map((p, idx) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, color: 'var(--muted)' }}>#{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>#{p.id}</td>
                    <td className="num" style={{ fontWeight: 700 }}>{p.area_ha.toFixed(2)}</td>
                    <td className="num muted">{p.area_m2.toLocaleString()}</td>
                    <td className="num muted">{p.perimeter_m ? `${p.perimeter_m.toFixed(0)} m` : '—'}</td>
                    <td>
                      <span className="badge badge-gold" style={{ fontSize: '10px' }}>
                        {p.coastal_band ?? 'General'}
                      </span>
                    </td>
                    <td className="small muted">
                      {p.centroid_lon && p.centroid_lat
                        ? `${p.centroid_lon.toFixed(3)}°E, ${p.centroid_lat.toFixed(3)}°N`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: ESA WorldCover 2021 Reference Comparison */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>ESA WorldCover 2021 Comparison</h3>
              <span className="small muted">Point-sampled correspondence of inventory polygons</span>
            </div>
            <button className="btn btn-sm" onClick={exportWorldCoverCSV} title="Export WorldCover comparison data">
              Export CSV
            </button>
          </div>

          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
            <p className="small muted" style={{ margin: 0, lineHeight: 1.5 }}>
              ESA WorldCover does not include a dedicated salt-pan category. Salt pans spectrally split between <strong>Class 60/62 (Bare/sparse vegetation, 38.3%)</strong> when dry/crusted and <strong>Class 80 (Permanent water bodies, 30.3%)</strong> when filled with brine.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" aria-label="ESA WorldCover 2021 Class Comparison">
              <thead>
                <tr>
                  <th>Class Code</th>
                  <th>WorldCover Classification</th>
                  <th className="num">Parcels</th>
                  <th className="num">% Parcels</th>
                  <th>Contextual Role</th>
                </tr>
              </thead>
              <tbody>
                {worldcover.map((w) => (
                  <tr key={w.class_code}>
                    <td>
                      <span className="badge badge-purple" style={{ fontSize: '10px' }}>
                        {w.class_code === 0 ? 'Ocean/Tidal' : `Class ${w.class_code}`}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{w.class_name}</td>
                    <td className="num">{w.parcel_count.toLocaleString()}</td>
                    <td className="num" style={{ fontWeight: 700, color: w.class_code === 60 || w.class_code === 80 ? 'var(--accent)' : 'inherit' }}>
                      {w.pct_parcels.toFixed(1)}%
                    </td>
                    <td className="small muted">{w.context_role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
