import { buildHazardLayersFromPredictions } from './anomalyModel'

let refreshTimer = null

const loadPredictions = async (predictionsUrl, hazardNames) => {
  const response = await fetch(predictionsUrl, { cache: 'no-store' })
  if (!response.ok) throw new Error(`Prediction request failed: ${response.status}`)
  const payload = await response.json()
  const rows = payload.rows
  const predictions = rows.map((row) => ({ score: row.model_anomaly_score, isAnomaly: row.model_is_anomaly }))
  const summary = payload.summary
  const fullLayers = buildHazardLayersFromPredictions(rows, predictions, hazardNames)
  const layers = Object.fromEntries(Object.entries(fullLayers).map(([name, nodes]) => {
    const anomalies = nodes.filter((node) => node.isAnomaly)
    const regularNodes = nodes.filter((node) => !node.isAnomaly)
    return [name, {
      count: nodes.length,
      anomalyCount: anomalies.length,
      nodes: [...anomalies, ...regularNodes].slice(0, 600),
    }]
  }))

  const retainedNodes = Object.values(layers).reduce((total, layer) => total + layer.count, 0)
  const totalPossibleNodes = rows.length * hazardNames.length
  const refinement = { totalPossibleNodes, retainedNodes, filteredNodes: totalPossibleNodes - retainedNodes }
  self.postMessage({ type: 'ready', summary, refinement, layers, trainedRows: rows.length })
}

self.onmessage = async ({ data }) => {
  try {
    if (refreshTimer) clearInterval(refreshTimer)
    await loadPredictions(data.predictionsUrl, data.hazardNames)
    refreshTimer = setInterval(() => {
      loadPredictions(data.predictionsUrl, data.hazardNames).catch((error) => {
        self.postMessage({ type: 'error', message: error.message })
      })
    }, 5000)
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message })
  }
}

self.onmessageerror = () => {
  self.postMessage({ type: 'error', message: 'Worker failed to process sensor updates.' })
}

