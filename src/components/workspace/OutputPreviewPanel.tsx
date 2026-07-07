import { useState } from 'react';
import type { AppEdge, AppNode } from '../../types';
import {
  exportJsonFile,
  exportMarkdownFile,
  exportPdfFile,
  generateMarkdown,
  slugifyFilename,
} from '../../lib/exporter';
import { FileText, FileJson, FileDown, X } from 'lucide-react';

interface OutputPreviewPanelProps {
  nodes: AppNode[];
  edges: AppEdge[];
  onClose: () => void;
}

export const OutputPreviewPanel = ({ nodes, edges, onClose }: OutputPreviewPanelProps) => {
  const [title, setTitle] = useState('Workflow Output');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
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
      <div className="bg-panel border border-border rounded-lg shadow-2xl w-full max-w-5xl h-full max-h-[840px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1e1e24] border-b border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-white">Output Preview</h2>
            <p className="text-xs text-gray-400">Generated deterministically from your workflow nodes.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded hover:bg-gray-800 transition-colors"
            aria-label="Close output preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Preview Text */}
          <div className="flex-1 md:border-r border-gray-800 p-6 overflow-y-auto bg-canvas">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent border-b border-gray-700 pb-2 mb-4 text-2xl font-bold text-white focus:outline-none focus:border-blue-500"
              placeholder="Report Title"
              aria-label="Output title"
            />
            {!hasNodes && (
              <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                This preview is using an empty workflow state. Add or load nodes to generate a more useful export.
              </div>
            )}
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300 leading-relaxed">
              {markdown}
            </pre>
          </div>

          {/* Right: Export Actions */}
          <div className="w-full md:w-64 p-6 bg-[#1e1e24] flex flex-col space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 mb-2">Export As</h3>
            
            <button type="button" onClick={handleExportMd} className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 p-3 rounded-lg flex items-center space-x-3 transition-colors text-left">
              <FileText className="w-5 h-5 shrink-0" />
              <div>
                <div className="font-semibold text-sm">Markdown</div>
                <div className="text-xs opacity-70">Standard text file</div>
              </div>
            </button>
            
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="w-full bg-purple-600/10 hover:bg-purple-600/20 disabled:opacity-60 text-purple-400 border border-purple-500/30 p-3 rounded-lg flex items-center space-x-3 transition-colors text-left"
            >
              <FileDown className="w-5 h-5 shrink-0" />
              <div>
                <div className="font-semibold text-sm">{isExportingPdf ? 'Preparing PDF' : 'PDF Report'}</div>
                <div className="text-xs opacity-70">Print-ready file</div>
              </div>
            </button>

            <button type="button" onClick={handleExportJson} className="w-full bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 border border-amber-500/30 p-3 rounded-lg flex items-center space-x-3 transition-colors text-left">
              <FileJson className="w-5 h-5 shrink-0" />
              <div>
                <div className="font-semibold text-sm">JSON Snapshot</div>
                <div className="text-xs opacity-70">Workflow backup</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
