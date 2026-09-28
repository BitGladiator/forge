import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Save, CheckCircle2, AlertCircle, FileCheck } from 'lucide-react';
import { GithubIcon } from '../../components/common/Icons';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Textarea } from '../../components/common/Input';
import { RubricCriterionCard } from '../../components/judge/RubricCriterion';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { projectService } from '../../services/projectService';
import { judgeService } from '../../services/judgeService';
import type { Project, RubricCriterion, RubricScore } from '../../types';

export const JudgeReviewPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriterion[]>([]);
  const [scores, setScores] = useState<RubricScore[]>([]);
  const [generalFeedback, setGeneralFeedback] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const loadData = async () => {
    if (!projectId) return;
    setIsLoading(true);
    setNotice(null);
    try {
      const [proj, rubric, evaluation] = await Promise.all([
        projectService.getProjectById(projectId),
        judgeService.getRubric(),
        judgeService.getProjectEvaluation(projectId),
      ]);

      setProject(proj);
      setRubricCriteria(rubric);

      if (evaluation) {
        setScores(evaluation.scores);
        setGeneralFeedback(evaluation.generalFeedback || '');
        setIsSubmitted(evaluation.submitted);
      } else {
        // Initialize empty score records for each rubric criterion
        setScores(rubric.map((c) => ({ criterionId: c.id, score: 0, comment: '' })));
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to load project review data.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleScoreUpdate = (updatedScore: RubricScore) => {
    setScores((prev) => {
      const index = prev.findIndex((s) => s.criterionId === updatedScore.criterionId);
      if (index !== -1) {
        const next = [...prev];
        next[index] = updatedScore;
        return next;
      }
      return [...prev, updatedScore];
    });
  };

  const handleSaveDraft = async () => {
    if (!projectId) return;
    setIsSaving(true);
    setNotice(null);
    setValidationError(null);
    try {
      await judgeService.saveEvaluation({
        projectId,
        scores,
        generalFeedback,
      });
      setNotice({ type: 'success', message: 'Evaluation draft saved successfully.' });
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to save evaluation.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    // Validate that all criteria returned by backend have a non-zero score
    const unscored = rubricCriteria.find((c) => {
      const found = scores.find((s) => s.criterionId === c.id);
      return !found || found.score <= 0;
    });

    if (unscored) {
      setValidationError(`Please provide a score for criterion: "${unscored.name}"`);
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);
    setNotice(null);
    try {
      await judgeService.submitEvaluation({
        projectId,
        scores,
        generalFeedback,
      });
      setIsSubmitted(true);
      setNotice({ type: 'success', message: 'Official evaluation submitted successfully.' });
      setTimeout(() => navigate('/judge'), 2000);
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to submit evaluation.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate current total / weighted score dynamically
  const totalScore = scores.reduce((sum, s) => sum + (s.score || 0), 0);
  const maxPossible = rubricCriteria.reduce((sum, c) => sum + c.maxScore, 0);

  if (isLoading) {
    return <LoadingState message="Loading dynamic rubric and project data..." />;
  }

  if (!project) {
    return (
      <ErrorState
        title="Project Not Found"
        message="The project requested for review could not be loaded."
        onRetry={loadData}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Link
          to="/judge"
          className="inline-flex items-center text-xs font-mono text-zinc-400 hover:text-zinc-200 mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Back to Assigned Queue</span>
        </Link>

        <PageHeader
          title={`Evaluating: ${project.title}`}
          description={`Team: ${project.teamName} • Track: ${project.track}`}
          badge={
            isSubmitted ? (
              <Badge variant="success">Review Submitted</Badge>
            ) : (
              <Badge variant="warning">In Review</Badge>
            )
          }
          actions={
            <div className="flex items-center gap-2">
              {project.repositoryUrl && (
                <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <GithubIcon className="w-3.5 h-3.5 mr-1.5" />
                    <span>Repo</span>
                  </Button>
                </a>
              )}
              {project.demoUrl && (
                <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    <span>Demo</span>
                  </Button>
                </a>
              )}
            </div>
          }
        />
      </div>

      {notice && (
        <div
          className={`flex items-center gap-2 rounded-md p-3 text-xs font-mono border ${
            notice.type === 'success'
              ? 'border-emerald-900/60 bg-emerald-950/30 text-emerald-300'
              : 'border-rose-900/60 bg-rose-950/30 text-rose-300'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Project Overview Details */}
      <Card className="border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
          Project Specification
        </h3>
        <p className="text-xs text-zinc-300 leading-relaxed font-sans">{project.description}</p>
      </Card>

      {/* Dynamic Rubric Scoring Section */}
      <form onSubmit={handleSubmitScore} className="space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h3 className="text-base font-semibold text-zinc-100">Evaluation Rubric</h3>
            <p className="text-xs text-zinc-400">
              Criteria dynamically supplied by hackathon rubric configuration.
            </p>
          </div>
          <div className="font-mono text-xs text-zinc-300 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded">
            Score: <strong className="text-blue-400 text-sm">{totalScore}</strong> / {maxPossible}
          </div>
        </div>

        {validationError && (
          <div className="flex items-center gap-2 rounded-md border border-amber-900/60 bg-amber-950/30 p-2.5 text-xs text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Dynamic Criterion List */}
        <div className="space-y-4">
          {rubricCriteria.map((criterion) => {
            const currentScore = scores.find((s) => s.criterionId === criterion.id);
            return (
              <RubricCriterionCard
                key={criterion.id}
                criterion={criterion}
                value={currentScore}
                onChange={handleScoreUpdate}
                disabled={isSubmitted}
              />
            );
          })}
        </div>

        {/* General Feedback Textarea */}
        <Card className="border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
          <Textarea
            label="General Evaluation Comments & Recommendations (Optional)"
            placeholder="Constructive feedback for the team regarding architectural strengths, scalability, and improvements..."
            value={generalFeedback}
            onChange={(e) => setGeneralFeedback(e.target.value)}
            disabled={isSubmitted}
            rows={4}
          />
        </Card>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleSaveDraft}
            isLoading={isSaving}
            disabled={isSubmitted}
          >
            <Save className="w-4 h-4 mr-1.5" />
            <span>Save Draft</span>
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            disabled={isSubmitted}
          >
            <FileCheck className="w-4 h-4 mr-1.5" />
            <span>{isSubmitted ? 'Score Submitted' : 'Submit Final Score'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
