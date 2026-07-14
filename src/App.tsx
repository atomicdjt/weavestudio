import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { HelpCircle, Home, Layers, Workflow } from 'lucide-react';

function App() {
  const location = useLocation();
  useEffect(() => {
    const titles: Record<string, string> = { '/': 'WeaveStudio — Local-first workflow canvas', '/app': 'Workspace — WeaveStudio', '/templates': 'Templates — WeaveStudio', '/docs': 'Docs — WeaveStudio', '/acquire': 'Acquire WeaveStudio' };
    document.title = titles[location.pathname] ?? 'Page not found — WeaveStudio';
  }, [location.pathname]);

  const navItems = [
    { name: 'Home', path: '/', icon: <Home className="w-4 h-4" /> },
    { name: 'Workspace', path: '/app', icon: <Workflow className="w-4 h-4" /> },
    { name: 'Templates', path: '/templates', icon: <Layers className="w-4 h-4" /> },
    { name: 'Docs', path: '/docs', icon: <HelpCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-canvas text-gray-100 font-sans">
      <nav className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between px-4 sm:px-6 py-3 bg-panel border-b border-border shrink-0">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white shadow-inner">
            W
          </div>
          <div>
            <span className="font-semibold text-lg tracking-tight">WeaveStudio</span>
            <div className="text-[11px] text-gray-500 leading-none">Local-first workflow canvas</div>
          </div>
        </Link>
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
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
      </nav>
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Outlet />
      </main>
      <footer className="shrink-0 border-t border-border bg-panel/80 px-4 sm:px-6 py-2 text-xs text-gray-500 flex items-center justify-between gap-3">
        <span>Local-first by default. Human-reviewed. Exportable.</span>
        <Link to="/docs" className="text-gray-500 hover:text-gray-300 transition-colors">
          Usage guide
        </Link>
      </footer>
    </div>
  );
}

export default App;
