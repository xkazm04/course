/**
 * Learning Conductor Context
 *
 * Provides AI-powered learning orchestration across the Chapter system.
 * This file serves as the main entry point, re-exporting from modular sources.
 *
 * For implementation details, see ./conductor/
 *
 * Features:
 * - Behavior tracking and analysis
 * - Learner profile management
 * - Orchestration decisions (inject remedial, suggest break, etc.)
 * - Collective intelligence (peer solutions, shared insights)
 * - Content recommendations
 */

// Re-export everything from the modular implementation
export {
    LearningConductorProvider,
    useLearningConductor,
    ConductorContext,
} from "./conductor";

export type {
    ConductorContextValue,
    ConductorProviderProps,
} from "./conductor";
