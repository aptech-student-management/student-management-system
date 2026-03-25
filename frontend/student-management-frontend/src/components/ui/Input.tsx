import React from 'react';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
}
export function Input({
  label,
  error,
  hint,
  icon,
  required,
  className = '',
  ...rest
}: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label &&
      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      }
      <div className="relative">
        {icon &&
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            {icon}
          </div>
        }
        <input
          className={`
            w-full px-3 py-2 text-sm rounded-lg border bg-white text-slate-900
            transition-colors duration-150
            placeholder:text-slate-400 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-slate-400
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed dark:disabled:bg-slate-900/60 dark:disabled:text-slate-500
            ${error ? 'border-red-400 focus:ring-red-400 dark:border-red-500/70 dark:focus:ring-red-500' : 'border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600'}
            ${icon ? 'pl-10' : ''}
            ${className}
          `}
          {...rest} />

      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>);

}
