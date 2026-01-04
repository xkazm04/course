/**
 * Path Effectiveness Scoring
 *
 * Combines multiple path metrics into a single actionable score
 * that answers "will this path get me hired?"
 */

import type {
    PredictiveLearningPath,
    ConfidenceLevel,
    DemandTrend,
} from "@/app/features/goal-path/lib/predictiveTypes";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Individual factor contribution to the effectiveness score
 */
export interface EffectivenessFactor {
    /** Factor name */
    name: string;
    /** Short description */
    description: string;
    /** Score contribution (0-100) */
    score: number;
    /** Weight of this factor (0-1) */
    weight: number;
    /** Weighted contribution to final score */
    contribution: number;
    /** Indicator status */
    status: "positive" | "neutral" | "negative";
    /** Detailed reasoning */
    details: string;
}

/**
 * Complete effectiveness assessment
 */
export interface PathEffectivenessScore {
    /** Overall score (0-100) */
    overallScore: number;
    /** Score tier for display */
    tier: "excellent" | "good" | "fair" | "poor";
    /** One-line summary */
    summary: string;
    /** Individual factor breakdowns */
    factors: EffectivenessFactor[];
    /** Actionable recommendation */
    recommendation: string;
    /** Key strengths of this path */
    strengths: string[];
    /** Areas of concern */
    concerns: string[];
}

// ============================================================================
// SCORING CONSTANTS
// ============================================================================

const CONFIDENCE_SCORES: Record<ConfidenceLevel, number> = {
    very_high: 100,
    high: 85,
    medium: 65,
    low: 40,
};

const DEMAND_SCORES: Record<DemandTrend, number> = {
    emerging: 95,
    rising: 90,
    stable: 70,
    saturating: 40,
    declining: 25,
};

const RISK_SCORES: Record<"low" | "moderate" | "high", number> = {
    low: 100,
    moderate: 60,
    high: 25,
};

const TIMING_SCORES: Record<"start_now" | "accelerate" | "wait" | "pivot", number> = {
    accelerate: 100,
    start_now: 90,
    wait: 50,
    pivot: 30,
};

// Factor weights (must sum to 1.0)
const FACTOR_WEIGHTS = {
    marketDemand: 0.30,      // Skill demand trends
    confidenceScore: 0.20,   // AI confidence in path
    timeEfficiency: 0.15,    // Hours vs outcome
    riskProfile: 0.20,       // Overall risk assessment
    marketTiming: 0.15,      // When to start
};

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Calculate market demand score from module skill demands
 */
function calculateMarketDemandScore(path: PredictiveLearningPath): EffectivenessFactor {
    const demandCounts: Record<DemandTrend, number> = {
        emerging: 0,
        rising: 0,
        stable: 0,
        saturating: 0,
        declining: 0,
    };

    for (const pathModule of path.modules) {
        if (pathModule.skillDemand in demandCounts) {
            demandCounts[pathModule.skillDemand]++;
        }
    }

    // Weighted average based on module demands
    let totalScore = 0;
    const totalModules = path.modules.length;

    for (const [trend, count] of Object.entries(demandCounts)) {
        totalScore += DEMAND_SCORES[trend as DemandTrend] * count;
    }

    const avgScore = totalModules > 0 ? totalScore / totalModules : 50;
    const contribution = avgScore * FACTOR_WEIGHTS.marketDemand;

    // Determine status
    const risingOrEmerging = demandCounts.rising + demandCounts.emerging;
    const decliningOrSaturating = demandCounts.declining + demandCounts.saturating;

    let status: "positive" | "neutral" | "negative";
    let details: string;

    if (risingOrEmerging > decliningOrSaturating * 2) {
        status = "positive";
        details = `${risingOrEmerging} of ${totalModules} modules cover rising or emerging skills`;
    } else if (decliningOrSaturating > risingOrEmerging) {
        status = "negative";
        details = `${decliningOrSaturating} modules cover saturating or declining skills`;
    } else {
        status = "neutral";
        details = `Skills have mixed demand patterns across ${totalModules} modules`;
    }

    return {
        name: "Market Demand",
        description: "Skills employers are actively hiring for",
        score: Math.round(avgScore),
        weight: FACTOR_WEIGHTS.marketDemand,
        contribution: Math.round(contribution),
        status,
        details,
    };
}

/**
 * Calculate confidence score from path confidence level
 */
function calculateConfidenceScore(path: PredictiveLearningPath): EffectivenessFactor {
    const score = CONFIDENCE_SCORES[path.confidence] || 50;
    const contribution = score * FACTOR_WEIGHTS.confidenceScore;

    const statusMap: Record<ConfidenceLevel, "positive" | "neutral" | "negative"> = {
        very_high: "positive",
        high: "positive",
        medium: "neutral",
        low: "negative",
    };

    const detailsMap: Record<ConfidenceLevel, string> = {
        very_high: "Path aligns extremely well with your goals and market trends",
        high: "Strong alignment between your profile and this learning path",
        medium: "Reasonable fit based on available data",
        low: "Limited data to validate path effectiveness",
    };

    return {
        name: "Path Confidence",
        description: "AI's confidence this path leads to your goal",
        score,
        weight: FACTOR_WEIGHTS.confidenceScore,
        contribution: Math.round(contribution),
        status: statusMap[path.confidence] || "neutral",
        details: detailsMap[path.confidence] || "Path confidence assessment unavailable",
    };
}

/**
 * Calculate time efficiency score
 */
function calculateTimeEfficiencyScore(path: PredictiveLearningPath): EffectivenessFactor {
    const totalHours = path.modules.reduce((sum, m) => sum + m.estimatedHours, 0);
    const weeks = path.estimatedWeeks;

    // Efficiency heuristics:
    // - Ideal: 60-150 hours for entry-level, 150-300 for career change
    // - Weeks should be reasonable (8-24 weeks is optimal)

    let score: number;
    let status: "positive" | "neutral" | "negative";
    let details: string;

    if (totalHours >= 40 && totalHours <= 200 && weeks <= 20) {
        score = 90;
        status = "positive";
        details = `${totalHours} hours over ${weeks} weeks is an efficient timeline`;
    } else if (totalHours <= 40) {
        score = 60;
        status = "neutral";
        details = `${totalHours} hours may not provide sufficient depth`;
    } else if (totalHours > 300 || weeks > 30) {
        score = 50;
        status = "negative";
        details = `${totalHours} hours over ${weeks} weeks is a significant commitment`;
    } else {
        score = 75;
        status = "neutral";
        details = `${totalHours} hours over ${weeks} weeks is a moderate investment`;
    }

    return {
        name: "Time Efficiency",
        description: "Balance of learning depth vs time investment",
        score,
        weight: FACTOR_WEIGHTS.timeEfficiency,
        contribution: Math.round(score * FACTOR_WEIGHTS.timeEfficiency),
        status,
        details,
    };
}

/**
 * Calculate risk profile score
 */
function calculateRiskScore(path: PredictiveLearningPath): EffectivenessFactor {
    const risk = path.riskAssessment;

    // Combine risk factors
    const overallScore = RISK_SCORES[risk.overallRisk];
    const techScore = RISK_SCORES[risk.techObsolescenceRisk];
    const marketScore = RISK_SCORES[risk.marketSaturationRisk];
    const autoScore = RISK_SCORES[risk.automationRisk];

    // Weighted average (overall risk is most important)
    const score = Math.round(
        overallScore * 0.4 +
        techScore * 0.2 +
        marketScore * 0.2 +
        autoScore * 0.2
    );

    const contribution = score * FACTOR_WEIGHTS.riskProfile;

    // Determine status based on overall risk
    const statusMap: Record<"low" | "moderate" | "high", "positive" | "neutral" | "negative"> = {
        low: "positive",
        moderate: "neutral",
        high: "negative",
    };

    // Build details string
    const highRisks: string[] = [];
    if (risk.techObsolescenceRisk === "high") highRisks.push("tech obsolescence");
    if (risk.marketSaturationRisk === "high") highRisks.push("market saturation");
    if (risk.automationRisk === "high") highRisks.push("automation");

    let details: string;
    if (highRisks.length === 0) {
        details = risk.overallRisk === "low"
            ? "Low risk across all factors - skills are future-proof"
            : `Moderate overall risk with ${risk.mitigationStrategies.length} mitigation strategies`;
    } else {
        details = `Watch for ${highRisks.join(", ")} risks`;
    }

    return {
        name: "Risk Profile",
        description: "Long-term viability of these skills",
        score,
        weight: FACTOR_WEIGHTS.riskProfile,
        contribution: Math.round(contribution),
        status: statusMap[risk.overallRisk],
        details,
    };
}

/**
 * Calculate market timing score
 */
function calculateMarketTimingScore(path: PredictiveLearningPath): EffectivenessFactor {
    const timing = path.marketTiming;
    const score = TIMING_SCORES[timing.recommendation] || 50;
    const contribution = score * FACTOR_WEIGHTS.marketTiming;

    const statusMap: Record<string, "positive" | "neutral" | "negative"> = {
        accelerate: "positive",
        start_now: "positive",
        wait: "neutral",
        pivot: "negative",
    };

    const summaryMap: Record<string, string> = {
        accelerate: "Market conditions favor fast learners right now",
        start_now: "Good time to start - market is favorable",
        wait: "Consider waiting for better market conditions",
        pivot: "Market suggests reconsidering this path",
    };

    return {
        name: "Market Timing",
        description: "Current market conditions for these skills",
        score,
        weight: FACTOR_WEIGHTS.marketTiming,
        contribution: Math.round(contribution),
        status: statusMap[timing.recommendation] || "neutral",
        details: summaryMap[timing.recommendation] || timing.reasoning,
    };
}

// ============================================================================
// MAIN SCORING FUNCTION
// ============================================================================

/**
 * Calculate the overall path effectiveness score
 */
export function calculatePathEffectiveness(
    path: PredictiveLearningPath
): PathEffectivenessScore {
    // Calculate all factors
    const factors: EffectivenessFactor[] = [
        calculateMarketDemandScore(path),
        calculateConfidenceScore(path),
        calculateTimeEfficiencyScore(path),
        calculateRiskScore(path),
        calculateMarketTimingScore(path),
    ];

    // Calculate overall score
    const overallScore = Math.round(
        factors.reduce((sum, f) => sum + f.contribution, 0)
    );

    // Determine tier
    let tier: "excellent" | "good" | "fair" | "poor";
    if (overallScore >= 80) tier = "excellent";
    else if (overallScore >= 65) tier = "good";
    else if (overallScore >= 45) tier = "fair";
    else tier = "poor";

    // Extract strengths and concerns
    const strengths = factors
        .filter(f => f.status === "positive")
        .map(f => f.details);

    const concerns = factors
        .filter(f => f.status === "negative")
        .map(f => f.details);

    // Generate summary and recommendation
    let summary: string;
    let recommendation: string;

    switch (tier) {
        case "excellent":
            summary = "Highly effective path with strong market alignment";
            recommendation = "This path is well-suited for your career goals. Consider starting soon.";
            break;
        case "good":
            summary = "Solid path with good career prospects";
            recommendation = "A strong choice. Focus on the high-demand modules first.";
            break;
        case "fair":
            summary = "Moderate path effectiveness - some trade-offs";
            recommendation = "Consider the risks and timing. You may want to explore alternatives.";
            break;
        case "poor":
            summary = "Path may not align well with current market";
            recommendation = "Review the concerns carefully. Consider alternative paths or timing.";
            break;
    }

    return {
        overallScore,
        tier,
        summary,
        factors,
        recommendation,
        strengths,
        concerns,
    };
}

/**
 * Get tier color for styling
 */
export function getTierColor(tier: PathEffectivenessScore["tier"]): string {
    switch (tier) {
        case "excellent":
            return "emerald";
        case "good":
            return "blue";
        case "fair":
            return "amber";
        case "poor":
            return "red";
    }
}

/**
 * Get tier label for display
 */
export function getTierLabel(tier: PathEffectivenessScore["tier"]): string {
    switch (tier) {
        case "excellent":
            return "Excellent";
        case "good":
            return "Good";
        case "fair":
            return "Fair";
        case "poor":
            return "Needs Review";
    }
}
