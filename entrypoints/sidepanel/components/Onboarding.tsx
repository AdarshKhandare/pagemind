import { Key, ExternalLink, Lock } from 'lucide-react';

type OnboardingProps = {
  onAddKey: () => void;
  onSkip: () => void;
};

const PROVIDER_LINKS = [
  { label: 'OpenAI', url: 'https://platform.openai.com/api-keys' },
  { label: 'DeepSeek', url: 'https://platform.deepseek.com/api_keys' },
] as const;

export function Onboarding({ onAddKey, onSkip }: OnboardingProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-pm-bg px-6 py-8 pm-message-enter">
      {/* Logo mark */}
      <img
        src="/logo.png"
        alt="PageMind"
        className="mb-6 h-12 w-12 rounded-xl object-contain shadow-glow-primary"
      />

      {/* Heading */}
      <h1 className="mb-2 text-center font-display text-[18px] font-semibold text-pm-text">
        Welcome to PageMind
      </h1>

      {/* Description */}
      <p className="mb-7 max-w-[280px] text-center text-[14px] leading-relaxed text-pm-muted">
        Your AI sidekick for any webpage. Summarize articles, ask questions, and chat with
        page content — right from your browser.
      </p>

      {/* Primary CTA */}
      <button
        type="button"
        onClick={onAddKey}
        className="flex w-full max-w-[280px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-pm-primary font-display text-[13px] font-semibold text-white transition-all duration-150 ease-out hover:bg-pm-primary-hover active:scale-[0.97] focus:outline-none focus-visible:pm-focus-ring"
        style={{ height: '40px' }}
      >
        <Key className="h-3.5 w-3.5" aria-hidden="true" />
        Add API Key
      </button>

      {/* Key links */}
      <div className="mt-4 flex w-full max-w-[280px] items-center justify-center gap-3">
        <span className="text-[11px] text-pm-muted-subtle">Get a key:</span>
        {PROVIDER_LINKS.map((provider) => (
          <a
            key={provider.label}
            href={provider.url}
            target="_blank"
            rel="noreferrer"
            className="flex cursor-pointer items-center gap-1 text-[12px] text-pm-primary transition-colors hover:text-pm-primary-hover"
          >
            {provider.label}
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        ))}
      </div>

      {/* Skip */}
      <button
        type="button"
        onClick={onSkip}
        className="mt-4 cursor-pointer text-[13px] text-pm-muted transition-colors hover:text-pm-text"
      >
        I&apos;ll set up later →
      </button>

      {/* Spacer pushes privacy note to bottom */}
      <div className="flex-1" />

      {/* Privacy note */}
      <p className="mt-6 flex max-w-[280px] items-center justify-center gap-1.5 text-center text-[11px] leading-relaxed text-pm-muted-subtle">
        <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />
        Your keys are stored locally. PageMind never collects your data.
      </p>
    </div>
  );
}
