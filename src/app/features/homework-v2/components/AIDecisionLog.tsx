'use client';

/**
 * AIDecisionLog - AI Decision Transparency Component
 *
 * Displays Claude's decision-making process as a step-by-step checklist
 * with expandable reasoning cards explaining each decision.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  FileCode,
  Lightbulb,
  GitBranch,
} from 'lucide-react';
import type { AIDecisionLog, AIDecisionStep, DecisionStatus } from '../lib/types';

export interface AIDecisionLogProps {
  log: AIDecisionLog;
  onStepClick?: (step: AIDecisionStep) => void;
  onToggleVisibility?: () => void;
  className?: string;
}

// Status icons and colors
const STATUS_CONFIG: Record<
  DecisionStatus,
  { icon: React.ReactNode; color: string; bgColor: string }
> = {
  pending: {
    icon: <Circle className="w-4 h-4" />,
    color: 'text-[var(--forge-text-muted)]',
    bgColor: 'bg-[var(--forge-bg-bench)]/30',
  },
  in_progress: {
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/5',
  },
  completed: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/5',
  },
  skipped: {
    icon: <Circle className="w-4 h-4" />,
    color: 'text-[var(--forge-text-muted)]',
    bgColor: 'bg-[var(--forge-bg-bench)]/30',
  },
  reverted: {
    icon: <GitBranch className="w-4 h-4" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/5',
  },
};

export function AIDecisionLog({
  log,
  onStepClick,
  onToggleVisibility,
  className = '',
}: AIDecisionLogProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(
    new Set(log.steps.filter((s) => s.status === 'in_progress').map((s) => s.id))
  );

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const completedCount = log.steps.filter((s) => s.status === 'completed').length;
  const totalCount = log.steps.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div
      className={`bg-[var(--forge-bg-elevated)]/60 backdrop-blur-sm rounded-xl border border-[var(--forge-border-subtle)] overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--forge-border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--ember)]/10 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-[var(--ember)]" />
          </div>
          <div>
            <span className="text-sm font-medium text-[var(--forge-text-primary)]">
              AI Decision Log
            </span>
            <span className="text-xs text-[var(--forge-text-muted)] ml-2">
              {completedCount}/{totalCount} steps
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress bar */}
          <div className="w-20 h-1.5 bg-[var(--forge-bg-bench)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--ember)]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-xs text-[var(--forge-text-muted)] font-medium">
            {progressPercent}%
          </span>

          {/* Visibility toggle */}
          {onToggleVisibility && (
            <button
              onClick={onToggleVisibility}
              className="p-1.5 rounded-lg hover:bg-[var(--forge-bg-bench)]/60 text-[var(--forge-text-secondary)] transition-colors"
              title={log.isVisible ? 'Hide decision log' : 'Show decision log'}
            >
              {log.isVisible ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Steps list */}
      <AnimatePresence>
        {log.isVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="divide-y divide-[var(--forge-border-subtle)]"
          >
            {log.steps.map((step) => (
              <DecisionStepCard
                key={step.id}
                step={step}
                isExpanded={expandedSteps.has(step.id)}
                onToggle={() => toggleStep(step.id)}
                onClick={onStepClick ? () => onStepClick(step) : undefined}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Decision Step Card
// ============================================================================

interface DecisionStepCardProps {
  step: AIDecisionStep;
  isExpanded: boolean;
  onToggle: () => void;
  onClick?: () => void;
}

function DecisionStepCard({
  step,
  isExpanded,
  onToggle,
}: DecisionStepCardProps) {
  const config = STATUS_CONFIG[step.status];

  return (
    <div className="group">
      {/* Step header */}
      <button
        onClick={onToggle}
        className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[var(--forge-bg-bench)]/30 transition-colors ${
          step.status === 'in_progress' ? 'bg-blue-500/5' : ''
        }`}
      >
        {/* Expand/collapse icon */}
        <div className="mt-0.5 text-[var(--forge-text-muted)]">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </div>

        {/* Status icon */}
        <div className={`mt-0.5 ${config.color}`}>{config.icon}</div>

        {/* Step content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--forge-text-muted)]">
              Step {step.stepNumber}
            </span>
            {step.status === 'in_progress' && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/20 text-blue-400 rounded">
                ACTIVE
              </span>
            )}
          </div>
          <p
            className={`text-sm font-medium mt-0.5 ${
              step.status === 'completed'
                ? 'text-[var(--forge-text-muted)] line-through'
                : 'text-[var(--forge-text-primary)]'
            }`}
          >
            {step.action}
          </p>

          {/* Files affected preview */}
          {step.filesAffected.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <FileCode className="w-3 h-3 text-[var(--forge-text-muted)]" />
              <span className="text-xs text-[var(--forge-text-muted)]">
                {step.filesAffected.join(', ')}
              </span>
            </div>
          )}
        </div>
      </button>

      {/* Expanded reasoning */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pl-14">
              <ReasoningCard step={step} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Reasoning Card
// ============================================================================

interface ReasoningCardProps {
  step: AIDecisionStep;
}

function ReasoningCard({ step }: ReasoningCardProps) {
  return (
    <div className="p-4 rounded-lg bg-[var(--forge-bg-bench)]/30 border border-[var(--forge-border-subtle)]">
      {/* Reasoning */}
      <div className="mb-3">
        <h4 className="text-xs font-medium text-[var(--forge-text-muted)] mb-1.5 uppercase tracking-wider">
          Why this approach?
        </h4>
        <p className="text-sm text-[var(--forge-text-secondary)] leading-relaxed">
          {step.reasoning}
        </p>
      </div>

      {/* Alternatives considered */}
      {step.alternativesConsidered && step.alternativesConsidered.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-[var(--forge-text-muted)] mb-1.5 uppercase tracking-wider">
            Alternatives considered
          </h4>
          <ul className="space-y-1">
            {step.alternativesConsidered.map((alt, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-xs text-[var(--forge-text-muted)]"
              >
                <span className="text-red-400 mt-0.5">✗</span>
                {alt}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Files affected */}
      {step.filesAffected.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-[var(--forge-text-muted)] mb-1.5 uppercase tracking-wider">
            Files affected
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {step.filesAffected.map((file) => (
              <span
                key={file}
                className="px-2 py-0.5 text-xs font-mono bg-[var(--forge-bg-bench)] rounded text-[var(--forge-text-secondary)]"
              >
                {file}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AIDecisionLog;
