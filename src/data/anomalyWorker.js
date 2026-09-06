import { buildHazardLayersFromPredictions } from './anomalyModel'

self.onmessage = async ({ data }) => {
  try {
    const response = await fetch(data.predictionsUrl, { cache: 'no-store' })
    if (!response.ok) throw new Error(`Prediction request failed: ${response.status}`)
    const payload = await response.json()
    const rows = payload.rows
    const predictions = rows.map((row) => ({ score: row.model_anomaly_score, isAnomaly: row.model_is_anomaly }))
    const summary = payload.summary
    const fullLayers = buildHazardLayersFromPredictions(rows, predictions, data.hazardNames)
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
    const totalPossibleNodes = rows.length * data.hazardNames.length
    const refinement = { totalPossibleNodes, retainedNodes, filteredNodes: totalPossibleNodes - retainedNodes }
    self.postMessage({ type: 'ready', summary, refinement, layers, trainedRows: rows.length })
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message })
  }
}
