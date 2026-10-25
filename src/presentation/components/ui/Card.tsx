import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  variant = 'default',
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={twMerge(
        clsx(
          'rounded-2xl transition-all duration-200',
          {
            'bg-surface-card border border-border-light': variant === 'default',
            'bg-surface-card border border-border-light card-shadow': variant === 'elevated',
            'gradient-card': variant === 'gradient',
          },
          {
            'p-0': padding === 'none',
            'p-3': padding === 'sm',
            'p-4': padding === 'md',
            'p-6': padding === 'lg',
          },
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}
