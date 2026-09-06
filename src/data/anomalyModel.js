import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { featureCollection } from '@turf/helpers'
import nearestPointOnLine from '@turf/nearest-point-on-line'
import polygonToLine from '@turf/polygon-to-line'
import { feature } from 'topojson-client'
import landTopology from 'world-atlas/land-110m.json'

const severityScale = {
  none: 0,
  good: 0,
  excellent: 0,
  low: 0.18,
  fair: 0.35,
  moderate: 0.5,
  contaminated: 0.72,
  poor: 0.78,
  high: 0.72,
  severe: 1,
  hazardous: 1,
  'very unhealthy': 0.9,
  unhealthy: 0.65,
  'unhealthy for sensitive groups': 0.45,
}

const featureFields = [
  'aqi_value',
  'earthquake_magnitude_est',
  'max_temp_c_forecast',
]

const riskFields = [
  'flood_risk',
  'forest_fire_risk',
  'earthquake_risk',
  'landslide_risk',
  'extreme_heat_risk',
  'industrial_emissions_level',
  'water_quality',
  'glacial_liquefaction_risk',
  'tsunami_risk',
  'cyclone_risk',
]

const hazardFieldMap = {
  Flood: 'flood_risk',
  'Hazardous AQI': 'hazardous_aqi_level',
  'Forest Fires': 'forest_fire_risk',
  Earthquakes: 'earthquake_risk',
  Landslides: 'landslide_risk',
  'Extreme Heat': 'extreme_heat_risk',
  'Industrial Emissions': 'industrial_emissions_level',
  'Water Quality': 'water_quality',
  'Glacial Liquefaction': 'glacial_liquefaction_risk',
  Tsunami: 'tsunami_risk',
  Cyclone: 'cyclone_risk',
  'Other Hazards': 'other_hazards',
}

const cycloneCoastalLimitKm = 450
const tsunamiCoastalLimitKm = 250
const landFeatureCollection = feature(landTopology, landTopology.objects.land)
const landFeatures = landFeatureCollection.type === 'FeatureCollection'
  ? landFeatureCollection.features
  : [landFeatureCollection]
const coastline = featureCollection(landFeatures.flatMap((landPolygon) => {
  const line = polygonToLine(landPolygon)
  return line.type === 'FeatureCollection' ? line.features : [line]
}))

function hasValidCoordinates(row) {
  const latitude = Number(row.latitude)
  const longitude = Number(row.longitude)
  return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
}

function hasMarineSignal(row) {
  const tsunami = String(row.tsunami_risk || '').trim().toLowerCase()
  const cyclone = String(row.cyclone_risk || '').trim().toLowerCase()
  return tsunami && tsunami !== 'none' || cyclone && cyclone !== 'none'
}

function computeGeography(rows, predictions = null, includeCoastline = false) {
  return rows.map((row, index) => {
    if (!hasValidCoordinates(row)) return { isLand: false, coastlineDistanceKm: Infinity }
    const point = [Number(row.longitude), Number(row.latitude)]
    const isLand = landFeatures.some((landPolygon) => {
      try {
        return booleanPointInPolygon(point, landPolygon)
      } catch {
        return false
      }
    })
    if (!includeCoastline || !hasMarineSignal(row) || (predictions && !predictions[index]?.isAnomaly)) return { isLand, coastlineDistanceKm: Infinity }
    try {
      const nearest = nearestPointOnLine(coastline, point, { units: 'kilometers' })
      return { isLand, coastlineDistanceKm: nearest.properties.pointDistance ?? nearest.properties.dist ?? Infinity }
    } catch {
      return { isLand, coastlineDistanceKm: Infinity }
    }
  })
}

function isGeographicallyAllowed(geography, hazardName) {
  if (hazardName === 'Cyclone') return geography.coastlineDistanceKm <= cycloneCoastalLimitKm
  if (hazardName === 'Tsunami') return !geography.isLand && geography.coastlineDistanceKm <= tsunamiCoastalLimitKm
  return geography.isLand
}

function parseCsvLine(line) {
  const fields = []
  let field = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (character === '"' && line[index + 1] === '"') {
      field += '"'
      index += 1
    } else if (character === '"') {
      quoted = !quoted
    } else if (character === ',' && !quoted) {
      fields.push(field.trim())
      field = ''
    } else {
      field += character
    }
  }

  fields.push(field.trim())
  return fields
}

export function parseHazardCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/).filter(Boolean)
  const headers = parseCsvLine(lines[0])

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? ''
      return row
    }, {})
  })
}

function numericValue(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function median(values) {
  if (!values.length) return 0
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

function robustStats(rows, field) {
  const values = rows.map((row) => numericValue(row[field])).filter((value) => value !== null)
  const center = median(values)
  const deviation = median(values.map((value) => Math.abs(value - center)))
  return { center, scale: Math.max(deviation * 1.4826, 0.0001) }
}

function categoricalScore(value) {
  return severityScale[String(value || 'none').toLowerCase()] ?? 0
}

function numericAnomaly(value, stats) {
  if (value === null) return 0
  return Math.min(Math.abs(value - stats.center) / (stats.scale * 4), 1)
}

export function trainAnomalyModel(rows) {
  const numericStats = featureFields.reduce((stats, field) => {
    stats[field] = robustStats(rows, field)
    return stats
  }, {})

  return {
    type: 'robust-mad-environmental-anomaly-model',
    trainedRows: rows.length,
    numericStats,
    predict(row) {
      const numericSignals = featureFields.map((field) => numericAnomaly(numericValue(row[field]), numericStats[field]))
      const riskSignals = riskFields.map((field) => categoricalScore(row[field]))
      const strongestRisk = Math.max(...riskSignals, 0)
      const numericAverage = numericSignals.reduce((sum, value) => sum + value, 0) / numericSignals.length
      const score = Math.min((strongestRisk * 0.7) + (numericAverage * 0.3), 1)
      return { score, isAnomaly: score >= 0.58 }
    },
  }
}

export function buildHazardNodes(rows, model, hazardName) {
  const field = hazardFieldMap[hazardName]
  return rows
    .map((row) => {
      const prediction = model.predict(row)
      const hazardSeverity = categoricalScore(row[field])
      const isOtherHazard = hazardName === 'Other Hazards' && row.other_hazards && row.other_hazards !== 'None'
      const hasHazardSignal = hazardSeverity > 0 || isOtherHazard
      if (!hasHazardSignal) return null

      return {
        id: row.id,
        type: hazardName,
        title: row.region,
        position: [Number(row.latitude), Number(row.longitude)],
        severity: Math.max(hazardSeverity, prediction.score),
        score: prediction.score,
        isAnomaly: prediction.isAnomaly,
        value: row[field],
        updated: row.last_updated,
      }
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score)
}

export function buildHazardLayers(rows, model, hazardNames) {
  const predictions = rows.map((row) => model.predict(row))
  return buildHazardLayersFromPredictions(rows, predictions, hazardNames)
}

export function buildHazardLayersFromPredictions(rows, predictions, hazardNames) {
  const geography = computeGeography(rows, predictions, hazardNames.includes('Cyclone') || hazardNames.includes('Tsunami'))

  return hazardNames.reduce((layers, hazardName) => {
    const field = hazardFieldMap[hazardName]
    layers[hazardName] = rows
      .map((row, index) => {
        if (!hasValidCoordinates(row) || !isGeographicallyAllowed(geography[index], hazardName)) return null
        const prediction = predictions[index]
        const hazardSeverity = categoricalScore(row[field])
        const isOtherHazard = hazardName === 'Other Hazards' && row.other_hazards && row.other_hazards !== 'None'
        if (hazardSeverity === 0 && !isOtherHazard) return null

        return {
          id: row.id,
          type: hazardName,
          title: row.region,
          position: [Number(row.latitude), Number(row.longitude)],
          severity: Math.max(hazardSeverity, prediction.score),
          score: prediction.score,
          isAnomaly: prediction.isAnomaly,
          value: row[field],
          updated: row.last_updated,
        }
      })
      .filter(Boolean)
      .sort((left, right) => right.score - left.score)
    return layers
  }, {})
}

export function summarizePredictions(rows, model) {
  const predictions = rows.map((row) => model.predict(row))
  const anomalies = predictions.filter((prediction) => prediction.isAnomaly)
  return {
    rows: rows.length,
    anomalies: anomalies.length,
    anomalyRate: rows.length ? Math.round((anomalies.length / rows.length) * 100) : 0,
    averageScore: predictions.length ? predictions.reduce((sum, prediction) => sum + prediction.score, 0) / predictions.length : 0,
  }
}

export const hazardFieldNames = hazardFieldMap

export function countGeographicFilters(rows, hazardNames) {
  const totalPossibleNodes = rows.length * hazardNames.length
  const geography = computeGeography(rows, null, hazardNames.includes('Cyclone') || hazardNames.includes('Tsunami'))
  const retainedNodes = hazardNames.reduce((count, hazardName) => count + geography.filter((entry) => isGeographicallyAllowed(entry, hazardName)).length, 0)
  return { totalPossibleNodes, retainedNodes, filteredNodes: totalPossibleNodes - retainedNodes }
}
