/**
 * User Velocity System
 *
 * Motion primitives encode user intent velocity:
 * - High motion = exploration mode (browsing, discovering)
 * - Reduced motion = focused work mode (efficiency-oriented)
 *
 * This system transforms the reducedMotion accessibility feature from a
 * defensive "suppress animation" flag into an adaptive intelligence layer
 * that serves users better based on behavioral signals.
 *
 * When users slow down (reduced motion, idle, typing), the system:
 * - Increases information density
 * - Expands detailed sections automatically
 * - Reduces decorative elements
 * - Prioritizes efficient navigation paths
 *
 * When users speed up (fast scrolling, rapid navigation), the system:
 * - Enables full animations
 * - Uses spacious layouts
 * - Shows decorative elements
 * - Enables aggressive prefetching
 * - Prioritizes discovery-oriented content ordering
 */

// Types
export type {
    VelocityLevel,
    VelocitySignals,
    VelocityAdaptations,
    UserVelocityContextType,
    VelocityConfig,
} from "./lib/types";
export { DEFAULT_VELOCITY_CONFIG } from "./lib/types";

// Context & Hooks
export {
    UserVelocityProvider,
    useUserVelocity,
    useVelocityAnimation,
    useVelocityContent,
    useVelocityPrefetch,
} from "./lib/UserVelocityContext";

// Components
export { UserVelocityProviderWrapper, VelocityIndicator } from "./components";
