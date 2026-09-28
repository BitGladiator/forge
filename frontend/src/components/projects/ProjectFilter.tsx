import React from 'react';
import { Search } from 'lucide-react';
import type { ProjectFilters } from '../../types';

interface ProjectFilterProps {
  filters: ProjectFilters;
  onChange: (filters: ProjectFilters) => void;
  tracks: string[];
}

export const ProjectFilter: React.FC<ProjectFilterProps> = ({ filters, onChange, tracks }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          value={filters.search || ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search by title, team, summary, or keyword..."
          className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-900/80 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
        />
      </div>

      <div className="flex items-center gap-2">
        <select
          value={filters.track || 'all'}
          onChange={(e) => onChange({ ...filters, track: e.target.value })}
          className="h-9 rounded-md border border-zinc-800 bg-zinc-900/80 px-3 text-xs text-zinc-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
        >
          <option value="all">All Tracks</option>
          {tracks.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={filters.status || 'all'}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
          className="h-9 rounded-md border border-zinc-800 bg-zinc-900/80 px-3 text-xs text-zinc-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
        >
          <option value="all">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="draft">Draft</option>
        </select>
      </div>
    </div>
  );
};
