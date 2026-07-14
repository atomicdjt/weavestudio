import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App'
import { AppErrorBoundary } from './components/ui/AppErrorBoundary'

const LandingPage = lazy(() => import('./pages/LandingPage').then((module) => ({ default: module.LandingPage })))
const WorkspacePage = lazy(() => import('./pages/WorkspacePage').then((module) => ({ default: module.WorkspacePage })))
const TemplatesGallery = lazy(() => import('./pages/TemplatesGallery').then((module) => ({ default: module.TemplatesGallery })))
const AcquirePage = lazy(() => import('./pages/AcquirePage').then((module) => ({ default: module.AcquirePage })))
const DocsPage = lazy(() => import('./pages/DocsPage').then((module) => ({ default: module.DocsPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary><BrowserRouter><Suspense fallback={<main className="grid min-h-screen place-items-center bg-canvas text-sm text-gray-300" role="status">Loading WeaveStudio…</main>}>
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
    </Suspense></BrowserRouter></AppErrorBoundary>
  </StrictMode>,
)
