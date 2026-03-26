import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
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
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="ui-form-label text-sm font-medium">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="ui-text-muted absolute left-4 top-1/2 -translate-y-1/2">
            {icon}
          </div>
        )}

        <input
          className={`
            ui-form-field w-full rounded-2xl px-4 py-3 text-sm
            transition-all duration-200
            focus:border-transparent focus:outline-none focus:ring-2 ui-focus-accent
            disabled:cursor-not-allowed
            ${error ? 'ui-form-field-error dark:focus:ring-red-500/70' : ''}
            ${icon ? 'pl-11' : ''}
            ${className}
          `}
          {...rest}
        />
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {hint && !error && <p className="ui-text-muted text-xs">{hint}</p>}
    </div>
  );
}
