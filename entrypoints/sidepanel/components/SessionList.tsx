/**
 * SessionList — dropdown panel for picking, creating, deleting, and renaming
 * chat sessions.
 *
 * Rendered as an absolute-positioned popover inside the side panel header.
 * All session mutations are delegated up via callbacks; this component owns
 * only the "rename" inline-edit state and the open/close UI logic.
 *
 * Render rules:
 *   - When `open` is false, returns `null` (no DOM cost).
 *   - When open, renders a panel with a "New chat" button, a scrollable list
 *     of sessions, and handles outside-click + Escape dismissal.
 *   - The active session is highlighted with `bg-pm-primary-subtle`.
 *   - Double-clicking a title swaps it for an `<input>` (Enter commits, Escape
 *     cancels, blur commits).
 */

import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { ChatSession } from '@/lib/storage.ts';

export type SessionListProps = {
  sessions: ChatSession[];
  activeSessionId: string | null;
  open: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onClose: () => void;
};

/**
 * Format a millisecond timestamp as a compact relative time string.
 * Mirrors common chat-app conventions: "now", "Xm", "Xh", "Xd", or a
 * locale-formatted date for anything older than a week.
 */
function formatRelativeTime(ts: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - ts);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  // Older than a week — show a short date (e.g. "Jun 12"). Stable across
  // re-renders because the timestamp is stable.
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function SessionList({
  sessions,
  activeSessionId,
  open,
  onSelect,
  onNew,
  onDelete,
  onRename,
  onClose,
}: SessionListProps) {
  // Inline rename state. When non-null, that session's title renders as an
  // <input> with autoFocus.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const editInputRef = useRef<HTMLInputElement | null>(null);
  // Stable ref to the panel root for outside-click detection.
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Dismiss on outside click + Escape while the popover is open.
  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (event: globalThis.MouseEvent) => {
      const target = event.target as Node | null;
      if (panelRef.current && target && !panelRef.current.contains(target)) {
        onClose();
      }
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        // If the user is mid-rename, Escape should cancel the rename first,
        // not close the panel.
        if (editingId !== null) {
          setEditingId(null);
          setEditValue('');
          return;
        }
        onClose();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose, editingId]);

  // Auto-focus the rename input when edit mode is entered.
  useEffect(() => {
    if (editingId !== null) {
      // Defer to next tick so the input is mounted before we focus/select.
      const id = window.setTimeout(() => {
        const el = editInputRef.current;
        if (el) {
          el.focus();
          el.select();
        }
      }, 0);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [editingId]);

  if (!open) return null;

  const startEditing = (session: ChatSession): void => {
    setEditingId(session.id);
    setEditValue(session.title);
  };

  const commitRename = (id: string): void => {
    const trimmed = editValue.trim();
    // Empty title = cancel (do nothing destructive). Otherwise commit.
    if (trimmed.length > 0 && trimmed !== sessions.find((s) => s.id === id)?.title) {
      onRename(id, trimmed);
    }
    setEditingId(null);
    setEditValue('');
  };

  const cancelEditing = (): void => {
    setEditingId(null);
    setEditValue('');
  };

  const handleRenameKeyDown = (e: KeyboardEvent<HTMLInputElement>, id: string): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitRename(id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };

  const handleRowClick = (id: string): void => {
    if (editingId !== null) return; // Don't switch sessions while renaming.
    onSelect(id);
  };

  const handleDeleteClick = (e: MouseEvent<HTMLButtonElement>, id: string): void => {
    e.stopPropagation();
    if (editingId === id) cancelEditing();
    onDelete(id);
  };

  const handleNewClick = (): void => {
    if (editingId !== null) cancelEditing();
    onNew();
  };

  return (
    <div
      ref={panelRef}
      role="menu"
      aria-label="Chat sessions"
      className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-pm-border bg-pm-surface shadow-lg"
    >
      {/* New chat button */}
      <button
        type="button"
        role="menuitem"
        onClick={handleNewClick}
        className="flex w-full cursor-pointer items-center gap-2 border-b border-pm-border-subtle px-3 py-2 text-left text-[13px] font-medium text-pm-primary transition-colors hover:bg-pm-surface-hover focus:outline-none focus-visible:pm-focus-ring"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        New chat
      </button>

      {/* Session list */}
      <div className="pm-scrollbar max-h-72 overflow-y-auto">
        {sessions.length === 0 ? (
          <p className="px-3 py-4 text-center text-[12px] text-pm-muted-subtle">
            No chats yet — start a new one above.
          </p>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const isEditing = editingId === session.id;
            return (
              <div
                key={session.id}
                role="menuitem"
                tabIndex={0}
                onClick={() => handleRowClick(session.id)}
                onKeyDown={(e) => {
                  if (isEditing) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRowClick(session.id);
                  }
                }}
                className={`group flex cursor-pointer items-center gap-2 px-3 py-2 transition-colors hover:bg-pm-surface-hover focus:outline-none focus-visible:pm-focus-ring ${
                  isActive ? 'bg-pm-primary-subtle' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => commitRename(session.id)}
                      onKeyDown={(e) => handleRenameKeyDown(e, session.id)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyUp={(e) => e.stopPropagation()}
                      className="w-full rounded border border-pm-border-focus bg-pm-bg px-1.5 py-0.5 text-[13px] text-pm-text outline-none"
                      maxLength={120}
                      aria-label="Rename session"
                    />
                  ) : (
                    <p
                      className="truncate text-[13px] text-pm-text"
                      title={session.title}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEditing(session);
                      }}
                    >
                      {session.title}
                    </p>
                  )}
                  <p className="mt-0.5 text-[10px] text-pm-muted-subtle">
                    {formatRelativeTime(session.updatedAt)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDeleteClick(e, session.id)}
                  aria-label={`Delete "${session.title}"`}
                  title="Delete chat"
                  className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded text-pm-muted opacity-0 transition-all hover:bg-pm-surface-hover hover:text-pm-danger focus:opacity-100 focus:outline-none focus-visible:pm-focus-ring group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
