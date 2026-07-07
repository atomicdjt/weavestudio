import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App'
import { LandingPage } from './pages/LandingPage'
import { WorkspacePage } from './pages/WorkspacePage'
import { TemplatesGallery } from './pages/TemplatesGallery'
import { ExportsCenter } from './pages/ExportsCenter'
import { AcquirePage } from './pages/AcquirePage'
import { DocsPage } from './pages/DocsPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<LandingPage />} />
          <Route path="app" element={<WorkspacePage />} />
          <Route path="templates" element={<TemplatesGallery />} />
          <Route path="exports" element={<ExportsCenter />} />
          <Route path="acquire" element={<AcquirePage />} />
          {/* Legacy redirects */}
          <Route path="buyer" element={<Navigate to="/acquire" replace />} />
          <Route path="docs" element={<DocsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
