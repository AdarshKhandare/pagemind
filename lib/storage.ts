/**
 * chrome.storage.local wrapper for PageMind.
 *
 * BYOK: API keys are stored locally and never leave the service worker
 * except inside fetch() calls to the user's chosen provider.
 */

import type { AiProvider } from './messaging.ts';

export const StorageKey = {
  API_KEYS: 'apiKeys',
  SETTINGS: 'settings',
  HISTORY: 'history',
  SESSIONS: 'sessions',
} as const;

export type ProviderConfig = {
  apiKey: string;
  baseUrl: string;
};

export type StoredApiKeys = {
  openai?: ProviderConfig;
  deepseek?: ProviderConfig;
};

export type StoredSettings = {
  provider: AiProvider;
  model: string;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
};

export type StoredHistory = {
  messages: ChatMessage[];
  updatedAt: number;
};

export type ChatSession = {
  id: string;
  title: string;
  url?: string;
  origin?: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

export type StoredSessions = {
  sessions: ChatSession[];
  activeSessionId: string | null;
};

export type StorageShape = {
  [StorageKey.API_KEYS]: StoredApiKeys;
  [StorageKey.SETTINGS]: StoredSettings;
  [StorageKey.HISTORY]: StoredHistory;
  [StorageKey.SESSIONS]: StoredSessions;
};

/**
 * OpenAI models available via the API (confirmed from developers.openai.com/api/docs/models).
 * Note: "codex" models are no longer listed on the OpenAI API models page — the Codex
 * product is a CLI/app, not API models. GPT-5.x models handle code tasks natively.
 * Pricing (per 1M tokens): gpt-5.5 $5/$30, gpt-5.4 $2.50/$15, gpt-5.4-mini $0.75/$4.50.
 */
export const OPENAI_MODELS = [
  'gpt-5.5',
  'gpt-5.4',
  'gpt-5.4-mini',
  'gpt-5.4-nano',
] as const;

export type OpenAiModel = (typeof OPENAI_MODELS)[number];

export const DEEPSEEK_MODELS = [
  'deepseek-v4-flash',
  'deepseek-v4-pro',
] as const;

export type DeepSeekModel = (typeof DEEPSEEK_MODELS)[number];

export const DEFAULT_BASE_URLS = {
  openai: 'https://api.openai.com/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
} as const;

export const DEFAULT_SETTINGS: StoredSettings = {
  provider: 'openai',
  model: OPENAI_MODELS[0],
};

/** Bug 1 fix: Validates a value is one of the supported AiProvider literals.
 *  Users with a previous Groq build (or any now-removed provider) have stale
 *  `provider: 'groq'` data in chrome.storage.local — this guard catches that
 *  before getModelsForProvider() throws. */
export const VALID_PROVIDERS: AiProvider[] = ['openai', 'deepseek'];

export function isValidProvider(value: unknown): value is AiProvider {
  return typeof value === 'string' && VALID_PROVIDERS.includes(value as AiProvider);
}

/** Max characters to send to the AI — ~25K tokens, safely under typical 128K context windows. */
export const MAX_CONTENT_CHARS = 100_000;

export function getModelsForProvider(provider: AiProvider): readonly string[] {
  switch (provider) {
    case 'openai':
      return OPENAI_MODELS;
    case 'deepseek':
      return DEEPSEEK_MODELS;
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Unknown provider: ${_exhaustive}`);
    }
  }
}

export function getBaseUrlForProvider(
  provider: AiProvider,
  keys?: StoredApiKeys,
): string {
  return keys?.[provider]?.baseUrl ?? DEFAULT_BASE_URLS[provider];
}

async function get<TKey extends keyof StorageShape>(
  key: TKey,
): Promise<StorageShape[TKey] | undefined> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (result) => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
      } else {
        resolve(result[key] as StorageShape[TKey] | undefined);
      }
    });
  });
}

async function set<TKey extends keyof StorageShape>(
  key: TKey,
  value: StorageShape[TKey],
): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: value }, () => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
      } else {
        resolve();
      }
    });
  });
}

/** Sort sessions array in-place by updatedAt DESC (most recent first). */
function sortSessionsDesc(sessions: ChatSession[]): ChatSession[] {
  sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  return sessions;
}

/** Slice content to 40 chars, appending "…" if truncated. */
function truncateTitle(content: string): string {
  return content.length > 40 ? content.slice(0, 40) + '\u2026' : content;
}

export const storage = {
  getApiKeys: () => get(StorageKey.API_KEYS),
  setApiKeys: (keys: StoredApiKeys) => set(StorageKey.API_KEYS, keys),

  getSettings: async () => {
    const settings = await get(StorageKey.SETTINGS);
    if (!settings) return DEFAULT_SETTINGS;

    // Bug 1 fix: Validate the stored provider before trusting it. Users who
    // previously had the Groq build (or any other removed provider) still
    // have stale settings in chrome.storage.local — falling back to
    // DEFAULT_SETTINGS prevents getModelsForProvider() from throwing.
    if (!isValidProvider(settings.provider)) {
      return DEFAULT_SETTINGS;
    }

    // Fix 11: Validate that the stored model is valid for the stored provider.
    // Handles the case where a model is removed or the provider default changes.
    const validModels = getModelsForProvider(settings.provider);
    const isValidModel = validModels.some((m) => m === settings.model);
    if (!isValidModel) {
      return { ...settings, model: validModels[0] };
    }
    return settings;
  },
  setSettings: (settings: StoredSettings) => set(StorageKey.SETTINGS, settings),

  getHistory: async () => {
    const history = await get(StorageKey.HISTORY);
    return history ?? { messages: [], updatedAt: Date.now() };
  },
  setHistory: (history: StoredHistory) => set(StorageKey.HISTORY, history),

  clearHistory: () => set(StorageKey.HISTORY, { messages: [], updatedAt: Date.now() }),

  // ── Multi-session chat storage ──────────────────────────────────────

  getSessions: async (): Promise<StoredSessions> => {
    const existing = await get(StorageKey.SESSIONS);
    if (existing) return existing;

    // One-time migration: read legacy HISTORY key and wrap it in a session.
    const history = await get(StorageKey.HISTORY);
    if (history && history.messages.length > 0) {
      const firstUserMsg = history.messages.find((m) => m.role === 'user');
      const title = firstUserMsg ? truncateTitle(firstUserMsg.content) : 'Imported chat';
      const ts = history.updatedAt || Date.now();
      const session: ChatSession = {
        id: crypto.randomUUID(),
        title,
        messages: history.messages,
        createdAt: ts,
        updatedAt: ts,
      };
      const migrated: StoredSessions = {
        sessions: [session],
        activeSessionId: session.id,
      };
      await set(StorageKey.SESSIONS, migrated);
      // Free up the chrome.storage.local quota by removing the now-redundant
      // legacy HISTORY key. The migration guard above prevents re-migration,
      // so this is safe to do once. Errors are ignored — the key may already
      // be gone (e.g. user cleared storage between the get and the remove).
      await new Promise<void>((resolve) => {
        chrome.storage.local.remove(StorageKey.HISTORY, () => {
          resolve();
        });
      });
      return migrated;
    }

    // No history either — persist empty state so migration never re-runs.
    const empty: StoredSessions = { sessions: [], activeSessionId: null };
    await set(StorageKey.SESSIONS, empty);
    return empty;
  },

  setSessions: (sessions: StoredSessions) => set(StorageKey.SESSIONS, sessions),

  createSession: async (init?: {
    title?: string;
    url?: string;
    origin?: string;
  }): Promise<ChatSession> => {
    const data = await storage.getSessions();
    const now = Date.now();
    const session: ChatSession = {
      id: crypto.randomUUID(),
      title: init?.title ?? 'New chat',
      url: init?.url,
      origin: init?.origin,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    data.sessions.unshift(session);
    data.activeSessionId = session.id;
    await set(StorageKey.SESSIONS, data);
    return session;
  },

  getActiveSession: async (): Promise<ChatSession | null> => {
    const data = await storage.getSessions();
    if (!data.activeSessionId) return null;
    return data.sessions.find((s) => s.id === data.activeSessionId) ?? null;
  },

  setActiveSession: async (id: string): Promise<void> => {
    const data = await storage.getSessions();
    data.activeSessionId = id;
    await set(StorageKey.SESSIONS, data);
  },

  updateSession: async (
    id: string,
    patch: Partial<Omit<ChatSession, 'id'>>,
  ): Promise<void> => {
    const data = await storage.getSessions();
    const session = data.sessions.find((s) => s.id === id);
    if (!session) return;
    Object.assign(session, patch, { updatedAt: Date.now() });
    sortSessionsDesc(data.sessions);
    await set(StorageKey.SESSIONS, data);
  },

  appendMessage: async (id: string, message: ChatMessage): Promise<void> => {
    const data = await storage.getSessions();
    const session = data.sessions.find((s) => s.id === id);
    if (!session) return;

    // Auto-title from first user message when still on default title.
    const isFirstUserMsg =
      message.role === 'user' && !session.messages.some((m) => m.role === 'user');
    const isDefaultTitle = session.title === 'New chat' || session.title === '';
    if (isFirstUserMsg && isDefaultTitle) {
      session.title = truncateTitle(message.content);
    }

    session.messages.push(message);
    session.updatedAt = Date.now();
    sortSessionsDesc(data.sessions);
    await set(StorageKey.SESSIONS, data);
  },

  deleteSession: async (id: string): Promise<void> => {
    const data = await storage.getSessions();
    const idx = data.sessions.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const wasActive = data.activeSessionId === id;
    data.sessions.splice(idx, 1);
    if (wasActive) {
      data.activeSessionId = data.sessions.length > 0 ? data.sessions[0].id : null;
    }
    await set(StorageKey.SESSIONS, data);
  },

  renameSession: async (id: string, title: string): Promise<void> => {
    const data = await storage.getSessions();
    const session = data.sessions.find((s) => s.id === id);
    if (!session) return;
    session.title = title;
    // Does NOT bump updatedAt — rename is not a content change.
    await set(StorageKey.SESSIONS, data);
  },

  clearAllSessions: async (): Promise<void> => {
    await set(StorageKey.SESSIONS, { sessions: [], activeSessionId: null });
  },
};
