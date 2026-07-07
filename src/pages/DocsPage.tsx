export const DocsPage = () => {
  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 max-w-4xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-2">Usage Guide</h1>
      <p className="text-gray-400 text-sm mb-8 max-w-2xl">
        WeaveStudio is a local-first visual workflow canvas for turning notes, transcripts, logs, research fragments,
        and process inputs into repeatable professional deliverables.
      </p>

      <div className="space-y-8 text-gray-300">
        <section className="bg-panel border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">What problem does this solve?</h2>
          <p className="text-sm leading-relaxed">
            Professionals often handle disorganized meeting notes, scattered chat logs, customer feedback, raw SOP
            notes, incident logs, and project requirements. WeaveStudio provides a visual canvas to organize those inputs,
            map transformation steps, insert human review checkpoints, run a deterministic Process Check for
            export-readiness, and generate structured exports from reviewed workflow content.
          </p>
        </section>

        <section className="bg-panel border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">How to use the canvas</h2>
          <ul className="list-decimal list-inside space-y-3 text-sm">
            <li>
              <strong>Add nodes:</strong> Drag nodes from the left palette onto the canvas.
            </li>
            <li>
              <strong>Connect nodes:</strong> Drag from a source handle to a target handle to define process flow.
            </li>
            <li>
              <strong>Edit content:</strong> Select a node and use the inspector to edit title, description, content,
              and review settings.
            </li>
            <li>
              <strong>Review checkpoints:</strong> Review nodes document what a human must verify before export.
            </li>
            <li>
              <strong>AI Assist Blueprint:</strong> This optional node documents a future BYOK adapter path. It does
              not make live API calls or store API keys.
            </li>
            <li>
              <strong>Clear or reset:</strong> Clear Canvas removes the current canvas. Version snapshots let you
              restore earlier states.
            </li>
          </ul>
        </section>

        <section className="bg-panel border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Versions and snapshots</h2>
          <p className="text-sm leading-relaxed mb-4">
            The workspace autosaves to browser localStorage after canvas changes. Save named snapshots before major
            edits when you want restore points that persist locally.
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Save Snapshot captures the current nodes and edges.</li>
            <li>Restore reloads a saved snapshot onto the canvas.</li>
            <li>Delete removes a snapshot from this browser's localStorage.</li>
          </ul>
        </section>

        <section className="bg-panel border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Process Check and output</h2>
          <p className="text-sm leading-relaxed mb-3">
            Process Check validates the current workflow graph for structural and export-readiness issues, including:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm mb-3">
            <li>Missing input or output nodes</li>
            <li>Unconnected nodes</li>
            <li>Empty node content</li>
            <li>Decision nodes without outgoing paths</li>
            <li>Output nodes without upstream inputs</li>
            <li>Missing review checkpoints</li>
            <li>AI Assist Blueprint gaps</li>
          </ul>
          <p className="text-sm leading-relaxed">
            Generate Output creates a deterministic preview from the current workflow nodes and includes source nodes,
            edges, review checkpoints, generated output, and metadata in exports. Process Check does not verify facts or
            guarantee the correctness of source content.
          </p>
        </section>

        <section className="bg-panel border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Important scope and limitations</h2>
          <p className="text-sm leading-relaxed">
            WeaveStudio is assistive software. It structures and organizes user-provided content but does not verify
            facts, provide legal, medical, financial, or compliance guidance, or guarantee correctness. Review
            exported deliverables before sharing or acting on them. See{' '}
            <span className="text-blue-400">KNOWN_LIMITATIONS.md</span> for full detail.
          </p>
        </section>
      </div>
    </div>
  );
};
