import { describe, expect, it } from 'vitest';
import { composeDeliverableMarkdown } from './deliverableEngine';
import type { AppEdge, AppNode, WorkflowTemplate } from '../types';
import { TEMPLATE_SCHEMA_VERSION } from '../types';

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
    data: { title: 'Brief', description: '', content: '## Summary\nDone.', category: 'output' },
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

  it('can include process appendix when requested', () => {
    const md = composeDeliverableMarkdown(nodes, edges, { includeProcessAppendix: true });
    expect(md).toContain('Appendix: Process flow');
  });
});
