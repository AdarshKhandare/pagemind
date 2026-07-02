import type { GenerateTextParams, AiProviderClient } from './providers.ts';
import type { AiProvider } from '../messaging.ts';

const REQUEST_TIMEOUT_MS = 90_000;

export class AiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'AiError';
  }
}

export class OpenAICompatibleProvider implements AiProviderClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly providerName: AiProvider,
  ) {}

  async *generateText(params: GenerateTextParams): AsyncGenerator<string> {
    const { model, messages, temperature, maxTokens, signal } = params;

    // Combine the caller's signal with a 90s timeout.
    const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    const combinedSignal = signal
      ? AbortSignal.any([signal, timeoutSignal])
      : timeoutSignal;

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        ...(temperature !== undefined && { temperature }),
        ...(maxTokens !== undefined && { max_tokens: maxTokens }),
      }),
      signal: combinedSignal,
    });

    if (!response.ok) {
      const status = response.status;
      let detail = '';
      try {
        const body = (await response.json()) as { error?: { message?: string } };
        detail = body.error?.message ?? '';
      } catch {
        // ignore parse failure
      }

      const provider = capitalize(this.providerName);
      if (status === 401) {
        throw new AiError(
          `Invalid API key for ${provider}. ${detail}`.trim(),
          status,
        );
      }
      if (status === 429) {
        throw new AiError(
          `${provider} rate limit reached. ${detail}`.trim(),
          status,
        );
      }
      throw new AiError(
        `${provider} request failed (${status}). ${detail}`.trim(),
        status,
      );
    }

    const body = response.body;
    if (!body) {
      throw new AiError(`${capitalize(this.providerName)} response body is empty.`);
    }

    const reader = body.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const chunk = this.parseSseLine(line);
          if (chunk) yield chunk;
        }
      }

      if (buffer.trim()) {
        const chunk = this.parseSseLine(buffer);
        if (chunk) yield chunk;
      }
    } finally {
      try {
        reader.releaseLock();
      } catch {
        // Already released (e.g. stream was cancelled via AbortSignal).
      }
    }
  }

  private parseSseLine(line: string): string | null {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith('data:')) return null;

    const payload = trimmed.slice(trimmed.indexOf(':') + 1).trim();
    if (payload === '[DONE]') return null;

    try {
      const data = JSON.parse(payload) as {
        choices?: Array<{
          delta?: { content?: string | null };
        }>;
      };
      return data.choices?.[0]?.delta?.content ?? null;
    } catch {
      return null;
    }
  }
}

function capitalize(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}
