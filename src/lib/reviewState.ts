import type { AppEdge, AppNode } from '../types';

const semanticNode = (node: AppNode) => ({
  id: node.id,
  type: node.type,
  title: node.data.title,
  description: node.data.description,
  content: node.data.content,
  category: node.data.category ?? null,
  reviewRequired: Boolean(node.data.reviewRequired),
  promptInstruction: node.data.promptInstruction ?? '',
  expectedInput: node.data.expectedInput ?? '',
  expectedOutput: node.data.expectedOutput ?? '',
  provider: node.data.provider ?? null,
  modelName: node.data.modelName ?? '',
});

const semanticEdge = (edge: AppEdge) => ({
  source: edge.source,
  target: edge.target,
  sourceHandle: edge.sourceHandle ?? null,
  targetHandle: edge.targetHandle ?? null,
});

const workflowMeaningSignature = (nodes: AppNode[], edges: AppEdge[]) =>
  JSON.stringify({
    nodes: nodes.map(semanticNode).toSorted((left, right) => left.id.localeCompare(right.id)),
    edges: edges
      .map(semanticEdge)
      .toSorted((left, right) =>
        `${left.source}:${left.sourceHandle ?? ''}->${left.target}:${left.targetHandle ?? ''}`.localeCompare(
          `${right.source}:${right.sourceHandle ?? ''}->${right.target}:${right.targetHandle ?? ''}`,
        ),
      ),
  });

export const invalidateApprovedReviews = (params: {
  previousNodes: AppNode[];
  nextNodes: AppNode[];
  previousEdges: AppEdge[];
  nextEdges: AppEdge[];
}): AppNode[] => {
  const changed =
    workflowMeaningSignature(params.previousNodes, params.previousEdges) !==
    workflowMeaningSignature(params.nextNodes, params.nextEdges);

  if (!changed) return params.nextNodes;

  return params.nextNodes.map((node) =>
    node.type === 'review' && node.data.status === 'approved'
      ? { ...node, data: { ...node.data, status: 'pending' } }
      : node,
  );
};
