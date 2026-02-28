import React from 'react';
interface CardProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padding?: boolean;
}
export function Card({
  title,
  subtitle,
  icon,
  action,
  children,
  className = '',
  padding = true
}: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-card ${className}`}>

      {(title || action) &&
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {icon && <div className="text-slate-500">{icon}</div>}
            <div>
              {title &&
            <h3 className="text-sm font-semibold text-slate-900">
                  {title}
                </h3>
            }
              {subtitle &&
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            }
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      }
      <div className={padding ? 'p-6' : ''}>{children}</div>
    </div>);

}