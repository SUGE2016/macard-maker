import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BlindboxPage } from './pages/BlindboxPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BlindboxPage />
  </StrictMode>,
)
