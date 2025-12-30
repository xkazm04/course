'use client'

import { useEffect, useState, useMemo } from 'react'
import { SPRING_SNAPPY } from './easings'

/**
 * Hook to detect reduced motion preference
 * Always check this before applying animations
 */
export function useReducedMotion(): boolean {
  const [shouldReduce, setShouldReduce] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setShouldReduce(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setShouldReduce(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return shouldReduce
}

/**
 * Hook for button delight interactions
 * Returns empty objects if user prefers reduced motion
 */
export function useButtonDelight() {
  const shouldReduce = useReducedMotion()

  return useMemo(() => ({
    whileHover: shouldReduce ? {} : { scale: 1.02 },
    whileTap: shouldReduce ? {} : { scale: 0.98 },
    transition: SPRING_SNAPPY,
  }), [shouldReduce])
}

/**
 * Hook for card hover effects
 * Returns empty objects if user prefers reduced motion
 */
export function useCardDelight() {
  const shouldReduce = useReducedMotion()

  return useMemo(() => ({
    whileHover: shouldReduce ? {} : { y: -4, scale: 1.01 },
    transition: SPRING_SNAPPY,
  }), [shouldReduce])
}

/**
 * Hook for celebration trigger
 * Automatically dismisses after duration
 */
export function useCelebration(duration = 3000) {
  const [isActive, setIsActive] = useState(false)
  const shouldReduce = useReducedMotion()

  const trigger = () => {
    if (shouldReduce) return // No celebration if reduced motion

    setIsActive(true)
    setTimeout(() => setIsActive(false), duration)
  }

  return { isActive, trigger }
}

/**
 * Hook for staggered list animations
 * Returns delay for each item based on index
 */
export function useStaggerDelay(index: number, baseDelay = 0.1, stagger = 0.05) {
  const shouldReduce = useReducedMotion()

  return useMemo(() => {
    if (shouldReduce) return 0
    return baseDelay + index * stagger
  }, [shouldReduce, index, baseDelay, stagger])
}
