import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
  variant?: 'spinner' | 'skeleton';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  variant = 'spinner',
}) => {
  if (variant === 'skeleton') {
    return (
      <div className="space-y-3 w-full animate-pulse p-4">
        <div className="h-6 bg-zinc-800/60 rounded w-1/3" />
        <div className="h-20 bg-zinc-800/40 rounded w-full" />
        <div className="h-20 bg-zinc-800/40 rounded w-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center p-8 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-zinc-400 mb-3" />
      <p className="text-xs text-zinc-400 font-mono">{message}</p>
    </div>
  );
};
