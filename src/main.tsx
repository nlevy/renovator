import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './auth/AuthProvider'
import SyncManager from './data/SyncManager'
import { initSync } from './data/sync'
import './index.css'

function render() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <SyncManager>
            <App />
          </SyncManager>
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>,
  )
}

// load persisted data into the store before first paint, then render
initSync().finally(render)
