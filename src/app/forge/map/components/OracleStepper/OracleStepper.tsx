'use client';

/**
 * OracleStepper - Main Oracle questionnaire component
 * Psychology-informed multi-step flow with experience-based branching
 * Domain is pre-selected before entering the Oracle
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOracleStepper, getStepLabel } from '../../lib/useOracleStepper';
import { DomainId, getExperienceQuestion, getBranchQuestions } from '../../lib/oracleQuestions';
import type { OraclePath, PathNode } from '../../lib/oracleApi';
import { StepProgress } from './StepProgress';
import { StepExperience } from './StepExperience';
import { StepQuestion } from './StepQuestion';
import { StepFreeInput } from './StepFreeInput';
import { StepGenerating } from './StepGenerating';
import { StepResults } from './StepResults';

interface OracleStepperProps {
  domain: DomainId;
  onComplete?: (pathId: string) => void;
  onAcceptPath?: (path: OraclePath) => Promise<void>;
  onNavigateToNode?: (node: PathNode) => void;
  onClose?: () => void;
}

export function OracleStepper({
  domain,
  onComplete,
  onAcceptPath,
  onNavigateToNode,
  onClose
}: OracleStepperProps) {
  const [state, actions] = useOracleStepper({ domain });

  // Trigger generation when entering generating step
  useEffect(() => {
    if (state.currentStep === 'generating' && !state.isLoading && state.paths.length === 0) {
      actions.generate();
    }
  }, [state.currentStep, state.isLoading, state.paths.length, actions]);

  const handlePathSelect = (pathId: string) => {
    actions.selectPath(pathId);
    onComplete?.(pathId);
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 'experience':
        const expQuestion = getExperienceQuestion(domain);
        return (
          <StepExperience
            question={expQuestion}
            selectedExperience={state.experience}
            onSelect={actions.setExperience}
          />
        );

      case 'branch_1':
      case 'branch_2':
      case 'branch_3':
        if (!state.experience) return null;
        const branchIndex = parseInt(state.currentStep.split('_')[1]) - 1;
        const branchQuestions = getBranchQuestions(state.experience);
        const branchQuestion = branchQuestions[branchIndex];
        if (!branchQuestion) return null;
        return (
          <StepQuestion
            key={branchQuestion.id}
            question={branchQuestion}
            selectedAnswer={state.branchAnswers[branchQuestion.id]}
            onSelect={(answer) => actions.setBranchAnswer(branchQuestion.id, answer)}
          />
        );

      case 'commitment':
        return (
          <StepQuestion
            key="commitment"
            question={{
              id: 'commitment',
              question: 'How much time can you realistically dedicate?',
              subtitle: "Be honest - we'll build a path that fits your life",
              type: 'single-select',
              options: [
                {
                  id: 'casual',
                  icon: '🌙',
                  label: 'A few hours per week',
                  description: '2-5 hours, learning alongside life',
                  note: 'Perfect for steady, sustainable progress'
                },
                {
                  id: 'part_time',
                  icon: '📅',
                  label: 'Part-time focus',
                  description: '10-15 hours per week',
                  note: 'Significant progress in months'
                },
                {
                  id: 'dedicated',
                  icon: '💪',
                  label: 'Dedicated learner',
                  description: '20-30 hours per week',
                  note: 'Accelerated path possible'
                },
                {
                  id: 'immersive',
                  icon: '🔥',
                  label: 'Full immersion',
                  description: '40+ hours per week',
                  note: 'Bootcamp-style intensity'
                }
              ]
            }}
            selectedAnswer={state.commitment || undefined}
            onSelect={(answer) => actions.setCommitment(answer as string)}
          />
        );

      case 'free_input':
        return (
          <StepFreeInput
            value={state.freeInput}
            onChange={actions.setFreeInput}
          />
        );

      case 'generating':
        return <StepGenerating experience={state.experience} />;

      case 'results':
        return (
          <StepResults
            paths={state.paths}
            selectedPathId={state.selectedPathId}
            onSelectPath={handlePathSelect}
            onReset={actions.reset}
            onAcceptPath={onAcceptPath}
            onNavigateToNode={onNavigateToNode}
          />
        );

      default:
        return null;
    }
  };

  const isInputStep = !['generating', 'results'].includes(state.currentStep);
  const showNavigation = isInputStep;

  return (
    <div className="flex flex-col h-full pt-14 bg-[var(--forge-bg-void)] relative overflow-hidden">
      {/* Background patterns (non-animated) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Base gradient - uses theme tokens */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--oracle-gradient-from)] via-[var(--oracle-gradient-via)] to-[var(--oracle-gradient-to)]" />

        {/* Subtle radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--ember)_0%,_transparent_50%)] opacity-5" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(var(--ember) 1px, transparent 1px),
              linear-gradient(90deg, var(--ember) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Secondary grid */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(var(--gold) 1px, transparent 1px),
              linear-gradient(90deg, var(--gold) 1px, transparent 1px)
            `,
            backgroundSize: "180px 180px",
          }}
        />

        {/* Vignette - uses theme token */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, transparent 40%, var(--oracle-vignette) 100%)`
          }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex-shrink-0 px-6 pt-6 pb-4 border-b border-[var(--forge-border-subtle)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--ember)] to-[var(--ember-glow)] flex items-center justify-center">
              <span className="text-xl">🔮</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--oracle-text-heading)]">Learning Oracle</h2>
              <p className="text-sm text-[var(--forge-text-secondary)]">
                {getStepLabel(state.currentStep, state.experience || undefined)}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-elevated)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Progress */}
        {isInputStep && (
          <StepProgress
            currentStep={state.stepIndex}
            totalSteps={state.totalSteps}
            experience={state.experience}
          />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 py-6">
        {state.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-xl bg-[var(--forge-error)]/10 border border-[var(--forge-error)]/20"
          >
            <p className="text-sm text-[var(--forge-error)]">{state.error}</p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={state.currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Footer */}
      {showNavigation && (
        <div className="relative z-10 flex-shrink-0 px-6 py-4 border-t border-[var(--forge-border-subtle)]">
          <div className="flex items-center justify-between">
            <button
              onClick={actions.back}
              disabled={!state.canGoBack}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-elevated)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>

            <button
              onClick={state.currentStep === 'free_input' ? actions.generate : actions.next}
              disabled={!state.canGoNext && state.currentStep !== 'free_input'}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] text-[var(--oracle-text-on-ember)] hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--ember)]/20"
            >
              {state.currentStep === 'free_input' ? 'Generate My Path' : 'Continue'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
