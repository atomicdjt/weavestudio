import { useState } from 'react';

export const MarkdownImage = ({ src, alt }: { src?: string; alt?: string }) => {
  const [allowedSource, setAllowedSource] = useState<string | null>(null);
  let url: URL;
  try { url = new URL(src || '', typeof window === 'undefined' ? 'https://localhost' : window.location.href); }
  catch { return <span>[Image unavailable: {alt || 'invalid URL'}]</span>; }
  if (!src || !['https:', 'http:'].includes(url.protocol)) return <span>[Image blocked: {alt || 'unsupported URL'}]</span>;
  const remote = typeof window === 'undefined' || url.origin !== window.location.origin;
  if (remote && allowedSource !== src) return <span className="inline-block rounded border border-slate-400 bg-slate-50 p-2 text-sm text-slate-900">
    <span>{alt || 'Remote image'} · {url.host}. Loading contacts this host.</span>{' '}
    <button type="button" className="font-semibold underline" onClick={() => setAllowedSource(src)}>Load remote image</button>
  </span>;
  return <img src={src} alt={alt || ''} referrerPolicy="no-referrer" loading="lazy" />;
};
