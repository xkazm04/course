/**
 * Friction-Based Skill Assessment
 *
 * This module transforms friction signals (backNavigation, rapidClicks, inactivity)
 * into implicit skill assessments. These signals reveal user competence levels:
 *
 * - High back navigation → Unfamiliarity with decision-making in domain
 * - Long inactivity → Knowledge gaps or confusion
 * - Rapid clicks → Frustration, potentially from overwhelm
 * - Errors → Misunderstanding of concepts
 *
 * These signals feed into the PathCalculator to adjust curriculum recommendations.
 */

import type { FrictionSignals } from "./useFrictionDetection";

// ============================================================================
// Types
// ============================================================================

/**
 * Competence dimensions derived from friction signals
 */
export interface FrictionDerivedCompetence {
    /** Decision-making confidence in this domain (0-100) */
    decisionConfidence: number;
    /** Domain knowledge familiarity (0-100) */
    domainFamiliarity: number;
    /** Pace preference: can user handle complex info at once? (0-100) */
    informationProcessingSpeed: number;
    /** Error tolerance: does user understand validation rules? (0-100) */
    conceptualClarity: number;
    /** Overall engagement quality (0-100) */
    engagementQuality: number;
}

/**
 * Curriculum adjustment recommendations based on friction analysis
 */
export interface CurriculumAdjustment {
    /** Should include more foundational decision-making content */
    addFoundationalContent: boolean;
    /** Suggested pace modifier (0.5 = slower, 1 = normal, 1.5 = faster) */
    paceModifier: number;
    /** Additional practice exercises needed */
    extraPracticeModules: number;
    /** Should include more explanatory content */
    enhancedExplanations: boolean;
    /** Suggested content density (sparse, normal, dense) */
    contentDensity: "sparse" | "normal" | "dense";
    /** Priority topics to reinforce */
    reinforcementTopics: string[];
    /** Confidence in this assessment (0-100) */
    assessmentConfidence: number;
}

/**
 * Session-level friction aggregation for pattern analysis
 */
export interface FrictionSession {
    sessionId: string;
    startTime: number;
    signals: FrictionSignals;
    competence: FrictionDerivedCompetence;
    stepCompletions: number;
    modeChanges: number;
}

/**
 * Aggregated friction patterns across multiple sessions
 * Used to inform defaults for similar user profiles
 */
export interface FrictionPatternProfile {
    profileId: string;
    sessions: FrictionSession[];
    averageCompetence: FrictionDerivedCompetence;
    suggestedStartingMode: "wizard" | "live-form" | "ai-chat";
    suggestedCurriculumAdjustment: CurriculumAdjustment;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Weight factors for computing competence from friction signals
 */
const COMPETENCE_WEIGHTS = {
    backNavigation: {
        decisionConfidence: -15,  // Heavy back navigation = low decision confidence
        domainFamiliarity: -10,
    },
    rapidClicks: {
        informationProcessingSpeed: -20,  // Frustration = overwhelm with info speed
        engagementQuality: -15,
    },
    inactivity: {
        domainFamiliarity: -12,  // Long pauses = knowledge gaps
        conceptualClarity: -8,
    },
    errors: {
        conceptualClarity: -18,  // Errors = misunderstanding concepts
        domainFamiliarity: -5,
    },
    abandonment: {
        engagementQuality: -25,  // Abandonment attempts = poor fit
        decisionConfidence: -10,
    },
} as const;

/**
 * Thresholds for curriculum adjustment triggers
 */
const ADJUSTMENT_THRESHOLDS = {
    addFoundationalContent: 40,      // Below 40% decision confidence
    enhancedExplanations: 50,        // Below 50% conceptual clarity
    slowPace: 45,                    // Below 45% info processing speed
    extraPractice: 55,               // Below 55% domain familiarity
} as const;

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Compute competence scores from friction signals
 *
 * Transforms behavioral signals into skill assessment dimensions.
 * All scores start at 100 (maximum competence) and are reduced
 * based on friction signal intensity.
 */
export function computeCompetenceFromFriction(
    signals: FrictionSignals
): FrictionDerivedCompetence {
    // Start with maximum competence
    const competence: FrictionDerivedCompetence = {
        decisionConfidence: 100,
        domainFamiliarity: 100,
        informationProcessingSpeed: 100,
        conceptualClarity: 100,
        engagementQuality: 100,
    };

    // Apply back navigation impact
    if (signals.backNavigationCount > 0) {
        const impact = Math.min(signals.backNavigationCount * 10, 50);
        competence.decisionConfidence += (COMPETENCE_WEIGHTS.backNavigation.decisionConfidence * signals.backNavigationCount) / 3;
        competence.domainFamiliarity += (COMPETENCE_WEIGHTS.backNavigation.domainFamiliarity * signals.backNavigationCount) / 3;
    }

    // Apply rapid clicks impact
    if (signals.rapidClicks > 0) {
        competence.informationProcessingSpeed += (COMPETENCE_WEIGHTS.rapidClicks.informationProcessingSpeed * signals.rapidClicks) / 2;
        competence.engagementQuality += (COMPETENCE_WEIGHTS.rapidClicks.engagementQuality * signals.rapidClicks) / 2;
    }

    // Apply inactivity impact
    if (signals.inactivityPeriods > 0) {
        competence.domainFamiliarity += (COMPETENCE_WEIGHTS.inactivity.domainFamiliarity * signals.inactivityPeriods) / 2;
        competence.conceptualClarity += (COMPETENCE_WEIGHTS.inactivity.conceptualClarity * signals.inactivityPeriods) / 2;
    }

    // Apply error impact
    if (signals.errorCount > 0) {
        competence.conceptualClarity += (COMPETENCE_WEIGHTS.errors.conceptualClarity * signals.errorCount) / 2;
        competence.domainFamiliarity += (COMPETENCE_WEIGHTS.errors.domainFamiliarity * signals.errorCount) / 2;
    }

    // Apply abandonment impact
    if (signals.abandonmentAttempts > 0) {
        competence.engagementQuality += COMPETENCE_WEIGHTS.abandonment.engagementQuality * signals.abandonmentAttempts;
        competence.decisionConfidence += COMPETENCE_WEIGHTS.abandonment.decisionConfidence * signals.abandonmentAttempts;
    }

    // Clamp all values between 0 and 100
    return {
        decisionConfidence: Math.max(0, Math.min(100, competence.decisionConfidence)),
        domainFamiliarity: Math.max(0, Math.min(100, competence.domainFamiliarity)),
        informationProcessingSpeed: Math.max(0, Math.min(100, competence.informationProcessingSpeed)),
        conceptualClarity: Math.max(0, Math.min(100, competence.conceptualClarity)),
        engagementQuality: Math.max(0, Math.min(100, competence.engagementQuality)),
    };
}

/**
 * Generate curriculum adjustment recommendations based on competence scores
 */
export function computeCurriculumAdjustment(
    competence: FrictionDerivedCompetence,
    signals: FrictionSignals
): CurriculumAdjustment {
    const reinforcementTopics: string[] = [];

    // Determine foundational content need
    const addFoundationalContent = competence.decisionConfidence < ADJUSTMENT_THRESHOLDS.addFoundationalContent;
    if (addFoundationalContent) {
        reinforcementTopics.push("Goal Setting Fundamentals");
        reinforcementTopics.push("Career Path Decision Framework");
    }

    // Determine explanation enhancement need
    const enhancedExplanations = competence.conceptualClarity < ADJUSTMENT_THRESHOLDS.enhancedExplanations;
    if (enhancedExplanations) {
        reinforcementTopics.push("Technical Concept Overviews");
    }

    // Calculate pace modifier based on info processing speed
    let paceModifier = 1.0;
    if (competence.informationProcessingSpeed < ADJUSTMENT_THRESHOLDS.slowPace) {
        paceModifier = 0.7;  // Slower pace
    } else if (competence.informationProcessingSpeed > 80) {
        paceModifier = 1.2;  // Faster pace for confident users
    }

    // Calculate extra practice modules
    const extraPracticeModules = competence.domainFamiliarity < ADJUSTMENT_THRESHOLDS.extraPractice
        ? Math.ceil((ADJUSTMENT_THRESHOLDS.extraPractice - competence.domainFamiliarity) / 15)
        : 0;

    // Determine content density
    let contentDensity: "sparse" | "normal" | "dense" = "normal";
    if (competence.informationProcessingSpeed < 40) {
        contentDensity = "sparse";
        reinforcementTopics.push("Guided Practice Exercises");
    } else if (competence.informationProcessingSpeed > 75 && competence.domainFamiliarity > 70) {
        contentDensity = "dense";
    }

    // Calculate assessment confidence based on signal volume
    const totalSignals =
        signals.backNavigationCount +
        signals.rapidClicks +
        signals.inactivityPeriods +
        signals.errorCount +
        signals.abandonmentAttempts;

    // More signals = more confident assessment (up to a point)
    const assessmentConfidence = Math.min(100, 30 + totalSignals * 10);

    return {
        addFoundationalContent,
        paceModifier,
        extraPracticeModules,
        enhancedExplanations,
        contentDensity,
        reinforcementTopics,
        assessmentConfidence,
    };
}

/**
 * Create a friction session record for pattern analysis
 */
export function createFrictionSession(
    signals: FrictionSignals,
    stepCompletions: number = 0,
    modeChanges: number = 0
): FrictionSession {
    return {
        sessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        startTime: Date.now(),
        signals: { ...signals },
        competence: computeCompetenceFromFriction(signals),
        stepCompletions,
        modeChanges,
    };
}

/**
 * Aggregate multiple sessions into a pattern profile
 * This enables "first users create patterns for others" vision
 */
export function aggregateFrictionSessions(
    profileId: string,
    sessions: FrictionSession[]
): FrictionPatternProfile {
    if (sessions.length === 0) {
        return {
            profileId,
            sessions: [],
            averageCompetence: {
                decisionConfidence: 100,
                domainFamiliarity: 100,
                informationProcessingSpeed: 100,
                conceptualClarity: 100,
                engagementQuality: 100,
            },
            suggestedStartingMode: "wizard",
            suggestedCurriculumAdjustment: {
                addFoundationalContent: false,
                paceModifier: 1.0,
                extraPracticeModules: 0,
                enhancedExplanations: false,
                contentDensity: "normal",
                reinforcementTopics: [],
                assessmentConfidence: 0,
            },
        };
    }

    // Average competence across sessions
    const averageCompetence: FrictionDerivedCompetence = {
        decisionConfidence: 0,
        domainFamiliarity: 0,
        informationProcessingSpeed: 0,
        conceptualClarity: 0,
        engagementQuality: 0,
    };

    for (const session of sessions) {
        averageCompetence.decisionConfidence += session.competence.decisionConfidence;
        averageCompetence.domainFamiliarity += session.competence.domainFamiliarity;
        averageCompetence.informationProcessingSpeed += session.competence.informationProcessingSpeed;
        averageCompetence.conceptualClarity += session.competence.conceptualClarity;
        averageCompetence.engagementQuality += session.competence.engagementQuality;
    }

    const count = sessions.length;
    averageCompetence.decisionConfidence /= count;
    averageCompetence.domainFamiliarity /= count;
    averageCompetence.informationProcessingSpeed /= count;
    averageCompetence.conceptualClarity /= count;
    averageCompetence.engagementQuality /= count;

    // Determine suggested starting mode based on average competence
    let suggestedStartingMode: "wizard" | "live-form" | "ai-chat" = "wizard";
    const overallCompetence = (
        averageCompetence.decisionConfidence +
        averageCompetence.domainFamiliarity +
        averageCompetence.informationProcessingSpeed +
        averageCompetence.conceptualClarity +
        averageCompetence.engagementQuality
    ) / 5;

    if (overallCompetence < 50) {
        suggestedStartingMode = "ai-chat";  // Need guidance
    } else if (overallCompetence > 75) {
        suggestedStartingMode = "live-form";  // Can handle complexity
    }

    // Aggregate signals for curriculum adjustment
    const aggregatedSignals: FrictionSignals = {
        backNavigationCount: Math.round(sessions.reduce((sum, s) => sum + s.signals.backNavigationCount, 0) / count),
        rapidClicks: Math.round(sessions.reduce((sum, s) => sum + s.signals.rapidClicks, 0) / count),
        inactivityPeriods: Math.round(sessions.reduce((sum, s) => sum + s.signals.inactivityPeriods, 0) / count),
        errorCount: Math.round(sessions.reduce((sum, s) => sum + s.signals.errorCount, 0) / count),
        abandonmentAttempts: Math.round(sessions.reduce((sum, s) => sum + s.signals.abandonmentAttempts, 0) / count),
        timeOnCurrentStep: Math.round(sessions.reduce((sum, s) => sum + s.signals.timeOnCurrentStep, 0) / count),
    };

    return {
        profileId,
        sessions,
        averageCompetence,
        suggestedStartingMode,
        suggestedCurriculumAdjustment: computeCurriculumAdjustment(averageCompetence, aggregatedSignals),
    };
}

/**
 * Identify specific focus area struggles from friction context
 *
 * This maps friction signals to the step where they occurred,
 * enabling targeted curriculum adjustments.
 */
export interface FrictionContext {
    step: string;
    signals: FrictionSignals;
    timestamp: number;
}

export function identifyStruggleAreas(
    frictionContexts: FrictionContext[]
): Map<string, CurriculumAdjustment> {
    const struggleMap = new Map<string, CurriculumAdjustment>();

    for (const context of frictionContexts) {
        const competence = computeCompetenceFromFriction(context.signals);
        const adjustment = computeCurriculumAdjustment(competence, context.signals);

        // Only record if there's meaningful struggle
        if (adjustment.assessmentConfidence >= 30) {
            struggleMap.set(context.step, adjustment);
        }
    }

    return struggleMap;
}

/**
 * Map goal path steps to content topics for reinforcement
 */
export const STEP_TO_TOPIC_MAP: Record<string, string[]> = {
    "goal-selection": [
        "Career Path Exploration",
        "Goal Setting Framework",
        "Industry Overview",
    ],
    "time-commitment": [
        "Learning Time Management",
        "Realistic Scheduling",
        "Work-Life-Learning Balance",
    ],
    "focus-areas": [
        "Technology Stack Overview",
        "Skill Dependencies",
        "Learning Path Prerequisites",
    ],
    "preferences": [
        "Learning Style Assessment",
        "Study Methods Comparison",
        "Personal Learning Optimization",
    ],
    "skills-assessment": [
        "Skill Self-Assessment Guide",
        "Competency Mapping",
        "Gap Analysis Framework",
    ],
};

/**
 * Get reinforcement content recommendations for a specific step
 */
export function getStepReinforcementTopics(
    step: string,
    adjustment: CurriculumAdjustment
): string[] {
    const baseTopics = STEP_TO_TOPIC_MAP[step] ?? [];
    const reinforcementTopics = [...adjustment.reinforcementTopics];

    // Add step-specific topics if user struggled with that step
    if (adjustment.addFoundationalContent) {
        reinforcementTopics.push(...baseTopics);
    }

    // Deduplicate using Array.from for broader compatibility
    return Array.from(new Set(reinforcementTopics));
}
