/**
 * Emergent Prerequisite Derivation
 *
 * Algorithms for deriving implicit prerequisites from collective learner behavior.
 * The key insight: "learners who skipped X failed more often at Y" becomes
 * an implicit prerequisite relationship.
 */

import type { ChapterNodeId } from "../chapterGraph";
import type {
    LearnerJourney,
    ChapterAttempt,
    ImplicitPrerequisite,
    PrerequisiteEvidence,
    StrugglePoint,
    StruggleType,
    CommonError,
    OptimalPath,
    PathMetrics,
    PathSuitability,
    CollectiveIntelligenceConfig,
} from "./types";
import { DEFAULT_COLLECTIVE_INTELLIGENCE_CONFIG } from "./types";
import { generateId } from "./storage";

// ============================================================================
// PREREQUISITE DERIVATION
// ============================================================================

/**
 * Analyze journeys to derive implicit prerequisite relationships
 */
export function deriveImplicitPrerequisites(
    journeys: LearnerJourney[],
    config: CollectiveIntelligenceConfig = DEFAULT_COLLECTIVE_INTELLIGENCE_CONFIG
): ImplicitPrerequisite[] {
    if (journeys.length < config.minLearnersForAnalysis) {
        return [];
    }

    // Build a map of chapter pairs and their success metrics
    const pairAnalysis = analyzeChapterPairs(journeys);

    // Convert to implicit prerequisites
    const prerequisites: ImplicitPrerequisite[] = [];

    for (const [pairKey, analysis] of pairAnalysis) {
        const [prereqId, dependentId] = pairKey.split("->") as [ChapterNodeId, ChapterNodeId];

        // Calculate success rate difference
        const successDiff =
            analysis.successRateWithPrereq - analysis.successRateWithoutPrereq;

        // Only create prerequisite if difference is significant
        if (successDiff < config.minSuccessRateDifference) {
            continue;
        }

        // Calculate confidence based on sample size and consistency
        const confidence = calculatePrerequisiteConfidence(
            analysis,
            config.minLearnersForAnalysis
        );

        if (confidence < config.prerequisiteConfidenceThreshold) {
            continue;
        }

        // Calculate strength based on success rate improvement
        const strength = Math.min(1, successDiff / 0.5); // Normalize to 0-1

        prerequisites.push({
            prerequisiteChapterId: prereqId,
            dependentChapterId: dependentId,
            strength,
            confidence,
            evidence: {
                learnersWithPrereq: analysis.learnersWithPrereq,
                learnersWithoutPrereq: analysis.learnersWithoutPrereq,
                successRateWithPrereq: analysis.successRateWithPrereq,
                successRateWithoutPrereq: analysis.successRateWithoutPrereq,
                struggleReduction: analysis.struggleReduction,
                timeImprovement: analysis.timeImprovement,
                sampleJourneyIds: analysis.sampleJourneyIds.slice(0, 5),
            },
            lastUpdated: Date.now(),
        });
    }

    // Sort by confidence and strength
    return prerequisites.sort(
        (a, b) => b.confidence * b.strength - a.confidence * a.strength
    );
}

interface ChapterPairAnalysis {
    learnersWithPrereq: number;
    learnersWithoutPrereq: number;
    successRateWithPrereq: number;
    successRateWithoutPrereq: number;
    struggleReduction: number;
    timeImprovement: number;
    sampleJourneyIds: string[];
}

/**
 * Analyze all chapter pairs for prerequisite relationships
 */
function analyzeChapterPairs(
    journeys: LearnerJourney[]
): Map<string, ChapterPairAnalysis> {
    const pairAnalysis = new Map<string, ChapterPairAnalysis>();
    const pairData = new Map<
        string,
        {
            withPrereq: ChapterAttempt[];
            withoutPrereq: ChapterAttempt[];
            journeyIds: string[];
        }
    >();

    // Collect data for each chapter pair
    for (const journey of journeys) {
        const completedChapters = new Set(
            journey.chapterSequence
                .filter((a) => a.completed)
                .map((a) => a.chapterId)
        );

        // For each chapter attempt, check what was completed before it
        for (let i = 0; i < journey.chapterSequence.length; i++) {
            const attempt = journey.chapterSequence[i];
            if (!attempt) continue;

            // Check all previously completed chapters as potential prerequisites
            const completedBefore = new Set(
                journey.chapterSequence
                    .slice(0, i)
                    .filter((a) => a.completed)
                    .map((a) => a.chapterId)
            );

            // For each potential prerequisite
            for (const prereqId of completedChapters) {
                if (prereqId === attempt.chapterId) continue;

                const pairKey = `${prereqId}->${attempt.chapterId}`;

                if (!pairData.has(pairKey)) {
                    pairData.set(pairKey, {
                        withPrereq: [],
                        withoutPrereq: [],
                        journeyIds: [],
                    });
                }

                const data = pairData.get(pairKey)!;
                data.journeyIds.push(journey.userId);

                if (completedBefore.has(prereqId)) {
                    data.withPrereq.push(attempt);
                } else {
                    data.withoutPrereq.push(attempt);
                }
            }
        }
    }

    // Calculate metrics for each pair
    for (const [pairKey, data] of pairData) {
        if (data.withPrereq.length === 0 || data.withoutPrereq.length === 0) {
            continue; // Need both groups to compare
        }

        const successWithPrereq =
            data.withPrereq.filter((a) => a.completed).length /
            data.withPrereq.length;
        const successWithoutPrereq =
            data.withoutPrereq.filter((a) => a.completed).length /
            data.withoutPrereq.length;

        // Calculate struggle metrics
        const avgStruggleWith =
            data.withPrereq.reduce(
                (sum, a) => sum + a.struggleMetrics.frustrationScore,
                0
            ) / data.withPrereq.length;
        const avgStruggleWithout =
            data.withoutPrereq.reduce(
                (sum, a) => sum + a.struggleMetrics.frustrationScore,
                0
            ) / data.withoutPrereq.length;
        const struggleReduction =
            avgStruggleWithout > 0
                ? (avgStruggleWithout - avgStruggleWith) / avgStruggleWithout
                : 0;

        // Calculate time improvement
        const avgTimeWith =
            data.withPrereq.reduce((sum, a) => sum + a.timeSpentMinutes, 0) /
            data.withPrereq.length;
        const avgTimeWithout =
            data.withoutPrereq.reduce((sum, a) => sum + a.timeSpentMinutes, 0) /
            data.withoutPrereq.length;
        const timeImprovement =
            avgTimeWithout > 0
                ? (avgTimeWithout - avgTimeWith) / avgTimeWithout
                : 0;

        pairAnalysis.set(pairKey, {
            learnersWithPrereq: data.withPrereq.length,
            learnersWithoutPrereq: data.withoutPrereq.length,
            successRateWithPrereq: successWithPrereq,
            successRateWithoutPrereq: successWithoutPrereq,
            struggleReduction: Math.max(0, struggleReduction),
            timeImprovement: Math.max(0, timeImprovement),
            sampleJourneyIds: [...new Set(data.journeyIds)],
        });
    }

    return pairAnalysis;
}

/**
 * Calculate confidence score for a prerequisite relationship
 */
function calculatePrerequisiteConfidence(
    analysis: ChapterPairAnalysis,
    minSampleSize: number
): number {
    // Base confidence from sample size
    const totalSamples = analysis.learnersWithPrereq + analysis.learnersWithoutPrereq;
    const sampleConfidence = Math.min(1, totalSamples / (minSampleSize * 5));

    // Balance factor - need both groups represented
    const balance =
        Math.min(analysis.learnersWithPrereq, analysis.learnersWithoutPrereq) /
        Math.max(analysis.learnersWithPrereq, analysis.learnersWithoutPrereq);

    // Effect size - larger difference = more confident
    const effectSize = Math.abs(
        analysis.successRateWithPrereq - analysis.successRateWithoutPrereq
    );
    const effectConfidence = Math.min(1, effectSize / 0.3);

    // Combine factors
    return sampleConfidence * 0.4 + balance * 0.3 + effectConfidence * 0.3;
}

// ============================================================================
// STRUGGLE POINT IDENTIFICATION
// ============================================================================

/**
 * Identify struggle points from collective behavior
 */
export function identifyStrugglePoints(
    journeys: LearnerJourney[],
    config: CollectiveIntelligenceConfig = DEFAULT_COLLECTIVE_INTELLIGENCE_CONFIG
): StrugglePoint[] {
    if (journeys.length < config.minLearnersForAnalysis) {
        return [];
    }

    // Aggregate section-level struggle data
    const sectionData = new Map<
        string,
        {
            chapterId: ChapterNodeId;
            sectionId: string;
            totalAttempts: number;
            struggles: {
                errorCount: number;
                hintsUsed: number;
                retryCount: number;
                abandonCount: number;
                timeOverExpected: number;
            };
        }
    >();

    for (const journey of journeys) {
        for (const attempt of journey.chapterSequence) {
            for (const section of attempt.sectionBehaviors) {
                const key = `${attempt.chapterId}:${section.sectionId}`;

                if (!sectionData.has(key)) {
                    sectionData.set(key, {
                        chapterId: attempt.chapterId,
                        sectionId: section.sectionId,
                        totalAttempts: 0,
                        struggles: {
                            errorCount: 0,
                            hintsUsed: 0,
                            retryCount: 0,
                            abandonCount: 0,
                            timeOverExpected: 0,
                        },
                    });
                }

                const data = sectionData.get(key)!;
                data.totalAttempts++;
                data.struggles.errorCount += section.errorCount;
                data.struggles.hintsUsed += section.hintsUsed;
                data.struggles.retryCount += section.retryCount;

                if (!section.completed) {
                    data.struggles.abandonCount++;
                }
            }
        }
    }

    // Convert to struggle points
    const strugglePoints: StrugglePoint[] = [];

    for (const [key, data] of sectionData) {
        const avgErrors = data.struggles.errorCount / data.totalAttempts;
        const avgHints = data.struggles.hintsUsed / data.totalAttempts;
        const avgRetries = data.struggles.retryCount / data.totalAttempts;
        const abandonRate = data.struggles.abandonCount / data.totalAttempts;

        // Calculate severity
        const severity =
            avgErrors * 0.2 + avgHints * 0.2 + avgRetries * 0.3 + abandonRate * 0.3;

        // Only include if above threshold
        if (severity < 0.2) continue;

        // Determine struggle type
        const struggleType = determineStruggleType(data.struggles, data.totalAttempts);

        // Find chapters that help
        const beneficialPriorChapters = findBeneficialPriorChapters(
            data.chapterId,
            data.sectionId,
            journeys
        );

        strugglePoints.push({
            chapterId: data.chapterId,
            sectionId: data.sectionId,
            struggleType,
            severity: Math.min(1, severity),
            affectedPercentage:
                (data.struggles.errorCount > 0 ? 1 : 0) / journeys.length,
            commonCauses: inferCommonCauses(struggleType, avgErrors, avgHints),
            beneficialPriorChapters,
            lastUpdated: Date.now(),
        });
    }

    return strugglePoints.sort((a, b) => b.severity - a.severity);
}

/**
 * Determine the type of struggle based on metrics
 */
function determineStruggleType(
    struggles: {
        errorCount: number;
        hintsUsed: number;
        retryCount: number;
        abandonCount: number;
        timeOverExpected: number;
    },
    totalAttempts: number
): StruggleType {
    const avgErrors = struggles.errorCount / totalAttempts;
    const avgHints = struggles.hintsUsed / totalAttempts;
    const abandonRate = struggles.abandonCount / totalAttempts;

    if (abandonRate > 0.3) return "engagement";
    if (avgErrors > 3 && avgHints < 1) return "technical";
    if (avgHints > 2) return "conceptual";
    if (struggles.retryCount / totalAttempts > 2) return "complexity";

    return "prerequisite";
}

/**
 * Infer common causes based on struggle type
 */
function inferCommonCauses(
    type: StruggleType,
    avgErrors: number,
    avgHints: number
): string[] {
    const causes: string[] = [];

    switch (type) {
        case "conceptual":
            causes.push("Core concept not fully understood");
            if (avgHints > 3) causes.push("Relying heavily on hints instead of understanding");
            break;
        case "technical":
            causes.push("Syntax or tooling difficulties");
            if (avgErrors > 5) causes.push("Repeated similar errors");
            break;
        case "prerequisite":
            causes.push("Missing foundational knowledge");
            causes.push("Previous chapters may not have been completed");
            break;
        case "complexity":
            causes.push("Content density too high");
            causes.push("Multiple new concepts introduced simultaneously");
            break;
        case "engagement":
            causes.push("Content not engaging enough");
            causes.push("Potential fatigue or frustration");
            break;
        case "pacing":
            causes.push("Content moves too quickly");
            break;
    }

    return causes;
}

/**
 * Find chapters that help with a specific struggle point
 */
function findBeneficialPriorChapters(
    chapterId: ChapterNodeId,
    sectionId: string,
    journeys: LearnerJourney[]
): ChapterNodeId[] {
    const chapterBenefit = new Map<ChapterNodeId, { helped: number; total: number }>();

    for (const journey of journeys) {
        const chapterIndex = journey.chapterSequence.findIndex(
            (a) => a.chapterId === chapterId
        );
        if (chapterIndex < 0) continue;

        const attempt = journey.chapterSequence[chapterIndex]!;
        const sectionBehavior = attempt.sectionBehaviors.find(
            (s) => s.sectionId === sectionId
        );
        if (!sectionBehavior) continue;

        const hadStruggles = sectionBehavior.errorCount > 2 || !sectionBehavior.completed;

        // Check which chapters were completed before
        const completedBefore = journey.chapterSequence
            .slice(0, chapterIndex)
            .filter((a) => a.completed);

        for (const prior of completedBefore) {
            if (!chapterBenefit.has(prior.chapterId)) {
                chapterBenefit.set(prior.chapterId, { helped: 0, total: 0 });
            }
            const benefit = chapterBenefit.get(prior.chapterId)!;
            benefit.total++;
            if (!hadStruggles) {
                benefit.helped++;
            }
        }
    }

    // Find chapters that significantly reduce struggles
    const beneficial: ChapterNodeId[] = [];
    for (const [prereqId, benefit] of chapterBenefit) {
        if (benefit.total < 5) continue;
        const helpRate = benefit.helped / benefit.total;
        if (helpRate > 0.6) {
            beneficial.push(prereqId);
        }
    }

    return beneficial;
}

// ============================================================================
// COMMON ERROR IDENTIFICATION
// ============================================================================

/**
 * Identify common errors from collective behavior
 */
export function identifyCommonErrors(
    journeys: LearnerJourney[]
): CommonError[] {
    // Aggregate error data from all journeys
    const errorData = new Map<
        string,
        {
            errorType: string;
            chapterId: ChapterNodeId;
            sectionId: string;
            count: number;
            journeyIds: Set<string>;
            preventedByChapters: Map<ChapterNodeId, number>;
        }
    >();

    for (const journey of journeys) {
        for (const attempt of journey.chapterSequence) {
            // Collect errors from section behaviors
            for (const section of attempt.sectionBehaviors) {
                if (section.errorCount === 0) continue;

                // Create a generic error type based on the section
                const errorType = `${attempt.chapterId}:${section.sectionId}:error`;
                const key = errorType;

                if (!errorData.has(key)) {
                    errorData.set(key, {
                        errorType: `Errors in ${section.sectionId}`,
                        chapterId: attempt.chapterId,
                        sectionId: section.sectionId,
                        count: 0,
                        journeyIds: new Set(),
                        preventedByChapters: new Map(),
                    });
                }

                const data = errorData.get(key)!;
                data.count += section.errorCount;
                data.journeyIds.add(journey.userId);
            }
        }
    }

    // Convert to common errors
    const commonErrors: CommonError[] = [];
    const totalLearners = journeys.length;

    for (const [key, data] of errorData) {
        const frequency = data.journeyIds.size / totalLearners;

        // Only include errors affecting significant portion
        if (frequency < 0.1) continue;

        commonErrors.push({
            errorType: data.errorType,
            chapterId: data.chapterId,
            sectionId: data.sectionId,
            frequency,
            preventedByChapters: Array.from(data.preventedByChapters.entries())
                .filter(([_, count]) => count > data.journeyIds.size * 0.5)
                .map(([chapterId]) => chapterId),
            resolution: `Review content in section ${data.sectionId} for clarity`,
        });
    }

    return commonErrors.sort((a, b) => b.frequency - a.frequency);
}

// ============================================================================
// OPTIMAL PATH DISCOVERY
// ============================================================================

/**
 * Discover optimal learning paths from collective behavior
 */
export function discoverOptimalPaths(
    journeys: LearnerJourney[],
    config: CollectiveIntelligenceConfig = DEFAULT_COLLECTIVE_INTELLIGENCE_CONFIG
): OptimalPath[] {
    if (journeys.length < config.minLearnersForAnalysis) {
        return [];
    }

    // Group journeys by chapter sequence pattern
    const pathPatterns = new Map<
        string,
        {
            sequence: ChapterNodeId[];
            journeys: LearnerJourney[];
        }
    >();

    for (const journey of journeys) {
        const completedSequence = journey.chapterSequence
            .filter((a) => a.completed)
            .map((a) => a.chapterId);

        if (completedSequence.length < 2) continue;

        const patternKey = completedSequence.join("->");

        if (!pathPatterns.has(patternKey)) {
            pathPatterns.set(patternKey, {
                sequence: completedSequence,
                journeys: [],
            });
        }

        pathPatterns.get(patternKey)!.journeys.push(journey);
    }

    // Convert to optimal paths
    const optimalPaths: OptimalPath[] = [];

    for (const [patternKey, pattern] of pathPatterns) {
        if (pattern.journeys.length < 3) continue; // Need at least 3 learners

        const metrics = calculatePathMetrics(pattern.journeys);
        const suitability = inferPathSuitability(pattern.journeys);

        // Only include paths with good success rates
        if (metrics.completionRate < 0.6) continue;

        optimalPaths.push({
            id: generateId(),
            chapterSequence: pattern.sequence,
            learnerCount: pattern.journeys.length,
            metrics,
            suitableFor: suitability,
            lastValidated: Date.now(),
        });
    }

    return optimalPaths.sort(
        (a, b) =>
            b.metrics.completionRate * b.learnerCount -
            a.metrics.completionRate * a.learnerCount
    );
}

/**
 * Calculate metrics for a learning path
 */
function calculatePathMetrics(journeys: LearnerJourney[]): PathMetrics {
    const completionRates = journeys.map((j) => j.successMetrics.completionRate);
    const avgCompletionRate =
        completionRates.reduce((a, b) => a + b, 0) / completionRates.length;

    const completionTimes = journeys
        .filter((j) => j.timestamps.completed)
        .map((j) => (j.timestamps.completed! - j.timestamps.started) / 60000);
    const avgCompletionTime =
        completionTimes.length > 0
            ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
            : 0;

    const struggleScores = journeys.map(
        (j) => j.successMetrics.overallStruggleScore
    );
    const avgStruggleScore =
        struggleScores.reduce((a, b) => a + b, 0) / struggleScores.length;

    // Calculate retention rate (how many continue after each chapter)
    let retentionSum = 0;
    let retentionCount = 0;
    for (const journey of journeys) {
        for (let i = 0; i < journey.chapterSequence.length - 1; i++) {
            const current = journey.chapterSequence[i];
            const next = journey.chapterSequence[i + 1];
            if (current?.completed && next) {
                retentionSum++;
            }
            retentionCount++;
        }
    }
    const retentionRate = retentionCount > 0 ? retentionSum / retentionCount : 0;

    return {
        completionRate: avgCompletionRate,
        avgCompletionTimeMinutes: avgCompletionTime,
        avgStruggleScore,
        retentionRate,
        downstreamSuccessRate: avgCompletionRate * retentionRate,
    };
}

/**
 * Infer what learner profiles this path is suitable for
 */
function inferPathSuitability(journeys: LearnerJourney[]): PathSuitability {
    // Analyze final profiles
    const paces = new Set<string>();
    const confidences = new Set<string>();
    const strengthAreas: string[] = [];
    const weaknessAreas: string[] = [];

    for (const journey of journeys) {
        paces.add(journey.finalProfile.pace);
        confidences.add(journey.finalProfile.confidence);
        strengthAreas.push(...journey.finalProfile.strengthAreas);
        weaknessAreas.push(...journey.finalProfile.weaknessAreas);
    }

    // Get most common areas
    const strengthCounts = countOccurrences(strengthAreas);
    const weaknessCounts = countOccurrences(weaknessAreas);

    return {
        paces: Array.from(paces) as PathSuitability["paces"],
        confidences: Array.from(confidences) as PathSuitability["confidences"],
        strengthAreas: getTopN(strengthCounts, 3),
        weaknessAreas: getTopN(weaknessCounts, 3),
    };
}

/**
 * Count occurrences of items in an array
 */
function countOccurrences(items: string[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const item of items) {
        counts.set(item, (counts.get(item) || 0) + 1);
    }
    return counts;
}

/**
 * Get top N items by count
 */
function getTopN(counts: Map<string, number>, n: number): string[] {
    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([item]) => item);
}
