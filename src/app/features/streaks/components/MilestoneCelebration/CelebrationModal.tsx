'use client'

import { motion } from 'framer-motion'
import { Trophy, Flame, X, Snowflake } from 'lucide-react'
import { cn } from '@/app/shared/lib/utils'
import { celebrationPop, SPRING_BOUNCY } from '@/app/shared/lib/animations'
import { FloatingStars } from './FloatingStars'
import type { CelebrationModalProps } from './MilestoneCelebration.types'

export function CelebrationModal({
  milestone,
  config,
  onClose,
  className,
}: CelebrationModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}
      data-testid="milestone-celebration-overlay"
    >
      <motion.div
        {...celebrationPop}
        className={cn(
          'relative w-full max-w-sm bg-[var(--forge-bg-elevated)] rounded-3xl overflow-hidden shadow-2xl',
          className
        )}
        onClick={(e) => e.stopPropagation()}
        data-testid="milestone-celebration-modal"
      >
        <CloseButton onClick={onClose} />
        <GradientHeader config={config} />
        <ModalContent milestone={milestone} config={config} onClose={onClose} />
      </motion.div>
    </motion.div>
  )
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      data-testid="milestone-close-btn"
    >
      <X className="w-5 h-5 text-white" />
    </button>
  )
}

function GradientHeader({ config }: { config: CelebrationModalProps['config'] }) {
  return (
    <div className={cn('relative pt-10 pb-16 px-6 text-center bg-gradient-to-br', config.color)}>
      <FloatingStars />
      <TrophyIcon />
      <HeaderText title={config.title} description={config.description} />
    </div>
  )
}

function TrophyIcon() {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -30 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 0.2, ...SPRING_BOUNCY }}
      className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-4"
    >
      <Trophy className="w-10 h-10 text-white" />
    </motion.div>
  )
}

function HeaderText({ title, description }: { title: string; description: string }) {
  return (
    <>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-black text-white mb-2"
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-white/90"
      >
        {description}
      </motion.p>
    </>
  )
}

function ModalContent({
  milestone,
  config,
  onClose,
}: {
  milestone: number
  config: CelebrationModalProps['config']
  onClose: () => void
}) {
  return (
    <div className="px-6 py-6 text-center -mt-8">
      <StreakBadge milestone={milestone} />
      <RewardCard reward={config.reward} />
      <ContinueButton color={config.color} onClick={onClose} />
    </div>
  )
}

function StreakBadge({ milestone }: { milestone: number }) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.5, ...SPRING_BOUNCY }}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[var(--ember)] to-[var(--forge-warning)] text-white shadow-lg shadow-[var(--ember)]/30 mb-6"
    >
      <Flame className="w-6 h-6" />
      <span className="text-2xl font-black">{milestone}</span>
      <span className="font-bold">day streak!</span>
    </motion.div>
  )
}

function RewardCard({ reward }: { reward: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="p-4 rounded-xl bg-[var(--forge-info)]/10 border border-[var(--forge-info)]/20 mb-6"
    >
      <div className="flex items-center justify-center gap-2 text-[var(--forge-info)]">
        <Snowflake className="w-5 h-5" />
        <span className="font-bold">{reward}</span>
      </div>
      <p className="text-xs text-[var(--forge-info)] mt-1">
        Reward added to your account
      </p>
    </motion.div>
  )
}

function ContinueButton({ color, onClick }: { color: string; onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r shadow-lg transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forge-accent)] focus-visible:ring-offset-2',
        color
      )}
      data-testid="milestone-continue-btn"
    >
      Keep Going!
    </motion.button>
  )
}
