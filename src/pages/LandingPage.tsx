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
} from 'lucide-react';

const previewNodes = [
  { label: 'Input', color: 'border-emerald-500/50 text-emerald-200', x: 'left-[6%]', y: 'top-[22%]' },
  { label: 'Transform', color: 'border-blue-500/50 text-blue-200', x: 'left-[30%]', y: 'top-[44%]' },
  { label: 'Review', color: 'border-purple-500/50 text-purple-200', x: 'left-[54%]', y: 'top-[24%]' },
  { label: 'Output', color: 'border-rose-500/50 text-rose-200', x: 'left-[76%]', y: 'top-[46%]' },
];

const previewBadges = ['Local-first', 'Versioned', 'Exportable', 'Human-reviewed'];

const features = [
  {
    icon: <Workflow className="w-8 h-8 text-blue-400" />,
    title: 'Visual Workflow Templates',
    body: 'Map messy inputs into structured workflows using reusable templates built for client notes, logs, transcripts, research, and documentation.',
  },
  {
    icon: <CheckSquare className="w-8 h-8 text-emerald-400" />,
    title: 'Process Check Validation',
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
    icon: <Cpu className="w-8 h-8 text-rose-400" />,
    title: 'BYOK-Ready AI Blueprint',
    body: 'Optional AI Assist node pattern gives a clear extension path without making AI required for the core product.',
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
          Weave messy work into <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
            repeatable professional deliverables.
          </span>
        </h1>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-10">
          WeaveStudio is a local-first visual workflow canvas for turning notes, transcripts, logs, research fragments,
          and client inputs into structured, versioned, exportable outputs — without accounts, cloud lock-in, or data
          leaving your device.
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

        <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-6 items-stretch">
          {/* Canvas Preview */}
          <div className="relative min-h-[360px] overflow-hidden rounded-lg border border-border bg-[#0b0b10] p-5 shadow-2xl">
            <div
              className="absolute inset-0 opacity-30"
              style={{ backgroundImage: 'radial-gradient(#27272a 1px, transparent 1px)', backgroundSize: '22px 22px' }}
            />
            <div className="relative flex flex-wrap gap-2 mb-5">
              {previewBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-200"
                >
                  {badge}
                </span>
              ))}
            </div>
            {/* Edge line */}
            <div className="absolute left-[14%] top-[37%] h-px w-[68%] bg-gradient-to-r from-emerald-400/70 via-blue-400/70 to-rose-400/70" />
            {previewNodes.map((node) => (
              <div
                key={node.label}
                className={`absolute ${node.x} ${node.y} w-36 rounded-lg border bg-panel/95 p-3 shadow-xl ${node.color}`}
              >
                <div className="text-[11px] uppercase tracking-wider text-gray-500">Node</div>
                <div className="font-semibold text-sm text-white">{node.label}</div>
                <div className="mt-2 h-1.5 rounded bg-white/10" />
                <div className="mt-1.5 h-1.5 w-2/3 rounded bg-white/10" />
              </div>
            ))}
            <div className="absolute bottom-5 left-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              Version snapshot saved
            </div>
          </div>

          {/* Output Preview */}
          <div className="rounded-lg border border-border bg-panel p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-gray-500">Output Preview</div>
                <h3 className="font-bold text-white">Proposal Brief</h3>
              </div>
              <ClipboardCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Executive summary</div>
                <p className="text-gray-300">A lightweight workflow converts scattered discovery notes into a reviewed client brief.</p>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Review checkpoint</div>
                <p className="text-gray-300">Assumptions, constraints, and next-step recommendations remain human-reviewed before export.</p>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                {['MD', 'JSON', 'PDF'].map((format) => (
                  <div key={format} className="rounded border border-gray-800 bg-[#1e1e24] py-2 text-center text-xs font-semibold text-gray-300">
                    {format}
                  </div>
                ))}
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
