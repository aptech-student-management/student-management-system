import { ButtonHTMLAttributes, ReactNode } from 'react';
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
  primary: 'ui-btn-primary-role',
  secondary: 'ui-btn-secondary',
  danger:
    'border-transparent bg-red-600 text-white shadow-[0_18px_40px_-24px_rgba(239,68,68,0.45)] hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-400',
  ghost: 'ui-btn-ghost',
  outline: 'ui-btn-outline'
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'gap-1.5 px-3.5 py-2 text-xs',
  md: 'gap-2 px-4 py-2.5 text-sm',
  lg: 'gap-2 px-5 py-3 text-base'
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
        inline-flex items-center justify-center rounded-2xl border font-medium
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white ui-focus-accent
        disabled:cursor-not-allowed disabled:opacity-50
        dark:focus:ring-offset-[#0b1220]
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...rest}
    >
      {loading ? (
        <LoaderIcon className="h-4 w-4 animate-spin" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
