"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
    useMemo,
} from "react";
import { useReducedMotion } from "@/app/shared/lib/motionPrimitives";
import {
    VelocityLevel,
    VelocitySignals,
    VelocityAdaptations,
    UserVelocityContextType,
    VelocityConfig,
    DEFAULT_VELOCITY_CONFIG,
} from "./types";

// ============================================================================
// Velocity Detection Logic
// ============================================================================

/**
 * Compute adaptations based on velocity level.
 * This is the core mapping from behavioral signals to UI behavior.
 */
function computeAdaptations(
    velocity: VelocityLevel,
    prefersReducedMotion: boolean
): VelocityAdaptations {
    // Reduced motion preference always overrides to focused-style animations
    const baseAnimations = !prefersReducedMotion;

    switch (velocity) {
        case "exploring":
            return {
                enableAnimations: baseAnimations,
                animationIntensity: baseAnimations ? 1.0 : 0,
                contentDensity: "spacious",
                prefetchLevel: "aggressive",
                showDecorations: true,
                expandDetails: false,
                contentPriority: "discovery",
                transitionMultiplier: baseAnimations ? 1.0 : 0,
            };

        case "focused":
            return {
                enableAnimations: baseAnimations,
                animationIntensity: baseAnimations ? 0.3 : 0,
                contentDensity: "compact",
                prefetchLevel: "minimal",
                showDecorations: false,
                expandDetails: true, // Show full details when focused
                contentPriority: "efficiency",
                transitionMultiplier: baseAnimations ? 0.5 : 0,
            };

        case "balanced":
        default:
            return {
                enableAnimations: baseAnimations,
                animationIntensity: baseAnimations ? 0.7 : 0,
                contentDensity: "normal",
                prefetchLevel: "moderate",
                showDecorations: true,
                expandDetails: false,
                contentPriority: "balanced",
                transitionMultiplier: baseAnimations ? 0.8 : 0,
            };
    }
}

/**
 * Determine velocity level from signals.
 */
function computeVelocityLevel(
    signals: VelocitySignals,
    config: VelocityConfig
): VelocityLevel {
    // Reduced motion preference is a strong signal for focused mode
    if (signals.prefersReducedMotion) {
        return "focused";
    }

    // Typing is a focused activity
    if (signals.isTyping) {
        return "focused";
    }

    // Extended idle time suggests focused reading/thinking
    if (signals.idleTime > config.focusedIdleThreshold) {
        return "focused";
    }

    // Fast scrolling suggests exploration
    if (signals.scrollVelocity > config.exploringScrollThreshold) {
        return "exploring";
    }

    // Rapid navigation suggests exploration
    if (signals.rapidNavigationCount >= config.exploringNavigationThreshold) {
        return "exploring";
    }

    // Fast mouse movement suggests active exploration
    if (signals.mouseVelocity > config.exploringMouseThreshold) {
        return "exploring";
    }

    return "balanced";
}

// ============================================================================
// Context & Provider
// ============================================================================

const defaultSignals: VelocitySignals = {
    prefersReducedMotion: false,
    idleTime: 0,
    scrollVelocity: 0,
    rapidNavigationCount: 0,
    mouseVelocity: 0,
    isTyping: false,
};

const defaultContext: UserVelocityContextType = {
    velocity: "balanced",
    signals: defaultSignals,
    adaptations: computeAdaptations("balanced", false),
    isReady: false,
    setVelocityOverride: () => { },
    velocityOverride: null,
};

const UserVelocityContext = createContext<UserVelocityContextType>(defaultContext);

const STORAGE_KEY = "user-velocity-override";

interface UserVelocityProviderProps {
    children: React.ReactNode;
    config?: Partial<VelocityConfig>;
}

export function UserVelocityProvider({
    children,
    config: configOverrides,
}: UserVelocityProviderProps) {
    const config = useMemo(
        () => ({ ...DEFAULT_VELOCITY_CONFIG, ...configOverrides }),
        [configOverrides]
    );

    // Core state
    const [signals, setSignals] = useState<VelocitySignals>(defaultSignals);
    const [velocityOverride, setVelocityOverrideState] = useState<VelocityLevel | null>(null);
    const [isReady, setIsReady] = useState(false);

    // Get OS-level reduced motion preference
    const prefersReducedMotion = useReducedMotion();

    // Refs for tracking
    const lastActivityRef = useRef<number>(Date.now());
    const scrollPositionRef = useRef<number>(0);
    const scrollTimestampRef = useRef<number>(Date.now());
    const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const mouseTimestampRef = useRef<number>(Date.now());
    const navigationTimestampsRef = useRef<number[]>([]);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Refs for rapidly-changing values (synced to state periodically)
    const currentScrollVelocityRef = useRef<number>(0);
    const currentMouseVelocityRef = useRef<number>(0);

    // Load stored override preference
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === "exploring" || stored === "balanced" || stored === "focused") {
                setVelocityOverrideState(stored);
            }
        } catch {
            // localStorage not available
        }
        setIsReady(true);
    }, []);

    // Update reduced motion signal when preference changes
    useEffect(() => {
        setSignals((prev) => ({ ...prev, prefersReducedMotion }));
    }, [prefersReducedMotion]);

    // Track scroll velocity (store in ref, not state)
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleScroll = () => {
            const now = Date.now();
            const currentPosition = window.scrollY;
            const timeDelta = now - scrollTimestampRef.current;

            if (timeDelta > 0) {
                const distance = Math.abs(currentPosition - scrollPositionRef.current);
                const velocity = (distance / timeDelta) * 1000; // px per second
                currentScrollVelocityRef.current = velocity;
                lastActivityRef.current = now;
            }

            scrollPositionRef.current = currentPosition;
            scrollTimestampRef.current = now;
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Track mouse velocity (store in ref, not state)
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleMouseMove = (e: MouseEvent) => {
            const now = Date.now();
            const timeDelta = now - mouseTimestampRef.current;

            if (timeDelta > 0) {
                const dx = e.clientX - mousePositionRef.current.x;
                const dy = e.clientY - mousePositionRef.current.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const velocity = (distance / timeDelta) * 1000; // px per second
                currentMouseVelocityRef.current = velocity;
                lastActivityRef.current = now;
            }

            mousePositionRef.current = { x: e.clientX, y: e.clientY };
            mouseTimestampRef.current = now;
        };

        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    // Track keyboard activity (typing detection)
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleKeyDown = () => {
            lastActivityRef.current = Date.now();
            setSignals((prev) => {
                if (prev.isTyping) return prev; // Avoid update if already typing
                return { ...prev, isTyping: true, idleTime: 0 };
            });

            // Clear previous timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Reset typing flag after 1 second of no typing
            typingTimeoutRef.current = setTimeout(() => {
                setSignals((prev) => {
                    if (!prev.isTyping) return prev;
                    return { ...prev, isTyping: false };
                });
            }, 1000);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    // Track navigation events via popstate and link clicks
    useEffect(() => {
        if (typeof window === "undefined") return;

        const recordNavigation = () => {
            const now = Date.now();
            navigationTimestampsRef.current.push(now);

            // Clean up old timestamps outside the time window
            navigationTimestampsRef.current = navigationTimestampsRef.current.filter(
                (ts) => now - ts < config.navigationTimeWindow
            );

            setSignals((prev) => ({
                ...prev,
                rapidNavigationCount: navigationTimestampsRef.current.length,
            }));
        };

        // Track browser navigation
        window.addEventListener("popstate", recordNavigation);

        // Track link clicks
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest("a");
            if (link && link.href && !link.href.startsWith("javascript:")) {
                recordNavigation();
            }
        };
        document.addEventListener("click", handleClick);

        return () => {
            window.removeEventListener("popstate", recordNavigation);
            document.removeEventListener("click", handleClick);
        };
    }, [config.navigationTimeWindow]);

    // Periodic sync: Update state from refs (throttled to prevent render floods)
    useEffect(() => {
        if (typeof window === "undefined") return;

        const interval = setInterval(() => {
            const now = Date.now();
            const idleTime = now - lastActivityRef.current;
            const shouldDecay = idleTime > 500;

            setSignals((prev) => {
                const newScrollVelocity = shouldDecay
                    ? Math.max(0, currentScrollVelocityRef.current * 0.8)
                    : currentScrollVelocityRef.current;
                const newMouseVelocity = shouldDecay
                    ? Math.max(0, currentMouseVelocityRef.current * 0.8)
                    : currentMouseVelocityRef.current;

                // Update refs with decayed values
                if (shouldDecay) {
                    currentScrollVelocityRef.current = newScrollVelocity;
                    currentMouseVelocityRef.current = newMouseVelocity;
                }

                // Avoid unnecessary updates
                const idleDiff = Math.abs(prev.idleTime - idleTime);
                const scrollDiff = Math.abs(prev.scrollVelocity - newScrollVelocity);
                const mouseDiff = Math.abs(prev.mouseVelocity - newMouseVelocity);

                if (idleDiff < 50 && scrollDiff < 10 && mouseDiff < 10) {
                    return prev; // No meaningful change
                }

                return {
                    ...prev,
                    idleTime,
                    scrollVelocity: newScrollVelocity,
                    mouseVelocity: newMouseVelocity,
                };
            });
        }, 200); // Sync every 200ms instead of 100ms

        return () => clearInterval(interval);
    }, []);

    // Compute derived values
    const computedVelocity = useMemo(
        () => computeVelocityLevel(signals, config),
        [signals, config]
    );

    const effectiveVelocity = velocityOverride ?? computedVelocity;

    const adaptations = useMemo(
        () => computeAdaptations(effectiveVelocity, signals.prefersReducedMotion),
        [effectiveVelocity, signals.prefersReducedMotion]
    );

    // Override setter with persistence
    const setVelocityOverride = useCallback((level: VelocityLevel | null) => {
        setVelocityOverrideState(level);
        try {
            if (level) {
                localStorage.setItem(STORAGE_KEY, level);
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch {
            // localStorage not available
        }
    }, []);

    const contextValue: UserVelocityContextType = useMemo(
        () => ({
            velocity: effectiveVelocity,
            signals,
            adaptations,
            isReady,
            setVelocityOverride,
            velocityOverride,
        }),
        [effectiveVelocity, signals, adaptations, isReady, setVelocityOverride, velocityOverride]
    );

    return (
        <UserVelocityContext.Provider value={contextValue}>
            {children}
        </UserVelocityContext.Provider>
    );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Access the full UserVelocity context.
 */
export function useUserVelocity(): UserVelocityContextType {
    return useContext(UserVelocityContext);
}

/**
 * Convenience hook for velocity-aware animations.
 * Returns animation settings appropriate for current velocity.
 */
export function useVelocityAnimation() {
    const { adaptations } = useUserVelocity();

    return useMemo(
        () => ({
            shouldAnimate: adaptations.enableAnimations,
            intensity: adaptations.animationIntensity,
            durationMultiplier: adaptations.transitionMultiplier,
            showDecorations: adaptations.showDecorations,
        }),
        [adaptations]
    );
}

/**
 * Convenience hook for velocity-aware content display.
 */
export function useVelocityContent() {
    const { adaptations, velocity } = useUserVelocity();

    return useMemo(
        () => ({
            density: adaptations.contentDensity,
            expandDetails: adaptations.expandDetails,
            priority: adaptations.contentPriority,
            isFocused: velocity === "focused",
            isExploring: velocity === "exploring",
        }),
        [adaptations, velocity]
    );
}

/**
 * Convenience hook for velocity-aware prefetching.
 */
export function useVelocityPrefetch() {
    const { adaptations } = useUserVelocity();

    return useMemo(() => {
        const level = adaptations.prefetchLevel;
        return {
            level,
            shouldPrefetchOnHover: level !== "none",
            shouldPrefetchAdjacent: level === "moderate" || level === "aggressive",
            shouldPrefetchAll: level === "aggressive",
        };
    }, [adaptations]);
}
