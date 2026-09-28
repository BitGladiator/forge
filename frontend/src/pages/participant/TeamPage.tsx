import React, { useState, useEffect } from 'react';
import { UserPlus, Copy, Check } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/common/Table';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { teamService } from '../../services/teamService';
import type { Team } from '../../types';

export const TeamPage: React.FC = () => {
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchTeam = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await teamService.getTeam();
      setTeam(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load team data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleCopyCode = () => {
    if (!team) return;
    navigator.clipboard.writeText(team.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !team) return;
    try {
      await teamService.inviteMember(team.id, inviteEmail);
      setInviteSuccess(true);
      setInviteEmail('');
      setTimeout(() => setInviteSuccess(false), 3000);
    } catch (err: any) {
      alert(`Invitation failed: ${err.message}`);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode) return;
    setIsJoining(true);
    setJoinError(null);
    try {
      const joinedTeam = await teamService.joinTeam(joinCode);
      setTeam(joinedTeam);
      setJoinCode('');
    } catch (err: any) {
      setJoinError(err.message || 'Could not join team.');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading team roster..." />;
  }

  if (error) {
    return <ErrorState title="Error Loading Team" message={error} onRetry={fetchTeam} />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Team Workspace"
        description="Collaborate with teammates, distribute invite codes, and review roster assignments."
      />

      {team ? (
        <div className="space-y-6">
          {/* Team Header Card */}
          <Card className="border-zinc-800 bg-zinc-900/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase text-zinc-500">Team Status:</span>
                <Badge variant="success" size="sm">
                  {team.status}
                </Badge>
              </div>
              <h2 className="text-xl font-bold text-zinc-100">{team.name}</h2>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded font-mono text-xs text-zinc-300">
                Code: <span className="text-white font-bold">{team.inviteCode}</span>
              </div>
              <Button variant="secondary" size="sm" onClick={handleCopyCode} title="Copy invite code">
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </Card>

          {/* Members Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-200">Enrolled Members ({team.members.length})</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium text-zinc-200">{member.name}</TableCell>
                    <TableCell className="font-mono text-xs text-zinc-400">{member.email}</TableCell>
                    <TableCell>
                      <Badge variant={member.role === 'leader' ? 'info' : 'neutral'} size="sm">
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-zinc-500">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Invite Member Section */}
          <Card className="border-zinc-800 bg-zinc-900/30 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-zinc-200">Invite Teammate</h3>
            <p className="text-xs text-zinc-400">
              Send an email invitation or share your unique team invite code ({team.inviteCode}) directly with teammates.
            </p>

            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="collaborator@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" variant="secondary" size="md">
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                <span>Send Invitation</span>
              </Button>
            </form>

            {inviteSuccess && (
              <p className="text-xs font-mono text-emerald-400">Invitation sent successfully.</p>
            )}
          </Card>
        </div>
      ) : (
        /* Team Join/Create Options if user is not in a team */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
            <h3 className="text-base font-semibold text-zinc-100">Join an Existing Team</h3>
            <p className="text-xs text-zinc-400">
              If your teammates already established a team, enter their team invite code below.
            </p>

            <form onSubmit={handleJoinTeam} className="space-y-3">
              <Input
                label="Team Invite Code"
                placeholder="e.g. AURORA-2026"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                error={joinError || undefined}
                required
              />
              <Button type="submit" variant="primary" size="md" className="w-full" isLoading={isJoining}>
                Join Team
              </Button>
            </form>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
            <h3 className="text-base font-semibold text-zinc-100">Create a New Team</h3>
            <p className="text-xs text-zinc-400">
              Register a team name. You will be designated as the team leader and can invite others.
            </p>
            <Button
              variant="secondary"
              size="md"
              className="w-full"
              onClick={async () => {
                const name = prompt('Enter your team name:');
                if (name) {
                  const created = await teamService.createTeam(name);
                  setTeam(created);
                }
              }}
            >
              Create New Team
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};
