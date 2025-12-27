// OpenForge Type Definitions

// ============================================================================
// USER & PROFILE
// ============================================================================

export interface UserProfile {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    githubUsername?: string;
    githubConnected: boolean;

    // Stats
    level: number;
    xp: number;
    xpToNextLevel: number;
    contributionCount: number;
    mergedPRCount: number;
    currentStreak: number;

    // Skills
    skills: UserSkill[];

    // Status
    onboardingComplete: boolean;
    joinedAt: string;
}

export interface UserSkill {
    id: string;
    name: string;
    level: "beginner" | "intermediate" | "advanced" | "expert";
    proficiency: number; // 0-100 within level
    evidenceCount: number;
    lastDemonstratedAt?: string;
}

// ============================================================================
// PROJECTS
// ============================================================================

export type ProjectCategory =
    | "crm"
    | "project_management"
    | "marketing"
    | "analytics"
    | "productivity"
    | "developer_tools";

export type ProjectStatus = "planning" | "active" | "mature";

export interface ForgeProject {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    description: string;

    // Target
    targetProduct: string;
    targetProductUrl: string;
    category: ProjectCategory;

    // Tech
    language: string;
    framework: string;
    techStack: string[];

    // Repository
    githubUrl: string;

    // Status
    status: ProjectStatus;
    featureParityPercent: number;

    // Stats
    contributorCount: number;
    openChallenges: number;
    completedChallenges: number;
    starCount: number;

    // Learning
    skillsTaught: string[];
    difficultyRange: string;

    // Media
    logoUrl?: string;
    screenshotUrls: string[];
    demoUrl?: string;

    // Maintainers
    leadMaintainers: Maintainer[];
}

export interface Maintainer {
    id: string;
    username: string;
    avatarUrl: string;
    role: "lead" | "maintainer";
}

export interface ProjectFeature {
    id: string;
    title: string;
    description: string;
    status: "planned" | "in_progress" | "completed";
    challengeCount: number;
}

// ============================================================================
// CHALLENGES
// ============================================================================

export type ChallengeType = "bug" | "feature" | "refactor" | "test" | "docs" | "performance" | "security";
export type ChallengeDifficulty = "beginner" | "intermediate" | "advanced";
export type ChallengeStatus = "open" | "claimed" | "in_review" | "completed";

export interface Challenge {
    id: string;
    projectId: string;
    projectName: string;
    projectLogo?: string;

    // Classification
    type: ChallengeType;
    difficulty: ChallengeDifficulty;

    // Content
    title: string;
    description: string;
    context: string;

    // Code
    location?: {
        file: string;
        startLine: number;
        endLine: number;
    };
    codeSnippet?: string;

    // Instructions
    instructions: string;
    expectedOutcome: string;
    hints: ChallengeHint[];

    // Skills
    skillsRequired: string[];
    skillsTaught: string[];
    tags: string[];

    // Estimation
    estimatedMinutes: number;
    xpReward: number;

    // Status
    status: ChallengeStatus;
    claimedBy?: string;
    claimedAt?: string;

    // Stats
    timesCompleted: number;
    avgCompletionMinutes?: number;
    successRate?: number;
}

export interface ChallengeHint {
    level: 1 | 2 | 3;
    content: string;
    xpPenalty: number;
    revealed: boolean;
}

// ============================================================================
// CONTRIBUTIONS
// ============================================================================

export type ContributionStatus =
    | "claimed"
    | "in_progress"
    | "submitted"
    | "changes_requested"
    | "approved"
    | "merged"
    | "closed";

export interface Contribution {
    id: string;

    // References
    userId: string;
    challengeId: string;
    challenge: Challenge;
    projectId: string;
    projectName: string;

    // GitHub
    forkUrl?: string;
    branchName?: string;
    prUrl?: string;
    prNumber?: number;

    // Status
    status: ContributionStatus;

    // Timing
    claimedAt: string;
    startedAt?: string;
    submittedAt?: string;
    mergedAt?: string;

    // Progress
    timeSpentMinutes: number;
    hintsUsed: number;

    // Results
    score?: number;
    xpEarned?: number;

    // Reviews
    reviews: Review[];
}

export interface ContributionEvent {
    id: string;
    type: "claimed" | "started" | "committed" | "submitted" | "reviewed" | "merged";
    timestamp: string;
    description: string;
    metadata?: Record<string, unknown>;
}

// ============================================================================
// REVIEWS
// ============================================================================

export type ReviewType = "ai_tutor" | "maintainer" | "peer";
export type ReviewVerdict = "approved" | "changes_requested" | "needs_discussion";

export interface Review {
    id: string;
    contributionId: string;

    // Reviewer
    type: ReviewType;
    reviewerName: string;
    reviewerAvatar?: string;

    // Content
    verdict: ReviewVerdict;
    summary: string;

    // Feedback
    feedbackItems: ReviewFeedbackItem[];

    // Learning
    learningPoints: string[];
    suggestedResources: SuggestedResource[];

    // Scores
    scores: {
        codeQuality: number;
        completeness: number;
        testCoverage: number;
        documentation: number;
        overall: number;
    };

    createdAt: string;
}

export interface ReviewFeedbackItem {
    type: "praise" | "suggestion" | "issue" | "question";
    file?: string;
    line?: number;
    content: string;
    codeSnippet?: string;
}

export interface SuggestedResource {
    type: "docs" | "article" | "video" | "course";
    title: string;
    url: string;
    reason: string;
}

// ============================================================================
// LEADERBOARD
// ============================================================================

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    username: string;
    avatarUrl: string;

    // Stats
    contributionCount: number;
    mergedPRs: number;
    xp: number;
    level: number;

    // Badges
    badges: string[];

    // Recent activity
    lastActiveAt: string;
}

// ============================================================================
// ONBOARDING
// ============================================================================

export interface OnboardingState {
    currentStep: number;
    totalSteps: number;

    // Collected data
    skillAssessment?: SkillAssessmentResult;
    interests?: string[];
    goals?: string[];
    weeklyHours?: number;
    githubConnected: boolean;

    completed: boolean;
}

export interface SkillAssessmentResult {
    overallLevel: "beginner" | "intermediate" | "advanced";
    skills: {
        skill: string;
        level: "none" | "beginner" | "intermediate" | "advanced";
    }[];
    recommendedPath: string;
}
