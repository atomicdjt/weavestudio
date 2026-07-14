import type { AppEdge, AppNode } from '../types';

export interface WorkflowOutlineItem {
  node: AppNode;
  depth: number;
  incomingFrom: string[];
  outgoingTo: string[];
}

/** Converts a spatial graph into a deterministic, cycle-safe reading order. */
export const buildWorkflowOutline = (nodes: AppNode[], edges: AppEdge[]): WorkflowOutlineItem[] => {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const incoming = new Map(nodes.map((node) => [node.id, [] as string[]]));
  const outgoing = new Map(nodes.map((node) => [node.id, [] as string[]]));
  for (const edge of edges) {
    if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) continue;
    outgoing.get(edge.source)!.push(edge.target);
    incoming.get(edge.target)!.push(edge.source);
  }

  const items: WorkflowOutlineItem[] = [];
  const visited = new Set<string>();
  const visit = (id: string, depth: number) => {
    if (visited.has(id)) return;
    const node = nodeById.get(id);
    if (!node) return;
    visited.add(id);
    items.push({ node, depth, incomingFrom: incoming.get(id) ?? [], outgoingTo: outgoing.get(id) ?? [] });
    for (const childId of outgoing.get(id) ?? []) visit(childId, depth + 1);
  };

  for (const node of nodes) if ((incoming.get(node.id)?.length ?? 0) === 0) visit(node.id, 0);
  for (const node of nodes) visit(node.id, 0);
  return items;
};
