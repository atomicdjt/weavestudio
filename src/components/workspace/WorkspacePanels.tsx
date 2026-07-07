import React from 'react';
import type { AppNode, NodeType } from '../../types';
import { BrainCircuit, FileInput, FileOutput, GitFork, Plus, Scissors, Trash2, UserCheck } from 'lucide-react';

interface NodePaletteProps {
  onAddNode: (type: NodeType) => void;
}

export const NodePalette = ({ onAddNode }: NodePaletteProps) => {
  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const items: { type: NodeType; label: string; icon: React.ReactNode; color: string }[] = [
    { type: 'input', label: 'Input', icon: <FileInput className="w-4 h-4" />, color: 'text-emerald-400 border-emerald-500/30' },
    { type: 'transform', label: 'Transform', icon: <Scissors className="w-4 h-4" />, color: 'text-blue-400 border-blue-500/30' },
    { type: 'decision', label: 'Decision', icon: <GitFork className="w-4 h-4" />, color: 'text-amber-400 border-amber-500/30' },
    { type: 'review', label: 'Review', icon: <UserCheck className="w-4 h-4" />, color: 'text-purple-400 border-purple-500/30' },
    { type: 'aiAssist', label: 'AI Assist', icon: <BrainCircuit className="w-4 h-4" />, color: 'text-cyan-300 border-cyan-500/30' },
    { type: 'output', label: 'Output', icon: <FileOutput className="w-4 h-4" />, color: 'text-rose-400 border-rose-500/30' },
  ];

  return (
    <aside className="w-full lg:w-64 bg-panel border-b lg:border-b-0 lg:border-r border-border p-4 flex flex-col lg:h-full max-h-72 lg:max-h-none overflow-y-auto">
      <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 mb-4">Node Palette</h3>
      <p className="text-xs text-gray-400 mb-4">Drag a node onto the canvas, or use the add button for keyboard-friendly creation.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-3">
        {items.map((item) => (
          <div
            key={item.type}
            className={`flex items-center gap-2 p-3 rounded-lg border bg-[#1e1e24] cursor-grab active:cursor-grabbing hover:bg-gray-800 transition-colors ${item.color}`}
            onDragStart={(event) => onDragStart(event, item.type)}
            draggable
          >
            {item.icon}
            <span className="font-medium text-sm text-gray-200 flex-1 min-w-0 truncate">{item.label}</span>
            <button
              type="button"
              onClick={() => onAddNode(item.type)}
              className="p-1 rounded bg-black/30 text-gray-300 hover:text-white hover:bg-black/50"
              aria-label={`Add ${item.label} node`}
              title={`Add ${item.label} node`}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
};

interface NodeInspectorProps {
  selectedNode: AppNode | null;
  onUpdate: (id: string, data: Partial<AppNode['data']>) => void;
  onDelete: (id: string) => void;
}

export const NodeInspector = ({ selectedNode, onUpdate, onDelete }: NodeInspectorProps) => {
  if (!selectedNode) {
    return (
      <aside className="w-full lg:w-80 bg-panel border-t lg:border-t-0 lg:border-l border-border p-4 flex flex-col lg:h-full min-h-40 lg:min-h-0 items-center justify-center text-gray-500 text-sm text-center">
        <div className="max-w-56">
          <div className="font-semibold text-gray-300 mb-1">No node selected</div>
          <p>Select a canvas node to edit its title, description, content, and review settings.</p>
        </div>
      </aside>
    );
  }

  const { data } = selectedNode;

  return (
    <aside className="w-full lg:w-80 bg-panel border-t lg:border-t-0 lg:border-l border-border p-4 flex flex-col lg:h-full max-h-96 lg:max-h-none overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">Node Inspector</h3>
        <button type="button" onClick={() => onDelete(selectedNode.id)} className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-900/30 transition-colors" title="Delete Node" aria-label="Delete selected node">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Type</label>
          <div className="bg-[#1e1e24] px-3 py-2 rounded text-sm text-gray-300 capitalize border border-gray-800">
            {selectedNode.type}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Title</label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => onUpdate(selectedNode.id, { title: e.target.value })}
            className="w-full bg-[#1e1e24] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            placeholder="Node title"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</label>
          <input
            type="text"
            value={data.description}
            onChange={(e) => onUpdate(selectedNode.id, { description: e.target.value })}
            className="w-full bg-[#1e1e24] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            placeholder="Short description"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Content</label>
          <textarea
            value={data.content}
            onChange={(e) => onUpdate(selectedNode.id, { content: e.target.value })}
            className="w-full h-40 bg-[#1e1e24] border border-gray-700 rounded px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-blue-500 resize-none"
            placeholder="Raw text, markdown, rules..."
          />
        </div>

        {selectedNode.type === 'review' && (
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="reviewReq"
              checked={!!data.reviewRequired}
              onChange={(e) => onUpdate(selectedNode.id, { reviewRequired: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-[#1e1e24]"
            />
            <label htmlFor="reviewReq" className="text-sm text-gray-300 select-none cursor-pointer">
              Requires Human Verification
            </label>
          </div>
        )}

        {selectedNode.type === 'aiAssist' && (
          <div className="space-y-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-cyan-200">BYOK-ready blueprint</div>
              <p className="mt-1 text-xs leading-relaxed text-gray-400">
                This node documents a future provider adapter. It does not make live AI calls or store API keys.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Prompt / Instruction</label>
              <textarea
                value={data.promptInstruction ?? ''}
                onChange={(e) => onUpdate(selectedNode.id, { promptInstruction: e.target.value })}
                className="w-full h-24 bg-[#1e1e24] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 resize-none"
                placeholder="Describe the intended assistive prompt..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Expected Input</label>
              <input
                type="text"
                value={data.expectedInput ?? ''}
                onChange={(e) => onUpdate(selectedNode.id, { expectedInput: e.target.value })}
                className="w-full bg-[#1e1e24] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                placeholder="Upstream notes, transcript, or structured text"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Expected Output</label>
              <input
                type="text"
                value={data.expectedOutput ?? ''}
                onChange={(e) => onUpdate(selectedNode.id, { expectedOutput: e.target.value })}
                className="w-full bg-[#1e1e24] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                placeholder="Draft summary, candidate sections, or checklist"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Provider Note</label>
              <textarea
                value={data.providerNote ?? ''}
                onChange={(e) => onUpdate(selectedNode.id, { providerNote: e.target.value })}
                className="w-full h-20 bg-[#1e1e24] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 resize-none"
                placeholder="Adapter requirements or BYOK notes"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="aiReviewReq"
                checked={!!data.reviewRequired}
                onChange={(e) => onUpdate(selectedNode.id, { reviewRequired: e.target.checked })}
                className="w-4 h-4 rounded border-gray-600 text-cyan-600 focus:ring-cyan-500 bg-[#1e1e24]"
              />
              <label htmlFor="aiReviewReq" className="text-sm text-gray-300 select-none cursor-pointer">
                Human review required
              </label>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
