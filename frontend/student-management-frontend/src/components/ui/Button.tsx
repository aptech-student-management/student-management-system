import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { LoaderIcon } from 'lucide-react';
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  children?: ReactNode;
}
const variantClasses: Record<ButtonVariant, string> = {
  primary:
  'bg-blue-700 hover:bg-blue-800 text-white border-transparent shadow-sm dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white dark:shadow-[0_12px_30px_-14px_rgba(255,255,255,0.35)]',
  secondary:
  'bg-slate-100 hover:bg-slate-200 text-slate-700 border-transparent dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 dark:hover:bg-slate-800',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent shadow-sm dark:bg-red-500 dark:hover:bg-red-400 dark:text-white',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 border-transparent dark:text-slate-300 dark:hover:bg-slate-900',
  outline: 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 dark:bg-[#0b0f14]/90 dark:hover:bg-slate-900 dark:text-slate-100 dark:border-slate-800'
};
const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2'
};
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg border
        transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-950
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...rest}>

      {loading ?
      <LoaderIcon className="w-4 h-4 animate-spin" /> :
      icon ?
      <span className="flex-shrink-0">{icon}</span> :
      null}
      {children}
    </button>);

}
