"use client";

/**
 * Mastery Signal Derivation Module
 *
 * Derives implicit skill proficiency from completion patterns.
 * Uses completion telemetry (time, hints, attempts, score) to infer
 * mastery level and feed back to Career Oracle for dynamic path recalibration.
 *
 * Key Insight: A quick completion with no hints signals strong understanding;
 * slow completion with many hints suggests struggling understanding.
 */

import type { CompletionData, DifficultyLevel } from "./types";

// ============================================================================
// MASTERY SIGNAL TYPES
// ============================================================================

/**
 * Mastery level inferred from completion patterns
 */
export type MasteryLevel =
    | "struggling" // Significant difficulty, needs reinforcement
    | "developing" // Making progress but not yet proficient
    | "proficient" // Meets expected competency
    | "advanced" // Exceeds expectations, quick learner
    | "mastered"; // Expert level, minimal effort needed

/**
 * Mastery signal derived from a single completion
 */
export interface MasterySignal {
    /** Unique signal identifier */
    id: string;
    /** User ID */
    userId: string;
    /** Skill being assessed */
    skillId: string;
    /** Skill name for display */
    skillName: string;
    /** Content ID that generated this signal */
    contentId: string;
    /** Content type */
    contentType: "lesson" | "exercise" | "quiz" | "project";
    /** Inferred mastery level */
    masteryLevel: MasteryLevel;
    /** Confidence in the assessment (0-1) */
    confidence: number;
    /** Numeric proficiency score (1-5) */
    proficiencyScore: 1 | 2 | 3 | 4 | 5;
    /** Raw metrics used for derivation */
    metrics: CompletionMetrics;
    /** Timestamp of derivation */
    derivedAt: string;
    /** Content difficulty when completed */
    contentDifficulty: DifficultyLevel;
}

/**
 * Metrics used to derive mastery signal
 */
export interface CompletionMetrics {
    /** Time spent in minutes */
    timeSpent: number;
    /** Expected time for this content type/difficulty */
    expectedTime: number;
    /** Time efficiency ratio (expected/actual) - >1 means faster */
    timeEfficiency: number;
    /** Number of hints used */
    hintsUsed: number;
    /** Maximum hints available */
    hintsAvailable: number;
    /** Hints efficiency (1 - hints used ratio) */
    hintsEfficiency: number;
    /** Number of attempts */
    attempts: number;
    /** First-attempt success */
    firstAttemptSuccess: boolean;
    /** Score if applicable (0-100) */
    score?: number;
    /** Normalized score (0-1) */
    normalizedScore: number;
}

/**
 * Aggregated skill proficiency across multiple completions
 */
export interface SkillProficiency {
    /** Skill ID */
    skillId: string;
    /** Skill name */
    skillName: string;
    /** User ID */
    userId: string;
    /** Overall mastery level */
    masteryLevel: MasteryLevel;
    /** Numeric proficiency (1-5) */
    proficiency: 1 | 2 | 3 | 4 | 5;
    /** Confidence in the assessment */
    confidence: number;
    /** Number of signals contributing to this assessment */
    signalCount: number;
    /** Trend direction */
    trend: "improving" | "stable" | "declining";
    /** Last updated */
    lastUpdated: string;
    /** Historical proficiency for trend analysis */
    history: ProficiencyHistoryPoint[];
    /** Individual signals */
    signals: MasterySignal[];
}

/**
 * Historical proficiency data point
 */
export interface ProficiencyHistoryPoint {
    /** Timestamp */
    timestamp: string;
    /** Proficiency at this point */
    proficiency: number;
    /** Content that triggered this update */
    contentId: string;
}

/**
 * Path difficulty adjustment recommendation
 */
export interface DifficultyAdjustment {
    /** Skill ID affected */
    skillId: string;
    /** Current path difficulty */
    currentDifficulty: DifficultyLevel;
    /** Recommended difficulty */
    recommendedDifficulty: DifficultyLevel;
    /** Adjustment direction */
    direction: "easier" | "same" | "harder";
    /** Magnitude of adjustment (0-1) */
    magnitude: number;
    /** Reasoning for the adjustment */
    reasoning: string;
    /** Confidence in recommendation */
    confidence: number;
}

/**
 * Pacing adjustment recommendation
 */
export interface PacingAdjustment {
    /** Module ID affected */
    moduleId: string;
    /** Current estimated hours */
    currentEstimatedHours: number;
    /** Recommended estimated hours */
    recommendedEstimatedHours: number;
    /** Adjustment factor (>1 = more time, <1 = less time) */
    adjustmentFactor: number;
    /** Reasoning */
    reasoning: string;
}

/**
 * Complete path recalibration recommendation
 */
export interface PathRecalibration {
    /** User ID */
    userId: string;
    /** Path ID */
    pathId: string;
    /** Skill proficiencies derived from completions */
    skillProficiencies: SkillProficiency[];
    /** Difficulty adjustments recommended */
    difficultyAdjustments: DifficultyAdjustment[];
    /** Pacing adjustments recommended */
    pacingAdjustments: PacingAdjustment[];
    /** Overall path fitness score (0-1) */
    pathFitness: number;
    /** Recommended actions */
    recommendations: PathRecommendation[];
    /** Generated at */
    generatedAt: string;
}

/**
 * Specific path recommendation
 */
export interface PathRecommendation {
    /** Recommendation type */
    type: "skip_module" | "add_module" | "repeat_module" | "adjust_difficulty" | "adjust_pacing" | "add_practice";
    /** Target module ID (if applicable) */
    moduleId?: string;
    /** Target skill ID (if applicable) */
    skillId?: string;
    /** Recommendation details */
    description: string;
    /** Priority (1-5, higher is more important) */
    priority: 1 | 2 | 3 | 4 | 5;
    /** Impact on learning outcome */
    impact: "low" | "medium" | "high";
}

// ============================================================================
// CONSTANTS & THRESHOLDS
// ============================================================================

/**
 * Expected completion times by content type and difficulty (in minutes)
 */
export const EXPECTED_TIMES: Record<CompletionData["contentType"], Record<DifficultyLevel, number>> = {
    lesson: {
        beginner: 15,
        intermediate: 25,
        advanced: 40,
        expert: 60,
    },
    exercise: {
        beginner: 10,
        intermediate: 20,
        advanced: 35,
        expert: 50,
    },
    quiz: {
        beginner: 5,
        intermediate: 10,
        advanced: 15,
        expert: 20,
    },
    project: {
        beginner: 120,
        intermediate: 240,
        advanced: 480,
        expert: 960,
    },
};

/**
 * Typical hints available by content type
 */
export const TYPICAL_HINTS: Record<CompletionData["contentType"], number> = {
    lesson: 0, // Lessons don't have hints
    exercise: 3,
    quiz: 2,
    project: 5,
};

/**
 * Thresholds for mastery level determination
 */
export const MASTERY_THRESHOLDS = {
    // Time efficiency thresholds (actual/expected ratio)
    timeEfficiency: {
        struggling: 2.0, // Takes 2x or more expected time
        developing: 1.3, // Takes 1.3x expected time
        proficient: 0.8, // Takes around expected time
        advanced: 0.5, // Takes half expected time
        mastered: 0.3, // Takes 30% or less of expected time
    },
    // Hints usage thresholds (ratio of hints used)
    hintsUsage: {
        struggling: 0.8, // Uses 80%+ of hints
        developing: 0.5, // Uses 50% of hints
        proficient: 0.2, // Uses 20% of hints
        advanced: 0.05, // Uses minimal hints
        mastered: 0, // Uses no hints
    },
    // Score thresholds (normalized 0-1)
    score: {
        struggling: 0.5,
        developing: 0.65,
        proficient: 0.8,
        advanced: 0.9,
        mastered: 0.95,
    },
    // Minimum signals for confident assessment
    minSignalsForConfidence: 3,
    // Decay factor for older signals (per day)
    signalDecayPerDay: 0.02,
};

// ============================================================================
// MASTERY CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate completion metrics from raw completion data
 */
export function calculateCompletionMetrics(
    completion: CompletionData,
    contentDifficulty: DifficultyLevel
): CompletionMetrics {
    const expectedTime = EXPECTED_TIMES[completion.contentType][contentDifficulty];
    const hintsAvailable = TYPICAL_HINTS[completion.contentType];

    const timeEfficiency = completion.timeSpent > 0 ? expectedTime / completion.timeSpent : 1;
    const hintsEfficiency = hintsAvailable > 0
        ? 1 - (completion.hintsUsed / hintsAvailable)
        : 1; // No hints available = perfect efficiency

    const normalizedScore = completion.score !== undefined
        ? completion.score / 100
        : (completion.status === "completed" ? 0.8 : 0.5); // Default scores

    return {
        timeSpent: completion.timeSpent,
        expectedTime,
        timeEfficiency: Math.min(timeEfficiency, 3), // Cap at 3x efficiency
        hintsUsed: completion.hintsUsed,
        hintsAvailable,
        hintsEfficiency: Math.max(0, hintsEfficiency),
        attempts: completion.attempts,
        firstAttemptSuccess: completion.attempts === 1 && completion.status === "completed",
        score: completion.score,
        normalizedScore,
    };
}

/**
 * Derive mastery level from completion metrics
 */
export function deriveMasteryLevel(metrics: CompletionMetrics): {
    level: MasteryLevel;
    confidence: number;
    proficiency: 1 | 2 | 3 | 4 | 5;
} {
    const thresholds = MASTERY_THRESHOLDS;

    // Calculate composite score from multiple factors
    let timeScore = 0;
    let hintsScore = 0;
    let performanceScore = metrics.normalizedScore;

    // Time efficiency scoring
    if (metrics.timeEfficiency >= 1 / thresholds.timeEfficiency.mastered) {
        timeScore = 5;
    } else if (metrics.timeEfficiency >= 1 / thresholds.timeEfficiency.advanced) {
        timeScore = 4;
    } else if (metrics.timeEfficiency >= 1 / thresholds.timeEfficiency.proficient) {
        timeScore = 3;
    } else if (metrics.timeEfficiency >= 1 / thresholds.timeEfficiency.developing) {
        timeScore = 2;
    } else {
        timeScore = 1;
    }

    // Hints efficiency scoring
    if (metrics.hintsEfficiency >= 1 - thresholds.hintsUsage.mastered) {
        hintsScore = 5;
    } else if (metrics.hintsEfficiency >= 1 - thresholds.hintsUsage.advanced) {
        hintsScore = 4;
    } else if (metrics.hintsEfficiency >= 1 - thresholds.hintsUsage.proficient) {
        hintsScore = 3;
    } else if (metrics.hintsEfficiency >= 1 - thresholds.hintsUsage.developing) {
        hintsScore = 2;
    } else {
        hintsScore = 1;
    }

    // Bonus for first-attempt success
    const firstAttemptBonus = metrics.firstAttemptSuccess ? 0.5 : 0;

    // Weighted composite score (time: 30%, hints: 30%, performance: 40%)
    const compositeScore =
        (timeScore * 0.3 + hintsScore * 0.3 + performanceScore * 5 * 0.4) + firstAttemptBonus;

    // Normalize to 1-5 scale
    const rawProficiency = Math.min(5, Math.max(1, compositeScore));
    const proficiency = Math.round(rawProficiency) as 1 | 2 | 3 | 4 | 5;

    // Determine mastery level
    let level: MasteryLevel;
    if (proficiency >= 5) {
        level = "mastered";
    } else if (proficiency >= 4) {
        level = "advanced";
    } else if (proficiency >= 3) {
        level = "proficient";
    } else if (proficiency >= 2) {
        level = "developing";
    } else {
        level = "struggling";
    }

    // Calculate confidence based on data quality
    let confidence = 0.5; // Base confidence
    if (metrics.score !== undefined) confidence += 0.2; // Has explicit score
    if (metrics.timeSpent > 0) confidence += 0.15; // Has time data
    if (metrics.hintsAvailable > 0) confidence += 0.15; // Has hints tracking

    return {
        level,
        confidence: Math.min(1, confidence),
        proficiency,
    };
}

/**
 * Generate a mastery signal from completion data
 */
export function generateMasterySignal(
    completion: CompletionData,
    skillId: string,
    skillName: string,
    contentDifficulty: DifficultyLevel
): MasterySignal {
    const metrics = calculateCompletionMetrics(completion, contentDifficulty);
    const { level, confidence, proficiency } = deriveMasteryLevel(metrics);

    return {
        id: `signal-${completion.id}-${Date.now()}`,
        userId: completion.userId,
        skillId,
        skillName,
        contentId: completion.contentId,
        contentType: completion.contentType,
        masteryLevel: level,
        confidence,
        proficiencyScore: proficiency,
        metrics,
        derivedAt: new Date().toISOString(),
        contentDifficulty,
    };
}

/**
 * Aggregate multiple signals into a skill proficiency assessment
 */
export function aggregateSkillProficiency(
    signals: MasterySignal[],
    skillId: string,
    skillName: string,
    userId: string
): SkillProficiency {
    if (signals.length === 0) {
        return {
            skillId,
            skillName,
            userId,
            masteryLevel: "developing",
            proficiency: 2,
            confidence: 0,
            signalCount: 0,
            trend: "stable",
            lastUpdated: new Date().toISOString(),
            history: [],
            signals: [],
        };
    }

    // Sort signals by date (newest first)
    const sortedSignals = [...signals].sort(
        (a, b) => new Date(b.derivedAt).getTime() - new Date(a.derivedAt).getTime()
    );

    // Apply time decay to confidence weights
    const now = new Date();
    const weightedSignals = sortedSignals.map((signal) => {
        const ageInDays = (now.getTime() - new Date(signal.derivedAt).getTime()) / (1000 * 60 * 60 * 24);
        const decayFactor = Math.max(0.1, 1 - ageInDays * MASTERY_THRESHOLDS.signalDecayPerDay);
        return {
            signal,
            weight: signal.confidence * decayFactor,
        };
    });

    // Calculate weighted average proficiency
    const totalWeight = weightedSignals.reduce((sum, ws) => sum + ws.weight, 0);
    const weightedProficiency = weightedSignals.reduce(
        (sum, ws) => sum + ws.signal.proficiencyScore * ws.weight,
        0
    ) / totalWeight;

    const proficiency = Math.round(weightedProficiency) as 1 | 2 | 3 | 4 | 5;

    // Determine mastery level from proficiency
    let masteryLevel: MasteryLevel;
    if (proficiency >= 5) {
        masteryLevel = "mastered";
    } else if (proficiency >= 4) {
        masteryLevel = "advanced";
    } else if (proficiency >= 3) {
        masteryLevel = "proficient";
    } else if (proficiency >= 2) {
        masteryLevel = "developing";
    } else {
        masteryLevel = "struggling";
    }

    // Calculate confidence based on signal count and consistency
    const signalCount = signals.length;
    const baseConfidence = Math.min(1, signalCount / MASTERY_THRESHOLDS.minSignalsForConfidence);
    const avgConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signalCount;
    const confidence = baseConfidence * avgConfidence;

    // Determine trend from recent signals
    let trend: "improving" | "stable" | "declining" = "stable";
    if (signalCount >= 3) {
        const recentThree = sortedSignals.slice(0, 3);
        const olderAvg = signalCount > 3
            ? sortedSignals.slice(3).reduce((sum, s) => sum + s.proficiencyScore, 0) /
              (signalCount - 3)
            : recentThree[2].proficiencyScore;
        const recentAvg = recentThree.reduce((sum, s) => sum + s.proficiencyScore, 0) / 3;

        if (recentAvg - olderAvg > 0.5) {
            trend = "improving";
        } else if (olderAvg - recentAvg > 0.5) {
            trend = "declining";
        }
    }

    // Build history
    const history: ProficiencyHistoryPoint[] = sortedSignals.map((signal) => ({
        timestamp: signal.derivedAt,
        proficiency: signal.proficiencyScore,
        contentId: signal.contentId,
    }));

    return {
        skillId,
        skillName,
        userId,
        masteryLevel,
        proficiency,
        confidence,
        signalCount,
        trend,
        lastUpdated: sortedSignals[0]?.derivedAt || new Date().toISOString(),
        history,
        signals: sortedSignals,
    };
}

/**
 * Generate difficulty adjustment recommendations
 */
export function generateDifficultyAdjustment(
    proficiency: SkillProficiency,
    currentDifficulty: DifficultyLevel
): DifficultyAdjustment {
    const difficultyLevels: DifficultyLevel[] = ["beginner", "intermediate", "advanced", "expert"];
    const currentIndex = difficultyLevels.indexOf(currentDifficulty);

    let recommendedIndex = currentIndex;
    let direction: "easier" | "same" | "harder" = "same";
    let reasoning = "Current difficulty level is appropriate for the learner's demonstrated proficiency.";

    // Adjust based on proficiency
    if (proficiency.proficiency >= 4 && proficiency.confidence >= 0.6) {
        // Advanced/Mastered - can handle harder content
        if (currentIndex < difficultyLevels.length - 1) {
            recommendedIndex = Math.min(currentIndex + 1, difficultyLevels.length - 1);
            direction = "harder";
            reasoning = `Learner demonstrates ${proficiency.masteryLevel} level with ${(proficiency.confidence * 100).toFixed(0)}% confidence. Ready for more challenging content.`;
        }
    } else if (proficiency.proficiency <= 2 && proficiency.confidence >= 0.5) {
        // Struggling/Developing - needs easier content
        if (currentIndex > 0) {
            recommendedIndex = Math.max(currentIndex - 1, 0);
            direction = "easier";
            reasoning = `Learner is ${proficiency.masteryLevel} with this content. Recommend stepping back to build stronger foundations.`;
        }
    }

    const magnitude = Math.abs(recommendedIndex - currentIndex) / (difficultyLevels.length - 1);

    return {
        skillId: proficiency.skillId,
        currentDifficulty,
        recommendedDifficulty: difficultyLevels[recommendedIndex],
        direction,
        magnitude,
        reasoning,
        confidence: proficiency.confidence,
    };
}

/**
 * Generate pacing adjustment recommendations
 */
export function generatePacingAdjustment(
    proficiency: SkillProficiency,
    moduleId: string,
    currentEstimatedHours: number
): PacingAdjustment {
    let adjustmentFactor = 1.0;
    let reasoning = "Current pacing is appropriate.";

    // Calculate average time efficiency from signals
    const avgTimeEfficiency = proficiency.signals.length > 0
        ? proficiency.signals.reduce((sum, s) => sum + s.metrics.timeEfficiency, 0) /
          proficiency.signals.length
        : 1;

    if (avgTimeEfficiency > 1.5) {
        // Learner is much faster than expected
        adjustmentFactor = 0.7;
        reasoning = "Learner completes content significantly faster than estimated. Reducing time allocation.";
    } else if (avgTimeEfficiency > 1.2) {
        adjustmentFactor = 0.85;
        reasoning = "Learner is moderately faster than expected.";
    } else if (avgTimeEfficiency < 0.5) {
        // Learner is much slower
        adjustmentFactor = 1.5;
        reasoning = "Learner needs more time than estimated. Increasing time allocation for better learning outcomes.";
    } else if (avgTimeEfficiency < 0.7) {
        adjustmentFactor = 1.25;
        reasoning = "Learner is slightly slower than expected. Adjusting pacing.";
    }

    return {
        moduleId,
        currentEstimatedHours,
        recommendedEstimatedHours: Math.round(currentEstimatedHours * adjustmentFactor * 10) / 10,
        adjustmentFactor,
        reasoning,
    };
}

/**
 * Generate path recommendations based on proficiency
 */
export function generatePathRecommendations(
    proficiencies: SkillProficiency[]
): PathRecommendation[] {
    const recommendations: PathRecommendation[] = [];

    for (const proficiency of proficiencies) {
        // Recommend repeating module for struggling learners
        if (proficiency.masteryLevel === "struggling" && proficiency.confidence >= 0.5) {
            recommendations.push({
                type: "repeat_module",
                skillId: proficiency.skillId,
                description: `Consider revisiting content for "${proficiency.skillName}" - current proficiency shows room for improvement.`,
                priority: 5,
                impact: "high",
            });
        }

        // Recommend additional practice for developing learners
        if (proficiency.masteryLevel === "developing" && proficiency.confidence >= 0.6) {
            recommendations.push({
                type: "add_practice",
                skillId: proficiency.skillId,
                description: `Add more practice exercises for "${proficiency.skillName}" to strengthen foundations.`,
                priority: 3,
                impact: "medium",
            });
        }

        // Recommend skipping for mastered skills
        if (proficiency.masteryLevel === "mastered" && proficiency.confidence >= 0.7) {
            recommendations.push({
                type: "skip_module",
                skillId: proficiency.skillId,
                description: `Learner has mastered "${proficiency.skillName}" - consider skipping introductory content.`,
                priority: 2,
                impact: "low",
            });
        }

        // Difficulty adjustment recommendation
        if (proficiency.trend === "improving" && proficiency.proficiency >= 3) {
            recommendations.push({
                type: "adjust_difficulty",
                skillId: proficiency.skillId,
                description: `Learner is improving in "${proficiency.skillName}" - consider increasing difficulty.`,
                priority: 3,
                impact: "medium",
            });
        }
    }

    // Sort by priority (highest first)
    return recommendations.sort((a, b) => b.priority - a.priority);
}

/**
 * Generate complete path recalibration recommendation
 */
export function generatePathRecalibration(
    userId: string,
    pathId: string,
    proficiencies: SkillProficiency[],
    moduleDifficulties: Record<string, DifficultyLevel>,
    moduleEstimatedHours: Record<string, number>
): PathRecalibration {
    // Generate difficulty adjustments for each skill
    const difficultyAdjustments: DifficultyAdjustment[] = proficiencies
        .filter((p) => moduleDifficulties[p.skillId])
        .map((p) => generateDifficultyAdjustment(p, moduleDifficulties[p.skillId]));

    // Generate pacing adjustments
    const pacingAdjustments: PacingAdjustment[] = proficiencies
        .filter((p) => moduleEstimatedHours[p.skillId])
        .map((p) =>
            generatePacingAdjustment(p, p.skillId, moduleEstimatedHours[p.skillId])
        );

    // Generate recommendations
    const recommendations = generatePathRecommendations(proficiencies);

    // Calculate overall path fitness
    const avgProficiency = proficiencies.length > 0
        ? proficiencies.reduce((sum, p) => sum + p.proficiency, 0) / proficiencies.length
        : 3;
    const avgConfidence = proficiencies.length > 0
        ? proficiencies.reduce((sum, p) => sum + p.confidence, 0) / proficiencies.length
        : 0.5;

    // Path fitness: higher when proficiency is around 3-4 (appropriate challenge)
    // Too easy (5) or too hard (1) reduces fitness
    const optimalDeviation = Math.abs(avgProficiency - 3.5);
    const pathFitness = Math.max(0, 1 - optimalDeviation / 2.5) * avgConfidence;

    return {
        userId,
        pathId,
        skillProficiencies: proficiencies,
        difficultyAdjustments,
        pacingAdjustments,
        pathFitness,
        recommendations,
        generatedAt: new Date().toISOString(),
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const masterySignalUtils = {
    calculateCompletionMetrics,
    deriveMasteryLevel,
    generateMasterySignal,
    aggregateSkillProficiency,
    generateDifficultyAdjustment,
    generatePacingAdjustment,
    generatePathRecommendations,
    generatePathRecalibration,
    EXPECTED_TIMES,
    TYPICAL_HINTS,
    MASTERY_THRESHOLDS,
};
