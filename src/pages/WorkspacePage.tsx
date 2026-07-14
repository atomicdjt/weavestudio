import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ClipboardCheck, Database, Eye, LayoutDashboard, ListTree, Redo2, RotateCcw, Trash2, Undo2, X } from 'lucide-react';
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
import { OnboardingChecklist } from '../components/workspace/OnboardingChecklist';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { AccessibleDialog } from '../components/ui/AccessibleDialog';
import { WorkflowOutline } from '../components/workspace/WorkflowOutline';
import { GuidedTour } from '../components/workspace/GuidedTour';
import type {
  AppNode,
  NodeType,
  SaveStatus,
  VersionSnapshot,
  WorkflowValidatorResult,
  WorkspaceDocument,
} from '../types';
import { buildWorkflowValidator } from '../lib/workflowValidator';
import {
  applySourceToInputNode,
  countDerivedNodes,
  splitSourceIntoNodes,
  willOverwriteInputContent,
} from '../lib/structureSource';
import { computeSourceSyncStatus } from '../lib/sourceSync';
import { createId } from '../lib/ids';
import { getTemplateById, resolveTemplateId, TEMPLATES } from '../data/templates';
import {
  applySnapshotToWorkspace,
  createWorkspace,
  deleteWorkspace,
  duplicateWorkspace,
  getActiveWorkspace,
  loadIndex,
  loadWorkspaceById,
  saveWorkspaceDocument,
  setActiveWorkspaceId,
  saveRecoverySnapshot,
} from '../lib/workspaceStore';
import { resolveWorkspaceFromNav, type LocationState } from '../lib/workspaceInit';
import { createWorkspaceHistory } from '../lib/workspaceHistory';
import { autoLayoutNodes } from '../lib/autoLayout';

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

  // Empty store: blank workspace only — never auto-create a template as a side effect of guided demo
  return createWorkspace({ name: 'Blank workspace', nodes: [], edges: [], sourceMaterial: '' });
};

const readHistoryState = (): LocationState => {
  try {
    return (window.history.state as LocationState) ?? null;
  } catch {
    return null;
  }
};

export const WorkspacePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as LocationState;

  const [workspace, setWorkspace] = useState<WorkspaceDocument>(() => {
    // Process nav intent in initializer so we never create a default template first
    const fromNav = resolveWorkspaceFromNav(locationState ?? readHistoryState());
    return fromNav ?? defaultWorkspace();
  });
  const historyRef = useRef(createWorkspaceHistory(workspace));
  const restoringHistoryRef = useRef(false);
  const [, setHistoryVersion] = useState(0);
  const [indexEntries, setIndexEntries] = useState(() => loadIndex().workspaces);
  /** Bumped only for external graph replacements / workspace switches — not for pan or source panel typing */
  const [graphEpoch, setGraphEpoch] = useState(0);
  const [clearSignal, setClearSignal] = useState(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const pendingPaletteSelectionRef = useRef<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<'inspector' | 'snapshots' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ title: string; description: string; label: string; destructive?: boolean; action: () => void } | null>(null);
  const [showPortabilityModal, setShowPortabilityModal] = useState(false);
  const [workflowValidator, setWorkflowValidator] = useState<WorkflowValidatorResult | null>(null);
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
  const [showTour, setShowTour] = useState(false);
  const [navConsumedKey, setNavConsumedKey] = useState<string | null>(() =>
    locationState?.intentId || locationState?.openGuidedDemo || locationState?.blankWorkspace || locationState?.loadTemplate
      ? location.key
      : null,
  );

  const nodes = workspace.nodes;
  const edges = workspace.edges;
  const template = useMemo(
    () =>
      workspace.templateId
        ? getTemplateById(resolveTemplateId(workspace.templateId) ?? workspace.templateId)
        : null,
    [workspace.templateId],
  );

  const syncStatus = useMemo(
    () =>
      computeSourceSyncStatus(
        workspace.sourceMaterial,
        workspace.nodes,
        typeof workspace.meta?.appliedSourceFingerprint === 'string'
          ? workspace.meta.appliedSourceFingerprint
          : undefined,
      ),
    [workspace.sourceMaterial, workspace.nodes, workspace.meta?.appliedSourceFingerprint],
  );

  // Subsequent navigations to /app with new intents (same mounted route)
  useEffect(() => {
    if (!locationState) return;
    if (!(locationState.openGuidedDemo || locationState.blankWorkspace || locationState.loadTemplate)) {
      return;
    }
    if (navConsumedKey === location.key) return;

    const next = resolveWorkspaceFromNav(locationState);
    if (!next) return;

    setWorkspace(next);
    setIndexEntries(loadIndex().workspaces);
    setSelectedNodeId(null);
    setWorkflowValidator(null);
    setGraphEpoch((e) => e + 1);
    setNavConsumedKey(location.key);
    navigate('/app', { replace: true, state: null });
  }, [location.key, locationState, navConsumedKey, navigate]);

  // Clear history state after first paint if we already consumed intent in useState
  useEffect(() => {
    if (locationState && (locationState.openGuidedDemo || locationState.blankWorkspace || locationState.loadTemplate)) {
      navigate('/app', { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const patchWorkspace = (
    patch: Partial<WorkspaceDocument> | ((current: WorkspaceDocument) => WorkspaceDocument),
    historyGroup: string | false = 'mutation',
  ) => {
    setWorkspace((current) => {
      const next = typeof patch === 'function' ? patch(current) : { ...current, ...patch };
      if (historyGroup !== false) { historyRef.current.record(next, historyGroup); setHistoryVersion((v) => v + 1); }
      return next;
    });
  };

  const applyHistoryWorkspace = (next: WorkspaceDocument) => {
    restoringHistoryRef.current = true;
    setWorkspace(next);
    setGraphEpoch((value) => value + 1);
    setHistoryVersion((value) => value + 1);
    window.setTimeout(() => { restoringHistoryRef.current = false; }, 500);
  };

  const replaceGraph = (next: Partial<WorkspaceDocument> & { nodes: AppNode[]; edges?: WorkspaceDocument['edges'] }) => {
    patchWorkspace((current) => ({
      ...current,
      ...next,
      edges: next.edges ?? current.edges,
    }));
    setGraphEpoch((e) => e + 1);
  };

  const handleUpdateNode = (id: string, data: Partial<AppNode['data']>) => {
    patchWorkspace((current) => ({
      ...current,
      nodes: current.nodes.map((node) => (node.id === id ? { ...node, data: { ...node.data, ...data } } : node)),
    }), `node:${id}`);
    setGraphEpoch((e) => e + 1);
  };

  const handleDeleteNode = (id: string) => {
    replaceGraph({
      nodes: workspace.nodes.filter((node) => node.id !== id),
      edges: workspace.edges.filter((edge) => edge.source !== id && edge.target !== id),
    });
    setSelectedNodeId((current) => (current === id ? null : current));
  };

  const handleCanvasNodesChange = (canvasNodes: AppNode[]) => {
    if (restoringHistoryRef.current) return;
    setWorkspace((current) => {
      if (JSON.stringify(canvasNodes) === JSON.stringify(current.nodes)) return current;
      const next = { ...current, nodes: canvasNodes };
      historyRef.current.record(next, 'canvas');
      setHistoryVersion((value) => value + 1);
      return next;
    });
  };
  const handleAutoLayout = () => replaceGraph({ nodes: autoLayoutNodes(workspace.nodes, workspace.edges) });

  const handleCanvasEdgesChange = (canvasEdges: WorkspaceDocument['edges']) => {
    if (restoringHistoryRef.current) return;
    setWorkspace((current) => {
      if (JSON.stringify(canvasEdges) === JSON.stringify(current.edges)) return current;
      const next = { ...current, edges: canvasEdges };
      historyRef.current.record(next, 'canvas');
      setHistoryVersion((value) => value + 1);
      return next;
    });
  };

  const handleAddNode = (type: NodeType) => {
    const nextNode = createNode(type, workspace.nodes.length);
    replaceGraph({
      nodes: [...workspace.nodes, nextNode],
    });
    // React Flow emits an empty selection update after a palette insert; retain the useful inspector selection.
    pendingPaletteSelectionRef.current = nextNode.id;
    setSelectedNodeId(nextNode.id);
  };

  const handleClear = () => {
    setConfirmation({ title: 'Clear current canvas?', description: 'Nodes, connections, source material, and the draft will be removed. Named snapshots remain available.', label: 'Clear canvas', destructive: true, action: () => {
    replaceGraph({
      nodes: [],
      edges: [],
      sourceMaterial: '',
      deliverableDraft: undefined,
      meta: {
        ...workspace.meta,
        appliedSourceFingerprint: '',
        sourceSyncStatus: 'in_sync',
      },
    });
    setWorkflowValidator(null);
    setSelectedNodeId(null);
    } });
  };

  const handlePortabilityReload = () => {
    const active = getActiveWorkspace();
    if (active) {
      setWorkspace(active);
    } else {
      setWorkspace(createWorkspace({ name: 'Blank workspace', nodes: [], edges: [] }));
    }
    setIndexEntries(loadIndex().workspaces);
    setWorkflowValidator(null);
    setSelectedNodeId(null);
    setClearSignal((s) => s + 1);
    setGraphEpoch((e) => e + 1);
  };

  const handleResetDemo = () => {
    const openDemo = () => {
    const intentId = createId('intent');
    const next = resolveWorkspaceFromNav({ openGuidedDemo: true, intentId });
    if (!next) return;
    setWorkspace(next);
    setIndexEntries(loadIndex().workspaces);
    setWorkflowValidator(null);
    setSelectedNodeId(null);
    setGraphEpoch((e) => e + 1);
    };
    if (workspace.name !== 'Guided demo') {
      setConfirmation({ title: 'Open guided demo?', description: 'This will replace the current workspace in the canvas. Your existing workspace remains saved locally and can be reopened from the workspace menu.', label: 'Open guided demo', action: openDemo });
      return;
    }
    openDemo();
  };

  const handleRestoreSnapshot = (snapshot: VersionSnapshot) => {
    const checkpoint = saveRecoverySnapshot(`Recovery before restoring ${snapshot.title}`, workspace);
    if (checkpoint.result.status !== 'saved') { setNotice(checkpoint.result.error ?? 'Could not save recovery checkpoint. Restore cancelled.'); return; }
    const { workspace: restored, legacyIncomplete } = applySnapshotToWorkspace(workspace, snapshot);
    setWorkspace(restored);
    setWorkflowValidator(null);
    setSelectedNodeId(null);
    setGraphEpoch((e) => e + 1);
    setClearSignal((s) => s + 1);
    if (legacyIncomplete) {
      setNotice(
        'Restored a legacy snapshot (nodes and edges only). The deliverable draft was cleared — regenerate before export so it matches the canvas.',
      );
    }
  };

  const handleWorkflowValidator = () => {
    setWorkflowValidator(buildWorkflowValidator(nodes, edges));
  };

  const handleApplyToInput = () => {
    const apply = () => {
      const nextNodes = applySourceToInputNode(workspace.nodes, workspace.sourceMaterial);
      replaceGraph({ nodes: nextNodes, meta: { ...workspace.meta, appliedSourceFingerprint: workspace.sourceMaterial, sourceSyncStatus: 'in_sync' } });
    };
    if (willOverwriteInputContent(workspace.nodes, workspace.sourceMaterial)) {
      setConfirmation({ title: 'Replace Input node content?', description: 'Only the Input node will be updated from the source panel. Other nodes, connections, and positions stay unchanged.', label: 'Apply source', action: apply });
      return;
    }

    apply();
  };

  const handleSplitIntoNodes = () => {
    if (!workspace.sourceMaterial.trim()) {
      setNotice('Paste source material first.');
      return;
    }

    const derived = countDerivedNodes(workspace.nodes);
    let replaceDerived = false;

    if (derived > 0) {
      setConfirmation({ title: 'Replace derived nodes?', description: `There are ${derived} derived node(s). This creates a fresh split from the source panel.`, label: 'Replace derived nodes', destructive: true, action: () => {
        const result = splitSourceIntoNodes(workspace.sourceMaterial, workspace.nodes, workspace.edges, { replaceDerived: true });
        replaceGraph({ nodes: result.nodes, edges: result.edges, meta: { ...workspace.meta, appliedSourceFingerprint: workspace.sourceMaterial, sourceSyncStatus: 'in_sync' } });
      } });
      if (window.location.hash === '#legacy-split-flow') {
      const replace = Boolean(
        `Split into nodes can restructure derived canvas content.\n\n` +
          `There are currently ${derived} transform/decision/AI node(s).\n\n` +
          `OK = REPLACE those derived nodes with a fresh split from the source panel (Input content also updates).\n` +
          `Cancel = choose append-only or abort next.`,
      );
      if (!replace) {
        const append = Boolean(
          'Append split nodes without removing existing derived nodes?\n\n' +
            'OK = append new nodes from source (Input content updates; existing derived nodes stay).\n' +
            'Cancel = do nothing — canvas is preserved.',
        );
        if (!append) return;
        replaceDerived = false;
      } else {
        replaceDerived = true;
      }
    }
    }

    const result = splitSourceIntoNodes(workspace.sourceMaterial, workspace.nodes, workspace.edges, {
      replaceDerived,
    });

    replaceGraph({
      nodes: result.nodes,
      edges: result.edges,
      meta: {
        ...workspace.meta,
        appliedSourceFingerprint: workspace.sourceMaterial,
        sourceSyncStatus: 'in_sync',
      },
    });
  };

  const applyTemplate = (templateId: string, mode: 'replace' | 'merge') => {
    const tpl = getTemplateById(resolveTemplateId(templateId) ?? templateId);
    if (!tpl) return;

    if (mode === 'replace') {
      const source = tpl.nodes.find((n) => n.type === 'input')?.data.content || tpl.messyInputSample || '';
      replaceGraph({
        templateId: tpl.id,
        name: workspace.name.startsWith(tpl.title) ? workspace.name : tpl.title,
        nodes: structuredClone(tpl.nodes),
        edges: structuredClone(tpl.edges),
        sourceMaterial: source,
        deliverableDraft: undefined,
        meta: {
          ...workspace.meta,
          appliedSourceFingerprint: source,
          sourceSyncStatus: 'in_sync',
        },
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
      replaceGraph({
        nodes: [...nodes, ...newNodes],
        edges: [...edges, ...newEdges],
        templateId: workspace.templateId ?? tpl.id,
      });
    }

    setWorkflowValidator(null);
    setSelectedNodeId(null);
    setPendingTemplateId(null);
  };

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;

  const switchWorkspace = (id: string) => {
    const next = loadWorkspaceById(id);
    if (!next) return;
    setActiveWorkspaceId(id);
    setWorkspace(next);
    historyRef.current.reset(next);
    setHistoryVersion((v) => v + 1);
    setSelectedNodeId(null);
    setWorkflowValidator(null);
    setGraphEpoch((e) => e + 1);
  };

  const removeWorkspace = () => {
    deleteWorkspace(workspace.id);
    const index = loadIndex();
    const next = index.activeWorkspaceId ? loadWorkspaceById(index.activeWorkspaceId) : null;
    setWorkspace(next ?? createWorkspace({ name: 'Blank workspace', nodes: [], edges: [] }));
    setIndexEntries(loadIndex().workspaces);
    setGraphEpoch((e) => e + 1);
  };

  // The listener intentionally refreshes from document state so keyboard commands use the active selection.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTextField = Boolean(target?.matches('input, textarea, select, [contenteditable="true"]'));
      if (!event.ctrlKey && !event.metaKey && !isTextField && !target?.matches('button') && (event.key === 'Delete' || event.key === 'Backspace') && selectedNodeId) {
        event.preventDefault();
        handleDeleteNode(selectedNodeId);
        return;
      }
      if (isTextField) return;
      if (!(event.ctrlKey || event.metaKey)) return;
      const redo = event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey);
      const undo = event.key.toLowerCase() === 'z' && !event.shiftKey;
      if (!undo && !redo) return;
      const next = redo ? historyRef.current.redo() : historyRef.current.undo();
      if (next) { event.preventDefault(); applyHistoryWorkspace(next); }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [selectedNodeId, workspace.nodes, workspace.edges]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-auto lg:overflow-hidden relative min-h-0 h-full">
      <NodePalette onAddNode={handleAddNode} />

      <div className="flex-1 flex flex-col relative min-h-[560px] lg:min-h-0 min-w-0">
        <div className="relative z-10 flex flex-col gap-2 px-3 pt-3 pointer-events-none">
          <div className="flex flex-col xl:flex-row gap-2 justify-between items-start xl:items-center">
            <WorkspaceManager
              workspaces={indexEntries}
              activeId={workspace.id}
              workspaceName={workspace.name}
              onSelect={switchWorkspace}
              onRename={(name) => patchWorkspace({ name })}
              onCreate={() => {
                const next = createWorkspace({ name: 'Untitled workspace', nodes: [], edges: [] });
                setWorkspace(next);
                setIndexEntries(loadIndex().workspaces);
                setSelectedNodeId(null);
                setGraphEpoch((e) => e + 1);
              }}
              onDuplicate={() => {
                const copy = duplicateWorkspace(workspace.id);
                if (!copy) return;
                setWorkspace(copy);
                setIndexEntries(loadIndex().workspaces);
                setGraphEpoch((e) => e + 1);
              }}
              onDelete={() => {
                setConfirmation({ title: `Delete “${workspace.name}”?`, description: 'This removes the workspace and its snapshots from this browser. Export a backup first if you may need it later.', label: 'Delete workspace', destructive: true, action: removeWorkspace });
                if (window.location.hash === '#legacy-delete-flow') {
                deleteWorkspace(workspace.id);
                const index = loadIndex();
                const next = index.activeWorkspaceId ? loadWorkspaceById(index.activeWorkspaceId!) : null;
                if (next) {
                  setWorkspace(next!);
                } else {
                  setWorkspace(createWorkspace({ name: 'Blank workspace', nodes: [], edges: [] }));
                }
                setIndexEntries(loadIndex().workspaces);
                setGraphEpoch((e) => e + 1);
                }
              }}
            />
            <div className="pointer-events-auto flex flex-wrap items-center gap-2">
              <SaveStatusChip status={saveStatus} error={saveError} workspaceName={workspace.name} />
              <button type="button" onClick={() => setMobilePanel('inspector')} className="lg:hidden bg-panel border border-border px-3 py-2 rounded-lg text-sm" aria-label="Open inspector">Inspector</button>
              <button type="button" onClick={() => setMobilePanel('snapshots')} className="lg:hidden bg-panel border border-border px-3 py-2 rounded-lg text-sm" aria-label="Open snapshots">Snapshots</button>
              <button type="button" onClick={() => setShowOutline(true)} className="bg-panel border border-border px-3 py-2 rounded-lg text-sm" aria-label="Workflow outline" title="Open a keyboard-friendly workflow outline"><ListTree className="h-4 w-4 sm:mr-1 inline" /><span className="hidden sm:inline">Outline</span></button>
              <button type="button" onClick={handleAutoLayout} className="bg-panel border border-border px-3 py-2 rounded-lg text-sm" aria-label="Auto-layout workflow" title="Arrange nodes by workflow connections"><LayoutDashboard className="h-4 w-4 sm:mr-1 inline" /><span className="hidden sm:inline">Auto-layout</span></button>
              <button type="button" onClick={() => { const next = historyRef.current.undo(); if (next) applyHistoryWorkspace(next); }} disabled={!historyRef.current.canUndo()} className="bg-panel border border-border p-2 rounded-lg disabled:opacity-40" aria-label="Undo" title="Undo (Ctrl/Cmd+Z)"><Undo2 className="w-4 h-4" /></button>
              <button type="button" onClick={() => { const next = historyRef.current.redo(); if (next) applyHistoryWorkspace(next); }} disabled={!historyRef.current.canRedo()} className="bg-panel border border-border p-2 rounded-lg disabled:opacity-40" aria-label="Redo" title="Redo (Ctrl/Cmd+Shift+Z)"><Redo2 className="w-4 h-4" /></button>
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
                <li>Apply to Input or Split into nodes (confirms before overwriting).</li>
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
              <button type="button" className="ml-3 text-xs text-blue-300 hover:text-white underline" onClick={() => setShowTour(true)}>Start guided tour</button>
            </div>
          )}
          <OnboardingChecklist hasSource={Boolean(workspace.sourceMaterial.trim())} hasNodes={workspace.nodes.length > 0} validated={Boolean(workflowValidator)} onOpenTemplates={() => navigate('/templates')} />
        </div>

        <div className="shrink-0">
          <SourceIngestPanel
            sourceMaterial={workspace.sourceMaterial}
            inputInstructions={template?.inputInstructions}
            sample={template?.messyInputSample}
            syncStatus={syncStatus}
            onChange={(value) =>
              patchWorkspace({
                sourceMaterial: value,
                meta: {
                  ...workspace.meta,
                  sourceSyncStatus: computeSourceSyncStatus(
                    value,
                    workspace.nodes,
                    typeof workspace.meta?.appliedSourceFingerprint === 'string'
                      ? workspace.meta.appliedSourceFingerprint
                      : undefined,
                  ),
                },
              }, 'source')
            }
            onUseSample={() => {
              if (!template?.messyInputSample) return;
              patchWorkspace({
                sourceMaterial: template.messyInputSample,
                meta: {
                  ...workspace.meta,
                  sourceSyncStatus: 'source_ahead',
                },
              }, 'source');
            }}
            onApplyToInput={handleApplyToInput}
            onSplitIntoNodes={handleSplitIntoNodes}
          />
        </div>

        <div className="flex-1 min-h-[480px] lg:min-h-0 w-full">
          <WorkflowCanvas
            workspaceId={workspace.id}
            graphEpoch={graphEpoch}
            nodes={nodes}
            edges={edges}
            initialViewport={workspace.viewport}
            onNodesChange={handleCanvasNodesChange}
            onEdgesChange={handleCanvasEdgesChange}
            onNodeSelect={(node) => {
              if (!node && pendingPaletteSelectionRef.current) return;
              pendingPaletteSelectionRef.current = null;
              setSelectedNodeId(node?.id ?? null);
            }}
            onViewportChange={(viewport) =>
              patchWorkspace({
                viewport: { x: viewport.x, y: viewport.y, zoom: viewport.zoom },
              }, false)
            }
          />
        </div>
      </div>

      <div className="hidden lg:contents"><NodeInspector selectedNode={selectedNode} onUpdate={handleUpdateNode} onDelete={handleDeleteNode} onAddInput={() => handleAddNode('input')} /><VersionHistory workspace={workspace} clearSignal={clearSignal} onRestore={handleRestoreSnapshot} /></div>

      {mobilePanel && <AccessibleDialog label={mobilePanel === 'inspector' ? 'Inspector' : 'Snapshots'} onClose={() => setMobilePanel(null)} className="mx-auto flex h-full max-w-xl flex-col overflow-hidden rounded-xl border border-border bg-panel shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3"><h2 className="font-semibold">{mobilePanel === 'inspector' ? 'Inspector' : 'Snapshots'}</h2><button type="button" onClick={() => setMobilePanel(null)} aria-label={`Close ${mobilePanel === 'inspector' ? 'inspector' : 'snapshots'}`} className="rounded p-2"><X className="w-5 h-5" /></button></div>
          <div className="min-h-0 flex-1 overflow-y-auto">{mobilePanel === 'inspector' ? <NodeInspector selectedNode={selectedNode} onUpdate={handleUpdateNode} onDelete={handleDeleteNode} onAddInput={() => handleAddNode('input')} /> : <VersionHistory workspace={workspace} clearSignal={clearSignal} onRestore={handleRestoreSnapshot} />}</div>
      </AccessibleDialog>}

      {showOutline && <AccessibleDialog label="Workflow outline" onClose={() => setShowOutline(false)} className="h-full w-full max-w-lg overflow-hidden rounded-xl border border-border bg-panel shadow-2xl"><WorkflowOutline workspace={workspace} selectedNodeId={selectedNodeId} onSelect={(node) => { setSelectedNodeId(node.id); setShowOutline(false); }} onClose={() => setShowOutline(false)} /></AccessibleDialog>}

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
      {notice && <div role="status" className="fixed bottom-4 left-1/2 z-[80] -translate-x-1/2 rounded-lg border border-blue-500/40 bg-panel px-4 py-3 text-sm text-blue-100 shadow-xl">{notice}<button type="button" className="ml-3 underline" onClick={() => setNotice(null)}>Dismiss</button></div>}
      {showTour && <GuidedTour onClose={() => setShowTour(false)} />}
      <ConfirmDialog open={Boolean(confirmation)} title={confirmation?.title ?? ''} description={confirmation?.description ?? ''} confirmLabel={confirmation?.label ?? 'Confirm'} destructive={confirmation?.destructive} onCancel={() => setConfirmation(null)} onConfirm={() => { const action = confirmation?.action; setConfirmation(null); action?.(); }} />
    </div>
  );
};
