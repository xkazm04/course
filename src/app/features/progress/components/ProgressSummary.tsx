'use client'

/**
 * ProgressSummary - Visual Storyteller Component
 *
 * Dashboard-style overview of overall learning progress.
 * Provides a quick glance at key metrics and trends.
 */

import { motion } from 'framer-motion'
import {
  BookOpen, Clock, Trophy, TrendingUp, Target, Zap,
  ArrowUp, ArrowDown, Minus
} from 'lucide-react'
import { cn } from '@/app/shared/lib/utils'
import { useReducedMotion, SPRING_SNAPPY } from '@/app/shared/lib/animations'

interface ProgressStats {
  coursesCompleted: number
  coursesInProgress: number
  totalHoursLearned: number
  currentStreak: number
  skillsGained: number
  certificatesEarned: number
  weeklyChange?: {
    hours: number
    direction: 'up' | 'down' | 'stable'
  }
}

interface ProgressSummaryProps {
  stats: ProgressStats
  className?: string
}

export function ProgressSummary({ stats, className }: ProgressSummaryProps) {
  const shouldReduceMotion = useReducedMotion()

  const metrics = [
    {
      label: 'Courses Completed',
      value: stats.coursesCompleted,
      icon: Trophy,
      color: 'amber',
      suffix: '',
    },
    {
      label: 'In Progress',
      value: stats.coursesInProgress,
      icon: BookOpen,
      color: 'indigo',
      suffix: '',
    },
    {
      label: 'Hours Learned',
      value: stats.totalHoursLearned,
      icon: Clock,
      color: 'purple',
      suffix: 'h',
    },
    {
      label: 'Day Streak',
      value: stats.currentStreak,
      icon: Zap,
      color: 'orange',
      suffix: '',
    },
    {
      label: 'Skills Gained',
      value: stats.skillsGained,
      icon: Target,
      color: 'emerald',
      suffix: '',
    },
    {
      label: 'Certificates',
      value: stats.certificatesEarned,
      icon: Trophy,
      color: 'pink',
      suffix: '',
    },
  ]

  return (
    <div className={cn('space-y-4', className)} data-testid="progress-summary">
      {/* Header with trend */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-[var(--forge-text-primary)]">
          Your Progress
        </h3>
        {stats.weeklyChange && (
          <WeeklyTrend change={stats.weeklyChange} />
        )}
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {metrics.map((metric, index) => (
          <MetricCard
            key={metric.label}
            metric={metric}
            index={index}
            shouldReduceMotion={shouldReduceMotion}
          />
        ))}
      </div>
    </div>
  )
}

interface MetricCardProps {
  metric: {
    label: string
    value: number
    icon: React.ComponentType<{ className?: string }>
    color: string
    suffix: string
  }
  index: number
  shouldReduceMotion: boolean
}

function MetricCard({ metric, index, shouldReduceMotion }: MetricCardProps) {
  const colorStyles: Record<string, { bg: string; icon: string; text: string }> = {
    amber: {
      bg: 'bg-[var(--forge-bg-elevated)] border-[var(--forge-border-subtle)]',
      icon: 'text-[var(--forge-warning)]',
      text: 'text-[var(--forge-warning)]',
    },
    indigo: {
      bg: 'bg-[var(--forge-bg-elevated)] border-[var(--forge-border-subtle)]',
      icon: 'text-[var(--ember)]',
      text: 'text-[var(--ember)]',
    },
    purple: {
      bg: 'bg-[var(--forge-bg-elevated)] border-[var(--forge-border-subtle)]',
      icon: 'text-[var(--ember)]',
      text: 'text-[var(--ember)]',
    },
    orange: {
      bg: 'bg-[var(--forge-bg-elevated)] border-[var(--forge-border-subtle)]',
      icon: 'text-[var(--forge-warning)]',
      text: 'text-[var(--forge-warning)]',
    },
    emerald: {
      bg: 'bg-[var(--forge-bg-elevated)] border-[var(--forge-border-subtle)]',
      icon: 'text-[var(--forge-success)]',
      text: 'text-[var(--forge-success)]',
    },
    pink: {
      bg: 'bg-[var(--forge-bg-elevated)] border-[var(--forge-border-subtle)]',
      icon: 'text-[var(--ember)]',
      text: 'text-[var(--ember)]',
    },
  }

  const colors = colorStyles[metric.color] || colorStyles.indigo
  const Icon = metric.icon

  return (
    <motion.div
      className={cn(
        'p-4 rounded-xl border',
        colors.bg
      )}
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={shouldReduceMotion ? {} : { y: -2 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('w-4 h-4', colors.icon)} />
        <span className="text-xs font-medium text-[var(--forge-text-muted)]">
          {metric.label}
        </span>
      </div>
      <motion.div
        className={cn('text-2xl font-bold', colors.text)}
        initial={shouldReduceMotion ? {} : { scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ delay: index * 0.05 + 0.1, type: 'spring', bounce: 0.4 }}
      >
        {metric.value}{metric.suffix}
      </motion.div>
    </motion.div>
  )
}

function WeeklyTrend({ change }: { change: { hours: number; direction: 'up' | 'down' | 'stable' } }) {
  const config = {
    up: {
      icon: ArrowUp,
      color: 'text-[var(--forge-success)] bg-[var(--forge-bg-elevated)]',
      label: 'more',
    },
    down: {
      icon: ArrowDown,
      color: 'text-[var(--forge-error)] bg-[var(--forge-bg-elevated)]',
      label: 'less',
    },
    stable: {
      icon: Minus,
      color: 'text-[var(--forge-text-muted)] bg-[var(--forge-bg-elevated)]',
      label: 'same as',
    },
  }

  const { icon: Icon, color, label } = config[change.direction]

  return (
    <motion.div
      className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', color)}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={SPRING_SNAPPY}
    >
      <Icon className="w-3 h-3" />
      <span>
        {change.hours}h {label} last week
      </span>
    </motion.div>
  )
}

/**
 * Mini progress summary for compact displays
 */
interface MiniProgressProps {
  hoursThisWeek: number
  goalHours: number
  className?: string
}

export function MiniProgress({ hoursThisWeek, goalHours, className }: MiniProgressProps) {
  const progress = Math.min((hoursThisWeek / goalHours) * 100, 100)
  const isComplete = hoursThisWeek >= goalHours

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex-1">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-[var(--forge-text-muted)]">Weekly Goal</span>
          <span className={cn(
            'font-bold',
            isComplete ? 'text-[var(--forge-success)]' : 'text-[var(--forge-text-secondary)]'
          )}>
            {hoursThisWeek}h / {goalHours}h
          </span>
        </div>
        <div className="h-2 bg-[var(--forge-bg-anvil)] rounded-full overflow-hidden">
          <motion.div
            className={cn(
              'h-full rounded-full',
              isComplete
                ? 'bg-[var(--forge-success)]'
                : 'bg-[var(--ember)]'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>
      {isComplete && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.6 }}
        >
          <Trophy className="w-5 h-5 text-[var(--forge-warning)]" />
        </motion.div>
      )}
    </div>
  )
}
