import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Users, Calendar, ShieldCheck } from 'lucide-react';
import { GithubIcon } from '../../components/common/Icons';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/projects/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { projectService } from '../../services/projectService';
import type { Project } from '../../types';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | undefined>(undefined);

  const fetchProject = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await projectService.getProjectById(id);
      setProject(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load project details.');
      setStatusCode(err.status || 500);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  if (isLoading) {
    return <LoadingState message="Fetching project specifications..." />;
  }

  if (error || !project) {
    return (
      <ErrorState
        title={statusCode === 404 ? 'Project Not Found' : 'Error Loading Project'}
        message={error || 'The requested project could not be located.'}
        statusCode={statusCode}
        onRetry={fetchProject}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center text-xs font-mono text-zinc-400 hover:text-zinc-200 mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Back to Projects Gallery</span>
        </Link>

        <PageHeader
          title={project.title}
          badge={<StatusBadge status={project.submissionStatus} />}
          actions={
            <div className="flex items-center gap-2">
              {project.repositoryUrl && (
                <a
                  href={project.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  <Button variant="outline" size="sm">
                    <GithubIcon className="w-4 h-4 mr-1.5" />
                    <span>Repository</span>
                  </Button>
                </a>
              )}
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  <Button variant="primary" size="sm">
                    <ExternalLink className="w-4 h-4 mr-1.5" />
                    <span>Live Demo</span>
                  </Button>
                </a>
              )}
            </div>
          }
        />
      </div>

      {/* Meta Information Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-3.5 border-zinc-800 bg-zinc-900/50 flex items-center gap-3">
          <Users className="w-4 h-4 text-zinc-400" />
          <div>
            <p className="text-[11px] font-mono text-zinc-500 uppercase">Team</p>
            <p className="text-xs font-semibold text-zinc-200">{project.teamName}</p>
          </div>
        </Card>

        <Card className="p-3.5 border-zinc-800 bg-zinc-900/50 flex items-center gap-3">
          <ShieldCheck className="w-4 h-4 text-zinc-400" />
          <div>
            <p className="text-[11px] font-mono text-zinc-500 uppercase">Track</p>
            <p className="text-xs font-semibold text-zinc-200">{project.track}</p>
          </div>
        </Card>

        <Card className="p-3.5 border-zinc-800 bg-zinc-900/50 flex items-center gap-3">
          <Calendar className="w-4 h-4 text-zinc-400" />
          <div>
            <p className="text-[11px] font-mono text-zinc-500 uppercase">Submission</p>
            <p className="text-xs font-semibold text-zinc-200">
              {project.submittedAt ? new Date(project.submittedAt).toLocaleDateString() : 'Draft Mode'}
            </p>
          </div>
        </Card>
      </div>

      {/* Summary */}
      {project.summary && (
        <Card className="border-zinc-800 bg-zinc-900/30 p-5 space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">Executive Summary</h3>
          <p className="text-sm text-zinc-300 leading-relaxed">{project.summary}</p>
        </Card>
      )}

      {/* Full Description & Architecture */}
      <Card className="border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-100 border-b border-zinc-800 pb-2">
          Technical Specifications & Architecture
        </h3>
        <div className="prose prose-invert max-w-none text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line font-sans">
          {project.description}
        </div>
      </Card>
    </div>
  );
};
