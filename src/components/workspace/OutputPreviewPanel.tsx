import { useMemo, useState } from 'react';
import type { WorkflowTemplate, WorkspaceDocument } from '../../types';
import {
  exportJsonFile,
  exportMarkdownFile,
  exportPdfFile,
  slugifyFilename,
} from '../../lib/exporter';
import { composeDeliverableMarkdown } from '../../lib/deliverableEngine';
import { FileText, FileJson, FileDown, X, Code2, Eye, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface OutputPreviewPanelProps {
  workspace: WorkspaceDocument;
  template?: WorkflowTemplate | null;
  onWorkspacePatch: (patch: Partial<WorkspaceDocument>) => void;
  onClose: () => void;
}

export const OutputPreviewPanel = ({
  workspace,
  template,
  onWorkspacePatch,
  onClose,
}: OutputPreviewPanelProps) => {
  const [title, setTitle] = useState(
    workspace.deliverableDraft?.title || template?.outputStructure.title || workspace.name || 'Workflow Deliverable',
  );
  const [includeAppendix, setIncludeAppendix] = useState(
    template?.exportBehavior.includeProcessAppendix ?? false,
  );
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  const generated = useMemo(
    () =>
      composeDeliverableMarkdown(workspace.nodes, workspace.edges, {
        title,
        template,
        includeProcessAppendix: includeAppendix,
      }),
    [workspace.nodes, workspace.edges, title, template, includeAppendix],
  );

  const markdown =
    workspace.deliverableDraft?.userEdited && workspace.deliverableDraft.markdown.trim()
      ? workspace.deliverableDraft.markdown
      : generated;

  const hasNodes = workspace.nodes.length > 0;
  const userEdited = Boolean(workspace.deliverableDraft?.userEdited);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    onWorkspacePatch({
      deliverableDraft: {
        title: value,
        markdown: workspace.deliverableDraft?.markdown ?? markdown,
        userEdited: workspace.deliverableDraft?.userEdited ?? false,
      },
    });
  };

  const handleBodyChange = (value: string) => {
    onWorkspacePatch({
      deliverableDraft: {
        title,
        markdown: value,
        userEdited: true,
      },
    });
  };

  const handleRegenerate = () => {
    if (userEdited) {
      setConfirmRegenerate(true);
      return;
    }

    regenerate();
  };

  const regenerate = () => {

    const next = composeDeliverableMarkdown(workspace.nodes, workspace.edges, {
      title,
      template,
      includeProcessAppendix: includeAppendix,
    });
    onWorkspacePatch({
      deliverableDraft: {
        title,
        markdown: next,
        userEdited: false,
      },
      meta: {
        ...workspace.meta,
        deliverableNeedsRegen: false,
      },
    });
  };

  const handleExportMd = () => {
    try {
      exportMarkdownFile(markdown, slugifyFilename(title, 'md'));
      setExportError(null);
    } catch {
      setExportError('Markdown export failed.');
    }
  };

  const handleExportJson = () => {
    try {
      exportJsonFile(workspace.nodes, workspace.edges, title, {
        ...workspace,
        deliverableDraft: { title, markdown, userEdited },
      });
      setExportError(null);
    } catch {
      setExportError('JSON export failed.');
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    setExportError(null);
    try {
      await exportPdfFile(markdown, title);
    } catch {
      setExportError('PDF export failed. Try Markdown export instead.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-8 backdrop-blur-sm">
      <div
        className="bg-panel border border-border rounded-lg shadow-2xl w-full max-w-6xl h-full max-h-[880px] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Output preview"
      >
        <div className="flex items-center justify-between px-6 py-4 bg-[#1e1e24] border-b border-gray-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">Deliverable preview</h2>
            <p className="text-xs text-gray-400">
              Composed from template structure and canvas nodes. Edit before export if needed.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'preview' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Eye className="w-4 h-4" />
                Rendered
              </button>
              <button
                type="button"
                onClick={() => setViewMode('raw')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'raw' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Code2 className="w-4 h-4" />
                Edit
              </button>
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
        </div>

        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          <div className="flex-1 md:border-r border-gray-800 p-6 overflow-y-auto bg-canvas flex flex-col min-h-0">
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full bg-transparent border-b border-gray-700 pb-2 mb-4 text-3xl font-bold text-white focus:outline-none focus:border-blue-500 shrink-0"
              placeholder="Report Title"
              aria-label="Output title"
            />

            <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-gray-400 shrink-0">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAppendix}
                  onChange={(e) => setIncludeAppendix(e.target.checked)}
                  className="rounded border-gray-600"
                />
                Include process appendix
              </label>
              {userEdited && (
                <span className="text-amber-300 font-medium">
                  Manual edits active — regenerate asks for confirmation before replacing them.
                </span>
              )}
              {workspace.meta?.deliverableNeedsRegen && (
                <span className="text-amber-200">
                  Deliverable was cleared after a legacy snapshot restore — regenerate before export.
                </span>
              )}
              <button
                type="button"
                onClick={handleRegenerate}
                className="inline-flex items-center gap-1.5 text-blue-300 hover:text-blue-200"
                data-testid="regenerate-deliverable"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate from canvas
              </button>
            </div>

            {!hasNodes && (
              <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100 shrink-0">
                Empty workflow. Add source material and nodes before exporting a client-facing deliverable.
              </div>
            )}

            <div className="flex-1 min-h-0 bg-panel border border-gray-800 rounded-lg overflow-hidden">
              <div className="h-full overflow-y-auto p-8 bg-white text-gray-900">
                {viewMode === 'preview' ? (
                  <div className="prose prose-slate max-w-none">
                    <ReactMarkdown>{markdown}</ReactMarkdown>
                  </div>
                ) : (
                  <textarea
                    value={markdown}
                    onChange={(e) => handleBodyChange(e.target.value)}
                    className="w-full h-full min-h-[420px] whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed bg-gray-50 p-4 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Editable deliverable markdown"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="w-full md:w-72 p-6 bg-[#1e1e24] flex flex-col space-y-4 shrink-0 overflow-y-auto">
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 mb-2">Export</h3>

            {exportError && (
              <div className="text-xs text-red-300 bg-red-900/20 border border-red-900/40 rounded p-2">{exportError}</div>
            )}

            <button
              type="button"
              onClick={handleExportMd}
              className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 p-4 rounded-lg flex items-center space-x-4 transition-colors text-left group"
            >
              <div className="bg-blue-500/20 p-2 rounded-md">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold text-sm text-blue-300">Markdown</div>
                <div className="text-xs opacity-70">Editable text file</div>
              </div>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="w-full bg-purple-600/10 hover:bg-purple-600/20 disabled:opacity-60 text-purple-400 border border-purple-500/30 p-4 rounded-lg flex items-center space-x-4 transition-colors text-left group"
            >
              <div className="bg-purple-500/20 p-2 rounded-md">
                <FileDown className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold text-sm text-purple-300">
                  {isExportingPdf ? 'Preparing PDF' : 'PDF report'}
                </div>
                <div className="text-xs opacity-70">Local print-oriented file</div>
              </div>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="w-full bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 border border-amber-500/30 p-4 rounded-lg flex items-center space-x-4 transition-colors text-left group"
            >
              <div className="bg-amber-500/20 p-2 rounded-md">
                <FileJson className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold text-sm text-amber-300">Project JSON</div>
                <div className="text-xs opacity-70">Re-importable workspace</div>
              </div>
            </button>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              Project JSON round-trips nodes, edges, source material, template id, and deliverable draft. No server upload.
            </p>
          </div>
        </div>
      </div>
      <ConfirmDialog open={confirmRegenerate} title="Replace manual deliverable edits?" description="Regenerating replaces the edited draft with a fresh composition from the canvas." confirmLabel="Regenerate draft" destructive onCancel={() => setConfirmRegenerate(false)} onConfirm={() => { setConfirmRegenerate(false); regenerate(); }} />
    </div>
  );
};
