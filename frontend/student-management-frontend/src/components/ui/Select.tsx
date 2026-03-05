import React from 'react';
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
    <div className="flex flex-col gap-1">
      {label &&
      <label className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      }
      <div className="relative">
        <select
          className={`
            w-full px-3 py-2 text-sm rounded-lg border bg-white appearance-none pr-9
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            ${error ? 'border-red-400' : 'border-slate-300 hover:border-slate-400'}
            ${className}
          `}
          {...rest}>

          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) =>
          <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          )}
        </select>
        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>);

}