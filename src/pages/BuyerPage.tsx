import { CheckCircle2, Code2, FileCode2, GitBranch, PackageCheck, TrendingUp, Users } from 'lucide-react';

const stackItems = [
  'React',
  'TypeScript',
  'Vite',
  'Tailwind CSS',
  '@xyflow/react',
  'localStorage persistence',
  'modular export utilities',
  'Markdown export',
  'JSON export',
  'PDF/print export',
  'no backend',
  'no accounts',
  'no cloud dependency',
];

export const BuyerPage = () => {
  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 max-w-5xl mx-auto w-full">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 rounded border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-200 mb-5">
          <PackageCheck className="w-4 h-4" />
          Source/IP acquisition
        </div>
        <h1 className="text-4xl font-extrabold mb-4">Acquire Project IP</h1>
        <p className="text-xl text-gray-400 max-w-3xl">
          WeaveStudio is packaged as a local-first workflow product with source code, documentation, templates, and a
          clear extension path for a buyer who wants to rebrand or build on the codebase.
        </p>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <Code2 className="text-blue-400" />
            <span>Technical foundation</span>
          </h2>
          <div className="bg-panel border border-border rounded-lg p-6">
            <p className="text-gray-300 mb-5">
              A buyer inherits a predictable, modular frontend codebase suitable for rebranding, template expansion,
              desktop packaging, or optional provider integrations. The current release remains static and local-first.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stackItems.map((item) => (
                <div key={item} className="flex items-center gap-2 rounded border border-gray-800 bg-[#1e1e24] px-3 py-2 text-sm text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <FileCode2 className="text-blue-400" />
            <span>What a buyer inherits</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              ['Workflow product', 'A visual canvas for mapping repeatable deliverable workflows.'],
              ['Template base', 'Starter workflows for proposals, meetings, incidents, SOPs, specs, research, and feedback.'],
              ['Extension surface', 'Workflow Validator, exports, and AI Assist Blueprint are modular places to extend.'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-lg border border-border bg-panel p-5">
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-400">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <Users className="text-blue-400" />
            <span>Buyer fit</span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'Local-first productivity builders.',
              'Operations consultants with repeatable client deliverables.',
              'Documentation consultants and technical writers.',
              'Template sellers packaging professional methods into software.',
            ].map((item) => (
              <div key={item} className="flex items-start space-x-3 bg-panel border border-border p-4 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <TrendingUp className="text-blue-400" />
            <span>Commercial paths</span>
          </h2>
          <div className="space-y-4">
            <div className="bg-panel border border-border rounded-lg p-6">
              <h3 className="font-bold text-lg mb-2 text-white">1. Desktop app</h3>
              <p className="text-sm text-gray-400">Wrap the static app in Tauri or Electron for a one-time purchase product.</p>
            </div>
            <div className="bg-panel border border-border rounded-lg p-6">
              <h3 className="font-bold text-lg mb-2 text-white">2. Premium templates</h3>
              <p className="text-sm text-gray-400">Sell workflow packs for specific professional processes and deliverable types.</p>
            </div>
            <div className="bg-panel border border-border rounded-lg p-6">
              <h3 className="font-bold text-lg mb-2 text-white">3. Optional integrations</h3>
              <p className="text-sm text-gray-400">Use the AI Assist Blueprint as a BYOK-ready extension point without changing the current local-first release.</p>
            </div>
          </div>
        </section>

        <section className="bg-blue-900/10 border border-blue-900/50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-300" />
            Extension notes
          </h2>
          <p className="text-sm text-gray-400">
            Provider-specific AI calls, cloud sync, accounts, or collaboration would be separate buyer-led extensions.
            This release includes no API keys, no bundled provider calls, and no backend requirement.
          </p>
        </section>
      </div>
    </div>
  );
};
