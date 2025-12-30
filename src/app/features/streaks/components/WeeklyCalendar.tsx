'use client'

/**
 * WeeklyCalendar - Visual Storyteller Component
 *
 * Tells the story of the user's week at a glance.
 * Shows streak continuity with visual connection between days.
 */

import { motion } from 'framer-motion'
import { Flame, Snowflake, Check } from 'lucide-react'
import { cn } from '@/app/shared/lib/utils'
import { useReducedMotion } from '@/app/shared/lib/animations'

interface DayStatus {
  date: Date
  completed: boolean
  frozenUsed: boolean
  isToday: boolean
  isFuture: boolean
  minutes?: number
}

interface WeeklyCalendarProps {
  days: DayStatus[]
  className?: string
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function WeeklyCalendar({ days, className }: WeeklyCalendarProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className={cn('space-y-3', className)} data-testid="weekly-calendar">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--forge-text-secondary)]">
          This Week
        </h3>
        <WeekSummary days={days} />
      </div>

      <div className="relative">
        {/* Connection line behind days */}
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-[var(--forge-border-subtle)] -translate-y-1/2 rounded-full" />

        {/* Completed streak line overlay */}
        <StreakLine days={days} shouldReduceMotion={shouldReduceMotion} />

        {/* Day circles */}
        <div className="relative flex justify-between">
          {days.map((day, index) => (
            <DayCircle
              key={day.date.toISOString()}
              day={day}
              label={DAY_LABELS[index]}
              index={index}
              shouldReduceMotion={shouldReduceMotion}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function WeekSummary({ days }: { days: DayStatus[] }) {
  const completedDays = days.filter(d => d.completed && !d.isFuture).length
  const totalPastDays = days.filter(d => !d.isFuture).length

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-medium text-[var(--forge-text-muted)]">
        {completedDays}/{totalPastDays} days
      </span>
      {completedDays === totalPastDays && totalPastDays > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-xs"
        >
          🔥
        </motion.span>
      )}
    </div>
  )
}

function StreakLine({ days, shouldReduceMotion }: { days: DayStatus[]; shouldReduceMotion: boolean }) {
  // Calculate streak line width based on consecutive completed days
  const completedCount = days.filter((d, i) => {
    if (d.isFuture) return false
    // Check if all previous days are also completed
    return days.slice(0, i + 1).every(prev => prev.completed || prev.isFuture)
  }).length

  const widthPercentage = completedCount > 0 ? (completedCount / days.length) * 100 : 0

  if (widthPercentage === 0) return null

  return (
    <motion.div
      className="absolute top-1/2 left-4 h-1 bg-gradient-to-r from-[var(--ember)] to-[var(--forge-warning)] -translate-y-1/2 rounded-full"
      initial={shouldReduceMotion ? { width: `${widthPercentage}%` } : { width: 0 }}
      animate={{ width: `calc(${widthPercentage}% - 32px)` }}
      transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
    />
  )
}

interface DayCircleProps {
  day: DayStatus
  label: string
  index: number
  shouldReduceMotion: boolean
}

function DayCircle({ day, label, index, shouldReduceMotion }: DayCircleProps) {
  const getCircleStyle = () => {
    if (day.isFuture) {
      return 'bg-[var(--forge-bg-elevated)] border-[var(--forge-border-subtle)] text-[var(--forge-text-muted)]'
    }
    if (day.frozenUsed) {
      return 'bg-[var(--forge-info)]/10 border-[var(--forge-info)]/30 text-[var(--forge-info)]'
    }
    if (day.completed) {
      return 'bg-gradient-to-br from-[var(--ember)] to-[var(--forge-warning)] border-[var(--ember)] text-white shadow-lg shadow-[var(--ember)]/30'
    }
    if (day.isToday) {
      return 'bg-[var(--forge-bg-elevated)] border-[var(--ember)] border-2 text-[var(--ember)]'
    }
    return 'bg-[var(--forge-bg-elevated)] border-[var(--forge-border-subtle)] text-[var(--forge-text-muted)]'
  }

  return (
    <motion.div
      className="flex flex-col items-center gap-1"
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <span className="text-[10px] font-medium text-[var(--forge-text-muted)]">
        {label}
      </span>
      <motion.div
        className={cn(
          'relative w-10 h-10 rounded-full border flex items-center justify-center transition-all',
          getCircleStyle()
        )}
        whileHover={!day.isFuture ? { scale: 1.1 } : {}}
        whileTap={!day.isFuture ? { scale: 0.95 } : {}}
      >
        {day.completed && !day.frozenUsed && (
          <motion.div
            initial={shouldReduceMotion ? {} : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5, delay: 0.2 + index * 0.05 }}
          >
            {day.isToday ? (
              <Check className="w-5 h-5" />
            ) : (
              <Flame className="w-5 h-5" />
            )}
          </motion.div>
        )}
        {day.frozenUsed && <Snowflake className="w-5 h-5" />}
        {day.isToday && !day.completed && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-[var(--ember)]"
          />
        )}
      </motion.div>
    </motion.div>
  )
}
