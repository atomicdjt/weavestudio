import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Props = { children: ReactNode };
type State = { failed: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };
  static getDerivedStateFromError(): State { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { /* never log document content or credentials */ }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="min-h-screen grid place-items-center bg-canvas p-6 text-center"><section className="max-w-md rounded-xl border border-border bg-panel p-8"><h1 className="text-xl font-bold text-white">WeaveStudio needs to recover</h1><p className="mt-3 text-sm text-gray-400">Your browser data was not intentionally cleared. Reload to try again, or return home and export any available work.</p><div className="mt-6 flex justify-center gap-3"><button type="button" onClick={() => window.location.reload()} className="rounded bg-blue-600 px-4 py-2 font-semibold text-white">Reload</button><Link to="/" className="rounded border border-border px-4 py-2 text-gray-200">Return home</Link></div></section></main>;
  }
}
