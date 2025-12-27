// Competition Feature Types

// Skill Tiers
export type SkillTier = "bronze" | "silver" | "gold" | "platinum" | "diamond" | "master";

export type ChallengeDifficulty = "beginner" | "intermediate" | "advanced" | "expert";

export type ChallengeStatus = "upcoming" | "active" | "judging" | "completed";

export type CycleType = "sprint" | "marathon" | "flash";

// Challenge Cycle
export interface ChallengeCycle {
    type: CycleType;
    duration: number; // hours
    recurringSchedule?: string;
}

// Resource Limits
export interface ResourceLimits {
    maxMemoryMB: number;
    maxCpuPercent: number;
    maxStorageMB: number;
    maxBandwidthMbps: number;
    maxColdStartMs: number;
}

// Challenge Specification
export interface ChallengeSpec {
    overview: string;
    technicalRequirements: string[];
    constraints: string[];
    exampleInputOutput?: { input: string; output: string }[];
    resourceLimits?: ResourceLimits;
}

// Required Feature
export interface RequiredFeature {
    id: string;
    name: string;
    description: string;
    testable: boolean;
    weight: number;
}

// Bonus Objective
export interface BonusObjective {
    id: string;
    name: string;
    description: string;
    points: number;
    completed?: boolean;
}

// Evaluation Criterion
export type EvaluationType = "automated" | "peer_review" | "code_quality";

export interface MetricThreshold {
    label: string;
    min: number;
    max: number;
    points: number;
}

export interface EvaluationCriterion {
    id: string;
    name: string;
    description: string;
    weight: number;
    type: EvaluationType;
    metric?: string;
    thresholds?: MetricThreshold[];
}

// Starter Template
export interface StarterTemplate {
    id: string;
    framework: string;
    files: { path: string; content: string }[];
}

// Main Challenge Interface
export interface Challenge {
    id: string;
    title: string;
    description: string;
    difficulty: ChallengeDifficulty;
    cycle: ChallengeCycle;
    startDate: string;
    endDate: string;
    status: ChallengeStatus;
    specification: ChallengeSpec;
    requiredFeatures: RequiredFeature[];
    bonusObjectives: BonusObjective[];
    evaluationCriteria: EvaluationCriterion[];
    testSuiteId: string;
    participantCount: number;
    skillTierRestriction?: SkillTier;
    starterTemplate?: StarterTemplate;
    allowedTechnologies?: string[];
    prohibitedApproaches?: string[];
}

// Deployment Status
export type DeploymentStatus =
    | "pending"
    | "building"
    | "deploying"
    | "running"
    | "failed"
    | "terminated";

// Code Snapshot
export interface CodeSnapshot {
    files: { path: string; content: string }[];
    dependencies: Record<string, string>;
    buildCommand?: string;
    startCommand?: string;
}

// Performance Metrics
export interface PerformanceMetrics {
    responseTimeP50: number;
    responseTimeP95: number;
    responseTimeP99: number;
    errorRate: number;
    uptime: number;
    throughput: number;
    memoryUsage: number;
    cpuUsage: number;
}

// Security Issue
export interface SecurityIssue {
    severity: "low" | "medium" | "high" | "critical";
    title: string;
    description: string;
    line?: number;
    file?: string;
}

// Code Quality Score
export interface CodeQualityScore {
    lintingScore: number;
    typeScore?: number;
    testCoverage?: number;
    complexity: number;
    duplication: number;
    securityIssues: SecurityIssue[];
}

// Peer Review
export interface PeerReview {
    id: string;
    reviewerId: string;
    reviewerName: string;
    uxScore: number;
    accessibilityScore?: number;
    designScore?: number;
    comments: string;
    submittedAt: string;
}

// Score Breakdown
export interface ScoreBreakdown {
    criterionId: string;
    criterionName: string;
    score: number;
    maxScore: number;
    weight: number;
}

// Submission Scores
export interface SubmissionScores {
    overall: number;
    breakdown: ScoreBreakdown[];
    metrics: PerformanceMetrics;
    peerReviews?: PeerReview[];
    codeQuality?: CodeQualityScore;
}

// Submission
export type EvaluationStatus = "pending" | "running" | "completed" | "failed";

export interface Submission {
    id: string;
    challengeId: string;
    userId: string;
    userName: string;
    userTier: SkillTier;
    repositoryUrl?: string;
    codeSnapshot: CodeSnapshot;
    submittedAt: string;
    version: number;
    deploymentStatus: DeploymentStatus;
    deploymentUrl?: string;
    deploymentLogs?: string[];
    evaluationStatus: EvaluationStatus;
    scores: SubmissionScores;
    rank?: number;
}

// Leaderboard Entry
export type RankTrend = "up" | "down" | "stable" | "new";

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    displayName: string;
    avatarUrl?: string;
    tier: SkillTier;
    score: number;
    submissionId: string;
    metrics: PerformanceMetrics;
    trend: RankTrend;
    previousRank?: number;
}

// Leaderboard
export type LeaderboardType = "overall" | "performance" | "code_quality" | "ux";

export interface Leaderboard {
    challengeId: string;
    tier?: SkillTier;
    type: LeaderboardType;
    entries: LeaderboardEntry[];
    lastUpdated: string;
}

// Tier Progression
export interface TierProgression {
    currentTier: SkillTier;
    currentPoints: number;
    pointsToNextTier: number;
    seasonalRank: number;
    allTimeRank: number;
    challengesCompleted: number;
    winRate: number;
}

// User Competition Stats
export interface UserCompetitionStats {
    userId: string;
    displayName: string;
    tier: SkillTier;
    progression: TierProgression;
    submissions: Submission[];
    activeChallenges: string[];
}
