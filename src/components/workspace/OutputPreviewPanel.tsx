import { useState } from 'react';
import type { AppEdge, AppNode } from '../../types';
import {
  exportJsonFile,
  exportMarkdownFile,
  exportPdfFile,
  generateMarkdown,
  slugifyFilename,
} from '../../lib/exporter';
import { FileText, FileJson, FileDown, X, Code2, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface OutputPreviewPanelProps {
  nodes: AppNode[];
  edges: AppEdge[];
  onClose: () => void;
}

export const OutputPreviewPanel = ({ nodes, edges, onClose }: OutputPreviewPanelProps) => {
  const [title, setTitle] = useState('Workflow Output');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');
  
  const markdown = generateMarkdown(nodes, edges, title);
  const hasNodes = nodes.length > 0;

  const handleExportMd = () => exportMarkdownFile(markdown, slugifyFilename(title, 'md'));
  const handleExportJson = () => exportJsonFile(nodes, edges, title);
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportPdfFile(markdown, title);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-8 backdrop-blur-sm">
      <div className="bg-panel border border-border rounded-lg shadow-2xl w-full max-w-6xl h-full max-h-[840px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1e1e24] border-b border-gray-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">Output Preview</h2>
            <p className="text-xs text-gray-400">Generated deterministically from your workflow nodes.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
              <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'preview' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Eye className="w-4 h-4" />
                Rendered
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'raw' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Code2 className="w-4 h-4" />
                Markdown
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded hover:bg-gray-800 transition-colors ml-4"
              aria-label="Close output preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* Left: Preview */}
          <div className="flex-1 md:border-r border-gray-800 p-6 overflow-y-auto bg-canvas flex flex-col min-h-0">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent border-b border-gray-700 pb-2 mb-6 text-3xl font-bold text-white focus:outline-none focus:border-blue-500 shrink-0"
              placeholder="Report Title"
              aria-label="Output title"
            />
            
            {!hasNodes && (
              <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100 shrink-0">
                This preview is using an empty workflow state. Add or load nodes to generate a more useful export.
              </div>
            )}
            
            <div className="flex-1 min-h-0 bg-panel border border-gray-800 rounded-lg overflow-hidden">
              <div className="h-full overflow-y-auto p-8 bg-white text-gray-900">
                {viewMode === 'preview' ? (
                  <div className="prose prose-slate max-w-none">
                    <ReactMarkdown>{markdown}</ReactMarkdown>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed bg-gray-50 p-6 rounded-md border border-gray-200">
                    {markdown}
                  </pre>
                )}
              </div>
            </div>
          </div>

          {/* Right: Export Actions */}
          <div className="w-full md:w-72 p-6 bg-[#1e1e24] flex flex-col space-y-4 shrink-0 overflow-y-auto">
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 mb-2">Export As</h3>
            
            <button type="button" onClick={handleExportMd} className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 p-4 rounded-lg flex items-center space-x-4 transition-colors text-left group">
              <div className="bg-blue-500/20 p-2 rounded-md group-hover:bg-blue-500/30 transition-colors">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold text-sm text-blue-300">Markdown</div>
                <div className="text-xs opacity-70">Standard text file</div>
              </div>
            </button>
            
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="w-full bg-purple-600/10 hover:bg-purple-600/20 disabled:opacity-60 text-purple-400 border border-purple-500/30 p-4 rounded-lg flex items-center space-x-4 transition-colors text-left group"
            >
              <div className="bg-purple-500/20 p-2 rounded-md group-hover:bg-purple-500/30 transition-colors">
                <FileDown className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold text-sm text-purple-300">{isExportingPdf ? 'Preparing PDF' : 'PDF Report'}</div>
                <div className="text-xs opacity-70">Print-ready file</div>
              </div>
            </button>

            <button type="button" onClick={handleExportJson} className="w-full bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 border border-amber-500/30 p-4 rounded-lg flex items-center space-x-4 transition-colors text-left group">
              <div className="bg-amber-500/20 p-2 rounded-md group-hover:bg-amber-500/30 transition-colors">
                <FileJson className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold text-sm text-amber-300">JSON Snapshot</div>
                <div className="text-xs opacity-70">Workflow backup</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
