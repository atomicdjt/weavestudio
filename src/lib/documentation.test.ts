/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('current product evidence and provider guidance', () => {
  it('does not advertise retired providers or a stale frozen verification count', () => {
    for (const file of [
      'docs/KNOWN_LIMITATIONS.md', 'docs/RELEASE_VERIFICATION.md',
      'docs/audit/FEATURE-REALITY-MATRIX.md', 'docs/audit/LOCAL-FIRST-PRIVACY-AUDIT.md',
      'docs/audit/TECHNICAL-DEBT-REGISTER.md', 'docs/product/TEST-STRATEGY.md',
      'docs/product/GOLDEN-PATH-SPECIFICATION.md', 'docs/product/DELIVERABLE-ENGINE-SPECIFICATION.md',
      'src/pages/DocsPage.tsx', 'src/pages/WorkspacePage.tsx',
      'src/components/canvas/WorkflowCanvas.tsx', 'src/data/templates/legacy.ts',
    ]) {
      const text = readFileSync(file, 'utf8');
      expect(text, file).not.toMatch(/\bMock\b|\bOllama\b|offline\/mock/i);
      expect(text, file).not.toMatch(/npm test[^\n]*\d+ tests passing/i);
      expect(text, file).not.toMatch(/golden path works offline|AI Mock offline|E2E suite[^\n]*Planned|ACCEPTANCE-CRITERIA\.md/i);
    }
  });
  it('has a commit-bound verification receipt and explicitly unmeasured study instruments', () => {
    const verification = readFileSync('scripts/verify-release.mjs', 'utf8');
    expect(verification).toContain('git');
    expect(verification).toContain('startedAt');
    expect(verification).toContain('exitCode');
    const study = readFileSync('docs/research/STUDY_PROTOCOL.md', 'utf8');
    expect(study).toContain('No participant results have been collected');
    expect(study).toContain('consultant');
    expect(study).toContain('researcher');
    expect(study).toContain('operations');
  });
});
