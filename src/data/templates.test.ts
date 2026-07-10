import { describe, expect, it } from 'vitest';
import {
  getLegacyTemplates,
  getPrimaryTemplates,
  getTemplateById,
  resolveTemplateId,
  TEMPLATES,
} from './templates';

describe('templates registry', () => {
  it('exposes five primary templates', () => {
    const primary = getPrimaryTemplates();
    expect(primary).toHaveLength(5);
    expect(primary.every((t) => t.pack === 'primary')).toBe(true);
  });

  it('keeps a non-empty legacy pack', () => {
    expect(getLegacyTemplates().length).toBeGreaterThan(0);
  });

  it('every template has stages and output structure', () => {
    for (const template of TEMPLATES) {
      expect(template.stages.length).toBeGreaterThan(0);
      expect(template.outputStructure.requiredSections.length).toBeGreaterThan(0);
      expect(template.nodes.length).toBeGreaterThan(0);
      expect(template.inputInstructions.length).toBeGreaterThan(0);
    }
  });

  it('resolves legacy aliases', () => {
    expect(resolveTemplateId('client-discovery')).toBe('client-proposal-builder');
    expect(resolveTemplateId('meeting-action')).toBe('meeting-action-plan');
    expect(getTemplateById('client-proposal-builder')).toBeTruthy();
  });
});
