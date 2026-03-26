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
      className={`ui-subtle-surface ui-subtle-hover inline-flex items-center rounded-2xl shadow-sm transition-all duration-200 ${
        compact ? 'gap-2 px-3 py-2' : 'gap-3 px-3.5 py-2.5'
      }`}
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      title={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
    >
      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border ${isDark ? 'ui-accent-surface' : 'ui-icon-surface'}`}>
        {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
      </span>

      {!compact && (
        <span className="hidden sm:flex flex-col items-start leading-tight">
          <span className="ui-text-muted text-[11px] font-medium uppercase tracking-[0.18em]">
            Giao diện
          </span>
          <span className="ui-text-strong text-sm font-semibold">
            {isDark ? 'Chế độ tối' : 'Chế độ sáng'}
          </span>
        </span>
      )}
    </button>
  );
}
