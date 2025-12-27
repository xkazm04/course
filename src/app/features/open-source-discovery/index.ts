// Components
export {
    DiscoveryDashboard,
    IssueCard,
    RepositoryBrowser,
    SkillMatcher,
    getDefaultMatchingPreferences,
    TaskComplexityBadge,
    ComplexityIndicator,
    ComplexityBar,
} from "./components";

// Types
export type {
    PartnerRepository,
    DiscoverableIssue,
    TaskAnalysis,
    TaskComplexity,
    SkillRequirement,
    MatchResult,
    MatchingPreferences,
    MatchDifficulty,
    SkillGap,
    DiscoveryFilters,
    DiscoveryState,
    LearnerFriendliness,
} from "./lib/types";

export { COMPLEXITY_CONFIG, FRIENDLINESS_CONFIG } from "./lib/types";

// Hooks
export { useDiscovery } from "./lib/useDiscovery";

// Storage
export {
    getDiscoveryState,
    getRepositories,
    getIssues,
    toggleWatchRepository,
    getFilters,
    setFilters,
    resetFilters,
} from "./lib/discoveryStorage";

// Data
export {
    getPartnerRepositories,
    getMockIssues,
    getUniqueLanguages,
    getUniqueTopics,
} from "./lib/partnerRegistry";
