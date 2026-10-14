import { useEffect, useState, useRef, useCallback } from 'react'
import { DATA_FILES } from '../config'
import type {
  Metadata,
  DistrictBoundaryCollection,
  SaltPanCollection,
  ProbabilityBounds,
  ModelBenchmarkRow,
  FeatureImportanceMap,
  ConfusionMatrixMap,
  CoastalSummaryItem,
  SieveComparisonData,
  WorldCoverClassItem,
} from '../types'

export type DataStatus<T> = {
  state: 'idle' | 'loading' | 'ready' | 'error'
  data?: T
  error?: string
}

const idle = <T,>(): DataStatus<T> => ({ state: 'idle' })

export interface DashboardData {
  metadata: DataStatus<Metadata>
  boundary: DataStatus<DistrictBoundaryCollection>
  saltPans: DataStatus<SaltPanCollection>
  referenceTraining: DataStatus<GeoJSON.FeatureCollection>
  probabilityBounds: DataStatus<ProbabilityBounds>
  models: DataStatus<ModelBenchmarkRow[]>
  confusionMatrices: DataStatus<ConfusionMatrixMap>
  featureImportance: DataStatus<FeatureImportanceMap>
  coastalSummary: DataStatus<CoastalSummaryItem[]>
  sieveComparison: DataStatus<SieveComparisonData>
  worldcoverComparison: DataStatus<WorldCoverClassItem[]>
  reload: (key: string) => void
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

export function useDashboardData(): DashboardData {
  const [metadata, setMetadata] = useState<DataStatus<Metadata>>(idle())
  const [boundary, setBoundary] = useState<DataStatus<DistrictBoundaryCollection>>(idle())
  const [saltPans, setSaltPans] = useState<DataStatus<SaltPanCollection>>(idle())
  const [referenceTraining, setReferenceTraining] = useState<DataStatus<GeoJSON.FeatureCollection>>(idle())
  const [probabilityBounds, setProbabilityBounds] = useState<DataStatus<ProbabilityBounds>>(idle())
  const [models, setModels] = useState<DataStatus<ModelBenchmarkRow[]>>(idle())
  const [confusionMatrices, setConfusionMatrices] = useState<DataStatus<ConfusionMatrixMap>>(idle())
  const [featureImportance, setFeatureImportance] = useState<DataStatus<FeatureImportanceMap>>(idle())
  const [coastalSummary, setCoastalSummary] = useState<DataStatus<CoastalSummaryItem[]>>(idle())
  const [sieveComparison, setSieveComparison] = useState<DataStatus<SieveComparisonData>>(idle())
  const [worldcoverComparison, setWorldcoverComparison] = useState<DataStatus<WorldCoverClassItem[]>>(idle())

  const isMounted = useRef(true)
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const loadResource = useCallback(async <T,>(
    url: string,
    setter: React.Dispatch<React.SetStateAction<DataStatus<T>>>
  ) => {
    setter({ state: 'loading' })
    try {
      const data = await fetchJson<T>(url)
      if (isMounted.current) {
        setter({ state: 'ready', data })
      }
    } catch (err: unknown) {
      if (isMounted.current) {
        setter({ state: 'error', error: err instanceof Error ? err.message : String(err) })
      }
    }
  }, [])

  useEffect(() => {
    loadResource(DATA_FILES.metadata, setMetadata)
    loadResource(DATA_FILES.boundary, setBoundary)
    loadResource(DATA_FILES.saltPans, setSaltPans)
    loadResource(DATA_FILES.referenceTraining, setReferenceTraining)
    loadResource(DATA_FILES.probabilityBounds, setProbabilityBounds)
    loadResource(DATA_FILES.modelComparison, setModels)
    loadResource(DATA_FILES.confusionMatrices, setConfusionMatrices)
    loadResource(DATA_FILES.featureImportance, setFeatureImportance)
    loadResource(DATA_FILES.coastalSummary, setCoastalSummary)
    loadResource(DATA_FILES.sieveComparison, setSieveComparison)
    loadResource(DATA_FILES.worldcoverComparison, setWorldcoverComparison)
  }, [loadResource])

  const reload = useCallback((key: string) => {
    if (key === 'metadata') loadResource(DATA_FILES.metadata, setMetadata)
    if (key === 'boundary') loadResource(DATA_FILES.boundary, setBoundary)
    if (key === 'saltPans') loadResource(DATA_FILES.saltPans, setSaltPans)
    if (key === 'referenceTraining') loadResource(DATA_FILES.referenceTraining, setReferenceTraining)
    if (key === 'probabilityBounds') loadResource(DATA_FILES.probabilityBounds, setProbabilityBounds)
    if (key === 'models') loadResource(DATA_FILES.modelComparison, setModels)
    if (key === 'confusionMatrices') loadResource(DATA_FILES.confusionMatrices, setConfusionMatrices)
    if (key === 'featureImportance') loadResource(DATA_FILES.featureImportance, setFeatureImportance)
    if (key === 'coastalSummary') loadResource(DATA_FILES.coastalSummary, setCoastalSummary)
    if (key === 'sieveComparison') loadResource(DATA_FILES.sieveComparison, setSieveComparison)
    if (key === 'worldcoverComparison') loadResource(DATA_FILES.worldcoverComparison, setWorldcoverComparison)
  }, [loadResource])

  return {
    metadata,
    boundary,
    saltPans,
    referenceTraining,
    probabilityBounds,
    models,
    confusionMatrices,
    featureImportance,
    coastalSummary,
    sieveComparison,
    worldcoverComparison,
    reload,
  }
}

