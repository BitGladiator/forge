import React, { useState, useEffect } from 'react';
import { Trash2, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/common/Table';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { organizerService } from '../../services/organizerService';
import { projectService } from '../../services/projectService';
import type { JudgeAssignment, JudgeUser, Project } from '../../types';

export const AssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<JudgeAssignment[]>([]);
  const [judges, setJudges] = useState<JudgeUser[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedJudgeId, setSelectedJudgeId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [asgns, judgeList, projList] = await Promise.all([
        organizerService.getAssignments(),
        organizerService.getJudges(),
        projectService.getProjects(),
      ]);
      setAssignments(asgns);
      setJudges(judgeList);
      setProjects(projList);

      if (judgeList.length > 0 && !selectedJudgeId) {
        setSelectedJudgeId(judgeList[0].id);
      }
      if (projList.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projList[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load assignment data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJudgeId || !selectedProjectId) return;

    setIsAssigning(true);
    setNotice(null);
    try {
      const created = await organizerService.assignJudge(selectedJudgeId, selectedProjectId);
      setAssignments([...assignments, created]);
      setNotice({ type: 'success', message: 'Judge assigned to project successfully.' });
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to assign judge.' });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemove = async (assignmentId: string) => {
    try {
      await organizerService.removeAssignment(assignmentId);
      setAssignments(assignments.filter((a) => a.id !== assignmentId));
    } catch (err: any) {
      alert(`Could not remove assignment: ${err.message}`);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading assignment matrices..." />;
  }

  if (error) {
    return <ErrorState title="Error Loading Assignments" message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Judge Assignment Console"
        description="Allocate projects to judges to ensure review quotas and balance track distributions."
      />

      {notice && (
        <div
          className={`flex items-center gap-2 rounded-md p-3 text-xs font-mono border ${
            notice.type === 'success'
              ? 'border-emerald-900/60 bg-emerald-950/30 text-emerald-300'
              : 'border-rose-900/60 bg-rose-950/30 text-rose-300'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Assignment Creator Form */}
      <Card className="border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200">Create New Assignment</h3>

        <form onSubmit={handleAssign} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <Select
            label="Select Judge"
            value={selectedJudgeId}
            onChange={(e) => setSelectedJudgeId(e.target.value)}
            options={judges.map((j) => ({
              value: j.id,
              label: `${j.name} (${j.assignedProjectsCount} assigned)`,
            }))}
          />

          <Select
            label="Select Project"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            options={projects.map((p) => ({
              value: p.id,
              label: `${p.title.slice(0, 40)}... (${p.track})`,
            }))}
          />

          <div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={isAssigning}
            >
              <Plus className="w-4 h-4 mr-1" />
              <span>Assign Project</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* Active Assignments List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-200">
            Active Assignments ({assignments.length})
          </h3>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Judge</TableHead>
              <TableHead>Assigned Project</TableHead>
              <TableHead>Track</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-zinc-200">{item.judgeName}</TableCell>
                <TableCell className="text-zinc-300 max-w-xs truncate">
                  {item.projectTitle}
                </TableCell>
                <TableCell>
                  <Badge variant="neutral" size="sm">
                    {item.track}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={item.status === 'completed' ? 'success' : 'warning'} size="sm">
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-zinc-800 transition-colors"
                    title="Remove assignment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
