/**
 * Timeline Analysis
 *
 * Utilities for analyzing learning events over time, discovering patterns,
 * and providing insights into learner behavior.
 */

import type { LearningEvent, EventCategory, EventSignificance } from "./learningEvents";
import { sortByTime, filterByTimeRange, filterByCategory, filterBySignificance } from "./learningEvents";

// ============================================================================
// Timeline Types
// ============================================================================

export interface TimelineSegment {
    startTime: number;
    endTime: number;
    events: LearningEvent[];
    summary: SegmentSummary;
}

export interface SegmentSummary {
    totalEvents: number;
    dominantCategory: EventCategory;
    dominantSignificance: EventSignificance;
    score: number; // Aggregate performance score 0-100
    trend: "improving" | "stable" | "declining";
}

export interface LearningPattern {
    type: PatternType;
    confidence: number; // 0-1
    description: string;
    events: LearningEvent[];
    startTime: number;
    endTime: number;
    recommendation?: string;
}

export type PatternType =
    | "plateau" // Performance flattening
    | "breakthrough" // Sudden improvement
    | "struggle" // Consistent difficulties
    | "speedup" // Accelerating progress
    | "slowdown" // Decelerating progress
    | "inconsistent" // Variable performance
    | "review_heavy" // Lots of revisiting
    | "error_prone" // Frequent errors
    | "quiz_master" // Strong quiz performance
    | "explorer" // Lots of code experimentation
    | "video_dependent" // Relies heavily on videos
    | "fast_learner" // Completes quickly with good results
    | "thorough" // Takes time, revisits, but achieves mastery
    | "distracted"; // Short sessions, frequent navigations

export interface TimelineInsight {
    type: "positive" | "neutral" | "warning";
    title: string;
    description: string;
    supportingEvents: LearningEvent[];
    timestamp: number;
}

export interface LearnerProfile {
    learningStyle: "visual" | "practice" | "quiz" | "balanced";
    pacePreference: "fast" | "moderate" | "thorough";
    strengthAreas: EventCategory[];
    challengeAreas: EventCategory[];
    optimalSessionLength: number; // minutes
    bestPerformanceTime: "morning" | "afternoon" | "evening" | "night" | "unknown";
}

// ============================================================================
// Timeline Segmentation
// ============================================================================

/**
 * Segment events into time-based chunks for analysis
 */
export function segmentTimeline(
    events: LearningEvent[],
    segmentDuration: number = 24 * 60 * 60 * 1000 // Default: 1 day
): TimelineSegment[] {
    if (events.length === 0) return [];

    const sorted = sortByTime(events, true);
    const segments: TimelineSegment[] = [];

    let currentStart = sorted[0].meta.timestamp;
    let currentEnd = currentStart + segmentDuration;
    let currentEvents: LearningEvent[] = [];

    for (const event of sorted) {
        if (event.meta.timestamp >= currentEnd) {
            // Save current segment
            if (currentEvents.length > 0) {
                segments.push({
                    startTime: currentStart,
                    endTime: currentEnd,
                    events: currentEvents,
                    summary: summarizeSegment(currentEvents),
                });
            }
            // Start new segment
            currentStart = currentEnd;
            currentEnd = currentStart + segmentDuration;
            currentEvents = [];
        }
        currentEvents.push(event);
    }

    // Save last segment
    if (currentEvents.length > 0) {
        segments.push({
            startTime: currentStart,
            endTime: Math.max(currentEnd, sorted[sorted.length - 1].meta.timestamp),
            events: currentEvents,
            summary: summarizeSegment(currentEvents),
        });
    }

    return segments;
}

/**
 * Summarize a segment's events
 */
function summarizeSegment(events: LearningEvent[]): SegmentSummary {
    const categoryCounts: Record<EventCategory, number> = {
        assessment: 0,
        practice: 0,
        consumption: 0,
        navigation: 0,
        error: 0,
        milestone: 0,
        session: 0,
    };
    const significanceCounts: Record<EventSignificance, number> = {
        routine: 0,
        notable: 0,
        breakthrough: 0,
        struggle: 0,
    };

    for (const event of events) {
        categoryCounts[event.meta.category]++;
        significanceCounts[event.meta.significance]++;
    }

    const dominantCategory = Object.entries(categoryCounts).reduce((a, b) =>
        a[1] > b[1] ? a : b
    )[0] as EventCategory;
    const dominantSignificance = Object.entries(significanceCounts).reduce((a, b) =>
        a[1] > b[1] ? a : b
    )[0] as EventSignificance;

    // Calculate aggregate score
    const score = calculateSegmentScore(events, significanceCounts);

    // Determine trend (compare first half to second half)
    const midpoint = Math.floor(events.length / 2);
    const firstHalf = events.slice(0, midpoint);
    const secondHalf = events.slice(midpoint);
    const firstScore = calculateSegmentScore(firstHalf, getSignificanceCounts(firstHalf));
    const secondScore = calculateSegmentScore(secondHalf, getSignificanceCounts(secondHalf));
    const trend: SegmentSummary["trend"] =
        secondScore > firstScore + 5 ? "improving" : secondScore < firstScore - 5 ? "declining" : "stable";

    return {
        totalEvents: events.length,
        dominantCategory,
        dominantSignificance,
        score,
        trend,
    };
}

function getSignificanceCounts(events: LearningEvent[]): Record<EventSignificance, number> {
    const counts: Record<EventSignificance, number> = {
        routine: 0,
        notable: 0,
        breakthrough: 0,
        struggle: 0,
    };
    for (const event of events) {
        counts[event.meta.significance]++;
    }
    return counts;
}

function calculateSegmentScore(
    events: LearningEvent[],
    significanceCounts: Record<EventSignificance, number>
): number {
    if (events.length === 0) return 50;

    const total = events.length;
    const breakthroughRatio = significanceCounts.breakthrough / total;
    const notableRatio = significanceCounts.notable / total;
    const struggleRatio = significanceCounts.struggle / total;

    // Base score + positive contributions - negative
    const score = 50 + breakthroughRatio * 40 + notableRatio * 20 - struggleRatio * 30;

    return Math.max(0, Math.min(100, score));
}

// ============================================================================
// Pattern Discovery
// ============================================================================

/**
 * Discover learning patterns from events
 */
export function discoverPatterns(events: LearningEvent[]): LearningPattern[] {
    if (events.length < 5) return [];

    const patterns: LearningPattern[] = [];
    const sorted = sortByTime(events, true);

    // Check for plateaus
    const plateau = detectPlateau(sorted);
    if (plateau) patterns.push(plateau);

    // Check for breakthroughs
    const breakthrough = detectBreakthrough(sorted);
    if (breakthrough) patterns.push(breakthrough);

    // Check for struggle patterns
    const struggle = detectStruggle(sorted);
    if (struggle) patterns.push(struggle);

    // Check for speedup/slowdown
    const pacePattern = detectPaceChange(sorted);
    if (pacePattern) patterns.push(pacePattern);

    // Check for learning style patterns
    const stylePattern = detectLearningStyle(sorted);
    if (stylePattern) patterns.push(stylePattern);

    // Check for distraction pattern
    const distraction = detectDistraction(sorted);
    if (distraction) patterns.push(distraction);

    return patterns.sort((a, b) => b.confidence - a.confidence);
}

function detectPlateau(events: LearningEvent[]): LearningPattern | null {
    const segments = segmentTimeline(events, 24 * 60 * 60 * 1000);
    if (segments.length < 3) return null;

    const recentSegments = segments.slice(-5);
    const scores = recentSegments.map((s) => s.summary.score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((acc, s) => acc + Math.pow(s - avgScore, 2), 0) / scores.length;

    // Low variance + not high score = plateau
    if (variance < 25 && avgScore < 70) {
        const relatedEvents = recentSegments.flatMap((s) => s.events);
        return {
            type: "plateau",
            confidence: Math.min(0.9, 1 - variance / 100),
            description: "Your performance has plateaued. Consider trying different approaches or revisiting foundational concepts.",
            events: relatedEvents,
            startTime: recentSegments[0].startTime,
            endTime: recentSegments[recentSegments.length - 1].endTime,
            recommendation: "Try breaking out of your comfort zone with more challenging exercises or reviewing basics.",
        };
    }

    return null;
}

function detectBreakthrough(events: LearningEvent[]): LearningPattern | null {
    const breakthroughEvents = filterBySignificance(events, "breakthrough");
    if (breakthroughEvents.length < 2) return null;

    // Check for cluster of breakthroughs
    const sorted = sortByTime(breakthroughEvents, true);
    const recentBreakthroughs = sorted.slice(-5);

    if (recentBreakthroughs.length >= 2) {
        const timespan =
            recentBreakthroughs[recentBreakthroughs.length - 1].meta.timestamp -
            recentBreakthroughs[0].meta.timestamp;
        const densityDays = timespan / (24 * 60 * 60 * 1000);

        if (densityDays < 3 || recentBreakthroughs.length >= 3) {
            return {
                type: "breakthrough",
                confidence: Math.min(0.95, 0.6 + recentBreakthroughs.length * 0.1),
                description: "Great progress! You've had multiple breakthrough moments recently.",
                events: recentBreakthroughs,
                startTime: recentBreakthroughs[0].meta.timestamp,
                endTime: recentBreakthroughs[recentBreakthroughs.length - 1].meta.timestamp,
                recommendation: "Keep up the momentum! This is a great time to tackle more advanced topics.",
            };
        }
    }

    return null;
}

function detectStruggle(events: LearningEvent[]): LearningPattern | null {
    const struggleEvents = filterBySignificance(events, "struggle");
    if (struggleEvents.length < 3) return null;

    const sorted = sortByTime(struggleEvents, true);
    const recentStruggles = sorted.slice(-10);

    // Check struggle density in recent events
    const recentTotal = sortByTime(events, false).slice(0, 20);
    const struggleRatio = recentStruggles.length / Math.max(recentTotal.length, 1);

    if (struggleRatio > 0.3) {
        return {
            type: "struggle",
            confidence: Math.min(0.9, struggleRatio + 0.3),
            description: "You seem to be facing some challenges. This is normal and part of learning.",
            events: recentStruggles,
            startTime: recentStruggles[0].meta.timestamp,
            endTime: recentStruggles[recentStruggles.length - 1].meta.timestamp,
            recommendation:
                "Consider slowing down, reviewing prerequisites, or trying simpler exercises before tackling complex topics.",
        };
    }

    return null;
}

function detectPaceChange(events: LearningEvent[]): LearningPattern | null {
    const segments = segmentTimeline(events, 24 * 60 * 60 * 1000);
    if (segments.length < 3) return null;

    const eventCounts = segments.map((s) => s.events.length);
    const recentCounts = eventCounts.slice(-5);
    const olderCounts = eventCounts.slice(-10, -5);

    if (recentCounts.length === 0 || olderCounts.length === 0) return null;

    const recentAvg = recentCounts.reduce((a, b) => a + b, 0) / recentCounts.length;
    const olderAvg = olderCounts.reduce((a, b) => a + b, 0) / olderCounts.length;

    if (recentAvg > olderAvg * 1.5 && olderAvg > 0) {
        const relatedEvents = segments.slice(-5).flatMap((s) => s.events);
        return {
            type: "speedup",
            confidence: Math.min(0.85, (recentAvg / olderAvg - 1) * 0.5 + 0.5),
            description: "Your learning pace has accelerated significantly!",
            events: relatedEvents,
            startTime: segments[segments.length - 5]?.startTime ?? segments[0].startTime,
            endTime: segments[segments.length - 1].endTime,
            recommendation: "Great momentum! Just ensure you're retaining what you learn.",
        };
    }

    if (olderAvg > recentAvg * 1.5 && recentAvg > 0) {
        const relatedEvents = segments.slice(-5).flatMap((s) => s.events);
        return {
            type: "slowdown",
            confidence: Math.min(0.85, (olderAvg / recentAvg - 1) * 0.5 + 0.5),
            description: "Your learning pace has slowed down recently.",
            events: relatedEvents,
            startTime: segments[segments.length - 5]?.startTime ?? segments[0].startTime,
            endTime: segments[segments.length - 1].endTime,
            recommendation: "It's okay to take breaks. When ready, try setting small daily goals.",
        };
    }

    return null;
}

function detectLearningStyle(events: LearningEvent[]): LearningPattern | null {
    const categoryCounts: Record<EventCategory, number> = {
        assessment: 0,
        practice: 0,
        consumption: 0,
        navigation: 0,
        error: 0,
        milestone: 0,
        session: 0,
    };

    for (const event of events) {
        categoryCounts[event.meta.category]++;
    }

    const total = events.length;
    const practiceRatio = categoryCounts.practice / total;
    const assessmentRatio = categoryCounts.assessment / total;
    const consumptionRatio = categoryCounts.consumption / total;

    if (practiceRatio > 0.4) {
        const practiceEvents = filterByCategory(events, "practice");
        return {
            type: "explorer",
            confidence: practiceRatio,
            description: "You learn best through hands-on practice and experimentation.",
            events: practiceEvents.slice(-20),
            startTime: events[0].meta.timestamp,
            endTime: events[events.length - 1].meta.timestamp,
        };
    }

    if (consumptionRatio > 0.5) {
        const videoEvents = filterByCategory(events, "consumption");
        return {
            type: "video_dependent",
            confidence: consumptionRatio,
            description: "You prefer learning through videos and reading materials.",
            events: videoEvents.slice(-20),
            startTime: events[0].meta.timestamp,
            endTime: events[events.length - 1].meta.timestamp,
            recommendation: "Try mixing in more practice exercises to reinforce concepts.",
        };
    }

    if (assessmentRatio > 0.3) {
        const assessmentEvents = filterByCategory(events, "assessment");
        const breakthroughs = filterBySignificance(assessmentEvents, "breakthrough");
        if (breakthroughs.length > assessmentEvents.length * 0.3) {
            return {
                type: "quiz_master",
                confidence: assessmentRatio,
                description: "You excel at assessments and knowledge checks!",
                events: assessmentEvents.slice(-20),
                startTime: events[0].meta.timestamp,
                endTime: events[events.length - 1].meta.timestamp,
            };
        }
    }

    return null;
}

function detectDistraction(events: LearningEvent[]): LearningPattern | null {
    const navigationEvents = filterByCategory(events, "navigation");
    const total = events.length;

    if (navigationEvents.length / total > 0.4) {
        return {
            type: "distracted",
            confidence: navigationEvents.length / total,
            description: "You have frequent navigation between sections without completing them.",
            events: navigationEvents.slice(-20),
            startTime: events[0].meta.timestamp,
            endTime: events[events.length - 1].meta.timestamp,
            recommendation: "Try focusing on one section at a time before moving on.",
        };
    }

    return null;
}

// ============================================================================
// Insight Generation
// ============================================================================

/**
 * Generate actionable insights from events
 */
export function generateInsights(events: LearningEvent[]): TimelineInsight[] {
    const insights: TimelineInsight[] = [];
    const patterns = discoverPatterns(events);

    for (const pattern of patterns) {
        let type: TimelineInsight["type"] = "neutral";
        if (["breakthrough", "speedup", "quiz_master", "explorer", "fast_learner"].includes(pattern.type)) {
            type = "positive";
        } else if (["struggle", "plateau", "distracted", "error_prone"].includes(pattern.type)) {
            type = "warning";
        }

        insights.push({
            type,
            title: patternTypeToTitle(pattern.type),
            description: pattern.recommendation ?? pattern.description,
            supportingEvents: pattern.events.slice(0, 5),
            timestamp: pattern.endTime,
        });
    }

    // Add milestone insights
    const milestoneEvents = events.filter(
        (e) => e.meta.category === "milestone" && e.meta.significance === "breakthrough"
    );
    for (const milestone of milestoneEvents.slice(-3)) {
        insights.push({
            type: "positive",
            title: "Achievement Unlocked",
            description: `You reached a milestone: ${milestone.signal.type}`,
            supportingEvents: [milestone],
            timestamp: milestone.meta.timestamp,
        });
    }

    return insights.sort((a, b) => b.timestamp - a.timestamp);
}

function patternTypeToTitle(type: PatternType): string {
    const titles: Record<PatternType, string> = {
        plateau: "Learning Plateau Detected",
        breakthrough: "Breakthrough Moment!",
        struggle: "Challenge Ahead",
        speedup: "Accelerated Progress",
        slowdown: "Pace Change Noticed",
        inconsistent: "Variable Performance",
        review_heavy: "Revision Mode",
        error_prone: "Error Patterns",
        quiz_master: "Assessment Champion",
        explorer: "Hands-On Learner",
        video_dependent: "Visual Learner",
        fast_learner: "Quick Learner",
        thorough: "Thorough Approach",
        distracted: "Focus Opportunity",
    };
    return titles[type] || type;
}

// ============================================================================
// Learner Profile
// ============================================================================

/**
 * Build a learner profile from event history
 */
export function buildLearnerProfile(events: LearningEvent[]): LearnerProfile {
    const categoryCounts: Record<EventCategory, number> = {
        assessment: 0,
        practice: 0,
        consumption: 0,
        navigation: 0,
        error: 0,
        milestone: 0,
        session: 0,
    };
    const categoryPerformance: Record<EventCategory, number[]> = {
        assessment: [],
        practice: [],
        consumption: [],
        navigation: [],
        error: [],
        milestone: [],
        session: [],
    };

    for (const event of events) {
        categoryCounts[event.meta.category]++;
        const score = significanceToScore(event.meta.significance);
        categoryPerformance[event.meta.category].push(score);
    }

    // Determine learning style
    const total = events.length || 1;
    const practiceRatio = categoryCounts.practice / total;
    const assessmentRatio = categoryCounts.assessment / total;
    const consumptionRatio = categoryCounts.consumption / total;

    let learningStyle: LearnerProfile["learningStyle"] = "balanced";
    if (practiceRatio > 0.35) learningStyle = "practice";
    else if (consumptionRatio > 0.45) learningStyle = "visual";
    else if (assessmentRatio > 0.3) learningStyle = "quiz";

    // Determine pace preference
    const segments = segmentTimeline(events, 60 * 60 * 1000); // Hourly segments
    const avgEventsPerHour = segments.length > 0 ? events.length / segments.length : 0;
    let pacePreference: LearnerProfile["pacePreference"] = "moderate";
    if (avgEventsPerHour > 15) pacePreference = "fast";
    else if (avgEventsPerHour < 5) pacePreference = "thorough";

    // Find strength and challenge areas
    const categoryAvgs: [EventCategory, number][] = Object.entries(categoryPerformance)
        .filter(([, scores]) => scores.length > 0)
        .map(([cat, scores]) => [
            cat as EventCategory,
            scores.reduce((a, b) => a + b, 0) / scores.length,
        ]);

    categoryAvgs.sort((a, b) => b[1] - a[1]);
    const strengthAreas = categoryAvgs.slice(0, 2).map(([cat]) => cat);
    const challengeAreas = categoryAvgs.slice(-2).map(([cat]) => cat);

    // Estimate optimal session length
    const sessionDurations = segments
        .filter((s) => s.events.length > 2)
        .map((s) => (s.endTime - s.startTime) / (60 * 1000));
    const optimalSessionLength =
        sessionDurations.length > 0
            ? Math.round(sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length)
            : 30;

    // Determine best performance time
    const hourPerformance: number[][] = Array.from({ length: 24 }, () => []);
    for (const event of events) {
        const hour = new Date(event.meta.timestamp).getHours();
        hourPerformance[hour].push(significanceToScore(event.meta.significance));
    }

    const hourAvgs = hourPerformance.map((scores) =>
        scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    );
    const bestHour = hourAvgs.indexOf(Math.max(...hourAvgs));
    let bestPerformanceTime: LearnerProfile["bestPerformanceTime"] = "unknown";
    if (hourAvgs[bestHour] > 0) {
        if (bestHour >= 5 && bestHour < 12) bestPerformanceTime = "morning";
        else if (bestHour >= 12 && bestHour < 17) bestPerformanceTime = "afternoon";
        else if (bestHour >= 17 && bestHour < 21) bestPerformanceTime = "evening";
        else bestPerformanceTime = "night";
    }

    return {
        learningStyle,
        pacePreference,
        strengthAreas,
        challengeAreas,
        optimalSessionLength,
        bestPerformanceTime,
    };
}

function significanceToScore(significance: EventSignificance): number {
    const scores: Record<EventSignificance, number> = {
        breakthrough: 100,
        notable: 75,
        routine: 50,
        struggle: 25,
    };
    return scores[significance];
}

// ============================================================================
// Correlation Discovery
// ============================================================================

/**
 * Find correlations between events
 */
export function findEventCorrelations(events: LearningEvent[]): Array<{
    cause: EventCategory;
    effect: EventCategory;
    strength: number; // -1 to 1
    description: string;
}> {
    const correlations: Array<{
        cause: EventCategory;
        effect: EventCategory;
        strength: number;
        description: string;
    }> = [];

    const sorted = sortByTime(events, true);

    // Look for patterns where one event type precedes another
    const transitionCounts: Record<string, { total: number; positive: number }> = {};

    for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];
        const key = `${current.meta.category}->${next.meta.category}`;

        if (!transitionCounts[key]) {
            transitionCounts[key] = { total: 0, positive: 0 };
        }
        transitionCounts[key].total++;

        // Positive outcome if next event is notable/breakthrough
        if (next.meta.significance === "notable" || next.meta.significance === "breakthrough") {
            transitionCounts[key].positive++;
        }
    }

    // Convert to correlations
    for (const [key, counts] of Object.entries(transitionCounts)) {
        if (counts.total < 5) continue; // Need minimum sample size

        const [cause, effect] = key.split("->") as [EventCategory, EventCategory];
        const positiveRatio = counts.positive / counts.total;
        const strength = positiveRatio * 2 - 1; // Convert to -1 to 1 scale

        if (Math.abs(strength) > 0.3) {
            correlations.push({
                cause,
                effect,
                strength,
                description:
                    strength > 0
                        ? `${cause} activities tend to lead to better ${effect} outcomes`
                        : `${cause} activities may not prepare well for ${effect}`,
            });
        }
    }

    return correlations.sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength));
}
