'use client'

/**
 * AchievementTimeline - Visual Storyteller Component
 *
 * Shows the certification journey as a visual timeline.
 * Tells the story of accomplishments over time.
 */

import { motion } from 'framer-motion'
import { Award, Calendar, Star, Trophy, Sparkles, CheckCircle } from 'lucide-react'
import { cn } from '@/app/shared/lib/utils'
import { useReducedMotion } from '@/app/shared/lib/animations'

interface Achievement {
  id: string
  type: 'certificate' | 'milestone' | 'badge'
  title: string
  description: string
  date: string
  icon?: React.ReactNode
}

interface AchievementTimelineProps {
  achievements: Achievement[]
  className?: string
}

export function AchievementTimeline({ achievements, className }: AchievementTimelineProps) {
  const shouldReduceMotion = useReducedMotion()

  if (achievements.length === 0) {
    return <EmptyTimeline />
  }

  return (
    <div className={cn('relative', className)} data-testid="achievement-timeline">
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-forge rounded-full" />

      {/* Achievements */}
      <div className="space-y-6">
        {achievements.map((achievement, index) => (
          <TimelineItem
            key={achievement.id}
            achievement={achievement}
            index={index}
            isLast={index === achievements.length - 1}
            shouldReduceMotion={shouldReduceMotion}
          />
        ))}
      </div>
    </div>
  )
}

interface TimelineItemProps {
  achievement: Achievement
  index: number
  isLast: boolean
  shouldReduceMotion: boolean
}

function TimelineItem({ achievement, index, isLast, shouldReduceMotion }: TimelineItemProps) {
  const typeConfig = {
    certificate: {
      icon: <Award className="w-4 h-4" />,
      color: 'bg-gradient-forge',
      bgColor: 'bg-[var(--ember)]/10',
      borderColor: 'border-[var(--ember)]/30',
    },
    milestone: {
      icon: <Trophy className="w-4 h-4" />,
      color: 'bg-gradient-forge',
      bgColor: 'bg-[var(--ember)]/10',
      borderColor: 'border-[var(--ember)]/30',
    },
    badge: {
      icon: <Star className="w-4 h-4" />,
      color: 'bg-gradient-forge',
      bgColor: 'bg-[var(--forge-success)]/10',
      borderColor: 'border-[var(--forge-success)]/30',
    },
  }

  const config = typeConfig[achievement.type]

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative flex gap-4"
    >
      {/* Icon node */}
      <motion.div
        className={cn(
          'relative z-10 w-12 h-12 rounded-full flex items-center justify-center',
          'text-[var(--forge-text-primary)] shadow-lg',
          config.color
        )}
        whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
        animate={
          shouldReduceMotion
            ? {}
            : isLast
              ? { boxShadow: ['0 0 0 0 rgba(99, 102, 241, 0)', '0 0 0 10px rgba(99, 102, 241, 0.2)', '0 0 0 0 rgba(99, 102, 241, 0)'] }
              : {}
        }
        transition={{ duration: 2, repeat: isLast ? Infinity : 0 }}
      >
        {achievement.icon || config.icon}
      </motion.div>

      {/* Content card */}
      <motion.div
        className={cn(
          'flex-1 rounded-xl border p-4',
          config.bgColor,
          config.borderColor
        )}
        whileHover={shouldReduceMotion ? {} : { y: -2 }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-[var(--forge-text-primary)]">
            {achievement.title}
          </h3>
          <span className="flex items-center gap-1 text-xs text-[var(--forge-text-muted)] flex-shrink-0">
            <Calendar className="w-3 h-3" />
            {achievement.date}
          </span>
        </div>
        <p className="text-sm text-[var(--forge-text-secondary)]">
          {achievement.description}
        </p>
      </motion.div>
    </motion.div>
  )
}

function EmptyTimeline() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <motion.div
        className="w-16 h-16 rounded-full bg-[var(--forge-bg-elevated)] flex items-center justify-center mb-4"
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <Sparkles className="w-8 h-8 text-[var(--forge-text-muted)]" />
      </motion.div>
      <h3 className="font-semibold text-[var(--forge-text-primary)] mb-2">
        Your Journey Begins
      </h3>
      <p className="text-sm text-[var(--forge-text-muted)] max-w-xs">
        Complete courses and earn certificates to see your achievements here.
      </p>
    </div>
  )
}

/**
 * Compact achievement count for summaries
 */
interface AchievementCountProps {
  certificates: number
  badges: number
  milestones: number
  className?: string
}

export function AchievementCount({
  certificates,
  badges,
  milestones,
  className,
}: AchievementCountProps) {
  const items = [
    { count: certificates, label: 'Certificates', icon: Award, color: 'text-[var(--ember)]' },
    { count: badges, label: 'Badges', icon: Star, color: 'text-[var(--forge-success)]' },
    { count: milestones, label: 'Milestones', icon: Trophy, color: 'text-[var(--ember)]' },
  ]

  return (
    <div className={cn('flex items-center gap-6', className)}>
      {items.map((item) => (
        <motion.div
          key={item.label}
          className="flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
        >
          <item.icon className={cn('w-5 h-5', item.color)} />
          <div className="text-left">
            <span className="block text-lg font-bold text-[var(--forge-text-primary)]">
              {item.count}
            </span>
            <span className="block text-xs text-[var(--forge-text-muted)]">
              {item.label}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
