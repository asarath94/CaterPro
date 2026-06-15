import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SWRConfig } from 'swr'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SWRConfig value={{ revalidateOnFocus: false, dedupingInterval: 60000 }}>
      <App />
    </SWRConfig>
  </StrictMode>,
)
