/**
 * Temporal Pattern Analyzer
 *
 * Analyzes temporal patterns across signals to detect pre-struggle indicators.
 * Uses timing metadata, sequence analysis, and pattern matching to identify
 * learners who are likely to struggle BEFORE the struggle manifests.
 */

import type { BehaviorSignal, QuizSignal, PlaygroundSignal, VideoSignal, NavigationSignal } from "./types";
import type {
    TemporalSignal,
    PreStruggleIndicator,
    PreStruggleSignal,
    PreStruggleEvidence,
    QuizHesitationPattern,
    ErrorSequencePattern,
    VideoEngagementPattern,
    NavigationBehaviorPattern,
    StruggeSeverity,
    PredictiveConfig,
    DEFAULT_PREDICTIVE_CONFIG,
} from "./predictiveLearning.types";

// ============================================================================
// Signal Enrichment
// ============================================================================

/**
 * Convert raw signals to temporal signals with timing metadata
 */
export function enrichSignalsWithTemporal(
    signals: BehaviorSignal[],
    sessionStartTime: number
): TemporalSignal[] {
    if (signals.length === 0) return [];

    const sorted = [...signals].sort((a, b) => a.timestamp - b.timestamp);
    const temporalSignals: TemporalSignal[] = [];

    for (let i = 0; i < sorted.length; i++) {
        const signal = sorted[i];
        const previous = i > 0 ? sorted[i - 1] : null;

        // Calculate section progress if applicable
        let sectionProgress = 0;
        if ("completionPercentage" in signal) {
            sectionProgress = signal.completionPercentage;
        } else if ("watchedPercentage" in signal) {
            sectionProgress = signal.watchedPercentage;
        }

        temporalSignals.push({
            signal,
            timestamp: signal.timestamp,
            deltaFromPrevious: previous ? signal.timestamp - previous.timestamp : 0,
            sectionProgress,
            sessionDuration: signal.timestamp - sessionStartTime,
            sequencePosition: i,
        });
    }

    return temporalSignals;
}

/**
 * Group temporal signals by section
 */
export function groupBySection(
    signals: TemporalSignal[]
): Map<string, TemporalSignal[]> {
    const grouped = new Map<string, TemporalSignal[]>();

    for (const ts of signals) {
        let sectionId: string | undefined;

        if ("sectionId" in ts.signal) {
            sectionId = ts.signal.sectionId;
        } else if ("playgroundId" in ts.signal) {
            // Extract section from playground ID
            const match = ts.signal.playgroundId.match(/section-([^-]+)/);
            sectionId = match ? match[1] : undefined;
        }

        if (sectionId) {
            const existing = grouped.get(sectionId) || [];
            existing.push(ts);
            grouped.set(sectionId, existing);
        }
    }

    return grouped;
}

// ============================================================================
// Quiz Hesitation Detection
// ============================================================================

/**
 * Detect quiz hesitation patterns
 */
export function detectQuizHesitation(
    signals: TemporalSignal[],
    config: PredictiveConfig
): QuizHesitationPattern[] {
    const quizSignals = signals.filter(
        (ts) => ts.signal.type === "quiz"
    ) as TemporalSignal[];

    const patterns: QuizHesitationPattern[] = [];

    for (const ts of quizSignals) {
        const quiz = ts.signal as QuizSignal;

        // Calculate expected time per question (baseline: 30s)
        const expectedTimePerQuestion = 30000;
        const expectedTotal = expectedTimePerQuestion * quiz.totalQuestions;
        const actualTime = quiz.timeSpentMs;

        // Hesitation ratio > 1.5 indicates significant hesitation
        const hesitationRatio = actualTime / expectedTotal;

        if (actualTime > config.hesitationThresholdMs || hesitationRatio > 1.5) {
            patterns.push({
                questionId: quiz.quizId,
                hesitationMs: actualTime,
                expectedMs: expectedTotal,
                hesitationRatio,
                changedAnswer: quiz.attemptsUsed > 1,
                timeToFirstClick: actualTime / quiz.totalQuestions, // approximation
            });
        }
    }

    return patterns;
}

/**
 * Calculate hesitation severity
 */
function getHesitationSeverity(pattern: QuizHesitationPattern): StruggeSeverity {
    if (pattern.hesitationRatio > 3 || pattern.changedAnswer) {
        return "severe";
    }
    if (pattern.hesitationRatio > 2) {
        return "moderate";
    }
    return "mild";
}

// ============================================================================
// Error Sequence Detection
// ============================================================================

/**
 * Detect error sequence patterns in playground signals
 */
export function detectErrorSequences(
    signals: TemporalSignal[],
    config: PredictiveConfig
): ErrorSequencePattern[] {
    const playgroundSignals = signals.filter(
        (ts) => ts.signal.type === "playground" || ts.signal.type === "errorPattern"
    ) as TemporalSignal[];

    const patterns: ErrorSequencePattern[] = [];
    const windowSize = config.errorSequenceWindow;

    // Sliding window analysis
    for (let i = 0; i < playgroundSignals.length; i++) {
        const windowEnd = Math.min(i + windowSize, playgroundSignals.length);
        const window = playgroundSignals.slice(i, windowEnd);

        const errors: { type: string; timestamp: number }[] = [];
        let totalFixAttempts = 0;

        for (const ts of window) {
            if (ts.signal.type === "errorPattern") {
                errors.push({
                    type: ts.signal.errorType,
                    timestamp: ts.timestamp,
                });
            } else if (ts.signal.type === "playground") {
                const playground = ts.signal as PlaygroundSignal;
                if (playground.errorCount > 0) {
                    errors.push({
                        type: "playground_error",
                        timestamp: ts.timestamp,
                    });
                    totalFixAttempts += playground.runCount - playground.successfulRuns;
                }
            }
        }

        if (errors.length >= 3) {
            // Calculate escalation rate
            const timespan = errors[errors.length - 1].timestamp - errors[0].timestamp;
            const escalationRate = timespan > 0 ? errors.length / (timespan / 1000) : 0;

            // Check for recurring errors
            const errorTypes = errors.map((e) => e.type);
            const isRecurring = errorTypes.length !== new Set(errorTypes).size;

            // Check if errors were eventually fixed
            const lastPlayground = window
                .filter((ts) => ts.signal.type === "playground")
                .pop();
            const wasFixed = lastPlayground
                ? (lastPlayground.signal as PlaygroundSignal).successfulRuns > 0
                : false;

            patterns.push({
                errorTypes,
                errorTimestamps: errors.map((e) => e.timestamp),
                fixAttempts: totalFixAttempts,
                timeToFix: wasFixed ? timespan : null,
                isRecurring,
                escalationRate,
            });

            // Skip ahead to avoid overlapping patterns
            i += Math.floor(windowSize / 2);
        }
    }

    return patterns;
}

/**
 * Calculate error sequence severity
 */
function getErrorSequenceSeverity(pattern: ErrorSequencePattern): StruggeSeverity {
    if (pattern.isRecurring && pattern.fixAttempts > 5 && pattern.timeToFix === null) {
        return "severe";
    }
    if (pattern.escalationRate > 0.5 || pattern.isRecurring) {
        return "moderate";
    }
    return "mild";
}

// ============================================================================
// Video Engagement Detection
// ============================================================================

/**
 * Detect video engagement patterns
 */
export function detectVideoPatterns(
    signals: TemporalSignal[],
    config: PredictiveConfig
): VideoEngagementPattern[] {
    const videoSignals = signals.filter(
        (ts) => ts.signal.type === "video"
    ) as TemporalSignal[];

    if (videoSignals.length === 0) return [];

    const patterns: VideoEngagementPattern[] = [];

    // Aggregate video behavior
    const rewindTimestamps: number[] = [];
    const pauseTimestamps: number[] = [];
    const playbackSpeedChanges: { timestamp: number; speed: number }[] = [];

    for (const ts of videoSignals) {
        const video = ts.signal as VideoSignal;

        // Track rewinds (approximation based on rewind count changes)
        for (let i = 0; i < video.rewindCount; i++) {
            rewindTimestamps.push(ts.timestamp);
        }

        // Track pauses
        for (let i = 0; i < video.pauseCount; i++) {
            pauseTimestamps.push(ts.timestamp);
        }

        // Track speed changes
        if (video.playbackSpeed !== 1) {
            playbackSpeedChanges.push({
                timestamp: ts.timestamp,
                speed: video.playbackSpeed,
            });
        }
    }

    // Detect rewind clusters (2+ rewinds within window)
    let rewindClusterCount = 0;
    const clusterWindowMs = config.rewindClusterWindowMs;

    for (let i = 0; i < rewindTimestamps.length; i++) {
        let clusterSize = 1;
        for (let j = i + 1; j < rewindTimestamps.length; j++) {
            if (rewindTimestamps[j] - rewindTimestamps[i] <= clusterWindowMs) {
                clusterSize++;
            } else {
                break;
            }
        }
        if (clusterSize >= 2) {
            rewindClusterCount++;
            i += clusterSize - 1; // Skip clustered rewinds
        }
    }

    // Calculate average pause duration (approximation)
    const avgPauseDuration =
        pauseTimestamps.length > 0
            ? videoSignals.reduce((sum, ts) => {
                  const video = ts.signal as VideoSignal;
                  // Estimate pause duration based on watch ratio
                  return sum + (ts.deltaFromPrevious / Math.max(1, video.pauseCount));
              }, 0) / pauseTimestamps.length
            : 0;

    // Detect repeated segments (approximation)
    const segmentsRepeated: { start: number; end: number; repeatCount: number }[] = [];

    if (rewindClusterCount > 0 || pauseTimestamps.length > 5 || playbackSpeedChanges.length > 0) {
        patterns.push({
            rewindTimestamps,
            pauseTimestamps,
            rewindClusterCount,
            averagePauseDuration: avgPauseDuration,
            playbackSpeedChanges,
            segmentsRepeated,
        });
    }

    return patterns;
}

/**
 * Calculate video engagement severity
 */
function getVideoPatternSeverity(pattern: VideoEngagementPattern): StruggeSeverity {
    if (pattern.rewindClusterCount >= 3 || pattern.pauseTimestamps.length > 15) {
        return "severe";
    }
    if (pattern.rewindClusterCount >= 2 || pattern.pauseTimestamps.length > 8) {
        return "moderate";
    }
    return "mild";
}

// ============================================================================
// Navigation Behavior Detection
// ============================================================================

/**
 * Detect navigation behavior patterns
 */
export function detectNavigationPatterns(
    signals: TemporalSignal[]
): NavigationBehaviorPattern[] {
    const navSignals = signals.filter(
        (ts) => ts.signal.type === "navigation"
    ) as TemporalSignal[];

    if (navSignals.length < 2) return [];

    let backtrackCount = 0;
    let skipAheadCount = 0;
    let skipThenReturnCount = 0;
    const visitedSections = new Set<string>();
    const sectionVisits = new Map<string, number[]>();
    const sectionTimes = new Map<string, number>();

    for (let i = 0; i < navSignals.length; i++) {
        const nav = navSignals[i].signal as NavigationSignal;

        // Track visit counts
        const visits = sectionVisits.get(nav.toSection) || [];
        visits.push(navSignals[i].timestamp);
        sectionVisits.set(nav.toSection, visits);

        // Track time in sections
        sectionTimes.set(nav.fromSection, nav.timeInPreviousSection);

        if (nav.isBackward) {
            backtrackCount++;

            // Check for skip-then-return pattern
            if (
                i > 0 &&
                (navSignals[i - 1].signal as NavigationSignal).isBackward === false
            ) {
                skipThenReturnCount++;
            }
        } else {
            // Check for skip ahead (visiting section not seen before, jumping past others)
            if (!visitedSections.has(nav.toSection) && visitedSections.size > 0) {
                skipAheadCount++;
            }
        }

        visitedSections.add(nav.fromSection);
        visitedSections.add(nav.toSection);
    }

    // Calculate average time in section
    const times = Array.from(sectionTimes.values());
    const avgTimeInSection =
        times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

    // Identify abandoned sections (visited but very short time)
    const abandonedSections: string[] = [];
    for (const [sectionId, time] of sectionTimes.entries()) {
        if (time < 5000 && sectionVisits.get(sectionId)?.length === 1) {
            abandonedSections.push(sectionId);
        }
    }

    // Calculate revisit patterns
    const revisitPattern: { sectionId: string; revisitCount: number }[] = [];
    for (const [sectionId, visits] of sectionVisits.entries()) {
        if (visits.length > 1) {
            revisitPattern.push({
                sectionId,
                revisitCount: visits.length - 1,
            });
        }
    }

    const patterns: NavigationBehaviorPattern[] = [];

    if (
        backtrackCount > 0 ||
        skipAheadCount > 0 ||
        skipThenReturnCount > 0 ||
        abandonedSections.length > 0
    ) {
        patterns.push({
            backtrackCount,
            skipAheadCount,
            skipThenReturnCount,
            averageTimeInSection: avgTimeInSection,
            abandonedSections,
            revisitPattern,
        });
    }

    return patterns;
}

/**
 * Calculate navigation pattern severity
 */
function getNavigationPatternSeverity(pattern: NavigationBehaviorPattern): StruggeSeverity {
    if (
        pattern.skipThenReturnCount >= 3 ||
        pattern.abandonedSections.length >= 3 ||
        pattern.backtrackCount >= 5
    ) {
        return "severe";
    }
    if (
        pattern.skipThenReturnCount >= 2 ||
        pattern.abandonedSections.length >= 2 ||
        pattern.backtrackCount >= 3
    ) {
        return "moderate";
    }
    return "mild";
}

// ============================================================================
// Composite Pre-Struggle Detection
// ============================================================================

/**
 * Generate unique ID for pre-struggle signal
 */
function generatePreStruggleId(): string {
    return `ps_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Detect all pre-struggle signals from temporal signals
 */
export function detectPreStruggleSignals(
    signals: TemporalSignal[],
    sectionId: string,
    config: PredictiveConfig = DEFAULT_PREDICTIVE_CONFIG
): PreStruggleSignal[] {
    const preStruggleSignals: PreStruggleSignal[] = [];
    const now = Date.now();

    // Detect quiz hesitation
    const hesitationPatterns = detectQuizHesitation(signals, config);
    for (const pattern of hesitationPatterns) {
        const severity = getHesitationSeverity(pattern);
        preStruggleSignals.push({
            id: generatePreStruggleId(),
            indicator: "quiz_hesitation",
            severity,
            confidence: calculateHesitationConfidence(pattern),
            detectedAt: now,
            sectionId,
            evidence: {
                signals,
                patterns: { hesitation: pattern },
                historicalSimilarity: 0,
                collectiveMatch: 0,
            },
            predictedTimeToStruggle: estimateTimeToStruggle(severity, config),
        });
    }

    // Detect error sequences
    const errorPatterns = detectErrorSequences(signals, config);
    for (const pattern of errorPatterns) {
        const severity = getErrorSequenceSeverity(pattern);
        preStruggleSignals.push({
            id: generatePreStruggleId(),
            indicator: "playground_error_sequence",
            severity,
            confidence: calculateErrorSequenceConfidence(pattern),
            detectedAt: now,
            sectionId,
            evidence: {
                signals,
                patterns: { errorSequence: pattern },
                historicalSimilarity: 0,
                collectiveMatch: 0,
            },
            predictedTimeToStruggle: estimateTimeToStruggle(severity, config),
        });
    }

    // Detect video patterns
    const videoPatterns = detectVideoPatterns(signals, config);
    for (const pattern of videoPatterns) {
        const severity = getVideoPatternSeverity(pattern);
        preStruggleSignals.push({
            id: generatePreStruggleId(),
            indicator: "video_rewind_cluster",
            severity,
            confidence: calculateVideoPatternConfidence(pattern),
            detectedAt: now,
            sectionId,
            evidence: {
                signals,
                patterns: { videoEngagement: pattern },
                historicalSimilarity: 0,
                collectiveMatch: 0,
            },
            predictedTimeToStruggle: estimateTimeToStruggle(severity, config),
        });
    }

    // Detect navigation patterns
    const navPatterns = detectNavigationPatterns(signals);
    for (const pattern of navPatterns) {
        const severity = getNavigationPatternSeverity(pattern);
        preStruggleSignals.push({
            id: generatePreStruggleId(),
            indicator: "section_skip_pattern",
            severity,
            confidence: calculateNavigationPatternConfidence(pattern),
            detectedAt: now,
            sectionId,
            evidence: {
                signals,
                patterns: { navigation: pattern },
                historicalSimilarity: 0,
                collectiveMatch: 0,
            },
            predictedTimeToStruggle: estimateTimeToStruggle(severity, config),
        });
    }

    return preStruggleSignals;
}

// ============================================================================
// Confidence Calculations
// ============================================================================

function calculateHesitationConfidence(pattern: QuizHesitationPattern): number {
    let confidence = 0.5;

    // Higher hesitation ratio = higher confidence
    if (pattern.hesitationRatio > 2) confidence += 0.2;
    if (pattern.hesitationRatio > 3) confidence += 0.1;

    // Changed answer indicates uncertainty
    if (pattern.changedAnswer) confidence += 0.15;

    return Math.min(1, confidence);
}

function calculateErrorSequenceConfidence(pattern: ErrorSequencePattern): number {
    let confidence = 0.5;

    // More errors in sequence = higher confidence
    confidence += Math.min(0.2, pattern.errorTypes.length * 0.05);

    // Recurring errors indicate pattern
    if (pattern.isRecurring) confidence += 0.15;

    // Unable to fix = high confidence of struggle
    if (pattern.timeToFix === null) confidence += 0.2;

    // High escalation rate
    if (pattern.escalationRate > 0.3) confidence += 0.1;

    return Math.min(1, confidence);
}

function calculateVideoPatternConfidence(pattern: VideoEngagementPattern): number {
    let confidence = 0.4;

    // More rewind clusters = higher confidence
    confidence += Math.min(0.3, pattern.rewindClusterCount * 0.1);

    // Many pauses indicate struggling
    confidence += Math.min(0.2, pattern.pauseTimestamps.length * 0.02);

    // Slowed playback suggests difficulty
    const slowedPlayback = pattern.playbackSpeedChanges.some((c) => c.speed < 1);
    if (slowedPlayback) confidence += 0.1;

    return Math.min(1, confidence);
}

function calculateNavigationPatternConfidence(
    pattern: NavigationBehaviorPattern
): number {
    let confidence = 0.4;

    // Skip-then-return is strong indicator
    confidence += Math.min(0.3, pattern.skipThenReturnCount * 0.15);

    // Backtracking suggests confusion
    confidence += Math.min(0.2, pattern.backtrackCount * 0.05);

    // Abandoned sections suggest frustration
    confidence += Math.min(0.2, pattern.abandonedSections.length * 0.1);

    return Math.min(1, confidence);
}

// ============================================================================
// Time Estimation
// ============================================================================

function estimateTimeToStruggle(
    severity: StruggeSeverity,
    config: PredictiveConfig
): number {
    switch (severity) {
        case "severe":
            return config.immediateHorizonMs;
        case "moderate":
            return config.shortTermHorizonMs;
        case "mild":
            return config.mediumTermHorizonMs;
    }
}

// ============================================================================
// Signal Attention Weights (Transformer-like)
// ============================================================================

/**
 * Calculate attention weights for signals based on recency and relevance
 */
export function calculateSignalAttention(
    signals: TemporalSignal[],
    currentTimestamp: number
): Map<number, number> {
    const attentionWeights = new Map<number, number>();
    const maxAge = 300000; // 5 minutes

    for (let i = 0; i < signals.length; i++) {
        const signal = signals[i];
        const age = currentTimestamp - signal.timestamp;

        // Temporal decay (exponential)
        const temporalDecay = Math.exp(-age / maxAge);

        // Signal type importance
        let typeWeight = 0.5;
        switch (signal.signal.type) {
            case "quiz":
                typeWeight = 0.9; // Most informative
                break;
            case "playground":
                typeWeight = 0.85;
                break;
            case "errorPattern":
                typeWeight = 0.8;
                break;
            case "video":
                typeWeight = 0.6;
                break;
            case "sectionTime":
                typeWeight = 0.5;
                break;
            case "navigation":
                typeWeight = 0.4;
                break;
        }

        // Position relevance (more recent = more relevant)
        const positionWeight = 0.3 + 0.7 * (i / Math.max(1, signals.length - 1));

        // Combined attention weight
        const attention = temporalDecay * typeWeight * positionWeight;
        attentionWeights.set(i, attention);
    }

    return attentionWeights;
}

/**
 * Create weighted sequence embedding from signals
 */
export function createSequenceEmbedding(
    signals: TemporalSignal[],
    attentionWeights: Map<number, number>
): number[] {
    // Create a fixed-size embedding vector (simplified)
    const embeddingSize = 16;
    const embedding = new Array(embeddingSize).fill(0);

    if (signals.length === 0) return embedding;

    // Aggregate weighted signal features into embedding
    for (let i = 0; i < signals.length; i++) {
        const signal = signals[i];
        const weight = attentionWeights.get(i) || 0;

        // Encode signal type (one-hot style, first 6 dimensions)
        const typeIndex = ["quiz", "playground", "sectionTime", "errorPattern", "video", "navigation"].indexOf(
            signal.signal.type
        );
        if (typeIndex >= 0 && typeIndex < 6) {
            embedding[typeIndex] += weight;
        }

        // Encode timing features (dimensions 6-9)
        embedding[6] += (signal.deltaFromPrevious / 60000) * weight; // minutes since last
        embedding[7] += signal.sectionProgress * weight / 100;
        embedding[8] += (signal.sessionDuration / 600000) * weight; // 10min normalized

        // Encode signal-specific scores (dimensions 9-15)
        const score = getSignalScore(signal.signal);
        embedding[9] += score * weight;
        embedding[10] += score < 40 ? weight : 0; // failure indicator
        embedding[11] += score > 70 ? weight : 0; // success indicator
    }

    // Normalize embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    if (magnitude > 0) {
        for (let i = 0; i < embedding.length; i++) {
            embedding[i] /= magnitude;
        }
    }

    return embedding;
}

/**
 * Get a normalized score from a signal (0-100)
 */
function getSignalScore(signal: BehaviorSignal): number {
    switch (signal.type) {
        case "quiz": {
            const accuracy = (signal.correctAnswers / signal.totalQuestions) * 100;
            return Math.max(0, Math.min(100, accuracy - (signal.attemptsUsed - 1) * 10));
        }
        case "playground": {
            if (signal.runCount === 0) return 50;
            return (signal.successfulRuns / signal.runCount) * 100;
        }
        case "sectionTime":
            return signal.completionPercentage;
        case "video":
            return signal.watchedPercentage;
        case "navigation":
            return signal.isBackward ? 40 : 80;
        case "errorPattern":
            return Math.max(0, 100 - signal.repeatedCount * 20);
        default:
            return 50;
    }
}

// ============================================================================
// Exports
// ============================================================================

export {
    getHesitationSeverity,
    getErrorSequenceSeverity,
    getVideoPatternSeverity,
    getNavigationPatternSeverity,
    getSignalScore,
};
