import type { WorkspaceDocument } from '../types';
import { claimNavIntent } from './navIntent';
import { createWorkspace, getOrCreateGuidedDemo } from './workspaceStore';
import { createGuidedDemoWorkspace } from '../data/demos/guidedDemo';
import { getTemplateById, resolveTemplateId } from '../data/templates';

export type LocationState = {
  loadTemplate?: string;
  openGuidedDemo?: boolean;
  blankWorkspace?: boolean;
  intentId?: string;
} | null;

/** Resolve initial workspace: nav intents first (no side-effect default template). */
export const resolveWorkspaceFromNav = (state: LocationState): WorkspaceDocument | null => {
  if (!state) return null;

  if (state.openGuidedDemo) {
    const intentId = state.intentId || 'guided-demo-default';
    return claimNavIntent(intentId, () => getOrCreateGuidedDemo(createGuidedDemoWorkspace));
  }

  if (state.blankWorkspace) {
    const intentId = state.intentId || 'blank-default';
    return claimNavIntent(intentId, () =>
      createWorkspace({ name: 'Blank workspace', nodes: [], edges: [], sourceMaterial: '' }),
    );
  }

  if (state.loadTemplate) {
    const templateId = resolveTemplateId(state.loadTemplate) ?? state.loadTemplate;
    const template = getTemplateById(templateId);
    if (!template) return null;
    const intentId = state.intentId || `template-${templateId}`;
    return claimNavIntent(intentId, () => {
      const source =
        template.nodes.find((n) => n.type === 'input')?.data.content || template.messyInputSample || '';
      return createWorkspace({
        name: template.title,
        templateId: template.id,
        nodes: structuredClone(template.nodes),
        edges: structuredClone(template.edges),
        sourceMaterial: source,
        meta: { appliedSourceFingerprint: source },
      });
    });
  }

  return null;
};
