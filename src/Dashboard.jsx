import { useEffect, useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const hazardTypes = [
  { name: 'Flood', color: '#3b82f6' },
  { name: 'Hazardous AQI', color: '#a855f7' },
  { name: 'Forest Fires', color: '#f97316' },
  { name: 'Earthquakes', color: '#dc2626' },
  { name: 'Landslides', color: '#92400e' },
  { name: 'Extreme Heat', color: '#ef4444' },
  { name: 'Industrial Emissions', color: '#64748b' },
  { name: 'Water Quality', color: '#06b6d4' },
  { name: 'Glacial Liquefaction', color: '#38bdf8' },
  { name: 'Tsunami', color: '#0f766e' },
  { name: 'Cyclone', color: '#ec4899' },
  { name: 'Other Hazards', color: '#6b7280' },
]

function CoordinatePicker({ onPick }) {
  useMapEvents({ click: (event) => onPick([event.latlng.lat, event.latlng.lng]) })
  return null
}

function NodePopup({ node, activeHazard, shouldResolve }) {
  const [placeName, setPlaceName] = useState('Resolving coordinate...')

  useEffect(() => {
    if (!shouldResolve) return undefined
    const controller = new AbortController()

    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${node.position[0]}&lon=${node.position[1]}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((result) => setPlaceName(result.display_name || 'Coordinate location'))
      .catch(() => setPlaceName('Coordinate location'))

    return () => controller.abort()
  }, [node.position, shouldResolve])

  return <><strong>{placeName}</strong><br />{activeHazard}: {node.value || 'No direct reading'}<br />Coordinates: {node.position[0].toFixed(4)}°, {node.position[1].toFixed(4)}°<br />Anomaly score: {Math.round(node.score * 100)}%<br />Updated: {node.updated}</>
}

function FitWorldToWidth() {
  const map = useMap()

  useEffect(() => {
    const fitWorld = () => {
      const width = map.getSize().x
      const worldZoom = Math.max(2, Math.log2(width / 256) + 0.06)
      map.setMinZoom(worldZoom)
      map.setZoom(worldZoom, { animate: false })
      map.invalidateSize({ pan: false })
    }

    fitWorld()
    const resizeObserver = new ResizeObserver(fitWorld)
    resizeObserver.observe(map.getContainer())
    return () => resizeObserver.disconnect()
  }, [map])

  return null
}

function Dashboard({ isDark }) {
  const [modelState, setModelState] = useState(null)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [location, setLocation] = useState({ name: 'Silchar, Assam', coordinates: [24.83, 92.78] })
  const [selectedCoordinate, setSelectedCoordinate] = useState(null)
  const [activeHazard, setActiveHazard] = useState('Flood')
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [activeNode, setActiveNode] = useState(null)
  const [activePlaceName, setActivePlaceName] = useState('')
  const [mapOpen, setMapOpen] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const worker = new Worker(new URL('./data/anomalyWorker.js', import.meta.url), { type: 'module' })
    worker.onmessage = (event) => {
      if (event.data.type === 'ready') setModelState(event.data)
      if (event.data.type === 'error') setError(`Data model unavailable: ${event.data.message}`)
    }
    worker.postMessage({
      predictionsUrl: `/ml_predictions.json?version=${Date.now()}`,
      hazardNames: hazardTypes.map((hazard) => hazard.name),
    })
    return () => worker.terminate()
  }, [])

  useEffect(() => {
    if (!activeNode) {
      return undefined
    }

    const controller = new AbortController()
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${activeNode.position[0]}&lon=${activeNode.position[1]}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((result) => setActivePlaceName(result.display_name || 'Coordinate location'))
      .catch(() => setActivePlaceName('Coordinate location'))
    return () => controller.abort()
  }, [activeNode])

  const searchLocation = async (event) => {
    event.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setError('')

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`, {
        headers: { Accept: 'application/json' },
      })
      const results = await response.json()
      if (!results.length) throw new Error('Location not found')
      const result = results[0]
      setLocation({ name: result.display_name.split(',').slice(0, 2).join(','), coordinates: [Number(result.lat), Number(result.lon)] })
    } catch {
      setError('Could not find that place. Try a city, district, or country.')
    } finally {
      setSearching(false)
    }
  }

  const activeLayer = modelState?.layers?.[activeHazard]
  const visibleNodes = activeLayer?.nodes ?? []
  const anomalyCount = activeLayer?.anomalyCount ?? 0
  const mapNodes = visibleNodes
  const displayedNode = activeNode?.type === activeHazard ? activeNode : visibleNodes[0]

  return (
    <main className={`dashboard-shell min-h-screen w-full overflow-x-hidden rounded-[5px] font-instagram ${isDark ? 'bg-[#111810] text-[#edf4e5]' : 'bg-white text-[#26351b]'}`}>
      <header className={`flex min-h-20 items-center justify-between border-b px-5 py-4 md:px-10 ${isDark ? 'border-[#34452d] bg-[#182218]' : 'border-[#d7dfcd] bg-white'}`}>
        <a className={`rounded-[5px] text-sm font-bold tracking-[.16em] no-underline ${isDark ? 'text-[#edf4e5]' : 'text-[#35451f]'}`} href="/">ERMS / DASHBOARD</a>
        <a className={`rounded-[5px] border px-3 py-2 text-[10px] font-bold tracking-[.1em] no-underline ${isDark ? 'border-[#a8c878] text-[#a8c878] hover:bg-[#a8c878] hover:text-[#111810]' : 'border-[#556b2f] text-[#556b2f] hover:bg-[#556b2f] hover:text-white'}`} href="/">BACK HOME</a>
      </header>

      <div className="mx-auto w-full max-w-[1800px] space-y-5 p-5 md:p-10">
        <section className={`rounded-[5px] border p-5 md:p-6 ${isDark ? 'border-[#34452d] bg-[#182218]' : 'border-[#d7dfcd] bg-white'}`}>
          <p className="mb-5 text-[10px] font-bold tracking-[.14em] text-[#718257]">01 / SAVED LOCATION</p>
          <form className="flex flex-col gap-3 md:flex-row" onSubmit={searchLocation}>
            <div className={`flex min-h-14 flex-1 rounded-[5px] border focus-within:border-[#556b2f] ${isDark ? 'border-[#50664a] bg-[#111810]' : 'border-[#b9c8ae] bg-[#fbfcfa]'}`}>
              <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
                <span className="text-lg text-[#718257]" aria-hidden="true">⌖</span>
                <input id="location-search" className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${isDark ? 'text-[#edf4e5] placeholder:text-[#718257]' : 'text-[#35451f] placeholder:text-[#8b9783]'}`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search a location (current: ${location.name})`} />
              </div>
              <button className="rounded-r-[5px] bg-[#556b2f] px-6 text-[10px] font-bold tracking-wider text-white" type="submit">{searching ? 'SEARCHING...' : 'SEARCH LOCATION'}</button>
            </div>
            {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
          </form>
          <div className={`mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t pt-4 font-mono text-xs ${isDark ? 'border-[#34452d] text-[#a8c878]' : 'border-[#edf0e9] text-[#556b2f]'}`}>
            <span>ACTIVE: <strong>{location.name}</strong></span><span>LAT {location.coordinates[0].toFixed(4)}°</span><span>LON {location.coordinates[1].toFixed(4)}°</span>
          </div>
          <p className="mt-4 text-[10px] leading-relaxed text-[#8b9783]">Search uses OpenStreetMap Nominatim geocoding. Results are approximate and intended for monitoring context.</p>
          <div className="mt-5 grid max-w-md grid-cols-2 gap-2">
            <div className={`rounded-[5px] p-3 ${isDark ? 'bg-[#243220]' : 'bg-[#f4f6f0]'}`}><p className="text-[9px] tracking-wider text-[#718257]">CSV SAMPLES</p><strong className={`mt-1 block text-lg ${isDark ? 'text-[#edf4e5]' : 'text-[#35451f]'}`}>{modelState?.summary?.rows ?? '...'}</strong></div>
            <div className={`rounded-[5px] p-3 ${isDark ? 'bg-[#33221f]' : 'bg-[#f4f6f0]'}`}><p className="text-[9px] tracking-wider text-[#718257]">ANOMALIES</p><strong className="mt-1 block text-lg text-[#c4513b]">{modelState?.summary?.anomalies ?? '...'}</strong></div>
          </div>
          <p className="mt-3 text-[10px] text-[#718257]">GEOSPATIAL FILTER: {modelState?.refinement ? `${modelState.refinement.filteredNodes.toLocaleString()} impossible ocean or invalid nodes removed` : error || 'running...'}</p>
        </section>

        <section className={`rounded-[5px] border p-4 md:p-5 ${isDark ? 'border-[#34452d] bg-[#182218]' : 'border-[#d7dfcd] bg-white'}`}>
          {!mapOpen ? (
            <button className={`flex min-h-28 w-full flex-col items-center justify-center rounded-[5px] border border-dashed text-center transition-colors ${isDark ? 'border-[#61784e] text-[#a8c878] hover:bg-[#243220]' : 'border-[#9caf8f] text-[#556b2f] hover:bg-[#f4f6f0]'}`} type="button" onClick={() => setMapOpen(true)}>
              <span className="text-[10px] font-bold tracking-[.14em]">02 / WORLD MAP</span>
              <span className="mt-3 text-lg font-medium">OPEN REALTIME MAP</span>
              <span className="mt-1 text-[10px] text-[#7a8871]">View live anomaly nodes and select coordinates</span>
            </button>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3 px-1"><div><p className="text-[10px] font-bold tracking-[.14em] text-[#718257]">02 / WORLD MAP</p><h2 className="mt-1 text-xl font-medium">Select a point on the map</h2></div>{selectedCoordinate && <p className="font-mono text-xs text-[#556b2f]">{selectedCoordinate[0].toFixed(4)}°, {selectedCoordinate[1].toFixed(4)}°</p>}</div>
              <div className={`h-[500px] overflow-hidden rounded-[5px] border md:h-[620px] ${isDark ? 'border-[#34452d]' : 'border-[#d7dfcd]'}`}>
                <MapContainer center={[20, 0]} zoom={2.5} minZoom={2} maxBounds={[[-90, -180], [90, 180]]} maxBoundsViscosity={1} worldCopyJump={false} className="h-full w-full"><FitWorldToWidth /><TileLayer noWrap attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><CoordinatePicker onPick={setSelectedCoordinate} /><CircleMarker center={location.coordinates} radius={8} pathOptions={{ color: '#35451f', fillColor: '#9ccd65', fillOpacity: 1 }}><Popup><strong>{location.name}</strong><br />Saved location<br />{location.coordinates[0].toFixed(4)}°, {location.coordinates[1].toFixed(4)}°</Popup></CircleMarker>{selectedCoordinate && <CircleMarker center={selectedCoordinate} radius={7} pathOptions={{ color: '#c47b50', fillColor: '#d3a84f', fillOpacity: 1 }}><Popup><strong>Selected coordinate</strong><br />{selectedCoordinate[0].toFixed(4)}°, {selectedCoordinate[1].toFixed(4)}°</Popup></CircleMarker>}{mapNodes.map((node) => <CircleMarker key={`${node.type}-${node.id}`} center={node.position} eventHandlers={{ click: () => { setSelectedNodeId(node.id); setActiveNode(node) } }} radius={node.isAnomaly ? 10 : 7} pathOptions={{ color: hazardTypes.find((hazard) => hazard.name === node.type)?.color, fillColor: hazardTypes.find((hazard) => hazard.name === node.type)?.color, fillOpacity: node.isAnomaly ? .9 : .55 }}><Popup eventHandlers={{ add: () => { setSelectedNodeId(node.id); setActiveNode(node) } }}><NodePopup node={node} activeHazard={activeHazard} shouldResolve={selectedNodeId === node.id} /></Popup></CircleMarker>)}</MapContainer>
              </div>
              <button className="mt-3 rounded-[5px] border border-[#556b2f] px-3 py-2 text-[10px] font-bold tracking-wider text-[#556b2f]" type="button" onClick={() => setMapOpen(false)}>CLOSE MAP</button>
            </>
          )}
        </section>

        <section className={`rounded-[5px] border p-5 ${isDark ? 'border-[#34452d] bg-[#182218]' : 'border-[#d7dfcd] bg-white'}`}>
          <p className="mb-2 text-[10px] font-bold tracking-[.14em] text-[#718257]">03 / RISK FEEDS</p>
          <p className="mb-5 text-xs text-[#7a8871]">Choose a layer to plot available anomaly nodes</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {hazardTypes.map((hazard) => (
                <button className={`flex min-h-24 flex-col items-start justify-between rounded-[10px] border p-3 text-left text-xs transition-colors ${activeHazard === hazard.name ? (isDark ? 'border-[#a8c878] bg-[#304226] text-[#edf4e5]' : 'border-[#556b2f] bg-[#eef3e8] text-[#35451f]') : (isDark ? 'border-transparent bg-[#202d1e] text-[#a3b29a] hover:border-[#61784e]' : 'border-transparent bg-[#f7f9f5] text-[#64705d] hover:border-[#c5d2bd]')}`} key={hazard.name} type="button" onClick={() => { const nextNode = modelState?.layers?.[hazard.name]?.nodes?.[0] ?? null; setActiveHazard(hazard.name); setSelectedNodeId(nextNode?.id ?? null); setActiveNode(nextNode) }}>
                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: hazard.color }} />{hazard.name}</span>
                <span><strong className="font-mono text-lg">{modelState?.layers?.[hazard.name]?.anomalyCount ?? '...'}</strong><span className="ml-1 text-[9px] uppercase tracking-wider text-[#718257]">predicted</span></span>
              </button>
            ))}
          </div>
          <div className={`mt-5 border-t pt-4 ${isDark ? 'border-[#34452d]' : 'border-[#edf0e9]'}`}>
            <p className="text-[10px] font-bold tracking-[.1em] text-[#718257]">ACTIVE NODE</p>
            <p className="mt-2 text-sm">{activeNode ? (activePlaceName || 'Resolving coordinate...') : (modelState ? 'No valid node for this hazard' : 'Loading filtered nodes...')}</p>
            <p className="mt-1 font-mono text-xs text-[#7a8871]">{displayedNode ? `${displayedNode.position[0].toFixed(4)}°, ${displayedNode.position[1].toFixed(4)}°` : 'CSV data required'}</p>
            <p className="mt-2 text-xs">{activeHazard}: <strong>{displayedNode?.value || 'No direct reading'}</strong></p>
            <p className="mt-2 text-xs text-[#c4513b]">{anomalyCount} predicted anomalies · selected score {displayedNode ? `${Math.round(displayedNode.score * 100)}%` : '0%'}</p>
            {displayedNode?.updated && <p className="mt-1 text-[10px] text-[#7a8871]">Updated: {displayedNode.updated}</p>}
            {anomalyCount > mapNodes.length && <p className="mt-1 text-[10px] text-[#7a8871]">Showing top {mapNodes.length} anomaly nodes for map performance.</p>}
          </div>
        </section>
      </div>
    </main>
  )
}

export default Dashboard
