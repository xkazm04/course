'use client'

/**
 * StreakWidgetEnhanced - Premium Streak Experience
 *
 * Combines Visual Storyteller, Whimsy Injector, and UI Design skills
 * for a complete, delightful streak tracking experience.
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, ChevronDown, Sparkles, Snowflake } from 'lucide-react'
import { cn } from '@/app/shared/lib/utils'
import { useReducedMotion, SPRING_SNAPPY } from '@/app/shared/lib/animations'
import { StreakData } from '../lib/streakStorage'
import { DailyProgressRing } from './DailyProgressRing'
import { DailyGoalSelector } from './DailyGoalSelector'
import { WeeklyCalendar } from './WeeklyCalendar'
import { MotivationalMessage } from './MotivationalMessage'
import { QuickAddGrid } from './QuickAddButton'
import { MilestoneCelebration } from './MilestoneCelebration'

interface StreakWidgetEnhancedProps {
  streakData: StreakData
  dailyProgress: number
  isGoalMet: boolean
  onRecordTime: (minutes: number) => number | null
  onGoalChange: (minutes: number) => void
  className?: string
}

const QUICK_ADD_OPTIONS = [5, 10, 15, 30]

export function StreakWidgetEnhanced({
  streakData,
  dailyProgress,
  isGoalMet,
  onRecordTime,
  onGoalChange,
  className,
}: StreakWidgetEnhancedProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [celebratingMilestone, setCelebratingMilestone] = useState<number | null>(null)
  const shouldReduceMotion = useReducedMotion()

  const handleAddTime = (minutes: number) => {
    const milestone = onRecordTime(minutes)
    if (milestone) {
      setCelebratingMilestone(milestone)
    }
  }

  // Generate week data for the calendar
  const weekDays = useMemo(() => generateWeekData(streakData), [streakData])

  return (
    <>
      <motion.div
        layout
        className={cn(
          'relative overflow-hidden rounded-2xl',
          'bg-gradient-to-br from-[var(--forge-bg-elevated)] via-[var(--forge-bg-elevated)] to-[var(--ember)]/5',
          'border border-[var(--forge-border-subtle)]',
          'shadow-xl shadow-[var(--ember)]/5',
          className
        )}
        data-testid="streak-widget-enhanced"
      >
        {/* Ambient glow effect */}
        {isGoalMet && (
          <motion.div
            className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--forge-success)]/20 rounded-full blur-3xl pointer-events-none"
            animate={shouldReduceMotion ? {} : { scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        )}

        {/* Header - Always visible */}
        <CollapsedHeader
          streakData={streakData}
          dailyProgress={dailyProgress}
          isGoalMet={isGoalMet}
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded(!isExpanded)}
        />

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-5 space-y-5 border-t border-[var(--forge-border-subtle)] pt-4">
                {/* Motivational Message */}
                <MotivationalMessage
                  currentStreak={streakData.currentStreak}
                  isGoalMet={isGoalMet}
                  progress={dailyProgress}
                />

                {/* Weekly Calendar */}
                <WeeklyCalendar days={weekDays} />

                {/* Quick Add Buttons */}
                {!isGoalMet && (
                  <QuickAddGrid
                    options={QUICK_ADD_OPTIONS}
                    onAdd={handleAddTime}
                    disabled={isGoalMet}
                  />
                )}

                {/* Streak Freeze Status */}
                <StreakFreezeStatus freezesRemaining={streakData.streakFreezeTokens} />

                {/* Daily Goal Selector */}
                <DailyGoalSelector
                  currentGoal={streakData.dailyGoalMinutes}
                  onGoalChange={onGoalChange}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <MilestoneCelebration
        milestone={celebratingMilestone}
        onClose={() => setCelebratingMilestone(null)}
      />
    </>
  )
}

interface CollapsedHeaderProps {
  streakData: StreakData
  dailyProgress: number
  isGoalMet: boolean
  isExpanded: boolean
  onToggle: () => void
}

function CollapsedHeader({
  streakData,
  dailyProgress,
  isGoalMet,
  isExpanded,
  onToggle,
}: CollapsedHeaderProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full p-4 flex items-center justify-between',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--forge-accent)]',
        'transition-colors hover:bg-[var(--forge-bg-elevated)]/50'
      )}
      data-testid="streak-widget-toggle"
    >
      <div className="flex items-center gap-4">
        <DailyProgressRing
          progress={dailyProgress}
          currentMinutes={streakData.todayMinutes}
          goalMinutes={streakData.dailyGoalMinutes}
          isGoalMet={isGoalMet}
          size="sm"
        />
        <div className="text-left">
          <div className="flex items-center gap-2">
            <motion.div
              animate={shouldReduceMotion ? {} : { scale: [1, 1.15, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Flame className="w-5 h-5 text-[var(--ember)]" />
            </motion.div>
            <span className="font-bold text-[var(--forge-text-primary)]">
              {streakData.currentStreak} day streak
            </span>
            {streakData.currentStreak >= 7 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-sm"
              >
                🔥
              </motion.span>
            )}
          </div>
          <p className="text-sm text-[var(--forge-text-muted)]">
            {isGoalMet ? (
              <span className="text-[var(--forge-success)] font-medium">
                Daily goal completed!
              </span>
            ) : (
              `${streakData.todayMinutes}/${streakData.dailyGoalMinutes} min today`
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isGoalMet && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={SPRING_SNAPPY}
          >
            <Sparkles className="w-5 h-5 text-[var(--forge-warning)]" />
          </motion.div>
        )}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-[var(--forge-text-muted)]"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </div>
    </button>
  )
}

function StreakFreezeStatus({ freezesRemaining }: { freezesRemaining: number }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--forge-info)]/10 border border-[var(--forge-info)]/20">
      <div className="flex items-center gap-2">
        <Snowflake className="w-4 h-4 text-[var(--forge-info)]" />
        <span className="text-sm font-medium text-[var(--forge-text-secondary)]">
          Streak Freezes
        </span>
      </div>
      <div className="flex items-center gap-1">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              'w-2 h-2 rounded-full',
              i < freezesRemaining
                ? 'bg-[var(--forge-info)]'
                : 'bg-[var(--forge-border-subtle)]'
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
          />
        ))}
        <span className="ml-2 text-xs font-medium text-[var(--forge-text-muted)]">
          {freezesRemaining} left
        </span>
      </div>
    </div>
  )
}

// Generate week data based on streak info
function generateWeekData(streakData: StreakData) {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() + mondayOffset + i)
    date.setHours(0, 0, 0, 0)

    const isToday = date.toDateString() === today.toDateString()
    const isFuture = date > today
    const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    // Determine completion status based on streak
    let completed = false
    let frozenUsed = false

    if (isToday) {
      completed = streakData.todayMinutes >= streakData.dailyGoalMinutes
    } else if (!isFuture && daysDiff <= streakData.currentStreak) {
      completed = true
    }

    return {
      date,
      completed,
      frozenUsed,
      isToday,
      isFuture,
      minutes: isToday ? streakData.todayMinutes : completed ? streakData.dailyGoalMinutes : 0,
    }
  })
}
