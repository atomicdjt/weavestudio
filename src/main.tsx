import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App'
import { LandingPage } from './pages/LandingPage'
import { WorkspacePage } from './pages/WorkspacePage'
import { TemplatesGallery } from './pages/TemplatesGallery'
import { AcquirePage } from './pages/AcquirePage'
import { DocsPage } from './pages/DocsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { AppErrorBoundary } from './components/ui/AppErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary><BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<LandingPage />} />
          <Route path="app" element={<WorkspacePage />} />
          <Route path="templates" element={<TemplatesGallery />} />
          <Route path="acquire" element={<AcquirePage />} />
          {/* Legacy redirects */}
          <Route path="buyer" element={<Navigate to="/acquire" replace />} />
          <Route path="exports" element={<Navigate to="/docs#exports" replace />} />
          <Route path="docs" element={<DocsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter></AppErrorBoundary>
  </StrictMode>,
)
