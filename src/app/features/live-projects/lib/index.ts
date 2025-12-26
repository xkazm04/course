/**
 * Live Projects Library
 *
 * Export all types, services, and hooks for the Live Projects feature.
 */

// Types
export type {
    // GitHub types
    GitHubRepository,
    GitHubIssue,
    IssueLabel,
    GitHubUser,
    // Analyzed issue types
    AnalyzedIssue,
    IssueAnalysis,
    ScaffoldedLearningPath,
    LearningPhase,
    PhaseType,
    PhaseTask,
    TaskResource,
    AIAssistanceType,
    LearningCheckpoint,
    SkillRequirement,
    SkillLevel,
    IssueDifficulty,
    DifficultyFactor,
    // Contribution types
    Contribution,
    ContributionStatus,
    PhaseProgress,
    PullRequestInfo,
    MentorSession,
    AIAssistanceLog,
    ContributionOutcome,
    // Recognition types
    ContributionBadge,
    ContributionCertificate,
    JobReferral,
    // Matching types
    ProjectDiscoveryRequest,
    ProjectDiscoveryResponse,
    ProjectMatch,
    MatchReason,
    SkillGap,
    UserSkillProfile,
    // Partner types
    PartnerCompany,
    HiringProgram,
    // Stats types
    UserContributionStats,
    LeaderboardEntry,
} from "./types";

// GitHub Service
export {
    fetchRepository,
    searchGoodFirstIssues,
    fetchRepositoryIssues,
    analyzeIssue,
    GOOD_FIRST_ISSUE_LABELS,
    HELP_WANTED_LABELS,
} from "./githubService";

// Project Matching Service
export {
    discoverProjects,
    getPartnerCompanies,
    getPartnerCompanyById,
    isPartnerRepository,
    getPersonalizedRecommendations,
    SKILL_LEVEL_ORDER,
} from "./projectMatchingService";

// Contribution Service
export {
    startContribution,
    getContributions,
    getContribution,
    updateContributionStatus,
    updatePhaseProgress,
    completeTask,
    linkPullRequest,
    updatePullRequest,
    logMentorSession,
    logAIAssistance,
    rateAIAssistance,
    getStats,
    getLeaderboard,
    contributionStorage,
} from "./contributionService";

// Hooks
export {
    useLiveProjects,
    type UseLiveProjectsOptions,
    type UseLiveProjectsReturn,
} from "./useLiveProjects";

export {
    useLiveProjectCurriculum,
    convertToGeneratedCurriculum,
    calculateCurriculumProgress,
    getCompletedItems,
    type LiveProjectCurriculum,
} from "./useLiveProjectCurriculum";
