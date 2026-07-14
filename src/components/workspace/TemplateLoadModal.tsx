import React from 'react';
import { Layers, X } from 'lucide-react';
import { AccessibleDialog } from '../ui/AccessibleDialog';

interface TemplateLoadModalProps {
  templateName: string;
  onReplace: () => void;
  onMerge: () => void;
  onCancel: () => void;
}

export const TemplateLoadModal = ({ templateName, onReplace, onMerge, onCancel }: TemplateLoadModalProps) => {
  return (
    <AccessibleDialog label="Load Template" onClose={onCancel} className="bg-panel border border-border rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-[#18181b]">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            Load Template
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-300">
            You are loading <strong>{templateName}</strong>. Do you want to replace your current canvas, or merge it alongside existing nodes?
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={onReplace}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg font-semibold shadow-md transition-colors"
            >
              Replace Current Canvas
            </button>
            <button
              onClick={onMerge}
              className="w-full bg-[#1e1e24] hover:bg-gray-800 text-gray-200 border border-gray-700 px-4 py-2.5 rounded-lg font-semibold shadow-md transition-colors"
            >
              Merge (Append Nodes)
            </button>
          </div>
        </div>
    </AccessibleDialog>
  );
};
