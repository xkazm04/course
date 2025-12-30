'use client'

import { useState, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { GitPullRequest, ExternalLink, Clock, GitMerge, Award } from 'lucide-react'
import { PrismaticCard } from '@/app/shared/components'
import { cn } from '@/app/shared/lib/utils'
import { ICON_SIZES } from '@/app/shared/lib/iconSizes'
import { PhaseCard } from './PhaseCard'
import { CheckpointCard } from './CheckpointCard'
import { AIAssistanceModal } from './AIAssistanceModal'
import { STATUS_COLORS } from './config'
import type { ContributionTrackerProps, AIAssistanceType } from './types'

export function ContributionTracker({
  contribution,
  onCompleteTask,
  onUpdateStatus,
  onLogAI,
  onRateAI,
  onLinkPR,
}: ContributionTrackerProps) {
  const prefersReducedMotion = useReducedMotion()
  const { analyzedIssue, status, phaseProgress, pullRequest, outcome } = contribution
  const { issue, learningPath } = analyzedIssue

  const [expandedPhase, setExpandedPhase] = useState<string | null>(
    phaseProgress.find((p) => p.status === 'in_progress')?.phaseId || learningPath.phases[0].id
  )
  const [showAIChat, setShowAIChat] = useState(false)
  const [aiContext, setAIContext] = useState<{ type: AIAssistanceType; context: string } | null>(null)

  const totalTasks = phaseProgress.reduce((sum, p) => sum + p.totalTasks, 0)
  const completedTasks = phaseProgress.reduce((sum, p) => sum + p.tasksCompleted, 0)
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const handleRequestAI = useCallback(
    (type: AIAssistanceType, context: string) => {
      setAIContext({ type, context })
      setShowAIChat(true)
      onLogAI(type, context)
    },
    [onLogAI]
  )

  return (
    <div className="space-y-6">
      <HeaderCard
        issue={issue}
        status={status}
        estimatedHours={analyzedIssue.estimatedHours}
        overallProgress={overallProgress}
        pullRequest={pullRequest}
        onLinkPR={onLinkPR}
        prefersReducedMotion={prefersReducedMotion}
      />
      {outcome?.success && <SuccessCard outcome={outcome} repositoryName={issue.repository.name} />}
      <LearningPathCard
        phases={learningPath.phases}
        phaseProgress={phaseProgress}
        expandedPhase={expandedPhase}
        onTogglePhase={(id) => setExpandedPhase(expandedPhase === id ? null : id)}
        onCompleteTask={onCompleteTask}
        onRequestAI={handleRequestAI}
      />
      <CheckpointsCard checkpoints={learningPath.checkpoints} />
      {showAIChat && aiContext && (
        <AIAssistanceModal
          type={aiContext.type}
          context={aiContext.context}
          onClose={() => setShowAIChat(false)}
          onRate={onRateAI}
        />
      )}
    </div>
  )
}

// Sub-components for HeaderCard
interface HeaderCardProps {
  issue: { url: string; title: string; number: number; repository: { fullName: string } }
  status: keyof typeof STATUS_COLORS
  estimatedHours: number
  overallProgress: number
  pullRequest?: { url: string; number: number; title: string; state: string; additions: number; deletions: number; filesChanged: number; commentsCount: number }
  onLinkPR?: () => void
  prefersReducedMotion: boolean | null
}

function HeaderCard({ issue, status, estimatedHours, overallProgress, pullRequest, onLinkPR, prefersReducedMotion }: HeaderCardProps) {
  return (
    <PrismaticCard className="p-6">
      <div className="flex items-start justify-between mb-4">
        <IssueInfo issue={issue} status={status} estimatedHours={estimatedHours} />
        <ProgressCircle progress={overallProgress} prefersReducedMotion={prefersReducedMotion} />
      </div>
      {pullRequest && <PRInfo pullRequest={pullRequest} />}
      {!pullRequest && status === 'in_progress' && onLinkPR && <LinkPRButton onClick={onLinkPR} />}
    </PrismaticCard>
  )
}

function IssueInfo({ issue, status, estimatedHours }: Pick<HeaderCardProps, 'issue' | 'status' | 'estimatedHours'>) {
  return (
    <div className="flex-1 min-w-0">
      <a href={issue.url} target="_blank" rel="noopener noreferrer" data-testid="issue-link"
        className="flex items-center gap-2 text-sm font-medium text-[var(--ember)] hover:underline mb-2">
        {issue.repository.fullName} #{issue.number}
        <ExternalLink size={ICON_SIZES.xs} />
      </a>
      <h1 className="text-xl font-black text-[var(--forge-text-primary)] mb-2">{issue.title}</h1>
      <div className="flex items-center gap-3">
        <span className={cn('px-3 py-1 rounded-full text-sm font-medium capitalize', STATUS_COLORS[status].bg, STATUS_COLORS[status].text)}>
          {status.replace('_', ' ')}
        </span>
        <span className="flex items-center gap-1 text-sm text-[var(--forge-text-secondary)]">
          <Clock size={ICON_SIZES.sm} />{estimatedHours}h estimated
        </span>
      </div>
    </div>
  )
}

function ProgressCircle({ progress, prefersReducedMotion }: { progress: number; prefersReducedMotion: boolean | null }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="none" className="text-[var(--forge-border-default)]" />
          <motion.circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round"
            className="text-[var(--ember)]"
            initial={prefersReducedMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: progress / 100 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
            style={{ strokeDasharray: 226, strokeDashoffset: 0 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-black text-[var(--forge-text-primary)]">{progress}%</span>
        </div>
      </div>
      <span className="text-xs text-[var(--forge-text-secondary)] mt-1">Progress</span>
    </div>
  )
}

function PRInfo({ pullRequest }: { pullRequest: NonNullable<HeaderCardProps['pullRequest']> }) {
  const stateClasses = pullRequest.state === 'merged' ? 'bg-[var(--ember)]/10 text-[var(--ember)]'
    : pullRequest.state === 'closed' ? 'bg-[var(--forge-error)]/10 text-[var(--forge-error)]'
    : 'bg-[var(--forge-success)]/10 text-[var(--forge-success)]'

  return (
    <div className="mt-4 p-4 rounded-xl bg-[var(--forge-bg-anvil)] border border-[var(--forge-border-default)]">
      <div className="flex items-center justify-between">
        <a href={pullRequest.url} target="_blank" rel="noopener noreferrer" data-testid="pr-link"
          className="flex items-center gap-2 font-medium text-[var(--ember)] hover:underline">
          <GitPullRequest size={ICON_SIZES.md} />PR #{pullRequest.number}: {pullRequest.title}
          <ExternalLink size={ICON_SIZES.xs} />
        </a>
        <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', stateClasses)}>{pullRequest.state}</span>
      </div>
      <div className="flex items-center gap-4 mt-2 text-sm text-[var(--forge-text-secondary)]">
        <span>+{pullRequest.additions} / -{pullRequest.deletions}</span>
        <span>{pullRequest.filesChanged} files</span>
        <span>{pullRequest.commentsCount} comments</span>
      </div>
    </div>
  )
}

function LinkPRButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} data-testid="link-pr-btn"
      className="mt-4 w-full py-3 border-2 border-dashed border-[var(--forge-border-default)] rounded-xl text-[var(--forge-text-secondary)] font-medium hover:border-[var(--ember)]/50 hover:text-[var(--ember)] transition-colors flex items-center justify-center gap-2">
      <GitPullRequest size={ICON_SIZES.md} />Link Pull Request
    </button>
  )
}

function SuccessCard({ outcome, repositoryName }: { outcome: { skillsDemonstrated: string[]; badgeEarned?: { name: string; description: string } }; repositoryName: string }) {
  return (
    <PrismaticCard glowColor="emerald" className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-[var(--forge-success)]/10 rounded-2xl flex items-center justify-center">
          <GitMerge size={ICON_SIZES.lg} className="text-[var(--forge-success)]" />
        </div>
        <div>
          <h2 className="text-lg font-black text-[var(--forge-text-primary)]">Contribution Merged!</h2>
          <p className="text-sm text-[var(--forge-success)]">Your code is now part of {repositoryName}</p>
        </div>
      </div>
      <div className="mb-4">
        <h3 className="text-sm font-medium text-[var(--forge-text-secondary)] mb-2">Skills Demonstrated</h3>
        <div className="flex flex-wrap gap-2">
          {outcome.skillsDemonstrated.map((skill, i) => (
            <span key={i} className="px-3 py-1 bg-[var(--forge-success)]/10 text-[var(--forge-success)] text-sm font-medium rounded-full">{skill}</span>
          ))}
        </div>
      </div>
      {outcome.badgeEarned && (
        <div className="p-4 rounded-xl bg-[var(--forge-warning)]/10 border border-[var(--forge-warning)]/30 flex items-center gap-3">
          <div className="w-12 h-12 bg-[var(--forge-warning)]/10 rounded-2xl flex items-center justify-center">
            <Award size={ICON_SIZES.lg} className="text-[var(--forge-warning)]" />
          </div>
          <div>
            <h4 className="font-bold text-[var(--forge-text-primary)]">{outcome.badgeEarned.name}</h4>
            <p className="text-sm text-[var(--forge-text-secondary)]">{outcome.badgeEarned.description}</p>
          </div>
        </div>
      )}
    </PrismaticCard>
  )
}

function LearningPathCard({ phases, phaseProgress, expandedPhase, onTogglePhase, onCompleteTask, onRequestAI }: {
  phases: Array<{ id: string; title: string; type: string; description: string; tasks: any[]; estimatedHours: number; mentorshipPrompts: string[] }>
  phaseProgress: Array<{ phaseId: string; status: string; tasksCompleted: number; totalTasks: number }>
  expandedPhase: string | null
  onTogglePhase: (id: string) => void
  onCompleteTask: (phaseId: string, taskId: string) => void
  onRequestAI: (type: AIAssistanceType, context: string) => void
}) {
  return (
    <PrismaticCard className="p-6">
      <h2 className="text-lg font-bold text-[var(--forge-text-primary)] mb-4">Learning Path</h2>
      <div className="space-y-3">
        {phases.map((phase) => {
          const progress = phaseProgress.find((p) => p.phaseId === phase.id)
          return (
            <PhaseCard key={phase.id} phase={phase as any} progress={progress}
              isExpanded={expandedPhase === phase.id}
              isActive={progress?.status === 'in_progress'}
              isCompleted={progress?.status === 'completed'}
              onToggle={() => onTogglePhase(phase.id)}
              onCompleteTask={(taskId) => onCompleteTask(phase.id, taskId)}
              onRequestAI={onRequestAI}
            />
          )
        })}
      </div>
    </PrismaticCard>
  )
}

function CheckpointsCard({ checkpoints }: { checkpoints: Array<{ id: string; title: string; passed: boolean; verificationCriteria: string[]; selfAssessment: string[] }> }) {
  return (
    <PrismaticCard className="p-6">
      <h2 className="text-lg font-bold text-[var(--forge-text-primary)] mb-4">Checkpoints</h2>
      <div className="space-y-4">
        {checkpoints.map((checkpoint) => <CheckpointCard key={checkpoint.id} checkpoint={checkpoint} />)}
      </div>
    </PrismaticCard>
  )
}

export default ContributionTracker
