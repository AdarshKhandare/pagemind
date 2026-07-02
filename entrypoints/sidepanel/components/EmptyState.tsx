export function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center text-pm-muted pm-message-enter">
      <img
        src="/logo.png"
        alt="PageMind"
        className="mb-4 h-14 w-14 rounded-2xl object-contain shadow-glow-primary"
      />
      <p className="max-w-[16rem] text-[14px] leading-relaxed">
        Open a page and click <span className="font-semibold text-pm-text">Summarize</span>, or
        ask a question below.
      </p>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-pm-muted-subtle">
        <kbd className="rounded border border-pm-border bg-pm-surface px-1.5 py-0.5 font-mono text-[10px] text-pm-muted">
          Ctrl
        </kbd>
        <span>+</span>
        <kbd className="rounded border border-pm-border bg-pm-surface px-1.5 py-0.5 font-mono text-[10px] text-pm-muted">
          Shift
        </kbd>
        <span>+</span>
        <kbd className="rounded border border-pm-border bg-pm-surface px-1.5 py-0.5 font-mono text-[10px] text-pm-muted">
          S
        </kbd>
        <span className="ml-1">to summarize</span>
      </p>
    </div>
  );
}
