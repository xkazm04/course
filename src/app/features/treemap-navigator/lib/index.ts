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
export { fetchRootNodes, fetchChildren, isChildrenCached, isRootCached } from "./dataAdapter";

// Node cache for instant back-navigation
export { nodeCache, ROOT_CACHE_KEY } from "./nodeCache";

// Prefetch hook for hover optimization
export { usePrefetch } from "./usePrefetch";

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
