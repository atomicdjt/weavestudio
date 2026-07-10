import type {
  AppEdge,
  AppNode,
  TemplateExportBehavior,
  TemplateOutputStructure,
  TemplateStage,
  WorkflowTemplate,
} from '../../types';
import { TEMPLATE_SCHEMA_VERSION } from '../../types';

export const makeTemplate = (input: {
  id: string;
  title: string;
  description: string;
  idealUser: string;
  inputInstructions: string;
  messyInputSample: string;
  expectedOutputType: string;
  valueProposition: string;
  stages: TemplateStage[];
  nodes: AppNode[];
  edges: AppEdge[];
  outputStructure: TemplateOutputStructure;
  completionCriteria: string[];
  exportBehavior?: Partial<TemplateExportBehavior>;
  pack: 'primary' | 'legacy';
}): WorkflowTemplate => {
  const { exportBehavior, ...rest } = input;
  return {
    schemaVersion: TEMPLATE_SCHEMA_VERSION,
    ...rest,
    exportBehavior: {
      defaultFilenameStem: exportBehavior?.defaultFilenameStem ?? input.id,
      includeProcessAppendix: exportBehavior?.includeProcessAppendix ?? false,
    },
  };
};

export const emptySkeleton = (
  labels: { input: string; transforms: string[]; review?: string; output: string },
): { nodes: AppNode[]; edges: AppEdge[] } => {
  const nodes: AppNode[] = [
    {
      id: 'n_input',
      type: 'input',
      position: { x: 40, y: 120 },
      data: {
        title: labels.input,
        description: 'Paste unstructured source material',
        content: '',
        status: 'pending',
        category: 'source',
      },
    },
  ];

  labels.transforms.forEach((title, index) => {
    nodes.push({
      id: `n_t${index + 1}`,
      type: 'transform',
      position: { x: 360, y: 40 + index * 160 },
      data: {
        title,
        description: 'Structure this slice of the source',
        content: '',
        status: 'pending',
        category: 'other',
      },
    });
  });

  if (labels.review) {
    nodes.push({
      id: 'n_review',
      type: 'review',
      position: { x: 700, y: 120 },
      data: {
        title: labels.review,
        description: 'Human verification checkpoint',
        content: '',
        status: 'pending',
        reviewRequired: true,
      },
    });
  }

  nodes.push({
    id: 'n_output',
    type: 'output',
    position: { x: labels.review ? 1040 : 700, y: 120 },
    data: {
      title: labels.output,
      description: '',
      content: '',
      status: 'pending',
      category: 'output',
    },
  });

  const edges: AppEdge[] = [];
  labels.transforms.forEach((_, index) => {
    edges.push({ id: `e_in_t${index + 1}`, source: 'n_input', target: `n_t${index + 1}` });
    if (labels.review) {
      edges.push({ id: `e_t${index + 1}_rev`, source: `n_t${index + 1}`, target: 'n_review' });
    } else {
      edges.push({ id: `e_t${index + 1}_out`, source: `n_t${index + 1}`, target: 'n_output' });
    }
  });
  if (labels.review) {
    edges.push({ id: 'e_rev_out', source: 'n_review', target: 'n_output' });
  }

  return { nodes, edges };
};
