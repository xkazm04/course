/**
 * Orchestration Hook
 *
 * Provides orchestration logic for the AI Learning Conductor.
 * Handles decision making, section reordering, and content injection.
 */

"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useLearningConductor } from "./LearningConductorContext";
import type {
    OrchestrationDecision,
    OrchestrationAction,
    SectionPriority,
    RemedialContent,
    LearnerProfile,
    SectionBehavior,
    OptimizedSectionOrder,
} from "./conductorTypes";
import type { ChapterSection } from "./chapterData";

// ============================================================================
// Types
// ============================================================================

export interface UseOrchestrationOptions {
    sections: ChapterSection[];
    enabled?: boolean;
    autoExecute?: boolean; // Auto-execute non-intrusive decisions
}

export interface UseOrchestrationReturn {
    // Current state
    pendingDecision: OrchestrationDecision | null;
    optimizedSections: ChapterSection[];
    injectedContent: RemedialContent[];

    // Decision handling
    acceptDecision: () => void;
    dismissCurrentDecision: () => void;

    // Section management
    shouldSkipSection: (sectionId: string) => boolean;
    shouldShowRemedial: (sectionId: string) => boolean;
    getRemedialForSection: (sectionId: string) => RemedialContent | null;

    // Content adjustments
    getContentDepth: () => "reduced" | "standard" | "expanded";
    getPaceRecommendation: () => { speed: number; message: string };

    // Celebrations and feedback
    shouldCelebrate: boolean;
    celebrationMessage: string | null;
    dismissCelebration: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useOrchestration(options: UseOrchestrationOptions): UseOrchestrationReturn {
    const { sections, enabled = true, autoExecute = true } = options;
    const conductor = useLearningConductor();

    const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);
    const [shouldCelebrate, setShouldCelebrate] = useState(false);
    const [skippedSections, setSkippedSections] = useState<Set<string>>(new Set());
    const [remedialSections, setRemedialSections] = useState<Map<string, RemedialContent>>(new Map());

    // Get the current pending decision
    const pendingDecision = conductor.getNextDecision();

    // ========================================================================
    // Auto-execute non-intrusive decisions
    // ========================================================================

    useEffect(() => {
        if (!enabled || !autoExecute || !pendingDecision) return;

        const autoExecuteActions: OrchestrationAction[] = [
            "celebrate_progress",
            "accelerate",
            "reduce_content",
        ];

        if (autoExecuteActions.includes(pendingDecision.action)) {
            handleDecisionExecution(pendingDecision);
            conductor.executeDecision(pendingDecision.id);
        }
    }, [pendingDecision, enabled, autoExecute]);

    // ========================================================================
    // Decision Execution Logic
    // ========================================================================

    const handleDecisionExecution = useCallback((decision: OrchestrationDecision) => {
        switch (decision.action) {
            case "celebrate_progress":
                setShouldCelebrate(true);
                setCelebrationMessage(decision.reason);
                break;

            case "skip_section":
                setSkippedSections((prev) => new Set(prev).add(decision.sectionId));
                break;

            case "inject_remedial": {
                const topic = (decision.metadata?.topic as string) || "concept";
                const remedial = conductor.getRemedialContent(topic)[0];
                if (remedial) {
                    setRemedialSections((prev) => new Map(prev).set(decision.sectionId, remedial));
                }
                break;
            }

            case "suggest_peer_solution":
                // Peer solutions are handled by the PeerSolutions component
                break;

            case "slow_down":
                conductor.updateProfile({ pace: "slow" });
                break;

            case "accelerate":
                conductor.updateProfile({ pace: "fast" });
                break;

            case "add_practice":
                // Add practice content injection
                break;

            case "expand_content":
                conductor.updateProfile({ preferredContentDepth: "advanced" });
                break;

            case "reduce_content":
                conductor.updateProfile({ preferredContentDepth: "basic" });
                break;

            case "suggest_break":
                // Break suggestion is shown as a decision card
                break;

            case "reorder_sections":
                // Section reordering is handled by optimizedSections
                break;
        }
    }, [conductor]);

    // ========================================================================
    // Decision Handling
    // ========================================================================

    const acceptDecision = useCallback(() => {
        if (!pendingDecision) return;

        handleDecisionExecution(pendingDecision);
        conductor.executeDecision(pendingDecision.id);
    }, [pendingDecision, conductor, handleDecisionExecution]);

    const dismissCurrentDecision = useCallback(() => {
        if (!pendingDecision) return;
        conductor.dismissDecision(pendingDecision.id);
    }, [pendingDecision, conductor]);

    // ========================================================================
    // Section Management
    // ========================================================================

    const shouldSkipSection = useCallback((sectionId: string): boolean => {
        return skippedSections.has(sectionId);
    }, [skippedSections]);

    const shouldShowRemedial = useCallback((sectionId: string): boolean => {
        return remedialSections.has(sectionId);
    }, [remedialSections]);

    const getRemedialForSection = useCallback((sectionId: string): RemedialContent | null => {
        return remedialSections.get(sectionId) || null;
    }, [remedialSections]);

    // ========================================================================
    // Optimized Section Order
    // ========================================================================

    const optimizedSections = useMemo((): ChapterSection[] => {
        if (!enabled) return sections;

        const profile = conductor.getLearnerProfile();
        const behaviors = conductor.state.sectionBehaviors;

        // Calculate section priorities based on learner profile and behaviors
        const sectionPriorities = sections.map((section, index) => {
            const behavior = behaviors[section.sectionId];
            let priority = index; // Default: original order

            // If learner is struggling with a section, move simpler sections first
            if (behavior && isStruggling(behavior)) {
                // Find prerequisite-like sections and boost their priority
                if (section.type === "video" || section.type === "lesson") {
                    priority -= 2;
                }
            }

            // If learner is confident, prioritize interactive content
            if (profile.confidence === "high" || profile.confidence === "expert") {
                if (section.type === "interactive" || section.type === "exercise") {
                    priority -= 1;
                }
            }

            // Skip sections that have been marked to skip
            if (skippedSections.has(section.sectionId)) {
                priority += 100; // Move to end
            }

            return { section, priority };
        });

        // Sort by priority
        return sectionPriorities
            .sort((a, b) => a.priority - b.priority)
            .map((sp) => sp.section)
            .filter((s) => !skippedSections.has(s.sectionId));
    }, [sections, enabled, conductor, skippedSections]);

    // ========================================================================
    // Content Adjustments
    // ========================================================================

    const getContentDepth = useCallback((): "reduced" | "standard" | "expanded" => {
        const profile = conductor.getLearnerProfile();

        switch (profile.preferredContentDepth) {
            case "remedial":
            case "basic":
                return "reduced";
            case "advanced":
            case "expert":
                return "expanded";
            default:
                return "standard";
        }
    }, [conductor]);

    const getPaceRecommendation = useCallback((): { speed: number; message: string } => {
        const profile = conductor.getLearnerProfile();

        switch (profile.pace) {
            case "struggling":
                return { speed: 0.75, message: "Take your time - we've slowed things down for you" };
            case "slow":
                return { speed: 0.9, message: "Going at a comfortable pace" };
            case "fast":
                return { speed: 1.25, message: "You're doing great - we've picked up the pace" };
            case "accelerated":
                return { speed: 1.5, message: "Flying through! Consider the advanced track" };
            default:
                return { speed: 1.0, message: "" };
        }
    }, [conductor]);

    // ========================================================================
    // Celebrations
    // ========================================================================

    const dismissCelebration = useCallback(() => {
        setShouldCelebrate(false);
        setCelebrationMessage(null);
    }, []);

    // ========================================================================
    // Injected Content
    // ========================================================================

    const injectedContent = useMemo((): RemedialContent[] => {
        return Array.from(remedialSections.values());
    }, [remedialSections]);

    return {
        pendingDecision,
        optimizedSections,
        injectedContent,
        acceptDecision,
        dismissCurrentDecision,
        shouldSkipSection,
        shouldShowRemedial,
        getRemedialForSection,
        getContentDepth,
        getPaceRecommendation,
        shouldCelebrate,
        celebrationMessage,
        dismissCelebration,
    };
}

// ============================================================================
// Helper Functions
// ============================================================================

function isStruggling(behavior: SectionBehavior): boolean {
    return (
        behavior.video.pauseCount > 5 ||
        behavior.video.replayCount > 3 ||
        (behavior.quiz.attempts > 2 && behavior.quiz.correctCount === 0) ||
        (behavior.code.errorCount > 5 && behavior.code.successCount === 0)
    );
}

export default useOrchestration;
