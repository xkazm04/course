/**
 * Reusable animation variants for Framer Motion
 * Import and spread these instead of inline definitions
 */

import { DURATION, SPRING_SNAPPY, SPRING_BOUNCY } from './easings'

// Fade animations
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: DURATION.fast },
}

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: DURATION.normal },
}

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: DURATION.normal },
}

// Scale animations
export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: DURATION.normal },
}

export const popIn = {
  initial: { opacity: 0, scale: 0 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0 },
  transition: SPRING_BOUNCY,
}

// Slide animations
export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: DURATION.normal },
}

export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: DURATION.normal },
}

// Micro-interaction variants
export const buttonPress = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: SPRING_SNAPPY,
}

export const cardHover = {
  whileHover: { y: -4, scale: 1.01 },
  transition: SPRING_SNAPPY,
}

export const pulseGlow = {
  animate: {
    boxShadow: [
      '0 0 0 0 rgba(99, 102, 241, 0.4)',
      '0 0 0 10px rgba(99, 102, 241, 0)',
    ],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut',
  },
}

// Celebration variants
export const celebrationPop = {
  initial: { scale: 0, rotate: -10 },
  animate: { scale: 1, rotate: 0 },
  exit: { scale: 0, rotate: 10 },
  transition: { ...SPRING_BOUNCY, duration: 0.6 },
}

export const floatingAnimation = {
  animate: {
    y: [0, -10, 0],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
}

// Stagger container for lists
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
}

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
}
