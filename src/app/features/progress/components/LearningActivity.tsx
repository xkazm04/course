'use client'

/**
 * LearningActivity - Visual Storyteller Component
 *
 * GitHub-style contribution graph showing learning activity.
 * Tells the story of consistent learning over time.
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Calendar, TrendingUp, Clock, Flame } from 'lucide-react'
import { cn } from '@/app/shared/lib/utils'
import { useReducedMotion } from '@/app/shared/lib/animations'

interface DayActivity {
  date: Date
  minutes: number
  completed: boolean
}

interface LearningActivityProps {
  days: DayActivity[]
  className?: string
}

export function LearningActivity({ days, className }: LearningActivityProps) {
  const shouldReduceMotion = useReducedMotion()

  const { weeks, maxMinutes, stats } = useMemo(() => {
    const sortedDays = [...days].sort((a, b) => a.date.getTime() - b.date.getTime())
    const max = Math.max(...days.map((d) => d.minutes), 1)

    // Group into weeks
    const grouped: DayActivity[][] = []
    let currentWeek: DayActivity[] = []

    sortedDays.forEach((day, index) => {
      currentWeek.push(day)
      if (currentWeek.length === 7 || index === sortedDays.length - 1) {
        grouped.push(currentWeek)
        currentWeek = []
      }
    })

    // Calculate stats
    const totalMinutes = days.reduce((sum, d) => sum + d.minutes, 0)
    const activeDays = days.filter((d) => d.minutes > 0).length
    const currentStreak = calculateStreak(days)

    return {
      weeks: grouped,
      maxMinutes: max,
      stats: {
        totalMinutes,
        activeDays,
        currentStreak,
        averagePerDay: activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0,
      },
    }
  }, [days])

  return (
    <div className={cn('space-y-4', className)} data-testid="learning-activity">
      {/* Stats row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[var(--forge-success)]" />
          <span className="text-sm font-semibold text-[var(--forge-text-secondary)]">
            Learning Activity
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1 text-[var(--forge-text-muted)]">
            <Flame className="w-3 h-3 text-[var(--forge-warning)]" />
            {stats.currentStreak} day streak
          </span>
          <span className="flex items-center gap-1 text-[var(--forge-text-muted)]">
            <Clock className="w-3 h-3 text-[var(--ember)]" />
            {formatMinutes(stats.totalMinutes)} total
          </span>
        </div>
      </div>

      {/* Activity grid */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-1 min-w-max">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <ActivityCell
                  key={day.date.toISOString()}
                  day={day}
                  maxMinutes={maxMinutes}
                  index={weekIndex * 7 + dayIndex}
                  shouldReduceMotion={shouldReduceMotion}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--forge-text-muted)]">Less</span>
        <div className="flex gap-1">
          {[0, 0.25, 0.5, 0.75, 1].map((level) => (
            <div
              key={level}
              className={cn(
                'w-3 h-3 rounded-sm',
                getActivityColor(level)
              )}
            />
          ))}
        </div>
        <span className="text-xs text-[var(--forge-text-muted)]">More</span>
      </div>
    </div>
  )
}

interface ActivityCellProps {
  day: DayActivity
  maxMinutes: number
  index: number
  shouldReduceMotion: boolean
}

function ActivityCell({ day, maxMinutes, index, shouldReduceMotion }: ActivityCellProps) {
  const intensity = day.minutes / maxMinutes

  return (
    <motion.div
      className={cn(
        'w-3 h-3 rounded-sm cursor-pointer transition-all',
        getActivityColor(intensity),
        'hover:ring-2 hover:ring-[var(--forge-border-subtle)] hover:ring-offset-1'
      )}
      initial={shouldReduceMotion ? {} : { scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: index * 0.01 }}
      title={`${day.date.toLocaleDateString()}: ${day.minutes} minutes`}
    />
  )
}

function getActivityColor(intensity: number): string {
  if (intensity === 0) return 'bg-[var(--forge-bg-anvil)]'
  if (intensity < 0.25) return 'bg-[var(--forge-success)]/30'
  if (intensity < 0.5) return 'bg-[var(--forge-success)]/50'
  if (intensity < 0.75) return 'bg-[var(--forge-success)]/70'
  return 'bg-[var(--forge-success)]'
}

function calculateStreak(days: DayActivity[]): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = 0
  const sortedDays = [...days]
    .filter((d) => d.minutes > 0)
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  for (const day of sortedDays) {
    const dayDate = new Date(day.date)
    dayDate.setHours(0, 0, 0, 0)

    const expectedDate = new Date(today)
    expectedDate.setDate(today.getDate() - streak)

    if (dayDate.getTime() === expectedDate.getTime()) {
      streak++
    } else if (streak > 0) {
      break
    }
  }

  return streak
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

/**
 * Compact activity indicator
 */
interface ActivityIndicatorProps {
  daysActive: number
  totalDays: number
  className?: string
}

export function ActivityIndicator({ daysActive, totalDays, className }: ActivityIndicatorProps) {
  const percentage = Math.round((daysActive / totalDays) * 100)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex gap-0.5">
        {Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            className={cn(
              'w-1.5 h-4 rounded-sm',
              i < Math.round((daysActive / totalDays) * 7)
                ? 'bg-[var(--forge-success)]'
                : 'bg-[var(--forge-bg-anvil)]'
            )}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-[var(--forge-text-secondary)]">
        {percentage}% active
      </span>
    </div>
  )
}
