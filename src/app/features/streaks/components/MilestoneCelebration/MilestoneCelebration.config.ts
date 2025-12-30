import type { MilestoneConfig } from './MilestoneCelebration.types'

export const MILESTONE_CONFIGS: Record<number, MilestoneConfig> = {
  7: {
    title: 'One Week Wonder!',
    description: "You've maintained a 7-day streak!",
    reward: '+1 Streak Freeze',
    color: 'from-[var(--forge-warning)] to-[var(--ember)]',
  },
  14: {
    title: 'Two Week Champion!',
    description: '14 days of consistent learning!',
    reward: '+1 Streak Freeze',
    color: 'from-[var(--forge-success)] to-[var(--forge-success)]',
  },
  30: {
    title: 'Monthly Master!',
    description: 'A full month of dedication!',
    reward: '+2 Streak Freezes',
    color: 'from-[var(--forge-accent)] to-[var(--forge-error)]',
  },
  60: {
    title: 'Two Month Legend!',
    description: '60 days of unstoppable progress!',
    reward: '+2 Streak Freezes',
    color: 'from-[var(--forge-info)] to-[var(--forge-accent)]',
  },
  100: {
    title: 'Century Champion!',
    description: '100 days of excellence!',
    reward: '+3 Streak Freezes',
    color: 'from-[var(--forge-error)] to-[var(--ember)]',
  },
  365: {
    title: 'Year of Greatness!',
    description: '365 days of mastery!',
    reward: '+5 Streak Freezes',
    color: 'from-[var(--forge-accent)] to-[var(--forge-info)]',
  },
}

export const CONFETTI_CONFIG = {
  pieceCount: 80,
  duration: 4000,
}
