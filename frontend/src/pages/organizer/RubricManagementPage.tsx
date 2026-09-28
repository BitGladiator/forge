import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input, Textarea } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { organizerService } from '../../services/organizerService';
import type { RubricCriterion } from '../../types';

export const RubricManagementPage: React.FC = () => {
  const [criteria, setCriteria] = useState<RubricCriterion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchRubric = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await organizerService.getRubric();
      setCriteria(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load rubric criteria.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRubric();
  }, []);

  const handleUpdateCriterion = (index: number, field: keyof RubricCriterion, value: any) => {
    const updated = [...criteria];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setCriteria(updated);
  };

  const handleAddCriterion = () => {
    const newCrit: RubricCriterion = {
      id: `crit_${Date.now()}`,
      name: 'New Criterion',
      description: 'Describe the assessment standard for this criterion...',
      weight: 10,
      maxScore: 10,
    };
    setCriteria([...criteria, newCrit]);
  };

  const handleRemoveCriterion = (index: number) => {
    if (criteria.length <= 1) {
      alert('At least one rubric criterion is required.');
      return;
    }
    const updated = [...criteria];
    updated.splice(index, 1);
    setCriteria(updated);
  };

  const handleSaveRubric = async () => {
    setIsSaving(true);
    setNotice(null);
    try {
      const saved = await organizerService.saveRubric(criteria);
      setCriteria(saved);
      setNotice({ type: 'success', message: 'Rubric criteria configuration saved successfully.' });
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to update rubric.' });
    } finally {
      setIsSaving(false);
    }
  };

  const totalWeight = criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);

  if (isLoading) {
    return <LoadingState message="Loading event scoring rubric..." />;
  }

  if (error) {
    return <ErrorState title="Error Loading Rubric" message={error} onRetry={fetchRubric} />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Scoring Rubric Management"
        description="Configure evaluation criteria, weights, and point ceilings. Backend enforces authoritative score calculations."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleAddCriterion}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Add Criterion</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveRubric}
              isLoading={isSaving}
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              <span>Save Rubric</span>
            </Button>
          </div>
        }
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
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Weight Distribution Card */}
      <Card className="border-zinc-800 bg-zinc-900/40 p-4 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400">Total Rubric Weight</h4>
          <p className="text-xs text-zinc-500 mt-0.5">Recommended total weight distribution should equal 100%</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-mono text-base font-bold ${totalWeight === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {totalWeight}%
          </span>
          {totalWeight === 100 ? (
            <Badge variant="success" size="sm">Balanced</Badge>
          ) : (
            <Badge variant="warning" size="sm">Unbalanced</Badge>
          )}
        </div>
      </Card>

      {/* Criteria Cards */}
      <div className="space-y-4">
        {criteria.map((criterion, idx) => (
          <Card key={criterion.id} className="border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <span className="font-mono text-xs text-zinc-400">
                Criterion #{idx + 1}
              </span>
              <button
                onClick={() => handleRemoveCriterion(idx)}
                className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-zinc-800 transition-colors"
                title="Delete criterion"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Criterion Name"
                  value={criterion.name}
                  onChange={(e) => handleUpdateCriterion(idx, 'name', e.target.value)}
                  placeholder="e.g. Technical Execution & Architecture"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Weight (%)"
                  type="number"
                  min="0"
                  max="100"
                  value={criterion.weight}
                  onChange={(e) => handleUpdateCriterion(idx, 'weight', Number(e.target.value))}
                />
                <Input
                  label="Max Score"
                  type="number"
                  min="1"
                  max="100"
                  value={criterion.maxScore}
                  onChange={(e) => handleUpdateCriterion(idx, 'maxScore', Number(e.target.value))}
                />
              </div>
            </div>

            <Textarea
              label="Description & Scoring Guidelines"
              value={criterion.description}
              onChange={(e) => handleUpdateCriterion(idx, 'description', e.target.value)}
              placeholder="Provide judges with clear guidelines for assessing this criterion..."
              rows={2}
            />
          </Card>
        ))}
      </div>
    </div>
  );
};
