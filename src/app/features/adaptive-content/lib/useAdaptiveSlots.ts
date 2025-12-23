"use client";

import { useMemo, useCallback } from "react";
import { useAdaptiveContentOptional } from "./AdaptiveContentContext";
import {
    generateAdaptiveSlots,
    adaptiveSlotsToContentSlots,
    getPaceRecommendation,
    getAdjustedQuizParams,
} from "./contentAdaptationEngine";
import type { AdaptationContext } from "./contentAdaptationEngine";
import type { LayoutTemplate, SlotPlacement, ContentSlot } from "../../chapter/lib/contentSlots";
import type { ComprehensionLevel, AdaptationConfig } from "./types";
import { DEFAULT_ADAPTATION_CONFIGS } from "./types";

// ============================================================================
// Hook for Adaptive Layout Enhancement
// ============================================================================

interface UseAdaptiveSlotsOptions {
    sectionId: string;
    topic: string;
    insertPosition?: "before" | "after" | "interleaved";
}

interface UseAdaptiveSlotsReturn {
    enhanceTemplate: (template: LayoutTemplate) => LayoutTemplate;
    getAdaptiveSlots: (region: string) => ContentSlot[];
    paceRecommendation: { message: string; icon: string };
    quizParams: { timeMultiplier: number; hintEnabled: boolean; showExplanations: boolean };
    isAdaptive: boolean;
    comprehensionLevel: ComprehensionLevel;
}

/**
 * Hook for enhancing layouts with adaptive content slots
 */
export function useAdaptiveSlots(options: UseAdaptiveSlotsOptions): UseAdaptiveSlotsReturn {
    const { sectionId, topic, insertPosition = "after" } = options;
    const adaptiveContext = useAdaptiveContentOptional();

    const comprehensionLevel = adaptiveContext?.comprehensionLevel ?? "intermediate";
    const config = adaptiveContext?.getSectionConfig(sectionId) ?? DEFAULT_ADAPTATION_CONFIGS.intermediate;

    // Generate adaptive slots based on current comprehension
    const adaptiveSlots = useMemo(() => {
        // Create empty slots array for the context - actual content comes from the template
        const context: AdaptationContext = {
            sectionId,
            topic,
            currentSlots: [], // Will be populated when enhancing template
            comprehensionLevel,
            config,
        };

        return generateAdaptiveSlots(context);
    }, [sectionId, topic, comprehensionLevel, config]);

    // Convert adaptive slots to content slots
    const adaptiveContentSlots = useMemo(() => {
        return adaptiveSlotsToContentSlots(adaptiveSlots, sectionId);
    }, [adaptiveSlots, sectionId]);

    // Get slots for a specific region
    const getAdaptiveSlots = useCallback(
        (region: string): ContentSlot[] => {
            // For now, add adaptive content to main region only
            if (region === "main") {
                return adaptiveContentSlots;
            }
            return [];
        },
        [adaptiveContentSlots]
    );

    // Enhance a template with adaptive slots
    const enhanceTemplate = useCallback(
        (template: LayoutTemplate): LayoutTemplate => {
            if (!adaptiveContext || adaptiveContentSlots.length === 0) {
                return template;
            }

            // Generate adaptive slots with actual content from template
            const mainSlots = template.slots.filter((p) => p.region === "main");
            const existingContent = mainSlots.map((p) => p.slot);

            const fullContext: AdaptationContext = {
                sectionId,
                topic,
                currentSlots: existingContent,
                comprehensionLevel,
                config,
            };

            const generatedSlots = generateAdaptiveSlots(fullContext);
            const generatedContentSlots = adaptiveSlotsToContentSlots(generatedSlots, sectionId);

            if (generatedContentSlots.length === 0) {
                return template;
            }

            // Create new placements for adaptive slots
            const adaptivePlacements: SlotPlacement[] = generatedContentSlots.map((slot, idx) => ({
                slot,
                region: "main" as const,
                order: 100 + idx, // Place after existing content
            }));

            // Insert based on position preference
            let newSlots: SlotPlacement[];
            switch (insertPosition) {
                case "before":
                    // Place adaptive content before main content
                    adaptivePlacements.forEach((p, idx) => {
                        p.order = 0.5 + idx * 0.1;
                    });
                    newSlots = [...adaptivePlacements, ...template.slots];
                    break;

                case "interleaved":
                    // Interleave adaptive content with existing
                    newSlots = [...template.slots];
                    adaptivePlacements.forEach((p, idx) => {
                        // Insert after key content slots
                        const insertAfter = Math.min(3 + idx * 2, template.slots.length);
                        p.order = insertAfter + 0.5;
                        newSlots.push(p);
                    });
                    break;

                case "after":
                default:
                    // Place adaptive content after main content
                    newSlots = [...template.slots, ...adaptivePlacements];
                    break;
            }

            return {
                ...template,
                id: `${template.id}-adaptive`,
                slots: newSlots,
            };
        },
        [adaptiveContext, adaptiveContentSlots, sectionId, topic, comprehensionLevel, config, insertPosition]
    );

    const paceRecommendation = useMemo(() => getPaceRecommendation(config), [config]);
    const quizParams = useMemo(() => getAdjustedQuizParams(config), [config]);

    return {
        enhanceTemplate,
        getAdaptiveSlots,
        paceRecommendation,
        quizParams,
        isAdaptive: !!adaptiveContext,
        comprehensionLevel,
    };
}

// ============================================================================
// Hook for Adaptive Content Visibility
// ============================================================================

interface UseAdaptiveVisibilityOptions {
    slotType: "explanation" | "example" | "challenge" | "hint" | "deepDive";
}

interface UseAdaptiveVisibilityReturn {
    shouldShow: boolean;
    level: ComprehensionLevel;
}

/**
 * Hook to determine if adaptive content should be visible
 */
export function useAdaptiveVisibility(options: UseAdaptiveVisibilityOptions): UseAdaptiveVisibilityReturn {
    const { slotType } = options;
    const adaptiveContext = useAdaptiveContentOptional();

    const level = adaptiveContext?.comprehensionLevel ?? "intermediate";
    const config = adaptiveContext?.adaptationConfig ?? DEFAULT_ADAPTATION_CONFIGS.intermediate;

    const shouldShow = useMemo(() => {
        switch (slotType) {
            case "explanation":
                return config.showAdditionalExplanations;
            case "example":
                return config.showSimplifiedExamples;
            case "challenge":
                return config.showAdvancedChallenges;
            case "hint":
                return config.showHints;
            case "deepDive":
                return config.showDeepDives;
            default:
                return false;
        }
    }, [slotType, config]);

    return { shouldShow, level };
}

// ============================================================================
// Hook for Section-Aware Adaptation
// ============================================================================

interface UseSectionAdaptationOptions {
    sectionId: string;
}

interface UseSectionAdaptationReturn {
    level: ComprehensionLevel;
    config: AdaptationConfig;
    confidence: number;
    recordProgress: (percentage: number) => void;
}

/**
 * Hook for section-specific adaptation settings
 */
export function useSectionAdaptation(options: UseSectionAdaptationOptions): UseSectionAdaptationReturn {
    const { sectionId } = options;
    const adaptiveContext = useAdaptiveContentOptional();

    const level = adaptiveContext?.getSectionLevel(sectionId) ?? "intermediate";
    const config = adaptiveContext?.getSectionConfig(sectionId) ?? DEFAULT_ADAPTATION_CONFIGS.intermediate;

    const sectionScore = adaptiveContext?.model.sectionScores[sectionId];
    const confidence = sectionScore?.score.confidence ?? 0;

    const recordProgress = useCallback(
        (percentage: number) => {
            adaptiveContext?.recordSectionTime({
                sectionId,
                timeSpentMs: 0, // Will be calculated by the context
                completionPercentage: percentage,
                revisitCount: 0,
            });
        },
        [adaptiveContext, sectionId]
    );

    return {
        level,
        config,
        confidence,
        recordProgress,
    };
}
