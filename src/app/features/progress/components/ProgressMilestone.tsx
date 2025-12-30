'use client'

/**
 * ProgressMilestone - Whimsy Injector Component
 *
 * Visual milestone markers with celebration animations.
 * Makes progress feel rewarding at key checkpoints.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Trophy, Target, Rocket, Crown, Sparkles } from 'lucide-react'
import { cn } from '@/app/shared/lib/utils'
import { useReducedMotion, SPRING_SNAPPY } from '@/app/shared/lib/animations'

interface Milestone {
  percent: number
  icon: React.ReactNode
  label: string
  achieved: boolean
}

interface ProgressMilestoneProps {
  progress: number
  onMilestoneReached?: (milestone: number) => void
  className?: string
}

const DEFAULT_MILESTONES: Milestone[] = [
  { percent: 25, icon: <Target className="w-4 h-4" />, label: 'Getting Started', achieved: false },
  { percent: 50, icon: <Rocket className="w-4 h-4" />, label: 'Halfway There', achieved: false },
  { percent: 75, icon: <Star className="w-4 h-4" />, label: 'Almost Done', achieved: false },
  { percent: 100, icon: <Trophy className="w-4 h-4" />, label: 'Complete!', achieved: false },
]

export function ProgressMilestone({
  progress,
  onMilestoneReached,
  className,
}: ProgressMilestoneProps) {
  const shouldReduceMotion = useReducedMotion()
  const [celebratingMilestone, setCelebratingMilestone] = useState<number | null>(null)
  const [achievedMilestones, setAchievedMilestones] = useState<Set<number>>(new Set())

  const milestones = DEFAULT_MILESTONES.map((m) => ({
    ...m,
    achieved: progress >= m.percent,
  }))

  useEffect(() => {
    const newlyAchieved = milestones.find(
      (m) => m.achieved && !achievedMilestones.has(m.percent)
    )

    if (newlyAchieved) {
      setCelebratingMilestone(newlyAchieved.percent)
      setAchievedMilestones((prev) => new Set([...prev, newlyAchieved.percent]))
      onMilestoneReached?.(newlyAchieved.percent)

      const timer = setTimeout(() => setCelebratingMilestone(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [progress, milestones, achievedMilestones, onMilestoneReached])

  return (
    <div className={cn('relative', className)} data-testid="progress-milestone">
      {/* Progress track */}
      <div className="relative h-3 bg-[var(--forge-bg-anvil)] rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-[var(--ember)] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Milestone markers */}
      <div className="relative h-8 mt-1">
        {milestones.map((milestone, index) => (
          <MilestoneMarker
            key={milestone.percent}
            milestone={milestone}
            index={index}
            isCelebrating={celebratingMilestone === milestone.percent}
            shouldReduceMotion={shouldReduceMotion}
          />
        ))}
      </div>

      {/* Celebration overlay */}
      <AnimatePresence>
        {celebratingMilestone && !shouldReduceMotion && (
          <CelebrationParticles percent={celebratingMilestone} />
        )}
      </AnimatePresence>
    </div>
  )
}

interface MilestoneMarkerProps {
  milestone: Milestone
  index: number
  isCelebrating: boolean
  shouldReduceMotion: boolean
}

function MilestoneMarker({
  milestone,
  index,
  isCelebrating,
  shouldReduceMotion,
}: MilestoneMarkerProps) {
  return (
    <motion.div
      className="absolute top-0"
      style={{ left: `${milestone.percent}%`, transform: 'translateX(-50%)' }}
      initial={shouldReduceMotion ? {} : { scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: index * 0.1, type: 'spring', bounce: 0.5 }}
    >
      {/* Connector line */}
      <div
        className={cn(
          'absolute left-1/2 -top-2 w-0.5 h-2 -translate-x-1/2',
          milestone.achieved
            ? 'bg-[var(--ember)]'
            : 'bg-[var(--forge-border-subtle)]'
        )}
      />

      {/* Marker */}
      <motion.div
        className={cn(
          'relative w-8 h-8 rounded-full flex items-center justify-center',
          'shadow-lg transition-all duration-300',
          milestone.achieved
            ? 'bg-[var(--ember)] text-[var(--forge-text-primary)]'
            : 'bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)] border-2 border-[var(--forge-border-subtle)]'
        )}
        animate={
          isCelebrating
            ? {
                scale: [1, 1.3, 1],
                rotate: [0, 10, -10, 0],
              }
            : {}
        }
        transition={{ duration: 0.5 }}
      >
        {milestone.icon}

        {/* Pulse ring for celebrating */}
        {isCelebrating && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-[var(--ember)]"
            animate={{ scale: [1, 2], opacity: [0.8, 0] }}
            transition={{ duration: 1, repeat: 2 }}
          />
        )}
      </motion.div>

      {/* Label */}
      <motion.div
        className={cn(
          'absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap',
          'text-[10px] font-medium',
          milestone.achieved
            ? 'text-[var(--ember)]'
            : 'text-[var(--forge-text-muted)]'
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.1 + 0.2 }}
      >
        {milestone.label}
      </motion.div>
    </motion.div>
  )
}

function CelebrationParticles({ percent }: { percent: number }) {
  return (
    <>
      {Array.from({ length: 12 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{ left: `${percent}%`, top: '50%' }}
          initial={{ scale: 0, x: 0, y: 0 }}
          animate={{
            scale: [0, 1, 0],
            x: (Math.random() - 0.5) * 100,
            y: (Math.random() - 0.5) * 80,
            rotate: Math.random() * 360,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, delay: i * 0.05 }}
        >
          {i % 3 === 0 ? (
            <Star className="w-3 h-3 text-[var(--forge-warning)] fill-[var(--forge-warning)]" />
          ) : i % 3 === 1 ? (
            <Sparkles className="w-2 h-2 text-[var(--ember)]" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)]" />
          )}
        </motion.div>
      ))}
    </>
  )
}

/**
 * Compact milestone badge for inline display
 */
interface MilestoneBadgeProps {
  milestone: number
  className?: string
}

export function MilestoneBadge({ milestone, className }: MilestoneBadgeProps) {
  const icons: Record<number, React.ReactNode> = {
    25: <Target className="w-3 h-3" />,
    50: <Rocket className="w-3 h-3" />,
    75: <Star className="w-3 h-3" />,
    100: <Crown className="w-3 h-3" />,
  }

  return (
    <motion.div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full',
        'bg-[var(--forge-bg-elevated)]',
        'text-[var(--ember)]',
        'text-xs font-bold',
        className
      )}
      whileHover={{ scale: 1.05 }}
      transition={SPRING_SNAPPY}
    >
      {icons[milestone] || <Star className="w-3 h-3" />}
      {milestone}%
    </motion.div>
  )
}
