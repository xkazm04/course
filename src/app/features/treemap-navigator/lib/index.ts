/**
 * Treemap Navigator Library
 *
 * Export all types, hooks, and utilities for the treemap navigator feature.
 */

// Types
export * from "./types";

// Navigation state store
export { useNavigationStore } from "./navigationStore";

// Layout engine
export { computeLayout, canShowLabel, calculateFontSize } from "./layoutEngine";

// Data adapter for API integration
export { fetchRootNodes, fetchChildren } from "./dataAdapter";

// Animation configuration
export {
  SPRING_CONFIGS,
  drillDownVariants,
  drillUpVariants,
  getTransitionVariants,
  getSpringConfig,
} from "./animationConfig";
export type { TransitionDirection } from "./animationConfig";

// Focus management
export { useFocusOnNavigate } from "./useFocusOnNavigate";
