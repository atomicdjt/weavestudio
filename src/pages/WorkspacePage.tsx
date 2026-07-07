import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ClipboardCheck, DatabaseX, Eye, RotateCcw, Trash2 } from 'lucide-react';
import { WorkflowCanvas } from '../components/canvas/WorkflowCanvas';
import { NodePalette, NodeInspector } from '../components/workspace/WorkspacePanels';
import { VersionHistory } from '../components/workspace/VersionHistory';
import { WorkflowValidatorPanel } from '../components/workspace/WorkflowValidatorPanel';
import { OutputPreviewPanel } from '../components/workspace/OutputPreviewPanel';
import { DataPortabilityModal } from '../components/workspace/DataPortabilityModal';
import { TemplateLoadModal } from '../components/workspace/TemplateLoadModal';
import type { AppEdge, AppNode, NodeType, WorkflowValidatorResult } from '../types';
import { clearWorkspace, loadTemplate, loadWorkspace, saveWorkspace } from '../lib/storage';
import { buildWorkflowValidator } from '../lib/workflowValidator';
import { TEMPLATES } from '../data/templates';

function getInitial(locationState: unknown): { nodes: AppNode[]; edges: AppEdge[] } {
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
  const [showPortabilityModal, setShowPortabilityModal] = useState(false);
  const [workflowValidator, setWorkflowValidator] = useState<WorkflowValidatorResult | null>(null);
  const [nodeDataOverrides, setNodeDataOverrides] = useState<Record<string, Partial<AppNode['data']>>>({});
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);

  useEffect(() => {
    if (loadedTemplateId) {
      setPendingTemplateId(loadedTemplateId);
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
    setWorkflowValidator(null);
    setNodeDataOverrides({});
    setSelectedNodeId(null);
    setCanvasKey((key) => key + 1);
  };

  const handlePortabilityClearSignal = () => {
    setNodes([]);
    setEdges([]);
    setWorkflowValidator(null);
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
    setWorkflowValidator(null);
    setNodeDataOverrides({});
    setSelectedNodeId(null);
    setCanvasKey((key) => key + 1);
  };

  const handleRestoreSnapshot = (nextNodes: AppNode[], nextEdges: AppEdge[]) => {
    setNodes(nextNodes);
    setEdges(nextEdges);
    setWorkflowValidator(null);
    setNodeDataOverrides({});
    setSelectedNodeId(null);
    setCanvasKey((key) => key + 1);
  };

  const handleWorkflowValidator = () => {
    setWorkflowValidator(buildWorkflowValidator(nodes, edges));
  };

  const handleReplaceTemplate = () => {
    if (!pendingTemplateId) return;
    const template = loadTemplate(pendingTemplateId);
    if (template) {
      clearWorkspace();
      setNodes(template.nodes);
      setEdges(template.edges);
      setWorkflowValidator(null);
      setNodeDataOverrides({});
      setSelectedNodeId(null);
      setCanvasKey((key) => key + 1);
    }
    setPendingTemplateId(null);
  };

  const handleMergeTemplate = () => {
    if (!pendingTemplateId) return;
    const template = loadTemplate(pendingTemplateId);
    if (template) {
      // Find bounding box of current nodes to offset the new ones
      const maxY = nodes.reduce((max, node) => Math.max(max, node.position.y), 0);
      const offsetY = nodes.length > 0 ? maxY + 300 : 0;
      
      const idMap: Record<string, string> = {};
      const newNodes = template.nodes.map(node => {
        const newId = `node_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        idMap[node.id] = newId;
        return {
          ...node,
          id: newId,
          position: { x: node.position.x, y: node.position.y + offsetY }
        };
      });
      
      const newEdges = template.edges.map(edge => ({
        ...edge,
        id: `edge_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        source: idMap[edge.source] || edge.source,
        target: idMap[edge.target] || edge.target
      }));

      setNodes(current => [...current, ...newNodes]);
      setEdges(current => [...current, ...newEdges]);
      setCanvasKey((key) => key + 1);
    }
    setPendingTemplateId(null);
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
              onClick={() => setShowPortabilityModal(true)}
              className="bg-panel border border-border text-blue-400 hover:text-blue-300 p-2 rounded-lg shadow-md transition-colors"
              title="Data Portability"
              aria-label="Data portability"
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
              onClick={handleWorkflowValidator}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-semibold shadow-md shadow-emerald-900/20 flex items-center space-x-2 transition-colors"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Workflow Validator</span>
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

      {workflowValidator && <WorkflowValidatorPanel result={workflowValidator} onClose={() => setWorkflowValidator(null)} />}
      {showPreview && <OutputPreviewPanel nodes={nodes} edges={edges} onClose={() => setShowPreview(false)} />}
      {showPortabilityModal && <DataPortabilityModal onClose={() => setShowPortabilityModal(false)} onClearSignal={handlePortabilityClearSignal} />}
      {pendingTemplateId && (
        <TemplateLoadModal
          templateName={TEMPLATES.find(t => t.id === pendingTemplateId)?.title || 'Selected Template'}
          onReplace={handleReplaceTemplate}
          onMerge={handleMergeTemplate}
          onCancel={() => setPendingTemplateId(null)}
        />
      )}
    </div>
  );
};
