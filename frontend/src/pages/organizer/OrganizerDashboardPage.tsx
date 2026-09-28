import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Users, CheckSquare, Sliders, Award, ArrowRight, Clock } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { StatsCard } from '../../components/organizer/StatsCard';
import { CsvExportButton } from '../../components/organizer/CsvExportButton';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { organizerService } from '../../services/organizerService';
import type { EventOverview } from '../../types';

export const OrganizerDashboardPage: React.FC = () => {
  const [overview, setOverview] = useState<EventOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await organizerService.getEventOverview();
      setOverview(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load event overview data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading organizer metrics..." />;
  }

  if (error || !overview) {
    return (
      <ErrorState
        title="Error Loading Organizer Dashboard"
        message={error || 'Unable to retrieve event metrics.'}
        onRetry={fetchOverview}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Organizer Operations Hub"
        description="Comprehensive telemetry, judging pipelines, and administrative controls for DOGFOOD 2026."
        actions={<CsvExportButton />}
      />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Registered Projects"
          value={overview.totalProjects}
          subtext={`${overview.submittedProjects} submitted & locked`}
          icon={<Layers className="w-5 h-5" />}
        />

        <StatsCard
          label="Active Judges"
          value={overview.activeJudges}
          subtext={`of ${overview.totalJudges} invited judges`}
          icon={<Users className="w-5 h-5" />}
        />

        <StatsCard
          label="Judging Progress"
          value={`${overview.judgingProgress.toFixed(0)}%`}
          subtext={`${overview.assignmentsCompleted}/${overview.assignmentsTotal} reviews done`}
          icon={<CheckSquare className="w-5 h-5" />}
        />

        <StatsCard
          label="Submissions"
          value={overview.submissionOpen ? 'OPEN' : 'CLOSED'}
          subtext={`Deadline: ${new Date(overview.submissionDeadline).toLocaleDateString()}`}
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      {/* Progress Bar */}
      <Card className="border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-300">
            Total Evaluation Progress
          </span>
          <span className="text-xs font-mono text-zinc-400">
            {overview.assignmentsCompleted} of {overview.assignmentsTotal} reviews completed (
            {overview.judgingProgress.toFixed(1)}%)
          </span>
        </div>
        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${overview.judgingProgress}%` }}
          />
        </div>
      </Card>

      {/* Quick Navigation Panels */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider font-mono">
          Operations & Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/organizer/judges" className="block focus:outline-none">
            <Card variant="interactive" className="h-full space-y-2 p-5">
              <div className="flex items-center justify-between">
                <Users className="w-5 h-5 text-blue-400" />
                <ArrowRight className="w-4 h-4 text-zinc-600" />
              </div>
              <h4 className="text-sm font-semibold text-zinc-100">Judge Roster</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Manage invited judges, monitor status, and review track proficiencies.
              </p>
            </Card>
          </Link>

          <Link to="/organizer/assignments" className="block focus:outline-none">
            <Card variant="interactive" className="h-full space-y-2 p-5">
              <div className="flex items-center justify-between">
                <CheckSquare className="w-5 h-5 text-purple-400" />
                <ArrowRight className="w-4 h-4 text-zinc-600" />
              </div>
              <h4 className="text-sm font-semibold text-zinc-100">Assignments</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Assign projects to judges, track coverage, and maintain isolation.
              </p>
            </Card>
          </Link>

          <Link to="/organizer/rubric" className="block focus:outline-none">
            <Card variant="interactive" className="h-full space-y-2 p-5">
              <div className="flex items-center justify-between">
                <Sliders className="w-5 h-5 text-amber-400" />
                <ArrowRight className="w-4 h-4 text-zinc-600" />
              </div>
              <h4 className="text-sm font-semibold text-zinc-100">Rubric Config</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Configure evaluation criteria, weights, and max score boundaries.
              </p>
            </Card>
          </Link>

          <Link to="/organizer/results" className="block focus:outline-none">
            <Card variant="interactive" className="h-full space-y-2 p-5">
              <div className="flex items-center justify-between">
                <Award className="w-5 h-5 text-emerald-400" />
                <ArrowRight className="w-4 h-4 text-zinc-600" />
              </div>
              <h4 className="text-sm font-semibold text-zinc-100">Results & Ranking</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Review aggregated scores, leaderboard status, and download CSV.
              </p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};
