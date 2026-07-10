import { FileInput, ListTree, Sparkles } from 'lucide-react';

interface SourceIngestPanelProps {
  sourceMaterial: string;
  inputInstructions?: string;
  sample?: string;
  onChange: (value: string) => void;
  onApplyToInput: () => void;
  onSplitIntoNodes: () => void;
  onUseSample?: () => void;
}

export const SourceIngestPanel = ({
  sourceMaterial,
  inputInstructions,
  sample,
  onChange,
  onApplyToInput,
  onSplitIntoNodes,
  onUseSample,
}: SourceIngestPanelProps) => {
  return (
    <div className="border-b border-border bg-[#121218] px-4 py-3 space-y-2 shrink-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileInput className="w-4 h-4 text-emerald-400" />
            Source material
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {inputInstructions || 'Paste unstructured notes, transcripts, or logs. Then structure them into canvas nodes.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
      <textarea
        value={sourceMaterial}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full bg-[#1e1e24] border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-100 font-mono focus:outline-none focus:border-blue-500 resize-y min-h-[96px]"
        placeholder="Paste fragmented notes, transcripts, logs, or research here…"
        aria-label="Source material"
      />
    </div>
  );
};
