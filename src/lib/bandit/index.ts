/**
 * Multi-Armed Bandit Library
 *
 * Implements Thompson Sampling with contextual features for
 * optimizing intervention selection and timing in the learning platform.
 */

// Types
export type {
    InterventionType,
    PreStruggleIndicator,
    LearnerContext,
    EncodedContext,
    BetaParameters,
    ArmStatistics,
    ContextualArmStats,
    InterventionOutcome,
    RewardConfig,
    BanditConfig,
    SelectionResult,
    ArmPerformanceSummary,
    BanditHealthMetrics,
    BanditState,
} from "./types";

export { DEFAULT_BANDIT_CONFIG } from "./types";

// Thompson Sampler
export {
    ThompsonSampler,
    getThompsonSampler,
    resetThompsonSampler,
    sampleBeta,
    calculateUCB1,
} from "./thompsonSampler";
export type { ThompsonSamplerConfig } from "./thompsonSampler";

// Context Encoder
export {
    ContextEncoder,
    getContextEncoder,
    resetContextEncoder,
} from "./contextEncoder";

// Outcome Tracker
export {
    OutcomeTracker,
    getOutcomeTracker,
    resetOutcomeTracker,
} from "./outcomeTracker";
export type {
    OutcomeSignal,
    PendingOutcome,
    OutcomeResolution,
} from "./outcomeTracker";

// Bandit Orchestrator
export {
    BanditOrchestrator,
    getBanditOrchestrator,
    initializeBanditOrchestrator,
    resetBanditOrchestrator,
} from "./banditOrchestrator";
export type {
    SelectionRequest,
    SelectionResponse,
    RewardRequest,
    RewardResponse,
    OrchestratorConfig,
} from "./banditOrchestrator";

// React Hooks
export {
    useBanditIntervention,
    useBanditScaffolding,
} from "./useBanditIntervention";
export type {
    BanditInterventionState,
    BanditInterventionActions,
    UseBanditInterventionReturn,
} from "./useBanditIntervention";
