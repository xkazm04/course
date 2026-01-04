'use client';

/**
 * LearningObjectives - Learning Progress Component
 *
 * Displays the learning objectives for a homework assignment
 * with completion checkboxes and links to relevant chapters.
 */

import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  BookOpen,
  ExternalLink,
  Target,
  Trophy,
} from 'lucide-react';
import type { LearningObjective } from '../lib/types';

export interface LearningObjectivesProps {
  objectives: LearningObjective[];
  onToggle?: (id: string) => void;
  className?: string;
}

export function LearningObjectives({
  objectives,
  onToggle,
  className = '',
}: LearningObjectivesProps) {
  const completedCount = objectives.filter((obj) => obj.completed).length;
  const totalCount = objectives.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const isComplete = completedCount === totalCount;

  return (
    <div
      className={`bg-[var(--forge-bg-elevated)]/60 backdrop-blur-sm rounded-xl border border-[var(--forge-border-subtle)] overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--forge-border-subtle)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--ember)]/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-[var(--ember)]" />
            </div>
            <span className="text-sm font-medium text-[var(--forge-text-primary)]">
              Learning Objectives
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-medium ${
                isComplete ? 'text-emerald-400' : 'text-[var(--forge-text-muted)]'
              }`}
            >
              {completedCount}/{totalCount}
            </span>
            {isComplete && <Trophy className="w-4 h-4 text-amber-400" />}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 w-full h-1.5 bg-[var(--forge-bg-bench)] rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${isComplete ? 'bg-emerald-500' : 'bg-[var(--ember)]'}`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Objectives list */}
      <div className="divide-y divide-[var(--forge-border-subtle)]">
        {objectives.map((objective, index) => (
          <ObjectiveItem
            key={objective.id}
            objective={objective}
            index={index}
            onToggle={onToggle}
          />
        ))}
      </div>

      {/* Completion message */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-3 bg-emerald-500/5 border-t border-emerald-500/20"
        >
          <p className="text-xs text-emerald-400 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            All learning objectives completed!
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ============================================================================
// Objective Item
// ============================================================================

interface ObjectiveItemProps {
  objective: LearningObjective;
  index: number;
  onToggle?: (id: string) => void;
}

function ObjectiveItem({ objective, index, onToggle }: ObjectiveItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-start gap-3 px-4 py-3 transition-colors ${
        objective.completed
          ? 'bg-emerald-500/5'
          : 'hover:bg-[var(--forge-bg-bench)]/30'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle?.(objective.id)}
        disabled={!onToggle}
        className={`mt-0.5 transition-colors ${
          onToggle ? 'cursor-pointer' : 'cursor-default'
        } ${
          objective.completed
            ? 'text-emerald-400'
            : 'text-[var(--forge-text-muted)] hover:text-[var(--ember)]'
        }`}
      >
        {objective.completed ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <Circle className="w-5 h-5" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-relaxed ${
            objective.completed
              ? 'text-[var(--forge-text-muted)] line-through'
              : 'text-[var(--forge-text-primary)]'
          }`}
        >
          {objective.description}
        </p>

        {/* Concept tag and chapter link */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {objective.concept && (
            <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--ember)]/10 text-[var(--ember)] rounded">
              {objective.concept}
            </span>
          )}

          {objective.chapterLink && (
            <a
              href={objective.chapterLink}
              className="flex items-center gap-1 text-[10px] text-[var(--forge-text-muted)] hover:text-[var(--ember)] transition-colors"
            >
              <BookOpen className="w-3 h-3" />
              Read chapter
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default LearningObjectives;
