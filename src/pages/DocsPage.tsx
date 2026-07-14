import { Link } from 'react-router-dom';

export const DocsPage = () => {
  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 max-w-4xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-2">Usage guide</h1>
      <p className="text-gray-400 text-sm mb-8 max-w-2xl">
        WeaveStudio turns unstructured notes, transcripts, logs, and research fragments into structured, exportable
        deliverables using a visual workflow canvas — entirely in your browser by default.
      </p>

      <div className="space-y-8 text-gray-300">
        <section id="privacy" className="bg-panel border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Golden path</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              <Link to="/templates" className="text-blue-400 hover:underline">
                Choose a template
              </Link>{' '}
              (or open the guided demo from Home).
            </li>
            <li>Paste source material into the Source panel.</li>
            <li>Apply to the Input node and/or Split into nodes.</li>
            <li>Edit, connect, and classify nodes on the canvas.</li>
            <li>Run Validate, then Generate to preview the deliverable.</li>
            <li>Export Markdown, PDF, or re-importable project JSON.</li>
            <li>Reopen the named workspace later from the workspace switcher.</li>
          </ol>
        </section>

        <section className="bg-panel border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Local storage and privacy</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Workspaces autosave to browser localStorage with a visible save status.</li>
            <li>Clearing site data, private browsing, or another browser will not see your work — export important projects.</li>
            <li>The golden path (templates, canvas, validate, export) does not require network access.</li>
            <li>
              Optional AI Assist live provider calls are <strong>off until you confirm</strong>. Prefer Mock (offline).
              API keys stay in session memory only and are not written to localStorage.
            </li>
          </ul>
        </section>

        <section className="bg-panel border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Recovery and portability</h2>
          <p className="text-sm leading-relaxed">Use the workspace Data portability control to export either the current project or every WeaveStudio-owned browser record. Full-backup restore validates the file before replacing only WeaveStudio records. Browser storage can still be cleared by browser settings, so export important work before clearing site data or changing browsers.</p>
        </section>

        <section className="bg-panel border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Canvas basics</h2>
          <ul className="list-decimal list-inside space-y-3 text-sm">
            <li>
              <strong>Add nodes:</strong> Drag from the palette or use the + button.
            </li>
            <li>
              <strong>Connect:</strong> Drag from a source handle to a target handle.
            </li>
            <li>
              <strong>Edit:</strong> Select a node; use the inspector for title, category, content, and review flags.
            </li>
            <li>
              <strong>Categories:</strong> Evidence, action, risk, etc. drive how the deliverable engine groups sections.
            </li>
          </ul>
        </section>

        <section id="exports" className="bg-panel border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Exports</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>
              <strong>Markdown:</strong> Client-facing structured document.
            </li>
            <li>
              <strong>PDF:</strong> Local text layout of the same content (simple pagination).
            </li>
            <li>
              <strong>Project JSON:</strong> Full workspace for re-import (nodes, edges, source, draft, template id).
            </li>
          </ul>
        </section>

        <section className="bg-panel border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Keyboard and outline navigation</h2>
          <ul className="list-disc list-inside space-y-2 text-sm"><li><strong>Undo:</strong> Ctrl/Cmd+Z. <strong>Redo:</strong> Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y.</li><li><strong>Dialogs:</strong> Escape closes them and focus returns to the trigger.</li><li><strong>Workflow Outline:</strong> use the toolbar Outline control for a linear, keyboard-friendly reading order with connection counts.</li></ul>
        </section>

        <section className="bg-panel border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Quality and release evidence</h2>
          <p className="text-sm leading-relaxed">The source release includes TypeScript checks, linting, unit tests, browser-level regression tests, a production build, and deterministic acquisition-package validation. Run <code className="text-blue-300">npm run verify:buyer</code> from the source checkout to reproduce the release verification. This is engineering evidence, not a claim of certification or guaranteed fitness for a particular use.</p>
        </section>

        <section id="license" className="bg-panel border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">License and acquisition inquiries</h2>
          <p className="text-sm leading-relaxed">This build is distributed as proprietary source/IP for evaluation and acquisition discussions; no public redistribution license is granted by this preview. For source/IP acquisition, request the current scope and transfer materials at <a className="text-blue-300 hover:underline" href="mailto:davidelsey9513@gmail.com?subject=WeaveStudio%20acquisition%20inquiry">davidelsey9513@gmail.com</a>.</p>
        </section>

        <section className="bg-panel border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Limitations</h2>
          <p className="text-sm leading-relaxed">
            WeaveStudio structures user-provided content. It does not verify facts or provide legal, medical, or
            financial advice. Review exports before sharing. See repository <code className="text-blue-300">KNOWN_LIMITATIONS.md</code>{' '}
            for full detail.
          </p>
        </section>
      </div>
    </div>
  );
};
