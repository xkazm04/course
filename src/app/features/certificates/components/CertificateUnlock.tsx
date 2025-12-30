'use client'

/**
 * CertificateUnlock - Whimsy Injector Component
 *
 * Dramatic unlock animation when earning a certificate.
 * Creates a memorable, shareable achievement moment.
 */

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Award, Star, Sparkles, X, Share2, Download } from 'lucide-react'
import { cn } from '@/app/shared/lib/utils'
import { useReducedMotion, SPRING_SNAPPY } from '@/app/shared/lib/animations'

interface CertificateUnlockProps {
  isOpen: boolean
  onClose: () => void
  certificateName: string
  courseName: string
  onShare?: () => void
  onDownload?: () => void
}

export function CertificateUnlock({
  isOpen,
  onClose,
  certificateName,
  courseName,
  onShare,
  onDownload,
}: CertificateUnlockProps) {
  const shouldReduceMotion = useReducedMotion()
  const [stage, setStage] = useState<'envelope' | 'reveal' | 'complete'>('envelope')
  const [confetti, setConfetti] = useState<number[]>([])

  useEffect(() => {
    if (isOpen) {
      setStage('envelope')
      // Progress through stages
      const timer1 = setTimeout(() => setStage('reveal'), 1500)
      const timer2 = setTimeout(() => {
        setStage('complete')
        if (!shouldReduceMotion) {
          setConfetti(Array.from({ length: 30 }, (_, i) => i))
        }
      }, 2500)
      const timer3 = setTimeout(() => setConfetti([]), 5000)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
      }
    }
  }, [isOpen, shouldReduceMotion])

  const handleClose = useCallback(() => {
    setStage('envelope')
    onClose()
  }, [onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={handleClose}
          data-testid="certificate-unlock-modal"
        >
          {/* Confetti */}
          {confetti.map((i) => (
            <motion.div
              key={i}
              initial={{
                x: '50vw',
                y: '50vh',
                scale: 0,
                rotate: 0,
              }}
              animate={{
                x: `${Math.random() * 100}vw`,
                y: `${Math.random() * 100}vh`,
                scale: [0, 1, 1, 0],
                rotate: Math.random() * 720,
              }}
              transition={{ duration: 3, delay: i * 0.05 }}
              className="fixed pointer-events-none"
              style={{
                zIndex: 60,
              }}
            >
              {i % 4 === 0 ? (
                <Star className="w-4 h-4 text-[var(--gold)] fill-[var(--gold)]" />
              ) : i % 4 === 1 ? (
                <Sparkles className="w-3 h-3 text-[var(--ember-glow)]" />
              ) : i % 4 === 2 ? (
                <div className="w-2 h-4 rounded-sm bg-gradient-forge" />
              ) : (
                <div className="w-3 h-3 rounded-full bg-gradient-forge" />
              )}
            </motion.div>
          ))}

          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg"
          >
            {/* Close button */}
            {stage === 'complete' && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleClose}
                className="absolute -top-12 right-0 p-2 rounded-full text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-workshop)]/10 transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </motion.button>
            )}

            {/* Envelope stage */}
            <AnimatePresence mode="wait">
              {stage === 'envelope' && (
                <EnvelopeAnimation key="envelope" />
              )}

              {stage === 'reveal' && (
                <RevealAnimation key="reveal" />
              )}

              {stage === 'complete' && (
                <CompleteCard
                  key="complete"
                  certificateName={certificateName}
                  courseName={courseName}
                  onShare={onShare}
                  onDownload={onDownload}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function EnvelopeAnimation() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 1.2, opacity: 0 }}
      className="flex flex-col items-center"
    >
      <motion.div
        className="w-32 h-24 bg-gradient-to-br from-[var(--gold)]/50 to-[var(--gold)]/70 rounded-lg shadow-xl relative"
        animate={shouldReduceMotion ? {} : { y: [0, -10, 0] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        {/* Envelope flap */}
        <motion.div
          className="absolute -top-8 left-0 right-0 h-12 bg-gradient-to-br from-[var(--gold)]/70 to-[var(--gold)]"
          style={{
            clipPath: 'polygon(0 100%, 50% 0, 100% 100%)',
          }}
          animate={{ rotateX: [0, 30, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {/* Seal */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-[var(--forge-error)] to-[var(--forge-error)]/80 flex items-center justify-center shadow-lg">
          <Award className="w-4 h-4 text-[var(--gold)]" />
        </div>
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-6 text-[var(--forge-text-secondary)] text-lg font-medium"
      >
        Opening your certificate...
      </motion.p>
    </motion.div>
  )
}

function RevealAnimation() {
  return (
    <motion.div
      initial={{ scale: 0, rotateY: -180 }}
      animate={{ scale: 1, rotateY: 0 }}
      exit={{ scale: 1.5, opacity: 0 }}
      transition={{ type: 'spring', bounce: 0.4 }}
      className="flex flex-col items-center"
    >
      <motion.div
        className="w-48 h-48 rounded-full bg-gradient-to-br from-[var(--gold)] via-[var(--forge-warning)] to-[var(--ember)] flex items-center justify-center shadow-2xl shadow-[var(--gold)]/50"
        animate={{
          boxShadow: [
            '0 25px 50px -12px rgba(251, 191, 36, 0.5)',
            '0 25px 80px -12px rgba(251, 191, 36, 0.8)',
            '0 25px 50px -12px rgba(251, 191, 36, 0.5)',
          ],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Award className="w-24 h-24 text-[var(--forge-text-primary)]" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-3xl font-bold text-[var(--forge-text-primary)]"
      >
        Congratulations!
      </motion.p>
    </motion.div>
  )
}

interface CompleteCardProps {
  certificateName: string
  courseName: string
  onShare?: () => void
  onDownload?: () => void
}

function CompleteCard({ certificateName, courseName, onShare, onDownload }: CompleteCardProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 50 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={SPRING_SNAPPY}
      className="bg-[var(--forge-bg-elevated)] rounded-3xl p-8 shadow-2xl"
    >
      {/* Certificate badge */}
      <div className="flex justify-center mb-6">
        <motion.div
          className="relative w-24 h-24 rounded-full bg-gradient-forge flex items-center justify-center shadow-lg shadow-[var(--ember)]/30"
          animate={shouldReduceMotion ? {} : { rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Award className="w-12 h-12 text-[var(--forge-text-primary)]" />
          <motion.div
            className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-[var(--forge-success)] flex items-center justify-center shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', bounce: 0.6 }}
          >
            <Star className="w-4 h-4 text-white fill-white" />
          </motion.div>
        </motion.div>
      </div>

      {/* Text content */}
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-bold text-[var(--forge-text-primary)]">
          Certificate Earned!
        </h2>
        <p className="text-lg font-semibold text-[var(--ember)]">
          {certificateName}
        </p>
        <p className="text-[var(--forge-text-secondary)]">
          for completing <span className="font-medium">{courseName}</span>
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {onDownload && (
          <motion.button
            onClick={onDownload}
            className={cn(
              'flex-1 py-3 px-4 rounded-xl font-bold text-sm',
              'bg-[var(--forge-bg-anvil)] text-[var(--forge-text-primary)]',
              'hover:bg-[var(--forge-bg-workshop)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forge-border-subtle)]',
              'flex items-center justify-center gap-2'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download className="w-4 h-4" />
            Download
          </motion.button>
        )}
        {onShare && (
          <motion.button
            onClick={onShare}
            className={cn(
              'flex-1 py-3 px-4 rounded-xl font-bold text-sm text-[var(--forge-text-primary)]',
              'bg-gradient-forge',
              'hover:opacity-90',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ember)]',
              'shadow-lg shadow-[var(--ember)]/30',
              'flex items-center justify-center gap-2'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Share2 className="w-4 h-4" />
            Share
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
