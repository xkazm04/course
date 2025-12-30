'use client'

/**
 * MotivationalMessage - Whimsy Injector Component
 *
 * Provides contextual encouragement based on streak status.
 * Adds personality and emotional connection to the experience.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Target, Zap, Heart, Trophy, Star } from 'lucide-react'
import { cn } from '@/app/shared/lib/utils'
import { useReducedMotion } from '@/app/shared/lib/animations'

interface MotivationalMessageProps {
  currentStreak: number
  isGoalMet: boolean
  progress: number // 0-100
  className?: string
}

interface MessageConfig {
  icon: React.ReactNode
  message: string
  subtext?: string
  color: string
}

export function MotivationalMessage({
  currentStreak,
  isGoalMet,
  progress,
  className,
}: MotivationalMessageProps) {
  const shouldReduceMotion = useReducedMotion()
  const config = getMessageConfig(currentStreak, isGoalMet, progress)

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl',
        'bg-gradient-to-r',
        config.color,
        className
      )}
      data-testid="motivational-message"
    >
      <motion.div
        animate={shouldReduceMotion ? {} : { rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="flex-shrink-0 mt-0.5"
      >
        {config.icon}
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[var(--forge-text-primary)]">
          {config.message}
        </p>
        {config.subtext && (
          <p className="text-sm text-[var(--forge-text-secondary)] mt-0.5">
            {config.subtext}
          </p>
        )}
      </div>
    </motion.div>
  )
}

function getMessageConfig(streak: number, isGoalMet: boolean, progress: number): MessageConfig {
  // Goal completed - Celebration
  if (isGoalMet) {
    if (streak >= 30) {
      return {
        icon: <Trophy className="w-5 h-5 text-[var(--forge-warning)]" />,
        message: "Legendary dedication! 🏆",
        subtext: `${streak} days of pure mastery`,
        color: 'from-[var(--forge-warning)]/10 to-[var(--forge-warning)]/5',
      }
    }
    if (streak >= 7) {
      return {
        icon: <Star className="w-5 h-5 text-[var(--forge-accent)]" />,
        message: "You're on fire! ⭐",
        subtext: `${streak} day streak and counting`,
        color: 'from-[var(--forge-accent)]/10 to-[var(--forge-accent)]/5',
      }
    }
    return {
      icon: <Sparkles className="w-5 h-5 text-[var(--forge-success)]" />,
      message: "Goal crushed! 🎉",
      subtext: "Come back tomorrow to keep your streak alive",
      color: 'from-[var(--forge-success)]/10 to-[var(--forge-success)]/5',
    }
  }

  // In progress - Encouragement
  if (progress >= 75) {
    return {
      icon: <Zap className="w-5 h-5 text-[var(--forge-warning)]" />,
      message: "Almost there! ⚡",
      subtext: "Just a little more to hit your goal",
      color: 'from-[var(--forge-warning)]/10 to-[var(--ember)]/10',
    }
  }

  if (progress >= 50) {
    return {
      icon: <Target className="w-5 h-5 text-[var(--forge-info)]" />,
      message: "Halfway there! 🎯",
      subtext: "You're making great progress",
      color: 'from-[var(--forge-info)]/10 to-[var(--forge-accent)]/10',
    }
  }

  if (progress > 0) {
    return {
      icon: <Heart className="w-5 h-5 text-[var(--forge-error)]" />,
      message: "Great start! 💪",
      subtext: "Every minute counts",
      color: 'from-[var(--forge-error)]/10 to-[var(--forge-error)]/5',
    }
  }

  // Not started
  if (streak > 0) {
    return {
      icon: <Sparkles className="w-5 h-5 text-[var(--ember)]" />,
      message: `Protect your ${streak}-day streak!`,
      subtext: "Start learning to keep it going",
      color: 'from-[var(--ember)]/10 to-[var(--forge-warning)]/10',
    }
  }

  return {
    icon: <Sparkles className="w-5 h-5 text-[var(--forge-accent)]" />,
    message: "Ready to start?",
    subtext: "Begin your learning streak today",
    color: 'from-[var(--forge-accent)]/10 to-[var(--forge-accent)]/5',
  }
}
