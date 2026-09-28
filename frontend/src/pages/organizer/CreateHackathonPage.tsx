import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Calendar, Award, Layers } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input, Textarea } from '../../components/common/Input';
import { organizerService } from '../../services/organizerService';
import type { HackathonFormData, Prize } from '../../types';

export const CreateHackathonPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [submissionsClose, setSubmissionsClose] = useState('');
  const [judgingDeadline, setJudgingDeadline] = useState('');

  // Tracks state
  const [tracks, setTracks] = useState<string[]>([
    'Infrastructure',
    'Developer Tools',
    'AI & Machine Learning',
  ]);
  const [newTrackInput, setNewTrackInput] = useState('');

  // Prizes state
  const [prizes, setPrizes] = useState<Prize[]>([
    { name: 'First Place - Grand Champion', amount: '$5,000', description: 'Best overall technical execution and impact' },
    { name: 'Best Developer Tool', amount: '$2,500', description: 'Most innovative tool improving developer productivity' },
  ]);

  const handleAddTrack = () => {
    const trimmed = newTrackInput.trim();
    if (trimmed && !tracks.includes(trimmed)) {
      setTracks([...tracks, trimmed]);
      setNewTrackInput('');
    }
  };

  const handleRemoveTrack = (trackToRemove: string) => {
    setTracks(tracks.filter((t) => t !== trackToRemove));
  };

  const handleAddPrize = () => {
    setPrizes([...prizes, { name: '', amount: '', description: '', track: '' }]);
  };

  const handleUpdatePrize = (index: number, field: keyof Prize, value: string) => {
    const updated = [...prizes];
    updated[index] = { ...updated[index], [field]: value };
    setPrizes(updated);
  };

  const handleRemovePrize = (index: number) => {
    setPrizes(prizes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Hackathon name is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData: HackathonFormData = {
      name: name.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      submissionsClose: submissionsClose
        ? new Date(submissionsClose).toISOString()
        : new Date(Date.now() + 14 * 86400000).toISOString(),
      judgingDeadline: judgingDeadline
        ? new Date(judgingDeadline).toISOString()
        : new Date(Date.now() + 21 * 86400000).toISOString(),
      tracks: tracks.length > 0 ? tracks : ['General Track'],
      prizes: prizes.filter((p) => p.name.trim().length > 0),
    };

    try {
      const created = await organizerService.createEvent(formData);
      navigate(`/organizer/events/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create hackathon.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-left pb-16">
      <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
        <Link to="/organizer" className="hover:text-zinc-200 flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Hackathons</span>
        </Link>
      </div>

      <PageHeader
        title="Create New Hackathon"
        description="Configure event identity, timeline deadlines, tracks, and prize tiers."
      />

      {error && (
        <div className="p-3 text-xs font-mono text-rose-300 border border-rose-900/60 bg-rose-950/30 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Information */}
        <Card className="p-6 border-zinc-800 bg-zinc-900/40 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <span>Event Overview</span>
          </h3>

          <div className="space-y-4">
            <Input
              label="Hackathon Name"
              placeholder="e.g. DOGFOOD 2026, Summer Code Sprint"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Tagline / Short Summary"
              placeholder="e.g. Self-hosted internal evaluation summit"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />

            <Textarea
              label="Detailed Description"
              placeholder="Provide context, mission, evaluation objectives, or submission rules..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </Card>

        {/* Section 2: Timeline & Deadlines */}
        <Card className="p-6 border-zinc-800 bg-zinc-900/40 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <span>Event Timeline</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Event Start Date"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <Input
              label="Submission Deadline"
              type="datetime-local"
              value={submissionsClose}
              onChange={(e) => setSubmissionsClose(e.target.value)}
              helperText="Projects can no longer edit after this."
            />

            <Input
              label="Judging Deadline"
              type="datetime-local"
              value={judgingDeadline}
              onChange={(e) => setJudgingDeadline(e.target.value)}
              helperText="Final scores must be locked by this date."
            />
          </div>
        </Card>

        {/* Section 3: Evaluation Tracks */}
        <Card className="p-6 border-zinc-800 bg-zinc-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-zinc-400" />
                <span>Evaluation Tracks</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Categories under which submissions will be registered and evaluated.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New track name (e.g. Open Source, Security, Fintech)"
              className="flex-1 rounded-md border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
              value={newTrackInput}
              onChange={(e) => setNewTrackInput(e.target.value)}
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
            {tracks.map((track) => (
              <span
                key={track}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800/80 border border-zinc-700/80 text-xs font-mono text-zinc-200"
              >
                <span>{track}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTrack(track)}
                  className="text-zinc-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </Card>

        {/* Section 4: Prizes */}
        <Card className="p-6 border-zinc-800 bg-zinc-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-zinc-400" />
                <span>Prizes & Awards</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                List the reward categories and prizes for winners.
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
                    placeholder="Prize Title (e.g. Grand Champion)"
                    className="w-full rounded border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                    value={prize.name}
                    onChange={(e) => handleUpdatePrize(idx, 'name', e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Amount / Reward (e.g. $5,000)"
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
                  placeholder="Short description or criteria for this prize..."
                  className="w-full rounded border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                  value={prize.description || ''}
                  onChange={(e) => handleUpdatePrize(idx, 'description', e.target.value)}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/organizer')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
          >
            Create Hackathon
          </Button>
        </div>
      </form>
    </div>
  );
};
