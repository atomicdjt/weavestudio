import { describe, expect, it, vi } from 'vitest';
import { exportPdfFile } from './exporter';

const printed = vi.hoisted(() => [] as Array<{ page: number; text: string; y: number }>);
vi.mock('jspdf', () => ({ default: class {
  page = 1;
  internal = { pageSize: { getHeight: () => 297, getWidth: () => 210 } };
  setFontSize() {}
  setFont() {}
  setTextColor() {}
  splitTextToSize(text: string) { return text.match(/.{1,60}/g) || ['']; }
  text(text: string | string[], _x: number, y: number) {
    for (const [i, line] of (Array.isArray(text) ? text : [text]).entries()) printed.push({ page: this.page, text: line, y: y + i * 5.5 });
  }
  addPage() { this.page++; }
  save() {}
} }));

describe('PDF reading export', () => {
  it('paginates every line of a block longer than one page without loss', async () => {
    printed.length = 0;
    const body = 'A'.repeat(9_000);
    await exportPdfFile(body, 'Long reading view');
    const content = printed.filter((line) => !line.text.startsWith('WeaveStudio'));
    expect(content.map((line) => line.text).join('')).toBe(body);
    expect(content.every((line) => line.y <= 279)).toBe(true);
    expect(new Set(content.map((line) => line.page)).size).toBeGreaterThan(2);
  });
});
