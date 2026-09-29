import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './interface.css'
import './games.css'
import App from './App.tsx'
import { eegService } from './services/eegService'
import { createMuseAdapter } from './services/museAdapter'

eegService.install(createMuseAdapter())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
