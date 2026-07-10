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
  // Prefer non-empty content
  const withContent = matches.filter((node) => node.data.content?.trim());
  const selected = withContent.length > 0 ? withContent : matches;
  selected.forEach((node) => usedIds.add(node.id));
  return selected;
};

const formatNodeBody = (node: AppNode): string => {
  const parts: string[] = [];
  if (node.data.description?.trim()) {
    parts.push(`_${node.data.description.trim()}_`);
  }
  const content = node.data.content?.trim() || '_No content yet._';
  parts.push(content);
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
    .map((edge, index) => `${index + 1}. ${titles.get(edge.source) ?? edge.source} → ${titles.get(edge.target) ?? edge.target}`)
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
      ? [...required.map((s) => ({ ...s, required: true })), ...optional.map((s) => ({ ...s, required: false }))]
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

    bodyParts.push(`## ${section.title}`);
    if (section.guidance) {
      bodyParts.push(`_${section.guidance}_`);
    }
    matched.forEach((node) => {
      if (matched.length > 1) {
        bodyParts.push(`### ${node.data.title || 'Untitled'}`);
      }
      bodyParts.push(formatNodeBody(node));
    });
  });

  // If still thin, include output nodes not yet used
  const leftoverOutputs = nodes.filter(
    (node) => node.type === 'output' && !usedIds.has(node.id) && node.data.content?.trim(),
  );
  if (leftoverOutputs.length > 0 && bodyParts.length === 0) {
    leftoverOutputs.forEach((node) => {
      bodyParts.push(`## ${node.data.title || 'Output'}`);
      bodyParts.push(formatNodeBody(node));
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
    header.push(
      `> **Incomplete sections:** ${missingRequired.join(', ')}`,
      '',
    );
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
