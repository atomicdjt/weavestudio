import type { WorkflowTemplate } from '../../types';
import { LEGACY_TEMPLATES } from './legacy';
import { PRIMARY_TEMPLATES } from './primary';

/** All templates (primary first, then legacy). */
export const TEMPLATES: WorkflowTemplate[] = [...PRIMARY_TEMPLATES, ...LEGACY_TEMPLATES];

export const PRIMARY_TEMPLATE_IDS = PRIMARY_TEMPLATES.map((t) => t.id);

export const getTemplateById = (id: string): WorkflowTemplate | undefined =>
  TEMPLATES.find((template) => template.id === id);

export const getPrimaryTemplates = (): WorkflowTemplate[] =>
  TEMPLATES.filter((template) => template.pack === 'primary');

export const getLegacyTemplates = (): WorkflowTemplate[] =>
  TEMPLATES.filter((template) => template.pack === 'legacy');

/** Map retired/aliased ids to current primary templates when loading old workspaces. */
export const resolveTemplateId = (id: string | null | undefined): string | null => {
  if (!id) return null;
  const aliases: Record<string, string> = {
    'client-discovery': 'client-proposal-builder',
    'meeting-action': 'meeting-action-plan',
    'research-evidence': 'research-brief',
  };
  const resolved = aliases[id] ?? id;
  return getTemplateById(resolved) ? resolved : id;
};

export { PRIMARY_TEMPLATES, LEGACY_TEMPLATES };
