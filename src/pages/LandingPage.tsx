import { Link } from 'react-router-dom';
import {
  ClipboardCheck,
  FileDown,
  Lock,
  RotateCcw,
  ShieldCheck,
  Workflow,
  Cpu,
  CheckSquare,
  Play,
} from 'lucide-react';

const features = [
  {
    icon: <Workflow className="w-8 h-8 text-blue-400" />,
    title: 'Visual Workflow Templates',
    body: 'Map messy inputs into structured workflows using reusable templates built for client notes, logs, transcripts, research, and documentation.',
  },
  {
    icon: <CheckSquare className="w-8 h-8 text-emerald-400" />,
    title: 'Workflow Validator',
    body: 'Identify missing inputs, unconnected nodes, incomplete review steps, and export-readiness issues before producing a final deliverable.',
  },
  {
    icon: <RotateCcw className="w-8 h-8 text-amber-400" />,
    title: 'Versioned Snapshots',
    body: 'Preserve iterations as the work evolves, making it easier to compare, restore, and audit how a deliverable changed.',
  },
  {
    icon: <Lock className="w-8 h-8 text-emerald-400" />,
    title: 'Local-First Ownership',
    body: 'Work without accounts, backend storage, or cloud dependency. Keep process data and drafts on your device.',
  },
  {
    icon: <FileDown className="w-8 h-8 text-purple-400" />,
    title: 'Multi-Format Exports',
    body: 'Export structured outputs to Markdown, JSON, and PDF/print-ready reports for client delivery, documentation, or further editing.',
  },
  {
    icon: <Cpu className="w-8 h-8 text-cyan-400" />,
    title: 'Optional BYOK AI Assist',
    body: 'Optional AI Assist node gives a clear extension path to run local models (Ollama) or external providers without making AI required for the core product.',
  },
];

export const LandingPage = () => {
  return (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-14 text-center">
        <div className="inline-flex items-center space-x-2 bg-blue-900/30 text-blue-300 px-3 py-1 rounded-full text-sm font-medium mb-8 border border-blue-800/50">
          <ShieldCheck className="w-4 h-4" />
          <span>No accounts. No cloud. Visual workflow templates with validation and multi-format exports.</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
          Weave messy research into <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
            structured deliverables.
          </span>
        </h1>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-10">
          WeaveStudio is a local-first visual workflow canvas for turning notes, transcripts, logs, research fragments,
          and client inputs into structured, versioned, exportable outputs — without accounts, cloud lock-in, or data
          leaving the user’s device.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/app"
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center space-x-2 shadow-lg shadow-blue-600/20"
          >
            <Workflow className="w-5 h-5" />
            <span>Open Canvas</span>
          </Link>
          <Link
            to="/templates"
            className="bg-panel border border-border hover:bg-gray-800 text-gray-300 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
          >
            Browse Templates
          </Link>
        </div>
      </section>

      {/* Visual Proof */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">See the process, not just the output.</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Map how messy inputs become structured deliverables before you export them.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-[#0b0b10] shadow-2xl overflow-hidden flex flex-col">
          {/* Mock Toolbar */}
          <div className="bg-[#18181b] border-b border-border p-3 flex items-center justify-between">
            <div className="flex gap-2">
              {['Local-first', 'Versioned', 'Human-reviewed'].map(badge => (
                <span key={badge} className="rounded border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-[10px] uppercase font-semibold text-blue-200">{badge}</span>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" />
                Workflow Validator: 100% Ready
              </div>
            </div>
          </div>
          
          <div className="flex">
            {/* Mock Canvas Area */}
            <div className="flex-1 p-8 relative min-h-[400px]" style={{ backgroundImage: 'radial-gradient(#27272a 1px, transparent 1px)', backgroundSize: '22px 22px' }}>
              {/* Edges */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                <path d="M 230 115 C 250 115, 250 115, 270 115" stroke="#3b82f6" strokeWidth="2" fill="none" />
                <path d="M 480 115 C 500 115, 500 115, 520 115" stroke="#3b82f6" strokeWidth="2" fill="none" />
              </svg>

              {/* Nodes */}
              <div className="absolute top-[60px] left-[20px] w-[210px] rounded-lg border border-emerald-500/30 bg-panel shadow-lg p-3 z-10">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">Input</div>
                <div className="text-sm font-semibold text-white mb-2 truncate">Discovery Notes</div>
                <div className="text-xs text-gray-400 font-mono line-clamp-2">Client needs a new SOP...</div>
              </div>

              <div className="absolute top-[60px] left-[270px] w-[210px] rounded-lg border border-blue-500/30 bg-panel shadow-lg p-3 z-10">
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">Transform</div>
                <div className="text-sm font-semibold text-white mb-2 truncate">Extract Steps</div>
                <div className="text-xs text-gray-400 font-mono line-clamp-2">- Step 1: Login...</div>
              </div>

              <div className="absolute top-[60px] left-[520px] w-[210px] rounded-lg border border-purple-500/30 bg-panel shadow-lg p-3 z-10 ring-2 ring-blue-500">
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1">Review</div>
                <div className="text-sm font-semibold text-white mb-2 truncate">Human Verification</div>
                <div className="text-xs text-gray-400 font-mono line-clamp-2">Verify step sequence.</div>
              </div>
            </div>

            {/* Mock Inspector */}
            <div className="w-[300px] bg-panel border-l border-border p-4 hidden md:block">
              <h3 className="text-xs font-bold uppercase text-gray-500 mb-4">Node Inspector</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500">Type</label>
                  <div className="text-sm text-gray-300">Review</div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500">Title</label>
                  <div className="bg-[#1e1e24] border border-gray-800 p-2 rounded text-sm text-white">Human Verification</div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500">Content</label>
                  <div className="bg-[#1e1e24] border border-gray-800 p-2 rounded text-xs font-mono text-gray-300 h-24">Verify step sequence.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supporting tagline strip */}
      <section className="bg-panel border-y border-border py-5">
        <p className="text-center text-sm text-gray-400 tracking-wide">
          From fragments and transcripts to structured deliverables: visual, private, and repeatable.
        </p>
      </section>

      {/* Before / After */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-8 items-center bg-panel border border-border rounded-lg p-8 shadow-2xl">
          <div>
            <h3 className="text-gray-400 font-semibold mb-4 text-sm uppercase tracking-wider">Before: The Mess</h3>
            <div className="bg-[#1e1e24] p-6 rounded-lg font-mono text-sm text-gray-300 border border-gray-800 h-64 overflow-y-auto">
              <p className="opacity-70">
                "Client runs a small home services company. They are missing follow-ups from website leads. Office
                manager tracks jobs in spreadsheets. Owner wants better intake, quote follow-up, and SOPs."
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-blue-400 font-semibold mb-4 text-sm uppercase tracking-wider">After: Structured Output</h3>
            <div className="bg-canvas p-6 rounded-lg border border-border h-64 overflow-y-auto">
              <h2 className="text-xl font-bold mb-4 text-white">Proposal Brief</h2>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-400">Executive Summary</h4>
                  <p className="text-sm text-gray-200">Implement a lightweight intake and follow-up workflow to reduce missed leads.</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-400">Action Plan</h4>
                  <ul className="list-disc list-inside text-sm text-gray-200">
                    <li>Document intake steps</li>
                    <li>Add quote follow-up checklist</li>
                    <li>Review handoff before export</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">A repeatability engine for professional work.</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm">
            WeaveStudio enables professionals to turn variable real-world inputs into structured, traceable deliverables by combining visual workflow design with template reusability, iterative snapshot versioning, and built-in validation checkpoints.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-panel p-8 rounded-lg border border-border hover:border-blue-800/60 transition-colors">
              <div className="mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold mb-2 text-white">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
