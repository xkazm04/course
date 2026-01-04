/**
 * AI Hint Provider
 *
 * An example slot provider that injects contextual AI-generated hints
 * based on learner behavior and progress.
 */

import type {
    ISlotProvider,
    SlotProviderConfig,
    SlotProviderContext,
    SlotProviderResult,
} from "../types";
import { createSlotBuilder } from "../slotBuilders";

// ============================================================================
// Configuration
// ============================================================================

const PROVIDER_ID = "com.openforge.ai-hints";

const config: SlotProviderConfig = {
    id: PROVIDER_ID,
    name: "AI Contextual Hints",
    description: "Injects AI-generated hints based on learner behavior and progress",
    version: "1.0.0",
    supportedSlotTypes: ["text", "keyPoints"],
    supportedRegions: ["main", "sidebar"],
    enabledByDefault: true,
};

// ============================================================================
// Hint Generation Logic
// ============================================================================

interface HintTrigger {
    condition: (context: SlotProviderContext) => boolean;
    generate: (context: SlotProviderContext, builder: ReturnType<typeof createSlotBuilder>) => ReturnType<ReturnType<typeof createSlotBuilder>["createHint"]>;
}

const hintTriggers: HintTrigger[] = [
    // Hint when user is on first section
    {
        condition: (ctx) => ctx.chapterState.currentSection === 0,
        generate: (ctx, builder) =>
            builder.createHint(
                "welcome-hint",
                "Welcome to this chapter! Take your time reading through each section. You can navigate using the arrow keys or the progress sidebar.",
                {
                    title: "🎯 Getting Started",
                    region: "sidebar",
                    priority: "normal",
                    confidence: 0.9,
                    reason: "First-time section visit",
                    expiresInMs: 5 * 60 * 1000, // 5 minutes
                }
            ),
    },

    // Hint when user has completed many sections quickly
    {
        condition: (ctx) => {
            const sections = ctx.chapterState.sections || [];
            const completed = sections.filter((s) => s.completed).length;
            const total = sections.length;
            return completed > 0 && completed === total - 1;
        },
        generate: (ctx, builder) =>
            builder.createHint(
                "almost-done",
                "You're almost done with this chapter! Complete the final section to unlock the next chapter and earn XP.",
                {
                    title: "🏆 Almost There!",
                    region: "main",
                    priority: "high",
                    confidence: 0.95,
                    reason: "Near chapter completion",
                }
            ),
    },

    // Hint for sections with code content
    {
        condition: (ctx) => {
            const currentSection = ctx.chapterState.sections?.[ctx.chapterState.currentSection];
            // Check if section has code content
            return !!currentSection?.content?.code;
        },
        generate: (ctx, builder) =>
            builder.createHint(
                "code-practice",
                "Try modifying this code example and running it yourself. Hands-on practice helps concepts stick better!",
                {
                    title: "💻 Pro Tip",
                    region: "main",
                    anchorSlotId: "code-example",
                    position: "after",
                    priority: "normal",
                    confidence: 0.85,
                    reason: "Code section detected",
                }
            ),
    },
];

// ============================================================================
// Provider Implementation
// ============================================================================

/**
 * Creates an AI Hint Provider instance.
 *
 * @example
 * ```typescript
 * const provider = createAIHintProvider();
 * registry.register(provider);
 * ```
 */
export function createAIHintProvider(): ISlotProvider {
    const builder = createSlotBuilder({
        providerId: PROVIDER_ID,
        providerVersion: config.version,
    });

    return {
        config,

        shouldActivate(context: SlotProviderContext): boolean {
            // Always active if there's chapter state
            return !!context.chapterState;
        },

        generateSlots(context: SlotProviderContext): SlotProviderResult {
            const slots: ReturnType<typeof builder.createHint>[] = [];

            // Check each trigger
            for (const trigger of hintTriggers) {
                try {
                    if (trigger.condition(context)) {
                        const hint = trigger.generate(context, builder);
                        slots.push(hint);
                    }
                } catch (error) {
                    console.warn(`[${PROVIDER_ID}] Hint trigger error:`, error);
                }
            }

            return { slots };
        },

        onSlotDismissed(slotId: string, context: SlotProviderContext): void {
            // Track that user dismissed this hint type
            // Could store in localStorage to prevent showing again
            console.log(`[${PROVIDER_ID}] Hint dismissed:`, slotId);
        },

        onSlotInteraction(slotId: string, type: string, data?: unknown): void {
            // Track engagement with hints
            console.log(`[${PROVIDER_ID}] Hint interaction:`, slotId, type, data);
        },
    };
}

// Export singleton for convenience
export const aiHintProvider = createAIHintProvider();
