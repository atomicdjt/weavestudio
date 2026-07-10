import type {
  AppEdge,
  AppNode,
  NodeCategory,
  SectionDef,
  WorkflowTemplate,
  WorkspaceDocument,
} from '../types';

export interface DeliverableOptions {
  title?: string;
  includeProcessAppendix?: boolean;
  template?: WorkflowTemplate | null;
}

/** Canvas helper text that must not appear in professional exports */
const PLACEHOLDER_DESCRIPTIONS = new Set(
  [
    'final deliverable content',
    'paste unstructured source material',
    'structure this slice of the source',
    'human verification checkpoint',
    'unstructured input',
    'structured from source',
    'final document to send',
    'raw text, markdown, rules...',
    'short description',
  ].map((s) => s.toLowerCase()),
);

const categoryLabel: Record<NodeCategory, string> = {
  source: 'Source',
  evidence: 'Evidence',
  action: 'Actions',
  risk: 'Risks',
  decision: 'Decisions',
  conclusion: 'Conclusions',
  open_question: 'Open questions',
  output: 'Output',
  other: 'Notes',
};

const normalizeHeading = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const isPlaceholderDescription = (description: string | undefined): boolean => {
  if (!description?.trim()) return true;
  return PLACEHOLDER_DESCRIPTIONS.has(description.trim().toLowerCase());
};

/**
 * Engine owns section headings (`## Section`).
 * Strip leading ATX headings from node content when they duplicate the section
 * title, the node title, or the document title.
 */
export const stripDuplicateLeadingHeadings = (
  content: string,
  opts: { sectionTitle?: string; nodeTitle?: string; documentTitle?: string },
): string => {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocked = [opts.sectionTitle, opts.nodeTitle, opts.documentTitle]
    .filter(Boolean)
    .map((t) => normalizeHeading(t as string));

  let i = 0;
  // Drop leading blank lines then matching headings
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') {
      i += 1;
      continue;
    }
    const match = line.match(/^#{1,6}\s+(.+)$/);
    if (!match) break;
    const headingNorm = normalizeHeading(match[1]);
    if (blocked.some((b) => b && (headingNorm === b || headingNorm.includes(b) || b.includes(headingNorm)))) {
      i += 1;
      continue;
    }
    break;
  }

  return lines.slice(i).join('\n').trim();
};

const nodeMatchesSection = (node: AppNode, section: SectionDef): boolean => {
  if (section.nodeIds?.length && section.nodeIds.includes(node.id)) return true;
  if (section.categories?.length) {
    const cat = node.data.category;
    if (cat && section.categories.includes(cat)) return true;
  }
  if (section.nodeTypes?.length && node.type && section.nodeTypes.includes(node.type)) return true;
  return false;
};

const collectSectionNodes = (nodes: AppNode[], section: SectionDef, usedIds: Set<string>): AppNode[] => {
  const matches = nodes.filter((node) => !usedIds.has(node.id) && nodeMatchesSection(node, section));
  const withContent = matches.filter((node) => node.data.content?.trim());
  const selected = withContent.length > 0 ? withContent : matches;
  selected.forEach((node) => usedIds.add(node.id));
  return selected;
};

export const formatNodeBodyForExport = (
  node: AppNode,
  opts: { sectionTitle?: string; documentTitle?: string },
): string => {
  const raw = node.data.content?.trim() || '';
  const cleaned = stripDuplicateLeadingHeadings(raw, {
    sectionTitle: opts.sectionTitle,
    nodeTitle: node.data.title,
    documentTitle: opts.documentTitle,
  });

  const parts: string[] = [];
  // Descriptions are canvas guidance — only include if user-authored (not placeholder)
  if (node.data.description?.trim() && !isPlaceholderDescription(node.data.description)) {
    parts.push(`_${node.data.description.trim()}_`);
  }
  parts.push(cleaned || '_No content yet._');
  return parts.join('\n\n');
};

const defaultSectionsFromGraph = (nodes: AppNode[]): SectionDef[] => {
  const hasCategory = nodes.some((node) => node.data.category);
  if (hasCategory) {
    const order: NodeCategory[] = [
      'conclusion',
      'evidence',
      'action',
      'decision',
      'risk',
      'open_question',
      'output',
    ];
    return order
      .filter((cat) => nodes.some((n) => n.data.category === cat && n.data.content?.trim()))
      .map((cat) => ({
        id: cat,
        title: categoryLabel[cat],
        categories: [cat],
        required: cat === 'output' || cat === 'conclusion',
      }));
  }

  return [
    {
      id: 'outputs',
      title: 'Deliverable content',
      nodeTypes: ['output'],
      required: true,
    },
    {
      id: 'decisions',
      title: 'Decisions',
      nodeTypes: ['decision'],
      required: false,
    },
    {
      id: 'transforms',
      title: 'Structured analysis',
      nodeTypes: ['transform'],
      required: false,
    },
    {
      id: 'reviews',
      title: 'Review notes',
      nodeTypes: ['review'],
      required: false,
    },
  ];
};

const buildEdgeSummary = (nodes: AppNode[], edges: AppEdge[]): string => {
  if (edges.length === 0) return '_No process connections defined._';
  const titles = new Map(nodes.map((node) => [node.id, node.data.title || node.id]));
  return edges
    .map(
      (edge, index) =>
        `${index + 1}. ${titles.get(edge.source) ?? edge.source} → ${titles.get(edge.target) ?? edge.target}`,
    )
    .join('\n');
};

export const composeDeliverableMarkdown = (
  nodes: AppNode[],
  edges: AppEdge[],
  options: DeliverableOptions = {},
): string => {
  const template = options.template;
  const title =
    options.title ||
    template?.outputStructure.title ||
    template?.expectedOutputType ||
    'Workflow Deliverable';

  const required = template?.outputStructure.requiredSections ?? [];
  const optional = template?.outputStructure.optionalSections ?? [];
  const sections: SectionDef[] =
    required.length + optional.length > 0
      ? [
          ...required.map((s) => ({ ...s, required: true })),
          ...optional.map((s) => ({ ...s, required: false })),
        ]
      : defaultSectionsFromGraph(nodes);

  const usedIds = new Set<string>();
  const bodyParts: string[] = [];
  const missingRequired: string[] = [];

  sections.forEach((section) => {
    const matched = collectSectionNodes(nodes, section, usedIds);
    const hasContent = matched.some((node) => node.data.content?.trim());

    if (!hasContent) {
      if (section.required) {
        missingRequired.push(section.title);
        bodyParts.push(`## ${section.title}\n\n_Section incomplete — add content to matching canvas nodes._`);
      }
      return;
    }

    // Engine is the sole owner of the section heading
    bodyParts.push(`## ${section.title}`);
    matched.forEach((node) => {
      // Subheading only when multiple nodes contribute and node title ≠ section title
      if (
        matched.length > 1 &&
        node.data.title?.trim() &&
        normalizeHeading(node.data.title) !== normalizeHeading(section.title)
      ) {
        bodyParts.push(`### ${node.data.title}`);
      }
      bodyParts.push(
        formatNodeBodyForExport(node, { sectionTitle: section.title, documentTitle: title }),
      );
    });
  });

  const leftoverOutputs = nodes.filter(
    (node) => node.type === 'output' && !usedIds.has(node.id) && node.data.content?.trim(),
  );
  if (leftoverOutputs.length > 0 && bodyParts.length === 0) {
    leftoverOutputs.forEach((node) => {
      bodyParts.push(`## ${node.data.title || 'Output'}`);
      bodyParts.push(
        formatNodeBodyForExport(node, {
          sectionTitle: node.data.title,
          documentTitle: title,
        }),
      );
    });
  }

  const includeAppendix =
    options.includeProcessAppendix ?? template?.exportBehavior.includeProcessAppendix ?? false;

  const header = [
    `# ${title}`,
    `Generated by WeaveStudio on ${new Date().toLocaleString()}.`,
    '',
    'This deliverable is composed locally from your workspace nodes. Review before sharing.',
    '',
  ];

  if (missingRequired.length > 0) {
    header.push(`> **Incomplete sections:** ${missingRequired.join(', ')}`, '');
  }

  const appendix = includeAppendix
    ? [
        '',
        '---',
        '',
        '## Appendix: Process flow',
        buildEdgeSummary(nodes, edges),
        '',
        '## Appendix: Source material',
        nodes.find((n) => n.type === 'input')?.data.content?.trim() || '_No source node content._',
      ]
    : [];

  if (bodyParts.length === 0) {
    return [
      ...header,
      '## Deliverable content',
      '',
      '_No structured content yet. Add source material, structure nodes, and fill Output nodes — then regenerate._',
      ...appendix,
    ].join('\n');
  }

  return [...header, ...bodyParts, ...appendix].join('\n\n');
};

export const composeFromWorkspace = (
  workspace: WorkspaceDocument,
  template?: WorkflowTemplate | null,
  options?: Omit<DeliverableOptions, 'template'>,
): string => {
  if (workspace.deliverableDraft?.userEdited && workspace.deliverableDraft.markdown.trim()) {
    return workspace.deliverableDraft.markdown;
  }
  return composeDeliverableMarkdown(workspace.nodes, workspace.edges, {
    ...options,
    title: options?.title || workspace.deliverableDraft?.title || workspace.name,
    template,
  });
};

/** Count ## headings that appear more than once (for tests). */
export const countDuplicateSectionHeadings = (markdown: string): string[] => {
  const headings = [...markdown.matchAll(/^##\s+(.+)$/gm)].map((m) => normalizeHeading(m[1]));
  const seen = new Map<string, number>();
  headings.forEach((h) => seen.set(h, (seen.get(h) ?? 0) + 1));
  return [...seen.entries()].filter(([, n]) => n > 1).map(([h]) => h);
};
