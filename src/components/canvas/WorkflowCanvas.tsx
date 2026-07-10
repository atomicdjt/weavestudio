import React, { useCallback, useEffect, useRef } from 'react';
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import type {
  Connection,
  Edge,
  NodeTypes,
  OnSelectionChangeFunc,
  ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from './nodes/nodeTypes';
import type { AppEdge, AppNode, NodeType } from '../../types';

interface WorkflowCanvasProps {
  initialNodes: AppNode[];
  initialEdges: AppEdge[];
  canvasKey?: number;
  nodeDataOverrides?: Record<string, Partial<AppNode['data']>>;
  onNodesChange: (nodes: AppNode[]) => void;
  onEdgesChange: (edges: AppEdge[]) => void;
  onNodeSelect: (node: AppNode | null) => void;
}

const getId = () => `node_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

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
  initialNodes,
  initialEdges,
  nodeDataOverrides = {},
  onNodesChange,
  onEdgesChange,
  onNodeSelect,
}: Omit<WorkflowCanvasProps, 'canvasKey'>) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const rfInstanceRef = useRef<ReactFlowInstance<AppNode, AppEdge> | null>(null);

  const [nodes, setNodes, onNodesChangeInternal] = useNodesState<AppNode>(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState<AppEdge>(initialEdges);

  const onNodesChangeRef = useRef(onNodesChange);
  onNodesChangeRef.current = onNodesChange;
  const onEdgesChangeRef = useRef(onEdgesChange);
  onEdgesChangeRef.current = onEdgesChange;

  useEffect(() => {
    onNodesChangeRef.current(nodes);
  }, [nodes]);

  useEffect(() => {
    onEdgesChangeRef.current(edges);
  }, [edges]);

  useEffect(() => {
    if (Object.keys(nodeDataOverrides).length === 0) return;
    setNodes((current) =>
      current.map((node) =>
        nodeDataOverrides[node.id]
          ? { ...node, data: { ...node.data, ...nodeDataOverrides[node.id] } }
          : node,
      ),
    );
  }, [nodeDataOverrides, setNodes]);

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
        id: getId(),
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
    <div className="w-full h-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeInternal}
        onEdgesChange={onEdgesChangeInternal}
        onConnect={onConnect}
        onInit={(instance) => {
          rfInstanceRef.current = instance;
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes as NodeTypes}
        onSelectionChange={onSelectionChange}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
        className="bg-canvas"
        minZoom={0.15}
        maxZoom={2}
      >
        <Background color="#27272a" gap={20} />
        <Controls className="bg-panel border-border fill-gray-400" />
      </ReactFlow>
    </div>
  );
};

export const WorkflowCanvas = ({ canvasKey = 0, ...props }: WorkflowCanvasProps) => (
  <ReactFlowProvider key={canvasKey}>
    <WorkflowCanvasInner {...props} />
  </ReactFlowProvider>
);
