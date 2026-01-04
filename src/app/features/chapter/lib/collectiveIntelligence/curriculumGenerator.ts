/**
 * Emergent Curriculum Generator
 *
 * Generates a crowd-sourced curriculum from collective learner behavior.
 * Instead of hand-crafted prerequisites, this system derives them from
 * actual learning patterns.
 */

import type { ChapterNodeId } from "../chapterGraph";
import type {
    LearnerJourney,
    ImplicitPrerequisite,
    StrugglePoint,
    CommonError,
    OptimalPath,
    EmergentCurriculum,
    CurriculumHealthMetrics,
    CurriculumRecommendation,
    RecommendationType,
    CollectiveIntelligenceConfig,
} from "./types";
import { DEFAULT_COLLECTIVE_INTELLIGENCE_CONFIG } from "./types";
import {
    deriveImplicitPrerequisites,
    identifyStrugglePoints,
    identifyCommonErrors,
    discoverOptimalPaths,
} from "./derivation";
import {
    learnerJourneyStorage,
    implicitPrerequisiteStorage,
    strugglePointStorage,
    commonErrorStorage,
    optimalPathStorage,
    emergentCurriculumStore,
    aggregationMetadataStore,
} from "./storage";

// ============================================================================
// CURRICULUM GENERATION
// ============================================================================

/**
 * Generate the emergent curriculum from collective learner behavior
 */
export function generateEmergentCurriculum(
    config: CollectiveIntelligenceConfig = DEFAULT_COLLECTIVE_INTELLIGENCE_CONFIG
): EmergentCurriculum {
    const startTime = Date.now();

    // Get all analyzable journeys
    const journeys = learnerJourneyStorage.getAnalyzableJourneys(2);

    if (journeys.length < config.minLearnersForAnalysis) {
        // Not enough data - return minimal curriculum
        return createMinimalCurriculum(journeys.length);
    }

    try {
        // Derive implicit prerequisites
        const implicitPrerequisites = deriveImplicitPrerequisites(journeys, config);

        // Identify struggle points
        const strugglePoints = identifyStrugglePoints(journeys, config);

        // Identify common errors
        const commonErrors = identifyCommonErrors(journeys);

        // Discover optimal paths
        const optimalPaths = discoverOptimalPaths(journeys, config);

        // Calculate health metrics
        const healthMetrics = calculateHealthMetrics(
            journeys,
            implicitPrerequisites,
            strugglePoints
        );

        // Generate recommendations
        const recommendations = generateRecommendations(
            implicitPrerequisites,
            strugglePoints,
            commonErrors,
            healthMetrics
        );

        // Create the emergent curriculum
        const curriculum: EmergentCurriculum = {
            version: generateVersion(),
            generatedAt: Date.now(),
            implicitPrerequisites,
            strugglePoints,
            commonErrors,
            optimalPaths,
            healthMetrics,
            recommendations,
        };

        // Persist to storage
        persistCurriculum(curriculum);

        // Record aggregation success
        const processingTime = Date.now() - startTime;
        aggregationMetadataStore.recordAggregation(journeys.length, processingTime);

        return curriculum;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        aggregationMetadataStore.recordError(errorMessage);
        throw error;
    }
}

/**
 * Create a minimal curriculum when not enough data is available
 */
function createMinimalCurriculum(learnerCount: number): EmergentCurriculum {
    return {
        version: generateVersion(),
        generatedAt: Date.now(),
        implicitPrerequisites: [],
        strugglePoints: [],
        commonErrors: [],
        optimalPaths: [],
        healthMetrics: {
            totalLearners: learnerCount,
            avgCompletionRate: 0,
            avgStruggleScore: 0,
            prerequisiteCount: 0,
            overallConfidence: 0,
            problematicChapters: [],
            successfulChapters: [],
        },
        recommendations: [
            {
                type: "add_practice",
                priority: 5,
                description: "Not enough learner data to generate insights",
                affectedChapters: [],
                suggestedAction: "Continue collecting learner behavior data",
                expectedImpact: "Insights will improve with more learners",
                evidence: `Only ${learnerCount} learners analyzed, need at least 10`,
            },
        ],
    };
}

/**
 * Generate a version string for cache invalidation
 */
function generateVersion(): string {
    return `v${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Calculate health metrics for the curriculum
 */
function calculateHealthMetrics(
    journeys: LearnerJourney[],
    prerequisites: ImplicitPrerequisite[],
    strugglePoints: StrugglePoint[]
): CurriculumHealthMetrics {
    // Calculate averages
    const completionRates = journeys.map((j) => j.successMetrics.completionRate);
    const avgCompletionRate =
        completionRates.length > 0
            ? completionRates.reduce((a, b) => a + b, 0) / completionRates.length
            : 0;

    const struggleScores = journeys.map((j) => j.successMetrics.overallStruggleScore);
    const avgStruggleScore =
        struggleScores.length > 0
            ? struggleScores.reduce((a, b) => a + b, 0) / struggleScores.length
            : 0;

    // Calculate overall confidence
    const overallConfidence =
        prerequisites.length > 0
            ? prerequisites.reduce((sum, p) => sum + p.confidence, 0) /
              prerequisites.length
            : 0;

    // Identify problematic chapters (high struggle, low completion)
    const chapterMetrics = new Map<
        ChapterNodeId,
        { struggles: number; completions: number; attempts: number }
    >();

    for (const journey of journeys) {
        for (const attempt of journey.chapterSequence) {
            if (!chapterMetrics.has(attempt.chapterId)) {
                chapterMetrics.set(attempt.chapterId, {
                    struggles: 0,
                    completions: 0,
                    attempts: 0,
                });
            }
            const metrics = chapterMetrics.get(attempt.chapterId)!;
            metrics.attempts++;
            if (attempt.completed) metrics.completions++;
            metrics.struggles += attempt.struggleMetrics.frustrationScore;
        }
    }

    const problematicChapters: ChapterNodeId[] = [];
    const successfulChapters: ChapterNodeId[] = [];

    for (const [chapterId, metrics] of chapterMetrics) {
        const completionRate = metrics.completions / metrics.attempts;
        const avgStruggle = metrics.struggles / metrics.attempts;

        if (completionRate < 0.5 || avgStruggle > 0.6) {
            problematicChapters.push(chapterId);
        } else if (completionRate > 0.8 && avgStruggle < 0.3) {
            successfulChapters.push(chapterId);
        }
    }

    return {
        totalLearners: journeys.length,
        avgCompletionRate,
        avgStruggleScore,
        prerequisiteCount: prerequisites.length,
        overallConfidence,
        problematicChapters,
        successfulChapters,
    };
}

/**
 * Generate recommendations for curriculum improvement
 */
function generateRecommendations(
    prerequisites: ImplicitPrerequisite[],
    strugglePoints: StrugglePoint[],
    commonErrors: CommonError[],
    healthMetrics: CurriculumHealthMetrics
): CurriculumRecommendation[] {
    const recommendations: CurriculumRecommendation[] = [];

    // Recommend adding strong prerequisites
    for (const prereq of prerequisites.slice(0, 5)) {
        if (prereq.confidence > 0.8 && prereq.strength > 0.6) {
            recommendations.push({
                type: "add_prerequisite",
                priority: Math.round(prereq.confidence * prereq.strength * 10),
                description: `Strong evidence that "${prereq.prerequisiteChapterId}" should be prerequisite for "${prereq.dependentChapterId}"`,
                affectedChapters: [prereq.prerequisiteChapterId, prereq.dependentChapterId],
                suggestedAction: "Add prerequisite edge in curriculum graph",
                expectedImpact: `${Math.round(prereq.evidence.successRateWithPrereq * 100 - prereq.evidence.successRateWithoutPrereq * 100)}% improvement in success rate`,
                evidence: `${prereq.evidence.learnersWithPrereq + prereq.evidence.learnersWithoutPrereq} learners analyzed`,
            });
        }
    }

    // Recommend addressing severe struggle points
    for (const struggle of strugglePoints.filter((s) => s.severity > 0.7)) {
        recommendations.push({
            type: inferRecommendationType(struggle),
            priority: Math.round(struggle.severity * 10),
            description: `High struggle point in ${struggle.chapterId}, section ${struggle.sectionId}`,
            affectedChapters: [struggle.chapterId],
            suggestedAction: getSuggestedAction(struggle),
            expectedImpact: `Reduce struggle for ${Math.round(struggle.affectedPercentage * 100)}% of learners`,
            evidence: `Struggle type: ${struggle.struggleType}, severity: ${Math.round(struggle.severity * 100)}%`,
        });
    }

    // Recommend addressing common errors
    for (const error of commonErrors.slice(0, 3)) {
        recommendations.push({
            type: "improve_explanation",
            priority: Math.round(error.frequency * 8),
            description: `Common error in ${error.chapterId}: ${error.errorType}`,
            affectedChapters: [error.chapterId, ...error.preventedByChapters],
            suggestedAction: error.resolution,
            expectedImpact: `Affects ${Math.round(error.frequency * 100)}% of learners`,
            evidence: `Section: ${error.sectionId}`,
        });
    }

    // Recommend splitting problematic chapters
    for (const chapterId of healthMetrics.problematicChapters) {
        const struggleCount = strugglePoints.filter(
            (s) => s.chapterId === chapterId
        ).length;

        if (struggleCount > 3) {
            recommendations.push({
                type: "split_chapter",
                priority: 7,
                description: `Chapter "${chapterId}" has multiple struggle points`,
                affectedChapters: [chapterId],
                suggestedAction: "Consider splitting into smaller chapters",
                expectedImpact: "Reduce cognitive load and improve retention",
                evidence: `${struggleCount} distinct struggle points identified`,
            });
        }
    }

    // Sort by priority
    return recommendations.sort((a, b) => b.priority - a.priority);
}

/**
 * Infer recommendation type from struggle point
 */
function inferRecommendationType(struggle: StrugglePoint): RecommendationType {
    switch (struggle.struggleType) {
        case "prerequisite":
            return "add_prerequisite";
        case "complexity":
            return "simplify_content";
        case "conceptual":
            return "improve_explanation";
        case "technical":
            return "add_practice";
        case "engagement":
            return "reorder_content";
        case "pacing":
            return "split_chapter";
        default:
            return "improve_explanation";
    }
}

/**
 * Get suggested action for a struggle point
 */
function getSuggestedAction(struggle: StrugglePoint): string {
    switch (struggle.struggleType) {
        case "prerequisite":
            return struggle.beneficialPriorChapters.length > 0
                ? `Add prerequisite: ${struggle.beneficialPriorChapters[0]}`
                : "Add foundational content before this section";
        case "complexity":
            return "Break down content into smaller, digestible chunks";
        case "conceptual":
            return "Add more examples and visual explanations";
        case "technical":
            return "Add step-by-step debugging exercises";
        case "engagement":
            return "Add interactive elements or practical projects";
        case "pacing":
            return "Add checkpoints and practice opportunities";
        default:
            return "Review and improve section content";
    }
}

/**
 * Persist the curriculum to storage
 */
function persistCurriculum(curriculum: EmergentCurriculum): void {
    emergentCurriculumStore.save(curriculum);
    implicitPrerequisiteStorage.saveAll(curriculum.implicitPrerequisites);
    strugglePointStorage.saveAll(curriculum.strugglePoints);
    commonErrorStorage.saveAll(curriculum.commonErrors);
    optimalPathStorage.saveAll(curriculum.optimalPaths);
}

// ============================================================================
// CURRICULUM ACCESS
// ============================================================================

/**
 * Get the current emergent curriculum, regenerating if stale
 */
export function getEmergentCurriculum(
    config: CollectiveIntelligenceConfig = DEFAULT_COLLECTIVE_INTELLIGENCE_CONFIG
): EmergentCurriculum {
    const existing = emergentCurriculumStore.get();

    if (existing && !emergentCurriculumStore.needsRecomputation(config.recomputeInterval)) {
        return existing;
    }

    return generateEmergentCurriculum(config);
}

/**
 * Get implicit prerequisites for a chapter
 */
export function getImplicitPrerequisitesForChapter(
    chapterId: ChapterNodeId,
    minConfidence: number = 0.7
): ImplicitPrerequisite[] {
    return implicitPrerequisiteStorage
        .getForChapter(chapterId)
        .filter((p) => p.confidence >= minConfidence);
}

/**
 * Get struggle points for a chapter
 */
export function getStrugglePointsForChapter(
    chapterId: ChapterNodeId
): StrugglePoint[] {
    return strugglePointStorage.getForChapter(chapterId);
}

/**
 * Get recommended path for a learner profile
 */
export function getRecommendedPath(
    pace: string,
    confidence: string
): OptimalPath | null {
    const paths = optimalPathStorage.getForProfile(pace, confidence);
    return paths.length > 0 ? paths[0]! : null;
}

/**
 * Check if a chapter should have an implicit prerequisite
 */
export function shouldHavePrerequisite(
    prereqId: ChapterNodeId,
    dependentId: ChapterNodeId,
    minConfidence: number = 0.7
): boolean {
    const prereqs = implicitPrerequisiteStorage.getForChapter(dependentId);
    const match = prereqs.find((p) => p.prerequisiteChapterId === prereqId);
    return match !== undefined && match.confidence >= minConfidence;
}

// ============================================================================
// CURRICULUM MERGING
// ============================================================================

/**
 * Merge emergent prerequisites with static prerequisites
 * Returns combined edges that respect both hand-crafted and learned relationships
 */
export function mergeWithStaticPrerequisites(
    staticEdges: Array<{ from: ChapterNodeId; to: ChapterNodeId }>,
    implicitPrerequisites: ImplicitPrerequisite[],
    options: {
        minConfidence?: number;
        preferStatic?: boolean;
    } = {}
): Array<{
    from: ChapterNodeId;
    to: ChapterNodeId;
    source: "static" | "emergent";
    confidence?: number;
}> {
    const { minConfidence = 0.7, preferStatic = true } = options;

    const mergedEdges = new Map<
        string,
        { from: ChapterNodeId; to: ChapterNodeId; source: "static" | "emergent"; confidence?: number }
    >();

    // Add static edges first
    for (const edge of staticEdges) {
        const key = `${edge.from}->${edge.to}`;
        mergedEdges.set(key, { ...edge, source: "static" });
    }

    // Add emergent edges (only if not already present or if not preferring static)
    for (const prereq of implicitPrerequisites) {
        if (prereq.confidence < minConfidence) continue;

        const key = `${prereq.prerequisiteChapterId}->${prereq.dependentChapterId}`;

        if (!mergedEdges.has(key) || !preferStatic) {
            mergedEdges.set(key, {
                from: prereq.prerequisiteChapterId,
                to: prereq.dependentChapterId,
                source: "emergent",
                confidence: prereq.confidence,
            });
        }
    }

    return Array.from(mergedEdges.values());
}
