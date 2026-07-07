import { useNavigate } from 'react-router-dom';
import { TEMPLATES } from '../data/templates';
import { FileText, Play } from 'lucide-react';

export const TemplatesGallery = () => {
  const navigate = useNavigate();

  const handleLoad = (id: string) => {
    navigate('/app', { state: { loadTemplate: id } });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Template Gallery</h1>
        <p className="text-gray-400">Load a structured workflow starter, then tailor the nodes and review checkpoints.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEMPLATES.map((template) => (
          <div key={template.id} className="bg-panel border border-border rounded-xl p-6 flex flex-col transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-900/10">
            <div className="flex-1">
              <h2 className="text-lg font-bold mb-2 text-white">{template.title}</h2>
              <p className="text-sm text-gray-400 mb-4">{template.description}</p>
              
              <div className="space-y-3 mb-6">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Ideal For</span>
                  <p className="text-sm text-gray-300">{template.idealUser}</p>
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
              onClick={() => handleLoad(template.id)}
              className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Load Template</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
