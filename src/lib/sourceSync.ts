import type { AppNode, SourceSyncStatus, WorkspaceDocument } from '../types';

export const getPrimaryInputContent = (nodes: AppNode[]): string => {
  const input = nodes.find((node) => node.type === 'input');
  return input?.data.content ?? '';
};

export const computeSourceSyncStatus = (
  sourceMaterial: string,
  nodes: AppNode[],
  appliedSourceFingerprint: string | undefined,
): SourceSyncStatus => {
  const inputContent = getPrimaryInputContent(nodes);
  const source = sourceMaterial ?? '';

  if (source === inputContent) {
    return 'in_sync';
  }

  // Source panel differs from last applied (or from input)
  if (appliedSourceFingerprint !== undefined && source !== appliedSourceFingerprint && inputContent === appliedSourceFingerprint) {
    return 'source_ahead';
  }

  if (source !== inputContent && appliedSourceFingerprint === source) {
    // Applied fingerprint matches source but input differs — canvas was edited after apply
    return 'canvas_ahead';
  }

  if (source !== inputContent) {
    return source.trim() === '' && inputContent.trim() !== '' ? 'canvas_ahead' : 'source_ahead';
  }

  return 'in_sync';
};

export const withSourceSyncMeta = (
  workspace: WorkspaceDocument,
  appliedSourceFingerprint?: string,
): WorkspaceDocument => {
  const fingerprint =
    appliedSourceFingerprint ??
    (typeof workspace.meta?.appliedSourceFingerprint === 'string'
      ? workspace.meta.appliedSourceFingerprint
      : undefined);

  const status = computeSourceSyncStatus(workspace.sourceMaterial, workspace.nodes, fingerprint);

  return {
    ...workspace,
    meta: {
      ...workspace.meta,
      appliedSourceFingerprint: fingerprint,
      sourceSyncStatus: status,
    },
  };
};

export const SOURCE_SYNC_LABELS: Record<SourceSyncStatus, string> = {
  in_sync: 'Canvas current',
  source_ahead: 'Source changes not yet applied',
  canvas_ahead: 'Canvas differs from source panel',
  unknown: 'Source sync unknown',
};

export const inputNodeHasManualEditsBeyondSource = (nodes: AppNode[], sourceMaterial: string): boolean => {
  const input = nodes.find((node) => node.type === 'input');
  if (!input) return false;
  return (input.data.content ?? '') !== sourceMaterial;
};

export const hasNonTrivialCanvasContent = (nodes: AppNode[]): boolean => {
  return nodes.some((node) => {
    if (node.type === 'input') return false;
    return Boolean(node.data.content?.trim() || node.data.title?.trim());
  });
};
