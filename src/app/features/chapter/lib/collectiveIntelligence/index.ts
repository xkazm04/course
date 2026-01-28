/**
 * Collective Intelligence Module
 *
 * Emergent curriculum system that derives learning dependencies from
 * collective learner behavior rather than hand-crafted prerequisites.
 *
 * Key capabilities:
 * - Track learner journeys through chapters
 * - Derive implicit prerequisites from success/failure patterns
 * - Identify struggle points and common errors
 * - Discover optimal learning paths
 * - Generate curriculum improvement recommendations
 */

// Types
export type {
    // Journey types
    LearnerJourney,
    ChapterAttempt,
    SectionBehaviorSummary,
    StruggleMetrics,
    ChapterSuccessMetrics,
    JourneySuccessMetrics,
    JourneyProfile,
    // Prerequisite types
    ImplicitPrerequisite,
    PrerequisiteEvidence,
    CommonError,
    StrugglePoint,
    StruggleType,
    // Path types
    OptimalPath,
    PathMetrics,
    PathSuitability,
    // Curriculum types
    EmergentCurriculum,
    CurriculumHealthMetrics,
    CurriculumRecommendation,
    RecommendationType,
    // Config
    CollectiveIntelligenceConfig,
} from "./types";

export { DEFAULT_COLLECTIVE_INTELLIGENCE_CONFIG } from "./types";

// Storage
export {
    learnerJourneyStorage,
    implicitPrerequisiteStorage,
    strugglePointStorage,
    commonErrorStorage,
    optimalPathStorage,
    emergentCurriculumStore,
    aggregationMetadataStore,
} from "./storage";

// Derivation algorithms
export {
    deriveImplicitPrerequisites,
    identifyStrugglePoints,
    identifyCommonErrors,
    discoverOptimalPaths,
} from "./derivation";

// Curriculum generation
export {
    generateEmergentCurriculum,
    getEmergentCurriculum,
    getImplicitPrerequisitesForChapter,
    getStrugglePointsForChapter,
    getRecommendedPath,
    shouldHavePrerequisite,
    mergeWithStaticPrerequisites,
} from "./curriculumGenerator";

// Cycle detection utilities
export {
    CircularPrerequisiteError,
    detectPrerequisiteCycles,
    validateNoPrerequisiteCycles,
    type CycleDetectionResult,
} from "./curriculumGenerator";

// React hook
export {
    useCollectiveIntelligence,
    type UseCollectiveIntelligenceOptions,
    type UseCollectiveIntelligenceReturn,
} from "./useCollectiveIntelligence";
