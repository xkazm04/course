/**
 * Predictive Intelligence Types for AI Career Oracle
 *
 * This module defines the type system for the predictive career intelligence feature.
 * It includes skill demand forecasting, market trends, job market integration, and
 * dynamic learning path recommendations.
 *
 * Note: UserSkillProfile in this module is a specialized subset of the unified
 * LearnerProfile type from @/app/shared/lib/learnerProfile. For new code,
 * prefer using LearnerProfile directly and use the conversion utilities provided.
 */

import type {
    LearnerProfile,
    LearnerSkill,
    LearningStyle as UnifiedLearningStyle,
    RiskTolerance,
    RemotePreference,
    IndustrySector,
} from "@/app/shared/lib/learnerProfile";

// Re-export IndustrySector for backward compatibility
export type { IndustrySector } from "@/app/shared/lib/learnerProfile";

// ============================================================================
// SKILL DEMAND PREDICTION TYPES
// ============================================================================

/**
 * Demand trend direction for skills
 */
export type DemandTrend = "rising" | "stable" | "declining" | "emerging" | "saturating";

/**
 * Time horizons for predictions
 */
export type PredictionHorizon = "3m" | "6m" | "12m" | "24m";

/**
 * Confidence level for predictions
 */
export type ConfidenceLevel = "low" | "medium" | "high" | "very_high";

/**
 * Skill demand prediction data
 */
export interface SkillDemandPrediction {
    /** Skill identifier */
    skillId: string;
    /** Human-readable skill name */
    skillName: string;
    /** Current demand index (0-100) */
    currentDemand: number;
    /** Predicted demand at horizon (0-100) */
    predictedDemand: number;
    /** Trend direction */
    trend: DemandTrend;
    /** Percentage change from current */
    changePercent: number;
    /** Confidence in the prediction */
    confidence: ConfidenceLevel;
    /** Prediction time horizon */
    horizon: PredictionHorizon;
    /** Market saturation level (0-100, higher = more competition) */
    saturationLevel: number;
    /** Optimal learning window - when to start learning */
    optimalLearningWindow: LearningWindow;
    /** Related skills that complement this skill */
    complementarySkills: string[];
    /** Industries driving demand */
    drivingIndustries: string[];
}

/**
 * Learning window recommendation
 */
export interface LearningWindow {
    /** Recommended start date */
    recommendedStart: string; // ISO date string
    /** Window ends (after this, market may be saturated) */
    windowCloses: string; // ISO date string
    /** Urgency level */
    urgency: "low" | "moderate" | "high" | "critical";
    /** Reasoning for the window */
    reasoning: string;
}

// ============================================================================
// MARKET TRENDS TYPES
// ============================================================================

// Note: IndustrySector is now imported from @/app/shared/lib/learnerProfile
// and re-exported at the top of this file for backward compatibility.

/**
 * Market trend data for an industry
 */
export interface IndustryTrend {
    /** Industry sector identifier */
    sector: IndustrySector;
    /** Display name */
    name: string;
    /** Growth rate percentage (annual) */
    growthRate: number;
    /** Top skills in demand for this sector */
    topSkills: string[];
    /** Average salary range */
    salaryRange: {
        min: number;
        max: number;
        median: number;
        currency: string;
    };
    /** Job opening growth trend */
    jobGrowth: DemandTrend;
    /** Remote work availability (0-100) */
    remoteAvailability: number;
    /** Entry barrier level */
    entryBarrier: "low" | "medium" | "high";
    /** Key companies hiring */
    topEmployers: string[];
}

/**
 * Emerging technology trend
 */
export interface EmergingTechTrend {
    /** Technology name */
    name: string;
    /** Brief description */
    description: string;
    /** Maturity stage */
    maturityStage: "experimental" | "early_adoption" | "growth" | "mainstream" | "declining";
    /** Expected time to mainstream adoption (months) */
    timeToMainstream: number;
    /** Required prerequisite skills */
    prerequisites: string[];
    /** Risk level of investing learning time */
    riskLevel: "low" | "medium" | "high";
    /** Potential impact on existing roles */
    disruptionPotential: "low" | "moderate" | "high" | "transformative";
}

// ============================================================================
// JOB MARKET INTEGRATION TYPES
// ============================================================================

/**
 * Job posting from market integration
 */
export interface PredictiveJobPosting {
    /** Unique identifier */
    id: string;
    /** Company name */
    company: string;
    /** Company size category */
    companySize: "startup" | "small" | "medium" | "large" | "enterprise";
    /** Job title */
    title: string;
    /** Seniority level */
    seniorityLevel: "entry" | "junior" | "mid" | "senior" | "lead" | "principal" | "executive";
    /** Location details */
    location: {
        city?: string;
        country: string;
        remote: "no" | "hybrid" | "full";
    };
    /** Salary information */
    salary: {
        min?: number;
        max?: number;
        currency: string;
        period: "hourly" | "monthly" | "yearly";
    };
    /** Required skills with proficiency levels */
    requiredSkills: SkillRequirement[];
    /** Nice-to-have skills */
    preferredSkills: string[];
    /** User's match score (0-100) */
    matchScore: number;
    /** Skills user is missing */
    skillGaps: string[];
    /** Time to become qualified (weeks) */
    estimatedTimeToQualify: number;
    /** Posted date */
    postedDate: string; // ISO date string
    /** Number of applicants (if available) */
    applicantCount?: number;
    /** Competition level */
    competitionLevel: "low" | "moderate" | "high" | "very_high";
}

/**
 * Skill requirement with proficiency level
 */
export interface SkillRequirement {
    /** Skill name */
    skill: string;
    /** Required proficiency (1-5) */
    proficiency: 1 | 2 | 3 | 4 | 5;
    /** Is this a must-have or nice-to-have */
    required: boolean;
    /** How common this requirement is across similar jobs (0-100) */
    marketPrevalence: number;
}

/**
 * Company hiring insights
 */
export interface CompanyInsight {
    /** Company name */
    name: string;
    /** Industry sector */
    industry: IndustrySector;
    /** Current open positions count */
    openPositions: number;
    /** Hiring trend */
    hiringTrend: DemandTrend;
    /** Most sought-after skills */
    soughtSkills: string[];
    /** Average time to hire (days) */
    avgTimeToHire: number;
    /** Interview process difficulty (1-5) */
    interviewDifficulty: 1 | 2 | 3 | 4 | 5;
    /** Glassdoor-style rating (1-5) */
    employeeRating?: number;
}

// ============================================================================
// PREDICTIVE PATH TYPES
// ============================================================================

/**
 * Predictive learning path generated by the oracle
 */
export interface PredictiveLearningPath {
    /** Path identifier */
    id: string;
    /** Target career goal */
    targetRole: string;
    /** Target industry sector */
    targetSector: IndustrySector;
    /** Overall path confidence */
    confidence: ConfidenceLevel;
    /** Estimated time to achieve goal (weeks) */
    estimatedWeeks: number;
    /** Learning modules in sequence */
    modules: PredictiveModule[];
    /** Key milestones */
    milestones: PathMilestone[];
    /** Market timing advice */
    marketTiming: MarketTimingAdvice;
    /** Alternative paths considered */
    alternativePaths: AlternativePath[];
    /** Job opportunities matching this path */
    matchingJobs: PredictiveJobPosting[];
    /** Risk assessment */
    riskAssessment: PathRiskAssessment;
}

/**
 * A module within a predictive learning path
 */
export interface PredictiveModule {
    /** Module identifier */
    id: string;
    /** Module title */
    title: string;
    /** Skills taught */
    skills: string[];
    /** Estimated hours to complete */
    estimatedHours: number;
    /** Module order in sequence */
    sequence: number;
    /** Why this module is recommended at this point */
    reasoning: string;
    /** Market demand for skills in this module */
    skillDemand: DemandTrend;
    /** Should be learned during this optimal window */
    optimalWindow?: LearningWindow;
    /** Prerequisites completed from earlier modules */
    prerequisites: string[];
}

/**
 * Milestone in the learning path
 */
export interface PathMilestone {
    /** Milestone identifier */
    id: string;
    /** Milestone title */
    title: string;
    /** Week number when this should be achieved */
    targetWeek: number;
    /** Skills acquired at this milestone */
    skillsAcquired: string[];
    /** Estimated job match increase */
    jobMatchIncrease: number;
    /** New job opportunities unlocked */
    jobsUnlocked: number;
    /** Salary increase potential */
    salaryIncreasePotential: number;
}

/**
 * Market timing advice for the learning path
 */
export interface MarketTimingAdvice {
    /** Overall recommendation */
    recommendation: "start_now" | "wait" | "accelerate" | "pivot";
    /** Detailed reasoning */
    reasoning: string;
    /** Key market factors */
    keyFactors: string[];
    /** Warning signs to watch */
    warningSignals: string[];
    /** Opportunity signals */
    opportunitySignals: string[];
    /** Next review date */
    nextReviewDate: string; // ISO date string
}

/**
 * Alternative path suggestion
 */
export interface AlternativePath {
    /** Path name */
    name: string;
    /** Brief description */
    description: string;
    /** How it differs from main path */
    differentiator: string;
    /** Risk comparison to main path */
    riskComparison: "lower" | "similar" | "higher";
    /** Time comparison to main path */
    timeComparison: "faster" | "similar" | "slower";
    /** Salary potential comparison */
    salaryComparison: "lower" | "similar" | "higher";
}

/**
 * Risk assessment for a learning path
 */
export interface PathRiskAssessment {
    /** Overall risk level */
    overallRisk: "low" | "moderate" | "high";
    /** Technology obsolescence risk */
    techObsolescenceRisk: "low" | "moderate" | "high";
    /** Market saturation risk */
    marketSaturationRisk: "low" | "moderate" | "high";
    /** AI automation risk */
    automationRisk: "low" | "moderate" | "high";
    /** Mitigation strategies */
    mitigationStrategies: string[];
    /** Hedge skills to learn */
    hedgeSkills: string[];
}

// ============================================================================
// USER PROFILE FOR PREDICTIONS
// ============================================================================

/**
 * User skill profile for generating predictions
 *
 * @deprecated Use LearnerProfile from @/app/shared/lib/learnerProfile instead.
 * This type is maintained for backward compatibility with Career Oracle components.
 *
 * Migration mapping:
 * - currentSkills -> LearnerProfile.currentSkills (same as LearnerSkill[])
 * - targetRole -> LearnerProfile.targetRole
 * - targetSector -> LearnerProfile.targetSector
 * - weeklyHours -> LearnerProfile.weeklyHours
 * - learningStyle -> LearnerProfile.learningStyle (uses UnifiedLearningStyle)
 * - riskTolerance -> LearnerProfile.riskTolerance
 * - location -> LearnerProfile.location
 * - remotePreference -> LearnerProfile.remotePreference
 * - targetSalary -> LearnerProfile.targetSalary
 */
export interface UserSkillProfile {
    /** Skills user already has */
    currentSkills: UserSkill[];
    /** Career goal */
    targetRole: string;
    /** Target industry */
    targetSector?: IndustrySector;
    /** Available hours per week for learning */
    weeklyHours: number;
    /** Preferred learning style */
    learningStyle: "video" | "text" | "project" | "interactive";
    /** Risk tolerance for career moves */
    riskTolerance: "conservative" | "moderate" | "aggressive";
    /** Location for job market */
    location?: string;
    /** Remote work preference */
    remotePreference: "no" | "hybrid" | "full" | "any";
    /** Target salary (optional) */
    targetSalary?: number;
    /** Focus areas for learning path (e.g., "frontend", "backend", "devops") */
    focusAreas?: string[];
}

/**
 * Estimated learning outcomes based on user profile
 */
export interface EstimatedOutcomes {
    /** Total hours needed to complete the path */
    totalHours: number;
    /** Number of modules in the path */
    moduleCount: number;
    /** Number of topics covered */
    topicCount: number;
    /** Whether user will be job-ready after completion */
    isJobReady: boolean;
    /** Expected skill level after completion */
    skillLevel: "Junior" | "Mid-Level" | "Senior" | "Lead";
    /** Expected salary range after completion */
    salaryRange?: { min: number; max: number };
    /** Time to job readiness in weeks */
    weeksToJobReady: number;
}

/**
 * User's existing skill
 *
 * @deprecated Use LearnerSkill from @/app/shared/lib/learnerProfile instead.
 * This type is identical to LearnerSkill and maintained for backward compatibility.
 */
export interface UserSkill {
    /** Skill name */
    name: string;
    /** Proficiency level (1-5) */
    proficiency: 1 | 2 | 3 | 4 | 5;
    /** Years of experience */
    yearsOfExperience: number;
    /** Last used (for relevance) */
    lastUsed?: string; // ISO date string
}

// ============================================================================
// PROFILE CONVERSION UTILITIES
// ============================================================================

/**
 * Convert a UserSkillProfile to LearnerProfile
 */
export function userSkillProfileToLearnerProfile(profile: Partial<UserSkillProfile>): Partial<LearnerProfile> {
    return {
        currentSkills: profile.currentSkills?.map(skill => ({
            name: skill.name,
            proficiency: skill.proficiency,
            yearsOfExperience: skill.yearsOfExperience,
            lastUsed: skill.lastUsed,
        })),
        targetRole: profile.targetRole,
        targetSector: profile.targetSector,
        weeklyHours: profile.weeklyHours,
        learningStyle: profile.learningStyle as UnifiedLearningStyle,
        riskTolerance: profile.riskTolerance as RiskTolerance,
        location: profile.location,
        remotePreference: profile.remotePreference as RemotePreference,
        targetSalary: profile.targetSalary,
    };
}

/**
 * Convert a LearnerProfile to UserSkillProfile
 */
export function learnerProfileToUserSkillProfile(profile: Partial<LearnerProfile>): Partial<UserSkillProfile> {
    const learningStyleMap: Record<UnifiedLearningStyle, "video" | "text" | "project" | "interactive"> = {
        "video": "video",
        "text": "text",
        "project": "project",
        "interactive": "interactive",
        "mixed": "interactive", // Default mixed to interactive
    };

    return {
        currentSkills: profile.currentSkills?.map(skill => ({
            name: skill.name,
            proficiency: skill.proficiency,
            yearsOfExperience: skill.yearsOfExperience ?? 1,
            lastUsed: skill.lastUsed,
        })),
        targetRole: profile.targetRole,
        targetSector: profile.targetSector,
        weeklyHours: profile.weeklyHours,
        learningStyle: profile.learningStyle ? learningStyleMap[profile.learningStyle] : "interactive",
        riskTolerance: profile.riskTolerance,
        location: profile.location,
        remotePreference: profile.remotePreference,
        targetSalary: profile.targetSalary,
    };
}

// ============================================================================
// ORACLE STATE TYPES
// ============================================================================

/**
 * State for the Career Oracle component
 */
export interface CareerOracleState {
    /** Current step in the oracle flow */
    step: OracleStep;
    /** User's profile being built */
    userProfile: Partial<UserSkillProfile>;
    /** Generated predictions */
    predictions: {
        skillDemand: SkillDemandPrediction[];
        industryTrends: IndustryTrend[];
        emergingTech: EmergingTechTrend[];
        matchingJobs: PredictiveJobPosting[];
        suggestedPath: PredictiveLearningPath | null;
    };
    /** Loading states */
    loading: {
        predictions: boolean;
        jobs: boolean;
        path: boolean;
    };
    /** Selected prediction horizon */
    horizon: PredictionHorizon;
    /** Filters applied to job search */
    jobFilters: JobSearchFilters;
}

/**
 * Steps in the oracle flow
 */
export type OracleStep =
    | "welcome"
    | "skills"
    | "goal"
    | "preferences"
    | "analyzing"
    | "insights"
    | "path"
    | "jobs";

/**
 * Filters for job search
 */
export interface JobSearchFilters {
    remote?: "no" | "hybrid" | "full" | "any";
    seniorityLevel?: string[];
    minSalary?: number;
    maxDistance?: number;
    companySize?: string[];
}
