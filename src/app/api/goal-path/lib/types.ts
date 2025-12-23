/**
 * Goal Path API Types
 *
 * Request and response types for the Goal Path generation API endpoints.
 * These types support all four variants:
 * - Live Form: Single comprehensive path generation
 * - AI Chat: Multi-turn conversation management
 * - Enhanced/Wizard: Full plan with modules/milestones
 * - Career Oracle: Predictions + path + job matching
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

/**
 * Focus area for learning
 */
export type FocusArea =
    | "frontend"
    | "backend"
    | "devops"
    | "data"
    | "security"
    | "mobile";

/**
 * Learning style preference
 */
export type LearningStyle = "video" | "text" | "project" | "interactive";

/**
 * Skill difficulty level
 */
export type DifficultyLevel = "beginner" | "intermediate" | "advanced" | "expert";

/**
 * Industry sector for career targeting
 */
export type IndustrySector =
    | "tech_startups"
    | "enterprise"
    | "fintech"
    | "healthcare"
    | "ecommerce"
    | "gaming"
    | "ai_ml"
    | "cybersecurity"
    | "cloud_infrastructure"
    | "web3_blockchain";

// ============================================================================
// LIVE FORM VARIANT TYPES
// ============================================================================

/**
 * Request for Live Form path generation
 */
export interface LiveFormRequest {
    /** User's career goal */
    goal: string;
    /** Hours per week available for learning */
    timeCommitment: number;
    /** Target deadline in months */
    deadline: number;
    /** Selected focus areas */
    focus: FocusArea[];
    /** Optional learning style preference */
    learningStyle?: LearningStyle;
}

/**
 * Module in a generated learning path
 */
export interface PathModule {
    /** Module title */
    title: string;
    /** Module description */
    description: string;
    /** Topics covered */
    topics: string[];
    /** Estimated hours to complete */
    estimatedHours: number;
    /** Module order */
    sequence: number;
    /** Skills gained */
    skills: string[];
    /** Recommended resources */
    resources: {
        type: "article" | "video" | "practice" | "course";
        title: string;
        url?: string;
    }[];
}

/**
 * Response for Live Form path generation
 */
export interface LiveFormResponse {
    /** Generated path ID */
    pathId: string;
    /** Goal summary */
    goal: string;
    /** Total estimated hours */
    totalHours: number;
    /** Estimated weeks to complete */
    estimatedWeeks: number;
    /** Total modules */
    moduleCount: number;
    /** Total topics */
    topicCount: number;
    /** Learning modules in sequence */
    modules: PathModule[];
    /** Hours breakdown per focus area */
    hoursPerFocusArea: Record<FocusArea, number>;
    /** Whether the path leads to job readiness */
    isJobReady: boolean;
    /** Expected skill level after completion */
    skillLevel: DifficultyLevel;
    /** Personalized recommendations */
    recommendations: string[];
}

// ============================================================================
// AI CHAT VARIANT TYPES
// ============================================================================

/**
 * Message role in chat conversation
 */
export type MessageRole = "user" | "assistant" | "system";

/**
 * Chat message
 */
export interface ChatMessage {
    /** Message role */
    role: MessageRole;
    /** Message content */
    content: string;
    /** Timestamp */
    timestamp?: string;
}

/**
 * Conversation stage for tracking progress
 */
export type ConversationStage =
    | "greeting"
    | "goal_collection"
    | "time_collection"
    | "skill_level_collection"
    | "deadline_collection"
    | "generating"
    | "presenting_path"
    | "refinement";

/**
 * Collected user data from conversation
 */
export interface CollectedUserData {
    goal?: string;
    timeCommitment?: number;
    skillLevel?: string;
    deadline?: number;
    focus?: FocusArea[];
    preferences?: string[];
}

/**
 * Request for AI Chat continuation
 */
export interface ChatRequest {
    /** Conversation history */
    messages: ChatMessage[];
    /** Current conversation stage */
    stage: ConversationStage;
    /** Data collected so far */
    collectedData: CollectedUserData;
    /** Session ID for tracking */
    sessionId?: string;
}

/**
 * Response for AI Chat
 */
export interface ChatResponse {
    /** Assistant's response message */
    message: string;
    /** Quick reply options (if applicable) */
    options?: string[];
    /** Updated conversation stage */
    stage: ConversationStage;
    /** Updated collected data */
    collectedData: CollectedUserData;
    /** Generated path (when stage is presenting_path) */
    generatedPath?: LiveFormResponse;
    /** Whether conversation is complete */
    isComplete: boolean;
}

// ============================================================================
// ENHANCED/WIZARD VARIANT TYPES
// ============================================================================

/**
 * Milestone in learning path
 */
export interface Milestone {
    /** Milestone ID */
    id: string;
    /** Milestone title */
    title: string;
    /** Target week number */
    targetWeek: number;
    /** Skills acquired at this point */
    skillsAcquired: string[];
    /** Job match increase percentage */
    jobMatchIncrease: number;
    /** Deliverable or output */
    deliverable?: string;
}

/**
 * Request for Enhanced path generation
 */
export interface EnhancedRequest {
    /** User's career goal */
    goal: string;
    /** Learning style preference */
    learningStyle: LearningStyle;
    /** Hours per week available */
    timeCommitment: number;
    /** Target deadline in months */
    deadline?: number;
    /** Current skill level */
    currentLevel?: DifficultyLevel;
    /** Specific topics of interest */
    interests?: string[];
}

/**
 * Response for Enhanced path generation
 */
export interface EnhancedResponse {
    /** Path ID */
    pathId: string;
    /** Goal summary */
    goal: string;
    /** Learning modules */
    modules: PathModule[];
    /** Key milestones */
    milestones: Milestone[];
    /** Total estimated weeks */
    estimatedWeeks: number;
    /** Total lessons */
    lessonCount: number;
    /** Projects to build */
    projectCount: number;
    /** Skill progression breakdown */
    skillProgression: {
        week: number;
        skills: string[];
        level: DifficultyLevel;
    }[];
    /** Personalized tips */
    tips: string[];
    /** Success probability (0-100) */
    successProbability: number;
}

// ============================================================================
// CAREER ORACLE VARIANT TYPES
// ============================================================================

/**
 * User skill with proficiency
 */
export interface UserSkill {
    /** Skill name */
    name: string;
    /** Proficiency level (1-5) */
    proficiency: 1 | 2 | 3 | 4 | 5;
    /** Years of experience */
    yearsOfExperience?: number;
}

/**
 * Risk tolerance level
 */
export type RiskTolerance = "conservative" | "moderate" | "aggressive";

/**
 * Remote work preference
 */
export type RemotePreference = "no" | "hybrid" | "full" | "any";

/**
 * Prediction time horizon
 */
export type PredictionHorizon = "3m" | "6m" | "12m" | "24m";

/**
 * Demand trend for skills
 */
export type DemandTrend = "rising" | "stable" | "declining" | "emerging" | "saturating";

/**
 * Confidence level for predictions
 */
export type ConfidenceLevel = "low" | "medium" | "high" | "very_high";

/**
 * Request for Career Oracle predictions
 */
export interface OracleRequest {
    /** Action to perform */
    action: "predictions" | "path" | "jobs";
    /** User's current skills */
    currentSkills: UserSkill[];
    /** Target career role */
    targetRole: string;
    /** Target industry sector */
    targetSector?: IndustrySector;
    /** Weekly hours available */
    weeklyHours: number;
    /** Learning style preference */
    learningStyle: LearningStyle;
    /** Risk tolerance */
    riskTolerance: RiskTolerance;
    /** Remote work preference */
    remotePreference: RemotePreference;
    /** Prediction horizon */
    horizon?: PredictionHorizon;
    /** Target salary (optional) */
    targetSalary?: number;
    /** Location for job matching */
    location?: string;
}

/**
 * Skill demand prediction
 */
export interface SkillDemandPrediction {
    /** Skill name */
    skillName: string;
    /** Current demand index (0-100) */
    currentDemand: number;
    /** Predicted demand at horizon (0-100) */
    predictedDemand: number;
    /** Trend direction */
    trend: DemandTrend;
    /** Percentage change */
    changePercent: number;
    /** Confidence level */
    confidence: ConfidenceLevel;
    /** Market saturation (0-100) */
    saturationLevel: number;
    /** Recommended learning urgency */
    urgency: "low" | "moderate" | "high" | "critical";
    /** Reasoning */
    reasoning: string;
}

/**
 * Industry trend data
 */
export interface IndustryTrend {
    /** Sector */
    sector: IndustrySector;
    /** Display name */
    name: string;
    /** Annual growth rate */
    growthRate: number;
    /** Top skills in demand */
    topSkills: string[];
    /** Job growth trend */
    jobGrowth: DemandTrend;
    /** Remote availability (0-100) */
    remoteAvailability: number;
    /** Entry barrier */
    entryBarrier: "low" | "medium" | "high";
}

/**
 * Job opportunity match
 */
export interface JobMatch {
    /** Job ID */
    id: string;
    /** Company name */
    company: string;
    /** Job title */
    title: string;
    /** Match score (0-100) */
    matchScore: number;
    /** Skills user is missing */
    skillGaps: string[];
    /** Estimated weeks to qualify */
    estimatedTimeToQualify: number;
    /** Salary range */
    salaryRange?: {
        min: number;
        max: number;
        currency: string;
    };
    /** Remote work option */
    remote: "no" | "hybrid" | "full";
    /** Location */
    location?: string;
}

/**
 * Market timing advice
 */
export interface MarketTimingAdvice {
    /** Overall recommendation */
    recommendation: "start_now" | "wait" | "accelerate" | "pivot";
    /** Detailed reasoning */
    reasoning: string;
    /** Key factors influencing recommendation */
    keyFactors: string[];
    /** Warning signs to watch */
    warningSignals: string[];
    /** Opportunity signals */
    opportunitySignals: string[];
}

/**
 * Path risk assessment
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

/**
 * Response for Career Oracle
 */
export interface OracleResponse {
    /** Action performed */
    action: "predictions" | "path" | "jobs";

    /** Skill demand predictions (for action=predictions) */
    skillDemand?: SkillDemandPrediction[];
    /** Industry trends (for action=predictions) */
    industryTrends?: IndustryTrend[];
    /** Recommended skills to learn */
    recommendedSkills?: string[];

    /** Generated learning path (for action=path) */
    learningPath?: {
        id: string;
        targetRole: string;
        estimatedWeeks: number;
        modules: PathModule[];
        milestones: Milestone[];
        confidence: ConfidenceLevel;
    };
    /** Market timing advice (for action=path) */
    marketTiming?: MarketTimingAdvice;
    /** Risk assessment (for action=path) */
    riskAssessment?: PathRiskAssessment;
    /** Alternative paths (for action=path) */
    alternativePaths?: {
        name: string;
        description: string;
        differentiator: string;
        riskComparison: "lower" | "similar" | "higher";
        timeComparison: "faster" | "similar" | "slower";
    }[];

    /** Matching jobs (for action=jobs) */
    matchingJobs?: JobMatch[];
    /** Top skill gaps */
    topSkillGaps?: string[];
    /** Job market summary */
    jobMarketSummary?: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * API error response
 */
export interface APIError {
    /** Error code */
    code: string;
    /** Error message */
    message: string;
    /** Additional details */
    details?: Record<string, unknown>;
}

// ============================================================================
// TESTING TYPES
// ============================================================================

/**
 * Test persona for API testing
 */
export interface TestPersona {
    /** Persona ID */
    id: string;
    /** Persona name */
    name: string;
    /** Description */
    description: string;
    /** Persona parameters */
    params: LiveFormRequest | ChatRequest | EnhancedRequest | OracleRequest;
}

/**
 * Test configuration
 */
export interface TestConfiguration {
    /** Configuration ID */
    id: string;
    /** Configuration name */
    name: string;
    /** Variant being tested */
    variant: "live-form" | "ai-chat" | "enhanced" | "oracle";
    /** Test persona */
    persona: TestPersona;
    /** Expected outcomes (for validation) */
    expectedOutcomes?: {
        minModules?: number;
        maxWeeks?: number;
        requiredSkills?: string[];
    };
}

/**
 * Test result
 */
export interface TestResult {
    /** Configuration ID */
    configId: string;
    /** Whether test passed */
    success: boolean;
    /** Response time in ms */
    duration: number;
    /** Token usage */
    tokenUsage: {
        input: number;
        output: number;
        total: number;
    };
    /** Response data */
    response?: LiveFormResponse | ChatResponse | EnhancedResponse | OracleResponse;
    /** Error if failed */
    error?: APIError;
    /** Validation results */
    validation?: {
        passed: boolean;
        failures: string[];
    };
    /** Timestamp */
    timestamp: string;
}
