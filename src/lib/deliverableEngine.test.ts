import { describe, expect, it } from 'vitest';
import {
  buildDeliverableSectionPlan,
  composeDeliverableMarkdown,
  countDuplicateSectionHeadings,
  isPlaceholderDescription,
  stripDuplicateLeadingHeadings,
} from './deliverableEngine';
import type { AppEdge, AppNode, WorkflowTemplate } from '../types';
import { TEMPLATE_SCHEMA_VERSION } from '../types';
import { getPrimaryTemplates } from '../data/templates';

const nodes: AppNode[] = [
  {
    id: 'i1',
    type: 'input',
    position: { x: 0, y: 0 },
    data: { title: 'Source', description: '', content: 'raw notes', category: 'source' },
  },
  {
    id: 't1',
    type: 'transform',
    position: { x: 0, y: 0 },
    data: { title: 'Evidence A', description: '', content: 'Fact one', category: 'evidence' },
  },
  {
    id: 'o1',
    type: 'output',
    position: { x: 0, y: 0 },
    data: {
      title: 'Brief',
      description: 'Final deliverable content',
      content: '## Executive summary\nDone with work.',
      category: 'output',
    },
  },
];

const edges: AppEdge[] = [
  { id: 'e1', source: 'i1', target: 't1' },
  { id: 'e2', source: 't1', target: 'o1' },
];

describe('composeDeliverableMarkdown', () => {
  it('keeps categorized transforms in their own template sections instead of matching by type', () => {
    const template = {
      schemaVersion: TEMPLATE_SCHEMA_VERSION,
      id: 'routing',
      title: 'Routing',
      description: '',
      idealUser: '',
      inputInstructions: '',
      messyInputSample: '',
      expectedOutputType: 'Plan',
      valueProposition: '',
      stages: [],
      nodes: [],
      edges: [],
      pack: 'primary' as const,
      completionCriteria: [],
      exportBehavior: { defaultFilenameStem: 'routing', includeProcessAppendix: false },
      outputStructure: {
        title: 'Routing plan',
        requiredSections: [
          { id: 'actions', title: 'Action items', categories: ['action' as const], nodeTypes: ['transform'], required: true },
          { id: 'decisions', title: 'Decisions', categories: ['decision' as const], required: true },
          { id: 'questions', title: 'Open questions', categories: ['open_question' as const], required: true },
        ],
        optionalSections: [],
      },
    } satisfies WorkflowTemplate;
    const categorized: AppNode[] = [
      { id: 'action', type: 'transform', position: { x: 0, y: 0 }, data: { title: 'Action', description: '', content: 'Book the review.', category: 'action' } },
      { id: 'decision', type: 'transform', position: { x: 0, y: 0 }, data: { title: 'Decision', description: '', content: 'Use the local workflow.', category: 'decision' } },
      { id: 'question', type: 'transform', position: { x: 0, y: 0 }, data: { title: 'Question', description: '', content: 'Who owns follow-up?', category: 'open_question' } },
    ];

    const markdown = composeDeliverableMarkdown(categorized, [], { template });
    const actions = markdown.slice(markdown.indexOf('## Action items'), markdown.indexOf('## Decisions'));
    const decisions = markdown.slice(markdown.indexOf('## Decisions'), markdown.indexOf('## Open questions'));

    expect(actions).toContain('Book the review.');
    expect(actions).not.toContain('Use the local workflow.');
    expect(actions).not.toContain('Who owns follow-up?');
    expect(decisions).toContain('Use the local workflow.');
    expect(markdown).toContain('## Open questions\n\nWho owns follow-up?');
  });

  it('builds structured markdown without dumping full inventory by default', () => {
    const md = composeDeliverableMarkdown(nodes, edges, { title: 'Test Brief' });
    expect(md).toContain('# Test Brief');
    expect(md).toContain('Evidence');
    expect(md).not.toContain('## Source Nodes');
  });

  it('does not emit placeholder descriptions', () => {
    const md = composeDeliverableMarkdown(nodes, edges, { title: 'Test Brief' });
    expect(md.toLowerCase()).not.toContain('final deliverable content');
  });

  it('does not duplicate section headings when node content has the same heading', () => {
    const template = {
      schemaVersion: TEMPLATE_SCHEMA_VERSION,
      id: 't',
      title: 'T',
      description: '',
      idealUser: '',
      inputInstructions: '',
      messyInputSample: '',
      expectedOutputType: 'Brief',
      valueProposition: '',
      stages: [],
      nodes: [],
      edges: [],
      pack: 'primary' as const,
      completionCriteria: [],
      exportBehavior: { defaultFilenameStem: 't', includeProcessAppendix: false },
      outputStructure: {
        title: 'Custom Title',
        requiredSections: [
          {
            id: 'sum',
            title: 'Executive summary',
            categories: ['output' as const],
            required: true,
          },
        ],
        optionalSections: [],
      },
    } satisfies WorkflowTemplate;

    const md = composeDeliverableMarkdown(nodes, edges, { template, title: 'Custom Title' });
    expect(md).toContain('## Executive summary');
    expect(countDuplicateSectionHeadings(md)).toEqual([]);
    // Body retained without duplicate heading
    expect(md).toContain('Done with work.');
  });

  it('respects template output structure', () => {
    const template = {
      schemaVersion: TEMPLATE_SCHEMA_VERSION,
      id: 't',
      title: 'T',
      description: '',
      idealUser: '',
      inputInstructions: '',
      messyInputSample: '',
      expectedOutputType: 'Brief',
      valueProposition: '',
      stages: [],
      nodes: [],
      edges: [],
      pack: 'primary' as const,
      completionCriteria: [],
      exportBehavior: { defaultFilenameStem: 't', includeProcessAppendix: false },
      outputStructure: {
        title: 'Custom Title',
        requiredSections: [
          { id: 'ev', title: 'Proof', categories: ['evidence' as const], required: true },
          { id: 'out', title: 'Write-up', categories: ['output' as const], required: true },
        ],
        optionalSections: [],
      },
    } satisfies WorkflowTemplate;

    const md = composeDeliverableMarkdown(nodes, edges, { template });
    expect(md).toContain('## Proof');
    expect(md).toContain('Fact one');
    expect(md).toContain('## Write-up');
  });

  it('primary templates produce coherent non-duplicated section headings', () => {
    for (const template of getPrimaryTemplates()) {
      const md = composeDeliverableMarkdown(template.nodes, template.edges, {
        template,
        title: template.outputStructure.title,
      });
      expect(countDuplicateSectionHeadings(md)).toEqual([]);
      expect(md.toLowerCase()).not.toContain('final deliverable content');
    }
  });

  it('reserves explicitly assigned nodes for their section even when it appears later', () => {
    const generic = {
      id: 'generic', title: 'Evidence', categories: ['evidence' as const], required: false,
    };
    const explicit = {
      id: 'explicit', title: 'Selected evidence', nodeIds: ['reserved'], required: true,
    };
    const template = {
      schemaVersion: TEMPLATE_SCHEMA_VERSION,
      id: 'explicit-routing', title: 'Explicit routing', description: '', idealUser: '',
      inputInstructions: '', messyInputSample: '', expectedOutputType: 'Report',
      valueProposition: '', stages: [], nodes: [], edges: [], pack: 'primary' as const,
      completionCriteria: [], exportBehavior: { defaultFilenameStem: 'routing', includeProcessAppendix: false },
      outputStructure: { title: 'Routing', requiredSections: [generic, explicit], optionalSections: [] },
    } satisfies WorkflowTemplate;
    const evidence: AppNode = {
      id: 'reserved', type: 'transform', position: { x: 0, y: 0 },
      data: { title: 'Reserved', description: '', content: 'Owned by explicit section.', category: 'evidence' },
    };

    const plan = buildDeliverableSectionPlan([evidence], template);

    expect(plan.assignments[0].nodes).toEqual([]);
    expect(plan.assignments[1].nodes).toEqual([evidence]);
  });

  it('uses node types only as a fallback for uncategorized nodes', () => {
    const template = {
      schemaVersion: TEMPLATE_SCHEMA_VERSION,
      id: 'type-fallback', title: 'Type fallback', description: '', idealUser: '',
      inputInstructions: '', messyInputSample: '', expectedOutputType: 'Report',
      valueProposition: '', stages: [], nodes: [], edges: [], pack: 'primary' as const,
      completionCriteria: [], exportBehavior: { defaultFilenameStem: 'fallback', includeProcessAppendix: false },
      outputStructure: {
        title: 'Fallback', requiredSections: [],
        optionalSections: [{ id: 'transforms', title: 'Transforms', nodeTypes: ['transform'], required: false }],
      },
    } satisfies WorkflowTemplate;
    const categorized: AppNode = {
      id: 'categorized', type: 'transform', position: { x: 0, y: 0 },
      data: { title: 'Categorized', description: '', content: 'Must remain uncaptured.', category: 'decision' },
    };

    const plan = buildDeliverableSectionPlan([categorized], template);

    expect(plan.assignments[0].nodes).toEqual([]);
  });
});

describe('stripDuplicateLeadingHeadings', () => {
  it('strips matching section titles', () => {
    const result = stripDuplicateLeadingHeadings('## Executive summary\nBody text', {
      sectionTitle: 'Executive summary',
    });
    expect(result).toBe('Body text');
    expect(result).not.toContain('Executive summary');
  });

  it('preserves a heading that only appears as part of another title', () => {
    const result = stripDuplicateLeadingHeadings('## Art\nThe full article follows.', {
      sectionTitle: 'Partial analysis',
    });

    expect(result).toBe('## Art\nThe full article follows.');
  });
});

describe('isPlaceholderDescription', () => {
  it('flags known placeholders', () => {
    expect(isPlaceholderDescription('Final deliverable content')).toBe(true);
    expect(isPlaceholderDescription('Client-specific note about risk')).toBe(false);
  });
});
