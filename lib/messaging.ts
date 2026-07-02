/**
 * Typed message bus for PageMind.
 *
 * Direction:
 * - OPEN_SIDE_PANEL: content script / action -> background -> side panel opened
 * - EXTRACT_PAGE: background -> content script -> response with page text
 * - AI_GENERATE: side panel -> background -> streaming response
 * - AI_STREAM_CHUNK / AI_DONE / AI_ERROR: background -> side panel
 * - CANCEL_STREAM: side panel -> background -> abort current stream
 * - USER_MESSAGE: background -> side panel -> display synthetic user message
 */

export const MessageType = {
  OPEN_SIDE_PANEL: 'OPEN_SIDE_PANEL',
  EXTRACT_PAGE: 'EXTRACT_PAGE',
  AI_GENERATE: 'AI_GENERATE',
  AI_STREAM_CHUNK: 'AI_STREAM_CHUNK',
  AI_DONE: 'AI_DONE',
  AI_ERROR: 'AI_ERROR',
  CANCEL_STREAM: 'CANCEL_STREAM',
  USER_MESSAGE: 'USER_MESSAGE',
} as const;

export type MessageTypeKey = (typeof MessageType)[keyof typeof MessageType];

export type AiProvider = 'openai' | 'deepseek';

export type AiMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type OpenSidePanelMessage = {
  type: typeof MessageType.OPEN_SIDE_PANEL;
};

export type ExtractPageMessage = {
  type: typeof MessageType.EXTRACT_PAGE;
};

export type ExtractPageResult = {
  success: true;
  title: string;
  content: string;
  url: string;
  selection?: string;
};

export type ExtractPageError = {
  success: false;
  error: string;
};

export type ExtractPageResponse = ExtractPageResult | ExtractPageError;

export type AiGenerateMessage = {
  type: typeof MessageType.AI_GENERATE;
  payload: {
    provider: AiProvider;
    model: string;
    messages: AiMessage[];
    temperature?: number;
    maxTokens?: number;
    requestId?: string;
  };
};

export type AiStreamChunkMessage = {
  type: typeof MessageType.AI_STREAM_CHUNK;
  payload: {
    chunk: string;
    requestId?: string;
  };
};

export type AiDoneMessage = {
  type: typeof MessageType.AI_DONE;
  payload?: {
    requestId?: string;
  };
};

export type AiErrorMessage = {
  type: typeof MessageType.AI_ERROR;
  payload: {
    error: string;
    requestId?: string;
  };
};

export type CancelStreamMessage = {
  type: typeof MessageType.CANCEL_STREAM;
};

export type UserMessage = {
  type: typeof MessageType.USER_MESSAGE;
  payload: {
    content: string;
    requestId?: string;
  };
};

export type BackgroundRequest =
  | OpenSidePanelMessage
  | ExtractPageMessage
  | AiGenerateMessage
  | CancelStreamMessage;

export type SidePanelMessage =
  | AiStreamChunkMessage
  | AiDoneMessage
  | AiErrorMessage
  | UserMessage;

export type ContentRequest = ExtractPageMessage;
export type ContentResponse = ExtractPageResponse;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isTypedMessage(
  value: unknown,
  expectedType: MessageTypeKey,
): value is { type: MessageTypeKey } {
  return isRecord(value) && value.type === expectedType;
}

export function isOpenSidePanelMessage(
  value: unknown,
): value is OpenSidePanelMessage {
  return isTypedMessage(value, MessageType.OPEN_SIDE_PANEL);
}

export function isExtractPageMessage(
  value: unknown,
): value is ExtractPageMessage {
  return isTypedMessage(value, MessageType.EXTRACT_PAGE);
}

export function isAiGenerateMessage(
  value: unknown,
): value is AiGenerateMessage {
  return isTypedMessage(value, MessageType.AI_GENERATE);
}

export function isSidePanelMessage(
  value: unknown,
): value is SidePanelMessage {
  if (!isRecord(value)) return false;
  return (
    isTypedMessage(value, MessageType.AI_STREAM_CHUNK) ||
    isTypedMessage(value, MessageType.AI_DONE) ||
    isTypedMessage(value, MessageType.AI_ERROR) ||
    isTypedMessage(value, MessageType.USER_MESSAGE)
  );
}

export function isCancelStreamMessage(
  value: unknown,
): value is CancelStreamMessage {
  return isTypedMessage(value, MessageType.CANCEL_STREAM);
}

export async function sendToBackground<TResponse = void>(
  message: BackgroundRequest,
): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: TResponse) => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
      } else {
        resolve(response);
      }
    });
  });
}

export async function sendToTab<TResponse = void>(
  tabId: number,
  message: ContentRequest,
): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response: TResponse) => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
      } else {
        resolve(response);
      }
    });
  });
}

export async function sendToSidePanel(message: SidePanelMessage): Promise<boolean> {
  try {
    await chrome.runtime.sendMessage(message);
    return true;
  } catch {
    return false;
  }
}
