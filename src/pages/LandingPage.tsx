import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  FileDown,
  Lock,
  RotateCcw,
  ShieldCheck,
  Workflow,
  Layers,
  Play,
  FilePlus,
} from 'lucide-react';
import { createId } from '../lib/ids';

const features = [
  {
    icon: <Layers className="w-8 h-8 text-blue-400" />,
    title: 'Professional templates',
    body: 'Start from Research Brief, Meeting-to-Action, Product Spec, Client Proposal, or Evidence-Based Report — each with stages and output structure.',
  },
  {
    icon: <Workflow className="w-8 h-8 text-emerald-400" />,
    title: 'Source → nodes → canvas',
    body: 'Paste messy notes or transcripts, split them into editable nodes, connect the workflow, and classify content for the deliverable.',
  },
  {
    icon: <ClipboardCheck className="w-8 h-8 text-amber-400" />,
    title: 'Validate before export',
    body: 'Structural checks for missing inputs, empty content, review gaps, and export readiness — without claiming fact correctness.',
  },
  {
    icon: <Lock className="w-8 h-8 text-emerald-400" />,
    title: 'Local-first by default',
    body: 'Workspaces autosave in this browser. No account, no backend. Optional AI live calls require explicit consent.',
  },
  {
    icon: <FileDown className="w-8 h-8 text-purple-400" />,
    title: 'Preview and export',
    body: 'Compose a template-structured deliverable, edit it, then export Markdown, PDF, or re-importable project JSON.',
  },
  {
    icon: <RotateCcw className="w-8 h-8 text-cyan-400" />,
    title: 'Named workspaces',
    body: 'Create, rename, duplicate, and restore version snapshots so you can reopen work without losing graph structure.',
  },
];

export const LandingPage = () => {
  const navigate = useNavigate();

  const openGuidedDemo = () => {
    navigate('/app', {
      state: { openGuidedDemo: true, intentId: createId('intent') },
    });
  };

  const openBlank = () => {
    navigate('/app', {
      state: { blankWorkspace: true, intentId: createId('intent') },
    });
  };

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center space-x-2 bg-blue-900/30 text-blue-300 px-3 py-1 rounded-full text-sm font-medium mb-8 border border-blue-800/50">
          <ShieldCheck className="w-4 h-4" />
          <span>Local-first · Template workflows · Human-reviewed exports</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
          Turn fragmented information into a{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
            structured, reusable deliverable workflow.
          </span>
        </h1>
        <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed mb-10">
          WeaveStudio is a visual canvas for professionals who need to move from messy notes, transcripts, logs, and
          research fragments to a clear document — without accounts or a required cloud API.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => navigate('/templates')}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3.5 rounded-lg font-semibold text-base transition-colors flex items-center space-x-2 shadow-lg shadow-blue-600/20"
          >
            <Layers className="w-5 h-5" />
            <span>Start with a template</span>
          </button>
          <button
            type="button"
            onClick={openGuidedDemo}
            data-testid="open-guided-demo"
            className="bg-emerald-700 hover:bg-emerald-600 text-white px-6 py-3.5 rounded-lg font-semibold text-base transition-colors flex items-center space-x-2"
          >
            <Play className="w-5 h-5" />
            <span>Open guided demo</span>
          </button>
          <button
            type="button"
            onClick={openBlank}
            className="bg-panel border border-border hover:bg-gray-800 text-gray-300 px-6 py-3.5 rounded-lg font-semibold text-base transition-colors flex items-center space-x-2"
          >
            <FilePlus className="w-5 h-5" />
            <span>Blank workspace</span>
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Golden path: template → paste source → structure nodes → validate → generate → export → reopen.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-10" aria-labelledby="workflow-demo-title">
        <div className="mb-6 text-center">
          <h2 id="workflow-demo-title" className="text-2xl font-bold text-white">See the workflow take shape</h2>
          <p className="mt-2 text-sm text-gray-400">A visual path from rough source material to a human-reviewed deliverable.</p>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-[#0b0b10] shadow-2xl">
          <div className="flex items-center justify-between border-b border-border bg-panel px-4 py-3">
            <div className="flex gap-2 text-[10px] font-semibold uppercase tracking-wide text-blue-200"><span className="rounded border border-blue-500/30 bg-blue-500/10 px-2 py-1">Local-first</span><span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-200">Human-reviewed</span></div>
            <span className="hidden sm:block text-xs text-emerald-300">Ready to validate</span>
          </div>
          <div className="relative min-h-[300px] overflow-hidden p-6 sm:p-10" style={{ backgroundImage: 'radial-gradient(#27272a 1px, transparent 1px)', backgroundSize: '22px 22px' }}>
            <svg className="absolute inset-0 hidden w-full h-full md:block" aria-hidden="true"><path d="M 24% 50% C 31% 50%, 32% 50%, 39% 50%" stroke="#3b82f6" strokeWidth="2" fill="none"/><path d="M 57% 50% C 64% 50%, 65% 50%, 72% 50%" stroke="#3b82f6" strokeWidth="2" fill="none"/></svg>
            <div className="relative z-10 grid gap-4 md:grid-cols-3 md:gap-14">
              <div className="rounded-lg border border-emerald-500/30 bg-panel p-4 shadow-lg"><span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Input</span><h3 className="mt-2 font-semibold text-white">Discovery notes</h3><p className="mt-2 rounded bg-[#1e1e24] p-2 font-mono text-xs text-gray-400">Leads drop after first contact. Quotes live in spreadsheets.</p></div>
              <div className="rounded-lg border border-blue-500/30 bg-panel p-4 shadow-lg"><span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Transform</span><h3 className="mt-2 font-semibold text-white">Extract the plan</h3><p className="mt-2 rounded bg-[#1e1e24] p-2 font-mono text-xs text-gray-400">• standardize intake<br />• add quote follow-up<br />• document handoff</p></div>
              <div className="rounded-lg border border-purple-500/40 bg-panel p-4 shadow-lg ring-1 ring-purple-500/30"><span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Review</span><h3 className="mt-2 font-semibold text-white">Proposal brief</h3><p className="mt-2 text-xs text-gray-400">Confirm the recommendation, then generate and export the final deliverable.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid sm:grid-cols-3 gap-4 text-left">
          {[
            { step: '1', title: 'Choose a template', body: 'Pick the deliverable shape you need.' },
            { step: '2', title: 'Paste & structure', body: 'Drop fragments in, split into editable nodes.' },
            { step: '3', title: 'Generate & export', body: 'Preview a professional doc, then save locally.' },
          ].map((item) => (
            <div key={item.step} className="bg-panel border border-border rounded-lg p-5">
              <div className="text-blue-400 font-bold text-sm mb-2">Step {item.step}</div>
              <h3 className="font-semibold text-white mb-1">{item.title}</h3>
              <p className="text-sm text-gray-400">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-panel p-8 rounded-lg border border-border hover:border-blue-800/60 transition-colors"
            >
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
