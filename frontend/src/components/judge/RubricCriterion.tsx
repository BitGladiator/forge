import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import type { RubricCriterion, RubricScore } from '../../types';

interface RubricCriterionProps {
  criterion: RubricCriterion;
  value?: RubricScore;
  onChange: (score: RubricScore) => void;
  disabled?: boolean;
}

export const RubricCriterionCard: React.FC<RubricCriterionProps> = ({
  criterion,
  value,
  onChange,
  disabled = false,
}) => {
  const currentScore = value?.score ?? 0;
  const currentComment = value?.comment ?? '';

  const handleScoreChange = (scoreNum: number) => {
    if (disabled) return;
    onChange({
      criterionId: criterion.id,
      score: scoreNum,
      comment: currentComment,
    });
  };

  const handleCommentChange = (comment: string) => {
    if (disabled) return;
    onChange({
      criterionId: criterion.id,
      score: currentScore,
      comment,
    });
  };

  // Generate score buttons up to maxScore (e.g. 1 to 10 or 1 to 5)
  const scoreOptions = Array.from({ length: criterion.maxScore }, (_, i) => i + 1);

  return (
    <Card className="space-y-4 border-zinc-800 bg-zinc-900/40">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
        <div>
          <h4 className="text-sm font-semibold text-zinc-100">{criterion.name}</h4>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{criterion.description}</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {criterion.weight > 0 && (
            <Badge variant="neutral" size="sm">
              Weight: {criterion.weight}%
            </Badge>
          )}
          <Badge variant="info" size="sm">
            Max: {criterion.maxScore}
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono uppercase tracking-wider text-zinc-400">
            Score Assessment
          </label>
          <span className="text-xs font-mono text-zinc-300">
            Selected: <strong className="text-blue-400 font-semibold">{currentScore || '-'}</strong> / {criterion.maxScore}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {scoreOptions.map((num) => {
            const isSelected = currentScore === num;
            return (
              <button
                key={num}
                type="button"
                disabled={disabled}
                onClick={() => handleScoreChange(num)}
                className={`h-8 w-9 rounded border font-mono text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:opacity-50 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-600/20 text-blue-300 font-semibold shadow-xs'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-400">
          Criterion Notes / Feedback (Optional)
        </label>
        <textarea
          disabled={disabled}
          value={currentComment}
          onChange={(e) => handleCommentChange(e.target.value)}
          placeholder={`Add specific observations regarding ${criterion.name.toLowerCase()}...`}
          className="h-16 w-full rounded-md border border-zinc-800 bg-zinc-900/60 p-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:opacity-50"
        />
      </div>
    </Card>
  );
};
