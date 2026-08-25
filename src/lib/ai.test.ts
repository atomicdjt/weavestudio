import { describe, expect, it, vi } from 'vitest';
import { runAIRequest } from './ai';

describe('runAIRequest', () => {
  it('sends Gemini keys in the supported header rather than the URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'draft' }] } }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(runAIRequest({ provider: 'gemini', model: 'gemini-2.5-flash', apiKey: 'secret-key', prompt: 'summarize' }, new AbortController().signal))
      .resolves.toEqual({ text: 'draft' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent');
    expect(url).not.toContain('secret-key');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('secret-key');
  });
});
