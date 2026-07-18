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

  try {
    const existingId = sessionStorage.getItem(intentKey(intentId));
    if (existingId) {
      const existing = loadWorkspaceById(existingId);
      if (existing) {
        setActiveWorkspaceId(existing.id);
        return existing;
      }
    }
  } catch {
    /* sessionStorage unavailable */
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
