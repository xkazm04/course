/**
 * Level Transitioner
 *
 * Manages smooth animated transitions between semantic zoom levels.
 * Provides interpolation functions for:
 * - Node positions (cluster expansion/collapse)
 * - Label opacity
 * - Detail visibility
 * - Connection visibility
 *
 * Uses configurable easing functions and supports momentum/inertia.
 */

import type { UniverseNode, ClusterNode } from "./types";
import type { SemanticLevel, ZoomLevelTransition } from "./zoomLevelManager";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Easing function type
 */
export type EasingFunction = (t: number) => number;

/**
 * Transition configuration
 */
export interface TransitionConfig {
    /** Duration of the transition in ms */
    duration: number;
    /** Easing function for the transition */
    easing: EasingFunction;
    /** Whether to apply momentum after user input stops */
    enableMomentum: boolean;
    /** Momentum friction (0-1, higher = more friction) */
    momentumFriction: number;
    /** Minimum velocity to trigger momentum */
    momentumThreshold: number;
    /** Stagger delay between elements (ms) */
    staggerDelay: number;
    /** Maximum total stagger time (ms) */
    maxStaggerTime: number;
}

/**
 * Active transition state
 */
export interface ActiveTransition {
    id: string;
    type: "zoom" | "expand" | "collapse" | "focus";
    startTime: number;
    duration: number;
    easing: EasingFunction;
    fromState: TransitionState;
    toState: TransitionState;
    progress: number;
    isComplete: boolean;
}

/**
 * State being transitioned (positions, scales, opacities)
 */
export interface TransitionState {
    scale: number;
    cameraX: number;
    cameraY: number;
    /** Node-specific states (for cluster expansion) */
    nodeStates?: Map<string, NodeTransitionState>;
}

/**
 * Individual node transition state
 */
export interface NodeTransitionState {
    x: number;
    y: number;
    scale: number;
    opacity: number;
    labelOpacity: number;
}

/**
 * Momentum state for smooth zoom/pan
 */
export interface MomentumState {
    velocityX: number;
    velocityY: number;
    velocityScale: number;
    lastUpdateTime: number;
    isActive: boolean;
}

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

/**
 * Built-in easing functions optimized for zoom transitions
 */
export const easings = {
    /** Linear interpolation */
    linear: (t: number): number => t,

    /** Ease out cubic - smooth deceleration (default for zoom) */
    easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),

    /** Ease in cubic - accelerating */
    easeInCubic: (t: number): number => t * t * t,

    /** Ease in-out cubic - smooth start and end */
    easeInOutCubic: (t: number): number =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

    /** Ease out exponential - snappy zoom feel */
    easeOutExpo: (t: number): number =>
        t === 1 ? 1 : 1 - Math.pow(2, -10 * t),

    /** Ease out elastic - bouncy effect */
    easeOutElastic: (t: number): number => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 :
            Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },

    /** Ease out back - slight overshoot */
    easeOutBack: (t: number): number => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },

    /** Spring - physics-based bounce */
    spring: (t: number): number => {
        const damping = 0.6;
        const frequency = 4;
        return 1 - Math.exp(-damping * t * 10) * Math.cos(frequency * t * Math.PI);
    },
} as const;

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

export const DEFAULT_TRANSITION_CONFIG: TransitionConfig = {
    duration: 400,
    easing: easings.easeOutCubic,
    enableMomentum: true,
    momentumFriction: 0.92,
    momentumThreshold: 0.5,
    staggerDelay: 15,
    maxStaggerTime: 200,
};

// ============================================================================
// LEVEL TRANSITIONER CLASS
// ============================================================================

type TransitionListener = (transition: ActiveTransition) => void;

/**
 * LevelTransitioner - Manages smooth transitions between zoom levels
 */
export class LevelTransitioner {
    private config: TransitionConfig;
    private activeTransitions: Map<string, ActiveTransition> = new Map();
    private momentum: MomentumState;
    private animationFrame: number | null = null;
    private listeners: Set<TransitionListener> = new Set();

    constructor(config: Partial<TransitionConfig> = {}) {
        this.config = { ...DEFAULT_TRANSITION_CONFIG, ...config };
        this.momentum = {
            velocityX: 0,
            velocityY: 0,
            velocityScale: 0,
            lastUpdateTime: Date.now(),
            isActive: false,
        };
    }

    // ========================================================================
    // TRANSITION CREATION
    // ========================================================================

    /**
     * Start a zoom transition between scales
     */
    startZoomTransition(
        fromScale: number,
        toScale: number,
        cameraX: number,
        cameraY: number,
        options: Partial<TransitionConfig> = {}
    ): string {
        const id = `zoom-${Date.now()}`;
        const config = { ...this.config, ...options };

        const transition: ActiveTransition = {
            id,
            type: "zoom",
            startTime: Date.now(),
            duration: config.duration,
            easing: config.easing,
            fromState: { scale: fromScale, cameraX, cameraY },
            toState: { scale: toScale, cameraX, cameraY },
            progress: 0,
            isComplete: false,
        };

        this.activeTransitions.set(id, transition);
        this.startAnimation();

        return id;
    }

    /**
     * Start a cluster expansion transition
     */
    startClusterExpansion(
        cluster: ClusterNode,
        childNodes: UniverseNode[],
        options: Partial<TransitionConfig> = {}
    ): string {
        const id = `expand-${cluster.id}-${Date.now()}`;
        const config = { ...this.config, ...options };

        // Calculate staggered start times for children
        const nodeStates = new Map<string, NodeTransitionState>();
        const staggerInterval = Math.min(
            config.staggerDelay,
            config.maxStaggerTime / childNodes.length
        );

        childNodes.forEach((node, index) => {
            nodeStates.set(node.id, {
                x: cluster.x, // Start from cluster center
                y: cluster.y,
                scale: 0,
                opacity: 0,
                labelOpacity: 0,
            });
        });

        const toNodeStates = new Map<string, NodeTransitionState>();
        childNodes.forEach((node) => {
            toNodeStates.set(node.id, {
                x: node.x,
                y: node.y,
                scale: 1,
                opacity: 1,
                labelOpacity: 1,
            });
        });

        const transition: ActiveTransition = {
            id,
            type: "expand",
            startTime: Date.now(),
            duration: config.duration + config.maxStaggerTime,
            easing: config.easing,
            fromState: {
                scale: 1,
                cameraX: cluster.x,
                cameraY: cluster.y,
                nodeStates,
            },
            toState: {
                scale: 1,
                cameraX: cluster.x,
                cameraY: cluster.y,
                nodeStates: toNodeStates,
            },
            progress: 0,
            isComplete: false,
        };

        this.activeTransitions.set(id, transition);
        this.startAnimation();

        return id;
    }

    /**
     * Start a cluster collapse transition
     */
    startClusterCollapse(
        cluster: ClusterNode,
        childNodes: UniverseNode[],
        options: Partial<TransitionConfig> = {}
    ): string {
        const id = `collapse-${cluster.id}-${Date.now()}`;
        const config = { ...this.config, ...options };

        const nodeStates = new Map<string, NodeTransitionState>();
        childNodes.forEach((node) => {
            nodeStates.set(node.id, {
                x: node.x,
                y: node.y,
                scale: 1,
                opacity: 1,
                labelOpacity: 1,
            });
        });

        const toNodeStates = new Map<string, NodeTransitionState>();
        childNodes.forEach((node) => {
            toNodeStates.set(node.id, {
                x: cluster.x,
                y: cluster.y,
                scale: 0,
                opacity: 0,
                labelOpacity: 0,
            });
        });

        const transition: ActiveTransition = {
            id,
            type: "collapse",
            startTime: Date.now(),
            duration: config.duration,
            easing: config.easing,
            fromState: {
                scale: 1,
                cameraX: cluster.x,
                cameraY: cluster.y,
                nodeStates,
            },
            toState: {
                scale: 1,
                cameraX: cluster.x,
                cameraY: cluster.y,
                nodeStates: toNodeStates,
            },
            progress: 0,
            isComplete: false,
        };

        this.activeTransitions.set(id, transition);
        this.startAnimation();

        return id;
    }

    /**
     * Start a focus transition (pan + zoom to target)
     */
    startFocusTransition(
        fromState: TransitionState,
        toState: TransitionState,
        options: Partial<TransitionConfig> = {}
    ): string {
        const id = `focus-${Date.now()}`;
        const config = { ...this.config, ...options };

        const transition: ActiveTransition = {
            id,
            type: "focus",
            startTime: Date.now(),
            duration: config.duration,
            easing: config.easing,
            fromState,
            toState,
            progress: 0,
            isComplete: false,
        };

        this.activeTransitions.set(id, transition);
        this.startAnimation();

        return id;
    }

    // ========================================================================
    // TRANSITION QUERIES
    // ========================================================================

    /**
     * Get the current interpolated state for a transition
     */
    getInterpolatedState(transitionId: string): TransitionState | null {
        const transition = this.activeTransitions.get(transitionId);
        if (!transition) return null;

        return this.interpolateState(
            transition.fromState,
            transition.toState,
            transition.progress,
            transition.easing
        );
    }

    /**
     * Get interpolated node state during cluster transition
     */
    getNodeTransitionState(
        transitionId: string,
        nodeId: string,
        staggerIndex: number = 0
    ): NodeTransitionState | null {
        const transition = this.activeTransitions.get(transitionId);
        if (!transition) return null;

        const fromState = transition.fromState.nodeStates?.get(nodeId);
        const toState = transition.toState.nodeStates?.get(nodeId);

        if (!fromState || !toState) return null;

        // Apply stagger delay
        const staggerOffset = (staggerIndex * this.config.staggerDelay) / transition.duration;
        const adjustedProgress = Math.max(0, Math.min(1, (transition.progress - staggerOffset) / (1 - staggerOffset)));
        const easedProgress = transition.easing(adjustedProgress);

        return {
            x: fromState.x + (toState.x - fromState.x) * easedProgress,
            y: fromState.y + (toState.y - fromState.y) * easedProgress,
            scale: fromState.scale + (toState.scale - fromState.scale) * easedProgress,
            opacity: fromState.opacity + (toState.opacity - fromState.opacity) * easedProgress,
            labelOpacity: fromState.labelOpacity + (toState.labelOpacity - fromState.labelOpacity) * easedProgress,
        };
    }

    /**
     * Check if any transitions are active
     */
    get isTransitioning(): boolean {
        return this.activeTransitions.size > 0 || this.momentum.isActive;
    }

    /**
     * Get all active transitions
     */
    getActiveTransitions(): ActiveTransition[] {
        return Array.from(this.activeTransitions.values());
    }

    // ========================================================================
    // MOMENTUM
    // ========================================================================

    /**
     * Apply velocity from user input (for momentum calculation)
     */
    applyVelocity(velocityX: number, velocityY: number, velocityScale: number = 0): void {
        if (!this.config.enableMomentum) return;

        const now = Date.now();
        this.momentum = {
            velocityX,
            velocityY,
            velocityScale,
            lastUpdateTime: now,
            isActive: true,
        };

        this.startAnimation();
    }

    /**
     * Stop momentum immediately
     */
    stopMomentum(): void {
        this.momentum.isActive = false;
        this.momentum.velocityX = 0;
        this.momentum.velocityY = 0;
        this.momentum.velocityScale = 0;
    }

    /**
     * Get current momentum-adjusted delta
     */
    getMomentumDelta(): { x: number; y: number; scale: number } {
        if (!this.momentum.isActive) {
            return { x: 0, y: 0, scale: 0 };
        }

        return {
            x: this.momentum.velocityX,
            y: this.momentum.velocityY,
            scale: this.momentum.velocityScale,
        };
    }

    // ========================================================================
    // ANIMATION LOOP
    // ========================================================================

    private startAnimation(): void {
        if (typeof window === "undefined") return;

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    private animate(): void {
        if (typeof window === "undefined") return;

        const now = Date.now();

        // Update all active transitions
        for (const [id, transition] of this.activeTransitions) {
            const elapsed = now - transition.startTime;
            const progress = Math.min(1, elapsed / transition.duration);

            transition.progress = transition.easing(progress);

            if (progress >= 1) {
                transition.isComplete = true;
            }

            // Notify listeners
            this.notifyListeners(transition);
        }

        // Remove completed transitions
        for (const [id, transition] of this.activeTransitions) {
            if (transition.isComplete) {
                this.activeTransitions.delete(id);
            }
        }

        // Update momentum
        if (this.momentum.isActive) {
            const deltaTime = (now - this.momentum.lastUpdateTime) / 1000;
            this.momentum.lastUpdateTime = now;

            // Apply friction
            this.momentum.velocityX *= Math.pow(this.config.momentumFriction, deltaTime * 60);
            this.momentum.velocityY *= Math.pow(this.config.momentumFriction, deltaTime * 60);
            this.momentum.velocityScale *= Math.pow(this.config.momentumFriction, deltaTime * 60);

            // Check if momentum has stopped
            const totalVelocity = Math.sqrt(
                this.momentum.velocityX ** 2 +
                this.momentum.velocityY ** 2 +
                this.momentum.velocityScale ** 2
            );

            if (totalVelocity < this.config.momentumThreshold) {
                this.momentum.isActive = false;
            }
        }

        // Continue animation if needed
        if (this.activeTransitions.size > 0 || this.momentum.isActive) {
            this.animationFrame = requestAnimationFrame(() => this.animate());
        } else {
            this.animationFrame = null;
        }
    }

    // ========================================================================
    // INTERPOLATION HELPERS
    // ========================================================================

    private interpolateState(
        from: TransitionState,
        to: TransitionState,
        progress: number,
        easing: EasingFunction
    ): TransitionState {
        const easedProgress = easing(progress);

        return {
            scale: from.scale + (to.scale - from.scale) * easedProgress,
            cameraX: from.cameraX + (to.cameraX - from.cameraX) * easedProgress,
            cameraY: from.cameraY + (to.cameraY - from.cameraY) * easedProgress,
        };
    }

    // ========================================================================
    // TRANSITION CONTROL
    // ========================================================================

    /**
     * Cancel a specific transition
     */
    cancelTransition(transitionId: string): void {
        this.activeTransitions.delete(transitionId);
    }

    /**
     * Cancel all active transitions
     */
    cancelAllTransitions(): void {
        this.activeTransitions.clear();
        this.stopMomentum();
    }

    // ========================================================================
    // LISTENERS
    // ========================================================================

    /**
     * Subscribe to transition updates
     */
    subscribe(listener: TransitionListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(transition: ActiveTransition): void {
        this.listeners.forEach(listener => listener(transition));
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    dispose(): void {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.activeTransitions.clear();
        this.listeners.clear();
    }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create a new LevelTransitioner instance
 */
export function createLevelTransitioner(
    config?: Partial<TransitionConfig>
): LevelTransitioner {
    return new LevelTransitioner(config);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate the optimal duration for a zoom transition based on scale difference
 */
export function calculateZoomDuration(
    fromScale: number,
    toScale: number,
    baseDuration: number = 400
): number {
    const scaleDiff = Math.abs(Math.log2(toScale / fromScale));
    // Scale duration based on how many "levels" we're traversing
    return Math.min(600, baseDuration + scaleDiff * 100);
}

/**
 * Calculate the optimal duration for a pan transition based on distance
 */
export function calculatePanDuration(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    scale: number,
    baseDuration: number = 300
): number {
    const distance = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);
    const screenDistance = distance * scale;
    // Scale duration based on screen distance
    return Math.min(500, baseDuration + screenDistance * 0.1);
}

/**
 * Interpolate between two values with easing
 */
export function interpolate(
    from: number,
    to: number,
    progress: number,
    easing: EasingFunction = easings.easeOutCubic
): number {
    return from + (to - from) * easing(progress);
}

/**
 * Interpolate between two colors (hex format)
 */
export function interpolateColor(
    fromHex: string,
    toHex: string,
    progress: number
): string {
    const from = hexToRgb(fromHex);
    const to = hexToRgb(toHex);

    if (!from || !to) return fromHex;

    const r = Math.round(from.r + (to.r - from.r) * progress);
    const g = Math.round(from.g + (to.g - from.g) * progress);
    const b = Math.round(from.b + (to.b - from.b) * progress);

    return rgbToHex(r, g, b);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : null;
}

function rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("");
}
