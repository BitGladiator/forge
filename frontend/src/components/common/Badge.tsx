import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'success' | 'warning' | 'info' | 'danger';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] tracking-wide uppercase font-semibold rounded',
    md: 'px-2 py-0.5 text-xs font-medium rounded-md',
  }[size];

  const variantClasses = {
    neutral: 'bg-zinc-800 text-zinc-300 border border-zinc-700/60',
    success: 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60',
    warning: 'bg-amber-950/60 text-amber-300 border border-amber-800/60',
    info: 'bg-sky-950/60 text-sky-300 border border-sky-800/60',
    danger: 'bg-rose-950/60 text-rose-300 border border-rose-800/60',
  }[variant];

  return (
    <span className={`inline-flex items-center font-mono ${sizeClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </span>
  );
};
