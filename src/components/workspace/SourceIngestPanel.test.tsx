import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SourceIngestPanel } from './SourceIngestPanel';

describe('SourceIngestPanel provenance authoring', () => {
  it('renders a disabled source-fragment action until source text is selected', () => {
    const html = renderToStaticMarkup(
      <SourceIngestPanel
        sourceMaterial="Alpha evidence. Beta evidence."
        syncStatus="in_sync"
        onChange={() => undefined}
        onApplyToInput={() => undefined}
        onSplitIntoNodes={() => undefined}
        onAddSourceFragment={() => undefined}
      />,
    );

    expect(html).toContain('Add source fragment');
    expect(html).toMatch(/disabled[^>]*>[^<]*Add source fragment|Add source fragment[\s\S]*disabled/);
  });
});
