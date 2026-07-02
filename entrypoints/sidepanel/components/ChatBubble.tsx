import { User, Bot } from 'lucide-react';
import { Markdown } from './Markdown.tsx';

type ChatBubbleProps = {
  role: 'user' | 'assistant';
  content: string;
  isStreaming: boolean;
};

export function ChatBubble({ role, content, isStreaming }: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`pm-message-enter flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? 'bg-pm-surface text-pm-muted'
            : 'bg-pm-accent-subtle text-pm-accent'
        }`}
        aria-hidden="true"
      >
        {isUser ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] rounded-lg px-3.5 py-2 text-[13.5px] leading-relaxed shadow-xs ${
          isUser
            ? 'rounded-tr-sm bg-pm-user-bubble text-pm-user-bubble-text'
            : 'rounded-tl-sm border border-pm-border bg-pm-assistant-bubble text-pm-assistant-bubble-text'
        }`}
      >
        {isUser ? (
          // User bubbles render plain text — preserve the user's exact input.
          <span className="whitespace-pre-wrap break-words">{content}</span>
        ) : (
          // Assistant bubbles are rendered as markdown. The streaming cursor is
          // appended after the markdown block so it stays at the end of the
          // bubble while content streams in.
          <>
            <Markdown content={content} />
            {isStreaming && (
              <span className="pm-streaming-cursor ml-0.5 inline-block select-none" aria-hidden="true">
                │
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
