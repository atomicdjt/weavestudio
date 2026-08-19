import { useEffect, useRef, useState } from 'react';
import { FileInput, ListTree, Sparkles } from 'lucide-react';
import type { SourceSyncStatus } from '../../types';
import { SOURCE_SYNC_LABELS } from '../../lib/sourceSync';

interface SourceIngestPanelProps {
  sourceMaterial: string;
  inputInstructions?: string;
  sample?: string;
  syncStatus: SourceSyncStatus;
  onChange: (value: string) => void;
  onApplyToInput: () => void;
  onSplitIntoNodes: () => void;
  onAddSourceFragment: (startOffset: number, endOffset: number) => void;
  onUseSample?: () => void;
}

export const SourceIngestPanel = ({
  sourceMaterial,
  inputInstructions,
  sample,
  syncStatus,
  onChange,
  onApplyToInput,
  onSplitIntoNodes,
  onAddSourceFragment,
  onUseSample,
}: SourceIngestPanelProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const hasSelection = selection.end > selection.start;

  const captureSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    setSelection({ start: textarea.selectionStart, end: textarea.selectionEnd });
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return undefined;
    const handleNativeSelect = () => {
      setSelection({ start: textarea.selectionStart, end: textarea.selectionEnd });
    };
    textarea.addEventListener('select', handleNativeSelect);
    return () => textarea.removeEventListener('select', handleNativeSelect);
  }, []);

  const handleSourceChange = (value: string) => {
    setSelection({ start: 0, end: 0 });
    onChange(value);
  };

  const handleAddSourceFragment = () => {
    if (!hasSelection) return;
    onAddSourceFragment(selection.start, selection.end);
    setSelection({ start: 0, end: 0 });
  };

  const syncClass =
    syncStatus === 'in_sync'
      ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
      : syncStatus === 'source_ahead'
        ? 'text-amber-200 border-amber-500/40 bg-amber-500/10'
        : 'text-sky-200 border-sky-500/30 bg-sky-500/10';

  return (
    <div className="border-b border-border bg-[#121218] px-4 py-3 space-y-2 shrink-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileInput className="w-4 h-4 text-emerald-400" />
            Source material
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {inputInstructions ||
              'Paste unstructured notes, transcripts, or logs. Then structure them into canvas nodes.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span
            className={`text-[11px] font-medium px-2 py-1 rounded-md border ${syncClass}`}
            role="status"
            data-testid="source-sync-status"
          >
            {SOURCE_SYNC_LABELS[syncStatus]}
          </span>
          {sample && onUseSample && (
            <button
              type="button"
              onClick={onUseSample}
              className="text-xs px-3 py-1.5 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Use sample
            </button>
          )}
          <button
            type="button"
            onClick={handleAddSourceFragment}
            disabled={!hasSelection}
            className="text-xs px-3 py-1.5 rounded-md border border-violet-500/30 text-violet-300 hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-40"
            title="Select exact source text below, then save that range as provenance evidence"
          >
            Add source fragment
          </button>
          <button
            type="button"
            onClick={onApplyToInput}
            className="text-xs px-3 py-1.5 rounded-md border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
          >
            Apply to Input node
          </button>
          <button
            type="button"
            onClick={onSplitIntoNodes}
            className="text-xs px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5"
          >
            <ListTree className="w-3.5 h-3.5" />
            Split into nodes
          </button>
        </div>
      </div>
      {syncStatus === 'source_ahead' && (
        <p className="text-[11px] text-amber-200/90">
          Source changed — canvas Input may be older. Apply updates the Input node only; Split can restructure derived
          nodes (you will be asked to confirm if that would replace edits).
        </p>
      )}
      {syncStatus === 'canvas_ahead' && (
        <p className="text-[11px] text-sky-200/90">
          Canvas changes are newer than the source panel. Your canvas is preserved. Export it, or update the source panel deliberately before applying another split.
        </p>
      )}
      <textarea
        ref={textareaRef}
        value={sourceMaterial}
        onChange={(e) => handleSourceChange(e.target.value)}
        onSelect={captureSelection}
        onMouseUp={captureSelection}
        onKeyUp={captureSelection}
        rows={4}
        className="w-full bg-[#1e1e24] border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-100 font-mono focus:outline-none focus:border-blue-500 resize-y min-h-[96px]"
        placeholder="Paste fragmented notes, transcripts, logs, or research here…"
        aria-label="Source material"
      />
      <p className="text-[11px] text-gray-500">
        Select exact source text to enable provenance capture. Saved fragments remain anchored to the captured range and are marked stale if that source changes.
      </p>
    </div>
  );
};
