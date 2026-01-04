/**
 * Slot Builders for Providers
 *
 * Factory functions for creating injected slots with proper metadata.
 * Providers use these to generate slots with consistent structure.
 */

import type {
    ContentSlot,
    TextSlot,
    KeyPointsSlot,
    CodeSlot,
    VideoSlot,
    QuizSlot,
    LayoutRegion,
} from "../contentSlots";
import type {
    InjectedSlot,
    SlotProviderId,
    SlotPriority,
    SlotInjectionTarget,
    InjectedSlotMetadata,
} from "./types";

// ============================================================================
// Injected Slot Builder
// ============================================================================

export interface InjectedSlotBuilderConfig {
    /** The provider creating this slot */
    providerId: SlotProviderId;
    /** Provider version */
    providerVersion?: string;
}

export class InjectedSlotBuilder {
    private config: InjectedSlotBuilderConfig;

    constructor(config: InjectedSlotBuilderConfig) {
        this.config = config;
    }

    /**
     * Create metadata for an injected slot
     */
    private createMetadata(
        options: Partial<InjectedSlotMetadata> = {}
    ): InjectedSlotMetadata {
        return {
            providerId: this.config.providerId,
            generatedAt: Date.now(),
            providerVersion: this.config.providerVersion,
            ...options,
        };
    }

    /**
     * Create an injected slot from a content slot
     */
    create(
        slot: ContentSlot,
        target: SlotInjectionTarget,
        options: {
            priority?: SlotPriority;
            metadata?: Partial<InjectedSlotMetadata>;
            expiresAt?: number;
        } = {}
    ): InjectedSlot {
        return {
            slot,
            target,
            priority: options.priority ?? "normal",
            metadata: this.createMetadata(options.metadata),
            expiresAt: options.expiresAt,
        };
    }

    // ========================================================================
    // Text Slot Builders
    // ========================================================================

    /**
     * Create an AI hint slot
     */
    createHint(
        id: string,
        content: string,
        options: {
            title?: string;
            region?: LayoutRegion;
            anchorSlotId?: string;
            position?: "before" | "after";
            priority?: SlotPriority;
            confidence?: number;
            reason?: string;
            expiresInMs?: number;
        } = {}
    ): InjectedSlot {
        const slot: TextSlot = {
            id: `hint-${id}`,
            type: "text",
            data: {
                title: options.title ?? "💡 Hint",
                content,
                variant: "highlight",
            },
        };

        return this.create(
            slot,
            {
                region: options.region ?? "main",
                position: options.position ?? "after",
                anchorSlotId: options.anchorSlotId,
            },
            {
                priority: options.priority ?? "normal",
                metadata: {
                    confidence: options.confidence,
                    reason: options.reason,
                    tags: ["hint", "ai-generated"],
                },
                expiresAt: options.expiresInMs
                    ? Date.now() + options.expiresInMs
                    : undefined,
            }
        );
    }

    /**
     * Create an explanation slot
     */
    createExplanation(
        id: string,
        content: string,
        options: {
            title?: string;
            region?: LayoutRegion;
            anchorSlotId?: string;
            priority?: SlotPriority;
            confidence?: number;
        } = {}
    ): InjectedSlot {
        const slot: TextSlot = {
            id: `explanation-${id}`,
            type: "text",
            data: {
                title: options.title ?? "📖 Explanation",
                content,
                variant: "prose",
            },
        };

        return this.create(
            slot,
            {
                region: options.region ?? "main",
                position: "after",
                anchorSlotId: options.anchorSlotId,
            },
            {
                priority: options.priority ?? "normal",
                metadata: {
                    confidence: options.confidence,
                    tags: ["explanation", "ai-generated"],
                },
            }
        );
    }

    // ========================================================================
    // Key Points Slot Builders
    // ========================================================================

    /**
     * Create a key points slot
     */
    createKeyPoints(
        id: string,
        points: string[],
        options: {
            title?: string;
            icon?: "message" | "sparkles" | "check";
            region?: LayoutRegion;
            anchorSlotId?: string;
            priority?: SlotPriority;
        } = {}
    ): InjectedSlot {
        const slot: KeyPointsSlot = {
            id: `keypoints-${id}`,
            type: "keyPoints",
            data: {
                title: options.title ?? "Key Takeaways",
                points,
                icon: options.icon ?? "sparkles",
            },
        };

        return this.create(
            slot,
            {
                region: options.region ?? "sidebar",
                position: "after",
                anchorSlotId: options.anchorSlotId,
            },
            {
                priority: options.priority ?? "normal",
                metadata: {
                    tags: ["key-points"],
                },
            }
        );
    }

    /**
     * Create a "common mistakes" slot
     */
    createCommonMistakes(
        id: string,
        mistakes: string[],
        options: {
            region?: LayoutRegion;
            anchorSlotId?: string;
            priority?: SlotPriority;
        } = {}
    ): InjectedSlot {
        return this.createKeyPoints(`mistakes-${id}`, mistakes, {
            title: "⚠️ Common Mistakes",
            icon: "message",
            region: options.region ?? "sidebar",
            anchorSlotId: options.anchorSlotId,
            priority: options.priority ?? "high",
        });
    }

    // ========================================================================
    // Code Slot Builders
    // ========================================================================

    /**
     * Create a code example slot
     */
    createCodeExample(
        id: string,
        code: string,
        options: {
            filename?: string;
            language?: string;
            title?: string;
            region?: LayoutRegion;
            anchorSlotId?: string;
            priority?: SlotPriority;
            showDiff?: boolean;
            previousCode?: string;
        } = {}
    ): InjectedSlot {
        const slot: CodeSlot = {
            id: `code-${id}`,
            type: "code",
            data: {
                code,
                filename: options.filename,
                language: options.language ?? "typescript",
                showLineNumbers: true,
                showCopy: true,
                showHeader: true,
                previousCode: options.previousCode,
                showDiffByDefault: options.showDiff,
            },
        };

        return this.create(
            slot,
            {
                region: options.region ?? "main",
                position: "after",
                anchorSlotId: options.anchorSlotId,
            },
            {
                priority: options.priority ?? "normal",
                metadata: {
                    tags: ["code-example"],
                },
            }
        );
    }

    /**
     * Create a practice problem code slot
     */
    createPractice(
        id: string,
        starterCode: string,
        options: {
            filename?: string;
            language?: string;
            description?: string;
            region?: LayoutRegion;
            anchorSlotId?: string;
            priority?: SlotPriority;
            difficulty?: "easy" | "medium" | "hard";
        } = {}
    ): InjectedSlot {
        const slot: CodeSlot = {
            id: `practice-${id}`,
            type: "code",
            data: {
                code: starterCode,
                filename: options.filename ?? "practice.tsx",
                language: options.language ?? "typescript",
                showLineNumbers: true,
                showCopy: true,
                showHeader: true,
            },
        };

        return this.create(
            slot,
            {
                region: options.region ?? "main",
                position: "after",
                anchorSlotId: options.anchorSlotId,
            },
            {
                priority: options.priority ?? "normal",
                metadata: {
                    tags: [
                        "practice",
                        "community-contributed",
                        options.difficulty ?? "medium",
                    ],
                    reason: options.description,
                },
            }
        );
    }

    // ========================================================================
    // Quiz Slot Builders
    // ========================================================================

    /**
     * Create a quiz slot
     */
    createQuiz(
        id: string,
        sectionId: string,
        options: {
            inline?: boolean;
            showButton?: boolean;
            region?: LayoutRegion;
            anchorSlotId?: string;
            priority?: SlotPriority;
        } = {}
    ): InjectedSlot {
        const slot: QuizSlot = {
            id: `quiz-${id}`,
            type: "quiz",
            data: {
                sectionId,
                inline: options.inline ?? true,
                showButton: options.showButton ?? false,
            },
        };

        return this.create(
            slot,
            {
                region: options.region ?? "main",
                position: "after",
                anchorSlotId: options.anchorSlotId,
            },
            {
                priority: options.priority ?? "normal",
                metadata: {
                    tags: ["quiz", "assessment"],
                },
            }
        );
    }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create an injected slot builder for a provider
 */
export function createSlotBuilder(
    config: InjectedSlotBuilderConfig
): InjectedSlotBuilder {
    return new InjectedSlotBuilder(config);
}
