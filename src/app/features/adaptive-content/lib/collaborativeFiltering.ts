/**
 * Collaborative Filtering Engine
 *
 * Implements collaborative filtering for content recommendations.
 * Uses patterns from similar learners to suggest content that helped
 * others who struggled with the same concepts.
 *
 * This transforms the rule-based adaptation into a recommendation system
 * that leverages collective intelligence from all learners.
 */

import type {
    ComprehensionLevel,
    ComprehensionScore,
    BehaviorSignal,
    AdaptiveSlot,
} from "./types";

// ============================================================================
// Types
// ============================================================================

/**
 * Represents a learner's profile for similarity matching
 */
export interface LearnerFingerprint {
    userId: string;
    courseId: string;
    /** Signal type performance scores (0-100) */
    signalScores: {
        quiz: number;
        playground: number;
        video: number;
        sectionTime: number;
        navigation: number;
        errorPattern: number;
    };
    /** Section-level comprehension scores */
    sectionScores: Record<string, number>;
    /** Overall comprehension level */
    comprehensionLevel: ComprehensionLevel;
    /** Total signals collected */
    signalCount: number;
    /** Last updated timestamp */
    lastUpdated: number;
}

/**
 * Content that helped a learner improve
 */
export interface HelpfulContent {
    slotType: AdaptiveSlot["slotType"];
    sectionId: string;
    topic: string;
    /** Score improvement after viewing this content */
    improvementScore: number;
    /** Number of learners this helped */
    helpCount: number;
    /** Timestamp when recorded */
    timestamp: number;
}

/**
 * Pattern of struggle and recovery
 */
export interface LearningPattern {
    sectionId: string;
    topic: string;
    /** Initial struggle indicators */
    struggleSignals: {
        signalType: BehaviorSignal["type"];
        avgScore: number;
        frequency: number;
    }[];
    /** What helped learners recover */
    recoveryContent: HelpfulContent[];
    /** How many learners showed this pattern */
    patternFrequency: number;
}

/**
 * Collective intelligence data aggregated from all learners
 */
export interface CollectivePatterns {
    courseId: string;
    /** All observed learning patterns */
    patterns: LearningPattern[];
    /** Anonymized fingerprints for similarity matching */
    fingerprints: LearnerFingerprint[];
    /** Global content effectiveness scores */
    contentEffectiveness: Record<string, HelpfulContent[]>;
    /** Last aggregation timestamp */
    lastAggregated: number;
    /** Total learner count */
    learnerCount: number;
}

/**
 * Recommendation from collaborative filtering
 */
export interface CollaborativeRecommendation {
    slotType: AdaptiveSlot["slotType"];
    sectionId: string;
    topic: string;
    /** Confidence in this recommendation (0-1) */
    confidence: number;
    /** Why this is recommended */
    reason: string;
    /** How many similar learners benefited */
    similarLearnersBenefited: number;
    /** Average improvement score */
    avgImprovementScore: number;
}

// ============================================================================
// Learner Similarity Calculation
// ============================================================================

/**
 * Calculate cosine similarity between two learner fingerprints
 */
export function calculateLearnerSimilarity(
    fingerprint1: LearnerFingerprint,
    fingerprint2: LearnerFingerprint
): number {
    // Weight different dimensions
    const WEIGHTS = {
        signalScores: 0.4,
        sectionScores: 0.4,
        comprehensionLevel: 0.2,
    };

    // Signal scores similarity
    const signalKeys = Object.keys(fingerprint1.signalScores) as Array<
        keyof LearnerFingerprint["signalScores"]
    >;
    let signalDotProduct = 0;
    let signal1Magnitude = 0;
    let signal2Magnitude = 0;

    for (const key of signalKeys) {
        const v1 = fingerprint1.signalScores[key];
        const v2 = fingerprint2.signalScores[key];
        signalDotProduct += v1 * v2;
        signal1Magnitude += v1 * v1;
        signal2Magnitude += v2 * v2;
    }

    const signalSimilarity =
        signal1Magnitude > 0 && signal2Magnitude > 0
            ? signalDotProduct / (Math.sqrt(signal1Magnitude) * Math.sqrt(signal2Magnitude))
            : 0;

    // Section scores similarity (only for shared sections)
    const sharedSections = Object.keys(fingerprint1.sectionScores).filter(
        (s) => s in fingerprint2.sectionScores
    );

    let sectionSimilarity = 0;
    if (sharedSections.length > 0) {
        let sectionDotProduct = 0;
        let section1Magnitude = 0;
        let section2Magnitude = 0;

        for (const section of sharedSections) {
            const v1 = fingerprint1.sectionScores[section];
            const v2 = fingerprint2.sectionScores[section];
            sectionDotProduct += v1 * v2;
            section1Magnitude += v1 * v1;
            section2Magnitude += v2 * v2;
        }

        sectionSimilarity =
            section1Magnitude > 0 && section2Magnitude > 0
                ? sectionDotProduct / (Math.sqrt(section1Magnitude) * Math.sqrt(section2Magnitude))
                : 0;
    }

    // Comprehension level similarity
    const levelMap: Record<ComprehensionLevel, number> = {
        beginner: 0,
        intermediate: 0.5,
        advanced: 1,
    };
    const levelDiff = Math.abs(
        levelMap[fingerprint1.comprehensionLevel] - levelMap[fingerprint2.comprehensionLevel]
    );
    const levelSimilarity = 1 - levelDiff;

    // Weighted combination
    return (
        signalSimilarity * WEIGHTS.signalScores +
        sectionSimilarity * WEIGHTS.sectionScores +
        levelSimilarity * WEIGHTS.comprehensionLevel
    );
}

/**
 * Find the K most similar learners from a collection
 */
export function findSimilarLearners(
    targetFingerprint: LearnerFingerprint,
    allFingerprints: LearnerFingerprint[],
    k: number = 10,
    minSimilarity: number = 0.5
): Array<{ fingerprint: LearnerFingerprint; similarity: number }> {
    const similarities = allFingerprints
        .filter((f) => f.userId !== targetFingerprint.userId) // Exclude self
        .map((fingerprint) => ({
            fingerprint,
            similarity: calculateLearnerSimilarity(targetFingerprint, fingerprint),
        }))
        .filter((s) => s.similarity >= minSimilarity)
        .sort((a, b) => b.similarity - a.similarity);

    return similarities.slice(0, k);
}

// ============================================================================
// Fingerprint Generation
// ============================================================================

/**
 * Generate a learner fingerprint from their comprehension model signals
 */
export function generateLearnerFingerprint(
    userId: string,
    courseId: string,
    signals: BehaviorSignal[],
    sectionScores: Record<string, { score: ComprehensionScore }>,
    overallLevel: ComprehensionLevel
): LearnerFingerprint {
    // Calculate average scores per signal type
    const signalTypeScores: Record<string, number[]> = {
        quiz: [],
        playground: [],
        video: [],
        sectionTime: [],
        navigation: [],
        errorPattern: [],
    };

    for (const signal of signals) {
        const score = scoreSignalForFingerprint(signal);
        if (signalTypeScores[signal.type]) {
            signalTypeScores[signal.type].push(score);
        }
    }

    const avgScores = {
        quiz: average(signalTypeScores.quiz) || 50,
        playground: average(signalTypeScores.playground) || 50,
        video: average(signalTypeScores.video) || 50,
        sectionTime: average(signalTypeScores.sectionTime) || 50,
        navigation: average(signalTypeScores.navigation) || 50,
        errorPattern: average(signalTypeScores.errorPattern) || 50,
    };

    // Extract section scores
    const extractedSectionScores: Record<string, number> = {};
    for (const [sectionId, data] of Object.entries(sectionScores)) {
        extractedSectionScores[sectionId] = data.score.score;
    }

    return {
        userId,
        courseId,
        signalScores: avgScores,
        sectionScores: extractedSectionScores,
        comprehensionLevel: overallLevel,
        signalCount: signals.length,
        lastUpdated: Date.now(),
    };
}

/**
 * Score a single signal for fingerprint generation
 */
function scoreSignalForFingerprint(signal: BehaviorSignal): number {
    switch (signal.type) {
        case "quiz":
            return (signal.correctAnswers / signal.totalQuestions) * 100;
        case "playground":
            return signal.runCount > 0
                ? (signal.successfulRuns / signal.runCount) * 100
                : 50;
        case "video":
            return signal.watchedPercentage;
        case "sectionTime":
            return signal.completionPercentage;
        case "navigation":
            return signal.isBackward ? 40 : 80;
        case "errorPattern":
            return Math.max(0, 100 - signal.repeatedCount * 20);
        default:
            return 50;
    }
}

function average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ============================================================================
// Pattern Matching & Recommendations
// ============================================================================

/**
 * Find learning patterns that match the current learner's struggles
 */
export function findMatchingPatterns(
    fingerprint: LearnerFingerprint,
    patterns: LearningPattern[],
    currentSectionId?: string
): LearningPattern[] {
    return patterns
        .filter((pattern) => {
            // If looking for specific section, filter by it
            if (currentSectionId && pattern.sectionId !== currentSectionId) {
                return false;
            }

            // Check if the learner shows similar struggle signals
            const sectionScore = fingerprint.sectionScores[pattern.sectionId];
            if (sectionScore !== undefined && sectionScore < 60) {
                return true; // Learner is struggling in this section
            }

            // Check signal-level struggles
            for (const struggle of pattern.struggleSignals) {
                const learnerScore =
                    fingerprint.signalScores[
                        struggle.signalType as keyof LearnerFingerprint["signalScores"]
                    ];
                if (learnerScore !== undefined && learnerScore < struggle.avgScore + 10) {
                    return true;
                }
            }

            return false;
        })
        .sort((a, b) => b.patternFrequency - a.patternFrequency);
}

/**
 * Generate content recommendations based on collaborative filtering
 */
export function generateCollaborativeRecommendations(
    fingerprint: LearnerFingerprint,
    collectivePatterns: CollectivePatterns,
    currentSectionId: string,
    currentTopic: string,
    maxRecommendations: number = 5
): CollaborativeRecommendation[] {
    const recommendations: CollaborativeRecommendation[] = [];

    // Find similar learners
    const similarLearners = findSimilarLearners(
        fingerprint,
        collectivePatterns.fingerprints,
        20,
        0.4
    );

    if (similarLearners.length === 0) {
        // Fall back to pattern matching if no similar learners
        return generatePatternBasedRecommendations(
            fingerprint,
            collectivePatterns.patterns,
            currentSectionId,
            currentTopic,
            maxRecommendations
        );
    }

    // Aggregate helpful content from similar learners
    const contentScores: Map<
        string,
        {
            content: HelpfulContent;
            weightedScore: number;
            learnerCount: number;
            totalSimilarity: number;
        }
    > = new Map();

    for (const { fingerprint: similar, similarity } of similarLearners) {
        // Get content that helped this similar learner
        const sectionContent =
            collectivePatterns.contentEffectiveness[similar.userId] || [];

        for (const content of sectionContent) {
            // Only consider content for current section or similar topics
            if (
                content.sectionId !== currentSectionId &&
                content.topic !== currentTopic
            ) {
                continue;
            }

            const key = `${content.slotType}-${content.sectionId}-${content.topic}`;
            const existing = contentScores.get(key);

            if (existing) {
                existing.weightedScore += content.improvementScore * similarity;
                existing.learnerCount += 1;
                existing.totalSimilarity += similarity;
            } else {
                contentScores.set(key, {
                    content,
                    weightedScore: content.improvementScore * similarity,
                    learnerCount: 1,
                    totalSimilarity: similarity,
                });
            }
        }
    }

    // Convert to recommendations
    for (const [, data] of contentScores) {
        const avgSimilarity = data.totalSimilarity / data.learnerCount;
        const confidence = Math.min(
            1,
            (avgSimilarity * 0.5 + (data.learnerCount / similarLearners.length) * 0.5)
        );

        recommendations.push({
            slotType: data.content.slotType,
            sectionId: data.content.sectionId,
            topic: data.content.topic,
            confidence,
            reason: `${data.learnerCount} similar learners found this helpful`,
            similarLearnersBenefited: data.learnerCount,
            avgImprovementScore: data.weightedScore / data.learnerCount,
        });
    }

    // Sort by confidence and improvement score
    return recommendations
        .sort((a, b) => {
            const scoreA = a.confidence * 0.6 + (a.avgImprovementScore / 100) * 0.4;
            const scoreB = b.confidence * 0.6 + (b.avgImprovementScore / 100) * 0.4;
            return scoreB - scoreA;
        })
        .slice(0, maxRecommendations);
}

/**
 * Generate recommendations based on observed patterns (fallback)
 */
function generatePatternBasedRecommendations(
    fingerprint: LearnerFingerprint,
    patterns: LearningPattern[],
    currentSectionId: string,
    currentTopic: string,
    maxRecommendations: number
): CollaborativeRecommendation[] {
    const matchingPatterns = findMatchingPatterns(fingerprint, patterns, currentSectionId);
    const recommendations: CollaborativeRecommendation[] = [];

    for (const pattern of matchingPatterns) {
        for (const content of pattern.recoveryContent) {
            const confidence = Math.min(
                1,
                (pattern.patternFrequency / 100) * 0.5 +
                    (content.helpCount / pattern.patternFrequency) * 0.5
            );

            recommendations.push({
                slotType: content.slotType,
                sectionId: pattern.sectionId,
                topic: pattern.topic || currentTopic,
                confidence,
                reason: `Helped ${content.helpCount} learners with similar struggles`,
                similarLearnersBenefited: content.helpCount,
                avgImprovementScore: content.improvementScore,
            });
        }
    }

    return recommendations
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, maxRecommendations);
}

// ============================================================================
// Pattern Recording
// ============================================================================

/**
 * Record that specific content helped a learner improve
 */
export function recordContentEffectiveness(
    userId: string,
    slotType: AdaptiveSlot["slotType"],
    sectionId: string,
    topic: string,
    scoreBefore: number,
    scoreAfter: number
): HelpfulContent | null {
    const improvement = scoreAfter - scoreBefore;

    // Only record if there was meaningful improvement
    if (improvement < 5) {
        return null;
    }

    return {
        slotType,
        sectionId,
        topic,
        improvementScore: improvement,
        helpCount: 1,
        timestamp: Date.now(),
    };
}

/**
 * Detect struggle patterns from a learner's signal history
 */
export function detectStrugglePattern(
    sectionId: string,
    topic: string,
    signals: BehaviorSignal[]
): LearningPattern | null {
    const sectionSignals = signals.filter((s) => {
        if ("sectionId" in s) return s.sectionId === sectionId;
        if ("playgroundId" in s) return s.playgroundId.includes(sectionId);
        return false;
    });

    if (sectionSignals.length < 3) {
        return null; // Not enough data
    }

    // Group by signal type and check for struggles
    const typeGroups: Record<string, BehaviorSignal[]> = {};
    for (const signal of sectionSignals) {
        if (!typeGroups[signal.type]) {
            typeGroups[signal.type] = [];
        }
        typeGroups[signal.type].push(signal);
    }

    const struggleSignals: LearningPattern["struggleSignals"] = [];

    for (const [type, typeSignals] of Object.entries(typeGroups)) {
        const scores = typeSignals.map((s) => scoreSignalForFingerprint(s));
        const avgScore = average(scores);

        // Consider it a struggle if average is below 50
        if (avgScore < 50) {
            struggleSignals.push({
                signalType: type as BehaviorSignal["type"],
                avgScore,
                frequency: typeSignals.length,
            });
        }
    }

    if (struggleSignals.length === 0) {
        return null; // No struggles detected
    }

    return {
        sectionId,
        topic,
        struggleSignals,
        recoveryContent: [], // To be filled as content is shown and improvement measured
        patternFrequency: 1,
    };
}

// ============================================================================
// Merging & Aggregation
// ============================================================================

/**
 * Merge helpful content entries (for aggregation)
 */
export function mergeHelpfulContent(
    existing: HelpfulContent,
    newEntry: HelpfulContent
): HelpfulContent {
    return {
        ...existing,
        improvementScore:
            (existing.improvementScore * existing.helpCount +
                newEntry.improvementScore * newEntry.helpCount) /
            (existing.helpCount + newEntry.helpCount),
        helpCount: existing.helpCount + newEntry.helpCount,
        timestamp: Math.max(existing.timestamp, newEntry.timestamp),
    };
}

/**
 * Merge learning patterns (for aggregation)
 */
export function mergeLearningPatterns(
    existing: LearningPattern,
    newPattern: LearningPattern
): LearningPattern {
    // Merge struggle signals
    const mergedStruggles: LearningPattern["struggleSignals"] = [...existing.struggleSignals];

    for (const newStruggle of newPattern.struggleSignals) {
        const existingIdx = mergedStruggles.findIndex(
            (s) => s.signalType === newStruggle.signalType
        );

        if (existingIdx >= 0) {
            const existingStruggle = mergedStruggles[existingIdx];
            mergedStruggles[existingIdx] = {
                ...existingStruggle,
                avgScore:
                    (existingStruggle.avgScore * existingStruggle.frequency +
                        newStruggle.avgScore * newStruggle.frequency) /
                    (existingStruggle.frequency + newStruggle.frequency),
                frequency: existingStruggle.frequency + newStruggle.frequency,
            };
        } else {
            mergedStruggles.push(newStruggle);
        }
    }

    // Merge recovery content
    const mergedRecovery: HelpfulContent[] = [...existing.recoveryContent];

    for (const newContent of newPattern.recoveryContent) {
        const existingIdx = mergedRecovery.findIndex(
            (c) => c.slotType === newContent.slotType && c.topic === newContent.topic
        );

        if (existingIdx >= 0) {
            mergedRecovery[existingIdx] = mergeHelpfulContent(
                mergedRecovery[existingIdx],
                newContent
            );
        } else {
            mergedRecovery.push(newContent);
        }
    }

    return {
        ...existing,
        struggleSignals: mergedStruggles,
        recoveryContent: mergedRecovery,
        patternFrequency: existing.patternFrequency + newPattern.patternFrequency,
    };
}

/**
 * Create an empty collective patterns store
 */
export function createEmptyCollectivePatterns(courseId: string): CollectivePatterns {
    return {
        courseId,
        patterns: [],
        fingerprints: [],
        contentEffectiveness: {},
        lastAggregated: Date.now(),
        learnerCount: 0,
    };
}
