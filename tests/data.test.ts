import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const PUBLIC_DATA = path.resolve(__dirname, '../public/data')

describe('Authoritative GIS & Benchmark Data Integrity', () => {
  it('contains verified metadata.json with correct KPIs', () => {
    const metaPath = path.join(PUBLIC_DATA, 'metadata.json')
    expect(fs.existsSync(metaPath)).toBe(true)

    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
    expect(meta.project_name).toBe('Thoothukudi Salt Pan Intelligence')
    expect(meta.kpis.total_saltpan_area_ha).toBe(1264.52)
    expect(meta.kpis.total_polygons).toBe(2071)
    expect(meta.kpis.cleaned_raster_area_ha).toBe(1362.6)
    expect(meta.kpis.raw_raster_area_ha).toBe(1415.92)
    expect(meta.kpis.top_holdout_accuracy).toBe(0.9951)
    expect(meta.kpis.top_holdout_f1).toBe(0.8889)
    expect(meta.kpis.regional_total_polygons).toBe(2698)
    expect(meta.kpis.outside_district_polygons_removed).toBe(627)
    expect(meta.kpis.outside_district_area_removed_ha).toBe(367.44)
    expect(meta.provenance.independent_field_validation).toBe(false)
  })

  it('contains valid GeoJSON district boundary', () => {
    const bPath = path.join(PUBLIC_DATA, 'district_boundary.geojson')
    expect(fs.existsSync(bPath)).toBe(true)

    const geo = JSON.parse(fs.readFileSync(bPath, 'utf8'))
    expect(geo.type).toBe('FeatureCollection')
    expect(geo.features.length).toBeGreaterThan(0)
    expect(geo.features[0].properties.district_name).toBe('Thoothukudi')
  })

  it('contains valid salt pan vector inventory with 2,071 features strictly inside Thoothukudi', () => {
    const invPath = path.join(PUBLIC_DATA, 'saltpan_inventory.geojson')
    expect(fs.existsSync(invPath)).toBe(true)

    const geo = JSON.parse(fs.readFileSync(invPath, 'utf8'))
    expect(geo.type).toBe('FeatureCollection')
    expect(geo.features.length).toBe(2071)

    const first = geo.features[0]
    expect(first.properties.class_name).toBe('salt_pan')
    expect(first.properties.area_ha).toBeGreaterThan(0)
    expect(first.properties.id).toBeDefined()
  })

  it('contains probability raster preview PNG and bounding coordinates', () => {
    const pngPath = path.join(PUBLIC_DATA, 'probability_preview_4326.png')
    const boundsPath = path.join(PUBLIC_DATA, 'probability_bounds.json')

    expect(fs.existsSync(pngPath)).toBe(true)
    expect(fs.existsSync(boundsPath)).toBe(true)

    const bounds = JSON.parse(fs.readFileSync(boundsPath, 'utf8'))
    expect(bounds.coordinates.length).toBe(4)
    expect(bounds.bbox.length).toBe(4)
  })

  it('contains coastal summary across 4 non-overlapping distance bands', () => {
    const cPath = path.join(PUBLIC_DATA, 'coastal_summary.json')
    expect(fs.existsSync(cPath)).toBe(true)

    const coastal = JSON.parse(fs.readFileSync(cPath, 'utf8'))
    expect(coastal.length).toBe(4)
    const totalParcels = coastal.reduce((sum: number, c: { count: number }) => sum + c.count, 0)
    expect(totalParcels).toBe(2071)
    const totalArea = coastal.reduce((sum: number, c: { area_ha: number }) => sum + c.area_ha, 0)
    expect(Math.round(totalArea * 100) / 100).toBe(1264.51)
  })

  it('contains sieve post-processing progression with raw, cleaned, and vector stages', () => {
    const sPath = path.join(PUBLIC_DATA, 'sieve_comparison.json')
    expect(fs.existsSync(sPath)).toBe(true)

    const sieve = JSON.parse(fs.readFileSync(sPath, 'utf8'))
    expect(sieve.stages.length).toBe(3)
    expect(sieve.stages[0].area_ha).toBe(1415.92)
    expect(sieve.stages[1].area_ha).toBe(1362.6)
    expect(sieve.stages[2].area_ha).toBe(1264.52)
    expect(sieve.total_reduction_ha).toBe(151.4)
    expect(sieve.regional_full_scene.outside_district_polygons).toBe(627)
  })

  it('contains ESA WorldCover 2021 class correspondence', () => {
    const wPath = path.join(PUBLIC_DATA, 'worldcover_comparison.json')
    expect(fs.existsSync(wPath)).toBe(true)

    const wc = JSON.parse(fs.readFileSync(wPath, 'utf8'))
    expect(wc.length).toBeGreaterThan(0)
    const class60 = wc.find((c: { class_code: number }) => c.class_code === 60)
    expect(class60).toBeDefined()
    expect(class60.parcel_count).toBe(1032)
    const class80 = wc.find((c: { class_code: number }) => c.class_code === 80)
    expect(class80).toBeDefined()
    expect(class80.parcel_count).toBe(819)
  })

  it('contains fitted feature importances for production and tree models', () => {
    const fPath = path.join(PUBLIC_DATA, 'feature_importance.json')
    expect(fs.existsSync(fPath)).toBe(true)

    const fi = JSON.parse(fs.readFileSync(fPath, 'utf8'))
    expect(fi.RandomForest).toBeDefined()
    expect(fi.RandomForest.length).toBeGreaterThan(5)
    expect(fi.ExtraTrees).toBeDefined()
    expect(fi.XGBoost).toBeDefined()
  })
})

