import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Database,
  FileText,
  HelpCircle,
  Languages,
  PenLine,
} from 'lucide-react';

type ActionBarProps = {
  onSummarize: () => void;
  onExplain: () => void;
  onRewrite: () => void;
  onTranslate: (language: string) => void;
  onExtract: () => void;
  isStreaming: boolean;
  disabled?: boolean;
};

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Hindi',
  'Chinese',
  'Japanese',
  'Korean',
  'Arabic',
  'Portuguese',
  'Russian',
  'Italian',
] as const;

type Language = (typeof LANGUAGES)[number];

const ENABLED_PILL_CLASS =
  'flex cursor-pointer items-center gap-1.5 rounded-full border border-pm-border bg-transparent font-display text-[12px] font-medium text-pm-muted transition-all duration-150 hover:bg-pm-surface-hover hover:text-pm-text active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:pm-focus-ring';

export function ActionBar({
  onSummarize,
  onExplain,
  onRewrite,
  onTranslate,
  onExtract,
  isStreaming,
  disabled = false,
}: ActionBarProps) {
  const [isLangOpen, setIsLangOpen] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const isBusy = isStreaming || disabled;

  // Close the popover when the parent disables the bar (e.g. streaming starts
  // mid-open) so we never display a dropdown over a disabled control.
  useEffect(() => {
    if (isBusy) {
      setIsLangOpen(false);
    }
  }, [isBusy]);

  // Outside click + Escape key close the language menu.
  useEffect(() => {
    if (!isLangOpen) {
      return;
    }

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (popoverRef.current && target && !popoverRef.current.contains(target)) {
        setIsLangOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLangOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLangOpen]);

  const handleSelectLanguage = (language: Language): void => {
    onTranslate(language);
    setIsLangOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-pm-border bg-pm-surface px-4 py-2.5">
      <button
        type="button"
        onClick={onSummarize}
        disabled={isBusy}
        aria-label="Summarize page"
        className="flex cursor-pointer items-center gap-1.5 rounded-full bg-pm-primary font-display text-[13px] font-semibold text-white shadow-md shadow-pm-primary/20 transition-all duration-150 ease-out hover:bg-pm-primary-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:pm-focus-ring"
        style={{ height: '30px', padding: '0 14px' }}
      >
        <FileText className="h-3.5 w-3.5" aria-hidden="true" />
        Summarize page
      </button>

      <button
        type="button"
        onClick={onExplain}
        disabled={isBusy}
        aria-label="Explain"
        className={ENABLED_PILL_CLASS}
        style={{ height: '30px', padding: '0 12px' }}
      >
        <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
        Explain
      </button>

      <button
        type="button"
        onClick={onRewrite}
        disabled={isBusy}
        aria-label="Rewrite"
        className={ENABLED_PILL_CLASS}
        style={{ height: '30px', padding: '0 12px' }}
      >
        <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
        Rewrite
      </button>

      <div className="relative" ref={popoverRef}>
        <button
          type="button"
          onClick={() => {
            if (isBusy) {
              return;
            }
            setIsLangOpen((open) => !open);
          }}
          disabled={isBusy}
          aria-haspopup="menu"
          aria-expanded={isLangOpen}
          aria-label="Translate"
          className={ENABLED_PILL_CLASS}
          style={{ height: '30px', padding: '0 12px' }}
        >
          <Languages className="h-3.5 w-3.5" aria-hidden="true" />
          Translate
          <ChevronDown
            className={`h-3 w-3 transition-transform duration-150 ${
              isLangOpen ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>
        {isLangOpen ? (
          <div
            role="menu"
            aria-label="Select target language"
            className="absolute left-0 top-full z-50 mt-1 max-h-60 min-w-[160px] overflow-y-auto pm-scrollbar rounded-lg border border-pm-border bg-pm-surface py-1 shadow-lg"
          >
            {LANGUAGES.map((language) => (
              <button
                key={language}
                type="button"
                role="menuitem"
                onClick={() => handleSelectLanguage(language)}
                className="block w-full cursor-pointer px-3 py-1.5 text-left text-[12px] text-pm-text hover:bg-pm-surface-hover focus:outline-none focus-visible:pm-focus-ring"
              >
                {language}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onExtract}
        disabled={isBusy}
        aria-label="Extract"
        className={ENABLED_PILL_CLASS}
        style={{ height: '30px', padding: '0 12px' }}
      >
        <Database className="h-3.5 w-3.5" aria-hidden="true" />
        Extract
      </button>
    </div>
  );
}
