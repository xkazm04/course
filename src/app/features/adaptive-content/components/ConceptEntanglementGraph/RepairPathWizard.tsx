'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CircleDot, Info, Play, RefreshCw, Target, X } from 'lucide-react'
import { useConceptEntanglement, useRepairPath } from '../../lib/useConceptEntanglement'
import { fadeInUp, staggerItem } from '@/app/shared/lib/animations'
import type { RepairPathWizardProps, ConceptId } from './types'

export function RepairPathWizard({
  targetConceptId,
  onComplete,
  onDismiss,
  className = '',
}: RepairPathWizardProps) {
  const { graph } = useConceptEntanglement()
  const { repairPath, currentStep, isActive, start, completeStep, dismiss } = useRepairPath(targetConceptId)

  const targetConcept = graph.nodes.get(targetConceptId)

  React.useEffect(() => {
    if (!isActive && targetConcept) start()
  }, [isActive, targetConcept, start])

  if (!repairPath || !targetConcept) return null

  const handleStepComplete = (conceptId: ConceptId) => {
    completeStep(conceptId)
    if (currentStep >= repairPath.steps.length - 1) onComplete?.()
  }

  const handleDismiss = () => {
    dismiss()
    onDismiss?.()
  }

  return (
    <motion.div
      {...fadeInUp}
      className={`rounded-xl border border-[var(--ember)]/30 bg-gradient-to-br from-[var(--ember)]/10 to-[var(--molten)]/10 backdrop-blur-sm p-5 ${className}`}
      data-testid="repair-path-wizard"
    >
      <WizardHeader
        title={targetConcept.title}
        stepCount={repairPath.steps.length}
        estimatedTime={repairPath.totalEstimatedTime}
        onDismiss={handleDismiss}
      />
      <ProgressIndicator current={currentStep} total={repairPath.steps.length} />
      <StepsList
        steps={repairPath.steps}
        currentStep={currentStep}
        graph={graph}
        onStepComplete={handleStepComplete}
      />
      <ExpectedOutcome improvement={repairPath.expectedImprovement} />
    </motion.div>
  )
}

interface WizardHeaderProps {
  title: string
  stepCount: number
  estimatedTime: number
  onDismiss: () => void
}

function WizardHeader({ title, stepCount, estimatedTime, onDismiss }: WizardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[var(--ember)]/20">
          <RefreshCw className="w-5 h-5 text-[var(--ember)]" />
        </div>
        <div>
          <h3 className="font-semibold text-[var(--forge-text-primary)]">Repair Path to &quot;{title}&quot;</h3>
          <p className="text-sm text-[var(--forge-text-muted)]">
            {stepCount} step{stepCount !== 1 ? 's' : ''} • {estimatedTime} min estimated
          </p>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 rounded hover:bg-[var(--forge-bg-elevated)] transition-colors"
        data-testid="repair-path-dismiss"
      >
        <X className="w-5 h-5 text-[var(--forge-text-muted)]" />
      </button>
    </div>
  )
}

function ProgressIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <div className="flex-1 h-1.5 bg-[var(--forge-bg-elevated)]/50 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(current / total) * 100}%` }}
          className="h-full bg-gradient-forge rounded-full"
        />
      </div>
      <span className="text-xs text-[var(--forge-text-muted)]">{current}/{total}</span>
    </div>
  )
}

interface Step {
  conceptId: string
  reason: string
  priority: string
  activities: Array<{ type: string; description: string }>
}

interface StepsListProps {
  steps: Step[]
  currentStep: number
  graph: { nodes: Map<string, { title: string }> }
  onStepComplete: (conceptId: string) => void
}

function StepsList({ steps, currentStep, graph, onStepComplete }: StepsListProps) {
  return (
    <div className="space-y-3">
      {steps.map((step, idx) => (
        <StepItem
          key={step.conceptId}
          step={step}
          index={idx}
          currentStep={currentStep}
          graph={graph}
          onComplete={() => onStepComplete(step.conceptId)}
        />
      ))}
    </div>
  )
}

interface StepItemProps {
  step: Step
  index: number
  currentStep: number
  graph: { nodes: Map<string, { title: string }> }
  onComplete: () => void
}

function StepItem({ step, index, currentStep, graph, onComplete }: StepItemProps) {
  const isComplete = index < currentStep
  const isCurrent = index === currentStep
  const stepConcept = graph.nodes.get(step.conceptId)

  const stepClasses = isComplete
    ? 'bg-[var(--forge-success)]/10 border-[var(--forge-success)]/30'
    : isCurrent
    ? 'bg-[var(--ember)]/10 border-[var(--ember)]/50 ring-1 ring-[var(--ember)]/30'
    : 'bg-[var(--forge-bg-anvil)]/50 border-[var(--forge-border-subtle)] opacity-60'

  return (
    <motion.div
      {...staggerItem}
      transition={{ delay: index * 0.05 }}
      className={`p-3 rounded-lg border transition-all ${stepClasses}`}
      data-testid={`repair-step-${step.conceptId}`}
    >
      <StepHeader
        title={stepConcept?.title ?? step.conceptId}
        reason={step.reason}
        priority={step.priority}
        stepNumber={index + 1}
        isComplete={isComplete}
        isCurrent={isCurrent}
      />
      {isCurrent && <StepActivities activities={step.activities} onComplete={onComplete} />}
    </motion.div>
  )
}

function StepHeader({
  title, reason, priority, stepNumber, isComplete, isCurrent
}: {
  title: string; reason: string; priority: string; stepNumber: number; isComplete: boolean; isCurrent: boolean
}) {
  const badgeClasses = isComplete
    ? 'bg-[var(--forge-success)] text-white'
    : isCurrent
    ? 'bg-[var(--ember)] text-white'
    : 'bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)]'

  const priorityClasses =
    priority === 'required' ? 'bg-[var(--forge-error)]/20 text-[var(--forge-error)]'
    : priority === 'recommended' ? 'bg-[var(--forge-warning)]/20 text-[var(--forge-warning)]'
    : 'bg-[var(--forge-bg-elevated)]/20 text-[var(--forge-text-muted)]'

  return (
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${badgeClasses}`}>
          {isComplete ? '✓' : stepNumber}
        </div>
        <div>
          <h4 className="text-sm font-medium text-[var(--forge-text-primary)]">{title}</h4>
          <p className="text-xs text-[var(--forge-text-muted)]">{reason}</p>
        </div>
      </div>
      <span className={`text-xs px-1.5 py-0.5 rounded ${priorityClasses}`}>{priority}</span>
    </div>
  )
}

function StepActivities({
  activities, onComplete
}: {
  activities: Array<{ type: string; description: string }>; onComplete: () => void
}) {
  const icons: Record<string, React.ReactNode> = {
    video: <Play className="w-3.5 h-3.5 text-[var(--forge-info)]" />,
    review: <Info className="w-3.5 h-3.5 text-[var(--forge-text-muted)]" />,
    practice: <CircleDot className="w-3.5 h-3.5 text-[var(--forge-success)]" />,
    quiz: <Target className="w-3.5 h-3.5 text-[var(--ember-glow)]" />,
  }

  return (
    <div className="mt-3 space-y-2">
      {activities.map((activity, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          {icons[activity.type]}
          <span className="text-[var(--forge-text-secondary)]">{activity.description}</span>
        </div>
      ))}
      <button
        onClick={onComplete}
        className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[var(--ember)] hover:bg-[var(--ember-bright)] text-white transition-colors"
        data-testid="complete-step-btn"
      >
        <span className="text-sm font-medium">Complete Step</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

function ExpectedOutcome({ improvement }: { improvement: number }) {
  return (
    <div className="mt-4 pt-4 border-t border-[var(--forge-border-subtle)] flex items-center justify-between text-sm">
      <span className="text-[var(--forge-text-muted)]">Expected improvement</span>
      <span className="text-[var(--forge-success)] font-medium">+{improvement}% comprehension</span>
    </div>
  )
}
