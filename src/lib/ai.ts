export type AIProviderId = 'openai' | 'gemini';

export type AIRequest = { provider: AIProviderId; model: string; apiKey: string; prompt: string };
export type AIResponse = { text: string; usage?: { inputTokens?: number; outputTokens?: number } };
export type AIProviderErrorCode = 'auth' | 'rate_limit' | 'model' | 'safety' | 'timeout' | 'aborted' | 'network' | 'malformed' | 'unknown';
export class AIProviderError extends Error {
  code: AIProviderErrorCode;
  constructor(code: AIProviderErrorCode, message: string) { super(message); this.code = code; }
}

export const PROVIDER_MODELS: Record<AIProviderId, string[]> = {
  openai: ['gpt-4o-mini', 'gpt-4.1-mini'],
  gemini: ['gemini-2.0-flash', 'gemini-2.5-flash'],
};

const normaliseError = (provider: AIProviderId, status: number): AIProviderError => {
  if (status === 401 || status === 403) return new AIProviderError('auth', `${provider === 'openai' ? 'OpenAI' : 'Gemini'} rejected the credential or permission.`);
  if (status === 429) return new AIProviderError('rate_limit', 'The provider is rate limited or has no available quota. Try again later.');
  if (status === 400 || status === 404) return new AIProviderError('model', 'The selected model is unavailable for this provider key.');
  return new AIProviderError('unknown', 'The provider could not complete this request.');
};

export const runAIRequest = async (request: AIRequest, signal: AbortSignal): Promise<AIResponse> => {
  try {
    if (request.provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST', signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${request.apiKey}` },
        body: JSON.stringify({ model: request.model, input: request.prompt }),
      });
      if (!response.ok) throw normaliseError('openai', response.status);
      const json = await response.json() as { output_text?: unknown; usage?: { input_tokens?: number; output_tokens?: number } };
      if (typeof json.output_text !== 'string' || !json.output_text.trim()) throw new AIProviderError('malformed', 'OpenAI returned no usable text output.');
      return { text: json.output_text, usage: { inputTokens: json.usage?.input_tokens, outputTokens: json.usage?.output_tokens } };
    }
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(request.model)}:generateContent?key=${encodeURIComponent(request.apiKey)}`, {
      method: 'POST', signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: request.prompt }] }] }),
    });
    if (!response.ok) throw normaliseError('gemini', response.status);
    const json = await response.json() as { promptFeedback?: { blockReason?: string }; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }> };
    if (json.promptFeedback?.blockReason) throw new AIProviderError('safety', 'Gemini blocked this request under its safety settings.');
    const text = json.candidates?.flatMap((candidate) => candidate.content?.parts ?? []).map((part) => part.text ?? '').join('').trim();
    if (!text) throw new AIProviderError('malformed', 'Gemini returned no usable text output.');
    return { text };
  } catch (error) {
    if (error instanceof AIProviderError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') throw new AIProviderError('aborted', 'The request was cancelled.');
    throw new AIProviderError('network', 'Could not reach the provider. Check your connection and try again.');
  }
};
