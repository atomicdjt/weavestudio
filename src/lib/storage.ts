import type { AppEdge, AppNode, VersionSnapshot } from '../types';
import { TEMPLATES } from '../data/templates';

const WORKSPACE_KEY = 'weavestudio_workspace';
const VERSIONS_KEY = 'weavestudio_versions';

type WorkspacePayload = { nodes: AppNode[]; edges: AppEdge[] };

const isWorkspacePayload = (value: unknown): value is WorkspacePayload => {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<WorkspacePayload>;
  return Array.isArray(payload.nodes) && Array.isArray(payload.edges);
};

const cloneWorkspace = ({ nodes, edges }: WorkspacePayload): WorkspacePayload => ({
  nodes: structuredClone(nodes),
  edges: structuredClone(edges),
});

export const saveWorkspace = (nodes: AppNode[], edges: AppEdge[]) => {
  try {
    localStorage.setItem(WORKSPACE_KEY, JSON.stringify({ nodes, edges }));
  } catch (error) {
    console.warn('Workspace could not be saved locally.', error);
  }
};

export const loadWorkspace = (): WorkspacePayload | null => {
  try {
    const data = localStorage.getItem(WORKSPACE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    if (isWorkspacePayload(parsed)) return parsed;

    console.warn('Saved workspace did not match the expected schema.');
    return null;
  } catch (error) {
    console.warn('Saved workspace could not be loaded. Falling back to demo data.', error);
    return null;
  }
};

export const clearWorkspace = () => {
  try {
    localStorage.removeItem(WORKSPACE_KEY);
  } catch (error) {
    console.warn('Workspace could not be cleared locally.', error);
  }
};

export const clearAllLocalData = () => {
  try {
    localStorage.removeItem(WORKSPACE_KEY);
    localStorage.removeItem(VERSIONS_KEY);
  } catch (error) {
    console.warn('Local data could not be cleared.', error);
  }
};

export const loadTemplate = (templateId: string): WorkspacePayload | null => {
  const template = TEMPLATES.find((t) => t.id === templateId);
  return template ? cloneWorkspace({ nodes: template.nodes, edges: template.edges }) : null;
};

export const saveVersion = (title: string, nodes: AppNode[], edges: AppEdge[]) => {
  const versions = getVersions();
  const newVersion: VersionSnapshot = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    title,
    nodes: structuredClone(nodes),
    edges: structuredClone(edges),
  };

  try {
    localStorage.setItem(VERSIONS_KEY, JSON.stringify([...versions, newVersion]));
  } catch (error) {
    console.warn('Snapshot could not be saved locally.', error);
  }

  return newVersion;
};

export const getVersions = (): VersionSnapshot[] => {
  try {
    const data = localStorage.getItem(VERSIONS_KEY);
    if (!data) return [];

    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Saved snapshots could not be loaded.', error);
    return [];
  }
};

export const deleteVersion = (id: string) => {
  const versions = getVersions().filter((v) => v.id !== id);
  try {
    localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions));
  } catch (error) {
    console.warn('Snapshot could not be deleted locally.', error);
  }
};
