/**
 * Compatibility facade over workspaceStore.
 * Prefer importing from workspaceStore for new code.
 */
import type { AppEdge, AppNode, VersionSnapshot } from '../types';
import { TEMPLATES, getTemplateById } from '../data/templates';
import {
  clearAllLocalData as clearAll,
  deleteSnapshot,
  getActiveWorkspace,
  getSnapshots,
  saveSnapshot,
  saveWorkspaceDocument,
} from './workspaceStore';

export { clearAll as clearAllLocalData };

export const saveWorkspace = (nodes: AppNode[], edges: AppEdge[]) => {
  const active = getActiveWorkspace();
  if (!active) return;
  saveWorkspaceDocument({ ...active, nodes, edges });
};

export const loadWorkspace = (): { nodes: AppNode[]; edges: AppEdge[] } | null => {
  const active = getActiveWorkspace();
  if (!active || active.nodes.length === 0) return null;
  return { nodes: active.nodes, edges: active.edges };
};

export const clearWorkspace = () => {
  const active = getActiveWorkspace();
  if (!active) return;
  saveWorkspaceDocument({
    ...active,
    nodes: [],
    edges: [],
    sourceMaterial: '',
    deliverableDraft: undefined,
    updatedAt: new Date().toISOString(),
  });
};

export const loadTemplate = (templateId: string): { nodes: AppNode[]; edges: AppEdge[] } | null => {
  const template = getTemplateById(templateId) ?? TEMPLATES.find((t) => t.id === templateId);
  if (!template) return null;
  return {
    nodes: structuredClone(template.nodes),
    edges: structuredClone(template.edges),
  };
};

export const saveVersion = (title: string, nodes: AppNode[], edges: AppEdge[]): VersionSnapshot => {
  const active = getActiveWorkspace();
  return saveSnapshot(title, nodes, edges, active?.id);
};

export const getVersions = (): VersionSnapshot[] => {
  const active = getActiveWorkspace();
  const all = getSnapshots();
  if (!active) return all;
  const scoped = all.filter((snap) => !snap.workspaceId || snap.workspaceId === active.id);
  return scoped.length > 0 ? scoped : all;
};

export { deleteSnapshot as deleteVersion };
