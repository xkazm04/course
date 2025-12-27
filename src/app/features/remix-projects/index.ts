// Remix & Extend Model Feature
// Task 04: Inheriting and improving existing codebases

// Types
export type {
    ProjectDomain,
    ProjectDifficulty,
    TechStack,
    DeveloperPersona,
    ProjectFile,
    DirectoryNode,
    ProjectRepository,
    SeedProject,
    Objective,
    Hint,
    Assignment,
    ModifiedFile,
    UserFork,
    DiffChange,
    DiffHunk,
    FileDiff,
    ProjectDiff,
    SubmissionAnalysis,
    SubmissionScores,
    Submission,
    QualityGateResult,
    EvolutionEligibility,
} from "./lib/types";

// Hooks
export { useSeedProject } from "./lib/useSeedProject";
export { useAssignment } from "./lib/useAssignment";

// Utilities
export {
    getAllSeedProjects,
    getSeedProjectById,
    getSeedProjectsByDomain,
    getSeedProjectsByDifficulty,
    getAssignmentsForProject,
    getAssignmentById,
} from "./lib/seedProjectTemplates";

export {
    claimAssignment,
    getAssignment,
    getUserAssignments,
    getAssignmentProgress,
    createFork,
    getForkForAssignment,
    updateForkFile,
    revealHint,
    markObjectiveCompleted,
    submitAssignment,
} from "./lib/projectStorage";

export {
    generateDiff,
    analyzeSubmission,
    calculateSubmissionScore,
} from "./lib/diffAnalyzer";

export {
    runQualityGates,
    checkEvolutionEligibility,
    getImprovementSuggestions,
} from "./lib/qualityGates";

// Components
export {
    ProjectCard,
    PreviousDevContext,
    InlineDevContext,
    CodeExplorer,
    FileInfo,
    FileIssues,
    ProjectBrowser,
    ProjectDetail,
    AssignmentPanel,
    DiffViewer,
    DiffSummary,
    QualityReport,
    QualityGates,
    RemixWorkspace,
    ScannedProjects,
} from "./components";

// Remix API Client (for scanned challenges)
export {
    getApprovedChallenges,
    getChallengeById,
    getScannedProjects,
    getScannedProject,
    claimChallenge,
    getUserAssignments as getRemixUserAssignments,
    getAssignmentById as getRemixAssignmentById,
    updateAssignmentStatus,
    submitAssignment as submitRemixAssignment,
    getScans,
    getScanById,
    getTopicsForStack,
    challengeToKnownIssue,
    challengeToCodeSmell,
    challengeToMissingFeature,
    scannedProjectToSeedProject,
} from "./lib/remixApi";

export type {
    ScannedProject,
    ScannedChallenge,
    ChallengeAssignment,
    ScanSession,
    GetChallengesOptions,
    Topic,
    Skill,
} from "./lib/remixApi";
