import { useState } from 'react'
import { Header, Sidebar, summarizeStatus, type Section } from './components/Shell'
import { Overview } from './components/Overview'
import { SaltPanExplorer } from './components/SaltPanExplorer'
import { ModelLab } from './components/ModelLab'
import { ValidationComparison } from './components/ValidationComparison'
import { AreaAnalytics } from './components/AreaAnalytics'
import { useDashboardData } from './state/useDashboardData'
import type { SaltPanProperties } from './types'

export default function App() {
  const [section, setSection] = useState<Section>('overview')
  const [inspectedParcel, setInspectedParcel] = useState<SaltPanProperties | null>(null)
  const data = useDashboardData()

  const status = summarizeStatus({
    metadata: data.metadata,
    boundary: data.boundary,
    saltPans: data.saltPans,
    probability: data.probabilityBounds,
    reference: data.referenceTraining,
    models: data.models,
    matrices: data.confusionMatrices,
    importance: data.featureImportance,
    coastal: data.coastalSummary,
    sieve: data.sieveComparison,
    worldcover: data.worldcoverComparison,
  })

  const m = data.metadata.data
  const modelLabel = m
    ? `${m.kpis.top_holdout_model} (Holdout Acc: ${(m.kpis.top_holdout_accuracy * 100).toFixed(1)}%) • RF Production`
    : data.metadata.state === 'error'
      ? 'Model Unavailable'
      : 'Loading model...'

  const handleInspectFromExplorer = (parcel: SaltPanProperties) => {
    setInspectedParcel(parcel)
    setSection('overview')
  }

  return (
    <div className="app">
      <Sidebar active={section} onChange={setSection} />
      <div className="main">
        <Header metadata={data.metadata} status={status} modelLabel={modelLabel} />
        <main id="content">
          {section === 'overview' && (
            <Overview
              data={data}
              selectedFeature={inspectedParcel}
              onSelectFeature={setInspectedParcel}
            />
          )}

          {section === 'explorer' && (
            <SaltPanExplorer
              data={data}
              onInspectParcel={handleInspectFromExplorer}
            />
          )}

          {section === 'model-lab' && <ModelLab data={data} />}

          {section === 'validation' && <ValidationComparison data={data} />}

          {section === 'analytics' && <AreaAnalytics data={data} />}
        </main>
      </div>
    </div>
  )
}

