import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import App from '../src/App'

// Mock maplibre-gl because jsdom does not support WebGL canvas
vi.mock('maplibre-gl', () => {
  return {
    default: {
      Map: vi.fn(() => ({
        on: vi.fn(),
        remove: vi.fn(),
        addControl: vi.fn(),
        addSource: vi.fn(),
        addLayer: vi.fn(),
        getSource: vi.fn(),
        getLayer: vi.fn(),
        setLayoutProperty: vi.fn(),
        setFeatureState: vi.fn(),
        fitBounds: vi.fn(),
        easeTo: vi.fn(),
        flyTo: vi.fn(),
        getCanvas: vi.fn(() => ({ style: {} })),
      })),
      NavigationControl: vi.fn(),
      ScaleControl: vi.fn(),
      AttributionControl: vi.fn(),
    },
  }
})

describe('App & Shell Navigation', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('metadata')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            project_name: 'Thoothukudi Salt Pan Intelligence',
            subtitle: 'District Mapping & Classification Analytics',
            version: '1.0.0',
            study_area: { name: 'Thoothukudi District' },
            kpis: {
              total_saltpan_area_ha: 1264.52,
              total_polygons: 2071,
              top_holdout_model: 'SVM (RBF Kernel)',
              top_holdout_accuracy: 0.9951,
              top_holdout_f1: 0.8889,
              production_precision: 1.0,
              cleaned_raster_area_ha: 1362.6,
            },
          }),
        })
      }
      if (url.includes('.geojson')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            type: 'FeatureCollection',
            features: [],
          }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    }))
  })

  afterEach(() => {
    cleanup()
  })

  it('renders application header with title and subtitle', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /Thoothukudi Salt Pan Intelligence/i })).toBeDefined()
    expect(screen.getByText(/District Mapping & Classification Analytics/i)).toBeDefined()
  })

  it('renders sidebar navigation links', () => {
    render(<App />)
    const buttons = screen.getAllByRole('button')
    const buttonTexts = buttons.map(b => b.textContent)
    expect(buttonTexts.some(t => t?.includes('Overview'))).toBe(true)
    expect(buttonTexts.some(t => t?.includes('Salt Pan Explorer'))).toBe(true)
    expect(buttonTexts.some(t => t?.includes('Model Lab'))).toBe(true)
    expect(buttonTexts.some(t => t?.includes('Validation & Comparison'))).toBe(true)
    expect(buttonTexts.some(t => t?.includes('Area Analytics'))).toBe(true)
  })

  it('switches between all 5 pages and renders active features', () => {
    render(<App />)

    // 1. Overview is active by default
    expect(screen.getByRole('region', { name: /Map Legend/i })).toBeDefined()

    // 2. Switch to Salt Pan Explorer
    const explorerBtn = screen.getAllByRole('button').find((b) => b.textContent?.includes('Salt Pan Explorer'))
    expect(explorerBtn).toBeDefined()
    fireEvent.click(explorerBtn!)
    expect(screen.getByRole('table', { name: /Salt Pan Inventory Records/i })).toBeDefined()
    expect(screen.getByPlaceholderText(/e\.g\. 1045/i)).toBeDefined()

    // 3. Switch to Model Lab
    const modelLabBtn = screen.getAllByRole('button').find((b) => b.textContent?.includes('Model Lab'))
    expect(modelLabBtn).toBeDefined()
    fireEvent.click(modelLabBtn!)
    expect(screen.getByRole('heading', { name: /Multi-Algorithm Evaluation Benchmark/i })).toBeDefined()
    expect(screen.getByRole('heading', { name: /Confusion Matrix Inspector/i })).toBeDefined()

    // 4. Switch to Validation & Comparison
    const validationBtn = screen.getAllByRole('button').find((b) => b.textContent?.includes('Validation & Comparison'))
    expect(validationBtn).toBeDefined()
    fireEvent.click(validationBtn!)
    expect(screen.getByRole('heading', { name: /Comparison Layers/i })).toBeDefined()
    expect(screen.getByRole('heading', { name: /Post-Processing Impact/i })).toBeDefined()

    // 5. Switch to Area Analytics
    const analyticsBtn = screen.getAllByRole('button').find((b) => b.textContent?.includes('Area Analytics'))
    expect(analyticsBtn).toBeDefined()
    fireEvent.click(analyticsBtn!)
    expect(screen.getByRole('heading', { name: /Coastal Proximity Stratification/i })).toBeDefined()
    expect(screen.getByRole('heading', { name: /Ranked Largest Salt Pan Parcels/i })).toBeDefined()
  })
})

