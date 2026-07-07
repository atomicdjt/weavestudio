import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ClipboardCheck, DatabaseX, Eye, RotateCcw, Trash2 } from 'lucide-react';
import { WorkflowCanvas } from '../components/canvas/WorkflowCanvas';
import { NodePalette, NodeInspector } from '../components/workspace/WorkspacePanels';
import { VersionHistory } from '../components/workspace/VersionHistory';
import { ProcessCheckPanel } from '../components/workspace/ProcessCheckPanel';
import { OutputPreviewPanel } from '../components/workspace/OutputPreviewPanel';
import type { AppEdge, AppNode, NodeType, ProcessCheckResult } from '../types';
import { clearAllLocalData, clearWorkspace, loadTemplate, loadWorkspace, saveWorkspace } from '../lib/storage';
import { buildProcessCheck } from '../lib/processCheck';
import { TEMPLATES } from '../data/templates';

function getInitial(locationState: unknown): { nodes: AppNode[]; edges: AppEdge[] } {
  const state = locationState as { loadTemplate?: string } | null;
  const templateId = state?.loadTemplate;
  if (templateId) {
    const template = loadTemplate(templateId);
    if (template) return template;
  }

  const saved = loadWorkspace();
  if (saved && saved.nodes.length > 0) return saved;

  const demo = loadTemplate(TEMPLATES[0].id);
  return demo ?? { nodes: [], edges: [] };
}

const getNewNodeData = (type: NodeType): AppNode['data'] => {
  const base = {
    title: `New ${type === 'aiAssist' ? 'AI Assist Blueprint' : `${type.charAt(0).toUpperCase()}${type.slice(1)}`}`,
    description: '',
    content: '',
    status: 'pending' as const,
  };

  if (type !== 'aiAssist') {
    return {
      ...base,
      ...(type === 'review' ? { reviewRequired: true } : {}),
    };
  }

  return {
    ...base,
    description: 'Optional BYOK-ready AI adapter step. No live API calls are made by default.',
    content: 'Blueprint only: define the intended assistive transformation and keep human review enabled.',
    promptInstruction: '',
    expectedInput: '',
    expectedOutput: '',
    providerNote: 'Requires a user-supplied key or future provider adapter to execute real AI calls.',
    reviewRequired: true,
  };
};

const createNode = (type: NodeType, index: number): AppNode => ({
  id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
  type,
  position: { x: 120 + (index % 3) * 340, y: 120 + Math.floor(index / 3) * 190 },
  data: getNewNodeData(type),
});

export const WorkspacePage = () => {
  const location = useLocation();
  const loadedTemplateId = (location.state as { loadTemplate?: string } | null)?.loadTemplate;
  const initialData = useRef(getInitial(location.state));

  const [nodes, setNodes] = useState<AppNode[]>(initialData.current.nodes);
  const [edges, setEdges] = useState<AppEdge[]>(initialData.current.edges);
  const [canvasKey, setCanvasKey] = useState(0);
  const [clearSignal, setClearSignal] = useState(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [processCheck, setProcessCheck] = useState<ProcessCheckResult | null>(null);
  const [nodeDataOverrides, setNodeDataOverrides] = useState<Record<string, Partial<AppNode['data']>>>({});

  useEffect(() => {
    if (loadedTemplateId) {
      window.history.replaceState({}, document.title);
    }
  }, [loadedTemplateId]);

  useEffect(() => {
    if (nodes.length === 0) return;
    const timer = setTimeout(() => saveWorkspace(nodes, edges), 1000);
    return () => clearTimeout(timer);
  }, [nodes, edges]);

  const handleUpdateNode = (id: string, data: Partial<AppNode['data']>) => {
    setNodeDataOverrides((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...data } }));
    setNodes((current) => current.map((node) => (node.id === id ? { ...node, data: { ...node.data, ...data } } : node)));
  };

  const handleDeleteNode = (id: string) => {
    setNodes((current) => current.filter((node) => node.id !== id));
    setEdges((current) => current.filter((edge) => edge.source !== id && edge.target !== id));
    setSelectedNodeId((current) => (current === id ? null : current));
    setNodeDataOverrides((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setCanvasKey((key) => key + 1);
  };

  const handleCanvasNodesChange = (canvasNodes: AppNode[]) => {
    if (Object.keys(nodeDataOverrides).length === 0) {
      setNodes(canvasNodes);
      return;
    }

    setNodes(
      canvasNodes.map((node) =>
        nodeDataOverrides[node.id]
          ? { ...node, data: { ...node.data, ...nodeDataOverrides[node.id] } }
          : node,
      ),
    );
  };

  const handleAddNode = (type: NodeType) => {
    setNodes((current) => [...current, createNode(type, current.length)]);
    setCanvasKey((key) => key + 1);
  };

  const handleClear = () => {
    if (!confirm('Clear the current canvas? Saved snapshots will remain available.')) return;
    clearWorkspace();
    setNodes([]);
    setEdges([]);
    setProcessCheck(null);
    setNodeDataOverrides({});
    setSelectedNodeId(null);
    setCanvasKey((key) => key + 1);
  };

  const handleClearAllLocalData = () => {
    if (!confirm('Clear the current workspace and all saved snapshots from this browser?')) return;
    clearAllLocalData();
    setNodes([]);
    setEdges([]);
    setProcessCheck(null);
    setNodeDataOverrides({});
    setSelectedNodeId(null);
    setClearSignal((signal) => signal + 1);
    setCanvasKey((key) => key + 1);
  };

  const handleResetDemo = () => {
    const demo = loadTemplate(TEMPLATES[0].id);
    if (!demo) return;
    clearWorkspace();
    setNodes(demo.nodes);
    setEdges(demo.edges);
    setProcessCheck(null);
    setNodeDataOverrides({});
    setSelectedNodeId(null);
    setCanvasKey((key) => key + 1);
  };

  const handleRestoreSnapshot = (nextNodes: AppNode[], nextEdges: AppEdge[]) => {
    setNodes(nextNodes);
    setEdges(nextEdges);
    setProcessCheck(null);
    setNodeDataOverrides({});
    setSelectedNodeId(null);
    setCanvasKey((key) => key + 1);
  };

  const handleProcessCheck = () => {
    setProcessCheck(buildProcessCheck(nodes, edges));
  };

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-auto lg:overflow-hidden relative min-h-0 h-full">
      <NodePalette onAddNode={handleAddNode} />

      <div className="flex-1 flex flex-col relative min-h-[560px] lg:min-h-0">
        <div className="absolute top-4 left-4 right-4 z-10 flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="bg-panel border border-border text-red-400 hover:text-red-300 p-2 rounded-lg shadow-md transition-colors"
              title="Clear Canvas"
              aria-label="Clear canvas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleClearAllLocalData}
              className="bg-panel border border-border text-amber-300 hover:text-amber-200 p-2 rounded-lg shadow-md transition-colors"
              title="Clear Local Data"
              aria-label="Clear local data"
            >
              <DatabaseX className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetDemo}
              className="bg-panel border border-border text-gray-300 hover:text-white px-3 py-2 rounded-lg shadow-md transition-colors flex items-center space-x-2 text-sm font-semibold"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Demo</span>
            </button>
          </div>
          <div className="pointer-events-auto flex items-center space-x-2">
            <button
              type="button"
              onClick={handleProcessCheck}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-semibold shadow-md shadow-emerald-900/20 flex items-center space-x-2 transition-colors"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Process Check</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold shadow-md shadow-blue-900/20 flex items-center space-x-2 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Generate Output</span>
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-[560px] lg:min-h-0 w-full">
          <WorkflowCanvas
            canvasKey={canvasKey}
            initialNodes={nodes}
            initialEdges={edges}
            nodeDataOverrides={nodeDataOverrides}
            onNodesChange={handleCanvasNodesChange}
            onEdgesChange={setEdges}
            onNodeSelect={(node) => setSelectedNodeId(node?.id ?? null)}
          />
        </div>
      </div>

      <NodeInspector selectedNode={selectedNode} onUpdate={handleUpdateNode} onDelete={handleDeleteNode} />
      <VersionHistory nodes={nodes} edges={edges} clearSignal={clearSignal} onRestore={handleRestoreSnapshot} />

      {processCheck && <ProcessCheckPanel result={processCheck} onClose={() => setProcessCheck(null)} />}
      {showPreview && <OutputPreviewPanel nodes={nodes} edges={edges} onClose={() => setShowPreview(false)} />}
    </div>
  );
};
