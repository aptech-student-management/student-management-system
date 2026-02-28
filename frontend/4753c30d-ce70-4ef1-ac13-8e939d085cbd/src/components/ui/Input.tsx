import React from 'react';
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  required?: boolean;
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
      <label className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      }
      <div className="relative">
        {icon &&
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        }
        <input
          className={`
            w-full px-3 py-2 text-sm rounded-lg border bg-white
            transition-colors duration-150
            placeholder:text-slate-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            ${error ? 'border-red-400 focus:ring-red-400' : 'border-slate-300 hover:border-slate-400'}
            ${icon ? 'pl-10' : ''}
            ${className}
          `}
          {...rest} />

      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>);

}