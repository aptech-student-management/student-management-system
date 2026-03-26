import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padding?: boolean;
  variant?: 'default' | 'dashboard';
}

const variantClasses = {
  default: 'ui-panel-surface ui-panel-surface-strong relative overflow-hidden rounded-[28px]',
  dashboard: 'ui-panel-surface ui-panel-surface-strong relative overflow-hidden rounded-[30px]'
};

export function Card({
  title,
  subtitle,
  icon,
  action,
  children,
  className = '',
  padding = true,
  variant = 'default'
}: CardProps) {
  const cardClass = variantClasses[variant];

  return (
    <section className={`${cardClass} ${className}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/90 to-transparent dark:via-white/[0.1]" />
      <div className="pointer-events-none absolute inset-0 ui-hero-accent-glow opacity-60" />

      {(title || action) && (
        <div className="relative flex items-start justify-between gap-3 border-b ui-divider px-6 py-5">
          <div className="flex min-w-0 items-start gap-3">
            {icon && (
              <div className="ui-icon-surface flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl">
                {icon}
              </div>
            )}

            <div className="min-w-0">
              {title && (
                <h3 className="ui-text-strong text-sm font-semibold tracking-[-0.02em]">
                  {title}
                </h3>
              )}

              {subtitle && (
                <p className="ui-text-muted mt-1 text-xs leading-6">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {action && <div className="relative flex-shrink-0">{action}</div>}
        </div>
      )}

      <div className={padding ? 'relative p-6' : 'relative'}>{children}</div>
    </section>
  );
}
