'use client'

/**
 * CertificateShowcase - Visual Storyteller Component
 *
 * 3D card showcase with tilt effect for certificates.
 * Makes certificates feel premium and collectible.
 */

import { useState, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Award, Star, Eye, ExternalLink } from 'lucide-react'
import { cn } from '@/app/shared/lib/utils'
import { useReducedMotion } from '@/app/shared/lib/animations'

interface CertificateShowcaseProps {
  title: string
  courseName: string
  earnedDate: string
  imageUrl?: string
  accentColor?: 'indigo' | 'purple' | 'amber' | 'emerald'
  onView?: () => void
  className?: string
}

export function CertificateShowcase({
  title,
  courseName,
  earnedDate,
  imageUrl,
  accentColor = 'amber',
  onView,
  className,
}: CertificateShowcaseProps) {
  const shouldReduceMotion = useReducedMotion()
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovering, setIsHovering] = useState(false)

  // Mouse tracking for 3D effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), {
    stiffness: 300,
    damping: 30,
  })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), {
    stiffness: 300,
    damping: 30,
  })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (shouldReduceMotion || !cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    mouseX.set((e.clientX - centerX) / rect.width)
    mouseY.set((e.clientY - centerY) / rect.height)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
    setIsHovering(false)
  }

  const gradientColors = {
    indigo: 'bg-gradient-forge',
    purple: 'bg-gradient-forge',
    amber: 'bg-gradient-forge',
    emerald: 'bg-gradient-forge',
  }

  const glowColors = {
    indigo: 'shadow-[var(--ember)]/30',
    purple: 'shadow-[var(--ember)]/30',
    amber: 'shadow-[var(--ember)]/30',
    emerald: 'shadow-[var(--ember)]/30',
  }

  return (
    <motion.div
      ref={cardRef}
      className={cn('relative perspective-1000', className)}
      style={{
        rotateX: shouldReduceMotion ? 0 : rotateX,
        rotateY: shouldReduceMotion ? 0 : rotateY,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
      data-testid="certificate-showcase"
    >
      {/* Card */}
      <motion.div
        className={cn(
          'relative rounded-2xl overflow-hidden',
          'bg-[var(--forge-bg-elevated)]',
          'border border-[var(--forge-border-subtle)]',
          'shadow-xl',
          isHovering && glowColors[accentColor]
        )}
        animate={{
          boxShadow: isHovering
            ? `0 25px 50px -12px var(--ember-glow, rgba(251, 191, 36, 0.4))`
            : '0 10px 40px -10px rgba(0, 0, 0, 0.15)',
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Holographic shine effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-0"
          style={{
            background: `linear-gradient(
              ${shouldReduceMotion ? '135deg' : `${mouseX.get() * 180 + 135}deg`},
              transparent 20%,
              rgba(255, 255, 255, 0.1) 40%,
              rgba(255, 255, 255, 0.3) 50%,
              rgba(255, 255, 255, 0.1) 60%,
              transparent 80%
            )`,
          }}
          animate={{ opacity: isHovering ? 1 : 0 }}
        />

        {/* Certificate preview */}
        <div className="aspect-[4/3] relative bg-[var(--forge-bg-anvil)]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CertificatePlaceholder accentColor={accentColor} />
            </div>
          )}

          {/* Floating badge */}
          <motion.div
            className={cn(
              'absolute top-4 right-4 w-12 h-12 rounded-full',
              'text-[var(--forge-text-primary)]',
              gradientColors[accentColor],
              'flex items-center justify-center shadow-lg'
            )}
            animate={
              shouldReduceMotion
                ? {}
                : {
                    y: [0, -5, 0],
                    rotate: [0, 5, -5, 0],
                  }
            }
            transition={{ duration: 3, repeat: Infinity }}
            style={{ transform: 'translateZ(20px)' }}
          >
            <Award className="w-6 h-6" />
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-5" style={{ transform: 'translateZ(10px)' }}>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="min-w-0">
              <h3 className="font-bold text-lg text-[var(--forge-text-primary)] truncate">
                {title}
              </h3>
              <p className="text-sm text-[var(--forge-text-muted)] truncate">
                {courseName}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {[1, 2, 3].map((i) => (
                <Star
                  key={i}
                  className="w-4 h-4 text-[var(--ember)] fill-[var(--ember)]"
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--forge-text-muted)]">
              Earned {earnedDate}
            </span>
            {onView && (
              <motion.button
                onClick={onView}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
                  'text-sm font-medium',
                  'bg-[var(--forge-bg-anvil)]',
                  'text-[var(--forge-text-primary)]',
                  'hover:bg-[var(--forge-bg-workshop)]',
                  'transition-colors'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Eye className="w-3.5 h-3.5" />
                View
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function CertificatePlaceholder({ accentColor }: { accentColor: string }) {
  return (
    <div className={cn(
      'w-4/5 h-4/5 rounded-xl bg-[var(--forge-bg-elevated)]',
      'border-2 border-dashed border-[var(--forge-border-subtle)]',
      'flex flex-col items-center justify-center gap-3'
    )}>
      <div className="w-16 h-1 rounded-full bg-[var(--forge-border-subtle)]" />
      <div className="w-24 h-1 rounded-full bg-[var(--forge-border-subtle)]" />
      <Award className="w-8 h-8 text-[var(--forge-text-muted)]" />
      <div className="w-20 h-1 rounded-full bg-[var(--forge-border-subtle)]" />
    </div>
  )
}

/**
 * Grid layout for multiple certificates
 */
interface CertificateGridProps {
  children: React.ReactNode
  className?: string
}

export function CertificateGrid({ children, className }: CertificateGridProps) {
  return (
    <div className={cn(
      'grid gap-6',
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      className
    )}>
      {children}
    </div>
  )
}
