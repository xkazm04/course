/**
 * Learning DNA Types
 *
 * Universal learning profile protocol that aggregates achievements
 * from external platforms into a unified developer capability score.
 */

// ============================================================================
// PLATFORM TYPES
// ============================================================================

/**
 * Supported external platforms for importing achievements
 */
export type ExternalPlatform =
    | 'github'
    | 'stackoverflow'
    | 'leetcode'
    | 'coursera'
    | 'udemy'
    | 'hackerrank'
    | 'codewars'
    | 'linkedin'
    | 'pluralsight';

/**
 * OAuth connection status for a platform
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'pending' | 'error';

/**
 * Platform connection configuration
 */
export interface PlatformConnection {
    /** Platform identifier */
    platform: ExternalPlatform;
    /** Display name for the platform */
    displayName: string;
    /** Current connection status */
    status: ConnectionStatus;
    /** Platform username/handle */
    username?: string;
    /** OAuth access token (stored securely) */
    accessToken?: string;
    /** Token refresh date */
    refreshToken?: string;
    /** Last sync timestamp */
    lastSyncedAt?: string;
    /** Connection error message if any */
    errorMessage?: string;
    /** Whether the platform supports OAuth */
    supportsOAuth: boolean;
    /** Icon identifier */
    icon: string;
    /** Brand color */
    color: string;
}

// ============================================================================
// ACHIEVEMENT SIGNAL TYPES
// ============================================================================

/**
 * Categories of learning signals from external platforms
 */
export type SignalCategory =
    | 'contribution'     // Code contributions, PRs, issues
    | 'reputation'       // Stack Overflow reputation, badges
    | 'completion'       // Course completions, certifications
    | 'problem_solving'  // LeetCode, HackerRank problems
    | 'community'        // Answers, mentorship, discussions
    | 'skill_validation' // Skill assessments, tests
    | 'project_work';    // Real project experience

/**
 * Raw achievement signal from an external platform
 */
export interface ExternalAchievementSignal {
    /** Unique identifier */
    id: string;
    /** Source platform */
    platform: ExternalPlatform;
    /** Signal category */
    category: SignalCategory;
    /** Title/name of the achievement */
    title: string;
    /** Description of the achievement */
    description: string;
    /** Raw value from the platform (e.g., repo stars, reputation points) */
    rawValue: number;
    /** Normalized score (0-100) */
    normalizedScore: number;
    /** Skills associated with this achievement */
    skills: string[];
    /** When the achievement was earned */
    earnedAt: string;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}

// ============================================================================
// GITHUB SIGNALS
// ============================================================================

export interface GitHubSignals {
    /** Total public repositories */
    publicRepos: number;
    /** Total followers */
    followers: number;
    /** Total contributions in last year */
    contributionsLastYear: number;
    /** Total pull requests opened */
    totalPRs: number;
    /** Pull requests merged */
    mergedPRs: number;
    /** Total issues opened */
    totalIssues: number;
    /** Languages used (with percentage) */
    languages: Record<string, number>;
    /** Total stars received across repos */
    totalStars: number;
    /** Repos contributed to (not owned) */
    contributedRepos: number;
    /** Commit streak (consecutive days) */
    commitStreak: number;
}

// ============================================================================
// STACK OVERFLOW SIGNALS
// ============================================================================

export interface StackOverflowSignals {
    /** Reputation score */
    reputation: number;
    /** Gold badges */
    goldBadges: number;
    /** Silver badges */
    silverBadges: number;
    /** Bronze badges */
    bronzeBadges: number;
    /** Total answers */
    totalAnswers: number;
    /** Accepted answers */
    acceptedAnswers: number;
    /** Total questions asked */
    totalQuestions: number;
    /** Top tags with scores */
    topTags: Array<{ name: string; score: number }>;
    /** Reach (people reached) */
    reach: number;
}

// ============================================================================
// LEETCODE SIGNALS
// ============================================================================

export interface LeetCodeSignals {
    /** Total problems solved */
    totalSolved: number;
    /** Easy problems solved */
    easySolved: number;
    /** Medium problems solved */
    mediumSolved: number;
    /** Hard problems solved */
    hardSolved: number;
    /** Ranking */
    ranking: number;
    /** Contest rating */
    contestRating: number;
    /** Contests attended */
    contestsAttended: number;
    /** Acceptance rate */
    acceptanceRate: number;
    /** Submission streak */
    streak: number;
}

// ============================================================================
// COURSE PLATFORM SIGNALS
// ============================================================================

export interface CourseSignals {
    /** Platform (Coursera, Udemy, etc.) */
    platform: 'coursera' | 'udemy' | 'pluralsight' | 'linkedin';
    /** Total courses completed */
    coursesCompleted: number;
    /** Total hours of learning */
    totalHours: number;
    /** Certifications earned */
    certifications: Array<{
        name: string;
        issuer: string;
        earnedAt: string;
        credentialUrl?: string;
    }>;
    /** Skills learned */
    skillsLearned: string[];
    /** Average course completion rate */
    averageCompletionRate: number;
}

// ============================================================================
// LEARNING DNA SCORE
// ============================================================================

/**
 * Skill proficiency derived from external signals
 */
export interface DerivedSkillProficiency {
    /** Skill name/identifier */
    skillId: string;
    /** Skill display name */
    skillName: string;
    /** Confidence score (0-100) based on signal strength */
    confidence: number;
    /** Estimated proficiency level */
    proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    /** Sources of evidence for this skill */
    sources: Array<{
        platform: ExternalPlatform;
        signalType: SignalCategory;
        evidence: string;
        weight: number;
    }>;
    /** Last updated timestamp */
    lastUpdated: string;
}

/**
 * Dimension scores that make up the Learning DNA
 */
export interface LearningDNADimensions {
    /** Code contribution & open source activity */
    contribution: number;
    /** Problem solving & algorithmic thinking */
    problemSolving: number;
    /** Continuous learning & skill development */
    learning: number;
    /** Community engagement & knowledge sharing */
    community: number;
    /** Breadth of technical skills */
    breadth: number;
    /** Depth of expertise in key areas */
    depth: number;
}

/**
 * Complete Learning DNA profile
 */
export interface LearningDNAProfile {
    /** User ID */
    userId: string;
    /** Overall Learning DNA score (0-100) */
    overallScore: number;
    /** Dimension breakdown */
    dimensions: LearningDNADimensions;
    /** Connected platforms */
    connectedPlatforms: PlatformConnection[];
    /** Aggregated achievement signals */
    signals: ExternalAchievementSignal[];
    /** Derived skill proficiencies */
    derivedSkills: DerivedSkillProficiency[];
    /** Platform-specific data */
    platformData: {
        github?: GitHubSignals;
        stackoverflow?: StackOverflowSignals;
        leetcode?: LeetCodeSignals;
        courses: CourseSignals[];
    };
    /** Last profile sync */
    lastSyncedAt: string;
    /** Profile created at */
    createdAt: string;
    /** Profile last updated */
    updatedAt: string;
}

// ============================================================================
// CAREER MAPPING INTEGRATION
// ============================================================================

/**
 * Career readiness assessment based on Learning DNA
 */
export interface CareerReadinessAssessment {
    /** Target career/role */
    targetRole: string;
    /** Overall readiness percentage */
    readinessScore: number;
    /** Skill gaps identified */
    skillGaps: Array<{
        skillName: string;
        currentLevel: number;
        requiredLevel: number;
        recommendedResources: string[];
    }>;
    /** Strengths that align with the role */
    strengths: Array<{
        skillName: string;
        currentLevel: number;
        evidence: string[];
    }>;
    /** Recommended learning path */
    recommendedPath?: {
        pathId: string;
        pathName: string;
        estimatedHours: number;
    };
    /** Job match percentage based on current profile */
    jobMatchPercentage: number;
}

// ============================================================================
// SYNC & STORAGE
// ============================================================================

/**
 * Platform sync status
 */
export interface PlatformSyncStatus {
    platform: ExternalPlatform;
    status: 'idle' | 'syncing' | 'success' | 'error';
    lastSyncAt?: string;
    nextSyncAt?: string;
    errorMessage?: string;
    signalsCount: number;
}

/**
 * Storage key constants
 */
export const LEARNING_DNA_STORAGE_KEY = 'openforge_learning_dna';
export const PLATFORM_CONNECTIONS_KEY = 'openforge_platform_connections';
