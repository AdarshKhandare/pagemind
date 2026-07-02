/**
 * useSessions — custom hook that mirrors the multi-session storage into
 * React state.
 *
 * Responsibilities:
 *   1. On mount, load `StoredSessions` from `chrome.storage.local` (which
 *      transparently migrates from the legacy single `HISTORY` key on first
 *      read). Until the load resolves we expose `loading === true` so the
 *      side panel can render its loading view instead of flashing an empty
 *      state.
 *   2. Provide imperative helpers (`createNewSession`, `selectSession`,
 *      `deleteSession`, `renameSession`) that talk to `storage` AND keep the
 *      hook's local state in sync.
 *   3. Expose a `refresh()` helper — call it after any out-of-band mutation
 *      to storage (most importantly, after `appendMessage` since that
 *      auto-titles the session and re-sorts the array by `updatedAt`).
 *
 * Unmount safety: a `mountedRef` guard prevents `setState` calls after
 * unmount — the same pattern used in the side panel's `App.tsx`.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { storage, type ChatSession } from '@/lib/storage.ts';

export type UseSessionsReturn = {
  sessions: ChatSession[];
  activeSessionId: string | null;
  loading: boolean;
  /**
   * Create a new empty session, set it active in storage, prepend it to the
   * local list, and return it. Resolves with the new session.
   */
  createNewSession: (init?: {
    title?: string;
    url?: string;
    origin?: string;
  }) => Promise<ChatSession>;
  /**
   * Switch the active session in storage and in local state.
   * Does NOT cancel any in-flight stream — the caller is responsible for
   * sending `CANCEL_STREAM` if needed (the side panel does this in its
   * `onSelect` / `onNew` handlers).
   */
  selectSession: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  renameSession: (id: string, title: string) => Promise<void>;
  /**
   * Re-read the full sessions blob from storage. Use after `appendMessage`
   * (or any other storage mutation performed by a sibling hook) so the picker
   * shows up-to-date titles, ordering, and activeSessionId.
   */
  refresh: () => Promise<void>;
};

export function useSessions(): UseSessionsReturn {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Initial load.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await storage.getSessions();
        if (cancelled || !mountedRef.current) return;
        setSessions(data.sessions);
        setActiveSessionId(data.activeSessionId);
      } catch (err) {
        // Defensive: if storage is corrupt the user should still see a panel.
        // Log to the extension console and fall back to an empty state.
        console.error('[PageMind] useSessions: initial load failed:', err);
        if (cancelled || !mountedRef.current) return;
        setSessions([]);
        setActiveSessionId(null);
      } finally {
        if (!cancelled && mountedRef.current) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const data = await storage.getSessions();
      if (!mountedRef.current) return;
      setSessions(data.sessions);
      setActiveSessionId(data.activeSessionId);
    } catch (err) {
      console.error('[PageMind] useSessions: refresh failed:', err);
    }
  }, []);

  const createNewSession = useCallback(
    async (init?: { title?: string; url?: string; origin?: string }): Promise<ChatSession> => {
      const session = await storage.createSession(init);
      if (!mountedRef.current) return session;
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      return session;
    },
    [],
  );

  const selectSession = useCallback(async (id: string): Promise<void> => {
    await storage.setActiveSession(id);
    if (!mountedRef.current) return;
    setActiveSessionId(id);
  }, []);

  const deleteSession = useCallback(async (id: string): Promise<void> => {
    await storage.deleteSession(id);
    // storage.deleteSession may have reassigned activeSessionId; pull the
    // canonical state back from storage rather than guessing locally.
    await refresh();
  }, [refresh]);

  const renameSession = useCallback(
    async (id: string, title: string): Promise<void> => {
      await storage.renameSession(id, title);
      await refresh();
    },
    [refresh],
  );

  return {
    sessions,
    activeSessionId,
    loading,
    createNewSession,
    selectSession,
    deleteSession,
    renameSession,
    refresh,
  };
}
