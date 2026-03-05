import React from 'react';
type BadgeVariant =
'success' |
'error' |
'warning' |
'info' |
'neutral' |
'purple';
interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}
const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200'
};
const dotClasses: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
  neutral: 'bg-slate-400',
  purple: 'bg-purple-500'
};
export function Badge({
  variant = 'neutral',
  children,
  dot = false,
  className = ''
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantClasses[variant]} ${className}`}>

      {dot &&
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClasses[variant]}`} />

      }
      {children}
    </span>);

}