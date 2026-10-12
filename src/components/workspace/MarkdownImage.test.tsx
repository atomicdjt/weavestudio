import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MarkdownImage } from './MarkdownImage';

describe('Markdown image privacy', () => {
  it('renders external images as an inert opt-in control', () => {
    const html = renderToStaticMarkup(<MarkdownImage src="https://images.example.org/tracker.png" alt="Source figure" />);
    expect(html).not.toContain('<img');
    expect(html).toContain('Load remote image');
    expect(html).toContain('images.example.org');
  });
  it('rejects unsafe schemes', () => {
    const html = renderToStaticMarkup(<MarkdownImage src="javascript:alert(1)" alt="Unsafe" />);
    expect(html).not.toContain('<img');
    expect(html).not.toContain('Load remote image');
  });
});
