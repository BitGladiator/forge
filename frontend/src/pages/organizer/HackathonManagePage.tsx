import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Layers,
  Users,
  CheckSquare,
  Sliders,
  Award,
  Settings,
  Clock,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input, Textarea } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/common/Table';
import { StatsCard } from '../../components/organizer/StatsCard';
import { CsvExportButton } from '../../components/organizer/CsvExportButton';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { organizerService } from '../../services/organizerService';
import { projectService } from '../../services/projectService';
import type {
  Hackathon,
  Prize,
  JudgeUser,
  JudgeAssignment,
  RubricCriterion,
  ProjectRankingResult,
  Project,
} from '../../types';

type ManageTab = 'overview' | 'settings' | 'tracks-prizes' | 'judges' | 'assignments' | 'rubric' | 'results';

export const HackathonManagePage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [activeTab, setActiveTab] = useState<ManageTab>('overview');
  const [event, setEvent] = useState<Hackathon | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Settings form state
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [submissionsClose, setSubmissionsClose] = useState('');
  const [judgingDeadline, setJudgingDeadline] = useState('');
  const [submissionsOpen, setSubmissionsOpen] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Tracks & Prizes state
  const [tracks, setTracks] = useState<string[]>([]);
  const [newTrack, setNewTrack] = useState('');
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [isSavingTracksPrizes, setIsSavingTracksPrizes] = useState(false);

  // Judges state
  const [judges, setJudges] = useState<JudgeUser[]>([]);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInvitingJudge, setIsInvitingJudge] = useState(false);

  // Assignments state
  const [assignments, setAssignments] = useState<JudgeAssignment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedJudgeId, setSelectedJudgeId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Rubric state
  const [rubric, setRubric] = useState<RubricCriterion[]>([]);
  const [isSavingRubric, setIsSavingRubric] = useState(false);

  // Results state
  const [results, setResults] = useState<ProjectRankingResult[]>([]);

  const fetchEventData = async () => {
    if (!eventId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await organizerService.getEvent(eventId);
      setEvent(data);
      setName(data.name || '');
      setTagline(data.tagline || '');
      setDescription(data.description || '');
      setStartDate(data.startDate ? data.startDate.slice(0, 16) : '');
      setSubmissionsClose(data.submissionsClose ? data.submissionsClose.slice(0, 16) : '');
      setJudgingDeadline(data.judgingDeadline ? data.judgingDeadline.slice(0, 16) : '');
      setSubmissionsOpen(data.submissionsOpen ?? true);
      setTracks(data.tracks || []);
      setPrizes(data.prizes || []);

      // Fetch related data in parallel
      const [judgeList, asgnList, projList, rubricList, resList] = await Promise.all([
        organizerService.getJudges(eventId).catch(() => []),
        organizerService.getAssignments(eventId).catch(() => []),
        projectService.getProjects().catch(() => []),
        organizerService.getRubric(eventId).catch(() => []),
        organizerService.getResults(eventId).catch(() => []),
      ]);

      setJudges(judgeList);
      setAssignments(asgnList);
      setProjects(projList);
      setRubric(rubricList);
      setResults(resList);

      if (judgeList.length > 0) setSelectedJudgeId(judgeList[0].id);
      if (projList.length > 0) setSelectedProjectId(projList[0].id);
    } catch (err: any) {
      setError(err.message || 'Failed to load hackathon details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 4000);
  };

  // 1. Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;
    setIsSavingSettings(true);
    try {
      await organizerService.updateEvent(eventId, {
        name,
        tagline,
        description,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        submissionsClose: submissionsClose ? new Date(submissionsClose).toISOString() : undefined,
        judgingDeadline: judgingDeadline ? new Date(judgingDeadline).toISOString() : undefined,
        submissionsOpen,
      });
      if (event) {
        setEvent({
          ...event,
          name,
          tagline,
          description,
          submissionsOpen,
          startDate,
          submissionsClose,
          judgingDeadline,
        });
      }
      showNotification('success', 'Event settings updated successfully.');
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // 2. Tracks & Prizes Save
  const handleAddTrack = () => {
    const trimmed = newTrack.trim();
    if (trimmed && !tracks.includes(trimmed)) {
      setTracks([...tracks, trimmed]);
      setNewTrack('');
    }
  };

  const handleRemoveTrack = (trackToRemove: string) => {
    setTracks(tracks.filter((t) => t !== trackToRemove));
  };

  const handleAddPrize = () => {
    setPrizes([...prizes, { name: '', amount: '', description: '', track: '' }]);
  };

  const handleUpdatePrize = (idx: number, field: keyof Prize, val: string) => {
    const updated = [...prizes];
    updated[idx] = { ...updated[idx], [field]: val };
    setPrizes(updated);
  };

  const handleRemovePrize = (idx: number) => {
    setPrizes(prizes.filter((_, i) => i !== idx));
  };

  const handleSaveTracksPrizes = async () => {
    if (!eventId) return;
    setIsSavingTracksPrizes(true);
    try {
      const cleanPrizes = prizes.filter((p) => p.name.trim().length > 0);
      await organizerService.updateEvent(eventId, {
        tracks,
        prizes: cleanPrizes,
      });
      if (event) {
        setEvent({ ...event, tracks, prizes: cleanPrizes });
      }
      showNotification('success', 'Tracks and prizes updated successfully.');
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to save tracks and prizes.');
    } finally {
      setIsSavingTracksPrizes(false);
    }
  };

  // 3. Invite Judge
  const handleInviteJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    setIsInvitingJudge(true);
    try {
      const newJudge = await organizerService.inviteJudge({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        assignedTracks: tracks.length > 0 ? tracks : ['General Track'],
      });
      setJudges([...judges, newJudge]);
      setInviteName('');
      setInviteEmail('');
      showNotification('success', `Judge ${newJudge.name} added successfully.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to invite judge.');
    } finally {
      setIsInvitingJudge(false);
    }
  };

  // 4. Assignments
  const handleAssignJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJudgeId || !selectedProjectId || !eventId) return;
    setIsAssigning(true);
    try {
      const newAsgn = await organizerService.assignJudge(selectedJudgeId, selectedProjectId, eventId);
      setAssignments([...assignments, newAsgn]);
      showNotification('success', `Assigned judge to ${newAsgn.projectTitle}.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to assign judge.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveAssignment = async (asgnId: string) => {
    try {
      await organizerService.removeAssignment(asgnId);
      setAssignments(assignments.filter((a) => a.id !== asgnId));
      showNotification('success', 'Assignment removed.');
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to remove assignment.');
    }
  };

  // 5. Rubric
  const handleAddCriterion = () => {
    setRubric([
      ...rubric,
      {
        id: `crit_${Date.now()}`,
        name: 'New Criterion',
        description: 'Evaluation guidance for judges',
        weight: 0.2,
        maxScore: 5,
      },
    ]);
  };

  const handleUpdateCriterion = (idx: number, field: keyof RubricCriterion, val: any) => {
    const updated = [...rubric];
    updated[idx] = { ...updated[idx], [field]: val };
    setRubric(updated);
  };

  const handleRemoveCriterion = (idx: number) => {
    setRubric(rubric.filter((_, i) => i !== idx));
  };

  const handleSaveRubric = async () => {
    if (!eventId) return;
    setIsSavingRubric(true);
    try {
      const updated = await organizerService.saveRubric(rubric, eventId);
      setRubric(updated);
      showNotification('success', 'Judging rubric saved successfully.');
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to save rubric.');
    } finally {
      setIsSavingRubric(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading hackathon console..." />;
  }

  if (error || !event) {
    return (
      <ErrorState
        title="Error Loading Hackathon"
        message={error || 'Event was not found.'}
        onRetry={fetchEventData}
      />
    );
  }

  const tabs: { key: ManageTab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <Layers className="w-3.5 h-3.5" /> },
    { key: 'settings', label: 'Settings', icon: <Settings className="w-3.5 h-3.5" /> },
    { key: 'tracks-prizes', label: 'Tracks & Prizes', icon: <Award className="w-3.5 h-3.5" /> },
    { key: 'judges', label: `Judges (${judges.length})`, icon: <Users className="w-3.5 h-3.5" /> },
    { key: 'assignments', label: `Assignments (${assignments.length})`, icon: <CheckSquare className="w-3.5 h-3.5" /> },
    { key: 'rubric', label: `Rubric (${rubric.length})`, icon: <Sliders className="w-3.5 h-3.5" /> },
    { key: 'results', label: 'Results & Export', icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6 text-left pb-16">
      {/* Back link & breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
        <Link to="/organizer" className="hover:text-zinc-200 flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>My Hackathons</span>
        </Link>
        <span>/</span>
        <span className="text-zinc-200">{event.name}</span>
      </div>

      {/* Header */}
      <PageHeader
        title={event.name}
        description={event.tagline || event.description || 'Hackathon management console'}
        actions={
          <div className="flex items-center gap-2">
            <CsvExportButton eventId={eventId} />
          </div>
        }
      />

      {/* Notification Toast Banner */}
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

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-zinc-800 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-zinc-800 text-zinc-100 font-semibold'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              label="Registered Projects"
              value={event.totalProjects ?? projects.length}
              subtext={`${event.submittedProjects ?? projects.filter((p) => p.submissionStatus === 'submitted').length} submitted`}
              icon={<Layers className="w-5 h-5" />}
            />
            <StatsCard
              label="Active Judges"
              value={judges.length}
              subtext="Evaluation committee"
              icon={<Users className="w-5 h-5" />}
            />
            <StatsCard
              label="Judging Progress"
              value={`${(event.judgingProgress ?? 0).toFixed(0)}%`}
              subtext={`${event.assignmentsCompleted ?? assignments.filter((a) => a.status === 'completed').length}/${event.assignmentsTotal ?? assignments.length} reviews`}
              icon={<CheckSquare className="w-5 h-5" />}
            />
            <StatsCard
              label="Submissions Status"
              value={event.submissionsOpen ? 'OPEN' : 'CLOSED'}
              subtext={`Closes: ${event.submissionsClose ? new Date(event.submissionsClose).toLocaleDateString() : 'N/A'}`}
              icon={<Clock className="w-5 h-5" />}
            />
          </div>

          <Card className="border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-300">
                Evaluation Pipeline Progress
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {(event.judgingProgress ?? 0).toFixed(1)}% complete
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, event.judgingProgress ?? 0))}%` }}
              />
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
              <h4 className="text-xs font-mono uppercase text-zinc-400">Tracks Configured</h4>
              <div className="flex flex-wrap gap-2">
                {tracks.length > 0 ? (
                  tracks.map((t) => (
                    <Badge key={t} variant="neutral" size="sm">
                      {t}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500">No tracks configured</span>
                )}
              </div>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
              <h4 className="text-xs font-mono uppercase text-zinc-400">Prize Categories</h4>
              <div className="space-y-1.5 text-xs font-mono">
                {prizes.length > 0 ? (
                  prizes.map((p, idx) => (
                    <div key={idx} className="flex justify-between border-b border-zinc-800/40 py-1">
                      <span className="text-zinc-200">{p.name}</span>
                      <span className="text-emerald-400">{p.amount || 'Award'}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500">No prizes configured</span>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Settings */}
      {activeTab === 'settings' && (
        <Card className="p-6 border-zinc-800 bg-zinc-900/40 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Event Configuration</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Update hackathon metadata, lifecycle dates, and submission controls.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-5">
            <Input
              label="Hackathon Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />

            <Textarea
              label="Description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Start Date"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="Submissions Deadline"
                type="datetime-local"
                value={submissionsClose}
                onChange={(e) => setSubmissionsClose(e.target.value)}
              />
              <Input
                label="Judging Deadline"
                type="datetime-local"
                value={judgingDeadline}
                onChange={(e) => setJudgingDeadline(e.target.value)}
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-zinc-200">
                <input
                  type="checkbox"
                  checked={submissionsOpen}
                  onChange={(e) => setSubmissionsOpen(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-0"
                />
                <span>Allow Submissions (Open for new project submissions)</span>
              </label>
            </div>

            <div className="pt-4 border-t border-zinc-800 flex justify-end">
              <Button type="submit" variant="primary" size="sm" isLoading={isSavingSettings}>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab 3: Tracks & Prizes */}
      {activeTab === 'tracks-prizes' && (
        <div className="space-y-6">
          {/* Tracks */}
          <Card className="p-6 border-zinc-800 bg-zinc-900/40 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-400" />
              <span>Hackathon Tracks</span>
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New track name (e.g. AI / Machine Learning)"
                className="flex-1 rounded-md border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
                value={newTrack}
                onChange={(e) => setNewTrack(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTrack();
                  }
                }}
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddTrack}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Track
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {tracks.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800/80 border border-zinc-700/80 text-xs font-mono text-zinc-200"
                >
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTrack(t)}
                    className="text-zinc-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </Card>

          {/* Prizes */}
          <Card className="p-6 border-zinc-800 bg-zinc-900/40 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <Award className="w-4 h-4 text-zinc-400" />
                  <span>Prize Tiers</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Reward categories and prize allocation for this event.
                </p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={handleAddPrize}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Prize
              </Button>
            </div>

            <div className="space-y-3">
              {prizes.map((prize, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-zinc-800 rounded-md bg-zinc-950/40 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-mono text-zinc-500 uppercase">
                      Prize #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePrize(idx)}
                      className="text-zinc-500 hover:text-rose-400 transition-colors"
                      title="Remove Prize"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Prize Title"
                      className="w-full rounded border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                      value={prize.name}
                      onChange={(e) => handleUpdatePrize(idx, 'name', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Amount / Value"
                      className="w-full rounded border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                      value={prize.amount || ''}
                      onChange={(e) => handleUpdatePrize(idx, 'amount', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Eligible Track (optional)"
                      className="w-full rounded border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                      value={prize.track || ''}
                      onChange={(e) => handleUpdatePrize(idx, 'track', e.target.value)}
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Prize description / criteria"
                    className="w-full rounded border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                    value={prize.description || ''}
                    onChange={(e) => handleUpdatePrize(idx, 'description', e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-zinc-800 flex justify-end">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSaveTracksPrizes}
                isLoading={isSavingTracksPrizes}
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save Tracks & Prizes
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: Judges */}
      {activeTab === 'judges' && (
        <div className="space-y-6">
          <Card className="p-5 border-zinc-800 bg-zinc-900/40 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-zinc-400" />
              <span>Add / Invite Judge</span>
            </h3>
            <form onSubmit={handleInviteJudge} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                placeholder="Judge Full Name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                required
              />
              <Input
                type="email"
                placeholder="judge@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
              <Button type="submit" variant="secondary" size="sm" isLoading={isInvitingJudge}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Judge
              </Button>
            </form>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judge Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Assigned Projects</TableHead>
                  <TableHead>Completed Reviews</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {judges.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell className="font-medium text-zinc-200">{j.name}</TableCell>
                    <TableCell className="font-mono text-zinc-400">{j.email}</TableCell>
                    <TableCell className="font-mono text-zinc-300">{j.assignedProjectsCount}</TableCell>
                    <TableCell className="font-mono text-zinc-300">{j.completedReviewsCount}</TableCell>
                    <TableCell>
                      <Badge variant="success" size="sm">
                        {j.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Tab 5: Assignments */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <Card className="p-5 border-zinc-800 bg-zinc-900/40 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-zinc-400" />
              <span>Assign Project to Judge</span>
            </h3>
            <form onSubmit={handleAssignJudge} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                value={selectedJudgeId}
                onChange={(e) => setSelectedJudgeId(e.target.value)}
                options={judges.map((j) => ({ label: j.name, value: j.id }))}
              />
              <Select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                options={projects.map((p) => ({ label: `${p.title} (${p.track})`, value: p.id }))}
              />
              <Button type="submit" variant="primary" size="sm" isLoading={isAssigning}>
                Assign Project
              </Button>
            </form>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Title</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead>Assigned Judge</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                      No judge assignments created yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((asgn) => (
                    <TableRow key={asgn.id}>
                      <TableCell className="font-medium text-zinc-200">{asgn.projectTitle}</TableCell>
                      <TableCell>
                        <Badge variant="neutral" size="sm">
                          {asgn.track}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-300">{asgn.judgeName}</TableCell>
                      <TableCell>
                        <Badge variant={asgn.status === 'completed' ? 'success' : 'neutral'} size="sm">
                          {asgn.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAssignment(asgn.id)}
                          className="text-zinc-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Tab 6: Rubric */}
      {activeTab === 'rubric' && (
        <Card className="p-6 border-zinc-800 bg-zinc-900/40 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-zinc-400" />
                <span>Evaluation Rubric & Weights</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Define the scoring dimensions, weight distributions, and guidelines used by judges.
              </p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={handleAddCriterion}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Criterion
            </Button>
          </div>

          <div className="space-y-4">
            {rubric.map((crit, idx) => (
              <div
                key={crit.id || idx}
                className="p-4 border border-zinc-800 rounded-md bg-zinc-950/40 space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-mono text-zinc-500 uppercase">
                    Criterion #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCriterion(idx)}
                    className="text-zinc-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      placeholder="Criterion Name"
                      className="w-full rounded border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                      value={crit.name}
                      onChange={(e) => handleUpdateCriterion(idx, 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      placeholder="Weight (0.0 - 1.0)"
                      className="w-full rounded border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                      value={crit.weight}
                      onChange={(e) => handleUpdateCriterion(idx, 'weight', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      placeholder="Max Score"
                      className="w-full rounded border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                      value={crit.maxScore}
                      onChange={(e) => handleUpdateCriterion(idx, 'maxScore', parseInt(e.target.value, 10) || 5)}
                    />
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Evaluation guidelines for judges..."
                  className="w-full rounded border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                  value={crit.description}
                  onChange={(e) => handleUpdateCriterion(idx, 'description', e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-zinc-800 flex justify-end">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSaveRubric}
              isLoading={isSavingRubric}
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Save Rubric
            </Button>
          </div>
        </Card>
      )}

      {/* Tab 7: Results & Export */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Live Hackathon Leaderboard</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Real-time weighted score computations across all evaluated projects.
              </p>
            </div>
            <CsvExportButton eventId={eventId} />
          </div>

          <Card className="border-zinc-800 bg-zinc-900/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Project Title</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Evaluations</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-zinc-500">
                      No results computed yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  results.map((item) => (
                    <TableRow key={item.projectId}>
                      <TableCell className="font-mono font-bold text-zinc-300">
                        #{item.rank}
                      </TableCell>
                      <TableCell className="font-medium text-zinc-100">{item.projectTitle}</TableCell>
                      <TableCell className="text-zinc-400">{item.teamName}</TableCell>
                      <TableCell>
                        <Badge variant="neutral" size="sm">
                          {item.track}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-emerald-400">
                        {item.averageScore.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-zinc-400">
                        {item.totalEvaluations}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.reviewStatus === 'completed' ? 'success' : 'neutral'}
                          size="sm"
                        >
                          {item.reviewStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
};
