import type { AppEdge, AppNode } from '../types';

/**
 * Extracts the semantically meaningful fields from a node for signature comparison.
 * Deliberately excludes: position, measured dimensions, selected state, dragging state,
 * and `status` (so that approving/rejecting a review doesn't trigger a signature change).
 */
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

const edgeSortKey = (e: ReturnType<typeof semanticEdge>) =>
  `${e.source}:${e.sourceHandle ?? ''}->${e.target}:${e.targetHandle ?? ''}`;

const compareCodeUnits = (left: string, right: string) => (left < right ? -1 : left > right ? 1 : 0);

const compareSemanticNodes = (left: ReturnType<typeof semanticNode>, right: ReturnType<typeof semanticNode>) =>
  compareCodeUnits(left.id, right.id) || compareCodeUnits(JSON.stringify(left), JSON.stringify(right));

const compareSemanticEdges = (left: ReturnType<typeof semanticEdge>, right: ReturnType<typeof semanticEdge>) =>
  compareCodeUnits(edgeSortKey(left), edgeSortKey(right)) ||
  compareCodeUnits(JSON.stringify(left), JSON.stringify(right));

const isNodeRecord = (node: unknown): node is AppNode => {
  if (!node || typeof node !== 'object') return false;
  const candidate = node as Partial<AppNode>;
  return typeof candidate.id === 'string' &&
    typeof candidate.type === 'string' &&
    !!candidate.data &&
    typeof candidate.data === 'object';
};

const hasUniqueNodeIds = (nodes: readonly AppNode[]) =>
  new Set(nodes.map((node) => node.id)).size === nodes.length;

/**
 * Collects the set of node IDs reachable by traversing edges backwards (upstream)
 * from a given starting node. Uses a visited set for cycle safety and guaranteed
 * termination. Includes the starting node itself.
 *
 * Time: O(V + E) per call. Safe for cycles and disconnected components.
 */
export const collectUpstream = (
  startId: string,
  nodeIds: ReadonlySet<string>,
  incomingByTarget: ReadonlyMap<string, string[]>,
): Set<string> => {
  const upstream = new Set<string>();
  const queue: string[] = [startId];

  while (queue.length > 0) {
    const current = queue.pop()!;
    if (upstream.has(current)) continue;
    // Only include nodes that actually exist in the graph
    if (!nodeIds.has(current)) continue;
    upstream.add(current);
    const parents = incomingByTarget.get(current);
    if (parents) {
      for (const parent of parents) {
        if (!upstream.has(parent)) queue.push(parent);
      }
    }
  }

  return upstream;
};

/**
 * Computes a deterministic signature for the subgraph that contributes to a
 * specific review node: its upstream ancestors, the review node itself, and
 * all edges within that subgraph. Also includes source material since it is
 * a global input to all workflow paths.
 *
 * The signature is a JSON string of sorted semantic representations, ensuring
 * determinism regardless of array ordering in the input.
 */
const reviewSubgraphSignature = (
  reviewId: string,
  edges: AppEdge[],
  sourceMaterial: string,
  nodeById: ReadonlyMap<string, AppNode>,
  nodeIds: ReadonlySet<string>,
  incomingByTarget: ReadonlyMap<string, string[]>,
): string => {
  const upstream = collectUpstream(reviewId, nodeIds, incomingByTarget);

  // Collect semantic representations of upstream nodes
  const subgraphNodes: ReturnType<typeof semanticNode>[] = [];
  for (const id of upstream) {
    const node = nodeById.get(id);
    if (node) subgraphNodes.push(semanticNode(node));
  }

  // Collect edges where both endpoints are in the upstream set
  const subgraphEdges = edges
    .filter((e) => upstream.has(e.source) && upstream.has(e.target))
    .map(semanticEdge);

  return JSON.stringify({
    sourceMaterial,
    nodes: subgraphNodes.toSorted(compareSemanticNodes),
    edges: subgraphEdges.toSorted(compareSemanticEdges),
  });
};

/**
 * Builds a reverse-adjacency map: for each node, the list of source nodes
 * that have edges pointing into it. Ignores edges referencing nonexistent nodes.
 */
const buildIncomingMap = (
  edges: AppEdge[],
  nodeIds: ReadonlySet<string>,
): Map<string, string[]> => {
  const incoming = new Map<string, string[]>();
  for (const edge of edges) {
    if (
      !edge ||
      typeof edge !== 'object' ||
      typeof edge.source !== 'string' ||
      typeof edge.target !== 'string'
    ) {
      throw new TypeError('Cannot build review dependencies from a malformed edge.');
    }
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    let parents = incoming.get(edge.target);
    if (!parents) {
      parents = [];
      incoming.set(edge.target, parents);
    }
    parents.push(edge.source);
  }
  return incoming;
};

/**
 * Determines which approved Review nodes should be invalidated (reset to
 * 'pending') after a workflow edit.
 *
 * ## Invariants
 *
 * A. **Relevant-change invalidation**: An approved Review node becomes pending
 *    when the semantic content of its upstream subgraph (ancestors + self +
 *    connecting edges) changes, or when source material changes.
 *
 * B. **Unrelated-change stability**: An approved Review remains approved when
 *    a change occurs in a graph region outside its upstream dependency set.
 *
 * C. **Structural-change handling**: Adding, deleting, reconnecting, or
 *    reconfiguring upstream nodes/edges invalidates affected approvals.
 *
 * D. **Downstream edits**: Changes exclusively downstream of a Review node
 *    do not invalidate that Review.
 *
 * E. **Determinism**: Given the same graph state, results are identical.
 *
 * F. **Safety**: When computing the upstream subgraph, cycles terminate via
 *    visited-set tracking. If any individual review's signature comparison
 *    fails (e.g. due to unexpected data), that review is conservatively
 *    invalidated.
 *
 * ## Algorithm
 *
 * For each approved review node in the next graph state:
 * 1. Compute the upstream subgraph signature from the previous state
 * 2. Compute the upstream subgraph signature from the next state
 * 3. If they differ, reset the review to 'pending'
 *
 * A review node that exists only in the next state (newly added) is left
 * as-is since it has no previous approval to invalidate.
 *
 * ## Complexity
 *
 * O(R × (V + E)) where R is the number of approved review nodes, V is
 * vertex count, and E is edge count. For typical workflows (R ≪ V), this
 * is effectively O(V + E). The per-review traversal shares the same
 * adjacency structures.
 */
export const invalidateApprovedReviews = (params: {
  previousNodes: AppNode[];
  nextNodes: AppNode[];
  previousEdges: AppEdge[];
  nextEdges: AppEdge[];
  previousSource?: string;
  nextSource?: string;
}): AppNode[] => {
  const prevSource = params.previousSource ?? '';
  const nextSource = params.nextSource ?? '';

  // Quick exit: if there are no approved review nodes, nothing to invalidate
  const approvedReviews = params.nextNodes.filter(
    (n) => isNodeRecord(n) && n.type === 'review' && n.data.status === 'approved',
  );
  if (approvedReviews.length === 0) return params.nextNodes;

  // Track which review node IDs need invalidation
  const invalidatedIds = new Set<string>();

  try {
    if (
      !params.previousNodes.every(isNodeRecord) ||
      !params.nextNodes.every(isNodeRecord) ||
      !hasUniqueNodeIds(params.previousNodes) ||
      !hasUniqueNodeIds(params.nextNodes)
    ) {
      throw new TypeError('Cannot build review dependencies from malformed or duplicate nodes.');
    }

    // Build lookup structures for previous state
    const prevNodeById = new Map(params.previousNodes.map((n) => [n.id, n]));
    const prevNodeIds = new Set(params.previousNodes.map((n) => n.id));
    const prevIncoming = buildIncomingMap(params.previousEdges, prevNodeIds);

    // Build lookup structures for next state
    const nextNodeById = new Map(params.nextNodes.map((n) => [n.id, n]));
    const nextNodeIds = new Set(params.nextNodes.map((n) => n.id));
    const nextIncoming = buildIncomingMap(params.nextEdges, nextNodeIds);

    for (const review of approvedReviews) {
      // If this review didn't exist in the previous state, it's newly added
      // and has no previous approval to compare against — leave it as-is.
      if (!prevNodeIds.has(review.id)) continue;

      try {
        const prevSig = reviewSubgraphSignature(
          review.id,
          params.previousEdges,
          prevSource,
          prevNodeById,
          prevNodeIds,
          prevIncoming,
        );

        const nextSig = reviewSubgraphSignature(
          review.id,
          params.nextEdges,
          nextSource,
          nextNodeById,
          nextNodeIds,
          nextIncoming,
        );

        if (prevSig !== nextSig) {
          invalidatedIds.add(review.id);
        }
      } catch {
        // Invariant F — safety: if comparison fails, conservatively invalidate
        // this review.
        invalidatedIds.add(review.id);
      }
    }
  } catch {
    // Dependency construction can fail before an individual review is
    // evaluated. Treat malformed graph input as unsafe for every approval.
    for (const review of approvedReviews) invalidatedIds.add(review.id);
  }

  if (invalidatedIds.size === 0) return params.nextNodes;

  return params.nextNodes.map((node) =>
    isNodeRecord(node) && invalidatedIds.has(node.id)
      ? { ...node, data: { ...node.data, status: 'pending' } }
      : node,
  );
};
