import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, Clock, ArrowRight, Edit3, Send } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/projects/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { projectService } from '../../services/projectService';
import { teamService } from '../../services/teamService';
import type { Project, Team } from '../../types';

interface ParticipantEventInfo {
  id?: string;
  eventName: string;
  tagline: string;
  submissionDeadline: string;
  submissionOpen?: boolean;
}

export const ParticipantDashboardPage: React.FC = () => {
  const [project, setProject] = useState<Project | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [eventInfo, setEventInfo] = useState<ParticipantEventInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [projData, teamData, evtData] = await Promise.all([
        projectService.getUserProject().catch(() => null),
        teamService.getTeam().catch(() => null),
        projectService.getActiveEvent().catch(() => null),
      ]);
      setProject(projData);
      setTeam(teamData);
      setEventInfo(evtData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSubmitProject = async () => {
    if (!project) return;
    setIsSubmitting(true);
    try {
      const updated = await projectService.submitProject(project.id);
      setProject(updated);
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading participant workspace..." />;
  }

  if (error) {
    return <ErrorState title="Dashboard Error" message={error} onRetry={loadDashboardData} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Participant Dashboard"
        description="Track your team membership, hackathon status, and project submission readiness."
        actions={
          <div className="flex items-center gap-2">
            <Link to="/submission">
              <Button variant={project ? 'secondary' : 'primary'} size="sm">
                <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                <span>{project ? 'Edit Project' : 'Create Project'}</span>
              </Button>
            </Link>
            {project && project.submissionStatus === 'draft' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitProject}
                isLoading={isSubmitting}
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                <span>Submit to Hackathon</span>
              </Button>
            )}
          </div>
        }
      />

      {/* Event Overview & Deadline Alert */}
      {eventInfo && (
        <Card className="border-zinc-800 bg-zinc-900/40 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-blue-400 font-semibold uppercase tracking-wider">
                  Current Event
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-xs text-zinc-400">{eventInfo.eventName}</span>
              </div>
              <h2 className="text-base font-semibold text-zinc-100">{eventInfo.tagline}</h2>
            </div>

            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-md">
              <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
              <div>
                <p className="text-[10px] font-mono uppercase text-zinc-500">Submission Deadline</p>
                <p className="text-xs font-semibold text-zinc-200">
                  {new Date(eventInfo.submissionDeadline).toUTCString()}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Grid: Project Status + Team Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Card */}
        <Card className="border-zinc-800 bg-zinc-900/50 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-400" />
                <h3 className="text-sm font-semibold text-zinc-200">Registered Project</h3>
              </div>
              {project && <StatusBadge status={project.submissionStatus} />}
            </div>

            {project ? (
              <div className="space-y-3">
                <Link to={`/projects/${project.id}`} className="hover:underline">
                  <h4 className="text-base font-semibold text-zinc-100">{project.title}</h4>
                </Link>
                <p className="text-xs font-mono text-zinc-400">
                  Track: <strong className="text-zinc-200">{project.track}</strong>
                </p>
                <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                  {project.summary || project.description}
                </p>

                <div className="pt-2 text-xs font-mono text-zinc-500">
                  {project.submittedAt ? (
                    <span className="text-emerald-400">
                      Submitted on {new Date(project.submittedAt).toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-amber-400">Currently in Draft status</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-zinc-400">You haven't initiated a project submission yet.</p>
                <Link to="/submission" className="inline-block mt-2">
                  <Button variant="outline" size="sm">
                    Start Submission
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {project && (
            <div className="pt-4 mt-6 border-t border-zinc-800/80 flex items-center justify-between">
              <Link
                to="/submission"
                className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1"
              >
                <span>Edit Project Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to={`/projects/${project.id}`}
                className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
              >
                <span>View Public Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </Card>

        {/* Team Card */}
        <Card className="border-zinc-800 bg-zinc-900/50 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-zinc-400" />
                <h3 className="text-sm font-semibold text-zinc-200">Team Membership</h3>
              </div>
              {team && (
                <span className="text-xs font-mono text-zinc-400">
                  Code: <strong className="text-zinc-200">{team.inviteCode}</strong>
                </span>
              )}
            </div>

            {team ? (
              <div className="space-y-3">
                <div>
                  <h4 className="text-base font-semibold text-zinc-100">{team.name}</h4>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">
                    {team.members.length} {team.members.length === 1 ? 'member' : 'members'} enrolled
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  {team.members.slice(0, 3).map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded bg-zinc-900/80 px-2.5 py-1.5 text-xs border border-zinc-800/60"
                    >
                      <span className="text-zinc-300 font-medium">{member.name}</span>
                      <span className="font-mono text-[10px] uppercase text-zinc-500">
                        {member.role}
                      </span>
                    </div>
                  ))}
                  {team.members.length > 3 && (
                    <p className="text-[11px] text-zinc-500 italic">
                      + {team.members.length - 3} more members
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-zinc-400">You are not currently part of a team.</p>
                <Link to="/team" className="inline-block mt-2">
                  <Button variant="outline" size="sm">
                    Form or Join Team
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="pt-4 mt-6 border-t border-zinc-800/80">
            <Link
              to="/team"
              className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1"
            >
              <span>Manage Team & Invites</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
