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

  // Prefer markdown heading splits
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

  // Blank-line paragraphs
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

export interface SplitIntoNodesResult {
  nodes: AppNode[];
  edges: AppEdge[];
  createdCount: number;
}

/**
 * Create transform nodes from source chunks, connected from the primary input node.
 * Does not remove existing non-input nodes unless replaceTransforms is true.
 */
export const splitSourceIntoNodes = (
  source: string,
  existingNodes: AppNode[],
  existingEdges: AppEdge[],
  options?: { replaceDerived?: boolean },
): SplitIntoNodesResult => {
  const chunks = splitSourceMaterial(source);
  if (chunks.length === 0) {
    return { nodes: existingNodes, edges: existingEdges, createdCount: 0 };
  }

  let nodes = applySourceToInputNode(existingNodes, source);
  const inputNode = nodes.find((node) => node.type === 'input')!;

  let baseNodes = nodes;
  let baseEdges = existingEdges;

  if (options?.replaceDerived) {
    const keepIds = new Set(
      nodes.filter((node) => node.type === 'input' || node.type === 'output' || node.type === 'review').map((n) => n.id),
    );
    baseNodes = nodes.filter((node) => keepIds.has(node.id));
    baseEdges = existingEdges.filter((edge) => keepIds.has(edge.source) && keepIds.has(edge.target));
  }

  const startY = 80;
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

  // Offset existing non-input nodes if they collide in x band — keep simple: append
  return {
    nodes: [...baseNodes, ...created],
    edges: [...baseEdges, ...newEdges],
    createdCount: created.length,
  };
};
