import { ReactNode } from 'react';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'purple';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success:
    'border-emerald-500/15 bg-emerald-500/[0.08] text-emerald-700 dark:border-emerald-400/15 dark:bg-emerald-400/[0.08] dark:text-emerald-200',
  error:
    'border-red-500/15 bg-red-500/[0.08] text-red-700 dark:border-red-400/15 dark:bg-red-400/[0.08] dark:text-red-200',
  warning:
    'border-amber-500/15 bg-amber-500/[0.08] text-amber-700 dark:border-amber-400/15 dark:bg-amber-400/[0.08] dark:text-amber-200',
  info:
    'ui-accent-surface',
  neutral:
    'ui-subtle-surface ui-text-base',
  purple:
    'border-violet-500/15 bg-violet-500/[0.08] text-violet-700 dark:border-violet-400/15 dark:bg-violet-400/[0.08] dark:text-violet-200'
};

const dotClasses: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500 dark:bg-emerald-300',
  error: 'bg-red-500 dark:bg-red-300',
  warning: 'bg-amber-500 dark:bg-amber-300',
  info: 'ui-accent-dot',
  neutral: 'bg-slate-400 dark:bg-slate-400',
  purple: 'bg-violet-500 dark:bg-violet-300'
};

export function Badge({
  variant = 'neutral',
  children,
  dot = false,
  className = ''
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.01em] ${variantClasses[variant]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dotClasses[variant]}`} />}
      {children}
    </span>
  );
}
