import { useEffect, useState } from 'react'
import normalCursor from './assets/normal.cur'
import Dashboard from './Dashboard'
const leafColors = ['#556b2f', '#8aa35b', '#c47b50', '#d3a84f', '#729b78']

function App() {
  const [leaves, setLeaves] = useState([])
  const [isDark, setIsDark] = useState(() => localStorage.getItem('erms-theme') === 'dark')
  const [showDashboard, setShowDashboard] = useState(window.location.hash === '#dashboard')

  useEffect(() => {
    localStorage.setItem('erms-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  useEffect(() => {
    let lastSpawn = 0

    const handlePointerMove = (event) => {
      const now = Date.now()
      if (now - lastSpawn < 80) return
      lastSpawn = now

      const leaf = {
        id: now + Math.random(),
        x: event.clientX,
        y: event.clientY,
        color: leafColors[Math.floor(Math.random() * leafColors.length)],
        driftX: `${Math.round((Math.random() - 0.5) * 220)}px`,
        driftY: `${Math.round(80 + Math.random() * 140)}px`,
        rotation: `${Math.round((Math.random() - 0.5) * 520)}deg`,
      }

      setLeaves((currentLeaves) => [...currentLeaves.slice(-24), leaf])
    }

    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [])

  useEffect(() => {
    const handleHashChange = () => setShowDashboard(window.location.hash === '#dashboard')
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (showDashboard) return <Dashboard isDark={isDark} />

  return (
      <main className={`min-h-screen w-full overflow-x-hidden font-instagram ${isDark ? 'bg-[#111810] text-[#edf4e5]' : 'bg-white text-[#35451f]'}`} style={{ cursor: `url(${normalCursor}), auto` }}>
      <button
        className={`absolute right-4 top-4 z-40 border px-3 py-2 font-instagram text-[10px] font-bold tracking-[.1em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c47b50] focus-visible:outline-offset-4 min-[541px]:right-8 min-[541px]:top-6 ${isDark ? 'border-[#a8c878] text-[#a8c878] hover:bg-[#a8c878] hover:text-[#111810]' : 'border-[#556b2f] text-[#556b2f] hover:bg-[#556b2f] hover:text-white'}`}
        type="button"
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        onClick={() => setIsDark((currentMode) => !currentMode)}
      >
        {isDark ? 'LIGHT MODE' : 'DARK MODE'}
      </button>

      <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden="true">
          {leaves.map((leaf) => (
            <span
              className="animate-leaf-drift absolute h-2 w-[13px] rounded-[100%_0_100%_0] opacity-0 before:absolute before:left-[6px] before:top-0 before:h-[10px] before:w-px before:rotate-[34deg] before:bg-white/55"
            key={leaf.id}
            style={{
              left: leaf.x,
              top: leaf.y,
              '--leaf-color': leaf.color,
              '--drift-x': leaf.driftX,
              '--drift-y': leaf.driftY,
              '--rotation': leaf.rotation,
            }}
          />
        ))}
      </div>

        <section className="flex min-h-screen w-full flex-col items-center justify-center px-4 text-center" id="top">
          <p className={`mb-6 font-instagram text-[9px] leading-none tracking-[.1em] min-[541px]:mb-7 min-[541px]:text-[10px] min-[821px]:mb-7 min-[1321px]:mb-[38px] min-[1321px]:text-xs min-[1921px]:mb-14 min-[1921px]:text-base min-[4161px]:mb-[72px] min-[4161px]:text-[22px] ${isDark ? 'text-[#a8c878]' : 'text-[#718257]'}`}>ENVIRONMENTAL INTELLIGENCE PLATFORM</p>
          <h1 className={`w-full max-w-full break-words font-instagram text-[clamp(28px,10vw,56px)] font-normal leading-[.98] tracking-[-.045em] min-[541px]:text-[clamp(58px,9vw,78px)] min-[821px]:text-[clamp(76px,8vw,104px)] min-[1321px]:text-[clamp(112px,7vw,144px)] min-[1921px]:text-[clamp(150px,7vw,240px)] min-[4161px]:text-[300px] ${isDark ? 'text-[#edf4e5]' : 'text-[#35451f]'}`}>ENVIRONMENTAL RISK<br /><em className={isDark ? 'text-[#a8c878]' : 'text-[#556b2f]'}>MONITORING SYSTEM</em></h1>
          <a className={`mt-[34px] border px-[18px] py-[14px] font-instagram text-xs font-bold tracking-[.1em] no-underline transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c47b50] focus-visible:outline-offset-4 min-[541px]:mt-12 min-[541px]:px-6 min-[541px]:py-[15px] min-[1321px]:mt-[58px] min-[1321px]:px-7 min-[1321px]:py-[18px] min-[1321px]:text-[13px] min-[1921px]:mt-[82px] min-[1921px]:px-[38px] min-[1921px]:py-6 min-[1921px]:text-base min-[4161px]:mt-[110px] min-[4161px]:px-[52px] min-[4161px]:py-8 min-[4161px]:text-[21px] ${isDark ? 'border-[#a8c878] text-[#a8c878] hover:bg-[#a8c878] hover:text-[#111810]' : 'border-[#556b2f] text-[#556b2f] hover:bg-[#556b2f] hover:text-white'}`} href="#dashboard">OPEN DASHBOARD</a>
      </section>

        <footer className={`relative z-10 flex w-full shrink-0 flex-col items-center gap-6 px-4 py-[22px] text-center min-[541px]:flex-row min-[541px]:items-center min-[541px]:justify-between min-[541px]:px-8 min-[541px]:py-6 min-[821px]:px-12 min-[1321px]:px-[max(48px,calc((100% - 1320px)/2))] min-[1321px]:py-[30px] min-[1921px]:px-[max(72px,calc((100% - 1900px)/2))] min-[1921px]:py-11 min-[4161px]:px-[max(100px,calc((100% - 2800px)/2))] min-[4161px]:py-[60px] ${isDark ? 'bg-[#080d08]' : 'bg-[#35451f]'}`}>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-3 min-[541px]:justify-start min-[541px]:gap-6 min-[1921px]:gap-9 min-[4161px]:gap-[52px]">
            <button className="border-0 bg-transparent p-0 font-instagram text-[10px] tracking-[.1em] text-white underline decoration-1 underline-offset-4 hover:text-[#d3a84f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c47b50] focus-visible:outline-offset-4 min-[1321px]:text-[11px] min-[1921px]:text-sm min-[4161px]:text-lg" type="button" onClick={() => window.alert('ERMS is being developed by a multidisciplinary student team.')}>ABOUT THE DEVELOPERS</button>
            <button className="border-0 bg-transparent p-0 font-instagram text-[10px] tracking-[.1em] text-white underline decoration-1 underline-offset-4 hover:text-[#d3a84f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c47b50] focus-visible:outline-offset-4 min-[1321px]:text-[11px] min-[1921px]:text-sm min-[4161px]:text-lg" type="button" onClick={() => window.alert('Terms and conditions will be available with the full dashboard release.')}>TERMS AND CONDITIONS</button>
        </div>
          <div className={`self-center font-instagram text-[48px] font-bold leading-[.7] tracking-[-.08em] min-[541px]:self-end min-[541px]:text-[72px] min-[821px]:text-[92px] min-[1321px]:text-[124px] min-[1921px]:text-[190px] min-[4161px]:text-[280px] ${isDark ? 'text-white' : 'text-[#edf4e5]'}`}>ERMS</div>
      </footer>
    </main>
  )
}

export default App