import { describe, expect, it } from 'vitest';
import type { AppEdge, AppNode, WorkspaceDocument } from '../types';
import { WORKSPACE_SCHEMA_VERSION, SNAPSHOT_FORMAT_VERSION } from '../types';
import { validateWorkspaceDocument, validateProjectExportFile } from './schema';
import { applySnapshotToWorkspace, inspectFullBrowserBackup } from './workspaceStore';
import { INDEX_KEY, workspaceKey } from './migrations';
import { attestApprovedReviewNode, createReviewApprovalSignature, invalidateApprovedReviews, verifyReviewApprovalSignatures } from './reviewState';

const input = (content = 'Source A'): AppNode => ({
  id: 'input',
  type: 'input',
  position: { x: 0, y: 0 },
  data: { title: 'Input', description: '', content },
});

const review = (approvalSignature?: string, approvalAttestationVersion?: 1): AppNode => ({
  id: 'review',
  type: 'review',
  position: { x: 100, y: 100 },
  data: {
    title: 'Human check',
    description: '',
    content: 'Verify the recommendation.',
    status: 'approved',
    reviewRequired: true,
    ...(approvalSignature ? { approvalSignature } : {}),
    ...(approvalAttestationVersion ? { approvalAttestationVersion } : {}),
  },
});

const edges: AppEdge[] = [{ id: 'input-review', source: 'input', target: 'review' }];

const workspace = (nodes: AppNode[], sourceMaterial = 'Evidence'): WorkspaceDocument => ({
  schemaVersion: WORKSPACE_SCHEMA_VERSION,
  id: 'review-workspace',
  name: 'Review workspace',
  templateId: null,
  createdAt: '2026-08-18T00:00:00.000Z',
  updatedAt: '2026-08-18T00:00:00.000Z',
  sourceMaterial,
  nodes,
  edges,
});

const reviewNode = (doc: WorkspaceDocument) => doc.nodes.find((node) => node.id === 'review');

describe('review approval attestations', () => {
  it('creates deterministic SHA-256 signatures over semantic upstream content', () => {
    const signature = createReviewApprovalSignature({
      reviewId: 'review', nodes: [input(), review()], edges, sourceMaterial: 'Evidence',
    });
    const reordered = createReviewApprovalSignature({
      reviewId: 'review',
      nodes: [
        { ...review(), position: { x: 900, y: 900 } },
        { ...input(), position: { x: 300, y: 300 } },
      ],
      edges: [...edges].reverse(),
      sourceMaterial: 'Evidence',
    });

    expect(signature).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(reordered).toBe(signature);
    expect(createReviewApprovalSignature({
      reviewId: 'review', nodes: [input('Changed'), review()], edges, sourceMaterial: 'Evidence',
    })).not.toBe(signature);
  });

  it('attaches a versioned digest when an approved review is recorded', () => {
    const pendingReview = {
      ...review(),
      data: { ...review().data, status: 'pending' as const },
    };
    const approvedNodes = attestApprovedReviewNode({
      reviewId: 'review',
      nodes: [input(), { ...pendingReview, data: { ...pendingReview.data, status: 'approved' } }],
      edges,
      sourceMaterial: 'Evidence',
    });
    const approved = reviewNode(workspace(approvedNodes));

    expect(approved?.data.approvalSignature).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(approved?.data.approvalAttestationVersion).toBe(1);
    expect(verifyReviewApprovalSignatures({
      nodes: approvedNodes, edges, sourceMaterial: 'Evidence',
    })).toEqual(approvedNodes);
  });

  it('keeps a valid approval on load and resets a stale imported approval', () => {
    const signature = createReviewApprovalSignature({
      reviewId: 'review', nodes: [input(), review()], edges, sourceMaterial: 'Evidence',
    });
    const valid = validateWorkspaceDocument(workspace([input(), review(signature, 1)]));
    const tampered = validateProjectExportFile({
      format: 'weavestudio-project',
      formatVersion: 1,
      exportedAt: '2026-08-18T00:00:00.000Z',
      workspace: workspace([input('Hand-edited source'), review(signature, 1)]),
    });

    expect(valid.ok).toBe(true);
    if (valid.ok) expect(reviewNode(valid.data)?.data.status).toBe('approved');
    expect(tampered.ok).toBe(true);
    if (tampered.ok) {
      expect(reviewNode(tampered.data.workspace)?.data.status).toBe('pending');
      expect(reviewNode(tampered.data.workspace)?.data.approvalSignature).toBeUndefined();
    }
  });

  it('normalizes stale signed approvals in full-browser backup restores', () => {
    const signature = createReviewApprovalSignature({
      reviewId: 'review', nodes: [input(), review()], edges, sourceMaterial: 'Evidence',
    });
    const tampered = workspace([input('Changed before backup'), review(signature, 1)]);
    const index = {
      schemaVersion: WORKSPACE_SCHEMA_VERSION,
      activeWorkspaceId: tampered.id,
      workspaces: [{
        id: tampered.id,
        name: tampered.name,
        updatedAt: tampered.updatedAt,
        templateId: tampered.templateId,
      }],
    };
    const inspected = inspectFullBrowserBackup({
      [INDEX_KEY]: JSON.stringify(index),
      [workspaceKey(tampered.id)]: JSON.stringify(tampered),
    });

    expect(inspected.ok).toBe(true);
    if (inspected.ok) {
      const restored = JSON.parse(inspected.data.records[workspaceKey(tampered.id)]) as WorkspaceDocument;
      expect(reviewNode(restored)?.data.status).toBe('pending');
      expect(reviewNode(restored)?.data.approvalSignature).toBeUndefined();
    }
  });

  it('preserves unsigned legacy approvals for backward compatibility', () => {
    const result = validateWorkspaceDocument(workspace([input(), review()]));

    expect(result.ok).toBe(true);
    if (result.ok) expect(reviewNode(result.data)?.data.status).toBe('approved');
  });

  it('resets an approval restored from a stale full snapshot', () => {
    const signature = createReviewApprovalSignature({
      reviewId: 'review', nodes: [input(), review()], edges, sourceMaterial: 'Evidence',
    });
    const current = workspace([input(), review(signature, 1)]);
    const snapshot = {
      id: 'stale-review-snapshot',
      timestamp: Date.now(),
      title: 'Stale approval',
      snapshotVersion: SNAPSHOT_FORMAT_VERSION,
      workspaceId: current.id,
      nodes: [input('Edited after approval'), review(signature, 1)],
      edges,
      sourceMaterial: current.sourceMaterial,
    };

    const restored = applySnapshotToWorkspace(current, snapshot);
    expect(reviewNode(restored.workspace)?.data.status).toBe('pending');
    expect(reviewNode(restored.workspace)?.data.approvalSignature).toBeUndefined();
  });

  it('fails closed if an attested approval loses its digest', () => {
    const result = validateWorkspaceDocument(workspace([input(), review(undefined, 1)]));

    expect(result.ok).toBe(true);
    if (result.ok) expect(reviewNode(result.data)?.data.status).toBe('pending');
  });

  it('clears the digest when an in-memory edit invalidates an approval', () => {
    const signature = createReviewApprovalSignature({
      reviewId: 'review', nodes: [input(), review()], edges, sourceMaterial: 'Evidence',
    });
    const previousNodes = [input(), review(signature, 1)];
    const nextNodes = [input('Changed'), review(signature, 1)];

    const result = invalidateApprovedReviews({
      previousNodes,
      nextNodes,
      previousEdges: edges,
      nextEdges: edges,
      previousSource: 'Evidence',
      nextSource: 'Evidence',
    });
    const updatedReview = result.find((node) => node.id === 'review');

    expect(updatedReview?.data.status).toBe('pending');
    expect(updatedReview?.data.approvalSignature).toBeUndefined();
    expect(updatedReview?.data.approvalAttestationVersion).toBeUndefined();
  });
});
