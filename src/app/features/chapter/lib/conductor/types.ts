/**
 * Learning Conductor Context Types
 *
 * Type definitions for the AI-powered learning orchestration system.
 */

import type {
    ConductorState,
    ConductorConfig,
    LearnerProfile,
    SectionBehavior,
    OrchestrationDecision,
    OrchestrationAction,
    CollectiveInsight,
    PeerSolution,
    RemedialContent,
    SectionPriority,
} from "../conductorTypes";

// ============================================================================
// Context Value Type
// ============================================================================

export interface ConductorContextValue {
    state: ConductorState;
    config: ConductorConfig;

    // Profile management
    updateProfile: (updates: Partial<LearnerProfile>) => void;
    getLearnerProfile: () => LearnerProfile;

    // Behavior tracking integration
    recordBehavior: (sectionId: string, behavior: Partial<SectionBehavior>) => void;

    // Orchestration
    getNextDecision: () => OrchestrationDecision | null;
    executeDecision: (decisionId: string) => void;
    dismissDecision: (decisionId: string) => void;
    triggerDecision: (action: OrchestrationAction, reason: string, metadata?: Record<string, unknown>) => void;

    // Content recommendations
    getRemedialContent: (topic: string) => RemedialContent[];
    getPeerSolutions: (sectionId: string, context?: string) => PeerSolution[];
    getSectionOrder: () => SectionPriority[];

    // Collective intelligence
    contributeInsight: (sectionId: string, data: Partial<CollectiveInsight>) => void;
    getCollectiveInsights: (sectionId: string) => CollectiveInsight | null;

    // Configuration
    updateConfig: (updates: Partial<ConductorConfig>) => void;

    // Section navigation
    setCurrentSection: (sectionId: string) => void;
}

// ============================================================================
// Reducer Action Types
// ============================================================================

export type ConductorAction =
    | { type: "SET_ACTIVE"; payload: boolean }
    | { type: "SET_CURRENT_SECTION"; payload: string }
    | { type: "SET_PROFILE"; payload: LearnerProfile }
    | { type: "UPDATE_PROFILE"; payload: Partial<LearnerProfile> }
    | { type: "SET_BEHAVIOR"; payload: { sectionId: string; behavior: SectionBehavior } }
    | { type: "ADD_DECISION"; payload: OrchestrationDecision }
    | { type: "EXECUTE_DECISION"; payload: string }
    | { type: "DISMISS_DECISION"; payload: string }
    | { type: "SET_PEER_SOLUTIONS"; payload: PeerSolution[] }
    | { type: "ADD_INJECTED_CONTENT"; payload: RemedialContent }
    | { type: "SET_COLLECTIVE_INSIGHTS"; payload: CollectiveInsight[] }
    | { type: "UPDATE_ACTIVITY"; payload: number };

// ============================================================================
// Provider Props
// ============================================================================

export interface ConductorProviderProps {
    children: React.ReactNode;
    userId: string;
    courseId: string;
    chapterId: string;
    initialSectionId?: string;
    config?: Partial<ConductorConfig>;
}
