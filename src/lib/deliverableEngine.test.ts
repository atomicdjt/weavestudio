import { describe, expect, it } from 'vitest';
import {
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
});

describe('stripDuplicateLeadingHeadings', () => {
  it('strips matching section titles', () => {
    const result = stripDuplicateLeadingHeadings('## Executive summary\nBody text', {
      sectionTitle: 'Executive summary',
    });
    expect(result).toBe('Body text');
    expect(result).not.toContain('Executive summary');
  });
});

describe('isPlaceholderDescription', () => {
  it('flags known placeholders', () => {
    expect(isPlaceholderDescription('Final deliverable content')).toBe(true);
    expect(isPlaceholderDescription('Client-specific note about risk')).toBe(false);
  });
});
