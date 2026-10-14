import { useState, useMemo } from 'react'
import type { DashboardData } from '../state/useDashboardData'
import type { SaltPanProperties } from '../types'

interface SaltPanExplorerProps {
  data: DashboardData
  onInspectParcel?: (feature: SaltPanProperties) => void
}

type SortField = 'id' | 'area_ha' | 'perimeter_m' | 'coastal_band'
type SortDir = 'asc' | 'desc'

export function SaltPanExplorer({ data, onInspectParcel }: SaltPanExplorerProps) {
  const { saltPans } = data
  const [searchId, setSearchId] = useState('')
  const [selectedBand, setSelectedBand] = useState<string>('all')
  const [areaFilter, setAreaFilter] = useState<string>('all')
  const [minCustomArea, setMinCustomArea] = useState<string>('')
  const [maxCustomArea, setMaxCustomArea] = useState<string>('')
  const [sortField, setSortField] = useState<SortField>('area_ha')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [selectedParcel, setSelectedParcel] = useState<SaltPanProperties | null>(null)

  // Extract all properties from GeoJSON features
  const allParcels: SaltPanProperties[] = useMemo(() => {
    if (!saltPans.data?.features) return []
    return saltPans.data.features.map((f) => f.properties)
  }, [saltPans.data])

  // Overall Inventory Stats
  const globalStats = useMemo(() => {
    if (allParcels.length === 0) {
      return { totalCount: 0, totalArea: 0, meanArea: 0, medianArea: 0, minArea: 0, maxArea: 0 }
    }
    const areas = allParcels.map((p) => p.area_ha).sort((a, b) => a - b)
    const totalArea = areas.reduce((sum, a) => sum + a, 0)
    const mid = Math.floor(areas.length / 2)
    const medianArea = areas.length % 2 === 0 ? (areas[mid - 1] + areas[mid]) / 2 : areas[mid]
    return {
      totalCount: allParcels.length,
      totalArea,
      meanArea: totalArea / allParcels.length,
      medianArea,
      minArea: areas[0],
      maxArea: areas[areas.length - 1],
    }
  }, [allParcels])

  // Filtered Parcels
  const filteredParcels = useMemo(() => {
    return allParcels.filter((p) => {
      // ID Search
      if (searchId.trim()) {
        const query = searchId.trim().replace(/^#/, '')
        if (!String(p.id).includes(query)) return false
      }

      // Coastal Band Filter
      if (selectedBand !== 'all' && p.coastal_band !== selectedBand) {
        return false
      }

      // Area Preset Filters
      if (areaFilter === '<0.2' && p.area_ha >= 0.2) return false
      if (areaFilter === '0.2-0.5' && (p.area_ha < 0.2 || p.area_ha >= 0.5)) return false
      if (areaFilter === '0.5-1.0' && (p.area_ha < 0.5 || p.area_ha >= 1.0)) return false
      if (areaFilter === '1.0-5.0' && (p.area_ha < 1.0 || p.area_ha >= 5.0)) return false
      if (areaFilter === '>5.0' && p.area_ha < 5.0) return false

      // Custom Range Filters
      if (minCustomArea && !isNaN(Number(minCustomArea)) && p.area_ha < Number(minCustomArea)) return false
      if (maxCustomArea && !isNaN(Number(maxCustomArea)) && p.area_ha > Number(maxCustomArea)) return false

      return true
    })
  }, [allParcels, searchId, selectedBand, areaFilter, minCustomArea, maxCustomArea])

  // Filtered Stats
  const filteredStats = useMemo(() => {
    if (filteredParcels.length === 0) return { count: 0, totalArea: 0 }
    const totalArea = filteredParcels.reduce((sum, p) => sum + p.area_ha, 0)
    return { count: filteredParcels.length, totalArea }
  }, [filteredParcels])

  // Sorting
  const sortedParcels = useMemo(() => {
    return [...filteredParcels].sort((a, b) => {
      let vA: number | string = a[sortField] ?? 0
      let vB: number | string = b[sortField] ?? 0
      if (typeof vA === 'string') {
        return sortDir === 'asc' ? vA.localeCompare(String(vB)) : String(vB).localeCompare(vA)
      }
      return sortDir === 'asc' ? (vA as number) - (vB as number) : (vB as number) - (vA as number)
    })
  }, [filteredParcels, sortField, sortDir])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedParcels.length / pageSize))
  const paginatedParcels = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedParcels.slice(start, start + pageSize)
  }, [sortedParcels, currentPage, pageSize])

  // Histogram Bins calculation
  const histogramBins = useMemo(() => {
    const bins = [
      { label: '0.10 – 0.20 ha', min: 0.1, max: 0.2, count: 0, area: 0 },
      { label: '0.20 – 0.50 ha', min: 0.2, max: 0.5, count: 0, area: 0 },
      { label: '0.50 – 1.00 ha', min: 0.5, max: 1.0, count: 0, area: 0 },
      { label: '1.00 – 2.00 ha', min: 1.0, max: 2.0, count: 0, area: 0 },
      { label: '> 2.00 ha', min: 2.0, max: 999.0, count: 0, area: 0 },
    ]
    for (const p of filteredParcels) {
      for (const b of bins) {
        if (p.area_ha >= b.min && p.area_ha < b.max) {
          b.count++
          b.area += p.area_ha
          break
        }
      }
    }
    const maxCount = Math.max(1, ...bins.map((b) => b.count))
    return bins.map((b) => ({
      ...b,
      pctCount: (b.count / Math.max(1, filteredParcels.length)) * 100,
      relativeBar: (b.count / maxCount) * 100,
    }))
  }, [filteredParcels])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setSearchId('')
    setSelectedBand('all')
    setAreaFilter('all')
    setMinCustomArea('')
    setMaxCustomArea('')
    setCurrentPage(1)
  }

  const exportCSV = () => {
    const headers = ['id', 'area_ha', 'area_m2', 'perimeter_m', 'coastal_band', 'centroid_lon', 'centroid_lat', 'class_name']
    const rows = sortedParcels.map((p) => [
      p.id,
      p.area_ha.toFixed(4),
      p.area_m2.toFixed(2),
      p.perimeter_m ?? '',
      p.coastal_band ?? '',
      p.centroid_lon ?? '',
      p.centroid_lat ?? '',
      p.class_name,
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `thoothukudi_salt_pans_filtered_${sortedParcels.length}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="explorer-page">
      {/* ── KPI Row ──────────────────────────────────────────────────────────── */}
      <section className="kpis" aria-label="Inventory Metrics">
        <div className="kpi" title="Total number of salt pan polygons in active filter selection">
          <span className="badge badge-gold">Parcels</span>
          <h3>Inventory Count</h3>
          <p className="kpi-value">{filteredStats.count.toLocaleString()}</p>
          <p className="kpi-sub">
            {filteredStats.count === globalStats.totalCount
              ? `All ${globalStats.totalCount.toLocaleString()} mapped parcels`
              : `${((filteredStats.count / Math.max(1, globalStats.totalCount)) * 100).toFixed(1)}% of total inventory`}
          </p>
        </div>

        <div className="kpi" title="Summed surface area of all currently filtered polygons in hectares">
          <span className="badge badge-gold">Filtered Area</span>
          <h3>Total Mapped Area</h3>
          <p className="kpi-value">{filteredStats.totalArea.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ha</p>
          <p className="kpi-sub">
            {filteredStats.count === globalStats.totalCount
              ? 'Complete district inventory'
              : `${((filteredStats.totalArea / Math.max(1, globalStats.totalArea)) * 100).toFixed(1)}% of 1,631.96 ha`}
          </p>
        </div>

        <div className="kpi" title="Median polygon area (50th percentile) across the entire district inventory">
          <span className="badge badge-purple">Distribution</span>
          <h3>Median Parcel Size</h3>
          <p className="kpi-value">{globalStats.medianArea.toFixed(2)} ha</p>
          <p className="kpi-sub">50% of parcels are under {(globalStats.medianArea * 10000).toLocaleString(undefined, { maximumFractionDigits: 0 })} m²</p>
        </div>

        <div className="kpi" title="Mean polygon area (arithmetic average)">
          <span className="badge badge-purple">Average</span>
          <h3>Mean Parcel Size</h3>
          <p className="kpi-value">{globalStats.meanArea.toFixed(2)} ha</p>
          <p className="kpi-sub">Skewed by coastal mega-salterns</p>
        </div>

        <div className="kpi" title="Largest single contiguous salt pan polygon in Thoothukudi">
          <span className="badge badge-cyan">Extremes</span>
          <h3>Largest Parcel</h3>
          <p className="kpi-value">{globalStats.maxArea.toFixed(2)} ha</p>
          <p className="kpi-sub">Min: {globalStats.minArea.toFixed(2)} ha (1,000 m² MMU)</p>
        </div>
      </section>

      {/* ── Main Layout (Filters + Histogram + Table + Inspector) ─────────────── */}
      <div className="workspace-two-col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '16px', marginTop: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
          {/* Controls Bar */}
          <div className="card filter-bar">
            <div className="filter-controls-grid">
              <div>
                <label className="small muted" htmlFor="search-id">Search by ID</label>
                <input
                  id="search-id"
                  type="text"
                  placeholder="e.g. 1045..."
                  value={searchId}
                  onChange={(e) => {
                    setSearchId(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="input-text"
                />
              </div>

              <div>
                <label className="small muted" htmlFor="select-band">Coastal Proximity</label>
                <select
                  id="select-band"
                  value={selectedBand}
                  onChange={(e) => {
                    setSelectedBand(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="select-field"
                >
                  <option value="all">All Coastal Bands (2,698)</option>
                  <option value="0-5km">0–5 km (Immediate Coast)</option>
                  <option value="5-10km">5–10 km (Near Coast)</option>
                  <option value="10-30km">10–30 km (Coastal Plain)</option>
                  <option value=">30km">&gt;30 km (Inland / Peripheral)</option>
                </select>
              </div>

              <div>
                <label className="small muted" htmlFor="select-area">Size Class Preset</label>
                <select
                  id="select-area"
                  value={areaFilter}
                  onChange={(e) => {
                    setAreaFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="select-field"
                >
                  <option value="all">All Sizes (0.1 – 23.5 ha)</option>
                  <option value="<0.2">&lt; 0.2 ha (Sub-parcel slivers)</option>
                  <option value="0.2-0.5">0.2 – 0.5 ha (Standard pans)</option>
                  <option value="0.5-1.0">0.5 – 1.0 ha (Medium reservoirs)</option>
                  <option value="1.0-5.0">1.0 – 5.0 ha (Large pans)</option>
                  <option value=">5.0">&gt; 5.0 ha (Mega-salterns)</option>
                </select>
              </div>

              <div>
                <label className="small muted">Custom Area (ha)</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Min"
                    value={minCustomArea}
                    onChange={(e) => {
                      setMinCustomArea(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="input-text"
                    style={{ width: '70px' }}
                  />
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Max"
                    value={maxCustomArea}
                    onChange={(e) => {
                      setMaxCustomArea(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="input-text"
                    style={{ width: '70px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <button className="btn" onClick={exportCSV} title="Export filtered records to RFC-compliant CSV">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export CSV ({sortedParcels.length})
                </button>
                <button className="btn btn-secondary" onClick={handleClearFilters} title="Reset all search and filter conditions">
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Area Distribution Histogram */}
          <div className="card">
            <div className="card-head">
              <h3>Parcel Area Distribution</h3>
              <span className="small muted">{filteredParcels.length} active parcels</span>
            </div>
            <p className="small muted" style={{ marginBottom: '12px' }}>
              Histogram illustrates heavy positive skew: small salt evaporation pans (0.1 – 0.5 ha) dominate parcel count,
              while large crystallization reservoirs contribute the majority of mapped acreage.
            </p>
            <div className="histogram-grid">
              {histogramBins.map((b) => (
                <div key={b.label} className="hist-col">
                  <div className="hist-bar-wrapper">
                    <div className="hist-bar" style={{ height: `${b.relativeBar}%` }} />
                  </div>
                  <div className="hist-count">{b.count.toLocaleString()}</div>
                  <div className="hist-pct">{b.pctCount.toFixed(1)}%</div>
                  <div className="hist-label">{b.label}</div>
                  <div className="hist-area muted">{b.area.toFixed(1)} ha</div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Table */}
          <div className="card" style={{ padding: '0px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <div>
                <strong>Parcel Records</strong>
                <span className="small muted" style={{ marginLeft: '8px' }}>
                  Showing {Math.min(sortedParcels.length, (currentPage - 1) * pageSize + 1)}–
                  {Math.min(sortedParcels.length, currentPage * pageSize)} of {sortedParcels.length}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="small muted">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="select-field"
                  style={{ padding: '2px 8px', fontSize: '12px' }}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" aria-label="Salt Pan Inventory Records">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort('id')} className="sortable">
                      Feature ID {sortField === 'id' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => toggleSort('area_ha')} className="sortable num">
                      Area (ha) {sortField === 'area_ha' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="num">Area (m²)</th>
                    <th onClick={() => toggleSort('perimeter_m')} className="sortable num">
                      Perimeter (m) {sortField === 'perimeter_m' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => toggleSort('coastal_band')} className="sortable">
                      Coastal Zone {sortField === 'coastal_band' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th>Centroid Coord</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedParcels.length > 0 ? (
                    paginatedParcels.map((p) => {
                      const isSelected = selectedParcel?.id === p.id
                      return (
                        <tr
                          key={p.id}
                          className={isSelected ? 'row-selected' : ''}
                          onClick={() => setSelectedParcel(p)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td style={{ fontWeight: 600, color: 'var(--accent)' }}>#{p.id}</td>
                          <td className="num" style={{ fontWeight: 600 }}>{p.area_ha.toFixed(2)}</td>
                          <td className="num muted">{p.area_m2.toLocaleString()}</td>
                          <td className="num muted">{p.perimeter_m ? `${p.perimeter_m.toFixed(0)} m` : '—'}</td>
                          <td>
                            <span className={`badge ${p.coastal_band === '0-5km' ? 'badge-gold' : p.coastal_band === '5-10km' ? 'badge-green' : p.coastal_band === '10-30km' ? 'badge-cyan' : 'badge-purple'}`}>
                              {p.coastal_band ?? 'Inland'}
                            </span>
                          </td>
                          <td className="small muted">
                            {p.centroid_lon && p.centroid_lat
                              ? `${p.centroid_lon.toFixed(4)}°E, ${p.centroid_lat.toFixed(4)}°N`
                              : '—'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="btn btn-sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedParcel(p)
                                if (onInspectParcel) onInspectParcel(p)
                              }}
                              title="Inspect this parcel"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)' }}>
                        No salt pan parcels match the current filter criteria.
                        <div style={{ marginTop: '8px' }}>
                          <button className="btn btn-secondary" onClick={handleClearFilters}>
                            Clear Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-bar">
                <button
                  className="btn btn-secondary"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  title="First Page"
                >
                  &laquo;
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  title="Previous Page"
                >
                  &lsaquo; Prev
                </button>
                <span className="small muted">
                  Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  title="Next Page"
                >
                  Next &rsaquo;
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  title="Last Page"
                >
                  &raquo;
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Parcel Detail Inspector */}
        <aside className="card inspector" aria-label="Selected Parcel Inspector">
          <div className="card-head">
            <h3>Parcel Inspector</h3>
            {selectedParcel && <span className="badge badge-gold">ID #{selectedParcel.id}</span>}
          </div>

          {selectedParcel ? (
            <div className="inspector-body">
              <table className="attr-table">
                <tbody>
                  <tr>
                    <th>Feature ID</th>
                    <td>#{selectedParcel.id}</td>
                  </tr>
                  <tr>
                    <th>Classification</th>
                    <td style={{ color: 'var(--accent)', fontWeight: 600 }}>Salt Pan</td>
                  </tr>
                  <tr>
                    <th>Area (Hectares)</th>
                    <td style={{ fontWeight: 700 }}>{selectedParcel.area_ha.toFixed(2)} ha</td>
                  </tr>
                  <tr>
                    <th>Area (m²)</th>
                    <td>{selectedParcel.area_m2.toLocaleString()} m²</td>
                  </tr>
                  <tr>
                    <th>Perimeter</th>
                    <td>{selectedParcel.perimeter_m ? `${selectedParcel.perimeter_m.toFixed(1)} m` : '—'}</td>
                  </tr>
                  <tr>
                    <th>Coastal Band</th>
                    <td>
                      <span className="badge badge-gold">{selectedParcel.coastal_band ?? 'General'}</span>
                    </td>
                  </tr>
                  {selectedParcel.centroid_lon && selectedParcel.centroid_lat && (
                    <>
                      <tr>
                        <th>Longitude</th>
                        <td>{selectedParcel.centroid_lon.toFixed(5)}°E</td>
                      </tr>
                      <tr>
                        <th>Latitude</th>
                        <td>{selectedParcel.centroid_lat.toFixed(5)}°N</td>
                      </tr>
                    </>
                  )}
                  <tr>
                    <th>Native CRS</th>
                    <td>EPSG:32643 (UTM 43N)</td>
                  </tr>
                  <tr>
                    <th>Source Artifact</th>
                    <td className="small" style={{ wordBreak: 'break-all' }}>saltpan_inventory.gpkg</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                {onInspectParcel && (
                  <button
                    className="btn"
                    onClick={() => onInspectParcel(selectedParcel)}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    View on Map
                  </button>
                )}
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedParcel(null)}
                  title="Clear selection"
                >
                  Clear
                </button>
              </div>

              <div className="provenance-card" style={{ marginTop: '14px' }}>
                <strong>Quality Assurance</strong>
                <div>
                  Enforces Minimum Mapping Unit (MMU ≥ 1,000 m²). Boundary vectorized from 20m Sentinel-2 Random Forest classification.
                </div>
              </div>
            </div>
          ) : (
            <div className="inspector-body muted small" style={{ lineHeight: 1.6 }}>
              <p>
                Click any table row to inspect full geometry measurements, coordinates, and coastal zone stratification.
              </p>
              <div className="provenance-card">
                <strong>Inventory Scope</strong>
                <div>
                  Contains all 2,698 discrete parcels mapped across Thoothukudi district, totaling 1,631.96 hectares.
                </div>
              </div>
              <div className="provenance-card" style={{ marginTop: '10px' }}>
                <strong>Data Provenance</strong>
                <div>
                  Derived from Level-2A Sentinel-2 MSI multispectral imagery (August 10 &amp; September 04, 2026).
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
