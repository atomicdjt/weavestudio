import type { Node, Edge } from '@xyflow/react';

export type NodeType = 'input' | 'transform' | 'decision' | 'review' | 'aiAssist' | 'output';

/** Semantic content classification for deliverable composition */
export type NodeCategory =
  | 'source'
  | 'evidence'
  | 'action'
  | 'risk'
  | 'decision'
  | 'conclusion'
  | 'open_question'
  | 'output'
  | 'other';

export interface NodeData extends Record<string, unknown> {
  title: string;
  description: string;
  content: string;
  status?: 'pending' | 'running' | 'complete' | 'needs_review' | 'warning' | 'incomplete' | 'ready';
  category?: NodeCategory;
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

export const WORKSPACE_SCHEMA_VERSION = 1 as const;
export const TEMPLATE_SCHEMA_VERSION = 1 as const;

export interface DeliverableDraft {
  title: string;
  markdown: string;
  userEdited: boolean;
}

export interface WorkspaceDocument {
  schemaVersion: typeof WORKSPACE_SCHEMA_VERSION;
  id: string;
  name: string;
  templateId: string | null;
  createdAt: string;
  updatedAt: string;
  sourceMaterial: string;
  nodes: AppNode[];
  edges: AppEdge[];
  deliverableDraft?: DeliverableDraft;
  viewport?: { x: number; y: number; zoom: number };
  meta?: Record<string, unknown>;
}

export interface WorkspaceIndexEntry {
  id: string;
  name: string;
  updatedAt: string;
  templateId: string | null;
}

export interface WorkspaceIndex {
  schemaVersion: typeof WORKSPACE_SCHEMA_VERSION;
  activeWorkspaceId: string | null;
  workspaces: WorkspaceIndexEntry[];
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'quota';

export interface SectionDef {
  id: string;
  title: string;
  /** Prefer nodes matching these categories */
  categories?: NodeCategory[];
  /** Prefer nodes matching these types */
  nodeTypes?: NodeType[];
  /** Prefer specific starter node ids */
  nodeIds?: string[];
  guidance?: string;
  required?: boolean;
}

export interface TemplateStage {
  id: string;
  title: string;
  guidance: string;
  recommendedNodeTypes: NodeType[];
}

export interface TemplateOutputStructure {
  title: string;
  requiredSections: SectionDef[];
  optionalSections: SectionDef[];
}

export interface TemplateExportBehavior {
  defaultFilenameStem: string;
  includeProcessAppendix: boolean;
}

export interface WorkflowTemplate {
  schemaVersion: typeof TEMPLATE_SCHEMA_VERSION;
  id: string;
  title: string;
  description: string;
  idealUser: string;
  inputInstructions: string;
  messyInputSample: string;
  expectedOutputType: string;
  valueProposition: string;
  stages: TemplateStage[];
  nodes: AppNode[];
  edges: AppEdge[];
  outputStructure: TemplateOutputStructure;
  completionCriteria: string[];
  exportBehavior: TemplateExportBehavior;
  /** Primary gallery vs expandable legacy pack */
  pack: 'primary' | 'legacy';
}

/** @deprecated Use WorkflowTemplate; kept for migration typing of old shapes */
export interface LegacyWorkflowTemplate {
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
  workspaceId?: string;
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

/** Portable project file (.weavestudio.json) */
export interface ProjectExportFile {
  format: 'weavestudio-project';
  formatVersion: 1;
  exportedAt: string;
  workspace: WorkspaceDocument;
}
