import type { AiMessage, AiProvider } from '../messaging.ts';
import { OpenAICompatibleProvider } from './openai-compatible.ts';

/**
 * Unified parameters for generating text via any supported AI provider.
 */
export type GenerateTextParams = {
  provider: AiProvider;
  model: string;
  messages: AiMessage[];
  temperature?: number;
  maxTokens?: number;
  /** AbortSignal to cancel the stream (e.g. user cancels, new request supersedes). */
  signal?: AbortSignal;
};

/**
 * Every AI provider implements this interface. The service worker is the only
 * context that holds an instance and performs network calls.
 */
export interface AiProviderClient {
  generateText(params: GenerateTextParams): AsyncGenerator<string>;
}

/**
 * Factory for provider clients. Both OpenAI and DeepSeek share the same
 * OpenAI-compatible protocol — the only difference is the base URL.
 */
export function getProvider(
  name: AiProvider,
  apiKey: string,
  baseUrl: string,
): AiProviderClient {
  switch (name) {
    case 'openai':
    case 'deepseek':
      return new OpenAICompatibleProvider(apiKey, baseUrl, name);
    default: {
      const _exhaustive: never = name;
      throw new Error(`Unknown provider: ${_exhaustive}`);
    }
  }
}
