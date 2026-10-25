/**
 * Deduplicate navigation intents across React Strict Mode double-mount
 * and rapid double-clicks. Uses sessionStorage so remounts share the claim.
 */
import type { WorkspaceDocument } from '../types';
import { loadWorkspaceById, setActiveWorkspaceId } from './workspaceStore';

const intentKey = (intentId: string) => `weavestudio_nav_intent_${intentId}`;

export const claimNavIntent = (
  intentId: string,
  factory: () => WorkspaceDocument,
): WorkspaceDocument => {
  if (!intentId) {
    return factory();
  }

  let existingId: string | null = null;
  try {
    existingId = sessionStorage.getItem(intentKey(intentId));
  } catch {
    /* sessionStorage unavailable */
  }
  if (existingId) {
    const existing = loadWorkspaceById(existingId);
    if (existing) {
      const activation = setActiveWorkspaceId(existing.id);
      if (activation.status !== 'saved') {
        throw new Error(activation.error ?? 'Could not reactivate the workspace for this navigation.');
      }
      return existing;
    }
  }

  const created = factory();

  try {
    sessionStorage.setItem(intentKey(intentId), created.id);
  } catch {
    /* ignore */
  }

  return created;
};

/** Clear a claimed intent (tests). */
export const clearNavIntent = (intentId: string): void => {
  try {
    sessionStorage.removeItem(intentKey(intentId));
  } catch {
    /* ignore */
  }
};
