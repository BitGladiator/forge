import React from 'react';
import { Card } from '../common/Card';

interface StatsCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, subtext, icon }) => {
  return (
    <Card className="flex items-center justify-between p-4 border-zinc-800 bg-zinc-900/50">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-zinc-100 font-mono">{value}</p>
        {subtext && <p className="text-[11px] text-zinc-500">{subtext}</p>}
      </div>
      {icon && <div className="text-zinc-500 p-2.5 rounded-md bg-zinc-900 border border-zinc-800">{icon}</div>}
    </Card>
  );
};
