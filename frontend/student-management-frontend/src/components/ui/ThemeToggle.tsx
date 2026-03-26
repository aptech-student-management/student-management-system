import React from 'react';
import { MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  compact?: boolean;
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center rounded-2xl border border-slate-200/80 bg-white/80 text-slate-700 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-[#05070b]/90 dark:text-slate-100 dark:hover:border-slate-700 dark:hover:bg-[#070a0f] ${
        compact ? 'gap-2 px-3 py-2' : 'gap-3 px-3.5 py-2.5'
      }`}
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      title={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
    >
      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${
        isDark
          ? 'bg-white/5 text-slate-200'
          : 'bg-slate-900/[0.06] text-slate-700'
      }`}>
        {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
      </span>

      {!compact && (
        <span className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            Theme
          </span>
          <span className="text-sm font-semibold">
            {isDark ? 'Dark Mode' : 'Light Mode'}
          </span>
        </span>
      )}
    </button>
  );
}
