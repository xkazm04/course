import type { StateStyle, EntanglementState } from './types'

export const STATE_STYLES: Record<EntanglementState, StateStyle> = {
  mastered: {
    bg: 'bg-[var(--ember-glow)]/20',
    border: 'border-[var(--ember-glow)]/50',
    text: 'text-[var(--ember-glow)]',
    icon: 'text-[var(--ember-glow)]',
    label: 'Mastered',
    emoji: '🚀',
  },
  stable: {
    bg: 'bg-[var(--forge-success)]/20',
    border: 'border-[var(--forge-success)]/50',
    text: 'text-[var(--forge-success)]',
    icon: 'text-[var(--forge-success)]',
    label: 'Stable',
    emoji: '✅',
  },
  unstable: {
    bg: 'bg-[var(--forge-warning)]/20',
    border: 'border-[var(--forge-warning)]/50',
    text: 'text-[var(--forge-warning)]',
    icon: 'text-[var(--forge-warning)]',
    label: 'Unstable',
    emoji: '⚠️',
  },
  struggling: {
    bg: 'bg-[var(--ember)]/20',
    border: 'border-[var(--ember)]/50',
    text: 'text-[var(--ember)]',
    icon: 'text-[var(--ember)]',
    label: 'Struggling',
    emoji: '🔧',
  },
  collapsed: {
    bg: 'bg-[var(--forge-error)]/20',
    border: 'border-[var(--forge-error)]/50',
    text: 'text-[var(--forge-error)]',
    icon: 'text-[var(--forge-error)]',
    label: 'Needs Review',
    emoji: '🔴',
  },
  unknown: {
    bg: 'bg-[var(--forge-bg-elevated)]/20',
    border: 'border-[var(--forge-border-subtle)]',
    text: 'text-[var(--forge-text-muted)]',
    icon: 'text-[var(--forge-text-muted)]',
    label: 'Not Started',
    emoji: '⭕',
  },
}

export const SCORE_THRESHOLDS = {
  good: 70,
  warning: 40,
} as const

export const getScoreColor = (score: number) => {
  if (score >= SCORE_THRESHOLDS.good) return 'success'
  if (score >= SCORE_THRESHOLDS.warning) return 'warning'
  return 'error'
}

export const getScoreClasses = (score: number) => {
  const color = getScoreColor(score)
  const colorMap = {
    success: {
      badge: 'bg-[var(--forge-success)]/20 text-[var(--forge-success)]',
      bar: 'bg-gradient-to-r from-[var(--forge-success)] to-[var(--forge-success)]',
    },
    warning: {
      badge: 'bg-[var(--forge-warning)]/20 text-[var(--forge-warning)]',
      bar: 'bg-gradient-to-r from-[var(--forge-warning)] to-[var(--ember)]',
    },
    error: {
      badge: 'bg-[var(--forge-error)]/20 text-[var(--forge-error)]',
      bar: 'bg-gradient-to-r from-[var(--forge-error)] to-[var(--ember)]',
    },
  }
  return colorMap[color]
}

export const getProgressBarColor = (state: EntanglementState) => {
  const colors: Record<EntanglementState, string> = {
    mastered: 'bg-[var(--ember-glow)]',
    stable: 'bg-[var(--forge-success)]',
    unstable: 'bg-[var(--forge-warning)]',
    struggling: 'bg-[var(--ember)]',
    collapsed: 'bg-[var(--forge-error)]',
    unknown: 'bg-[var(--forge-text-muted)]',
  }
  return colors[state]
}
