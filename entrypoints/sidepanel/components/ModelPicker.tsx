import { getModelsForProvider } from '@/lib/storage.ts';
import type { AiProvider } from '@/lib/messaging.ts';

type ModelPickerProps = {
  provider: AiProvider;
  value: string;
  onChange: (model: string) => void;
};

export function ModelPicker({ provider, value, onChange }: ModelPickerProps) {
  const models = getModelsForProvider(provider);

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2">
      <label htmlFor="model-picker" className="text-[11px] font-medium text-pm-muted">
        Model
      </label>
      <select
        id="model-picker"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer rounded-md border border-pm-border bg-pm-bg px-2.5 font-mono text-[11px] text-pm-text outline-none transition-colors focus:border-pm-border-focus focus:ring-1 focus:ring-pm-border-focus"
        style={{ height: '28px' }}
      >
        {models.map((model) => (
          <option
            key={model}
            value={model}
            style={{
              backgroundColor: 'var(--color-pm-surface)',
              color: 'var(--color-pm-text)',
            }}
          >
            {model}
          </option>
        ))}
      </select>
    </div>
  );
}
