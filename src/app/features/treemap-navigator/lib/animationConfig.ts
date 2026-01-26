/**
 * Animation Configuration
 *
 * Spring configs and variants for treemap transitions.
 * Uses transform/opacity only (no width/height) for 60fps performance.
 *
 * Based on research: stiffness=200, damping=25 gives ~350ms settle time
 */

import type { Variants, Transition } from "framer-motion";

// ============================================================================
// SPRING CONFIGURATIONS
// ============================================================================

export const SPRING_CONFIGS = {
  drillDown: {
    type: "spring" as const,
    stiffness: 200,
    damping: 25,
    mass: 1,
  },
  drillUp: {
    type: "spring" as const,
    stiffness: 180,
    damping: 22,
    mass: 0.9,
  },
} satisfies Record<string, Transition>;

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

/**
 * Drill-down: Content zooms in from smaller scale
 * User is "diving into" the node, so content appears to grow
 */
export const drillDownVariants: Variants = {
  initial: {
    scale: 0.8,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
  },
  exit: {
    scale: 1.2,
    opacity: 0,
  },
};

/**
 * Drill-up: Content zooms out from larger scale
 * User is "backing out", so content appears to shrink away
 */
export const drillUpVariants: Variants = {
  initial: {
    scale: 1.2,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
  },
  exit: {
    scale: 0.8,
    opacity: 0,
  },
};

// ============================================================================
// TRANSITION TYPE
// ============================================================================

export type TransitionDirection = "drillDown" | "drillUp" | null;

/**
 * Get the appropriate variants for a transition direction
 */
export function getTransitionVariants(direction: TransitionDirection): Variants {
  if (direction === "drillDown") return drillDownVariants;
  if (direction === "drillUp") return drillUpVariants;
  // No animation for null (initial render)
  return {
    initial: {},
    animate: {},
    exit: {},
  };
}

/**
 * Get the appropriate spring config for a transition direction
 */
export function getSpringConfig(direction: TransitionDirection): Transition {
  if (direction === "drillDown") return SPRING_CONFIGS.drillDown;
  if (direction === "drillUp") return SPRING_CONFIGS.drillUp;
  return { duration: 0 };
}
