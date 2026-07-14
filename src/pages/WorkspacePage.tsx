import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ClipboardCheck, Database, Eye, Redo2, RotateCcw, Trash2, Undo2 } from 'lucide-react';
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
  const [, setHistoryVersion] = useState(0);
  const [indexEntries, setIndexEntries] = useState(() => loadIndex().workspaces);
  /** Bumped only for external graph replacements / workspace switches — not for pan or source panel typing */
  const [graphEpoch, setGraphEpoch] = useState(0);
  const [clearSignal, setClearSignal] = useState(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const pendingPaletteSelectionRef = useRef<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
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
    patchWorkspace({ nodes: canvasNodes }, 'canvas');
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
    const intentId = createId('intent');
    const next = resolveWorkspaceFromNav({ openGuidedDemo: true, intentId });
    if (!next) return;
    setWorkspace(next);
    setIndexEntries(loadIndex().workspaces);
    setWorkflowValidator(null);
    setSelectedNodeId(null);
    setGraphEpoch((e) => e + 1);
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
    if (willOverwriteInputContent(workspace.nodes, workspace.sourceMaterial)) {
      const ok = confirm(
        'Apply to Input node will replace the current Input node content with the source panel text.\n\n' +
          'Other nodes, edges, and positions are not changed.\n\n' +
          'Cancel keeps the canvas as-is. OK updates only the Input node.',
      );
      if (!ok) return;
    }

    const nextNodes = applySourceToInputNode(workspace.nodes, workspace.sourceMaterial);
    replaceGraph({
      nodes: nextNodes,
      meta: {
        ...workspace.meta,
        appliedSourceFingerprint: workspace.sourceMaterial,
        sourceSyncStatus: 'in_sync',
      },
    });
  };

  const handleSplitIntoNodes = () => {
    if (!workspace.sourceMaterial.trim()) {
      setNotice('Paste source material first.');
      return;
    }

    const derived = countDerivedNodes(workspace.nodes);
    let replaceDerived = false;

    if (derived > 0) {
      const replace = confirm(
        `Split into nodes can restructure derived canvas content.\n\n` +
          `There are currently ${derived} transform/decision/AI node(s).\n\n` +
          `OK = REPLACE those derived nodes with a fresh split from the source panel (Input content also updates).\n` +
          `Cancel = choose append-only or abort next.`,
      );
      if (!replace) {
        const append = confirm(
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, [contenteditable="true"]') || !(event.ctrlKey || event.metaKey)) return;
      const redo = event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey);
      const undo = event.key.toLowerCase() === 'z' && !event.shiftKey;
      if (!undo && !redo) return;
      const next = redo ? historyRef.current.redo() : historyRef.current.undo();
      if (next) { event.preventDefault(); setWorkspace(next); setGraphEpoch((value) => value + 1); setHistoryVersion((value) => value + 1); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

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
                setGraphEpoch((e) => e + 1);
              }}
            />
            <div className="pointer-events-auto flex flex-wrap items-center gap-2">
              <SaveStatusChip status={saveStatus} error={saveError} workspaceName={workspace.name} />
              <button type="button" onClick={() => { const next = historyRef.current.undo(); if (next) { setWorkspace(next); setGraphEpoch((v) => v + 1); setHistoryVersion((v) => v + 1); } }} disabled={!historyRef.current.canUndo()} className="bg-panel border border-border p-2 rounded-lg disabled:opacity-40" aria-label="Undo" title="Undo (Ctrl/Cmd+Z)"><Undo2 className="w-4 h-4" /></button>
              <button type="button" onClick={() => { const next = historyRef.current.redo(); if (next) { setWorkspace(next); setGraphEpoch((v) => v + 1); setHistoryVersion((v) => v + 1); } }} disabled={!historyRef.current.canRedo()} className="bg-panel border border-border p-2 rounded-lg disabled:opacity-40" aria-label="Redo" title="Redo (Ctrl/Cmd+Shift+Z)"><Redo2 className="w-4 h-4" /></button>
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
            onEdgesChange={(nextEdges) => patchWorkspace({ edges: nextEdges })}
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

      <NodeInspector selectedNode={selectedNode} onUpdate={handleUpdateNode} onDelete={handleDeleteNode} />
      <VersionHistory workspace={workspace} clearSignal={clearSignal} onRestore={handleRestoreSnapshot} />

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
      <ConfirmDialog open={Boolean(confirmation)} title={confirmation?.title ?? ''} description={confirmation?.description ?? ''} confirmLabel={confirmation?.label ?? 'Confirm'} destructive={confirmation?.destructive} onCancel={() => setConfirmation(null)} onConfirm={() => { const action = confirmation?.action; setConfirmation(null); action?.(); }} />
    </div>
  );
};
