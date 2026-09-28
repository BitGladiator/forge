import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Input, Textarea } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/projects/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { projectService } from '../../services/projectService';
import type { Project, ProjectFormData } from '../../types';

export const SubmissionPage: React.FC = () => {
  const navigate = useNavigate();
  const [existingProject, setExistingProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    summary: '',
    description: '',
    track: 'Infrastructure',
    repositoryUrl: '',
    demoUrl: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadInitial() {
      try {
        const userProj = await projectService.getUserProject();
        if (userProj) {
          setExistingProject(userProj);
          setFormData({
            title: userProj.title,
            summary: userProj.summary,
            description: userProj.description,
            track: userProj.track,
            repositoryUrl: userProj.repositoryUrl || '',
            demoUrl: userProj.demoUrl || '',
          });
        }
      } catch (err: any) {
        setStatusNotice({ type: 'error', message: err.message || 'Failed to load project draft.' });
      } finally {
        setIsLoading(false);
      }
    }
    loadInitial();
  }, []);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = 'Project title is required.';
    if (!formData.summary.trim()) errors.summary = 'Short executive summary is required.';
    if (!formData.description.trim()) errors.description = 'Technical specifications and description are required.';
    if (!formData.repositoryUrl.trim()) {
      errors.repositoryUrl = 'Repository URL is required for hackathon verification.';
    } else if (!formData.repositoryUrl.startsWith('http')) {
      errors.repositoryUrl = 'Please provide a valid URL starting with http:// or https://';
    }

    if (formData.demoUrl && !formData.demoUrl.startsWith('http')) {
      errors.demoUrl = 'Please provide a valid URL starting with http:// or https://';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setStatusNotice(null);
    try {
      const saved = await projectService.saveProject(
        { ...formData, isDraft: true },
        existingProject?.id
      );
      setExistingProject(saved);
      setStatusNotice({ type: 'success', message: 'Project draft successfully saved.' });
    } catch (err: any) {
      setStatusNotice({ type: 'error', message: err.message || 'Failed to save draft.' });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setStatusNotice({ type: 'error', message: 'Please correct highlighted errors before submitting.' });
      return;
    }

    setIsSubmitting(true);
    setStatusNotice(null);
    try {
      const saved = await projectService.saveProject(
        { ...formData, isDraft: false },
        existingProject?.id
      );
      setExistingProject(saved);
      setStatusNotice({
        type: 'success',
        message: 'Project successfully submitted to the hackathon! Good luck.',
      });
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      // Backend error display
      setStatusNotice({ type: 'error', message: err.message || 'Backend submission error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading submission form..." />;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title={existingProject ? 'Edit Project Submission' : 'Create Hackathon Submission'}
        description="Provide comprehensive details about your project, architecture, code repository, and live demo."
        badge={existingProject && <StatusBadge status={existingProject.submissionStatus} />}
      />

      {statusNotice && (
        <div
          className={`flex items-center gap-2 rounded-md p-3 text-xs font-mono border ${
            statusNotice.type === 'success'
              ? 'border-emerald-900/60 bg-emerald-950/30 text-emerald-300'
              : 'border-rose-900/60 bg-rose-950/30 text-rose-300'
          }`}
        >
          {statusNotice.type === 'success' ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{statusNotice.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
          <Input
            label="Project Title"
            required
            placeholder="e.g. KubePulse: Lightweight Distributed Telemetry"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={validationErrors.title}
            helperText="Clear, descriptive engineering title"
          />

          <Select
            label="Hackathon Track"
            required
            value={formData.track}
            onChange={(e) => setFormData({ ...formData, track: e.target.value })}
            options={[
              { value: 'Infrastructure', label: 'Infrastructure' },
              { value: 'Developer Tools', label: 'Developer Tools' },
              { value: 'Security', label: 'Security' },
              { value: 'AI & Data', label: 'AI & Data' },
            ]}
          />

          <Textarea
            label="Executive Summary"
            required
            placeholder="Brief 1-2 sentence description of what the project accomplishes and key highlights..."
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            error={validationErrors.summary}
            rows={2}
          />

          <Textarea
            label="Technical Specifications & Architecture"
            required
            placeholder="Detailed overview of technical architecture, libraries used, algorithmic approach, and challenges solved..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            error={validationErrors.description}
            rows={6}
          />
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
            Repository & Artifact Links
          </h3>

          <Input
            label="Source Code Repository URL"
            required
            type="url"
            placeholder="https://github.com/your-org/your-repo"
            value={formData.repositoryUrl}
            onChange={(e) => setFormData({ ...formData, repositoryUrl: e.target.value })}
            error={validationErrors.repositoryUrl}
            helperText="Public repository containing the source code developed during the hackathon"
          />

          <Input
            label="Live Demo or Deployment URL (Optional)"
            type="url"
            placeholder="https://demo.your-project.internal"
            value={formData.demoUrl}
            onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
            error={validationErrors.demoUrl}
            helperText="Public endpoint or recording demonstrating the running solution"
          />
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleSaveDraft}
            isLoading={isSavingDraft}
          >
            <Save className="w-4 h-4 mr-1.5" />
            <span>Save Draft</span>
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
          >
            <Send className="w-4 h-4 mr-1.5" />
            <span>Submit Final Project</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
