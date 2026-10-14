import { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from 'react'
import maplibregl, { type Map as MlMap, type GeoJSONSource } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { BASE_STYLE, MAP_CONFIG, DATA_FILES } from '../config'
import type {
  LayerVisibility,
  DistrictBoundaryCollection,
  SaltPanCollection,
  SaltPanProperties,
  ProbabilityBounds,
} from '../types'

export interface MapViewHandle {
  reset(): void
  fitDistrict(): void
  zoomToPolygon(lon: number, lat: number, id?: number): void
}

interface MapViewProps {
  boundary: DistrictBoundaryCollection | null
  saltPans: SaltPanCollection | null
  referenceTraining: GeoJSON.FeatureCollection | null
  probabilityBounds: ProbabilityBounds | null
  layers: LayerVisibility
  selectedId: number | null
  onSelect: (feature: SaltPanProperties | null) => void
}

const EMPTY_COLLECTION: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
}

export const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  { boundary, saltPans, referenceTraining, probabilityBounds, layers, selectedId, onSelect },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const selectedIdRef = useRef<number | null>(selectedId)
  selectedIdRef.current = selectedId

  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  // Imperative handle
  useImperativeHandle(ref, () => ({
    reset() {
      if (mapRef.current) {
        mapRef.current.easeTo({
          center: MAP_CONFIG.center,
          zoom: MAP_CONFIG.defaultZoom,
          duration: 700,
        })
      }
    },
    fitDistrict() {
      if (mapRef.current && boundary && boundary.features.length > 0) {
        mapRef.current.fitBounds(
          [
            [77.67, 8.32],
            [78.39, 9.38],
          ],
          { padding: 30, duration: 800 }
        )
      }
    },
    zoomToPolygon(lon: number, lat: number) {
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [lon, lat],
          zoom: 14,
          duration: 900,
        })
      }
    },
  }))

  // Map Initialization
  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASE_STYLE,
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.defaultZoom,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
      attributionControl: false,
      dragRotate: false,
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric', maxWidth: 120 }), 'bottom-left')
    map.addControl(
      new maplibregl.AttributionControl({ compact: true, customAttribution: MAP_CONFIG.attribution }),
      'bottom-right'
    )

    map.on('load', () => {
      // 1. Boundary source & layers
      map.addSource('boundary-src', { type: 'geojson', data: EMPTY_COLLECTION })
      map.addLayer({
        id: 'boundary-fill',
        type: 'fill',
        source: 'boundary-src',
        paint: {
          'fill-color': '#14181E',
          'fill-opacity': 0.82,
        },
      })
      map.addLayer({
        id: 'boundary-line',
        type: 'line',
        source: 'boundary-src',
        paint: {
          'line-color': '#64748B',
          'line-width': 1.6,
          'line-dasharray': [4, 2],
        },
      })

      // 2. Training reference source & layers (cyan)
      map.addSource('training-src', { type: 'geojson', data: EMPTY_COLLECTION })
      map.addLayer({
        id: 'training-fill',
        type: 'fill',
        source: 'training-src',
        paint: {
          'fill-color': '#56B4E9',
          'fill-opacity': 0.4,
        },
      })
      map.addLayer({
        id: 'training-line',
        type: 'line',
        source: 'training-src',
        paint: {
          'line-color': '#2D87B8',
          'line-width': 1.0,
        },
      })

      // 3. Salt Pans inventory source & layers (gold)
      map.addSource('saltpans-src', {
        type: 'geojson',
        data: EMPTY_COLLECTION,
        promoteId: 'id',
      })
      map.addLayer({
        id: 'saltpans-fill',
        type: 'fill',
        source: 'saltpans-src',
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#FFFFFF',
            '#F2C94C',
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            0.98,
            ['boolean', ['feature-state', 'hover'], false],
            0.9,
            0.75,
          ],
        },
      })
      map.addLayer({
        id: 'saltpans-line',
        type: 'line',
        source: 'saltpans-src',
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#FFFFFF',
            '#D9A726',
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            2.5,
            ['boolean', ['feature-state', 'hover'], false],
            1.8,
            0.8,
          ],
        },
      })

      // Hover and Click events
      let hoveredId: number | null = null

      map.on('mousemove', 'saltpans-fill', (e) => {
        if (!e.features || e.features.length === 0) return
        map.getCanvas().style.cursor = 'pointer'
        const feat = e.features[0]
        const id = feat.id as number

        if (hoveredId !== null && hoveredId !== id) {
          map.setFeatureState({ source: 'saltpans-src', id: hoveredId }, { hover: false })
        }
        hoveredId = id
        map.setFeatureState({ source: 'saltpans-src', id }, { hover: true })
      })

      map.on('mouseleave', 'saltpans-fill', () => {
        map.getCanvas().style.cursor = ''
        if (hoveredId !== null) {
          map.setFeatureState({ source: 'saltpans-src', id: hoveredId }, { hover: false })
          hoveredId = null
        }
      })

      map.on('click', 'saltpans-fill', (e) => {
        if (!e.features || e.features.length === 0) return
        const feat = e.features[0]
        const props = feat.properties as SaltPanProperties
        const id = Number(props.id)

        // Clear previous selection state
        if (selectedIdRef.current !== null) {
          map.setFeatureState({ source: 'saltpans-src', id: selectedIdRef.current }, { selected: false })
        }

        // Set new selection
        map.setFeatureState({ source: 'saltpans-src', id }, { selected: true })
        onSelectRef.current(props)
      })

      // Click background to unselect
      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['saltpans-fill'] })
        if (features.length === 0 && selectedIdRef.current !== null) {
          map.setFeatureState({ source: 'saltpans-src', id: selectedIdRef.current }, { selected: false })
          onSelectRef.current(null)
        }
      })

      mapRef.current = map
      setIsLoaded(true)
    })

    return () => {
      map.remove()
      mapRef.current = null
      setIsLoaded(false)
    }
  }, [])

  // Update boundary data
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !boundary) return
    const src = mapRef.current.getSource('boundary-src') as GeoJSONSource | undefined
    if (src) {
      src.setData(boundary)
    }
  }, [isLoaded, boundary])

  // Update salt pan inventory data
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !saltPans) return
    const src = mapRef.current.getSource('saltpans-src') as GeoJSONSource | undefined
    if (src) {
      src.setData(saltPans)
    }
  }, [isLoaded, saltPans])

  // Update training polygons data
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !referenceTraining) return
    const src = mapRef.current.getSource('training-src') as GeoJSONSource | undefined
    if (src) {
      src.setData(referenceTraining)
    }
  }, [isLoaded, referenceTraining])

  // Add or update Probability Image source
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !probabilityBounds) return
    const map = mapRef.current

    if (!map.getSource('prob-image-src')) {
      map.addSource('prob-image-src', {
        type: 'image',
        url: DATA_FILES.probabilityPreview,
        coordinates: probabilityBounds.coordinates,
      })

      // Insert below salt pans but above boundary
      map.addLayer(
        {
          id: 'probability-layer',
          type: 'raster',
          source: 'prob-image-src',
          paint: {
            'raster-opacity': 0.85,
            'raster-fade-duration': 200,
          },
          layout: {
            visibility: layers.probability ? 'visible' : 'none',
          },
        },
        'training-fill'
      )
    }
  }, [isLoaded, probabilityBounds, layers.probability])

  // Handle Layer Visibility Toggles
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return
    const map = mapRef.current

    const setVis = (layerId: string, visible: boolean) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
      }
    }

    setVis('boundary-fill', layers.boundary)
    setVis('boundary-line', layers.boundary)
    setVis('saltpans-fill', layers.saltPans)
    setVis('saltpans-line', layers.saltPans)
    setVis('training-fill', layers.referenceTraining)
    setVis('training-line', layers.referenceTraining)
    setVis('probability-layer', layers.probability)
  }, [isLoaded, layers])

  // Handle selection state changes from outside
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return
    const map = mapRef.current

    if (selectedId !== null) {
      map.setFeatureState({ source: 'saltpans-src', id: selectedId }, { selected: true })
    }
  }, [isLoaded, selectedId])

  const handleFit = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.fitBounds(
        [
          [77.67, 8.32],
          [78.39, 9.38],
        ],
        { padding: 25, duration: 800 }
      )
    }
  }, [])

  const handleReset = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.easeTo({
        center: MAP_CONFIG.center,
        zoom: MAP_CONFIG.defaultZoom,
        duration: 700,
      })
    }
  }, [])

  return (
    <div className="mapcard" aria-label="District Salt Pan Map">
      <div ref={containerRef} className="map-canvas" />

      {/* Top action buttons */}
      <div className="map-top-bar">
        <button className="btn" onClick={handleFit} title="Fit to Thoothukudi District Extent">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
          Fit District
        </button>
        <button className="btn" onClick={handleReset} title="Reset to Default Perspective">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Reset View
        </button>
      </div>

      <div className="overlay-status">
        UTM Zone 43N • EPSG:32643
      </div>

      {/* Map Legend */}
      <div className="legend" role="region" aria-label="Map Legend">
        <h4>Layer Legend</h4>
        <ul>
          {layers.saltPans && (
            <li>
              <span className="swatch swatch-gold" />
              <span>Salt Pan Inventory</span>
              <small>{saltPans?.features ? `${saltPans.features.length} parcels` : '...'}</small>
            </li>
          )}
          {layers.referenceTraining && (
            <li>
              <span className="swatch swatch-cyan" />
              <span>Training Reference</span>
              <small>501 parcels</small>
            </li>
          )}
          {layers.probability && (
            <li>
              <span className="swatch swatch-amber" />
              <span>Probability Heatmap</span>
              <small>RF 20m</small>
            </li>
          )}
          {layers.boundary && (
            <li>
              <span className="swatch swatch-boundary" />
              <span>District Boundary</span>
              <small>Admin Mask</small>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
})
