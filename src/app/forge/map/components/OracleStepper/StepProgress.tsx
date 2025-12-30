'use client';

import { motion } from 'framer-motion';
import { ExperienceLevel } from '../../lib/oracleQuestions';

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  experience: ExperienceLevel | null;
}

export function StepProgress({ currentStep, totalSteps, experience }: StepProgressProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const getExperienceLabel = () => {
    switch (experience) {
      case 'beginner':
        return { icon: '🌱', label: 'Beginner Path' };
      case 'intermediate':
        return { icon: '🌿', label: 'Intermediate Path' };
      case 'advanced':
        return { icon: '🌳', label: 'Advanced Path' };
      default:
        return null;
    }
  };

  const expInfo = getExperienceLabel();

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="relative h-1.5 bg-[var(--forge-bg-elevated)] rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* Step info */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--forge-text-muted)]">
          Step {currentStep + 1} of {totalSteps}
        </span>
        {expInfo && (
          <span className="text-[var(--forge-text-secondary)] flex items-center gap-1">
            <span>{expInfo.icon}</span>
            <span>{expInfo.label}</span>
          </span>
        )}
      </div>
    </div>
  );
}
