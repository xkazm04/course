/**
 * Proactive Scaffolding Engine
 *
 * Injects scaffolding content 2-3 steps ahead based on predictions.
 * Creates personalized learning interventions that prevent confusion
 * rather than react to it.
 */

import type {
    InterventionRecommendation,
    InterventionType,
    InterventionContent,
    StruggePrediction,
    ActiveIntervention,
    PredictiveConfig,
    CollectiveStrugglePattern,
} from "./predictiveLearning.types";
import { DEFAULT_PREDICTIVE_CONFIG } from "./predictiveLearning.types";
import type { ContentSlot, TextSlot, CodeSlot, KeyPointsSlot } from "../../chapter/lib/contentSlots";
import type { AdaptiveSlot, ComprehensionLevel } from "./types";

// ============================================================================
// Scaffolding Content Generation
// ============================================================================

/**
 * Priority mapping for intervention types
 */
const INTERVENTION_PRIORITY: Record<InterventionType, number> = {
    interactive_hint: 10,
    worked_example: 9,
    scaffolding_content: 8,
    simplified_example: 7,
    prerequisite_review: 6,
    visual_aid: 5,
    alternative_explanation: 5,
    concept_bridge: 4,
    pace_adjustment: 3,
    micro_practice: 8,
};

/**
 * Intervention display configuration
 */
interface InterventionDisplayConfig {
    variant: "hint" | "info" | "warning" | "success";
    icon: string;
    accentColor: string;
    borderStyle: string;
}

const INTERVENTION_DISPLAY: Record<InterventionType, InterventionDisplayConfig> = {
    scaffolding_content: {
        variant: "info",
        icon: "layers",
        accentColor: "from-[var(--forge-info)]/20 to-[var(--ember-glow)]/20",
        borderStyle: "border-[var(--forge-info)]/30",
    },
    simplified_example: {
        variant: "hint",
        icon: "code-bracket",
        accentColor: "from-[var(--forge-success)]/20 to-[var(--forge-success)]/10",
        borderStyle: "border-[var(--forge-success)]/30",
    },
    prerequisite_review: {
        variant: "warning",
        icon: "arrow-path",
        accentColor: "from-[var(--forge-warning)]/20 to-[var(--ember)]/20",
        borderStyle: "border-[var(--forge-warning)]/30",
    },
    visual_aid: {
        variant: "info",
        icon: "chart-bar",
        accentColor: "from-[var(--ember-glow)]/20 to-[var(--ember-glow)]/10",
        borderStyle: "border-[var(--ember-glow)]/30",
    },
    interactive_hint: {
        variant: "hint",
        icon: "light-bulb",
        accentColor: "from-[var(--gold)]/20 to-[var(--forge-warning)]/20",
        borderStyle: "border-[var(--gold)]/30",
    },
    pace_adjustment: {
        variant: "info",
        icon: "clock",
        accentColor: "from-[var(--forge-text-muted)]/20 to-[var(--forge-border-subtle)]/20",
        borderStyle: "border-[var(--forge-border-subtle)]/30",
    },
    alternative_explanation: {
        variant: "info",
        icon: "arrows-right-left",
        accentColor: "from-[var(--forge-info)]/20 to-[var(--forge-info)]/10",
        borderStyle: "border-[var(--forge-info)]/30",
    },
    worked_example: {
        variant: "success",
        icon: "check-badge",
        accentColor: "from-[var(--forge-success)]/20 to-[var(--forge-success)]/10",
        borderStyle: "border-[var(--forge-success)]/30",
    },
    concept_bridge: {
        variant: "info",
        icon: "link",
        accentColor: "from-[var(--forge-error)]/20 to-[var(--ember)]/20",
        borderStyle: "border-[var(--forge-error)]/30",
    },
    micro_practice: {
        variant: "success",
        icon: "beaker",
        accentColor: "from-[var(--ember-glow)]/20 to-[var(--ember-glow)]/10",
        borderStyle: "border-[var(--ember-glow)]/30",
    },
};

// ============================================================================
// Scaffolding Slot Generation
// ============================================================================

/**
 * Generate scaffolding slot from intervention
 */
export function interventionToScaffoldingSlot(
    intervention: InterventionRecommendation,
    prediction: StruggePrediction
): ScaffoldingSlot {
    const displayConfig = INTERVENTION_DISPLAY[intervention.type];
    const basePriority = INTERVENTION_PRIORITY[intervention.type];

    // Boost priority based on prediction probability and severity
    const severityBoost =
        prediction.severity === "severe" ? 3 : prediction.severity === "moderate" ? 2 : 1;
    const probabilityBoost = Math.round(prediction.probability * 2);
    const adjustedPriority = Math.min(15, basePriority + severityBoost + probabilityBoost);

    return {
        id: `scaffold_${intervention.id}`,
        type: "scaffolding",
        interventionType: intervention.type,
        priority: adjustedPriority,
        content: intervention.content,
        displayConfig,
        metadata: {
            predictionId: prediction.id,
            interventionId: intervention.id,
            stepsAhead: prediction.stepsAhead,
            probability: prediction.probability,
            expectedImpact: intervention.expectedImpact,
            collectiveSuccessRate: intervention.collectiveSuccessRate,
        },
        isProactive: true,
        targetSection: prediction.sectionId,
        targetConcept: prediction.conceptId,
    };
}

/**
 * Scaffolding slot type for predictive content
 */
export interface ScaffoldingSlot {
    id: string;
    type: "scaffolding";
    interventionType: InterventionType;
    priority: number;
    content: InterventionContent;
    displayConfig: InterventionDisplayConfig;
    metadata: {
        predictionId: string;
        interventionId: string;
        stepsAhead: number;
        probability: number;
        expectedImpact: number;
        collectiveSuccessRate: number;
    };
    isProactive: boolean;
    targetSection?: string;
    targetConcept?: string;
}

/**
 * Convert scaffolding slot to content slot for rendering
 */
export function scaffoldingSlotToContentSlot(
    scaffold: ScaffoldingSlot
): ContentSlot {
    const { content, interventionType } = scaffold;

    // If there's code, use a code slot
    if (content.code) {
        return {
            id: scaffold.id,
            type: "code",
            data: {
                code: content.code,
                language: content.codeLanguage || "typescript",
                title: content.title,
                showLineNumbers: true,
                showCopy: true,
            },
        } as CodeSlot;
    }

    // If there are points, use key points slot
    if (content.points && content.points.length > 0) {
        return {
            id: scaffold.id,
            type: "keyPoints",
            data: {
                title: content.title,
                points: content.points,
                icon:
                    interventionType === "interactive_hint"
                        ? "lightbulb"
                        : interventionType === "worked_example"
                        ? "check"
                        : "sparkles",
            },
        } as KeyPointsSlot;
    }

    // Default to text slot
    return {
        id: scaffold.id,
        type: "text",
        data: {
            title: content.title,
            content: content.description,
            variant:
                interventionType === "interactive_hint"
                    ? "highlight"
                    : interventionType === "scaffolding_content"
                    ? "description"
                    : "prose",
        },
    } as TextSlot;
}

/**
 * Convert scaffolding slot to adaptive slot format
 */
export function scaffoldingSlotToAdaptiveSlot(
    scaffold: ScaffoldingSlot,
    targetLevels: ComprehensionLevel[] = ["beginner", "intermediate"]
): AdaptiveSlot {
    const slotTypeMap: Record<InterventionType, AdaptiveSlot["slotType"]> = {
        scaffolding_content: "explanation",
        simplified_example: "example",
        prerequisite_review: "explanation",
        visual_aid: "explanation",
        interactive_hint: "hint",
        pace_adjustment: "hint",
        alternative_explanation: "explanation",
        worked_example: "example",
        concept_bridge: "explanation",
        micro_practice: "challenge",
    };

    return {
        slotType: slotTypeMap[scaffold.interventionType] || "explanation",
        targetLevel: targetLevels,
        priority: scaffold.priority,
        content: {
            title: scaffold.content.title,
            description: scaffold.content.description,
            code: scaffold.content.code,
            codeLanguage: scaffold.content.codeLanguage,
            points: scaffold.content.points,
        },
    };
}

// ============================================================================
// Scaffolding Injection Logic
// ============================================================================

/**
 * Position where scaffolding should be injected
 */
export type InjectionPosition =
    | "before_current" // Immediately before current content
    | "after_current" // Immediately after current content
    | "before_section" // At the start of target section
    | "after_section" // At the end of target section
    | "floating"; // Floating panel/modal

/**
 * Determine optimal injection position for scaffolding
 */
export function determineInjectionPosition(
    scaffold: ScaffoldingSlot,
    currentSectionId: string
): InjectionPosition {
    const { interventionType, targetSection, metadata } = scaffold;

    // Immediate interventions show as floating
    if (metadata.stepsAhead <= 1 && metadata.probability > 0.8) {
        return "floating";
    }

    // Hints and pace adjustments are contextual
    if (interventionType === "interactive_hint" || interventionType === "pace_adjustment") {
        return "before_current";
    }

    // Prerequisites and bridges come before content
    if (interventionType === "prerequisite_review" || interventionType === "concept_bridge") {
        return "before_section";
    }

    // Examples and worked examples come after explanation
    if (interventionType === "simplified_example" || interventionType === "worked_example") {
        return "after_current";
    }

    // Micro practice comes at the end
    if (interventionType === "micro_practice") {
        return "after_section";
    }

    // Default based on section matching
    if (targetSection && targetSection !== currentSectionId) {
        return "before_section";
    }

    return "after_current";
}

/**
 * Filter and sort scaffolding slots for injection
 */
export function prioritizeScaffoldingSlots(
    slots: ScaffoldingSlot[],
    maxSlots: number = 3,
    config: PredictiveConfig = DEFAULT_PREDICTIVE_CONFIG
): ScaffoldingSlot[] {
    // Filter by probability threshold
    const filtered = slots.filter(
        (s) => s.metadata.probability >= config.predictionThreshold * 0.8
    );

    // Deduplicate by intervention type
    const byType = new Map<InterventionType, ScaffoldingSlot>();
    for (const slot of filtered) {
        const existing = byType.get(slot.interventionType);
        if (!existing || slot.priority > existing.priority) {
            byType.set(slot.interventionType, slot);
        }
    }

    // Sort by priority and limit
    return Array.from(byType.values())
        .sort((a, b) => b.priority - a.priority)
        .slice(0, maxSlots);
}

/**
 * Inject scaffolding slots into existing content slots
 */
export function injectScaffoldingIntoContent(
    contentSlots: ContentSlot[],
    scaffoldingSlots: ScaffoldingSlot[],
    currentSectionId: string
): ContentSlot[] {
    if (scaffoldingSlots.length === 0) return contentSlots;

    const result: ContentSlot[] = [];
    const beforeCurrent: ContentSlot[] = [];
    const afterCurrent: ContentSlot[] = [];
    const beforeSection: ContentSlot[] = [];
    const afterSection: ContentSlot[] = [];

    // Categorize scaffolding by position
    for (const scaffold of scaffoldingSlots) {
        const position = determineInjectionPosition(scaffold, currentSectionId);
        const contentSlot = scaffoldingSlotToContentSlot(scaffold);

        switch (position) {
            case "before_current":
                beforeCurrent.push(contentSlot);
                break;
            case "after_current":
                afterCurrent.push(contentSlot);
                break;
            case "before_section":
                beforeSection.push(contentSlot);
                break;
            case "after_section":
                afterSection.push(contentSlot);
                break;
            // "floating" slots are handled separately in UI
        }
    }

    // Build final content array
    // Before section scaffolding
    result.push(...beforeSection);

    // Original content with injected scaffolding
    for (let i = 0; i < contentSlots.length; i++) {
        // Inject before current (first slot)
        if (i === 0) {
            result.push(...beforeCurrent);
        }

        result.push(contentSlots[i]);

        // Inject after current (last slot)
        if (i === contentSlots.length - 1) {
            result.push(...afterCurrent);
        }
    }

    // After section scaffolding
    result.push(...afterSection);

    return result;
}

/**
 * Get floating scaffolding slots (for modal/panel display)
 */
export function getFloatingScaffolding(
    scaffoldingSlots: ScaffoldingSlot[],
    currentSectionId: string
): ScaffoldingSlot[] {
    return scaffoldingSlots.filter((scaffold) => {
        const position = determineInjectionPosition(scaffold, currentSectionId);
        return position === "floating";
    });
}

// ============================================================================
// Scaffolding State Management
// ============================================================================

/**
 * Track which scaffolding has been shown/dismissed
 */
export interface ScaffoldingState {
    shown: Set<string>; // IDs of shown scaffolding
    dismissed: Set<string>; // IDs of dismissed scaffolding
    engaged: Set<string>; // IDs of engaged scaffolding
    lastShown: number; // timestamp of last shown scaffolding
    sessionScaffoldingCount: number; // count for this session
}

/**
 * Create initial scaffolding state
 */
export function createScaffoldingState(): ScaffoldingState {
    return {
        shown: new Set(),
        dismissed: new Set(),
        engaged: new Set(),
        lastShown: 0,
        sessionScaffoldingCount: 0,
    };
}

/**
 * Check if scaffolding should be shown based on state and config
 */
export function shouldShowScaffolding(
    scaffold: ScaffoldingSlot,
    state: ScaffoldingState,
    config: PredictiveConfig = DEFAULT_PREDICTIVE_CONFIG
): boolean {
    const now = Date.now();

    // Already dismissed or engaged
    if (state.dismissed.has(scaffold.id) || state.engaged.has(scaffold.id)) {
        return false;
    }

    // Already shown (only show once per session)
    if (state.shown.has(scaffold.id)) {
        return false;
    }

    // Cooldown between scaffolding
    if (now - state.lastShown < config.interventionCooldownMs / 2) {
        return false;
    }

    // Max scaffolding per section
    const sectionCount = Array.from(state.shown).filter(
        (id) => id.includes(scaffold.targetSection || "")
    ).length;
    if (sectionCount >= config.maxInterventionsPerSection) {
        return false;
    }

    return true;
}

/**
 * Mark scaffolding as shown
 */
export function markScaffoldingShown(
    state: ScaffoldingState,
    scaffoldId: string
): ScaffoldingState {
    const newShown = new Set(state.shown);
    newShown.add(scaffoldId);

    return {
        ...state,
        shown: newShown,
        lastShown: Date.now(),
        sessionScaffoldingCount: state.sessionScaffoldingCount + 1,
    };
}

/**
 * Mark scaffolding as dismissed
 */
export function markScaffoldingDismissed(
    state: ScaffoldingState,
    scaffoldId: string
): ScaffoldingState {
    const newDismissed = new Set(state.dismissed);
    newDismissed.add(scaffoldId);

    return {
        ...state,
        dismissed: newDismissed,
    };
}

/**
 * Mark scaffolding as engaged (user interacted with it)
 */
export function markScaffoldingEngaged(
    state: ScaffoldingState,
    scaffoldId: string
): ScaffoldingState {
    const newEngaged = new Set(state.engaged);
    newEngaged.add(scaffoldId);

    return {
        ...state,
        engaged: newEngaged,
    };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Estimate learning time saved by proactive scaffolding
 */
export function estimateTimeSaved(
    scaffold: ScaffoldingSlot,
    avgRecoveryTimeMs: number = 180000 // 3 minutes average struggle recovery
): number {
    const { probability, expectedImpact, stepsAhead } = scaffold.metadata;

    // Time saved = probability of struggle * recovery time * impact * steps ahead factor
    const stepsAheadFactor = Math.min(2, 1 + stepsAhead * 0.2);
    return avgRecoveryTimeMs * probability * expectedImpact * stepsAheadFactor;
}

/**
 * Calculate overall scaffolding effectiveness
 */
export function calculateScaffoldingEffectiveness(
    activeInterventions: ActiveIntervention[]
): {
    successRate: number;
    avgEngagementTime: number;
    helpfulCount: number;
    totalShown: number;
} {
    const completed = activeInterventions.filter((ai) => ai.outcome);
    const helpful = completed.filter((ai) => ai.outcome === "helped");
    const engaged = completed.filter((ai) => ai.engagedAt && ai.viewedAt);

    const avgEngagementTime =
        engaged.length > 0
            ? engaged.reduce((sum, ai) => sum + (ai.engagedAt! - ai.viewedAt!), 0) / engaged.length
            : 0;

    return {
        successRate: completed.length > 0 ? helpful.length / completed.length : 0,
        avgEngagementTime,
        helpfulCount: helpful.length,
        totalShown: activeInterventions.length,
    };
}

// ============================================================================
// Exports
// ============================================================================

export {
    INTERVENTION_PRIORITY,
    INTERVENTION_DISPLAY,
};
