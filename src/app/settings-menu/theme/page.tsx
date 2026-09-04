'use client';

import { useTheme } from '@/components/ThemeProvider';

const options = [
  { value: 'system', label: 'Default (System)' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const;

export default function ThemePage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">Theme</h1>
      <div className="divide-y rounded-lg border">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span>{opt.label}</span>
            {theme === opt.value && <span className="text-slate-900">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
