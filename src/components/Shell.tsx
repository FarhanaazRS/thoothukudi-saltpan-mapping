import type { ReactNode } from 'react'
import type { Metadata } from '../types'
import type { DataStatus } from '../state/useDashboardData'

export type Section = 'overview' | 'explorer' | 'model-lab' | 'validation' | 'analytics'

export const NAV: { id: Section; label: string; hint: string }[] = [
  { id: 'overview', label: 'Overview', hint: 'Verified KPIs, district map, and salt pan inspection' },
  { id: 'explorer', label: 'Salt Pan Explorer', hint: 'Ranked parcel inventory, size histogram, spatial filters' },
  { id: 'model-lab', label: 'Model Lab', hint: '7-algorithm benchmark, confusion matrices, ROC/PR curves' },
  { id: 'validation', label: 'Validation & Comparison', hint: 'Sieve post-processing, spatial holdout analysis' },
  { id: 'analytics', label: 'Area Analytics', hint: 'Coastal distance breakdown and spatial concentration' },
]

export function Sidebar({ active, onChange }: { active: Section; onChange: (s: Section) => void }) {
  return (
    <nav className="sidebar" aria-label="Primary Navigation">
      <div className="brand" aria-hidden="true">
        <span className="brand-mark">SPI</span>
        <div className="brand-title">
          <div>Thoothukudi</div>
          <div style={{ color: 'var(--accent)', fontSize: '12px' }}>Salt Intelligence</div>
        </div>
      </div>
      <ul>
        {NAV.map((n, i) => (
          <li key={n.id}>
            <button
              className={n.id === active ? 'nav-item active' : 'nav-item'}
              aria-current={n.id === active ? 'page' : undefined}
              onClick={() => onChange(n.id)}
              title={n.hint}
            >
              <span className="nav-index">{i + 1}</span>
              <span className="nav-label">{n.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="sidebar-foot">
        <div><strong>Sentinel-2 Level-2A</strong></div>
        <div>UTM 43N • 20m Multi-spectral</div>
        <div style={{ marginTop: '4px', opacity: 0.8 }}>ESA WorldCover 2021 Reference</div>
      </div>
    </nav>
  )
}

export interface StatusSummary {
  tone: 'ok' | 'bad' | 'load'
  text: string
}

export function summarizeStatus(parts: Record<string, DataStatus<unknown>>): StatusSummary {
  const entries = Object.entries(parts)
  const failed = entries.filter(([, s]) => s.state === 'error').map(([k]) => k)
  const loading = entries.filter(([, s]) => s.state === 'loading' || s.state === 'idle').length
  const ready = entries.filter(([, s]) => s.state === 'ready').length

  if (failed.length) {
    return { tone: 'bad', text: `Failed: ${failed.join(', ')} (${ready}/${entries.length})` }
  }
  if (loading) {
    return { tone: 'load', text: `Loading layers (${ready}/${entries.length})` }
  }
  return { tone: 'ok', text: `All data loaded (${ready}/${entries.length})` }
}

export function Header({
  metadata,
  status,
  modelLabel,
}: {
  metadata: DataStatus<Metadata>
  status: StatusSummary
  modelLabel: string
}) {
  const m = metadata.data
  return (
    <header className="topbar">
      <div className="titleblock">
        <h1>Thoothukudi Salt Pan Intelligence</h1>
        <p className="subtitle">District Mapping &amp; Classification Analytics</p>
      </div>
      <dl className="meta">
        <div>
          <dt>Study area</dt>
          <dd>Thoothukudi district, Tamil Nadu</dd>
        </div>
        <div>
          <dt>Dataset</dt>
          <dd>
            {m ? `Sentinel-2 L2A • ${m.kpis.total_polygons.toLocaleString()} Parcels` : metadata.state === 'error' ? 'Unavailable' : 'Loading...'}
          </dd>
        </div>
        <div>
          <dt>Model</dt>
          <dd>{modelLabel}</dd>
        </div>
      </dl>
      <div className={`status status-${status.tone}`} role="status" aria-live="polite">
        <span className="dot" />
        {status.text}
      </div>
    </header>
  )
}

export function PhasePending({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="pending" aria-labelledby="pending-title">
      <span className="pending-badge">Deferred to Prompt 2</span>
      <h2 id="pending-title">{title}</h2>
      <p>{children}</p>
      <p className="pending-note">
        This analytical module will be fully implemented in Prompt 2. No mock metrics or placeholder charts are shown.
      </p>
    </section>
  )
}
