import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Layers,
  Search,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Server,
  Activity,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Select } from '../../components/common/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/common/Table';
import { StatsCard } from '../../components/organizer/StatsCard';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { adminService } from '../../services/adminService';
import type { AdminPlatformOverview, AdminUser, AdminEventSummary, UserRole } from '../../types';

export const AdminConsolePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'events'>('users');
  const [overview, setOverview] = useState<AdminPlatformOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [events, setEvents] = useState<AdminEventSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // User filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchAdminData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ovData, usersData, eventsData] = await Promise.all([
        adminService.getPlatformOverview(),
        adminService.getUsers(searchQuery, roleFilter),
        adminService.getAllEvents(),
      ]);
      setOverview(ovData);
      setUsers(usersData);
      setEvents(eventsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load platform admin telemetry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [roleFilter]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const usersData = await adminService.getUsers(searchQuery, roleFilter);
      setUsers(usersData);
    } catch (err: any) {
      showNotification('error', err.message || 'Search failed');
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      showNotification('success', `User permissions updated to '${newRole}'.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update user role.');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 4000);
  };

  if (isLoading) {
    return <LoadingState message="Loading Platform Admin Console..." />;
  }

  if (error || !overview) {
    return (
      <ErrorState
        title="Admin Access Error"
        message={error || 'Unable to retrieve administrative data.'}
        onRetry={fetchAdminData}
      />
    );
  }

  const roleOptions = [
    { label: 'All Roles', value: 'all' },
    { label: 'Admin', value: 'admin' },
    { label: 'Organizer', value: 'organizer' },
    { label: 'Judge', value: 'judge' },
    { label: 'Participant', value: 'participant' },
    { label: 'Visitor', value: 'visitor' },
  ];

  return (
    <div className="space-y-8 text-left pb-16">
      <PageHeader
        title="Platform Admin Console"
        description="System-wide administration, global role delegation, telemetry, and platform hackathons."
      />

      {/* Notification Toast */}
      {notice && (
        <div
          className={`flex items-center gap-2 px-3 py-2 text-xs font-mono rounded border ${
            notice.type === 'success'
              ? 'border-emerald-800/80 bg-emerald-950/40 text-emerald-300'
              : 'border-rose-800/80 bg-rose-950/40 text-rose-300'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Telemetry Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Registered Users"
          value={overview.totalUsers}
          subtext={`across all roles platform-wide`}
          icon={<Users className="w-5 h-5 text-blue-400" />}
        />
        <StatsCard
          label="Hosted Hackathons"
          value={overview.totalEvents}
          subtext="Active & historical events"
          icon={<Server className="w-5 h-5 text-purple-400" />}
        />
        <StatsCard
          label="Platform Projects"
          value={overview.totalProjects}
          subtext="Total code submissions"
          icon={<Layers className="w-5 h-5 text-amber-400" />}
        />
        <StatsCard
          label="Scores Evaluated"
          value={overview.totalScores}
          subtext={`${overview.totalAssignments} judge assignments`}
          icon={<Activity className="w-5 h-5 text-emerald-400" />}
        />
      </div>

      {/* System Status Banner */}
      <Card className="p-4 border-zinc-800 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-3">
          <Badge variant="neutral" size="sm">
            {overview.platformVersion}
          </Badge>
          <span className="text-zinc-500">SQLite {overview.sqliteVersion}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">User Distribution:</span>
          {Object.entries(overview.roleCounts || {}).map(([r, count]) => (
            <Badge key={r} variant="neutral" size="sm" className="uppercase text-[10px]">
              {r}: {count}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'users'
              ? 'bg-zinc-800 text-zinc-100 font-semibold'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Management ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'events'
              ? 'bg-zinc-800 text-zinc-100 font-semibold'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Platform Hackathons ({events.length})</span>
        </button>
      </div>

      {/* Tab Content: Users */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <Card className="p-4 border-zinc-800 bg-zinc-900/40">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search users by name, email, or user ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900/90 pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                />
              </div>
              <div className="w-full sm:w-48">
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  options={roleOptions}
                />
              </div>
              <Button type="submit" variant="secondary" size="sm">
                Filter
              </Button>
            </form>
          </Card>

          {/* Users Table */}
          <Card className="border-zinc-800 bg-zinc-900/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Platform Role</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                      No users match the search query.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-mono text-xs text-zinc-400">{u.id}</TableCell>
                      <TableCell className="font-medium text-zinc-100">{u.name}</TableCell>
                      <TableCell className="font-mono text-zinc-400">{u.email}</TableCell>
                      <TableCell>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
                        >
                          <option value="admin">ADMIN</option>
                          <option value="organizer">ORGANIZER</option>
                          <option value="judge">JUDGE</option>
                          <option value="participant">PARTICIPANT</option>
                          <option value="visitor">VISITOR</option>
                        </select>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Tab Content: All Hackathons */}
      {activeTab === 'events' && (
        <Card className="border-zinc-800 bg-zinc-900/40 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event ID</TableHead>
                <TableHead>Hackathon Name</TableHead>
                <TableHead>Organizer</TableHead>
                <TableHead className="text-right">Projects</TableHead>
                <TableHead className="text-right">Judges</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-zinc-500">
                    No hackathons found on platform.
                  </TableCell>
                </TableRow>
              ) : (
                events.map((ev) => (
                  <TableRow key={ev.id}>
                    <TableCell className="font-mono text-xs text-zinc-400">{ev.id}</TableCell>
                    <TableCell className="font-medium text-zinc-100">
                      <div>{ev.name}</div>
                      <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{ev.tagline}</div>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-300">
                      <div>{ev.organizerName || 'Lead Organizer'}</div>
                      <div className="text-[11px] font-mono text-zinc-500">{ev.organizerEmail}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-300">
                      {ev.projectCount ?? 0}
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-300">
                      {ev.judgeCount ?? 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ev.submissionsOpen ? 'success' : 'neutral'} size="sm">
                        {ev.submissionsOpen ? 'Open' : 'Closed'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/organizer/events/${ev.id}`)}
                      >
                        <span>Manage</span>
                        <ExternalLink className="w-3.5 h-3.5 ml-1.5 text-zinc-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};
