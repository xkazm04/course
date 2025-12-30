/**
 * Custom easing functions for micro-interactions
 * Use these instead of inline easing definitions
 */

// Standard easings
export const EASE_OUT = [0.0, 0.0, 0.2, 1] as const
export const EASE_IN = [0.4, 0.0, 1, 1] as const
export const EASE_IN_OUT = [0.4, 0.0, 0.2, 1] as const

// Bounce easings for celebrations
export const EASE_BOUNCE = [0.34, 1.56, 0.64, 1] as const
export const EASE_ELASTIC = [0.68, -0.55, 0.265, 1.55] as const

// Spring configurations for Framer Motion
export const SPRING_SNAPPY = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
}

export const SPRING_BOUNCY = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 20,
  bounce: 0.5,
}

export const SPRING_GENTLE = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 25,
}

// Duration presets (in seconds)
export const DURATION = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  celebration: 0.8,
} as const
