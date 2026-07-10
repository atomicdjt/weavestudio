import type { WorkspaceDocument } from '../../types';
import { WORKSPACE_SCHEMA_VERSION } from '../../types';
import { getTemplateById } from '../templates';

/** Polished fictional demo: Northline Home Services discovery → proposal. */
export const createGuidedDemoWorkspace = (): WorkspaceDocument => {
  const template = getTemplateById('client-proposal-builder')!;
  const now = new Date().toISOString();

  return {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    id: `demo_${Date.now()}`,
    name: 'Guided demo: Northline proposal',
    templateId: template.id,
    createdAt: now,
    updatedAt: now,
    sourceMaterial: template.nodes.find((n) => n.type === 'input')?.data.content ?? template.messyInputSample,
    nodes: structuredClone(template.nodes),
    edges: structuredClone(template.edges),
    deliverableDraft: {
      title: 'Proposal: Lightweight Operations Upgrade',
      markdown: '',
      userEdited: false,
    },
    meta: { guidedDemo: true },
  };
};
