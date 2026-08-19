import type {
  AppNode,
  ProvenanceClaim,
  ProvenanceDerivation,
  ProvenanceGraph,
  SourceFragment,
} from '../types';
import { createId } from './ids';

export type ProvenanceStatus = 'valid' | 'stale' | 'broken' | 'missing';
export type SourceFragmentStatus = Exclude<ProvenanceStatus, 'missing'>;

/**
 * Small deterministic FNV-1a fingerprint for stale-reference detection.
 * This is intentionally not a cryptographic hash and must never be presented as authenticity proof.
 */
export const fingerprintText = (value: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `fnv1a32:${hash.toString(16).padStart(8, '0')}`;
};

const validOffsets = (startOffset: number, endOffset: number, sourceLength: number): boolean =>
  Number.isInteger(startOffset) &&
  Number.isInteger(endOffset) &&
  startOffset >= 0 &&
  endOffset >= startOffset &&
  endOffset <= sourceLength;

export const createSourceFragment = (args: {
  sourceMaterial: string;
  startOffset: number;
  endOffset: number;
  id?: string;
}): SourceFragment => {
  if (!validOffsets(args.startOffset, args.endOffset, args.sourceMaterial.length)) {
    throw new RangeError('Source fragment offsets are outside the current source material.');
  }
  const quote = args.sourceMaterial.slice(args.startOffset, args.endOffset);
  return {
    id: args.id ?? createId('fragment'),
    startOffset: args.startOffset,
    endOffset: args.endOffset,
    quote,
    quoteFingerprint: fingerprintText(quote),
    sourceFingerprint: fingerprintText(args.sourceMaterial),
  };
};

export const createProvenanceClaim = (args: {
  nodeId: string;
  claimText: string;
  sourceFragmentIds: string[];
  viaNodeIds?: string[];
  derivation: ProvenanceDerivation;
  id?: string;
}): ProvenanceClaim => ({
  id: args.id ?? createId('claim'),
  nodeId: args.nodeId,
  claimText: args.claimText,
  claimFingerprint: fingerprintText(args.claimText),
  sourceFragmentIds: [...args.sourceFragmentIds],
  viaNodeIds: [...(args.viaNodeIds ?? [])],
  derivation: args.derivation,
});

export const validateSourceFragment = (
  fragment: SourceFragment,
  sourceMaterial: string,
): SourceFragmentStatus => {
  if (!validOffsets(fragment.startOffset, fragment.endOffset, sourceMaterial.length)) return 'broken';
  const currentQuote = sourceMaterial.slice(fragment.startOffset, fragment.endOffset);
  if (
    currentQuote !== fragment.quote ||
    fingerprintText(fragment.quote) !== fragment.quoteFingerprint ||
    fingerprintText(currentQuote) !== fragment.quoteFingerprint
  ) {
    return 'stale';
  }
  return 'valid';
};

export const upsertSourceFragment = (
  graph: ProvenanceGraph | undefined,
  sourceMaterial: string,
  startOffset: number,
  endOffset: number,
  id?: string,
): { graph: ProvenanceGraph; fragment: SourceFragment } => {
  if (startOffset === endOffset) throw new RangeError('Select non-empty source text for provenance.');
  const currentSourceFingerprint = fingerprintText(sourceMaterial);
  const currentQuote = validOffsets(startOffset, endOffset, sourceMaterial.length)
    ? sourceMaterial.slice(startOffset, endOffset)
    : '';
  const existing = graph?.fragments.find(
    (fragment) =>
      fragment.startOffset === startOffset &&
      fragment.endOffset === endOffset &&
      fragment.quote === currentQuote &&
      fragment.sourceFingerprint === currentSourceFingerprint &&
      validateSourceFragment(fragment, sourceMaterial) === 'valid',
  );

  if (existing) {
    return {
      graph: {
        ...graph,
        sourceFingerprint: currentSourceFingerprint,
        fragments: [...graph.fragments],
        claims: [...graph.claims],
      },
      fragment: existing,
    };
  }

  const fragment = createSourceFragment({ sourceMaterial, startOffset, endOffset, id });
  const next: ProvenanceGraph = graph
    ? {
        ...graph,
        sourceFingerprint: currentSourceFingerprint,
        fragments: [...graph.fragments, fragment],
        claims: [...graph.claims],
      }
    : {
        version: 1,
        sourceFingerprint: currentSourceFingerprint,
        fragments: [fragment],
        claims: [],
      };
  return { graph: next, fragment };
};

export const upsertProvenanceClaim = (
  graph: ProvenanceGraph,
  args: {
    nodeId: string;
    claimText: string;
    sourceFragmentIds: string[];
    viaNodeIds?: string[];
    derivation: ProvenanceDerivation;
    id?: string;
  },
): { graph: ProvenanceGraph; claim: ProvenanceClaim } => {
  if (args.sourceFragmentIds.length === 0) {
    throw new Error('A provenance claim must reference at least one source fragment.');
  }
  const uniqueFragmentIds = [...new Set(args.sourceFragmentIds)];
  const uniqueViaNodeIds = [...new Set(args.viaNodeIds ?? [])];
  const missingFragment = uniqueFragmentIds.find(
    (fragmentId) => !graph.fragments.some((fragment) => fragment.id === fragmentId),
  );
  if (missingFragment) throw new Error(`Unknown source fragment: ${missingFragment}`);

  const existingIndex = graph.claims.findIndex(
    (claim) => claim.nodeId === args.nodeId && claim.claimText === args.claimText,
  );
  const existing = existingIndex >= 0 ? graph.claims[existingIndex] : undefined;
  const claim = createProvenanceClaim({
    ...args,
    id: existing?.id ?? args.id,
    sourceFragmentIds: uniqueFragmentIds,
    viaNodeIds: uniqueViaNodeIds,
  });
  const claims = [...graph.claims];
  if (existingIndex >= 0) claims[existingIndex] = claim;
  else claims.push(claim);
  return { graph: { ...graph, claims }, claim };
};

export const validateProvenanceClaim = (
  claim: ProvenanceClaim,
  graph: ProvenanceGraph,
  nodes: AppNode[],
): ProvenanceStatus => {
  if (claim.sourceFragmentIds.length === 0) return 'missing';

  const origin = nodes.find((node) => node.id === claim.nodeId);
  if (!origin) return 'broken';
  if (claim.sourceFragmentIds.some((id) => !graph.fragments.some((fragment) => fragment.id === id))) {
    return 'broken';
  }
  if (claim.viaNodeIds.some((id) => !nodes.some((node) => node.id === id))) return 'broken';

  if (
    fingerprintText(claim.claimText) !== claim.claimFingerprint ||
    !origin.data.content.includes(claim.claimText)
  ) {
    return 'stale';
  }

  return 'valid';
};

export const resolveClaimTrace = (args: {
  claim: ProvenanceClaim;
  graph: ProvenanceGraph;
  sourceMaterial: string;
  nodes: AppNode[];
}): {
  status: ProvenanceStatus;
  claim: ProvenanceClaim;
  fragments: Array<{ fragment: SourceFragment; status: SourceFragmentStatus }>;
  viaNodes: AppNode[];
} => {
  const fragments = args.claim.sourceFragmentIds.flatMap((id) => {
    const fragment = args.graph.fragments.find((item) => item.id === id);
    return fragment
      ? [{ fragment, status: validateSourceFragment(fragment, args.sourceMaterial) }]
      : [];
  });
  const viaNodes = args.claim.viaNodeIds.flatMap((id) => {
    const item = args.nodes.find((node) => node.id === id);
    return item ? [item] : [];
  });

  const claimStatus = validateProvenanceClaim(args.claim, args.graph, args.nodes);
  let status: ProvenanceStatus = claimStatus;
  if (claimStatus !== 'missing') {
    if (claimStatus === 'broken' || fragments.some((item) => item.status === 'broken')) {
      status = 'broken';
    } else if (claimStatus === 'stale' || fragments.some((item) => item.status === 'stale')) {
      status = 'stale';
    } else {
      status = 'valid';
    }
  }

  return { status, claim: args.claim, fragments, viaNodes };
};

const eligibleClaimNode = (node: AppNode): boolean =>
  node.type === 'output' ||
  node.type === 'decision' ||
  node.data.category === 'output' ||
  node.data.category === 'conclusion' ||
  node.data.category === 'evidence' ||
  node.data.category === 'decision';

const claimParts = (content: string): string[] => {
  const parts: string[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    const value = paragraph.join(' ').trim();
    if (value) parts.push(value);
    paragraph = [];
  };

  for (const rawLine of content.replace(/\r\n/g, '\n').split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      flush();
      continue;
    }
    const bullet = line.match(/^[-*+]\s+(.+)$/);
    if (bullet) {
      flush();
      const value = bullet[1].trim();
      if (value) parts.push(value);
      continue;
    }
    paragraph.push(line);
  }
  flush();
  return parts;
};

export const extractClaimCandidates = (nodes: AppNode[]): Array<{ nodeId: string; text: string }> => {
  const seen = new Set<string>();
  const candidates: Array<{ nodeId: string; text: string }> = [];
  nodes.filter(eligibleClaimNode).forEach((node) => {
    claimParts(node.data.content).forEach((text) => {
      const key = `${node.id}\u0000${text}`;
      if (seen.has(key)) return;
      seen.add(key);
      candidates.push({ nodeId: node.id, text });
    });
  });
  return candidates;
};
