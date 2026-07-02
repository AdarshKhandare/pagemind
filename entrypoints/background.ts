import {
  isOpenSidePanelMessage,
  isExtractPageMessage,
  isAiGenerateMessage,
  isCancelStreamMessage,
  sendToSidePanel,
  sendToTab,
  MessageType,
  type ExtractPageResponse,
  type AiProvider,
  type AiMessage,
} from '@/lib/messaging.ts';
import { storage, MAX_CONTENT_CHARS, getBaseUrlForProvider } from '@/lib/storage.ts';
import { getProvider } from '@/lib/ai/providers.ts';
import {
  buildActionMessages,
  ACTION_LABELS,
  type ActionType,
} from '@/lib/actions.ts';

/** IDs used for the right-click context menu items. */
type ContextMenuId =
  | 'pagemind-summarize'
  | 'pagemind-explain'
  | 'pagemind-rewrite'
  | 'pagemind-translate'
  | 'pagemind-extract';

interface ContextMenuConfig {
  title: string;
  contexts: Array<'page' | 'selection'>;
  action: ActionType;
  /** Only set for the translate entry; the side-panel picker passes its own. */
  targetLanguage?: string;
}

/**
 * Single source of truth for context-menu registration and click routing.
 * To add a new action, add an entry here and an `ActionType` branch in
 * `lib/actions.ts` — the rest of the pipeline (commands, side panel,
 * streaming) is generic.
 */
const CONTEXT_MENU_ITEMS: Record<ContextMenuId, ContextMenuConfig> = {
  'pagemind-summarize': {
    title: 'Summarize page with PageMind',
    contexts: ['page'],
    action: 'summarize',
  },
  'pagemind-explain': {
    title: 'Explain with PageMind',
    contexts: ['page', 'selection'],
    action: 'explain',
  },
  'pagemind-rewrite': {
    title: 'Rewrite with PageMind',
    contexts: ['page', 'selection'],
    action: 'rewrite',
  },
  'pagemind-translate': {
    title: 'Translate with PageMind',
    contexts: ['page', 'selection'],
    action: 'translate',
    targetLanguage: 'English',
  },
  'pagemind-extract': {
    title: 'Extract data with PageMind',
    contexts: ['page', 'selection'],
    action: 'extract',
  },
};

/** URLs that content scripts cannot be injected into. */
const NON_INJECTABLE_PREFIXES = [
  'chrome://',
  'chrome-extension://',
  'chrome-search://',
  'devtools://',
  'view-source:',
  'about:',
  'edge://',
  'data:',
  'file://',
  'https://chrome.google.com/webstore',
  'https://chromewebstore.google.com',
];

/** Keepalive alarm name used during streaming. */
const KEEPALIVE_ALARM = 'pagemind-keepalive';

/** Module-level controller — only one stream at a time. */
let currentController: AbortController | null = null;

/**
 * Self-contained page-content extractor injected via chrome.scripting.executeScript
 * when the content script isn't present (tab was open before extension load).
 * Runs in the page's isolated world — has access to document/window/location.
 * Uses document.body.innerText as a fallback (lower quality than Readability but
 * always works). MUST be self-contained: no outer-scope references.
 */
function extractPageContentInline(maxChars: number): {
  title: string;
  content: string;
  url: string;
  selection: string;
} {
  const selection =
    typeof window !== 'undefined' && window.getSelection
      ? window.getSelection()?.toString() ?? ''
      : '';
  const title = document.title || 'Untitled';
  const content = (document.body?.innerText ?? '').slice(0, maxChars);
  const url = location.href;
  return { title, content, url, selection };
}

export default defineBackground(() => {
  // Open the side panel when the toolbar icon is clicked.
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error: unknown) => {
      console.error('[PageMind] Failed to set side panel behavior:', error);
    });

  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install' || details.reason === 'update') {
      chrome.contextMenus.removeAll(() => {
        (Object.keys(CONTEXT_MENU_ITEMS) as ContextMenuId[]).forEach((id) => {
          const config = CONTEXT_MENU_ITEMS[id];
          // Chrome's `contexts` field is typed as a non-empty tuple
          // `[ContextType, ...ContextType[]]`. We know our literals are
          // all valid ContextType values and every entry has at least one
          // context, so the cast is sound.
          chrome.contextMenus.create({
            id,
            title: config.title,
            contexts: config.contexts as [
              chrome.contextMenus.ContextType,
              ...chrome.contextMenus.ContextType[],
            ],
          });
        });
      });
    }
  });

  // Fix 5: Open sidePanel synchronously (user gesture) before any await.
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    const menuItemId = info.menuItemId;
    if (typeof menuItemId !== 'string') return;
    if (menuItemId in CONTEXT_MENU_ITEMS) {
      const config = CONTEXT_MENU_ITEMS[menuItemId as ContextMenuId];
      const windowId = tab?.windowId ?? chrome.windows.WINDOW_ID_CURRENT;
      chrome.sidePanel.open({ windowId });
      void handleActionCommand(config.action, config.targetLanguage);
    }
  });

  // Fix 5: Open sidePanel synchronously for keyboard commands.
  chrome.commands.onCommand.addListener((command) => {
    if (command === 'summarize-page') {
      // Open side panel synchronously to preserve user gesture context.
      chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
      void handleActionCommand('summarize');
    } else if (command === 'explain-selection') {
      chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
      void handleActionCommand('explain');
    }
  });

  // No-op alarm listener — its existence keeps the SW alive during streaming.
  chrome.alarms.onAlarm.addListener(() => {
    // Intentionally empty; the alarm's sole purpose is SW keepalive.
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (isOpenSidePanelMessage(message)) {
      const windowId = _sender.tab?.windowId ?? chrome.windows.WINDOW_ID_CURRENT;
      console.log('[PageMind] OPEN_SIDE_PANEL received, opening side panel for windowId:', windowId);
      void chrome.sidePanel.open({ windowId }).then(
        () => {
          console.log('[PageMind] sidePanel.open() succeeded');
          sendResponse(undefined);
        },
        (error: unknown) => {
          console.error('[PageMind] sidePanel.open() FAILED:', error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        },
      );
      return true;
    }

    if (isExtractPageMessage(message)) {
      void handleExtractPage().then(
        (result) => sendResponse(result),
        (error: unknown) =>
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          }),
      );
      return true;
    }

    if (isAiGenerateMessage(message)) {
      void handleAiGenerate(message.payload);
      // No synchronous response; the side panel receives streaming messages.
      sendResponse(undefined);
      return true;
    }

    // Fix 3: Handle CANCEL_STREAM from side panel.
    if (isCancelStreamMessage(message)) {
      currentController?.abort();
      currentController = null;
      chrome.alarms.clear(KEEPALIVE_ALARM).catch(() => {});
      sendResponse(undefined);
      return true;
    }

    return false;
  });

  async function handleExtractPage(): Promise<ExtractPageResponse> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      return { success: false, error: 'No active tab found.' } as const;
    }

    // Fix 9: Graceful error for non-injectable pages.
    const tabUrl = tab.url ?? '';
    if (NON_INJECTABLE_PREFIXES.some((prefix) => tabUrl.startsWith(prefix))) {
      return {
        success: false,
        error: "PageMind doesn't work on browser system pages. Try it on a regular article or website.",
      } as const;
    }

    // Primary path: the content script is present (tab loaded after install).
    try {
      return await sendToTab<ExtractPageResponse>(tab.id, { type: MessageType.EXTRACT_PAGE });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (
        !errorMsg.includes('Could not establish connection') &&
        !errorMsg.includes('Receiving end does not exist')
      ) {
        return { success: false, error: errorMsg };
      }
      // Fallback: content script not injected (tab open before extension load).
      // Inject a self-contained extractor directly — no listener needed.
      try {
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: extractPageContentInline,
          args: [MAX_CONTENT_CHARS],
        });
        if (result?.result) {
          return { success: true, ...result.result } as const;
        }
        return {
          success: false,
          error: 'PageMind could not read this page. Try reloading the page.',
        };
      } catch {
        return {
          success: false,
          error: 'PageMind needs access to this page. Try reloading the page, or use the toolbar icon to open PageMind.',
        };
      }
    }
  }

  async function handleAiGenerate(
    payload: {
      provider: AiProvider;
      model: string;
      messages: AiMessage[];
      temperature?: number;
      maxTokens?: number;
      requestId?: string;
    },
  ) {
    const { requestId } = payload;

    // Fix 2: Abort any in-flight stream.
    if (currentController) {
      currentController.abort();
    }
    // Capture this request's controller in a local so the catch/finally
    // blocks can reason about THIS request, not whatever the module-level
    // `currentController` was reassigned to by a newer request.
    const myController = new AbortController();
    currentController = myController;
    const signal = myController.signal;

    // Fix 1: Keepalive alarm — create before streaming, clear in finally.
    chrome.alarms.create(KEEPALIVE_ALARM, { periodInMinutes: 0.33 });

    try {
      const keys = await storage.getApiKeys();
      const config = keys?.[payload.provider];
      if (!config?.apiKey) {
        await sendToSidePanel({
          type: MessageType.AI_ERROR,
          payload: { error: 'No API key set. Open options to add your API key.', requestId },
        });
        return;
      }

      const baseUrl = getBaseUrlForProvider(payload.provider, keys);
      const provider = getProvider(payload.provider, config.apiKey, baseUrl);
      const stream = provider.generateText({ ...payload, signal });

      let consecutiveFailures = 0;
      for await (const chunk of stream) {
        // Fix 3: Belt-and-suspenders — break if delivery fails twice consecutively.
        const delivered = await sendToSidePanel({
          type: MessageType.AI_STREAM_CHUNK,
          payload: { chunk, requestId },
        });
        if (!delivered) {
          consecutiveFailures++;
          if (consecutiveFailures >= 2) break;
        } else {
          consecutiveFailures = 0;
        }
      }

      await sendToSidePanel({ type: MessageType.AI_DONE, payload: { requestId } });
    } catch (error: unknown) {
      // Check THIS request's controller (not the module-level currentController,
      // which may have been reassigned by a newer request). Otherwise an aborted
      // predecessor would be misread as the live one and we'd send a spurious
      // AI_ERROR for a request the user never saw.
      const wasUserCancel = myController.signal.aborted;
      if (wasUserCancel) return;
      // Timeout or other error — report it.
      await sendToSidePanel({
        type: MessageType.AI_ERROR,
        payload: {
          error: error instanceof Error ? error.message : String(error),
          requestId,
        },
      });
    } finally {
      // Only clear the module-level ref if it still points at this request.
      // Don't clobber a newer request's controller that took our place.
      if (currentController === myController) {
        currentController = null;
      }
      chrome.alarms.clear(KEEPALIVE_ALARM).catch(() => {});
    }
  }

  /**
   * Generic entry point used by context-menu items and keyboard commands.
   *
   * Pipeline:
   *  1. Extract the active page (title, url, content, optional selection).
   *  2. Truncate content to `MAX_CONTENT_CHARS` so the prompt stays inside
   *     the model context window.
   *  3. Validate the active provider has an API key configured.
   *  4. Echo a synthetic user message into the side panel so the conversation
   *     shows the action's intent.
   *  5. Build the action-specific prompt via `buildActionMessages` and stream
   *     it through `handleAiGenerate`.
   *
   * @param action         Which action to run. Drives both the prompt
   *                       construction (in `lib/actions.ts`) and the
   *                       synthetic user-message label shown in the panel.
   * @param targetLanguage Only meaningful when `action === 'translate'`.
   *                       The context-menu entry passes 'English' as a
   *                       sensible default since it has no language picker;
   *                       the side-panel Translate button supplies the
   *                       real value.
   */
  async function handleActionCommand(
    action: ActionType,
    targetLanguage?: string,
  ): Promise<void> {
    try {
      // Give the side panel time to mount its message listener after open().
      // chrome.sidePanel.open() returns before the React app registers onMessage,
      // so a USER_MESSAGE sent immediately would be silently dropped.
      // (handleExtractPage itself takes time messaging the content script, so
      // the total delay before USER_MESSAGE is sent is ~300ms + extraction time.)
      await new Promise((resolve) => setTimeout(resolve, 300));

      const result = await handleExtractPage();

      if (!result.success) {
        await sendToSidePanel({
          type: MessageType.AI_ERROR,
          payload: { error: result.error },
        });
        return;
      }

      // Fix 12: Truncate page content.
      const truncated =
        result.content.length > MAX_CONTENT_CHARS
          ? result.content.slice(0, MAX_CONTENT_CHARS) + '\n\n[... content truncated ...]'
          : result.content;

      const settings = await storage.getSettings();
      const keys = await storage.getApiKeys();
      const config = keys?.[settings.provider];
      if (!config?.apiKey) {
        await sendToSidePanel({
          type: MessageType.AI_ERROR,
          payload: { error: 'No API key set. Open options to add your API key.' },
        });
        return;
      }

      // Fix 13: Send synthetic user message so the conversation shows intent.
      const label =
        action === 'translate'
          ? `Translate to ${targetLanguage ?? 'English'}`
          : ACTION_LABELS[action];
      await sendToSidePanel({
        type: MessageType.USER_MESSAGE,
        payload: { content: label },
      });

      const requestId = crypto.randomUUID();
      const messages = buildActionMessages(action, {
        title: result.title,
        url: result.url,
        content: truncated,
        selection: result.selection,
        targetLanguage,
      });

      await handleAiGenerate({
        provider: settings.provider,
        model: settings.model,
        messages,
        requestId,
      });
    } catch (error: unknown) {
      await sendToSidePanel({
        type: MessageType.AI_ERROR,
        payload: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }
});
