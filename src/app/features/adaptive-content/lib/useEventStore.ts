"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BehaviorSignal } from "./types";
import type { LearningEvent, EventCategory, LearningEventContext } from "./learningEvents";
import type { EventStore, EventStoreStats, SessionMetadata } from "./eventStore";
import { getEventStore } from "./eventStore";
import type { LearningPattern, LearnerProfile, TimelineInsight } from "./timelineAnalysis";
import { discoverPatterns, buildLearnerProfile, generateInsights } from "./timelineAnalysis";

// ============================================================================
// Hook Types
// ============================================================================

export interface UseEventStoreOptions {
    courseId: string;
    userId?: string;
    autoRecordMilestones?: boolean;
}

export interface UseEventStoreReturn {
    // Store instance
    store: EventStore;

    // State
    events: LearningEvent[];
    currentSession: SessionMetadata | null;
    stats: EventStoreStats;
    isLoading: boolean;

    // Recording functions
    recordSignal: (signal: BehaviorSignal, context?: LearningEventContext) => LearningEvent;
    recordMilestone: (
        type: "sectionComplete" | "chapterComplete" | "quizPassed" | "streakAchieved" | "levelUp",
        id: string,
        value?: number
    ) => LearningEvent;

    // Query functions
    getRecentEvents: (count?: number) => LearningEvent[];
    getTodaysEvents: () => LearningEvent[];
    getSessionEvents: (sessionId?: string) => LearningEvent[];

    // Analysis
    patterns: LearningPattern[];
    profile: LearnerProfile | null;
    insights: TimelineInsight[];

    // Actions
    endSession: () => void;
    clearEvents: () => void;
    exportData: () => string;
    importData: (data: string) => boolean;
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Hook for using the EventStore with React state management
 */
export function useEventStore({
    courseId,
    userId,
    autoRecordMilestones = true,
}: UseEventStoreOptions): UseEventStoreReturn {
    const [events, setEvents] = useState<LearningEvent[]>([]);
    const [stats, setStats] = useState<EventStoreStats>({
        totalEvents: 0,
        totalSessions: 0,
        eventsByCategory: {} as Record<EventCategory, number>,
        eventsBySignificance: {},
        timeRange: null,
        averageEventsPerSession: 0,
    } as EventStoreStats);
    const [isLoading, setIsLoading] = useState(true);
    const storeRef = useRef<EventStore | null>(null);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    // Initialize store
    useEffect(() => {
        const store = getEventStore(courseId, userId);
        storeRef.current = store;

        // Load initial state
        setEvents(store.getAllEvents());
        setStats(store.getStats());
        setIsLoading(false);

        // Subscribe to new events
        unsubscribeRef.current = store.subscribe("*", (event) => {
            setEvents((prev) => [...prev, event]);
            setStats(store.getStats());
        });

        // Cleanup on unmount
        return () => {
            unsubscribeRef.current?.();
            store.forceSave();
        };
    }, [courseId, userId]);

    // Record a signal
    const recordSignal = useCallback(
        (signal: BehaviorSignal, context?: LearningEventContext): LearningEvent => {
            if (!storeRef.current) {
                throw new Error("EventStore not initialized");
            }
            return storeRef.current.recordSignal(signal, context);
        },
        []
    );

    // Record a milestone
    const recordMilestone = useCallback(
        (
            type: "sectionComplete" | "chapterComplete" | "quizPassed" | "streakAchieved" | "levelUp",
            id: string,
            value?: number
        ): LearningEvent => {
            if (!storeRef.current) {
                throw new Error("EventStore not initialized");
            }
            return storeRef.current.recordMilestone(type, id, value);
        },
        []
    );

    // Get recent events
    const getRecentEvents = useCallback(
        (count = 20): LearningEvent[] => {
            return storeRef.current?.getRecentEvents(count) ?? [];
        },
        []
    );

    // Get today's events
    const getTodaysEvents = useCallback((): LearningEvent[] => {
        return storeRef.current?.getTodaysEvents() ?? [];
    }, []);

    // Get session events
    const getSessionEvents = useCallback(
        (sessionId?: string): LearningEvent[] => {
            if (!storeRef.current) return [];
            if (sessionId) {
                return storeRef.current.getSessionEvents(sessionId);
            }
            return storeRef.current.getCurrentSessionEvents();
        },
        []
    );

    // End current session
    const endSession = useCallback(() => {
        storeRef.current?.endSession();
    }, []);

    // Clear all events
    const clearEvents = useCallback(() => {
        storeRef.current?.clear();
        setEvents([]);
        setStats(storeRef.current?.getStats() ?? stats);
    }, [stats]);

    // Export data
    const exportData = useCallback((): string => {
        if (!storeRef.current) return "";
        return JSON.stringify(storeRef.current.export());
    }, []);

    // Import data
    const importData = useCallback((data: string): boolean => {
        if (!storeRef.current) return false;
        try {
            const parsed = JSON.parse(data);
            const success = storeRef.current.import(parsed);
            if (success) {
                setEvents(storeRef.current.getAllEvents());
                setStats(storeRef.current.getStats());
            }
            return success;
        } catch {
            return false;
        }
    }, []);

    // Compute analysis
    const patterns = useMemo(() => discoverPatterns(events), [events]);
    const profile = useMemo(() => (events.length > 10 ? buildLearnerProfile(events) : null), [events]);
    const insights = useMemo(() => generateInsights(events), [events]);

    // Current session
    const currentSession = storeRef.current?.getCurrentSession() ?? null;

    return {
        store: storeRef.current!,
        events,
        currentSession,
        stats,
        isLoading,
        recordSignal,
        recordMilestone,
        getRecentEvents,
        getTodaysEvents,
        getSessionEvents,
        patterns,
        profile,
        insights,
        endSession,
        clearEvents,
        exportData,
        importData,
    };
}

// ============================================================================
// Event Subscription Hook
// ============================================================================

/**
 * Hook to subscribe to specific event categories
 */
export function useEventSubscription(
    courseId: string,
    category: EventCategory | "*",
    callback: (event: LearningEvent) => void
): void {
    useEffect(() => {
        const store = getEventStore(courseId);
        const unsubscribe = store.subscribe(category, callback);
        return unsubscribe;
    }, [courseId, category, callback]);
}

// ============================================================================
// Pattern Detection Hook
// ============================================================================

export interface UsePatternDetectionOptions {
    events: LearningEvent[];
    enabled?: boolean;
    minEventsForAnalysis?: number;
}

/**
 * Hook for real-time pattern detection
 */
export function usePatternDetection({
    events,
    enabled = true,
    minEventsForAnalysis = 10,
}: UsePatternDetectionOptions): {
    patterns: LearningPattern[];
    hasPatterns: boolean;
    primaryPattern: LearningPattern | null;
} {
    const patterns = useMemo(() => {
        if (!enabled || events.length < minEventsForAnalysis) {
            return [];
        }
        return discoverPatterns(events);
    }, [events, enabled, minEventsForAnalysis]);

    return {
        patterns,
        hasPatterns: patterns.length > 0,
        primaryPattern: patterns.length > 0 ? patterns[0] : null,
    };
}

// ============================================================================
// Session Tracking Hook
// ============================================================================

export interface UseSessionTrackingReturn {
    sessionId: string | null;
    sessionDuration: number;
    eventCount: number;
    isActive: boolean;
}

/**
 * Hook for tracking the current learning session
 */
export function useSessionTracking(courseId: string): UseSessionTrackingReturn {
    const [sessionDuration, setSessionDuration] = useState(0);
    const [eventCount, setEventCount] = useState(0);
    const storeRef = useRef<EventStore | null>(null);

    useEffect(() => {
        const store = getEventStore(courseId);
        storeRef.current = store;

        // Initial values
        const session = store.getCurrentSession();
        if (session) {
            setSessionDuration(Date.now() - session.startTime);
            setEventCount(session.eventCount);
        }

        // Update duration every minute
        const intervalId = setInterval(() => {
            const currentSession = storeRef.current?.getCurrentSession();
            if (currentSession) {
                setSessionDuration(Date.now() - currentSession.startTime);
            }
        }, 60000);

        // Subscribe to events to update count
        const unsubscribe = store.subscribe("*", () => {
            const currentSession = storeRef.current?.getCurrentSession();
            if (currentSession) {
                setEventCount(currentSession.eventCount);
            }
        });

        return () => {
            clearInterval(intervalId);
            unsubscribe();
        };
    }, [courseId]);

    const session = storeRef.current?.getCurrentSession();

    return {
        sessionId: session?.id ?? null,
        sessionDuration,
        eventCount,
        isActive: session != null && !session.endTime,
    };
}

// ============================================================================
// Journey Replay Hook
// ============================================================================

export interface UseJourneyReplayOptions {
    events: LearningEvent[];
    autoPlay?: boolean;
    speed?: number; // Events per second
}

export interface UseJourneyReplayReturn {
    currentEvent: LearningEvent | null;
    currentIndex: number;
    isPlaying: boolean;
    progress: number;
    play: () => void;
    pause: () => void;
    reset: () => void;
    jumpTo: (index: number) => void;
}

/**
 * Hook for replaying a learning journey
 */
export function useJourneyReplay({
    events,
    autoPlay = false,
    speed = 1,
}: UseJourneyReplayOptions): UseJourneyReplayReturn {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (isPlaying && events.length > 0) {
            intervalRef.current = setInterval(() => {
                setCurrentIndex((prev) => {
                    if (prev >= events.length - 1) {
                        setIsPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000 / speed);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isPlaying, events.length, speed]);

    const play = useCallback(() => setIsPlaying(true), []);
    const pause = useCallback(() => setIsPlaying(false), []);
    const reset = useCallback(() => {
        setCurrentIndex(0);
        setIsPlaying(false);
    }, []);
    const jumpTo = useCallback(
        (index: number) => {
            setCurrentIndex(Math.max(0, Math.min(index, events.length - 1)));
        },
        [events.length]
    );

    return {
        currentEvent: events[currentIndex] ?? null,
        currentIndex,
        isPlaying,
        progress: events.length > 0 ? (currentIndex + 1) / events.length : 0,
        play,
        pause,
        reset,
        jumpTo,
    };
}
