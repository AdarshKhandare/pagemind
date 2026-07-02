import { useEffect, useState, type FormEvent } from 'react';
import { Eye, EyeOff, Save, ExternalLink, Check, Lock } from 'lucide-react';
import {
  storage,
  OPENAI_MODELS,
  DEFAULT_BASE_URLS,
  getModelsForProvider,
  type StoredApiKeys,
  type ProviderConfig,
} from '@/lib/storage.ts';
import type { AiProvider } from '@/lib/messaging.ts';

const PROVIDERS: AiProvider[] = ['openai', 'deepseek'];

const PROVIDER_META: Record<
  AiProvider,
  { label: string; keyLink: string; keyLinkText: string; defaultBaseUrl: string }
> = {
  openai: {
    label: 'OpenAI',
    keyLink: 'https://platform.openai.com/api-keys',
    keyLinkText: 'Get an OpenAI key',
    defaultBaseUrl: DEFAULT_BASE_URLS.openai,
  },
  deepseek: {
    label: 'DeepSeek',
    keyLink: 'https://platform.deepseek.com/api_keys',
    keyLinkText: 'Get a DeepSeek key',
    defaultBaseUrl: DEFAULT_BASE_URLS.deepseek,
  },
};

function ensureConfig(
  keys: StoredApiKeys,
  provider: AiProvider,
): ProviderConfig {
  return (
    keys[provider] ?? {
      apiKey: '',
      baseUrl: PROVIDER_META[provider].defaultBaseUrl,
    }
  );
}

export default function App() {
  const [keys, setKeys] = useState<StoredApiKeys>({});
  const [showKey, setShowKey] = useState<Record<AiProvider, boolean>>({
    openai: false,
    deepseek: false,
  });
  const [provider, setProvider] = useState<AiProvider>('openai');
  const [model, setModel] = useState<string>(OPENAI_MODELS[0]);
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Bug 2 fix: try/catch + fall back to defaults so the options page
        // can never get stuck on the "Loading…" screen.
        const [loadedKeys, settings] = await Promise.all([
          storage.getApiKeys(),
          storage.getSettings(),
        ]);
        setKeys(loadedKeys ?? {});
        setProvider(settings.provider);
        setModel(settings.model);
      } catch (err) {
        console.error('[PageMind] Options load failed:', err);
        setKeys({});
        setProvider('openai');
        setModel(OPENAI_MODELS[0]);
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    try {
      await Promise.all([
        storage.setApiKeys(keys),
        storage.setSettings({ provider, model }),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('[PageMind] Save failed:', err);
    }
  }

  function updateProviderConfig(
    providerName: AiProvider,
    patch: Partial<ProviderConfig>,
  ) {
    setKeys((prev) => ({
      ...prev,
      [providerName]: {
        ...ensureConfig(prev, providerName),
        ...patch,
      },
    }));
  }

  function handleProviderChange(nextProvider: AiProvider) {
    setProvider(nextProvider);
    setModel(getModelsForProvider(nextProvider)[0]);
  }

  function toggleVisibility(providerName: AiProvider) {
    setShowKey((prev) => ({ ...prev, [providerName]: !prev[providerName] }));
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pm-bg text-pm-muted">
        <div className="flex items-center gap-2 text-[13px]">
          <img src="/logo.png" alt="PageMind" className="h-3.5 w-3.5 animate-pulse" />
          Loading…
        </div>
      </div>
    );
  }

  const availableModels = getModelsForProvider(provider);

  return (
    <div className="min-h-screen bg-pm-bg p-6 text-pm-text">
      <div className="mx-auto max-w-xl rounded-2xl border border-pm-border bg-pm-surface p-6 shadow-lg shadow-black/20">
        <div className="mb-6 flex items-center gap-3">
          <img
            src="/logo.png"
            alt="PageMind"
            className="h-10 w-10 rounded-xl object-contain shadow-glow-primary"
          />
          <div>
            <h1 className="font-display text-[18px] font-semibold text-pm-text">PageMind Settings</h1>
            <p className="text-[12px] text-pm-muted">Bring your own API keys</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {PROVIDERS.map((p) => {
            const meta = PROVIDER_META[p];
            const config = ensureConfig(keys, p);
            return (
              <ProviderSection
                key={p}
                provider={p}
                label={meta.label}
                config={config}
                keyLink={meta.keyLink}
                keyLinkText={meta.keyLinkText}
                visible={showKey[p]}
                onToggleVisibility={() => toggleVisibility(p)}
                onChange={(patch) => updateProviderConfig(p, patch)}
              />
            );
          })}

          <div className="rounded-xl border border-pm-border bg-pm-bg p-4">
            <h2 className="mb-3 font-display text-[13px] font-semibold text-pm-text">Default provider</h2>
            <div className="mb-4 flex flex-wrap gap-2">
              {PROVIDERS.map((p) => (
                <label
                  key={p}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 font-display text-[13px] font-semibold transition-all ${
                    provider === p
                      ? 'border-pm-primary bg-pm-primary-subtle text-pm-text'
                      : 'border-pm-border bg-pm-surface text-pm-muted hover:border-pm-border-subtle hover:text-pm-text'
                  }`}
                >
                  <input
                    type="radio"
                    name="provider"
                    value={p}
                    checked={provider === p}
                    onChange={() => handleProviderChange(p)}
                    className="h-4 w-4 cursor-pointer accent-pm-primary"
                  />
                  {PROVIDER_META[p].label}
                </label>
              ))}
            </div>

            <label htmlFor="model" className="mb-1.5 block text-[12px] font-medium text-pm-muted">
              Default model
            </label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-pm-border bg-pm-surface px-3 text-[13px] text-pm-text outline-none transition-colors focus:border-pm-border-focus focus:ring-1 focus:ring-pm-border-focus"
              style={{ height: '36px' }}
            >
              {availableModels.map((m) => (
                <option
                  key={m}
                  value={m}
                  style={{
                    backgroundColor: 'var(--color-pm-surface)',
                    color: 'var(--color-pm-text)',
                  }}
                >
                  {m}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-pm-muted-subtle">
              Models shown are for the selected default provider.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-pm-primary px-4 font-display text-[13px] font-semibold text-white shadow-md shadow-pm-primary/20 transition-all duration-150 ease-out hover:bg-pm-primary-hover active:scale-95 focus:outline-none focus-visible:pm-focus-ring"
              style={{ height: '36px' }}
            >
              {saved ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Save settings
                </>
              )}
            </button>
            {saved && (
              <span className="flex items-center gap-1 font-display text-[12px] font-semibold text-pm-success">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Settings saved
              </span>
            )}
          </div>
        </form>

        <div className="mt-6 flex items-start gap-2 rounded-xl border border-pm-border-subtle bg-pm-bg p-4 text-[12px] text-pm-muted">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pm-muted-subtle" aria-hidden="true" />
          <p>
            <span className="font-semibold text-pm-text">Privacy note.</span> Your API keys are
            stored locally in chrome.storage.local and are only sent to your chosen AI provider.
            PageMind does not collect telemetry or page content.
          </p>
        </div>
      </div>
    </div>
  );
}

type ProviderSectionProps = {
  provider: AiProvider;
  label: string;
  config: ProviderConfig;
  keyLink: string;
  keyLinkText: string;
  visible: boolean;
  onToggleVisibility: () => void;
  onChange: (patch: Partial<ProviderConfig>) => void;
};

function ProviderSection({
  provider,
  label,
  config,
  keyLink,
  keyLinkText,
  visible,
  onToggleVisibility,
  onChange,
}: ProviderSectionProps) {
  return (
    <div className="rounded-xl border border-pm-border bg-pm-bg p-4 transition-colors hover:border-pm-border-subtle">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-[13px] font-semibold text-pm-text">{label} API key</h2>
        <a
          href={keyLink}
          target="_blank"
          rel="noreferrer"
          className="flex cursor-pointer items-center gap-1 text-[12px] text-pm-primary transition-colors hover:text-pm-primary-hover"
        >
          {keyLinkText}
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <input
            id={`${provider}-api-key`}
            type={visible ? 'text' : 'password'}
            value={config.apiKey}
            onChange={(e) => onChange({ apiKey: e.target.value })}
            placeholder={`Paste your ${label} API key`}
            className="w-full rounded-md border border-pm-border bg-pm-surface px-3 pr-10 text-[13px] text-pm-text outline-none transition-colors placeholder:text-pm-muted-subtle focus:border-pm-border-focus focus:ring-1 focus:ring-pm-border-focus"
            style={{ height: '36px' }}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={onToggleVisibility}
            className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-pm-muted transition-colors hover:bg-pm-surface-hover hover:text-pm-text"
            aria-label={visible ? `Hide ${label} API key` : `Show ${label} API key`}
          >
            {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>

        <div>
          <label
            htmlFor={`${provider}-base-url`}
            className="mb-1.5 block text-[11px] font-medium text-pm-muted"
          >
            Base URL
          </label>
          <input
            id={`${provider}-base-url`}
            type="text"
            value={config.baseUrl}
            onChange={(e) => onChange({ baseUrl: e.target.value })}
            placeholder={PROVIDER_META[provider].defaultBaseUrl}
            className="w-full rounded-md border border-pm-border bg-pm-surface px-3 text-[12px] text-pm-text outline-none transition-colors placeholder:text-pm-muted-subtle focus:border-pm-border-focus focus:ring-1 focus:ring-pm-border-focus"
            style={{ height: '32px' }}
            spellCheck={false}
          />
          <p className="mt-1 text-[11px] text-pm-muted-subtle">
            Leave as default unless you are using a proxy or custom endpoint.
          </p>
        </div>
      </div>
    </div>
  );
}
