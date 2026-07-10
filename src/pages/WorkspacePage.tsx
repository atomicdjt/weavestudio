import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ClipboardCheck, Database, Eye, RotateCcw, Trash2 } from 'lucide-react';
import { WorkflowCanvas } from '../components/canvas/WorkflowCanvas';
import { NodePalette, NodeInspector } from '../components/workspace/WorkspacePanels';
import { VersionHistory } from '../components/workspace/VersionHistory';
import { WorkflowValidatorPanel } from '../components/workspace/WorkflowValidatorPanel';
import { OutputPreviewPanel } from '../components/workspace/OutputPreviewPanel';
import { DataPortabilityModal } from '../components/workspace/DataPortabilityModal';
import { TemplateLoadModal } from '../components/workspace/TemplateLoadModal';
import { SourceIngestPanel } from '../components/workspace/SourceIngestPanel';
import { WorkspaceManager } from '../components/workspace/WorkspaceManager';
import { SaveStatusChip } from '../components/workspace/SaveStatus';
import type { AppEdge, AppNode, NodeType, SaveStatus, WorkflowValidatorResult, WorkspaceDocument } from '../types';
import { buildWorkflowValidator } from '../lib/workflowValidator';
import { applySourceToInputNode, splitSourceIntoNodes } from '../lib/structureSource';
import { createId } from '../lib/ids';
import { getTemplateById, resolveTemplateId, TEMPLATES } from '../data/templates';
import { createGuidedDemoWorkspace } from '../data/demos/guidedDemo';
import {
  createWorkspace,
  deleteWorkspace,
  duplicateWorkspace,
  getActiveWorkspace,
  loadIndex,
  loadWorkspaceById,
  saveWorkspaceDocument,
  setActiveWorkspaceId,
} from '../lib/workspaceStore';

type LocationState = {
  loadTemplate?: string;
  openGuidedDemo?: boolean;
  blankWorkspace?: boolean;
} | null;

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
      ...(type === 'input' ? { category: 'source' as const } : {}),
      ...(type === 'output' ? { category: 'output' as const } : {}),
    };
  }

  return {
    ...base,
    description: 'Optional BYOK-ready AI adapter step. Live network calls require explicit consent.',
    content: 'Blueprint only by default. Use Mock offline, or allow a network call to run a provider.',
    promptInstruction: '',
    expectedInput: '',
    expectedOutput: '',
    providerNote: 'Requires a user-supplied key or local Ollama. No bundled API keys. Live calls are gated.',
    reviewRequired: true,
  };
};

const createNode = (type: NodeType, index: number): AppNode => ({
  id: createId('node'),
  type,
  position: { x: 120 + (index % 3) * 340, y: 120 + Math.floor(index / 3) * 190 },
  data: getNewNodeData(type),
});

const defaultWorkspace = (): WorkspaceDocument => {
  const existing = getActiveWorkspace();
  if (existing) return existing;

  const template = getTemplateById('client-proposal-builder') ?? TEMPLATES[0];
  return createWorkspace({
    name: template.title,
    templateId: template.id,
    nodes: structuredClone(template.nodes),
    edges: structuredClone(template.edges),
    sourceMaterial: template.nodes.find((n) => n.type === 'input')?.data.content ?? '',
  });
};

const workspaceFromNavState = (state: LocationState): WorkspaceDocument | null => {
  if (!state) return null;

  if (state.openGuidedDemo) {
    const demo = createGuidedDemoWorkspace();
    return createWorkspace({
      name: demo.name,
      templateId: demo.templateId,
      nodes: demo.nodes,
      edges: demo.edges,
      sourceMaterial: demo.sourceMaterial,
    });
  }

  if (state.blankWorkspace) {
    return createWorkspace({ name: 'Blank workspace', nodes: [], edges: [], sourceMaterial: '' });
  }

  if (state.loadTemplate) {
    const templateId = resolveTemplateId(state.loadTemplate) ?? state.loadTemplate;
    const template = getTemplateById(templateId);
    if (template) {
      const source =
        template.nodes.find((n) => n.type === 'input')?.data.content || template.messyInputSample || '';
      return createWorkspace({
        name: template.title,
        templateId: template.id,
        nodes: structuredClone(template.nodes),
        edges: structuredClone(template.edges),
        sourceMaterial: source,
      });
    }
  }

  return null;
};

export const WorkspacePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as LocationState;

  const [workspace, setWorkspace] = useState<WorkspaceDocument>(() => defaultWorkspace());
  const [indexEntries, setIndexEntries] = useState(() => loadIndex().workspaces);
  const [canvasKey, setCanvasKey] = useState(0);
  const [clearSignal, setClearSignal] = useState(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showPortabilityModal, setShowPortabilityModal] = useState(false);
  const [workflowValidator, setWorkflowValidator] = useState<WorkflowValidatorResult | null>(null);
  const [nodeDataOverrides, setNodeDataOverrides] = useState<Record<string, Partial<AppNode['data']>>>({});
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showCoach, setShowCoach] = useState(() => {
    try {
      return localStorage.getItem('weavestudio_coach_dismissed') !== '1';
    } catch {
      return true;
    }
  });

  const nodes = workspace.nodes;
  const edges = workspace.edges;
  const template = useMemo(
    () => (workspace.templateId ? getTemplateById(resolveTemplateId(workspace.templateId) ?? workspace.templateId) : null),
    [workspace.templateId],
  );

  // Consume navigation intents (template / demo / blank) exactly once per location key
  useEffect(() => {
    const next = workspaceFromNavState(locationState);
    if (!next) return;
    setWorkspace(next);
    setIndexEntries(loadIndex().workspaces);
    setNodeDataOverrides({});
    setSelectedNodeId(null);
    setWorkflowValidator(null);
    setCanvasKey((k) => k + 1);
    navigate('/app', { replace: true, state: null });
  }, [location.key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Autosave
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      const result = saveWorkspaceDocument(workspace);
      setSaveStatus(result.status === 'saved' ? 'saved' : result.status);
      setSaveError(result.error ?? null);
      setIndexEntries(loadIndex().workspaces);
    }, 900);
    return () => clearTimeout(timer);
  }, [workspace]);

  const patchWorkspace = (patch: Partial<WorkspaceDocument> | ((current: WorkspaceDocument) => WorkspaceDocument)) => {
    setWorkspace((current) => (typeof patch === 'function' ? patch(current) : { ...current, ...patch }));
  };

  const handleUpdateNode = (id: string, data: Partial<AppNode['data']>) => {
    setNodeDataOverrides((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...data } }));
    patchWorkspace((current) => ({
      ...current,
      nodes: current.nodes.map((node) => (node.id === id ? { ...node, data: { ...node.data, ...data } } : node)),
      deliverableDraft: current.deliverableDraft?.userEdited
        ? current.deliverableDraft
        : current.deliverableDraft
          ? { ...current.deliverableDraft, userEdited: false }
          : current.deliverableDraft,
    }));
  };

  const handleDeleteNode = (id: string) => {
    patchWorkspace((current) => ({
      ...current,
      nodes: current.nodes.filter((node) => node.id !== id),
      edges: current.edges.filter((edge) => edge.source !== id && edge.target !== id),
    }));
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
      patchWorkspace({ nodes: canvasNodes });
      return;
    }
    patchWorkspace({
      nodes: canvasNodes.map((node) =>
        nodeDataOverrides[node.id] ? { ...node, data: { ...node.data, ...nodeDataOverrides[node.id] } } : node,
      ),
    });
  };

  const handleAddNode = (type: NodeType) => {
    patchWorkspace((current) => ({
      ...current,
      nodes: [...current.nodes, createNode(type, current.nodes.length)],
    }));
    setCanvasKey((key) => key + 1);
  };

  const handleClear = () => {
    if (!confirm('Clear the current canvas? Named snapshots remain available.')) return;
    patchWorkspace({
      nodes: [],
      edges: [],
      sourceMaterial: '',
      deliverableDraft: undefined,
    });
    setWorkflowValidator(null);
    setNodeDataOverrides({});
    setSelectedNodeId(null);
    setCanvasKey((key) => key + 1);
  };

  const handlePortabilityReload = () => {
    const active = getActiveWorkspace();
    if (active) {
      setWorkspace(active);
      setIndexEntries(loadIndex().workspaces);
    } else {
      setWorkspace(
        createWorkspace({
          name: 'Blank workspace',
          nodes: [],
          edges: [],
        }),
      );
      setIndexEntries(loadIndex().workspaces);
    }
    setWorkflowValidator(null);
    setNodeDataOverrides({});
    setSelectedNodeId(null);
    setClearSignal((s) => s + 1);
    setCanvasKey((key) => key + 1);
  };

  const handleResetDemo = () => {
    const demo = createGuidedDemoWorkspace();
    const next = createWorkspace({
      name: demo.name,
      templateId: demo.templateId,
      nodes: demo.nodes,
      edges: demo.edges,
      sourceMaterial: demo.sourceMaterial,
    });
    setWorkspace(next);
    setIndexEntries(loadIndex().workspaces);
    setWorkflowValidator(null);
    setNodeDataOverrides({});
    setSelectedNodeId(null);
    setCanvasKey((key) => key + 1);
  };

  const handleRestoreSnapshot = (nextNodes: AppNode[], nextEdges: AppEdge[]) => {
    patchWorkspace({ nodes: nextNodes, edges: nextEdges });
    setWorkflowValidator(null);
    setNodeDataOverrides({});
    setSelectedNodeId(null);
    setCanvasKey((key) => key + 1);
  };

  const handleWorkflowValidator = () => {
    setWorkflowValidator(buildWorkflowValidator(nodes, edges));
  };

  const applyTemplate = (templateId: string, mode: 'replace' | 'merge') => {
    const tpl = getTemplateById(resolveTemplateId(templateId) ?? templateId);
    if (!tpl) return;

    if (mode === 'replace') {
      const source = tpl.nodes.find((n) => n.type === 'input')?.data.content || tpl.messyInputSample || '';
      patchWorkspace({
        templateId: tpl.id,
        name: workspace.name.startsWith(tpl.title) ? workspace.name : tpl.title,
        nodes: structuredClone(tpl.nodes),
        edges: structuredClone(tpl.edges),
        sourceMaterial: source,
        deliverableDraft: undefined,
      });
    } else {
      const maxY = nodes.reduce((max, node) => Math.max(max, node.position.y), 0);
      const offsetY = nodes.length > 0 ? maxY + 300 : 0;
      const idMap: Record<string, string> = {};
      const newNodes = tpl.nodes.map((node) => {
        const newId = createId('node');
        idMap[node.id] = newId;
        return {
          ...node,
          id: newId,
          position: { x: node.position.x, y: node.position.y + offsetY },
        };
      });
      const newEdges = tpl.edges.map((edge) => ({
        ...edge,
        id: createId('edge'),
        source: idMap[edge.source] || edge.source,
        target: idMap[edge.target] || edge.target,
      }));
      patchWorkspace({
        nodes: [...nodes, ...newNodes],
        edges: [...edges, ...newEdges],
        templateId: workspace.templateId ?? tpl.id,
      });
    }

    setWorkflowValidator(null);
    setNodeDataOverrides({});
    setSelectedNodeId(null);
    setCanvasKey((key) => key + 1);
    setPendingTemplateId(null);
  };

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-auto lg:overflow-hidden relative min-h-0 h-full">
      <NodePalette onAddNode={handleAddNode} />

      <div className="flex-1 flex flex-col relative min-h-[560px] lg:min-h-0 min-w-0">
        <div className="absolute top-3 left-3 right-3 z-10 flex flex-col gap-2 pointer-events-none">
          <div className="flex flex-col xl:flex-row gap-2 justify-between items-start xl:items-center">
            <WorkspaceManager
              workspaces={indexEntries}
              activeId={workspace.id}
              workspaceName={workspace.name}
              onSelect={(id) => {
                const next = loadWorkspaceById(id);
                if (!next) return;
                setActiveWorkspaceId(id);
                setWorkspace(next);
                setNodeDataOverrides({});
                setSelectedNodeId(null);
                setWorkflowValidator(null);
                setCanvasKey((k) => k + 1);
              }}
              onRename={(name) => patchWorkspace({ name })}
              onCreate={() => {
                const next = createWorkspace({ name: 'Untitled workspace', nodes: [], edges: [] });
                setWorkspace(next);
                setIndexEntries(loadIndex().workspaces);
                setNodeDataOverrides({});
                setSelectedNodeId(null);
                setCanvasKey((k) => k + 1);
              }}
              onDuplicate={() => {
                const copy = duplicateWorkspace(workspace.id);
                if (!copy) return;
                setWorkspace(copy);
                setIndexEntries(loadIndex().workspaces);
                setCanvasKey((k) => k + 1);
              }}
              onDelete={() => {
                if (!confirm(`Delete workspace “${workspace.name}”? This cannot be undone.`)) return;
                deleteWorkspace(workspace.id);
                const index = loadIndex();
                const next = index.activeWorkspaceId ? loadWorkspaceById(index.activeWorkspaceId) : null;
                if (next) {
                  setWorkspace(next);
                } else {
                  setWorkspace(createWorkspace({ name: 'Blank workspace', nodes: [], edges: [] }));
                }
                setIndexEntries(loadIndex().workspaces);
                setCanvasKey((k) => k + 1);
              }}
            />
            <div className="pointer-events-auto flex flex-wrap items-center gap-2">
              <SaveStatusChip status={saveStatus} error={saveError} workspaceName={workspace.name} />
              <button
                type="button"
                onClick={handleClear}
                className="bg-panel border border-border text-red-400 hover:text-red-300 p-2 rounded-lg shadow-md"
                title="Clear Canvas"
                aria-label="Clear canvas"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowPortabilityModal(true)}
                className="bg-panel border border-border text-blue-400 hover:text-blue-300 p-2 rounded-lg shadow-md"
                title="Data portability"
                aria-label="Data portability"
              >
                <Database className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetDemo}
                className="bg-panel border border-border text-gray-300 hover:text-white px-3 py-2 rounded-lg shadow-md flex items-center space-x-2 text-sm font-semibold"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Guided demo</span>
              </button>
              <button
                type="button"
                onClick={handleWorkflowValidator}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg font-semibold shadow-md flex items-center space-x-2"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Validate</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg font-semibold shadow-md flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>Generate</span>
              </button>
            </div>
          </div>

          {saveError && (saveStatus === 'error' || saveStatus === 'quota') && (
            <div className="pointer-events-auto rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              {saveError} Use Data portability to export a backup.
            </div>
          )}

          {showCoach && (
            <div className="pointer-events-auto rounded-lg border border-blue-500/30 bg-blue-950/90 px-4 py-3 text-sm text-blue-50 shadow-lg max-w-xl">
              <div className="font-semibold mb-1">Golden path</div>
              <ol className="list-decimal list-inside text-xs text-blue-100/90 space-y-1 mb-2">
                <li>Paste source material below (or use sample).</li>
                <li>Split into nodes, then edit and connect on the canvas.</li>
                <li>Validate → Generate → export Markdown/PDF/project JSON.</li>
              </ol>
              <button
                type="button"
                className="text-xs text-blue-300 hover:text-white underline"
                onClick={() => {
                  try {
                    localStorage.setItem('weavestudio_coach_dismissed', '1');
                  } catch {
                    /* ignore */
                  }
                  setShowCoach(false);
                }}
              >
                Dismiss guidance
              </button>
            </div>
          )}
        </div>

        <div className="pt-[7.5rem] sm:pt-24 xl:pt-16 shrink-0">
          <SourceIngestPanel
            sourceMaterial={workspace.sourceMaterial}
            inputInstructions={template?.inputInstructions}
            sample={template?.messyInputSample}
            onChange={(value) => patchWorkspace({ sourceMaterial: value })}
            onUseSample={() => {
              if (!template?.messyInputSample) return;
              patchWorkspace({ sourceMaterial: template.messyInputSample });
            }}
            onApplyToInput={() => {
              patchWorkspace({
                nodes: applySourceToInputNode(workspace.nodes, workspace.sourceMaterial),
              });
              setCanvasKey((k) => k + 1);
            }}
            onSplitIntoNodes={() => {
              if (!workspace.sourceMaterial.trim()) {
                alert('Paste source material first.');
                return;
              }
              const result = splitSourceIntoNodes(workspace.sourceMaterial, workspace.nodes, workspace.edges);
              patchWorkspace({
                nodes: result.nodes,
                edges: result.edges,
                sourceMaterial: workspace.sourceMaterial,
              });
              setCanvasKey((k) => k + 1);
            }}
          />
        </div>

        <div className="flex-1 min-h-[480px] lg:min-h-0 w-full">
          <WorkflowCanvas
            canvasKey={canvasKey}
            initialNodes={nodes}
            initialEdges={edges}
            nodeDataOverrides={nodeDataOverrides}
            onNodesChange={handleCanvasNodesChange}
            onEdgesChange={(nextEdges) => patchWorkspace({ edges: nextEdges })}
            onNodeSelect={(node) => setSelectedNodeId(node?.id ?? null)}
          />
        </div>
      </div>

      <NodeInspector selectedNode={selectedNode} onUpdate={handleUpdateNode} onDelete={handleDeleteNode} />
      <VersionHistory nodes={nodes} edges={edges} clearSignal={clearSignal} onRestore={handleRestoreSnapshot} />

      {workflowValidator && (
        <WorkflowValidatorPanel result={workflowValidator} onClose={() => setWorkflowValidator(null)} />
      )}
      {showPreview && (
        <OutputPreviewPanel
          workspace={workspace}
          template={template}
          onWorkspacePatch={(patch) => patchWorkspace(patch)}
          onClose={() => setShowPreview(false)}
        />
      )}
      {showPortabilityModal && (
        <DataPortabilityModal
          workspace={workspace}
          onClose={() => setShowPortabilityModal(false)}
          onReload={handlePortabilityReload}
        />
      )}
      {pendingTemplateId && (
        <TemplateLoadModal
          templateName={TEMPLATES.find((t) => t.id === pendingTemplateId)?.title || 'Selected Template'}
          onReplace={() => applyTemplate(pendingTemplateId, 'replace')}
          onMerge={() => applyTemplate(pendingTemplateId, 'merge')}
          onCancel={() => setPendingTemplateId(null)}
        />
      )}
    </div>
  );
};
