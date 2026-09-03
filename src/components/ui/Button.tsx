import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={twMerge(
        clsx(
          'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 touch-target',
          'active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/25': variant === 'primary',
            'bg-surface-card text-text border border-border hover:bg-surface-light': variant === 'secondary',
            'text-text-secondary hover:text-text hover:bg-surface-card': variant === 'ghost',
            'bg-danger/10 text-danger hover:bg-danger/20': variant === 'danger',
          },
          {
            'text-sm px-4 py-2.5': size === 'sm',
            'text-base px-6 py-3': size === 'md',
            'text-lg px-8 py-4': size === 'lg',
          },
          fullWidth && 'w-full',
          className
        )
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  );
}
