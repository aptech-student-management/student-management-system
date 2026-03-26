import { ReactNode } from 'react';
import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon: ReactNode;
  color: 'blue' | 'teal' | 'sky' | 'emerald' | 'amber' | 'purple' | 'rose';
  subtitle?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  color: _color,
  subtitle
}: StatCardProps) {
  return (
    <div className="ui-panel-surface ui-panel-surface-strong relative overflow-hidden rounded-[28px] p-5">
      <div className="pointer-events-none absolute inset-0 ui-stat-accent-glow" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent dark:via-white/[0.1]" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="ui-text-muted text-[11px] font-semibold uppercase tracking-[0.18em]">
            {title}
          </p>

          <p className="ui-text-strong mt-3 text-[2rem] font-semibold tracking-[-0.05em]">
            {value}
          </p>

          {subtitle && (
            <p className="ui-text-muted mt-1 text-xs leading-6">
              {subtitle}
            </p>
          )}

          {change && (
            <div
              className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                changeType === 'up'
                  ? 'border-emerald-500/15 bg-emerald-500/[0.08] text-emerald-700 dark:border-emerald-400/15 dark:bg-emerald-400/[0.08] dark:text-emerald-200'
                  : changeType === 'down'
                    ? 'border-red-500/15 bg-red-500/[0.08] text-red-700 dark:border-red-400/15 dark:bg-red-400/[0.08] dark:text-red-200'
                    : 'ui-subtle-surface ui-text-base'
              }`}
            >
              {changeType === 'up' && <TrendingUpIcon className="h-3 w-3" />}
              {changeType === 'down' && <TrendingDownIcon className="h-3 w-3" />}
              {change}
            </div>
          )}
        </div>

        <div className="ui-accent-surface relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[18px] border">
          <div className="ui-accent-text">{icon}</div>
        </div>
      </div>
    </div>
  );
}
