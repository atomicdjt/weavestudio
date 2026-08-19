import { describe, expect, it } from 'vitest';
import type { WorkflowValidatorResult } from '../types';
import { getCompletenessHelperText } from './workflowValidatorPresentation';

const result = (issueCount: number): WorkflowValidatorResult => ({
  completenessScore: issueCount === 0 ? 100 : 88,
  issueCount,
  exportReadiness: issueCount === 0 ? 'Ready' : 'Needs Review',
  issues: issueCount === 0 ? [] : [{ id: 'x', status: 'Needs Review', title: 'x', detail: 'x', suggestedFix: 'x' }],
  walkthrough: [],
});

describe('Workflow Validator presentation copy', () => {
  it('does not direct users to a nonexistent suggested fix at zero issues', () => {
    expect(getCompletenessHelperText(result(0))).not.toContain('first suggested fix');
  });

  it('directs users to fixes when issues exist', () => {
    expect(getCompletenessHelperText(result(1))).toContain('first suggested fix');
  });
});
