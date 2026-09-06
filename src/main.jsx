import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import faviconUrl from './assets/favicon.png'

const faviconLink = document.querySelector('link[rel="icon"]')
if (faviconLink) faviconLink.href = faviconUrl

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
