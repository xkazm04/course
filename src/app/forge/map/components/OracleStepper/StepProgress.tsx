'use client';

import { motion } from 'framer-motion';
import { ExperienceLevel } from '../../lib/oracleQuestions';
import { Check } from 'lucide-react';

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
        return { icon: '🌱', label: 'Foundation', color: 'var(--forge-success)' };
      case 'intermediate':
        return { icon: '🌿', label: 'Growth', color: 'var(--forge-info)' };
      case 'advanced':
        return { icon: '🌳', label: 'Mastery', color: 'var(--ember)' };
      default:
        return null;
    }
  };

  const expInfo = getExperienceLabel();

  return (
    <div className="space-y-3">
      {/* Step indicators */}
      <div className="flex items-center justify-between gap-1">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div key={index} className="flex items-center flex-1">
              {/* Step dot */}
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                  backgroundColor: isCompleted
                    ? 'var(--ember)'
                    : isCurrent
                    ? 'var(--ember)'
                    : 'var(--forge-bg-elevated)',
                }}
                transition={{ duration: 0.2 }}
                className={`
                  relative w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                  ${isCurrent ? 'ring-2 ring-[var(--ember)]/30 ring-offset-2 ring-offset-[var(--forge-bg-void)]' : ''}
                  ${isUpcoming ? 'border border-[var(--forge-border-subtle)]' : ''}
                `}
              >
                {isCompleted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Check size={12} className="text-[var(--oracle-text-on-ember)]" />
                  </motion.div>
                )}
                {isCurrent && (
                  <motion.div
                    className="w-2 h-2 rounded-full bg-[var(--oracle-text-on-ember)]"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.div>

              {/* Connector line */}
              {index < totalSteps - 1 && (
                <div className="flex-1 h-0.5 mx-1 bg-[var(--forge-bg-elevated)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[var(--ember)]"
                    initial={{ width: 0 }}
                    animate={{ width: isCompleted ? '100%' : '0%' }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Step info */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--forge-text-muted)]">
          Step {currentStep + 1} of {totalSteps}
        </span>
        {expInfo && (
          <motion.span
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `color-mix(in srgb, ${expInfo.color} 15%, transparent)` }}
          >
            <span>{expInfo.icon}</span>
            <span style={{ color: expInfo.color }} className="font-medium">
              {expInfo.label}
            </span>
          </motion.span>
        )}
      </div>
    </div>
  );
}
