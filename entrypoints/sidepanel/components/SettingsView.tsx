import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Eye, EyeOff, Save, ExternalLink, Lock, Check } from 'lucide-react';
import {
  storage,
  OPENAI_MODELS,
  DEFAULT_BASE_URLS,
  getModelsForProvider,
  type StoredApiKeys,
  type ProviderConfig,
} from '@/lib/storage.ts';
import type { AiProvider } from '@/lib/messaging.ts';

type SettingsViewProps = {
  onBack: () => void;
  onSaved: () => void;
};

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

function ensureConfig(keys: StoredApiKeys, provider: AiProvider): ProviderConfig {
  return (
    keys[provider] ?? {
      apiKey: '',
      baseUrl: PROVIDER_META[provider].defaultBaseUrl,
    }
  );
}

export function SettingsView({ onBack, onSaved }: SettingsViewProps) {
  const [keys, setKeys] = useState<StoredApiKeys>({});
  const [showKey, setShowKey] = useState<Record<AiProvider, boolean>>({
    openai: false,
    deepseek: false,
  });
  const [provider, setProvider] = useState<AiProvider>('openai');
  const [model, setModel] = useState<string>(OPENAI_MODELS[0]);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [loadedKeys, settings] = await Promise.all([
          storage.getApiKeys(),
          storage.getSettings(),
        ]);
        // Bug 2 fix: tolerate missing/malformed values instead of crashing.
        setKeys(loadedKeys ?? {});
        setProvider(settings.provider);
        setModel(settings.model);
      } catch (err) {
        console.error('[PageMind] Settings load failed:', err);
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
    if (isSaving) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      await Promise.all([
        storage.setApiKeys(keys),
        storage.setSettings({ provider, model }),
      ]);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onSaved();
      }, 1200);
    } catch (err) {
      console.error('[PageMind] Save failed:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  function updateProviderConfig(providerName: AiProvider, patch: Partial<ProviderConfig>) {
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

  const availableModels = getModelsForProvider(provider);

  return (
    <div className="flex h-full flex-col bg-pm-bg pm-message-enter">
      {/* Header */}
      <header
        className="flex shrink-0 items-center gap-3 border-b border-pm-border bg-pm-surface/80 px-4 backdrop-blur-md"
        style={{ height: '56px' }}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-pm-muted transition-colors hover:bg-pm-surface-hover hover:text-pm-text focus:outline-none focus-visible:pm-focus-ring"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="font-display text-[15px] font-semibold text-pm-text">Settings</h1>
      </header>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-[13px] text-pm-muted">
          Loading…
        </div>
      ) : (
        <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
          <div className="pm-scrollbar flex-1 overflow-y-auto px-4 py-4">
            {/* Provider radio cards */}
            <div className="mb-4">
              <label className="mb-2 block text-[12px] font-medium text-pm-muted">
                Default provider
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PROVIDERS.map((p) => {
                  const meta = PROVIDER_META[p];
                  const isSelected = provider === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleProviderChange(p)}
                      className={`flex cursor-pointer items-center justify-center rounded-lg px-3 py-2.5 font-display text-[13px] font-semibold transition-all ${
                        isSelected
                          ? 'border border-pm-primary bg-pm-primary-subtle text-pm-text'
                          : 'border border-pm-border bg-pm-surface text-pm-muted hover:border-pm-border-subtle hover:text-pm-text'
                      }`}
                    >
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Per-provider config sections */}
            <div className="space-y-4">
              {PROVIDERS.map((p) => {
                const meta = PROVIDER_META[p];
                const config = ensureConfig(keys, p);
                const isActive = provider === p;
                return (
                  <div
                    key={p}
                    className={`rounded-lg border bg-pm-surface p-3 transition-opacity ${
                      isActive
                        ? 'border-pm-border'
                        : 'border-pm-border-subtle opacity-60'
                    }`}
                  >
                    <div className="mb-2.5 flex items-center justify-between">
                      <h2 className="font-display text-[13px] font-semibold text-pm-text">
                        {meta.label} API key
                      </h2>
                      <a
                        href={meta.keyLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex cursor-pointer items-center gap-1 text-[12px] text-pm-primary transition-colors hover:text-pm-primary-hover"
                      >
                        Get a {meta.label} key
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    </div>

                    <div className="space-y-3">
                      {/* API key input */}
                      <div className="relative">
                        <input
                          id={`${p}-api-key`}
                          type={showKey[p] ? 'text' : 'password'}
                          value={config.apiKey}
                          onChange={(e) => updateProviderConfig(p, { apiKey: e.target.value })}
                          placeholder={`Paste your ${meta.label} API key`}
                          className="w-full rounded-md border border-pm-border bg-pm-bg px-3 text-[13px] text-pm-text outline-none transition-colors placeholder:text-pm-muted-subtle focus:border-pm-border-focus focus:ring-1 focus:ring-pm-border-focus"
                          style={{ height: '36px' }}
                          autoComplete="off"
                          spellCheck={false}
                        />
                        <button
                          type="button"
                          onClick={() => toggleVisibility(p)}
                          className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-pm-muted transition-colors hover:bg-pm-surface-hover hover:text-pm-text"
                          aria-label={showKey[p] ? `Hide ${meta.label} API key` : `Show ${meta.label} API key`}
                        >
                          {showKey[p] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>

                      {/* Base URL */}
                      <div>
                        <label
                          htmlFor={`${p}-base-url`}
                          className="mb-1 block text-[11px] font-medium text-pm-muted"
                        >
                          Base URL
                        </label>
                        <input
                          id={`${p}-base-url`}
                          type="text"
                          value={config.baseUrl}
                          onChange={(e) => updateProviderConfig(p, { baseUrl: e.target.value })}
                          placeholder={meta.defaultBaseUrl}
                          className="w-full rounded-md border border-pm-border bg-pm-bg px-3 text-[12px] text-pm-text outline-none transition-colors placeholder:text-pm-muted-subtle focus:border-pm-border-focus focus:ring-1 focus:ring-pm-border-focus"
                          style={{ height: '32px' }}
                          spellCheck={false}
                        />
                        <p className="mt-1 text-[11px] text-pm-muted-subtle">
                          Leave as default unless using a proxy.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Model select (active provider) */}
            <div className="mt-4">
              <label
                htmlFor="settings-model"
                className="mb-1.5 block text-[12px] font-medium text-pm-muted"
              >
                Default model
              </label>
              <select
                id="settings-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full cursor-pointer rounded-md border border-pm-border bg-pm-bg px-3 text-[13px] text-pm-text outline-none transition-colors focus:border-pm-border-focus focus:ring-1 focus:ring-pm-border-focus"
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
              <p className="mt-1 text-[11px] text-pm-muted-subtle">
                Models shown are for the selected default provider.
              </p>
            </div>

            {/* Divider */}
            <div className="my-5 h-px bg-pm-border-subtle" />

            {/* Privacy note */}
            <p className="flex items-start gap-2 text-[11px] leading-relaxed text-pm-muted-subtle">
              <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
              Your API keys are stored locally in chrome.storage.local and are only sent to your
              chosen AI provider. PageMind does not collect telemetry or page content.
            </p>
          </div>

          {/* Save button (sticky) */}
          <div className="shrink-0 border-t border-pm-border bg-pm-surface/80 px-4 py-3 backdrop-blur-md">
            {saveError && (
              <p className="mb-2 text-[12px] text-pm-danger">{saveError}</p>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-pm-primary font-display text-[13px] font-semibold text-white transition-all duration-150 ease-out hover:bg-pm-primary-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:pm-focus-ring"
              style={{ height: '40px' }}
            >
              {saved ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  Saved
                </>
              ) : isSaving ? (
                <>
                  <Save className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                  Save settings
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
