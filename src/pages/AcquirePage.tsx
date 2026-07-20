import { useRef } from 'react';
import {
  CheckCircle2,
  Code2,
  FileCode2,
  GitBranch,
  PackageCheck,
  TrendingUp,
  Users,
  HelpCircle,
  PlayCircle,
} from 'lucide-react';

const stackItems = [
  'React 19',
  'TypeScript',
  'Vite',
  'Tailwind CSS v4',
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

const buyerSegments = [
  {
    title: 'Operations teams and indie productivity builders',
    body: 'Acquire a functional visual workflow foundation with template reusability and export pipelines already implemented. The modular node system and optional BYOK AI blueprint provide clear extension points without forcing AI or creating external dependencies.',
  },
  {
    title: 'Consultants & operations professionals',
    body: 'Use reusable templates and Workflow Validator validation to deliver more consistent outputs across client engagements while maintaining version history for quality control and knowledge transfer.',
  },
  {
    title: 'Researchers & technical writers',
    body: 'Organize literature notes, interview data, field observations, and draft fragments into evolving structured outputs with visible connections, validation checkpoints, and clean Markdown/PDF exports.',
  },
  {
    title: 'Documentation & knowledge management specialists',
    body: 'Build SOPs, playbooks, and process documentation visually from raw operational inputs. Templates enforce format consistency while exports support integration into wikis, training systems, or client portals.',
  },
  {
    title: 'Source-code & IP buyers',
    body: 'Obtain a complete, self-contained implementation of a node-based visual workflow application, including persistence, templating, validation logic, snapshot system, and multi-format export modules.',
  },
];

const whyAcquire = [
  'Addresses the recurring problem of converting variable, unstructured professional inputs into consistent outputs.',
  'Local-first design differentiates it from cloud-first workflow and automation tools.',
  'Reusable templates, Workflow Validator validation, and versioning create a repeatability engine beyond basic diagramming.',
  'Modular structure and optional BYOK AI blueprint give acquirers clear extension paths.',
  'Accelerates development for productivity, documentation, and operations tooling by providing a working canvas, persistence, validation, and export foundation.',
];

const faqs = [
  {
    q: 'There are already many canvas and workflow tools. Why this one?',
    a: 'Most existing options are either general-purpose diagramming libraries or cloud platforms optimized for task automation and team collaboration. WeaveStudio is focused on transforming messy professional inputs into repeatable, validated deliverables with templates, Workflow Validator validation, snapshots, and local exports.',
  },
  {
    q: "Couldn't I build this with React Flow?",
    a: "Wiring a canvas is the starting point, not the finished product. WeaveStudio includes the surrounding system: template application, workflow validation, snapshot-based iteration, local persistence, and coordinated Markdown, JSON, and PDF export pipelines.",
  },
  {
    q: 'Does the AI feature create reliability or lock-in concerns?',
    a: 'AI Assist is optional and implemented as a BYOK-ready blueprint. The core canvas, templates, Workflow Validator validation, versioning, and exports function without AI or external services.',
  },
];

const WalkthroughPreview = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  return <section aria-label="Recorded workflow walkthrough" className="rounded-xl border border-blue-500/30 bg-[#0d1423] p-5 sm:p-6">
    <div className="grid gap-5 md:grid-cols-[1.1fr_1fr] md:items-center">
      <div><p className="text-xs font-semibold uppercase tracking-wider text-blue-300">Recorded product walkthrough</p><h2 className="mt-2 text-2xl font-bold text-white">See a local-first workflow become a deliverable</h2><p className="mt-3 text-sm leading-relaxed text-gray-300">A concise guided-demo recording shows source material, workflow validation, and export preparation. No account, API key, or live provider call is used in this walkthrough.</p><button type="button" onClick={() => { void videoRef.current?.play(); }} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-blue-400/40 bg-blue-500/15 px-4 py-2.5 text-sm font-semibold text-blue-100 hover:bg-blue-500/25"><PlayCircle className="h-4 w-4" />Play guided demo walkthrough</button></div>
      <video ref={videoRef} controls preload="metadata" poster="/weavestudio-demo-poster.png" className="w-full rounded-lg border border-border bg-black shadow-xl" aria-label="Guided demo walkthrough: source material to validated deliverable"><source src="/weavestudio-guided-demo.webm" type="video/webm" />Your browser cannot play this video. The buyer package includes the recorded walkthrough.</video>
    </div>
  </section>;
};

export const AcquirePage = () => {
  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 rounded border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-200 mb-5">
          <PackageCheck className="w-4 h-4" />
          Source / IP Acquisition
        </div>
        <h1 className="text-4xl font-extrabold mb-4">Acquire Project IP</h1>
        <p className="text-xl text-gray-400 max-w-3xl mb-4">
          WeaveStudio is a polished local-first implementation, dependency-light implementation of a node-based visual workflow system built
          for professional knowledge work.
        </p>
        <p className="text-gray-400 max-w-3xl text-sm leading-relaxed">
          It includes template reusability for consistency, snapshot versioning for iterative refinement, validation
          logic for process integrity, and coordinated export pipelines. Designed for fully local execution, it provides
          a functional core for teams seeking to offer privacy-respecting workflow capabilities, with clear extension
          points and an optional BYOK AI integration pattern. Complete source and documentation are available for
          acquisition and customization.
        </p>
        <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 max-w-3xl">
          <h2 className="font-semibold text-emerald-100">Request the acquisition brief</h2>
          <p className="mt-2 text-sm leading-relaxed text-emerald-50/80">Request source/IP inventory, the verified buyer package, and transfer checklist. Pricing is discussed privately after scope and handover needs are understood.</p>
          <a href="mailto:acquisition@weavestudio.invalid?subject=WeaveStudio%20acquisition%20inquiry" aria-label="Email acquisition@weavestudio.invalid for acquisition inquiries" className="mt-4 inline-flex rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500">Email acquisition inquiries</a>
        </div>
      </div>

      <div className="space-y-12">
        {/* One-sentence value prop */}
        <section className="bg-blue-900/10 border border-blue-800/40 rounded-lg p-6">
          <p className="text-blue-100 text-base leading-relaxed">
            WeaveStudio enables professionals to turn variable real-world inputs into structured, traceable deliverables
            by combining visual workflow design with template reusability, iterative snapshot versioning, and built-in
            validation checkpoints.
          </p>
        </section>

        <WalkthroughPreview />

        {/* Why acquire */}
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <TrendingUp className="text-blue-400" />
            <span>Why acquire this?</span>
          </h2>
          <div className="space-y-3">
            {whyAcquire.map((point) => (
              <div key={point} className="flex items-start gap-3 bg-panel border border-border rounded-lg p-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-300">{point}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Buyer segments */}
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <Users className="text-blue-400" />
            <span>Who this is for</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {buyerSegments.map((seg) => (
              <div key={seg.title} className="rounded-lg border border-border bg-panel p-5">
                <h3 className="font-bold text-white mb-2">{seg.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{seg.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Technical foundation */}
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <Code2 className="text-blue-400" />
            <span>Technical foundation</span>
          </h2>
          <div className="bg-panel border border-border rounded-lg p-6">
            <p className="text-gray-300 mb-5">
              A buyer inherits a predictable, modular frontend codebase suitable for rebranding, template expansion,
              desktop packaging, or optional provider integrations. The current release is static and local-first — no
              backend, authentication, or external API required.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stackItems.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded border border-gray-800 bg-[#1e1e24] px-3 py-2 text-sm text-gray-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What a buyer inherits */}
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <FileCode2 className="text-blue-400" />
            <span>What a buyer inherits</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              ['Visual workflow canvas', 'A node-based canvas for mapping repeatable deliverable workflows with drag-and-drop editing.'],
              ['Template & snapshot system', 'Starter workflows, autosave, and named version snapshots with restore and delete actions.'],
              ['Validation & export modules', 'Workflow Validator validation, Markdown, JSON, and PDF/print export pipelines.'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-lg border border-border bg-panel p-5">
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-400">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Commercial paths */}
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <TrendingUp className="text-blue-400" />
            <span>Commercial paths</span>
          </h2>
          <div className="space-y-4">
            {[
              ['1. Desktop app', 'Wrap the static app in Tauri or Electron for a one-time purchase product with local filesystem access.'],
              ['2. Premium templates', 'Sell workflow packs for specific professional processes and deliverable types.'],
              ['3. Optional AI integrations', 'Use the AI Assist Blueprint as a BYOK-ready extension point without changing the local-first core.'],
              ['4. Source licensing', 'License the implementation as a foundation for adjacent local-first or operations workflow products.'],
            ].map(([title, body]) => (
              <div key={title} className="bg-panel border border-border rounded-lg p-5">
                <h3 className="font-bold text-lg mb-1 text-white">{title}</h3>
                <p className="text-sm text-gray-400">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <HelpCircle className="text-blue-400" />
            <span>Acquirer FAQ</span>
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-panel border border-border rounded-lg p-5">
                <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Extension notes */}
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
