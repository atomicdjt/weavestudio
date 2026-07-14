import { ListTree, Route, X } from 'lucide-react';
import type { AppNode, WorkspaceDocument } from '../../types';
import { buildWorkflowOutline } from '../../lib/workflowOutline';

interface WorkflowOutlineProps {
  workspace: WorkspaceDocument;
  selectedNodeId: string | null;
  onSelect: (node: AppNode) => void;
  onClose?: () => void;
}

export const WorkflowOutline = ({ workspace, selectedNodeId, onSelect, onClose }: WorkflowOutlineProps) => {
  const items = buildWorkflowOutline(workspace.nodes, workspace.edges);
  return <section className="h-full overflow-y-auto border-t lg:border-l lg:border-t-0 border-border bg-panel p-4" aria-label="Workflow outline" role="region">
    <div className="mb-3 flex items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-300"><ListTree className="h-4 w-4 text-blue-300" />Workflow outline</h2><p className="mt-1 text-xs text-gray-500">A keyboard-friendly reading order for the canvas. Connections are described for every step.</p></div>{onClose && <button type="button" onClick={onClose} aria-label="Close workflow outline" className="rounded p-2 text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>}</div>
    {items.length === 0 ? <p className="rounded border border-dashed border-gray-700 p-4 text-sm text-gray-500">Add a node to create a readable workflow outline.</p> : <ol className="space-y-2">{items.map((item, index) => <li key={item.node.id} style={{ marginLeft: `${Math.min(item.depth, 4) * 12}px` }}><button type="button" onClick={() => onSelect(item.node)} aria-pressed={selectedNodeId === item.node.id} className={`w-full rounded-lg border p-3 text-left transition-colors ${selectedNodeId === item.node.id ? 'border-blue-400 bg-blue-500/15' : 'border-gray-800 bg-[#1e1e24] hover:border-gray-700'}`}><span className="flex items-center justify-between gap-2"><span className="font-semibold text-sm text-white">{index + 1}. {item.node.data.title || 'Untitled node'}</span><span className="rounded bg-black/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-400">{item.node.type}</span></span><span className="mt-1 block text-xs text-gray-400">{item.node.data.description || item.node.data.content || 'No detail entered yet.'}</span><span className="mt-2 flex items-center gap-1 text-[11px] text-blue-200"><Route className="h-3 w-3" />{item.incomingFrom.length ? `${item.incomingFrom.length} incoming connection${item.incomingFrom.length === 1 ? '' : 's'}` : 'Start or unconnected step'} · {item.outgoingTo.length} next</span></button></li>)}</ol>}
  </section>;
};
