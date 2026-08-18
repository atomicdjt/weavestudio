import type { WorkflowValidatorResult } from '../types';

export const getCompletenessHelperText = (result: WorkflowValidatorResult) =>
  result.issueCount === 0
    ? 'No structural or review-gate issues remain. The score does not verify factual accuracy.'
    : 'Start with the first suggested fix below. The score reflects workflow structure and required human review state, not factual accuracy.';
