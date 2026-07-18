import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
  useEffect(() => { document.title = 'Page not found · WeaveStudio'; }, []);
  return <section className="flex-1 grid place-items-center px-6 text-center" aria-labelledby="not-found-title">
    <div className="max-w-md rounded-2xl border border-border bg-panel p-8 shadow-2xl">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-blue-600 font-bold text-white">W</div>
      <h1 id="not-found-title" tabIndex={-1} autoFocus className="text-2xl font-bold text-white">Page not found</h1>
      <p className="mt-3 text-sm text-gray-400">That address does not belong to this local-first workspace.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3"><Link className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white" to="/">Return home</Link><Link className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-gray-200" to="/app">Open workspace</Link></div>
    </div>
  </section>;
};
