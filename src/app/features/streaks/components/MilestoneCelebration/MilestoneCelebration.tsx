'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/app/shared/lib/animations'
import { Confetti } from '../Confetti'
import { CelebrationModal } from './CelebrationModal'
import { MILESTONE_CONFIGS, CONFETTI_CONFIG } from './MilestoneCelebration.config'
import type { MilestoneCelebrationProps } from './MilestoneCelebration.types'

export function MilestoneCelebration({
  milestone,
  onClose,
  className,
}: MilestoneCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  const config = milestone ? MILESTONE_CONFIGS[milestone] : null

  // Trigger confetti when milestone changes
  useEffect(() => {
    if (milestone && !shouldReduceMotion) {
      setShowConfetti(true)
      const timeout = setTimeout(
        () => setShowConfetti(false),
        CONFETTI_CONFIG.duration
      )
      return () => clearTimeout(timeout)
    }
  }, [milestone, shouldReduceMotion])

  return (
    <>
      {!shouldReduceMotion && (
        <Confetti
          isActive={showConfetti}
          pieceCount={CONFETTI_CONFIG.pieceCount}
          duration={CONFETTI_CONFIG.duration}
        />
      )}

      <AnimatePresence>
        {milestone && config && (
          <CelebrationModal
            milestone={milestone}
            config={config}
            onClose={onClose}
            className={className}
          />
        )}
      </AnimatePresence>
    </>
  )
}
