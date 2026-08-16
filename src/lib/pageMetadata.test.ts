import { describe, expect, it } from 'vitest';
import { getPageMetadata } from './pageMetadata';

describe('getPageMetadata', () => {
  it('gives public content routes distinct canonical URLs', () => {
    expect(getPageMetadata('/').canonicalUrl).toBe('https://weavestudio-nine.vercel.app/');
    expect(getPageMetadata('/templates').canonicalUrl).toBe('https://weavestudio-nine.vercel.app/templates');
    expect(getPageMetadata('/docs').canonicalUrl).toBe('https://weavestudio-nine.vercel.app/docs');
    expect(getPageMetadata('/acquire').canonicalUrl).toBe('https://weavestudio-nine.vercel.app/acquire');
  });

  it('keeps the interactive workspace out of search results', () => {
    const metadata = getPageMetadata('/app');
    expect(metadata.robots).toBe('noindex,follow');
    expect(metadata.canonicalUrl).toBe('https://weavestudio-nine.vercel.app/app');
  });

  it('marks unknown routes noindex', () => {
    const metadata = getPageMetadata('/not-a-real-page');
    expect(metadata.robots).toBe('noindex,follow');
    expect(metadata.title).toContain('Page not found');
  });
});
