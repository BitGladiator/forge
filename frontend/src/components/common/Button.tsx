import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 select-none';

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs rounded',
    md: 'h-9 px-4 text-sm rounded-md',
    lg: 'h-11 px-6 text-sm font-semibold rounded-md',
  }[size];

  const variantClasses = {
    primary: 'bg-zinc-100 text-zinc-950 hover:bg-zinc-200 border border-zinc-200 shadow-sm',
    secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700',
    outline: 'border border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800 hover:text-white',
    danger: 'bg-red-950 text-red-200 border border-red-800 hover:bg-red-900',
    ghost: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin text-current" />}
      {children}
    </button>
  );
};
