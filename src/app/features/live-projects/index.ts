/**
 * Live Projects Feature
 *
 * Industry-Connected Live Projects with Real Codebase Contribution
 *
 * This feature transforms the learning experience by connecting learners
 * with real open-source projects and partner companies. Instead of synthetic
 * portfolio projects, learners make actual contributions that earn:
 * - Real GitHub contributions
 * - Skills certification
 * - Job referrals from partner companies
 *
 * Key Capabilities:
 * - GitHub Issue Discovery: Find good-first-issues matching your skills
 * - AI-Powered Analysis: Understand issues and get scaffolded learning paths
 * - Contribution Tracking: Track progress through implementation phases
 * - AI Mentorship: Get guidance, code review, and debugging help
 * - Partner Companies: Contribute to companies actively hiring
 * - Badges & Certificates: Earn recognition for contributions
 * - Leaderboard: Compare progress with the community
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
} from "./lib/types";

// Services
export {
    // GitHub Service
    fetchRepository,
    searchGoodFirstIssues,
    fetchRepositoryIssues,
    analyzeIssue,
    // Project Matching
    discoverProjects,
    getPartnerCompanies,
    getPersonalizedRecommendations,
    // Contribution Service
    startContribution,
    getContributions,
    updateContributionStatus,
    completeTask,
    linkPullRequest,
    updatePullRequest,
    logMentorSession,
    logAIAssistance,
    getStats,
    getLeaderboard,
    contributionStorage,
} from "./lib";

// Hooks
export {
    useLiveProjects,
    type UseLiveProjectsOptions,
    type UseLiveProjectsReturn,
} from "./lib/useLiveProjects";

export {
    useLiveProjectCurriculum,
    convertToGeneratedCurriculum,
    calculateCurriculumProgress,
    getCompletedItems,
    type LiveProjectCurriculum,
} from "./lib/useLiveProjectCurriculum";

// Components
export {
    ProjectDiscovery,
    ContributionTracker,
    ContributionStats,
} from "./components";
