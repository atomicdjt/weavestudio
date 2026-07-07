import type { Node, Edge } from '@xyflow/react';

export type NodeType = 'input' | 'transform' | 'decision' | 'review' | 'aiAssist' | 'output';

export interface NodeData extends Record<string, unknown> {
  title: string;
  description: string;
  content: string;
  status?: 'pending' | 'running' | 'complete' | 'needs_review' | 'warning' | 'incomplete' | 'ready';
  reviewRequired?: boolean;
  provider?: 'openai' | 'ollama';
  baseUrl?: string;
  modelName?: string;
  promptInstruction?: string;
  expectedInput?: string;
  expectedOutput?: string;
  providerNote?: string;
}

export type AppNode = Node<NodeData, NodeType>;
export type AppEdge = Edge;

export interface WorkflowTemplate {
  id: string;
  title: string;
  description: string;
  idealUser: string;
  messyInputSample: string;
  expectedOutputType: string;
  valueProposition: string;
  nodes: AppNode[];
  edges: AppEdge[];
}

export interface VersionSnapshot {
  id: string;
  timestamp: number;
  title: string;
  nodes: AppNode[];
  edges: AppEdge[];
}

export type workflowValidatorStatus = 'Ready' | 'Needs Review' | 'Incomplete' | 'Warning';

export interface workflowValidatorIssue {
  id: string;
  status: workflowValidatorStatus;
  title: string;
  detail: string;
  suggestedFix: string;
  nodeId?: string;
}

export interface workflowValidatorStep {
  nodeId: string;
  stepNumber: number;
  type: NodeType;
  title: string;
  action: string;
  requiresReview: boolean;
  status: workflowValidatorStatus;
}

export interface WorkflowValidatorResult {
  completenessScore: number;
  issueCount: number;
  exportReadiness: workflowValidatorStatus;
  issues: workflowValidatorIssue[];
  walkthrough: workflowValidatorStep[];
}
