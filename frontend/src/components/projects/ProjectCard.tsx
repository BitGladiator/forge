import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { GithubIcon } from '../common/Icons';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { StatusBadge } from './StatusBadge';
import type { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
  showStatus?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, showStatus = true }) => {
  return (
    <Card variant="interactive" className="flex flex-col justify-between h-full group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <Badge variant="neutral" size="sm" className="font-mono">
            {project.track}
          </Badge>
          {showStatus && <StatusBadge status={project.submissionStatus} />}
        </div>

        <Link to={`/projects/${project.id}`} className="block focus:outline-none">
          <h3 className="text-base font-semibold text-zinc-100 group-hover:text-blue-400 transition-colors line-clamp-1">
            {project.title}
          </h3>
        </Link>

        <p className="text-xs font-mono text-zinc-400 mt-1 mb-3">
          Team: <span className="text-zinc-300 font-medium">{project.teamName}</span>
        </p>

        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-4">
          {project.summary || project.description}
        </p>
      </div>

      <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-3">
          {project.repositoryUrl && (
            <a
              href={project.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>Repo</span>
            </a>
          )}
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Demo</span>
            </a>
          )}
        </div>

        <Link
          to={`/projects/${project.id}`}
          className="inline-flex items-center gap-1 text-zinc-300 hover:text-white font-medium group-hover:translate-x-0.5 transition-transform"
        >
          <span>Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  );
};
