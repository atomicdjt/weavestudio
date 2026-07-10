import { useCallback, useEffect, useRef } from 'react';
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type NodeTypes,
  type OnSelectionChangeFunc,
  type ReactFlowInstance,
  type Viewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from './nodes/nodeTypes';
import type { AppEdge, AppNode, NodeType } from '../../types';
import { createId } from '../../lib/ids';

/**
 * State ownership:
 * - Parent (WorkspacePage) is authoritative for workspace document nodes/edges data.
 * - Canvas holds React Flow interaction state and syncs from parent when `graphEpoch` changes.
 * - Viewport is preserved across ordinary updates; fitView only on first mount of a workspace.
 * - Do NOT remount this tree for source apply / node data edits — bump graphEpoch instead.
 */
interface WorkflowCanvasProps {
  nodes: AppNode[];
  edges: AppEdge[];
  /** Bump when parent applies an external graph replacement (not every keystroke). */
  graphEpoch: number;
  workspaceId: string;
  onNodesChange: (nodes: AppNode[]) => void;
  onEdgesChange: (edges: AppEdge[]) => void;
  onNodeSelect: (node: AppNode | null) => void;
  onViewportChange?: (viewport: Viewport) => void;
  initialViewport?: { x: number; y: number; zoom: number };
}

const getDefaultNodeData = (type: NodeType): AppNode['data'] => {
  if (type === 'aiAssist') {
    return {
      title: 'New AI Assist Blueprint',
      description: 'Optional BYOK AI step. Live network calls require explicit consent.',
      content: 'Blueprint only by default. Use Mock offline, or allow a network call to run a provider.',
      status: 'pending',
      promptInstruction: '',
      expectedInput: '',
      expectedOutput: '',
      providerNote: 'Requires a user-supplied key or local Ollama. No bundled API keys. Live calls are gated.',
      reviewRequired: true,
    };
  }

  return {
    title: `New ${type.charAt(0).toUpperCase()}${type.slice(1)}`,
    description: '',
    content: '',
    status: 'pending',
    ...(type === 'review' ? { reviewRequired: true } : {}),
  };
};

const WorkflowCanvasInner = ({
  nodes: parentNodes,
  edges: parentEdges,
  graphEpoch,
  workspaceId,
  onNodesChange,
  onEdgesChange,
  onNodeSelect,
  onViewportChange,
  initialViewport,
}: WorkflowCanvasProps) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const rfInstanceRef = useRef<ReactFlowInstance<AppNode, AppEdge> | null>(null);
  const lastEpochRef = useRef<number | null>(null);
  const lastWorkspaceIdRef = useRef<string | null>(null);
  const applyingExternalRef = useRef(false);

  const [nodes, setNodes, onNodesChangeInternal] = useNodesState<AppNode>(parentNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState<AppEdge>(parentEdges);

  const onNodesChangeRef = useRef(onNodesChange);
  onNodesChangeRef.current = onNodesChange;
  const onEdgesChangeRef = useRef(onEdgesChange);
  onEdgesChangeRef.current = onEdgesChange;

  // Push interaction updates upward (skip while applying external graph)
  useEffect(() => {
    if (applyingExternalRef.current) return;
    onNodesChangeRef.current(nodes);
  }, [nodes]);

  useEffect(() => {
    if (applyingExternalRef.current) return;
    onEdgesChangeRef.current(edges);
  }, [edges]);

  // External graph sync without remount — only when epoch/workspace changes (not every parent render)
  useEffect(() => {
    const workspaceChanged = lastWorkspaceIdRef.current !== workspaceId;
    const epochChanged = lastEpochRef.current !== graphEpoch;

    if (!workspaceChanged && !epochChanged && lastEpochRef.current !== null) {
      return;
    }

    applyingExternalRef.current = true;
    setNodes(structuredClone(parentNodes));
    setEdges(structuredClone(parentEdges));
    lastEpochRef.current = graphEpoch;
    lastWorkspaceIdRef.current = workspaceId;

    // fitView only when switching workspace, not on every source apply
    if (workspaceChanged && rfInstanceRef.current) {
      requestAnimationFrame(() => {
        rfInstanceRef.current?.fitView({ padding: 0.25 });
        applyingExternalRef.current = false;
      });
    } else {
      requestAnimationFrame(() => {
        applyingExternalRef.current = false;
      });
    }
    // parentNodes/parentEdges read from the render that bumped graphEpoch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphEpoch, workspaceId, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((current) => addEdge(params, current)),
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!reactFlowWrapper.current || !rfInstanceRef.current) return;

      const type = event.dataTransfer.getData('application/reactflow') as NodeType;
      if (!type) return;

      const position = rfInstanceRef.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: AppNode = {
        id: createId('node'),
        type,
        position,
        data: getDefaultNodeData(type),
      };

      setNodes((current) => [...current, newNode]);
    },
    [setNodes],
  );

  const onSelectionChange = useCallback<OnSelectionChangeFunc<AppNode>>(
    ({ nodes: selected }) => {
      onNodeSelect(selected.length === 1 ? selected[0] : null);
    },
    [onNodeSelect],
  );

  return (
    <div className="w-full h-full" ref={reactFlowWrapper} data-testid="workflow-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeInternal}
        onEdgesChange={onEdgesChangeInternal}
        onConnect={onConnect}
        onInit={(instance) => {
          rfInstanceRef.current = instance;
          if (initialViewport) {
            instance.setViewport(initialViewport);
          } else {
            instance.fitView({ padding: 0.25 });
          }
        }}
        onMoveEnd={(_, viewport) => onViewportChange?.(viewport)}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes as NodeTypes}
        onSelectionChange={onSelectionChange}
        proOptions={{ hideAttribution: true }}
        className="bg-canvas"
        minZoom={0.15}
        maxZoom={2}
        defaultViewport={initialViewport}
      >
        <Background color="#27272a" gap={20} />
        <Controls className="bg-panel border-border fill-gray-400" />
      </ReactFlow>
    </div>
  );
};

/** Stable provider — never key-remount for ordinary edits */
export const WorkflowCanvas = (props: WorkflowCanvasProps) => (
  <ReactFlowProvider>
    <WorkflowCanvasInner {...props} />
  </ReactFlowProvider>
);
