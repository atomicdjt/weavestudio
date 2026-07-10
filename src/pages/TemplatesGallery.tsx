import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLegacyTemplates, getPrimaryTemplates } from '../data/templates';
import { ChevronDown, ChevronRight, FileText, Play } from 'lucide-react';
import type { WorkflowTemplate } from '../types';

const TemplateCard = ({ template, onLoad }: { template: WorkflowTemplate; onLoad: (id: string) => void }) => (
  <div className="bg-panel border border-border rounded-xl p-6 flex flex-col transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-900/10">
    <div className="flex-1">
      <h2 className="text-lg font-bold mb-2 text-white">{template.title}</h2>
      <p className="text-sm text-gray-400 mb-4">{template.description}</p>
      <div className="space-y-3 mb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Ideal for</span>
          <p className="text-sm text-gray-300">{template.idealUser}</p>
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">You paste</span>
          <p className="text-sm text-gray-400 line-clamp-2">{template.inputInstructions}</p>
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Output</span>
          <div className="flex items-center space-x-1 text-sm text-blue-400 mt-1">
            <FileText className="w-4 h-4" />
            <span>{template.expectedOutputType}</span>
          </div>
        </div>
      </div>
    </div>
    <button
      type="button"
      onClick={() => onLoad(template.id)}
      className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-2"
    >
      <Play className="w-4 h-4" />
      <span>Start workflow</span>
    </button>
  </div>
);

export const TemplatesGallery = () => {
  const navigate = useNavigate();
  const [showLegacy, setShowLegacy] = useState(false);
  const primary = getPrimaryTemplates();
  const legacy = getLegacyTemplates();

  const handleLoad = (id: string) => {
    navigate('/app', { state: { loadTemplate: id } });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Workflow templates</h1>
        <p className="text-gray-400 max-w-2xl">
          Choose a professional workflow, paste unstructured source material, structure it on the canvas, then generate
          a deliverable. Five primary templates cover the golden path; additional starters are in the legacy pack.
        </p>
      </div>

      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Primary workflows</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {primary.map((template) => (
          <TemplateCard key={template.id} template={template} onLoad={handleLoad} />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowLegacy((v) => !v)}
        className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-200 mb-4"
      >
        {showLegacy ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        More templates ({legacy.length})
      </button>

      {showLegacy && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {legacy.map((template) => (
            <TemplateCard key={template.id} template={template} onLoad={handleLoad} />
          ))}
        </div>
      )}
    </div>
  );
};
