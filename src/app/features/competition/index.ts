// Competition Feature
// Competitive Ecosystem Model for challenge-based learning

// Types
export * from "./lib/types";

// Tier System
export {
    TIER_CONFIGS,
    DIFFICULTY_CONFIG,
    getTierConfig,
    getTierFromPoints,
    getPointsToNextTier,
    getTierProgress,
    calculatePointsFromChallenge,
    canAccessChallenge,
} from "./lib/tierSystem";

// Challenge Templates
export {
    CHALLENGE_TEMPLATES,
    getAllChallenges,
    getChallengesByStatus,
    getChallengeById,
    getMockLeaderboard,
} from "./lib/challengeTemplates";

// Storage
export {
    competitionStateStorage,
    submissionsStorage,
    draftStorage,
    getSubmissionsForChallenge,
    getUserSubmission,
    saveDraft,
    getDraft,
    updateUserPoints,
    getUserStats,
    joinChallenge,
    leaveChallenge,
} from "./lib/challengeStorage";

// Hooks
export { useChallenge } from "./lib/useChallenge";
export { useLeaderboard } from "./lib/useLeaderboard";
export { useSubmission } from "./lib/useSubmission";
export { useArena } from "./lib/useArena";

// Arena Types
export * from "./lib/arenaTypes";

// Components
export {
    TierBadge,
    TierDisplay,
    TierIcon,
    CountdownTimer,
    TimeProgress,
    ChallengeCard,
    ChallengeDetail,
    LeaderboardEntry,
    CompactLeaderboardEntry,
    Leaderboard,
    MetricsDisplay,
    SubmissionEditor,
    PeerReviewPanel,
    ChallengeDashboard,
    // 3D Championship Arena
    ChampionshipArena,
    ArenaEnvironment,
    Podiums,
    CompetitorAvatar,
    RankAnimationWrapper,
    CelebrationEffect,
    ClimbTrail,
    LightningEffect,
    VRModeManager,
    VRController,
    VREntryButton,
    VRInfoPanel,
    VRTeleportFloor,
    TeleportIndicator,
    DesktopCameraControls,
} from "./components";
