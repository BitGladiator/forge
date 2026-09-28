import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  actions,
}) => {
  return (
    <div className="flex flex-col gap-3 pb-6 border-b border-zinc-800/80 mb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-left space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl m-0">
            {title}
          </h1>
          {badge}
        </div>
        {description && <p className="text-xs text-zinc-400 sm:text-sm">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5 self-start sm:self-auto">{actions}</div>}
    </div>
  );
};
