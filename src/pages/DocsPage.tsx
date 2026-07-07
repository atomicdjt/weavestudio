export const DocsPage = () => {
  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 max-w-4xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-8">Usage Guide</h1>

      <div className="space-y-8 text-gray-300">
        <section className="bg-panel border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">What problem does this solve?</h2>
          <p className="text-sm leading-relaxed">
            Professionals often handle disorganized meeting notes, scattered chat logs, customer feedback, raw SOP
            notes, and project requirements. WeaveStudio provides a visual canvas to organize those inputs, map
            transformation steps, insert human review checkpoints, run a deterministic Process Check, and generate
            structured exports from reviewed workflow content.
          </p>
        </section>

        <section className="bg-panel border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">How to use the canvas</h2>
          <ul className="list-decimal list-inside space-y-3 text-sm">
            <li>
              <strong>Add nodes:</strong> Drag nodes from the left palette, or use each node's add button.
            </li>
            <li>
              <strong>Connect nodes:</strong> Drag from a source handle to a target handle to define process flow.
            </li>
            <li>
              <strong>Edit content:</strong> Select a node and use the inspector to edit title, description, content,
              review settings, and AI Assist Blueprint fields when applicable.
            </li>
            <li>
              <strong>Review checkpoints:</strong> Review nodes document what a human must verify before export.
            </li>
            <li>
              <strong>AI Assist Blueprint:</strong> This optional node documents a future BYOK adapter path. It does
              not make live API calls or store API keys.
            </li>
            <li>
              <strong>Reset or clear:</strong> Reset Demo reloads the sample workflow. Clear Canvas removes the current
              canvas. Clear Local Data removes the current canvas and saved snapshots from this browser.
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
          <p className="text-sm leading-relaxed">
            Process Check validates the current graph for missing inputs, missing outputs, unconnected nodes, empty
            content, decision nodes without outgoing paths, outputs without upstream inputs, missing review checkpoints,
            AI Assist Blueprint gaps, and export readiness. Generate Output creates a deterministic preview from the
            current workflow nodes and includes source nodes, edges, review checkpoints, generated output, and metadata
            in exports.
          </p>
        </section>

        <section className="bg-panel border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Important limitations</h2>
          <p className="text-sm leading-relaxed">
            WeaveStudio is assistive software. It does not verify facts, provide legal, medical, financial, or
            compliance advice, or guarantee correctness. Review exported deliverables before sharing them.
          </p>
        </section>
      </div>
    </div>
  );
};
