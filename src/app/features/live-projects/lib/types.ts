/**
 * Live Projects Types
 *
 * Type definitions for the Industry-Connected Live Projects system.
 * Enables learners to contribute to real open-source projects and company codebases.
 */

// ============================================================================
// GITHUB ISSUE TYPES
// ============================================================================

/**
 * GitHub repository information
 */
export interface GitHubRepository {
    /** Repository ID */
    id: string;
    /** Owner name */
    owner: string;
    /** Repository name */
    name: string;
    /** Full name (owner/name) */
    fullName: string;
    /** Repository description */
    description: string;
    /** Primary language */
    language: string;
    /** Star count */
    stars: number;
    /** Fork count */
    forks: number;
    /** Open issues count */
    openIssues: number;
    /** Repository URL */
    url: string;
    /** Topics/tags */
    topics: string[];
    /** License */
    license?: string;
    /** Is verified partner company */
    isPartner: boolean;
    /** Last updated */
    updatedAt: string;
    /** Contributing guidelines URL */
    contributingUrl?: string;
    /** Code of conduct URL */
    codeOfConductUrl?: string;
}

/**
 * GitHub issue for contribution
 */
export interface GitHubIssue {
    /** Issue ID */
    id: string;
    /** Issue number */
    number: number;
    /** Issue title */
    title: string;
    /** Issue body/description */
    body: string;
    /** Issue URL */
    url: string;
    /** Issue state */
    state: "open" | "closed";
    /** Labels */
    labels: IssueLabel[];
    /** Assignees */
    assignees: GitHubUser[];
    /** Author */
    author: GitHubUser;
    /** Comments count */
    commentsCount: number;
    /** Created at */
    createdAt: string;
    /** Updated at */
    updatedAt: string;
    /** Repository info */
    repository: GitHubRepository;
    /** Is this a good first issue */
    isGoodFirstIssue: boolean;
    /** Is help wanted */
    isHelpWanted: boolean;
    /** Reactions */
    reactions: {
        thumbsUp: number;
        thumbsDown: number;
        heart: number;
        total: number;
    };
}

/**
 * Issue label
 */
export interface IssueLabel {
    /** Label ID */
    id: string;
    /** Label name */
    name: string;
    /** Label color (hex) */
    color: string;
    /** Label description */
    description?: string;
}

/**
 * GitHub user
 */
export interface GitHubUser {
    /** User ID */
    id: string;
    /** Username */
    login: string;
    /** Avatar URL */
    avatarUrl: string;
    /** Profile URL */
    profileUrl: string;
}

// ============================================================================
// ANALYZED ISSUE TYPES
// ============================================================================

/**
 * AI-analyzed issue with scaffolded learning experience
 */
export interface AnalyzedIssue {
    /** Original issue */
    issue: GitHubIssue;
    /** AI analysis */
    analysis: IssueAnalysis;
    /** Scaffolded learning path */
    learningPath: ScaffoldedLearningPath;
    /** Skill requirements */
    requiredSkills: SkillRequirement[];
    /** Estimated time to complete */
    estimatedHours: number;
    /** Difficulty assessment */
    difficulty: IssueDifficulty;
    /** Match score for user (0-100) */
    matchScore: number;
    /** Why this is a good match */
    matchReasons: string[];
    /** Potential blockers */
    potentialBlockers: string[];
    /** Mentor availability */
    mentorAvailable: boolean;
}

/**
 * Issue analysis from AI
 */
export interface IssueAnalysis {
    /** Summary of the issue */
    summary: string;
    /** What the issue is asking for */
    requirements: string[];
    /** Technical approach recommendations */
    technicalApproach: string[];
    /** Files likely to be modified */
    likelyFiles: string[];
    /** Related code patterns to understand */
    relatedPatterns: string[];
    /** Edge cases to consider */
    edgeCases: string[];
    /** Testing requirements */
    testingRequirements: string[];
    /** Documentation needs */
    documentationNeeds: string[];
    /** Codebase areas to study first */
    prerequisiteStudy: string[];
}

/**
 * Scaffolded learning path for the issue
 */
export interface ScaffoldedLearningPath {
    /** Path ID */
    id: string;
    /** Path title */
    title: string;
    /** Overview */
    overview: string;
    /** Phases */
    phases: LearningPhase[];
    /** Checkpoints with AI review */
    checkpoints: LearningCheckpoint[];
    /** Success criteria */
    successCriteria: string[];
}

/**
 * Learning phase within scaffolded path
 */
export interface LearningPhase {
    /** Phase ID */
    id: string;
    /** Phase order */
    order: number;
    /** Phase title */
    title: string;
    /** Phase description */
    description: string;
    /** Phase type */
    type: PhaseType;
    /** Tasks within phase */
    tasks: PhaseTask[];
    /** Estimated hours */
    estimatedHours: number;
    /** AI mentorship prompts */
    mentorshipPrompts: string[];
}

/**
 * Phase type
 */
export type PhaseType =
    | "exploration" // Understanding the codebase
    | "learning" // Learning required concepts
    | "planning" // Planning the implementation
    | "implementation" // Writing code
    | "testing" // Testing the changes
    | "review" // Getting code review
    | "refinement"; // Addressing feedback

/**
 * Task within a phase
 */
export interface PhaseTask {
    /** Task ID */
    id: string;
    /** Task title */
    title: string;
    /** Task description */
    description: string;
    /** Is completed */
    completed: boolean;
    /** Resources */
    resources?: TaskResource[];
    /** AI assistance available */
    aiAssistanceType?: AIAssistanceType;
}

/**
 * Task resource
 */
export interface TaskResource {
    /** Resource title */
    title: string;
    /** Resource type */
    type: "documentation" | "tutorial" | "video" | "code_example" | "article";
    /** Resource URL */
    url: string;
    /** Estimated read time (minutes) */
    readTime?: number;
}

/**
 * AI assistance type available for task
 */
export type AIAssistanceType =
    | "code_explanation" // Explain existing code
    | "approach_guidance" // Guide on how to approach
    | "code_review" // Review written code
    | "debugging_help" // Help debug issues
    | "best_practices"; // Suggest best practices

/**
 * Learning checkpoint with AI review
 */
export interface LearningCheckpoint {
    /** Checkpoint ID */
    id: string;
    /** Checkpoint title */
    title: string;
    /** What to verify */
    verificationCriteria: string[];
    /** Questions to answer */
    selfAssessment: string[];
    /** Is passed */
    passed: boolean;
    /** AI feedback */
    aiFeedback?: string;
}

/**
 * Skill requirement for issue
 */
export interface SkillRequirement {
    /** Skill name */
    name: string;
    /** Required level */
    requiredLevel: SkillLevel;
    /** User's current level */
    userLevel?: SkillLevel;
    /** Is critical (must have) */
    isCritical: boolean;
    /** Learning resources if user is below level */
    learningResources?: TaskResource[];
}

/**
 * Skill level
 */
export type SkillLevel = "none" | "beginner" | "intermediate" | "advanced" | "expert";

/**
 * Issue difficulty assessment
 */
export interface IssueDifficulty {
    /** Overall difficulty */
    overall: "beginner" | "intermediate" | "advanced" | "expert";
    /** Factors contributing to difficulty */
    factors: DifficultyFactor[];
    /** Recommendation for skill level */
    recommendedExperience: string;
}

/**
 * Factor contributing to difficulty
 */
export interface DifficultyFactor {
    /** Factor name */
    name: string;
    /** Impact (1-5) */
    impact: number;
    /** Explanation */
    explanation: string;
}

// ============================================================================
// CONTRIBUTION TYPES
// ============================================================================

/**
 * User contribution tracking
 */
export interface Contribution {
    /** Contribution ID */
    id: string;
    /** User ID */
    userId: string;
    /** Analyzed issue */
    analyzedIssue: AnalyzedIssue;
    /** Current status */
    status: ContributionStatus;
    /** Progress through phases */
    phaseProgress: PhaseProgress[];
    /** Pull request info if created */
    pullRequest?: PullRequestInfo;
    /** Mentor sessions */
    mentorSessions: MentorSession[];
    /** AI assistance usage */
    aiAssistanceLog: AIAssistanceLog[];
    /** Started at */
    startedAt: string;
    /** Last activity */
    lastActivityAt: string;
    /** Completed at */
    completedAt?: string;
    /** Outcome */
    outcome?: ContributionOutcome;
}

/**
 * Contribution status
 */
export type ContributionStatus =
    | "exploring" // Learning the codebase
    | "in_progress" // Working on implementation
    | "review_ready" // PR submitted, waiting for review
    | "changes_requested" // PR needs changes
    | "approved" // PR approved
    | "merged" // PR merged - success!
    | "abandoned" // User abandoned
    | "blocked"; // Blocked by external factor

/**
 * Phase progress tracking
 */
export interface PhaseProgress {
    /** Phase ID */
    phaseId: string;
    /** Status */
    status: "not_started" | "in_progress" | "completed";
    /** Tasks completed */
    tasksCompleted: number;
    /** Total tasks */
    totalTasks: number;
    /** Started at */
    startedAt?: string;
    /** Completed at */
    completedAt?: string;
    /** Time spent (minutes) */
    timeSpentMinutes: number;
}

/**
 * Pull request information
 */
export interface PullRequestInfo {
    /** PR ID */
    id: string;
    /** PR number */
    number: number;
    /** PR title */
    title: string;
    /** PR URL */
    url: string;
    /** PR state */
    state: "open" | "closed" | "merged";
    /** Created at */
    createdAt: string;
    /** Merged at */
    mergedAt?: string;
    /** Review status */
    reviewStatus: "pending" | "approved" | "changes_requested" | "commented";
    /** Comments count */
    commentsCount: number;
    /** Commits count */
    commitsCount: number;
    /** Files changed count */
    filesChanged: number;
    /** Lines added */
    additions: number;
    /** Lines removed */
    deletions: number;
}

/**
 * Mentor session record
 */
export interface MentorSession {
    /** Session ID */
    id: string;
    /** Session type */
    type: "ai" | "human" | "community";
    /** Session focus */
    focus: string;
    /** Started at */
    startedAt: string;
    /** Duration (minutes) */
    durationMinutes: number;
    /** Key takeaways */
    takeaways: string[];
    /** Follow-up actions */
    followUpActions: string[];
    /** Rating (if human/community) */
    rating?: number;
}

/**
 * AI assistance usage log
 */
export interface AIAssistanceLog {
    /** Log ID */
    id: string;
    /** Assistance type */
    type: AIAssistanceType;
    /** Context */
    context: string;
    /** Timestamp */
    timestamp: string;
    /** Was helpful */
    wasHelpful?: boolean;
}

/**
 * Contribution outcome
 */
export interface ContributionOutcome {
    /** Was successful (PR merged) */
    success: boolean;
    /** Skills demonstrated */
    skillsDemonstrated: string[];
    /** GitHub contribution earned */
    githubContributionEarned: boolean;
    /** Badge earned */
    badgeEarned?: ContributionBadge;
    /** Certificate earned */
    certificateEarned?: ContributionCertificate;
    /** Referral offered */
    referralOffered?: JobReferral;
    /** Feedback from maintainers */
    maintainerFeedback?: string;
}

// ============================================================================
// RECOGNITION TYPES
// ============================================================================

/**
 * Contribution badge
 */
export interface ContributionBadge {
    /** Badge ID */
    id: string;
    /** Badge name */
    name: string;
    /** Badge description */
    description: string;
    /** Badge icon URL */
    iconUrl: string;
    /** Badge level */
    level: "bronze" | "silver" | "gold" | "platinum";
    /** Earned at */
    earnedAt: string;
    /** Repository that awarded it */
    repository: string;
}

/**
 * Contribution certificate
 */
export interface ContributionCertificate {
    /** Certificate ID */
    id: string;
    /** Certificate title */
    title: string;
    /** Description */
    description: string;
    /** Skills certified */
    skills: string[];
    /** Issued at */
    issuedAt: string;
    /** Issuer (company/org name) */
    issuer: string;
    /** Verification URL */
    verificationUrl: string;
    /** Is shareable */
    shareable: boolean;
}

/**
 * Job referral from partner company
 */
export interface JobReferral {
    /** Referral ID */
    id: string;
    /** Company name */
    company: string;
    /** Position */
    position: string;
    /** Location */
    location: string;
    /** Job posting URL */
    jobUrl: string;
    /** Referral message */
    message: string;
    /** Expires at */
    expiresAt: string;
    /** Status */
    status: "pending" | "applied" | "expired" | "accepted" | "declined";
}

// ============================================================================
// MATCHING & DISCOVERY TYPES
// ============================================================================

/**
 * Project discovery request
 */
export interface ProjectDiscoveryRequest {
    /** User skills */
    userSkills: UserSkillProfile[];
    /** Target role */
    targetRole: string;
    /** Preferred languages */
    preferredLanguages: string[];
    /** Time available per week (hours) */
    weeklyHoursAvailable: number;
    /** Preferred difficulty */
    preferredDifficulty?: "beginner" | "intermediate" | "advanced";
    /** Industry interests */
    industryInterests?: string[];
    /** Prefer partner companies */
    preferPartnerCompanies: boolean;
    /** Max results */
    maxResults?: number;
}

/**
 * User skill profile for matching
 */
export interface UserSkillProfile {
    /** Skill name */
    name: string;
    /** Current level */
    level: SkillLevel;
    /** Projects completed with skill */
    projectsCompleted: number;
    /** Last used */
    lastUsed?: string;
}

/**
 * Project discovery response
 */
export interface ProjectDiscoveryResponse {
    /** Matched projects */
    matches: ProjectMatch[];
    /** Filter metadata */
    metadata: {
        totalAvailable: number;
        matchingFilters: number;
        appliedFilters: string[];
    };
}

/**
 * Project match result
 */
export interface ProjectMatch {
    /** Analyzed issue */
    analyzedIssue: AnalyzedIssue;
    /** Match score (0-100) */
    score: number;
    /** Match reasons */
    reasons: MatchReason[];
    /** Skill gaps (if any) */
    skillGaps: SkillGap[];
    /** Estimated learning time for gaps */
    gapLearningHours: number;
}

/**
 * Reason for match
 */
export interface MatchReason {
    /** Reason type */
    type: "skill_match" | "interest_match" | "difficulty_match" | "time_match" | "partner_company";
    /** Reason description */
    description: string;
    /** Weight in score */
    weight: number;
}

/**
 * Skill gap identified
 */
export interface SkillGap {
    /** Skill name */
    skill: string;
    /** Required level */
    requiredLevel: SkillLevel;
    /** User level */
    userLevel: SkillLevel;
    /** Gap size */
    gapSize: "small" | "medium" | "large";
    /** Bridge resources */
    bridgeResources: TaskResource[];
}

// ============================================================================
// PARTNER COMPANY TYPES
// ============================================================================

/**
 * Partner company
 */
export interface PartnerCompany {
    /** Company ID */
    id: string;
    /** Company name */
    name: string;
    /** Company logo URL */
    logoUrl: string;
    /** Company description */
    description: string;
    /** Company website */
    website: string;
    /** Industry */
    industry: string;
    /** Company size */
    size: "startup" | "small" | "medium" | "large" | "enterprise";
    /** Tech stack */
    techStack: string[];
    /** Open positions count */
    openPositions: number;
    /** Contributors hired */
    contributorsHired: number;
    /** Average rating from contributors */
    contributorRating: number;
    /** Active repositories */
    repositories: GitHubRepository[];
    /** Hiring programs */
    hiringPrograms: HiringProgram[];
}

/**
 * Hiring program from partner
 */
export interface HiringProgram {
    /** Program ID */
    id: string;
    /** Program name */
    name: string;
    /** Description */
    description: string;
    /** Requirements */
    requirements: string[];
    /** Positions available */
    positionsAvailable: number;
    /** Application deadline */
    applicationDeadline?: string;
    /** Is active */
    isActive: boolean;
}

// ============================================================================
// STATS & LEADERBOARD TYPES
// ============================================================================

/**
 * User contribution stats
 */
export interface UserContributionStats {
    /** User ID */
    userId: string;
    /** Total contributions */
    totalContributions: number;
    /** Merged PRs */
    mergedPRs: number;
    /** Repositories contributed to */
    repositoriesCount: number;
    /** Total lines added */
    totalAdditions: number;
    /** Total lines removed */
    totalDeletions: number;
    /** Skills demonstrated */
    skillsUsed: string[];
    /** Badges earned */
    badges: ContributionBadge[];
    /** Certificates earned */
    certificates: ContributionCertificate[];
    /** Partner company contributions */
    partnerContributions: number;
    /** Referrals received */
    referralsReceived: number;
    /** Current streak (days) */
    currentStreak: number;
    /** Longest streak (days) */
    longestStreak: number;
    /** Rank on leaderboard */
    leaderboardRank?: number;
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
    /** Rank */
    rank: number;
    /** User ID */
    userId: string;
    /** Username */
    username: string;
    /** Avatar URL */
    avatarUrl: string;
    /** Merged PRs */
    mergedPRs: number;
    /** Points */
    points: number;
    /** Top skills */
    topSkills: string[];
    /** Featured badge */
    featuredBadge?: ContributionBadge;
}
