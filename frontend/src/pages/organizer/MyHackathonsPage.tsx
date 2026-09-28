import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, ArrowRight, Award } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { organizerService } from '../../services/organizerService';
import type { Hackathon } from '../../types';

export const MyHackathonsPage: React.FC = () => {
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHackathons = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await organizerService.getEvents();
      setHackathons(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load hackathons.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHackathons();
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading your hackathons..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Error Loading Hackathons"
        message={error}
        onRetry={fetchHackathons}
      />
    );
  }

  return (
    <div className="space-y-8 text-left">
      <PageHeader
        title="My Hackathons"
        description="Manage your hackathons, review progress, configure tracks, and monitor judging."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/organizer/events/new')}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create Hackathon
          </Button>
        }
      />

      {hackathons.length === 0 ? (
        <EmptyState
          title="No Hackathons Found"
          description="You haven't created any hackathons yet. Create your first event to configure tracks, invite judges, and review submissions."
          actionLabel="Create Hackathon"
          onAction={() => navigate('/organizer/events/new')}
          icon={<Calendar className="h-6 w-6 stroke-[1.5]" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {hackathons.map((h) => {
            const progress = h.judgingProgress ?? 0;
            return (
              <Card
                key={h.id}
                className="flex flex-col justify-between border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 transition-colors p-6"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-zinc-100">{h.name}</h3>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{h.tagline || h.description}</p>
                    </div>
                    <Badge variant={h.submissionsOpen ? 'success' : 'neutral'} size="sm">
                      {h.submissionsOpen ? 'Submissions Open' : 'Closed'}
                    </Badge>
                  </div>

                  {/* Dates & Timeline */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono border-y border-zinc-800/80 py-3">
                    <div className="text-zinc-400">
                      <span className="text-zinc-500 block">Submissions Close:</span>
                      <span className="text-zinc-200">
                        {h.submissionsClose ? new Date(h.submissionsClose).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="text-zinc-400">
                      <span className="text-zinc-500 block">Judging Deadline:</span>
                      <span className="text-zinc-200">
                        {h.judgingDeadline ? new Date(h.judgingDeadline).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Evaluation Progress */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-400">Judging Progress</span>
                      <span className="text-zinc-300">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-zinc-500 font-mono pt-1">
                      <span>{h.totalProjects ?? h.projectCount ?? 0} projects registered</span>
                      <span>{h.assignmentsCompleted ?? 0}/{h.assignmentsTotal ?? 0} reviews done</span>
                    </div>
                  </div>

                  {/* Tracks */}
                  {h.tracks && h.tracks.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {h.tracks.map((track) => (
                        <Badge key={track} variant="neutral" size="sm">
                          {track}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-5 mt-4 border-t border-zinc-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
                    <Award className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{h.prizes?.length || 0} prize tiers</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/organizer/events/${h.id}`)}
                  >
                    <span>Manage Hackathon</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
