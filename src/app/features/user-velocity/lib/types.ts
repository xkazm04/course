/**
 * User Velocity System Types
 *
 * Motion primitives encode user intent velocity:
 * - High motion = exploration mode (browsing, discovering)
 * - Reduced motion = focused work mode (efficiency-oriented)
 *
 * This system transforms a defensive accessibility feature into an
 * adaptive intelligence layer that serves users better based on behavioral signals.
 */

/**
 * Velocity levels that influence UI behavior.
 *
 * - exploring: High motion, full animations, lower information density, aggressive prefetch
 * - focused: Reduced motion, minimal animations, higher information density, targeted prefetch
 * - balanced: Default state, moderate animations and density
 */
export type VelocityLevel = "exploring" | "balanced" | "focused";

/**
 * Signals that contribute to velocity detection.
 */
export interface VelocitySignals {
    /** User's OS-level reduced motion preference */
    prefersReducedMotion: boolean;
    /** Time since last significant interaction (ms) */
    idleTime: number;
    /** Recent scroll velocity (pixels/second) */
    scrollVelocity: number;
    /** Count of rapid navigation events in last 30 seconds */
    rapidNavigationCount: number;
    /** Mouse movement velocity (pixels/second) */
    mouseVelocity: number;
    /** Whether user is actively typing */
    isTyping: boolean;
}

/**
 * Adaptive settings derived from velocity level.
 */
export interface VelocityAdaptations {
    /** Whether animations should be shown */
    enableAnimations: boolean;
    /** Animation intensity (0-1, 0 = none, 1 = full) */
    animationIntensity: number;
    /** Information density level */
    contentDensity: "compact" | "normal" | "spacious";
    /** Prefetch aggressiveness */
    prefetchLevel: "none" | "minimal" | "moderate" | "aggressive";
    /** Whether to show decorative elements */
    showDecorations: boolean;
    /** Whether to auto-expand detailed sections */
    expandDetails: boolean;
    /** Content ordering strategy */
    contentPriority: "efficiency" | "discovery" | "balanced";
    /** Transition duration multiplier (0-1) */
    transitionMultiplier: number;
}

/**
 * Context value provided by UserVelocityProvider.
 */
export interface UserVelocityContextType {
    /** Current detected velocity level */
    velocity: VelocityLevel;
    /** Raw signals used for detection */
    signals: VelocitySignals;
    /** Computed UI adaptations */
    adaptations: VelocityAdaptations;
    /** Whether the context is initialized */
    isReady: boolean;
    /** Override velocity level (for user preference) */
    setVelocityOverride: (level: VelocityLevel | null) => void;
    /** Current override, if any */
    velocityOverride: VelocityLevel | null;
}

/**
 * Configuration for velocity detection thresholds.
 */
export interface VelocityConfig {
    /** Idle time threshold for focused mode (ms) */
    focusedIdleThreshold: number;
    /** Scroll velocity threshold for exploring mode (px/s) */
    exploringScrollThreshold: number;
    /** Navigation count threshold for exploring mode */
    exploringNavigationThreshold: number;
    /** Mouse velocity threshold for exploring mode (px/s) */
    exploringMouseThreshold: number;
    /** Time window for tracking rapid navigation (ms) */
    navigationTimeWindow: number;
}

/**
 * Default configuration values.
 */
export const DEFAULT_VELOCITY_CONFIG: VelocityConfig = {
    focusedIdleThreshold: 5000, // 5 seconds of inactivity suggests focused work
    exploringScrollThreshold: 500, // Fast scrolling suggests exploration
    exploringNavigationThreshold: 3, // 3+ navigations in 30s suggests exploration
    exploringMouseThreshold: 300, // Fast mouse movement suggests exploration
    navigationTimeWindow: 30000, // 30 second window for navigation tracking
};
