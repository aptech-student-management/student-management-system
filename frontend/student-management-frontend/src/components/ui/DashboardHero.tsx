import type { ReactNode } from 'react';

type HeroAccent = 'lime' | 'amber' | 'blue';

interface HeroStat {
  label: string;
  value: string;
}

interface DashboardHeroProps {
  eyebrow?: string;
  title: string;
  description: string;
  stats?: HeroStat[];
  actions?: ReactNode;
  accent?: HeroAccent;
}

export function DashboardHero({
  eyebrow = 'Workspace',
  title,
  description,
  stats = [],
  actions,
  accent: _accent = 'lime'
}: DashboardHeroProps) {
  return (
    <section className="ui-panel-surface ui-panel-surface-strong relative overflow-hidden rounded-[32px] p-6">
      <div className="pointer-events-none absolute inset-0 ui-hero-accent-glow" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent dark:via-white/10" />

      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl space-y-3">
          <span className="ui-subtle-surface ui-text-muted inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
            {eyebrow}
          </span>
          <div className="space-y-2">
            <h2 className="ui-text-strong text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              {title}
            </h2>
            <p className="ui-text-muted max-w-2xl text-sm leading-7 sm:text-[15px]">
              {description}
            </p>
          </div>
        </div>

        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>

      {stats.length > 0 && (
        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="ui-subtle-surface rounded-[24px] px-4 py-4 backdrop-blur-sm"
            >
              <p className="ui-text-muted text-[11px] font-semibold uppercase tracking-[0.16em]">
                {stat.label}
              </p>
              <p className="ui-text-strong mt-2 text-2xl font-semibold tracking-[-0.03em]">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
