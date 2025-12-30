'use client'

/**
 * QuickAddButton - Whimsy Injector Component
 *
 * Delightful time-adding buttons with micro-interactions.
 * Provides satisfying feedback when adding learning time.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, Sparkles } from 'lucide-react'
import { cn } from '@/app/shared/lib/utils'
import { useReducedMotion, SPRING_SNAPPY } from '@/app/shared/lib/animations'

interface QuickAddButtonProps {
  minutes: number
  onAdd: (minutes: number) => void
  disabled?: boolean
  className?: string
}

export function QuickAddButton({ minutes, onAdd, disabled, className }: QuickAddButtonProps) {
  const [justAdded, setJustAdded] = useState(false)
  const [particles, setParticles] = useState<number[]>([])
  const shouldReduceMotion = useReducedMotion()

  const handleClick = () => {
    if (disabled || justAdded) return

    onAdd(minutes)
    setJustAdded(true)

    // Trigger particles
    if (!shouldReduceMotion) {
      setParticles(Array.from({ length: 6 }, (_, i) => i))
      setTimeout(() => setParticles([]), 600)
    }

    // Reset after animation
    setTimeout(() => setJustAdded(false), 1500)
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || justAdded}
      className={cn(
        'relative py-3 px-4 rounded-xl font-bold text-sm transition-all overflow-hidden',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forge-accent)] focus-visible:ring-offset-2',
        justAdded
          ? 'bg-[var(--forge-success)] text-white shadow-lg shadow-[var(--forge-success)]/30'
          : 'bg-gradient-to-br from-[var(--forge-accent)]/10 to-[var(--forge-accent)]/5 border border-[var(--forge-border-subtle)] text-[var(--forge-accent)] hover:shadow-md hover:shadow-[var(--forge-accent)]/10',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      whileHover={!disabled && !justAdded ? { scale: 1.05, y: -2 } : {}}
      whileTap={!disabled && !justAdded ? { scale: 0.95 } : {}}
      transition={SPRING_SNAPPY}
      data-testid={`quick-add-${minutes}`}
    >
      {/* Success particles */}
      <AnimatePresence>
        {particles.map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, x: 0, y: 0 }}
            animate={{
              scale: [0, 1, 0],
              x: (Math.random() - 0.5) * 60,
              y: -30 - Math.random() * 20,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute left-1/2 top-1/2 pointer-events-none"
          >
            <Sparkles className="w-3 h-3 text-[var(--forge-warning)]" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Button content */}
      <AnimatePresence mode="wait">
        {justAdded ? (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="flex items-center justify-center gap-1"
          >
            <Check className="w-4 h-4" />
            Added!
          </motion.span>
        ) : (
          <motion.span
            key="default"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" />
            {minutes} min
          </motion.span>
        )}
      </AnimatePresence>

      {/* Ripple effect on success */}
      <AnimatePresence>
        {justAdded && !shouldReduceMotion && (
          <motion.div
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-white rounded-xl"
          />
        )}
      </AnimatePresence>
    </motion.button>
  )
}

interface QuickAddGridProps {
  options: number[]
  onAdd: (minutes: number) => void
  disabled?: boolean
  className?: string
}

export function QuickAddGrid({ options, onAdd, disabled, className }: QuickAddGridProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Plus className="w-4 h-4 text-[var(--forge-accent)]" />
        <span className="text-sm font-medium text-[var(--forge-text-secondary)]">
          Add Learning Time
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {options.map((mins) => (
          <QuickAddButton
            key={mins}
            minutes={mins}
            onAdd={onAdd}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )
}
