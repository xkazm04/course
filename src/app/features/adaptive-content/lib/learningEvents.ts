/**
 * Learning Events System
 *
 * Reframes BehaviorSignals as first-class Learning Events that can be
 * replayed, analyzed for patterns over time, and used to reconstruct
 * a learner's journey. This enables timeline views, learning path replay,
 * and correlation discovery between events.
 */

import type {
    BehaviorSignal,
    QuizSignal,
    PlaygroundSignal,
    SectionTimeSignal,
    ErrorPatternSignal,
    VideoSignal,
    NavigationSignal,
} from "./types";

// ============================================================================
// Learning Event Types
// ============================================================================

/**
 * Unique identifier for a learning event
 */
export type LearningEventId = string;

/**
 * Session identifier to group related events
 */
export type SessionId = string;

/**
 * Event categories for grouping and filtering
 */
export type EventCategory =
    | "assessment" // Quiz, knowledge checks
    | "practice" // Playground, exercises
    | "consumption" // Video, reading
    | "navigation" // Moving between sections
    | "error" // Errors encountered
    | "milestone" // Significant achievements
    | "session"; // Session start/end

/**
 * Event significance level
 */
export type EventSignificance = "routine" | "notable" | "breakthrough" | "struggle";

/**
 * Core metadata for all learning events
 */
export interface LearningEventMeta {
    id: LearningEventId;
    sessionId: SessionId;
    userId?: string;
    courseId: string;
    category: EventCategory;
    significance: EventSignificance;
    timestamp: number;
    duration?: number; // Event duration in ms
    previousEventId?: LearningEventId; // For event chaining
    relatedEventIds?: LearningEventId[]; // For correlation
    tags?: string[]; // Custom tags for filtering
}

/**
 * Learning Event - extends BehaviorSignal with event metadata
 */
export interface LearningEvent<T extends BehaviorSignal = BehaviorSignal> {
    meta: LearningEventMeta;
    signal: T;
    context?: LearningEventContext;
}

/**
 * Additional context captured at the time of the event
 */
export interface LearningEventContext {
    /** Current comprehension level when event occurred */
    comprehensionLevel?: "beginner" | "intermediate" | "advanced";
    /** Current section being viewed */
    currentSection?: string;
    /** Time elapsed in current session */
    sessionDuration?: number;
    /** Number of events in current session */
    sessionEventCount?: number;
    /** User's current streak days */
    streakDays?: number;
    /** Device/platform info */
    platform?: "web" | "mobile" | "tablet";
    /** Viewport size category */
    viewport?: "small" | "medium" | "large";
}

// ============================================================================
// Typed Learning Events
// ============================================================================

export type QuizEvent = LearningEvent<QuizSignal>;
export type PlaygroundEvent = LearningEvent<PlaygroundSignal>;
export type SectionTimeEvent = LearningEvent<SectionTimeSignal>;
export type ErrorPatternEvent = LearningEvent<ErrorPatternSignal>;
export type VideoEvent = LearningEvent<VideoSignal>;
export type NavigationEvent = LearningEvent<NavigationSignal>;

// ============================================================================
// Session Events
// ============================================================================

export interface SessionStartSignal {
    type: "sessionStart";
    timestamp: number;
    entryPoint: string; // Where the user entered from
    referrer?: string;
}

export interface SessionEndSignal {
    type: "sessionEnd";
    timestamp: number;
    exitPoint: string; // Last section before leaving
    totalDuration: number;
    eventCount: number;
}

export interface MilestoneSignal {
    type: "milestone";
    timestamp: number;
    milestoneType: "sectionComplete" | "chapterComplete" | "quizPassed" | "streakAchieved" | "levelUp";
    milestoneId: string;
    value?: number; // e.g., quiz score, streak days
}

export type ExtendedSignal = BehaviorSignal | SessionStartSignal | SessionEndSignal | MilestoneSignal;

// ============================================================================
// Event Factory Functions
// ============================================================================

let eventCounter = 0;

/**
 * Generate a unique event ID
 */
export function generateEventId(): LearningEventId {
    eventCounter++;
    return `evt_${Date.now()}_${eventCounter.toString(36)}`;
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): SessionId {
    return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Determine event category from signal type
 */
export function getEventCategory(signal: BehaviorSignal): EventCategory {
    switch (signal.type) {
        case "quiz":
            return "assessment";
        case "playground":
            return "practice";
        case "video":
        case "sectionTime":
            return "consumption";
        case "navigation":
            return "navigation";
        case "errorPattern":
            return "error";
        default:
            return "consumption";
    }
}

/**
 * Determine event significance based on signal content
 */
export function getEventSignificance(signal: BehaviorSignal): EventSignificance {
    switch (signal.type) {
        case "quiz": {
            const accuracy = signal.correctAnswers / signal.totalQuestions;
            if (accuracy >= 0.9 && signal.attemptsUsed === 1) return "breakthrough";
            if (accuracy >= 0.7) return "notable";
            if (accuracy < 0.4) return "struggle";
            return "routine";
        }
        case "playground": {
            const successRate = signal.runCount > 0 ? signal.successfulRuns / signal.runCount : 0;
            if (successRate >= 0.9 && signal.modificationsCount > 5) return "breakthrough";
            if (signal.errorCount > signal.runCount * 0.7) return "struggle";
            if (signal.modificationsCount > 3) return "notable";
            return "routine";
        }
        case "video": {
            if (signal.watchedPercentage >= 95) return "notable";
            if (signal.rewindCount > 5 || signal.pauseCount > 15) return "struggle";
            return "routine";
        }
        case "errorPattern": {
            if (signal.repeatedCount >= 3) return "struggle";
            return "routine";
        }
        case "navigation": {
            if (signal.isBackward && signal.timeInPreviousSection < 10000) return "struggle";
            return "routine";
        }
        case "sectionTime": {
            if (signal.completionPercentage >= 95 && signal.revisitCount === 0) return "notable";
            if (signal.revisitCount >= 3) return "struggle";
            return "routine";
        }
        default:
            return "routine";
    }
}

/**
 * Create a LearningEvent from a BehaviorSignal
 */
export function createLearningEvent(
    signal: BehaviorSignal,
    options: {
        sessionId: SessionId;
        courseId: string;
        userId?: string;
        previousEventId?: LearningEventId;
        context?: LearningEventContext;
    }
): LearningEvent {
    const id = generateEventId();
    const category = getEventCategory(signal);
    const significance = getEventSignificance(signal);

    return {
        meta: {
            id,
            sessionId: options.sessionId,
            userId: options.userId,
            courseId: options.courseId,
            category,
            significance,
            timestamp: signal.timestamp,
            previousEventId: options.previousEventId,
        },
        signal,
        context: options.context,
    };
}

/**
 * Create a milestone event
 */
export function createMilestoneEvent(
    milestoneType: MilestoneSignal["milestoneType"],
    milestoneId: string,
    options: {
        sessionId: SessionId;
        courseId: string;
        userId?: string;
        value?: number;
        context?: LearningEventContext;
    }
): LearningEvent<MilestoneSignal> {
    const signal: MilestoneSignal = {
        type: "milestone",
        timestamp: Date.now(),
        milestoneType,
        milestoneId,
        value: options.value,
    };

    return {
        meta: {
            id: generateEventId(),
            sessionId: options.sessionId,
            userId: options.userId,
            courseId: options.courseId,
            category: "milestone",
            significance: "breakthrough",
            timestamp: signal.timestamp,
        },
        signal,
        context: options.context,
    };
}

// ============================================================================
// Event Conversion Utilities
// ============================================================================

/**
 * Convert existing signal history to learning events
 */
export function signalsToEvents(
    signals: BehaviorSignal[],
    options: {
        sessionId: SessionId;
        courseId: string;
        userId?: string;
    }
): LearningEvent[] {
    const events: LearningEvent[] = [];
    let previousEventId: LearningEventId | undefined;

    for (const signal of signals) {
        const event = createLearningEvent(signal, {
            ...options,
            previousEventId,
        });
        events.push(event);
        previousEventId = event.meta.id;
    }

    return events;
}

/**
 * Extract signals from learning events (for backward compatibility)
 */
export function eventsToSignals(events: LearningEvent[]): BehaviorSignal[] {
    return events
        .filter((e) => "type" in e.signal && e.signal.type !== "sessionStart" && e.signal.type !== "sessionEnd")
        .map((e) => e.signal as BehaviorSignal);
}

// ============================================================================
// Event Query Helpers
// ============================================================================

/**
 * Filter events by category
 */
export function filterByCategory(events: LearningEvent[], category: EventCategory): LearningEvent[] {
    return events.filter((e) => e.meta.category === category);
}

/**
 * Filter events by significance
 */
export function filterBySignificance(
    events: LearningEvent[],
    significance: EventSignificance | EventSignificance[]
): LearningEvent[] {
    const significanceArray = Array.isArray(significance) ? significance : [significance];
    return events.filter((e) => significanceArray.includes(e.meta.significance));
}

/**
 * Filter events by time range
 */
export function filterByTimeRange(
    events: LearningEvent[],
    startTime: number,
    endTime: number
): LearningEvent[] {
    return events.filter((e) => e.meta.timestamp >= startTime && e.meta.timestamp <= endTime);
}

/**
 * Filter events by session
 */
export function filterBySession(events: LearningEvent[], sessionId: SessionId): LearningEvent[] {
    return events.filter((e) => e.meta.sessionId === sessionId);
}

/**
 * Get events for a specific section
 */
export function filterBySection(events: LearningEvent[], sectionId: string): LearningEvent[] {
    return events.filter((e) => {
        const signal = e.signal;
        if ("sectionId" in signal) return signal.sectionId === sectionId;
        if ("playgroundId" in signal) return signal.playgroundId.includes(sectionId);
        if ("fromSection" in signal || "toSection" in signal) {
            const nav = signal as NavigationSignal;
            return nav.fromSection === sectionId || nav.toSection === sectionId;
        }
        return false;
    });
}

// ============================================================================
// Event Sorting
// ============================================================================

/**
 * Sort events chronologically
 */
export function sortByTime(events: LearningEvent[], ascending = true): LearningEvent[] {
    return [...events].sort((a, b) => {
        const diff = a.meta.timestamp - b.meta.timestamp;
        return ascending ? diff : -diff;
    });
}

/**
 * Sort events by significance (most significant first)
 */
export function sortBySignificance(events: LearningEvent[]): LearningEvent[] {
    const order: Record<EventSignificance, number> = {
        breakthrough: 0,
        struggle: 1,
        notable: 2,
        routine: 3,
    };
    return [...events].sort((a, b) => order[a.meta.significance] - order[b.meta.significance]);
}
