// @ts-nocheck
/**
 * Event Store
 *
 * Persistent storage and management for Learning Events.
 * Enables event replay, session reconstruction, and journey tracking.
 */

import type { BehaviorSignal } from "./types";
import type {
    LearningEvent,
    LearningEventId,
    SessionId,
    EventCategory,
    EventSignificance,
    LearningEventContext,
} from "./learningEvents";
import {
    generateSessionId,
    createLearningEvent,
    createMilestoneEvent,
    signalsToEvents,
    eventsToSignals,
    filterBySession,
    filterByTimeRange,
    sortByTime,
} from "./learningEvents";
import type { MilestoneSignal } from "./learningEvents";

// ============================================================================
// Storage Constants
// ============================================================================

const EVENT_STORE_KEY = "learning-event-store";
const EVENT_STORE_VERSION = 1;
const MAX_EVENTS_PER_COURSE = 1000;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// ============================================================================
// Storage Types
// ============================================================================

export interface StoredEventData {
    version: number;
    events: LearningEvent[];
    sessions: SessionMetadata[];
    lastUpdated: number;
}

export interface SessionMetadata {
    id: SessionId;
    courseId: string;
    userId?: string;
    startTime: number;
    endTime?: number;
    eventCount: number;
    categories: Record<EventCategory, number>;
    significanceBreakdown: Record<EventSignificance, number>;
}

export interface EventStoreStats {
    totalEvents: number;
    totalSessions: number;
    eventsByCategory: Record<EventCategory, number>;
    eventsBySignificance: Record<EventSignificance, number>;
    timeRange: { start: number; end: number } | null;
    averageEventsPerSession: number;
}

// ============================================================================
// Event Store Class
// ============================================================================

export class EventStore {
    private courseId: string;
    private userId?: string;
    private events: LearningEvent[] = [];
    private sessions: SessionMetadata[] = [];
    private currentSession: SessionMetadata | null = null;
    private lastEventId: LearningEventId | undefined;
    private saveTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private eventListeners: Map<string, Set<(event: LearningEvent) => void>> = new Map();

    constructor(courseId: string, userId?: string) {
        this.courseId = courseId;
        this.userId = userId;
        this.load();
        this.initializeSession();
    }

    // ============================================================================
    // Session Management
    // ============================================================================

    private initializeSession(): void {
        // Check if we can resume the last session
        const lastSession = this.sessions[this.sessions.length - 1];
        const now = Date.now();

        if (lastSession && !lastSession.endTime && now - lastSession.startTime < SESSION_TIMEOUT_MS) {
            // Resume existing session
            this.currentSession = lastSession;
        } else {
            // Start new session
            this.startNewSession();
        }
    }

    private startNewSession(): void {
        const sessionId = generateSessionId();
        this.currentSession = {
            id: sessionId,
            courseId: this.courseId,
            userId: this.userId,
            startTime: Date.now(),
            eventCount: 0,
            categories: {} as Record<EventCategory, number>,
            significanceBreakdown: {} as Record<EventSignificance, number>,
        };
        this.sessions.push(this.currentSession);
        this.debouncedSave();
    }

    /**
     * End the current session
     */
    endSession(): void {
        if (this.currentSession) {
            this.currentSession.endTime = Date.now();
            this.debouncedSave();
        }
    }

    /**
     * Get the current session ID
     */
    getCurrentSessionId(): SessionId | null {
        return this.currentSession?.id ?? null;
    }

    /**
     * Get current session metadata
     */
    getCurrentSession(): SessionMetadata | null {
        return this.currentSession;
    }

    /**
     * Get all session metadata
     */
    getSessions(): SessionMetadata[] {
        return [...this.sessions];
    }

    // ============================================================================
    // Event Recording
    // ============================================================================

    /**
     * Record a behavior signal as a learning event
     */
    recordSignal(signal: BehaviorSignal, context?: LearningEventContext): LearningEvent {
        if (!this.currentSession) {
            this.startNewSession();
        }

        const event = createLearningEvent(signal, {
            sessionId: this.currentSession!.id,
            courseId: this.courseId,
            userId: this.userId,
            previousEventId: this.lastEventId,
            context: {
                ...context,
                sessionDuration: Date.now() - this.currentSession!.startTime,
                sessionEventCount: this.currentSession!.eventCount,
            },
        });

        this.addEvent(event);
        return event;
    }

    /**
     * Record a milestone event
     */
    recordMilestone(
        milestoneType: MilestoneSignal["milestoneType"],
        milestoneId: string,
        value?: number,
        context?: LearningEventContext
    ): LearningEvent<MilestoneSignal> {
        if (!this.currentSession) {
            this.startNewSession();
        }

        const event = createMilestoneEvent(milestoneType, milestoneId, {
            sessionId: this.currentSession!.id,
            courseId: this.courseId,
            userId: this.userId,
            value,
            context,
        });

        this.addEvent(event);
        return event as LearningEvent<MilestoneSignal>;
    }

    private addEvent(event: LearningEvent): void {
        this.events.push(event);
        this.lastEventId = event.meta.id;

        // Update session metadata
        if (this.currentSession) {
            this.currentSession.eventCount++;
            const cat = event.meta.category;
            this.currentSession.categories[cat] = (this.currentSession.categories[cat] || 0) + 1;
            const sig = event.meta.significance;
            this.currentSession.significanceBreakdown[sig] =
                (this.currentSession.significanceBreakdown[sig] || 0) + 1;
        }

        // Emit event to listeners
        this.emitEvent(event);

        // Prune old events if needed
        this.pruneEvents();

        // Save to storage
        this.debouncedSave();
    }

    // ============================================================================
    // Event Retrieval
    // ============================================================================

    /**
     * Get all events
     */
    getAllEvents(): LearningEvent[] {
        return [...this.events];
    }

    /**
     * Get event by ID
     */
    getEventById(id: LearningEventId): LearningEvent | undefined {
        return this.events.find((e) => e.meta.id === id);
    }

    /**
     * Get events for current session
     */
    getCurrentSessionEvents(): LearningEvent[] {
        if (!this.currentSession) return [];
        return filterBySession(this.events, this.currentSession.id);
    }

    /**
     * Get events for a specific session
     */
    getSessionEvents(sessionId: SessionId): LearningEvent[] {
        return filterBySession(this.events, sessionId);
    }

    /**
     * Get events in a time range
     */
    getEventsInRange(startTime: number, endTime: number): LearningEvent[] {
        return filterByTimeRange(this.events, startTime, endTime);
    }

    /**
     * Get recent events
     */
    getRecentEvents(count: number): LearningEvent[] {
        return sortByTime(this.events, false).slice(0, count);
    }

    /**
     * Get events for today
     */
    getTodaysEvents(): LearningEvent[] {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfDay = today.getTime();
        const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
        return filterByTimeRange(this.events, startOfDay, endOfDay);
    }

    // ============================================================================
    // Event Replay
    // ============================================================================

    /**
     * Replay events in order, calling the callback for each
     */
    replayEvents(
        callback: (event: LearningEvent, index: number, total: number) => void,
        options?: {
            sessionId?: SessionId;
            startTime?: number;
            endTime?: number;
            categories?: EventCategory[];
            significances?: EventSignificance[];
        }
    ): void {
        let events = sortByTime(this.events, true);

        if (options?.sessionId) {
            events = filterBySession(events, options.sessionId);
        }
        if (options?.startTime !== undefined && options?.endTime !== undefined) {
            events = filterByTimeRange(events, options.startTime, options.endTime);
        }
        if (options?.categories) {
            events = events.filter((e) => options.categories!.includes(e.meta.category));
        }
        if (options?.significances) {
            events = events.filter((e) => options.significances!.includes(e.meta.significance));
        }

        events.forEach((event, index) => {
            callback(event, index, events.length);
        });
    }

    /**
     * Reconstruct learner journey as a timeline
     */
    reconstructJourney(sessionId?: SessionId): LearningEvent[] {
        const events = sessionId ? filterBySession(this.events, sessionId) : this.events;
        return sortByTime(events, true);
    }

    // ============================================================================
    // Convert to Signals (backward compatibility)
    // ============================================================================

    /**
     * Get signals from events (for use with existing comprehension engine)
     */
    getSignals(): BehaviorSignal[] {
        return eventsToSignals(this.events);
    }

    /**
     * Import existing signals as events
     */
    importSignals(signals: BehaviorSignal[]): void {
        if (!this.currentSession) {
            this.startNewSession();
        }

        const newEvents = signalsToEvents(signals, {
            sessionId: this.currentSession!.id,
            courseId: this.courseId,
            userId: this.userId,
        });

        for (const event of newEvents) {
            this.addEvent(event);
        }
    }

    // ============================================================================
    // Statistics
    // ============================================================================

    /**
     * Get store statistics
     */
    getStats(): EventStoreStats {
        const eventsByCategory: Record<EventCategory, number> = {
            assessment: 0,
            practice: 0,
            consumption: 0,
            navigation: 0,
            error: 0,
            milestone: 0,
            session: 0,
        };
        const eventsBySignificance: Record<EventSignificance, number> = {
            routine: 0,
            notable: 0,
            breakthrough: 0,
            struggle: 0,
        };

        for (const event of this.events) {
            eventsByCategory[event.meta.category]++;
            eventsBySignificance[event.meta.significance]++;
        }

        const sortedEvents = sortByTime(this.events, true);
        const timeRange =
            sortedEvents.length > 0
                ? {
                      start: sortedEvents[0].meta.timestamp,
                      end: sortedEvents[sortedEvents.length - 1].meta.timestamp,
                  }
                : null;

        const completedSessions = this.sessions.filter((s) => s.endTime);
        const averageEventsPerSession =
            completedSessions.length > 0
                ? completedSessions.reduce((sum, s) => sum + s.eventCount, 0) / completedSessions.length
                : 0;

        return {
            totalEvents: this.events.length,
            totalSessions: this.sessions.length,
            eventsByCategory,
            eventsBySignificance,
            timeRange,
            averageEventsPerSession,
        };
    }

    // ============================================================================
    // Event Listeners
    // ============================================================================

    /**
     * Subscribe to new events
     */
    subscribe(category: EventCategory | "*", callback: (event: LearningEvent) => void): () => void {
        const key = category;
        if (!this.eventListeners.has(key)) {
            this.eventListeners.set(key, new Set());
        }
        this.eventListeners.get(key)!.add(callback);

        // Return unsubscribe function
        return () => {
            this.eventListeners.get(key)?.delete(callback);
        };
    }

    private emitEvent(event: LearningEvent): void {
        // Emit to specific category listeners
        this.eventListeners.get(event.meta.category)?.forEach((cb) => cb(event));
        // Emit to all-event listeners
        this.eventListeners.get("*")?.forEach((cb) => cb(event));
    }

    // ============================================================================
    // Storage
    // ============================================================================

    private getStorageKey(): string {
        return `${EVENT_STORE_KEY}-${this.courseId}`;
    }

    private load(): void {
        if (typeof window === "undefined") return;

        try {
            const stored = localStorage.getItem(this.getStorageKey());
            if (!stored) return;

            const data: StoredEventData = JSON.parse(stored);

            // Handle version migrations if needed
            if (data.version < EVENT_STORE_VERSION) {
                console.log(`Migrating event store from v${data.version} to v${EVENT_STORE_VERSION}`);
            }

            this.events = data.events || [];
            this.sessions = data.sessions || [];

            // Find last event ID
            if (this.events.length > 0) {
                const sorted = sortByTime(this.events, false);
                this.lastEventId = sorted[0].meta.id;
            }
        } catch (error) {
            console.warn("Failed to load event store:", error);
        }
    }

    private save(): void {
        if (typeof window === "undefined") return;

        try {
            const data: StoredEventData = {
                version: EVENT_STORE_VERSION,
                events: this.events,
                sessions: this.sessions,
                lastUpdated: Date.now(),
            };
            localStorage.setItem(this.getStorageKey(), JSON.stringify(data));
        } catch (error) {
            console.warn("Failed to save event store:", error);
        }
    }

    private debouncedSave(): void {
        if (this.saveTimeoutId) {
            clearTimeout(this.saveTimeoutId);
        }
        this.saveTimeoutId = setTimeout(() => {
            this.save();
            this.saveTimeoutId = null;
        }, 500);
    }

    private pruneEvents(): void {
        if (this.events.length > MAX_EVENTS_PER_COURSE) {
            // Keep most recent events
            const sorted = sortByTime(this.events, false);
            this.events = sorted.slice(0, MAX_EVENTS_PER_COURSE);
        }
    }

    // ============================================================================
    // Clear & Export
    // ============================================================================

    /**
     * Clear all events
     */
    clear(): void {
        this.events = [];
        this.sessions = [];
        this.currentSession = null;
        this.lastEventId = undefined;
        if (typeof window !== "undefined") {
            localStorage.removeItem(this.getStorageKey());
        }
        this.startNewSession();
    }

    /**
     * Export all data for backup
     */
    export(): StoredEventData {
        return {
            version: EVENT_STORE_VERSION,
            events: this.events,
            sessions: this.sessions,
            lastUpdated: Date.now(),
        };
    }

    /**
     * Import data from backup
     */
    import(data: StoredEventData): boolean {
        try {
            if (!data.events || !Array.isArray(data.events)) {
                throw new Error("Invalid event data format");
            }
            this.events = data.events;
            this.sessions = data.sessions || [];
            this.save();
            this.initializeSession();
            return true;
        } catch (error) {
            console.warn("Failed to import event data:", error);
            return false;
        }
    }

    /**
     * Force save (for cleanup on unmount)
     */
    forceSave(): void {
        if (this.saveTimeoutId) {
            clearTimeout(this.saveTimeoutId);
            this.saveTimeoutId = null;
        }
        this.save();
    }
}

// ============================================================================
// Factory Function
// ============================================================================

const storeCache = new Map<string, EventStore>();

/**
 * Get or create an event store for a course
 */
export function getEventStore(courseId: string, userId?: string): EventStore {
    const key = `${courseId}-${userId ?? "anonymous"}`;
    if (!storeCache.has(key)) {
        storeCache.set(key, new EventStore(courseId, userId));
    }
    return storeCache.get(key)!;
}

/**
 * Clear cached stores (for testing or cleanup)
 */
export function clearEventStoreCache(): void {
    storeCache.forEach((store) => store.forceSave());
    storeCache.clear();
}
