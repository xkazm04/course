'use client'

import { CheckCircle2, Circle, ExternalLink, Bot } from 'lucide-react'
import { cn } from '@/app/shared/lib/utils'
import { ICON_SIZES } from '@/app/shared/lib/iconSizes'
import type { TaskItemProps } from './types'

export function TaskItem({ task, onComplete, onRequestAI }: TaskItemProps) {
  return (
    <div
      className={cn(
        'p-3 rounded-xl flex items-start gap-3',
        task.completed ? 'bg-[var(--forge-success)]/10' : 'bg-[var(--forge-bg-elevated)]'
      )}
    >
      <CompletionButton completed={task.completed} taskId={task.id} onComplete={onComplete} />
      <TaskContent task={task} />
      {task.aiAssistanceType && !task.completed && (
        <AIAssistButton taskId={task.id} onClick={() => onRequestAI(task.aiAssistanceType!)} />
      )}
    </div>
  )
}

function CompletionButton({
  completed,
  taskId,
  onComplete,
}: {
  completed: boolean
  taskId: string
  onComplete: () => void
}) {
  return (
    <button
      onClick={onComplete}
      disabled={completed}
      data-testid={`task-${taskId}-btn`}
      className="flex-shrink-0 mt-0.5"
    >
      {completed ? (
        <CheckCircle2 size={ICON_SIZES.md} className="text-[var(--forge-success)]" />
      ) : (
        <Circle
          size={ICON_SIZES.md}
          className="text-[var(--forge-text-muted)] hover:text-[var(--ember)] transition-colors"
        />
      )}
    </button>
  )
}

function TaskContent({ task }: { task: TaskItemProps['task'] }) {
  return (
    <div className="flex-1 min-w-0">
      <h4
        className={cn(
          'font-medium',
          task.completed
            ? 'text-[var(--forge-success)] line-through'
            : 'text-[var(--forge-text-primary)]'
        )}
      >
        {task.title}
      </h4>
      <p className="text-sm text-[var(--forge-text-secondary)] mt-0.5">{task.description}</p>
      {task.resources && task.resources.length > 0 && <ResourceLinks resources={task.resources} />}
    </div>
  )
}

function ResourceLinks({ resources }: { resources: Array<{ url: string; title: string }> }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {resources.map((resource, i) => (
        <a
          key={i}
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--ember)] hover:underline flex items-center gap-1"
        >
          <ExternalLink size={10} />
          {resource.title}
        </a>
      ))}
    </div>
  )
}

function AIAssistButton({ taskId, onClick }: { taskId: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      data-testid={`ai-assist-${taskId}-btn`}
      className="flex-shrink-0 p-2 rounded-lg bg-[var(--ember)]/10 text-[var(--ember)] hover:bg-[var(--ember)]/20 transition-colors"
      title="Get AI assistance"
    >
      <Bot size={ICON_SIZES.sm} />
    </button>
  )
}
