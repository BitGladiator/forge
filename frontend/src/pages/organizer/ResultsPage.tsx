import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/common/Table';
import { CsvExportButton } from '../../components/organizer/CsvExportButton';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { organizerService } from '../../services/organizerService';
import type { ProjectRankingResult } from '../../types';

export const ResultsPage: React.FC = () => {
  const [results, setResults] = useState<ProjectRankingResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await organizerService.getResults();
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve aggregated scoring results.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge variant="warning" className="font-bold">#1 Gold</Badge>;
      case 2:
        return <Badge variant="neutral" className="font-bold">#2 Silver</Badge>;
      case 3:
        return <Badge variant="neutral" className="font-bold">#3 Bronze</Badge>;
      default:
        return <span className="font-mono text-zinc-400 font-semibold">#{rank}</span>;
    }
  };

  if (isLoading) {
    return <LoadingState message="Calculating official scoring aggregates..." />;
  }

  if (error) {
    return <ErrorState title="Error Loading Results" message={error} onRetry={fetchResults} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Official Results & Leaderboard"
        description="Scoring aggregates computed by authoritative backend judging consensus."
        actions={<CsvExportButton />}
      />

      {results.length === 0 ? (
        <EmptyState
          title="No Published Results"
          description="Judging is still in progress. Final scores and leaderboard rankings will populate once reviews conclude."
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Project Title</TableHead>
                <TableHead>Team Name</TableHead>
                <TableHead>Track</TableHead>
                <TableHead>Reviews</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Average Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((row) => (
                <TableRow key={row.projectId}>
                  <TableCell>{getRankBadge(row.rank)}</TableCell>
                  <TableCell className="font-semibold text-zinc-100 max-w-sm truncate">
                    {row.projectTitle}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-400">{row.teamName}</TableCell>
                  <TableCell>
                    <Badge variant="neutral" size="sm">
                      {row.track}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-400">
                    {row.totalEvaluations} completed
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={row.reviewStatus === 'completed' ? 'success' : 'warning'}
                      size="sm"
                    >
                      {row.reviewStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-bold text-blue-400">
                    {row.averageScore.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
