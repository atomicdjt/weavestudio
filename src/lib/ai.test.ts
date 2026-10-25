import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAIRequestSignature, runAIRequest } from './ai';

afterEach(() => {
  vi.unstubAllGlobals();
});

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

  it('parses the documented OpenAI Responses output content shape', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      output: [{
        type: 'message',
        content: [{ type: 'output_text', text: 'A reviewable provider draft.' }],
      }],
      usage: { input_tokens: 8, output_tokens: 5 },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })));

    await expect(runAIRequest({ provider: 'openai', model: 'gpt-4o-mini', apiKey: 'test-key', prompt: 'draft' }, new AbortController().signal))
      .resolves.toEqual({ text: 'A reviewable provider draft.', usage: { inputTokens: 8, outputTokens: 5 } });
  });

  it('surfaces an OpenAI refusal as a safety outcome instead of malformed output', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      output: [{
        type: 'message',
        content: [{ type: 'refusal', refusal: 'I cannot provide that draft.' }],
      }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })));

    await expect(runAIRequest({ provider: 'openai', model: 'gpt-4o-mini', apiKey: 'test-key', prompt: 'draft' }, new AbortController().signal))
      .rejects.toMatchObject({ code: 'safety', message: 'OpenAI refused this request: I cannot provide that draft.' });
  });

  it.each([
    [401, 'auth'],
    [429, 'rate_limit'],
  ] as const)('classifies HTTP %s as %s', async (status, code) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status })));

    await expect(runAIRequest({ provider: 'openai', model: 'gpt-4o-mini', apiKey: 'test-key', prompt: 'draft' }, new AbortController().signal))
      .rejects.toMatchObject({ code });
  });

  it('preserves cancellation as an aborted provider result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError')));

    await expect(runAIRequest({ provider: 'openai', model: 'gpt-4o-mini', apiKey: 'test-key', prompt: 'draft' }, new AbortController().signal))
      .rejects.toMatchObject({ code: 'aborted', message: 'The request was cancelled.' });
  });

  it('changes the request signature whenever the target revision changes', () => {
    const initial = createAIRequestSignature({
      provider: 'openai', model: 'gpt-4o-mini', promptInstruction: 'Summarize', expectedInput: 'Source A', expectedOutput: '', content: '',
    });
    const changed = createAIRequestSignature({
      provider: 'openai', model: 'gpt-4o-mini', promptInstruction: 'Summarize', expectedInput: 'Source B', expectedOutput: '', content: '',
    });

    expect(changed).not.toBe(initial);
  });
});
