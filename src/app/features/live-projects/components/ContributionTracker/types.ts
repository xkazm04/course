import type {
  Contribution,
  ContributionStatus,
  LearningPhase,
  PhaseTask,
  LearningCheckpoint,
  PhaseType,
  AIAssistanceType,
} from '../../lib/types'

export interface ContributionTrackerProps {
  contribution: Contribution
  onCompleteTask: (phaseId: string, taskId: string) => void
  onUpdateStatus: (status: ContributionStatus) => void
  onLogAI: (type: AIAssistanceType, context: string) => string
  onRateAI: (logId: string, wasHelpful: boolean) => void
  onLinkPR?: () => void
}

export interface PhaseCardProps {
  phase: LearningPhase
  progress?: { status: string; tasksCompleted: number; totalTasks: number }
  isExpanded: boolean
  isActive: boolean
  isCompleted: boolean
  onToggle: () => void
  onCompleteTask: (taskId: string) => void
  onRequestAI: (type: AIAssistanceType, context: string) => void
}

export interface TaskItemProps {
  task: PhaseTask
  onComplete: () => void
  onRequestAI: (type: AIAssistanceType) => void
}

export interface CheckpointCardProps {
  checkpoint: LearningCheckpoint
}

export interface AIAssistanceModalProps {
  type: AIAssistanceType
  context: string
  onClose: () => void
  onRate: (logId: string, wasHelpful: boolean) => void
}

export type {
  Contribution,
  ContributionStatus,
  LearningPhase,
  PhaseTask,
  LearningCheckpoint,
  PhaseType,
  AIAssistanceType,
}
