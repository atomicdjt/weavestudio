const SITE_URL = 'https://weavestudio-nine.vercel.app';

type PageMetadata = {
  title: string;
  description: string;
  canonicalUrl: string;
  robots: 'index,follow' | 'noindex,follow';
};

const PUBLIC_METADATA: Record<string, Omit<PageMetadata, 'canonicalUrl'>> = {
  '/': {
    title: 'WeaveStudio — Local-First Workflow Canvas by David Turner',
    description: 'Turn fragmented research and client inputs into structured, reviewable, exportable deliverables with a local-first visual workflow canvas.',
    robots: 'index,follow',
  },
  '/templates': {
    title: 'Workflow Templates — WeaveStudio by David Turner',
    description: 'Explore reusable WeaveStudio templates for structuring research, discovery, operational, and client-deliverable workflows.',
    robots: 'index,follow',
  },
  '/docs': {
    title: 'WeaveStudio Docs — Local-First Workflow Canvas',
    description: 'Review WeaveStudio usage, privacy, data portability, exports, licensing, and local-first workflow guidance.',
    robots: 'index,follow',
  },
  '/acquire': {
    title: 'Acquire WeaveStudio — Local-First Workflow Product',
    description: 'Review WeaveStudio as a transferable local-first workflow product, including its capabilities, architecture, limitations, and buyer materials.',
    robots: 'index,follow',
  },
  '/app': {
    title: 'Workspace — WeaveStudio',
    description: 'Use the WeaveStudio local-first visual workspace to structure, review, and export workflow deliverables.',
    robots: 'noindex,follow',
  },
};

export function getPageMetadata(pathname: string): PageMetadata {
  const metadata = PUBLIC_METADATA[pathname];
  if (metadata) {
    return {
      ...metadata,
      canonicalUrl: pathname === '/' ? `${SITE_URL}/` : `${SITE_URL}${pathname}`,
    };
  }

  return {
    title: 'Page not found — WeaveStudio',
    description: 'The requested WeaveStudio page could not be found.',
    canonicalUrl: `${SITE_URL}${pathname.startsWith('/') ? pathname : `/${pathname}`}`,
    robots: 'noindex,follow',
  };
}
