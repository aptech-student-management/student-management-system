import React from 'react';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';
interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon: ReactNode;
  color: 'blue' | 'teal' | 'sky' | 'emerald' | 'amber' | 'purple' | 'rose';
  subtitle?: string;
}
const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    border: 'border-blue-100'
  },
  teal: {
    bg: 'bg-teal-50',
    icon: 'text-teal-600',
    border: 'border-teal-100'
  },
  sky: {
    bg: 'bg-sky-50',
    icon: 'text-sky-600',
    border: 'border-sky-100'
  },
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
    border: 'border-emerald-100'
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    border: 'border-amber-100'
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    border: 'border-purple-100'
  },
  rose: {
    bg: 'bg-rose-50',
    icon: 'text-rose-600',
    border: 'border-rose-100'
  }
};
export function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  color,
  subtitle
}: StatCardProps) {
  const colors = colorClasses[color];
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle &&
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          }
          {change &&
          <div
            className={`flex items-center gap-1 mt-2 text-xs font-medium ${changeType === 'up' ? 'text-emerald-600' : changeType === 'down' ? 'text-red-500' : 'text-slate-500'}`}>

              {changeType === 'up' && <TrendingUpIcon className="w-3 h-3" />}
              {changeType === 'down' &&
            <TrendingDownIcon className="w-3 h-3" />
            }
              {change}
            </div>
          }
        </div>
        <div className={`p-3 rounded-xl ${colors.bg} ${colors.border} border`}>
          <div className={colors.icon}>{icon}</div>
        </div>
      </div>
    </div>);

}