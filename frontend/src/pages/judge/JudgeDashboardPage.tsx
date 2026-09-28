import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/common/Table';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { judgeService } from '../../services/judgeService';
import type { AssignedProject, JudgeStats } from '../../types';

export const JudgeDashboardPage: React.FC = () => {
  const [assignments, setAssignments] = useState<AssignedProject[]>([]);
  const [stats, setStats] = useState<JudgeStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJudgeData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [assignedList, judgeStats] = await Promise.all([
        judgeService.getAssignedProjects(),
        judgeService.getJudgeStats(),
      ]);
      setAssignments(assignedList);
      setStats(judgeStats);
    } catch (err: any) {
      setError(err.message || 'Failed to load assigned projects for evaluation.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJudgeData();
  }, []);

  const getStatusBadge = (status: AssignedProject['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Reviewed</Badge>;
      case 'in_progress':
        return <Badge variant="info">In Progress</Badge>;
      case 'pending':
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading judge assignment roster..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Could not load assignments"
        message={error}
        onRetry={fetchJudgeData}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Judge Evaluation Console"
        description="Review assigned hackathon projects, inspect architecture, and submit official rubric scores."
      />

      {/* Progress & Metric Summary */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="p-4 border-zinc-800 bg-zinc-900/50">
            <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Assigned</p>
            <p className="text-2xl font-bold font-mono text-zinc-100 mt-1">{stats.assignedCount}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Projects queued</p>
          </Card>

          <Card className="p-4 border-zinc-800 bg-zinc-900/50">
            <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Reviewed</p>
            <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">{stats.reviewedCount}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Scoring submitted</p>
          </Card>

          <Card className="p-4 border-zinc-800 bg-zinc-900/50">
            <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Remaining</p>
            <p className="text-2xl font-bold font-mono text-amber-400 mt-1">{stats.remainingCount}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Pending review</p>
          </Card>

          <Card className="p-4 border-zinc-800 bg-zinc-900/50">
            <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Progress</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-zinc-100">{stats.progressPercentage}%</span>
            </div>
            {/* Minimal Progress bar */}
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${stats.progressPercentage}%` }}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Assignment Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-200">Assigned Queue</h3>

        {assignments.length === 0 ? (
          <EmptyState
            title="No Assigned Projects"
            description="You currently have no hackathon projects assigned for review. Check back once organizer assignments are published."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Track</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map(({ project, status }) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div className="space-y-0.5">
                      <Link
                        to={`/judge/projects/${project.id}`}
                        className="font-medium text-zinc-100 hover:text-blue-400 transition-colors"
                      >
                        {project.title}
                      </Link>
                      <p className="text-xs text-zinc-500 font-mono">Team: {project.teamName}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral" size="sm">
                      {project.track}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(status)}</TableCell>
                  <TableCell className="text-right">
                    <Link to={`/judge/projects/${project.id}`}>
                      <Button
                        variant={status === 'completed' ? 'outline' : 'primary'}
                        size="sm"
                      >
                        <span>{status === 'completed' ? 'Edit Score' : 'Evaluate'}</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};
