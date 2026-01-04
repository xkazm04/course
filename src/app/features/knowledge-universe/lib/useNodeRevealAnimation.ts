/**
 * Node Reveal Animation Hook
 *
 * Tracks zoom level changes and manages staggered reveal animations
 * for nodes that become visible when crossing zoom level thresholds.
 * Uses spring physics for smooth scale and opacity transitions.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import type { ZoomLevel, UniverseNode } from "./types";

// ============================================================================
// TYPES
// ============================================================================

export interface NodeRevealState {
    /** Progress of the reveal animation (0-1) */
    progress: number;
    /** Current opacity (0-1) */
    opacity: number;
    /** Current scale (0.8-1) */
    scale: number;
    /** Stagger delay in ms based on position */
    staggerDelay: number;
    /** Whether animation is complete */
    complete: boolean;
}

export interface UseNodeRevealAnimationOptions {
    /** Duration of the reveal animation in ms */
    duration?: number;
    /** Base stagger delay between nodes in ms */
    staggerInterval?: number;
    /** Maximum stagger delay in ms */
    maxStaggerDelay?: number;
    /** Whether animations are disabled (reduced motion) */
    reducedMotion?: boolean;
}

export interface UseNodeRevealAnimationReturn {
    /** Get the reveal state for a specific node */
    getNodeRevealState: (nodeId: string) => NodeRevealState;
    /** Register nodes that just became visible */
    registerNewlyVisibleNodes: (nodes: UniverseNode[]) => void;
    /** Whether any animations are currently running */
    isAnimating: boolean;
    /** The previous zoom level (for detecting changes) */
    previousZoomLevel: ZoomLevel | null;
    /** Update the previous zoom level */
    setPreviousZoomLevel: (level: ZoomLevel) => void;
}

// ============================================================================
// SPRING PHYSICS
// ============================================================================

/**
 * Spring easing function with slight overshoot for organic feel
 */
function springEase(t: number): number {
    // Modified spring curve: fast acceleration, gentle settle
    const c4 = (2 * Math.PI) / 3;
    return t === 0
        ? 0
        : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

/**
 * Smooth ease-out for opacity (no overshoot)
 */
function opacityEase(t: number): number {
    return 1 - Math.pow(1 - t, 3); // Cubic ease-out
}

// ============================================================================
// DEFAULT STATE
// ============================================================================

const COMPLETE_STATE: NodeRevealState = {
    progress: 1,
    opacity: 1,
    scale: 1,
    staggerDelay: 0,
    complete: true,
};

// ============================================================================
// HOOK
// ============================================================================

export function useNodeRevealAnimation(
    options: UseNodeRevealAnimationOptions = {}
): UseNodeRevealAnimationReturn {
    const {
        duration = 300,
        staggerInterval = 15,
        maxStaggerDelay = 200,
        reducedMotion = false,
    } = options;

    // Track reveal animations by node ID
    const [revealingNodes, setRevealingNodes] = useState<
        Map<string, { startTime: number; staggerDelay: number }>
    >(new Map());

    // Track previous zoom level
    const [previousZoomLevel, setPreviousZoomLevel] = useState<ZoomLevel | null>(null);

    // Animation frame reference
    const animationRef = useRef<number | null>(null);
    const lastUpdateRef = useRef<number>(0);

    // Whether any animations are running
    const [isAnimating, setIsAnimating] = useState(false);

    /**
     * Register nodes that just became visible due to zoom level change
     */
    const registerNewlyVisibleNodes = useCallback(
        (nodes: UniverseNode[]) => {
            if (reducedMotion || nodes.length === 0) return;

            const now = performance.now();
            const newRevealingNodes = new Map<string, { startTime: number; staggerDelay: number }>();

            // Sort nodes by distance from origin for consistent stagger order
            const sortedNodes = [...nodes].sort((a, b) => {
                const distA = Math.sqrt(a.x * a.x + a.y * a.y);
                const distB = Math.sqrt(b.x * b.x + b.y * b.y);
                return distA - distB;
            });

            // Calculate stagger delays
            sortedNodes.forEach((node, index) => {
                const staggerDelay = Math.min(index * staggerInterval, maxStaggerDelay);
                newRevealingNodes.set(node.id, {
                    startTime: now,
                    staggerDelay,
                });
            });

            setRevealingNodes((prev) => {
                const merged = new Map(prev);
                newRevealingNodes.forEach((value, key) => {
                    merged.set(key, value);
                });
                return merged;
            });

            setIsAnimating(true);
        },
        [reducedMotion, staggerInterval, maxStaggerDelay]
    );

    /**
     * Get the current reveal state for a node
     */
    const getNodeRevealState = useCallback(
        (nodeId: string): NodeRevealState => {
            // If reduced motion or node is not being revealed, return complete state
            if (reducedMotion) {
                return COMPLETE_STATE;
            }

            const revealInfo = revealingNodes.get(nodeId);
            if (!revealInfo) {
                return COMPLETE_STATE;
            }

            const now = performance.now();
            const elapsed = now - revealInfo.startTime - revealInfo.staggerDelay;

            // Not started yet (still in stagger delay)
            if (elapsed < 0) {
                return {
                    progress: 0,
                    opacity: 0,
                    scale: 0.8,
                    staggerDelay: revealInfo.staggerDelay,
                    complete: false,
                };
            }

            // Calculate progress
            const progress = Math.min(elapsed / duration, 1);

            if (progress >= 1) {
                return COMPLETE_STATE;
            }

            // Apply easing
            const springProgress = springEase(progress);
            const opacityProgress = opacityEase(progress);

            return {
                progress,
                opacity: opacityProgress,
                scale: 0.8 + 0.2 * springProgress, // 0.8 -> 1.0
                staggerDelay: revealInfo.staggerDelay,
                complete: false,
            };
        },
        [reducedMotion, revealingNodes, duration]
    );

    /**
     * Animation loop to update reveal states and clean up completed animations
     */
    useEffect(() => {
        if (!isAnimating || reducedMotion) return;

        const animate = () => {
            const now = performance.now();

            // Throttle updates to 60fps
            if (now - lastUpdateRef.current < 16) {
                animationRef.current = requestAnimationFrame(animate);
                return;
            }
            lastUpdateRef.current = now;

            // Check which animations are complete
            let allComplete = true;
            const toRemove: string[] = [];

            revealingNodes.forEach((info, nodeId) => {
                const elapsed = now - info.startTime - info.staggerDelay;
                if (elapsed >= duration) {
                    toRemove.push(nodeId);
                } else {
                    allComplete = false;
                }
            });

            // Remove completed animations
            if (toRemove.length > 0) {
                setRevealingNodes((prev) => {
                    const next = new Map(prev);
                    toRemove.forEach((id) => next.delete(id));
                    return next;
                });
            }

            // Stop animation loop if all complete
            if (allComplete) {
                setIsAnimating(false);
            } else {
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isAnimating, reducedMotion, revealingNodes, duration]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return {
        getNodeRevealState,
        registerNewlyVisibleNodes,
        isAnimating,
        previousZoomLevel,
        setPreviousZoomLevel,
    };
}
