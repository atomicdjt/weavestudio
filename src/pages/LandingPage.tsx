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
