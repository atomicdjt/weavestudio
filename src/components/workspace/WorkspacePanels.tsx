import React from 'react';
import type { AppNode, NodeCategory, NodeType } from '../../types';
import { BrainCircuit, FileInput, FileOutput, GitFork, Plus, Scissors, Trash2, UserCheck } from 'lucide-react';

const CATEGORY_OPTIONS: { value: NodeCategory; label: string }[] = [
  { value: 'source', label: 'Source' },
  { value: 'evidence', label: 'Evidence' },
  { value: 'action', label: 'Action' },
  { value: 'risk', label: 'Risk' },
  { value: 'decision', label: 'Decision' },
  { value: 'conclusion', label: 'Conclusion' },
  { value: 'open_question', label: 'Open question' },
  { value: 'output', label: 'Output' },
  { value: 'other', label: 'Other' },
];

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
  const [sessionApiKeys, setSessionApiKeys] = React.useState<Record<string, string>>({});
  const [networkAllowed, setNetworkAllowed] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');

  if (!selectedNode) {
    return (
      <aside className="w-full lg:w-80 bg-panel border-t lg:border-t-0 lg:border-l border-border p-4 flex flex-col lg:h-full min-h-40 lg:min-h-0 items-center justify-center text-gray-500 text-sm text-center">
        <div className="max-w-56">
          <div className="font-semibold text-gray-300 mb-1">No node selected</div>
          <p>Select a canvas node to edit its title, description, content, category, and review settings.</p>
        </div>
      </aside>
    );
  }

  const { data } = selectedNode;
  const apiKey = sessionApiKeys[selectedNode.id] || '';

  const handleGenerate = async () => {
    if (!networkAllowed) {
      const confirmed = confirm(
        'Run AI Assist will send the prompt and input context to the configured provider URL over the network (or to local Ollama). API keys stay in session memory only. Continue?',
      );
      if (!confirmed) return;
      setNetworkAllowed(true);
    }

    const provider = data.provider || 'openai';
    const baseUrl = data.baseUrl || (provider === 'ollama' ? 'http://localhost:11434/api/generate' : 'https://api.openai.com/v1/chat/completions');
    const model = data.modelName || (provider === 'ollama' ? 'llama3' : 'gpt-4o-mini');
    const prompt = data.promptInstruction || '';
    const input = data.expectedInput || '';
    
    setIsGenerating(true);
    setErrorMsg('');
    
    try {
      const fullPrompt = `Instruction: ${prompt}\n\nInput Context:\n${input}\n\nPlease generate the required output.`;
      
      let generatedText = '';
      
      if (provider === 'ollama') {
        const res = await fetch(baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, prompt: fullPrompt, stream: false })
        });
        if (!res.ok) throw new Error(`Ollama API error: ${res.statusText}`);
        const json = await res.json();
        generatedText = json.response;
      } else {
        // OpenAI-compatible
        const res = await fetch(baseUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: fullPrompt }]
          })
        });
        if (!res.ok) {
          const errJson = await res.json().catch(() => null);
          throw new Error(`OpenAI API error: ${errJson?.error?.message || res.statusText}`);
        }
        const json = await res.json();
        generatedText = json.choices[0].message.content;
      }
      
      onUpdate(selectedNode.id, { content: generatedText });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

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
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Category</label>
          <select
            value={data.category || 'other'}
            onChange={(e) => onUpdate(selectedNode.id, { category: e.target.value as NodeCategory })}
            className="w-full bg-[#1e1e24] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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
              <div className="text-xs font-semibold uppercase tracking-wider text-cyan-200">Optional AI Assist</div>
              <p className="text-[11px] text-cyan-100/70 mt-1 leading-relaxed">
                Default path is offline (Mock). Live provider calls leave this device only after you confirm.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Provider</label>
                <select
                  value={data.provider || 'openai'}
                  onChange={(e) => onUpdate(selectedNode.id, { provider: e.target.value as 'openai' | 'ollama' })}
                  className="w-full bg-[#1e1e24] border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="openai">OpenAI / Compatible</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Model Name</label>
                <input
                  type="text"
                  value={data.modelName || ''}
                  onChange={(e) => onUpdate(selectedNode.id, { modelName: e.target.value })}
                  className="w-full bg-[#1e1e24] border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  placeholder={data.provider === 'ollama' ? 'llama3' : 'gpt-4o-mini'}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Base URL</label>
              <input
                type="text"
                value={data.baseUrl || ''}
                onChange={(e) => onUpdate(selectedNode.id, { baseUrl: e.target.value })}
                className="w-full bg-[#1e1e24] border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                placeholder={data.provider === 'ollama' ? 'http://localhost:11434/api/generate' : 'https://api.openai.com/v1/chat/completions'}
              />
            </div>

            {data.provider !== 'ollama' && (
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  API Key <span className="text-gray-500 lowercase normal-case">(session only)</span>
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setSessionApiKeys(prev => ({ ...prev, [selectedNode.id]: e.target.value }))}
                  className="w-full bg-[#1e1e24] border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  placeholder="sk-..."
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 mt-4 border-t border-gray-800 pt-3">Prompt / Instruction</label>
              <textarea
                value={data.promptInstruction ?? ''}
                onChange={(e) => onUpdate(selectedNode.id, { promptInstruction: e.target.value })}
                className="w-full h-24 bg-[#1e1e24] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 resize-none"
                placeholder="Describe the intended assistive prompt..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Input Context</label>
              <textarea
                value={data.expectedInput ?? ''}
                onChange={(e) => onUpdate(selectedNode.id, { expectedInput: e.target.value })}
                className="w-full h-16 bg-[#1e1e24] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 resize-none"
                placeholder="Paste upstream notes, transcript, or structured text"
              />
            </div>

            {errorMsg && (
              <div className="text-red-400 text-xs bg-red-900/20 p-2 rounded border border-red-900/50">
                {errorMsg}
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                title="Offline mock response — no network"
                onClick={() => {
                  const mockText = `[MOCK — offline]\n\nDraft for "${data.title || 'the section'}" based on the input context.\n\n- Key point 1\n- Key point 2\n\nReplace with human-edited content before export.`;
                  onUpdate(selectedNode.id, { content: mockText });
                }}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded text-sm font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <BrainCircuit className="w-4 h-4" />
                <span>Mock (offline)</span>
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-cyan-600/15 hover:bg-cyan-600/25 text-cyan-200 border border-cyan-500/30 p-2 rounded text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {isGenerating ? 'Calling provider…' : networkAllowed ? 'Run live provider' : 'Run live provider (asks consent)'}
              </button>
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
