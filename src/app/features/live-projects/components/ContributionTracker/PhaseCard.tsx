'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, PlayCircle, ChevronRight, ChevronDown, Clock, Bot, BookOpen } from 'lucide-react'
import { cn } from '@/app/shared/lib/utils'
import { ICON_SIZES } from '@/app/shared/lib/iconSizes'
import { TaskItem } from './TaskItem'
import { PHASE_ICONS } from './config'
import type { PhaseCardProps } from './types'

export function PhaseCard({
  phase,
  progress,
  isExpanded,
  isActive,
  isCompleted,
  onToggle,
  onCompleteTask,
  onRequestAI,
}: PhaseCardProps) {
  const prefersReducedMotion = useReducedMotion()
  const Icon = PHASE_ICONS[phase.type] || BookOpen

  return (
    <div
      className={cn(
        'rounded-xl border transition-all',
        isActive
          ? 'border-[var(--ember)]/30 bg-[var(--ember)]/5'
          : isCompleted
          ? 'border-[var(--forge-success)]/30 bg-[var(--forge-success)]/5'
          : 'border-[var(--forge-border-default)] bg-[var(--forge-bg-elevated)]'
      )}
    >
      <PhaseHeader
        phase={phase}
        progress={progress}
        isActive={isActive}
        isCompleted={isCompleted}
        isExpanded={isExpanded}
        Icon={Icon}
        onToggle={onToggle}
      />
      {isExpanded && (
        <PhaseContent
          phase={phase}
          onCompleteTask={onCompleteTask}
          onRequestAI={onRequestAI}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}
    </div>
  )
}

interface PhaseHeaderProps {
  phase: PhaseCardProps['phase']
  progress: PhaseCardProps['progress']
  isActive: boolean
  isCompleted: boolean
  isExpanded: boolean
  Icon: React.ElementType
  onToggle: () => void
}

function PhaseHeader({ phase, progress, isActive, isCompleted, isExpanded, Icon, onToggle }: PhaseHeaderProps) {
  return (
    <button
      onClick={onToggle}
      data-testid={`phase-${phase.id}-btn`}
      className="w-full p-4 flex items-center gap-3 text-left"
    >
      <StatusIcon isCompleted={isCompleted} isActive={isActive} Icon={Icon} />
      <PhaseInfo phase={phase} progress={progress} isActive={isActive} isCompleted={isCompleted} />
      {isExpanded ? (
        <ChevronDown size={ICON_SIZES.md} className="text-[var(--forge-text-muted)]" />
      ) : (
        <ChevronRight size={ICON_SIZES.md} className="text-[var(--forge-text-muted)]" />
      )}
    </button>
  )
}

function StatusIcon({ isCompleted, isActive, Icon }: { isCompleted: boolean; isActive: boolean; Icon: React.ElementType }) {
  return (
    <div
      className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center',
        isCompleted
          ? 'bg-[var(--forge-success)]/10'
          : isActive
          ? 'bg-[var(--ember)]/10'
          : 'bg-[var(--forge-bg-anvil)]'
      )}
    >
      {isCompleted ? (
        <CheckCircle2 size={ICON_SIZES.md} className="text-[var(--forge-success)]" />
      ) : isActive ? (
        <PlayCircle size={ICON_SIZES.md} className="text-[var(--ember)]" />
      ) : (
        <Icon size={ICON_SIZES.md} className="text-[var(--forge-text-muted)]" />
      )}
    </div>
  )
}

function PhaseInfo({ phase, progress, isActive, isCompleted }: Omit<PhaseHeaderProps, 'Icon' | 'onToggle' | 'isExpanded'>) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <h3
          className={cn(
            'font-semibold',
            isCompleted
              ? 'text-[var(--forge-success)]'
              : isActive
              ? 'text-[var(--ember)]'
              : 'text-[var(--forge-text-primary)]'
          )}
        >
          {phase.title}
        </h3>
        {isActive && (
          <span className="px-2 py-0.5 bg-[var(--ember)] text-white text-xs font-medium rounded-full">
            Current
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 text-sm text-[var(--forge-text-secondary)] mt-1">
        <span>
          {progress?.tasksCompleted || 0}/{progress?.totalTasks || phase.tasks.length} tasks
        </span>
        <span className="flex items-center gap-1">
          <Clock size={ICON_SIZES.xs} />
          {phase.estimatedHours}h
        </span>
      </div>
    </div>
  )
}

interface PhaseContentProps {
  phase: PhaseCardProps['phase']
  onCompleteTask: (taskId: string) => void
  onRequestAI: PhaseCardProps['onRequestAI']
  prefersReducedMotion: boolean | null
}

function PhaseContent({ phase, onCompleteTask, onRequestAI, prefersReducedMotion }: PhaseContentProps) {
  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="px-4 pb-4"
    >
      <p className="text-sm text-[var(--forge-text-secondary)] mb-4">{phase.description}</p>
      <TasksList phase={phase} onCompleteTask={onCompleteTask} onRequestAI={onRequestAI} />
      {phase.mentorshipPrompts.length > 0 && (
        <MentorshipSection prompts={phase.mentorshipPrompts} onRequestAI={onRequestAI} />
      )}
    </motion.div>
  )
}

function TasksList({ phase, onCompleteTask, onRequestAI }: Omit<PhaseContentProps, 'prefersReducedMotion'>) {
  return (
    <div className="space-y-2">
      {phase.tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onComplete={() => onCompleteTask(task.id)}
          onRequestAI={(type) => onRequestAI(type, `${phase.title}: ${task.title}`)}
        />
      ))}
    </div>
  )
}

function MentorshipSection({ prompts, onRequestAI }: { prompts: string[]; onRequestAI: PhaseCardProps['onRequestAI'] }) {
  return (
    <div className="mt-4 p-3 rounded-xl bg-[var(--ember)]/5 border border-[var(--ember)]/20">
      <h4 className="flex items-center gap-2 text-sm font-medium text-[var(--ember)] mb-2">
        <Bot size={ICON_SIZES.sm} />
        Ask AI Mentor
      </h4>
      <div className="space-y-1">
        {prompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onRequestAI('approach_guidance', prompt)}
            data-testid={`mentor-prompt-${i}-btn`}
            className="w-full text-left text-sm text-[var(--forge-text-secondary)] hover:text-[var(--ember)] transition-colors"
          >
            &quot;{prompt}&quot;
          </button>
        ))}
      </div>
    </div>
  )
}
