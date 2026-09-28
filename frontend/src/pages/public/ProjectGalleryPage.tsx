import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ProjectCard } from '../../components/projects/ProjectCard';
import { ProjectFilter } from '../../components/projects/ProjectFilter';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { projectService } from '../../services/projectService';
import type { Project, ProjectFilters } from '../../types';

export const ProjectGalleryPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    track: 'all',
    status: 'all',
  });

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await projectService.getProjects(filters);
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projects.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [filters.track, filters.status]);

  // Client-side search for instantaneous responsive filtering as user types
  const filteredProjects = useMemo(() => {
    if (!filters.search) return projects;
    const query = filters.search.toLowerCase();
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.summary.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.teamName.toLowerCase().includes(query) ||
        p.track.toLowerCase().includes(query)
    );
  }, [projects, filters.search]);

  // Unique list of tracks across projects
  const availableTracks = useMemo(() => {
    const tracksSet = new Set<string>();
    projects.forEach((p) => {
      if (p.track) tracksSet.add(p.track);
    });
    return Array.from(tracksSet);
  }, [projects]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Gallery"
        description="Public showcase of hackathon submissions. Review engineering architectures, repositories, and technical demos."
      />

      {/* Filter and Search Bar */}
      <ProjectFilter
        filters={filters}
        onChange={setFilters}
        tracks={availableTracks.length > 0 ? availableTracks : ['Infrastructure', 'Developer Tools', 'Security', 'AI & Data']}
      />

      {/* Content Rendering */}
      {isLoading ? (
        <LoadingState message="Loading projects catalog..." />
      ) : error ? (
        <ErrorState
          title="Could not load project gallery"
          message={error}
          onRetry={fetchProjects}
        />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description={
            filters.search || filters.track !== 'all'
              ? 'No projects match your current search or filter criteria. Try adjusting filters.'
              : 'No projects have been registered for this event yet.'
          }
          actionLabel={filters.search ? 'Clear Search' : undefined}
          onAction={() => setFilters({ search: '', track: 'all', status: 'all' })}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};
