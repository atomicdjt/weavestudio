import type { AppEdge, AppNode, NodeType } from '../types';
import { createId } from './ids';

export interface SourceChunk {
  title: string;
  content: string;
}

/** Split unstructured text by markdown headings or blank-line paragraphs. */
export const splitSourceMaterial = (source: string): SourceChunk[] => {
  const text = source.replace(/\r\n/g, '\n').trim();
  if (!text) return [];

  if (/^#{1,3}\s+/m.test(text)) {
    const parts = text.split(/(?=^#{1,3}\s+)/m).map((part) => part.trim()).filter(Boolean);
    return parts.map((part, index) => {
      const lines = part.split('\n');
      const headingMatch = lines[0]?.match(/^#{1,3}\s+(.+)$/);
      const title = headingMatch?.[1]?.trim() || `Section ${index + 1}`;
      const content = headingMatch ? lines.slice(1).join('\n').trim() || part : part;
      return { title, content };
    });
  }

  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length <= 1) {
    return [{ title: 'Source material', content: text }];
  }

  return paragraphs.map((paragraph, index) => {
    const firstLine = paragraph.split('\n')[0] ?? `Chunk ${index + 1}`;
    const title =
      firstLine.length > 48 ? `${firstLine.slice(0, 45).trim()}…` : firstLine.trim() || `Chunk ${index + 1}`;
    return { title, content: paragraph };
  });
};

/** Targeted update: only the primary Input node's content changes. Positions/edges preserved. */
export const applySourceToInputNode = (nodes: AppNode[], source: string): AppNode[] => {
  const inputIndex = nodes.findIndex((node) => node.type === 'input');
  if (inputIndex === -1) {
    const inputNode: AppNode = {
      id: createId('node'),
      type: 'input',
      position: { x: 50, y: 80 },
      data: {
        title: 'Source material',
        description: 'Unstructured input',
        content: source,
        status: 'pending',
        category: 'source',
      },
    };
    return [inputNode, ...nodes];
  }

  return nodes.map((node, index) =>
    index === inputIndex
      ? {
          ...node,
          data: {
            ...node.data,
            content: source,
            category: node.data.category ?? 'source',
          },
        }
      : node,
  );
};

export const willOverwriteInputContent = (nodes: AppNode[], source: string): boolean => {
  const input = nodes.find((node) => node.type === 'input');
  if (!input) return false;
  const current = input.data.content ?? '';
  return current.trim().length > 0 && current !== source;
};

export interface SplitIntoNodesResult {
  nodes: AppNode[];
  edges: AppEdge[];
  createdCount: number;
  removedCount: number;
}

/**
 * Create transform nodes from source chunks, connected from the primary input node.
 * Default: append derived nodes (non-destructive).
 * replaceDerived: remove existing transform/decision/aiAssist nodes before adding.
 */
export const splitSourceIntoNodes = (
  source: string,
  existingNodes: AppNode[],
  existingEdges: AppEdge[],
  options?: { replaceDerived?: boolean },
): SplitIntoNodesResult => {
  const chunks = splitSourceMaterial(source);
  if (chunks.length === 0) {
    return { nodes: existingNodes, edges: existingEdges, createdCount: 0, removedCount: 0 };
  }

  let nodes = applySourceToInputNode(existingNodes, source);
  const inputNode = nodes.find((node) => node.type === 'input')!;

  let baseNodes = nodes;
  let baseEdges = existingEdges;
  let removedCount = 0;

  if (options?.replaceDerived) {
    const removeTypes = new Set(['transform', 'decision', 'aiAssist']);
    const keep = nodes.filter((node) => !removeTypes.has(node.type ?? ''));
    removedCount = nodes.length - keep.length;
    const keepIds = new Set(keep.map((n) => n.id));
    baseNodes = keep;
    baseEdges = existingEdges.filter((edge) => keepIds.has(edge.source) && keepIds.has(edge.target));
  }

  const maxY = baseNodes.reduce((max, node) => Math.max(max, node.position.y), 0);
  const startY = baseNodes.length > 1 ? maxY + 160 : 80;

  const created: AppNode[] = chunks.map((chunk, index) => ({
    id: createId('node'),
    type: 'transform' as NodeType,
    position: {
      x: 420,
      y: startY + index * 180,
    },
    data: {
      title: chunk.title,
      description: 'Structured from source',
      content: chunk.content,
      status: 'pending' as const,
      category: 'other' as const,
    },
  }));

  const newEdges: AppEdge[] = created.map((node) => ({
    id: createId('edge'),
    source: inputNode.id,
    target: node.id,
  }));

  return {
    nodes: [...baseNodes, ...created],
    edges: [...baseEdges, ...newEdges],
    createdCount: created.length,
    removedCount,
  };
};

export const countDerivedNodes = (nodes: AppNode[]): number =>
  nodes.filter((n) => n.type === 'transform' || n.type === 'decision' || n.type === 'aiAssist').length;
