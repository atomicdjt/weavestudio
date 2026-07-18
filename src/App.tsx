import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { HelpCircle, Home, Layers, Menu, Workflow, X } from 'lucide-react';
import { AccessibleDialog } from './components/ui/AccessibleDialog';

function App() {
  const location = useLocation();
  const [mobileNav, setMobileNav] = useState(false);
  useEffect(() => {
    const titles: Record<string, string> = { '/': 'WeaveStudio — Local-first workflow canvas', '/app': 'Workspace — WeaveStudio', '/templates': 'Templates — WeaveStudio', '/docs': 'Docs — WeaveStudio', '/acquire': 'Acquire WeaveStudio' };
    document.title = titles[location.pathname] ?? 'Page not found — WeaveStudio';
  }, [location.pathname]);

  const navItems = [
    { name: 'Home', path: '/', icon: <Home className="w-4 h-4" /> },
    { name: 'Workspace', path: '/app', icon: <Workflow className="w-4 h-4" /> },
    { name: 'Templates', path: '/templates', icon: <Layers className="w-4 h-4" /> },
    { name: 'Docs', path: '/docs', icon: <HelpCircle className="w-4 h-4" /> },
    { name: 'Acquire', path: '/acquire', icon: <span aria-hidden="true">$</span> },
  ];

  return (
    <div className="flex flex-col h-full bg-canvas text-gray-100 font-sans">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:m-3 focus:rounded focus:bg-blue-600 focus:px-3 focus:py-2">Skip to main content</a>
      <nav className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-panel border-b border-border shrink-0">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white shadow-inner">
            W
          </div>
          <div>
            <span className="font-semibold text-lg tracking-tight">WeaveStudio</span>
            <div className="text-[11px] text-gray-500 leading-none">Local-first workflow canvas</div>
          </div>
        </Link>
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                location.pathname === item.path
                  ? 'bg-blue-600/10 text-blue-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
        <button type="button" className="lg:hidden rounded border border-border p-2 text-gray-200" aria-label="Open navigation" aria-expanded={mobileNav} onClick={() => setMobileNav(true)}><Menu className="h-5 w-5" /></button>
      </nav>
      {mobileNav && <AccessibleDialog label="Navigation" onClose={() => setMobileNav(false)} className="w-full max-w-sm rounded-xl border border-border bg-panel p-4 shadow-2xl"><div className="mb-4 flex items-center justify-between"><strong>Navigate</strong><button type="button" aria-label="Close navigation" onClick={() => setMobileNav(false)} className="rounded p-2"><X className="h-5 w-5" /></button></div><div className="grid gap-2">{navItems.map((item) => <Link key={item.path} to={item.path} onClick={() => setMobileNav(false)} className={`flex items-center gap-2 rounded px-3 py-3 text-sm font-medium ${location.pathname === item.path ? 'bg-blue-600/10 text-blue-300' : 'text-gray-200 hover:bg-gray-800'}`}>{item.icon}<span>{item.name}</span></Link>)}</div></AccessibleDialog>}
      <main id="main-content" className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Outlet />
      </main>
      <footer className="shrink-0 border-t border-border bg-panel/80 px-4 sm:px-6 py-2 text-xs text-gray-500 flex flex-wrap items-center justify-between gap-3">
        <span>© 2026 WeaveStudio · Local-first by default. Human-reviewed. Exportable.</span>
        <span className="flex gap-3"><Link to="/docs#privacy" className="hover:text-gray-300 transition-colors">Privacy</Link><Link to="/docs#license" className="hover:text-gray-300 transition-colors">License</Link><Link to="/docs" className="hover:text-gray-300 transition-colors">Usage guide</Link><Link to="/acquire" className="hover:text-gray-300 transition-colors">Acquire</Link></span>
      </footer>
    </div>
  );
}

export default App;
