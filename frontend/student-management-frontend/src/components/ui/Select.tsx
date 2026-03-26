import { SelectHTMLAttributes } from 'react';
import { ChevronDownIcon } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
  required?: boolean;
}

export function Select({
  label,
  options,
  error,
  placeholder,
  required,
  className = '',
  ...rest
}: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="ui-form-label text-sm font-medium">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          className={`
            ui-form-field w-full appearance-none rounded-2xl px-4 py-3 pr-10 text-sm
            transition-all duration-200
            focus:border-transparent focus:outline-none focus:ring-2 ui-focus-accent
            disabled:cursor-not-allowed
            ${error ? 'ui-form-field-error' : ''}
            ${className}
          `}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <ChevronDownIcon className="ui-text-muted pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
