import React, { useState, useEffect } from 'react';
import { UserPlus, CheckCircle } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/common/Table';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { organizerService } from '../../services/organizerService';
import type { JudgeUser } from '../../types';

export const JudgeManagementPage: React.FC = () => {
  const [judges, setJudges] = useState<JudgeUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedTracks, setSelectedTracks] = useState<string[]>(['Infrastructure']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchJudges = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await organizerService.getJudges();
      setJudges(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load judges.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJudges();
  }, []);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    setIsSubmitting(true);
    try {
      const newJudge = await organizerService.inviteJudge({
        name: inviteName,
        email: inviteEmail,
        assignedTracks: selectedTracks,
      });
      setJudges([...judges, newJudge]);
      setIsInviteModalOpen(false);
      setInviteName('');
      setInviteEmail('');
      setActionNotice(`Judge invitation issued to ${inviteEmail}`);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      alert(`Failed to invite judge: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTrack = (track: string) => {
    if (selectedTracks.includes(track)) {
      setSelectedTracks(selectedTracks.filter((t) => t !== track));
    } else {
      setSelectedTracks([...selectedTracks, track]);
    }
  };

  const tracks = ['Infrastructure', 'Developer Tools', 'Security', 'AI & Data'];

  if (isLoading) {
    return <LoadingState message="Loading judge roster..." />;
  }

  if (error) {
    return <ErrorState title="Error Loading Judges" message={error} onRetry={fetchJudges} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Judge Roster Management"
        description="Monitor active judges, view allocated tracks, and provision new evaluation credentials."
        actions={
          <Button variant="primary" size="sm" onClick={() => setIsInviteModalOpen(true)}>
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            <span>Invite New Judge</span>
          </Button>
        }
      />

      {actionNotice && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-900/60 bg-emerald-950/30 p-2.5 text-xs text-emerald-300 font-mono">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Judges Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Judge Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Assigned Tracks</TableHead>
            <TableHead>Reviews Status</TableHead>
            <TableHead>Account Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {judges.map((judge) => (
            <TableRow key={judge.id}>
              <TableCell className="font-semibold text-zinc-100">{judge.name}</TableCell>
              <TableCell className="font-mono text-xs text-zinc-400">{judge.email}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {judge.assignedTracks?.map((t) => (
                    <Badge key={t} variant="neutral" size="sm">
                      {t}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono text-xs text-zinc-300">
                  {judge.completedReviewsCount} / {judge.assignedProjectsCount} done
                </span>
              </TableCell>
              <TableCell>
                <Badge variant={judge.status === 'active' ? 'success' : 'neutral'} size="sm">
                  {judge.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Invite Judge Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Official Judge"
        description="The judge will receive an activation email with credentials and review dashboard access."
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleInviteSubmit}
              isLoading={isSubmitting}
            >
              Send Invitation
            </Button>
          </div>
        }
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <Input
            label="Full Name"
            required
            placeholder="Dr. Jordan Hayes"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
          />

          <Input
            label="Email Address"
            required
            type="email"
            placeholder="jordan.hayes@example.org"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-300">
              Assigned Tracks
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {tracks.map((track) => {
                const isSelected = selectedTracks.includes(track);
                return (
                  <button
                    key={track}
                    type="button"
                    onClick={() => toggleTrack(track)}
                    className={`rounded px-2.5 py-1 text-xs font-mono transition-colors border ${
                      isSelected
                        ? 'border-blue-500 bg-blue-950/50 text-blue-200'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {track}
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
