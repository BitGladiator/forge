import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  statusCode?: number;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'An error occurred',
  message = 'Failed to load content from the server. Please check connection and try again.',
  onRetry,
  statusCode,
}) => {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-red-950/60 bg-red-950/10 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-950/40 border border-red-900/60 text-red-400 mb-3">
        <AlertTriangle className="h-6 w-6 stroke-[1.5]" />
      </div>
      {statusCode && (
        <span className="font-mono text-xs font-semibold text-red-400 mb-1">
          HTTP {statusCode}
        </span>
      )}
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      <p className="mt-1.5 max-w-md text-xs text-zinc-400 leading-relaxed">{message}</p>
      {onRetry && (
        <div className="mt-5">
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry Request
          </Button>
        </div>
      )}
    </div>
  );
};
