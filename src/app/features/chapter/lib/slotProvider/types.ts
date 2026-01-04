/**
 * Slot Provider Protocol Types
 *
 * Defines the protocol for third-party slot providers to inject content
 * into the chapter layout system. This enables:
 * - AI tutors injecting contextual hints
 * - Community members contributing practice problems
 * - Integration partners adding interactive elements
 *
 * All providers work through the same slot rendering pipeline without
 * modifying core chapter rendering logic.
 */

import type { ContentSlot, LayoutRegion, SlotType } from "../contentSlots";
import type { ChapterState } from "../useChapterState";

// ============================================================================
// Slot Provider Protocol
// ============================================================================

/**
 * Unique identifier for a slot provider.
 * Use reverse-domain notation for namespacing (e.g., "com.openforge.ai-tutor")
 */
export type SlotProviderId = string;

/**
 * Priority levels for slot injection.
 * Higher priority slots appear first within their target position.
 */
export type SlotPriority = "low" | "normal" | "high" | "critical";

/**
 * Where the injected slot should be positioned relative to existing slots
 */
export interface SlotInjectionTarget {
    /** Target region for the slot */
    region: LayoutRegion;
    /** Position relative to existing slots */
    position: "before" | "after" | "replace";
    /** If position is "before" or "after", specify the anchor slot ID */
    anchorSlotId?: string;
    /** Order within injected slots at the same position */
    order?: number;
}

/**
 * Metadata about an injected slot for debugging and analytics
 */
export interface InjectedSlotMetadata {
    /** Provider that injected this slot */
    providerId: SlotProviderId;
    /** Timestamp when the slot was generated */
    generatedAt: number;
    /** Confidence score for AI-generated content (0-1) */
    confidence?: number;
    /** Human-readable reason for injection */
    reason?: string;
    /** Version of the provider that generated this slot */
    providerVersion?: string;
    /** Tags for categorization and filtering */
    tags?: string[];
}

/**
 * A slot that has been injected by a provider
 */
export interface InjectedSlot {
    /** The content slot to render */
    slot: ContentSlot;
    /** Where to inject the slot */
    target: SlotInjectionTarget;
    /** Priority for ordering */
    priority: SlotPriority;
    /** Provider metadata */
    metadata: InjectedSlotMetadata;
    /** Optional expiry time (Unix timestamp) after which the slot is removed */
    expiresAt?: number;
    /** Whether user has dismissed this slot */
    dismissed?: boolean;
}

/**
 * Context available to slot providers for generating slots
 */
export interface SlotProviderContext {
    /** Current chapter state */
    chapterState: ChapterState;
    /** Current chapter ID */
    chapterId: string;
    /** Current section ID if applicable */
    sectionId?: string;
    /** User ID if authenticated */
    userId?: string;
    /** Existing slots in the layout */
    existingSlots: ContentSlot[];
    /** Custom context data from the application */
    customData?: Record<string, unknown>;
}

/**
 * Result of a slot provider's slot generation
 */
export interface SlotProviderResult {
    /** Slots to inject */
    slots: InjectedSlot[];
    /** Errors encountered during generation */
    errors?: SlotProviderError[];
    /** Warnings for the developer */
    warnings?: string[];
}

/**
 * Error from a slot provider
 */
export interface SlotProviderError {
    /** Error code for programmatic handling */
    code: string;
    /** Human-readable error message */
    message: string;
    /** Whether the error is recoverable */
    recoverable: boolean;
}

/**
 * Configuration for a slot provider
 */
export interface SlotProviderConfig {
    /** Unique provider ID */
    id: SlotProviderId;
    /** Human-readable name */
    name: string;
    /** Description of what this provider does */
    description: string;
    /** Version string */
    version: string;
    /** Slot types this provider can generate */
    supportedSlotTypes: SlotType[];
    /** Regions this provider can inject into */
    supportedRegions: LayoutRegion[];
    /** Whether this provider requires authentication */
    requiresAuth?: boolean;
    /** Provider-specific settings schema (JSON Schema format) */
    settingsSchema?: Record<string, unknown>;
    /** Whether this provider is enabled by default */
    enabledByDefault?: boolean;
}

/**
 * The main interface that slot providers must implement.
 *
 * Providers can be:
 * - Synchronous: Return slots immediately from cached/local data
 * - Asynchronous: Fetch slots from an API or generate with AI
 *
 * @example
 * ```typescript
 * const aiHintProvider: ISlotProvider = {
 *   config: {
 *     id: "com.openforge.ai-hints",
 *     name: "AI Contextual Hints",
 *     description: "Injects AI-generated hints based on learner behavior",
 *     version: "1.0.0",
 *     supportedSlotTypes: ["text", "keyPoints"],
 *     supportedRegions: ["main", "sidebar"],
 *   },
 *
 *   async generateSlots(context) {
 *     const hints = await fetchAIHints(context);
 *     return { slots: hints.map(h => createHintSlot(h)) };
 *   },
 *
 *   shouldActivate(context) {
 *     return context.chapterState.currentSectionIndex > 0;
 *   },
 * };
 * ```
 */
export interface ISlotProvider {
    /** Provider configuration */
    config: SlotProviderConfig;

    /**
     * Generate slots based on the current context.
     * This is the main entry point for slot generation.
     */
    generateSlots(context: SlotProviderContext): Promise<SlotProviderResult> | SlotProviderResult;

    /**
     * Optional: Check if this provider should be active in the current context.
     * If this returns false, generateSlots won't be called.
     * @default Returns true
     */
    shouldActivate?(context: SlotProviderContext): boolean;

    /**
     * Optional: Clean up resources when provider is unregistered.
     */
    dispose?(): void;

    /**
     * Optional: Handle slot dismissal by user.
     * Called when user dismisses a slot generated by this provider.
     */
    onSlotDismissed?(slotId: string, context: SlotProviderContext): void;

    /**
     * Optional: Handle slot interaction by user.
     * Called when user interacts with a slot generated by this provider.
     */
    onSlotInteraction?(slotId: string, interactionType: string, data?: unknown): void;
}

// ============================================================================
// Registry Types
// ============================================================================

/**
 * Events emitted by the slot provider registry
 */
export type SlotProviderRegistryEvent =
    | { type: "provider-registered"; provider: ISlotProvider }
    | { type: "provider-unregistered"; providerId: SlotProviderId }
    | { type: "provider-enabled"; providerId: SlotProviderId }
    | { type: "provider-disabled"; providerId: SlotProviderId }
    | { type: "slots-updated"; slots: InjectedSlot[] }
    | { type: "error"; error: SlotProviderError; providerId?: SlotProviderId };

/**
 * Listener for registry events
 */
export type SlotProviderRegistryListener = (event: SlotProviderRegistryEvent) => void;

/**
 * Options for the slot provider registry
 */
export interface SlotProviderRegistryOptions {
    /** Maximum number of slots from all providers combined */
    maxTotalSlots?: number;
    /** Maximum slots per provider */
    maxSlotsPerProvider?: number;
    /** Timeout for async slot generation in ms */
    generationTimeout?: number;
    /** Whether to run providers in parallel */
    parallel?: boolean;
    /** Enable debug logging */
    debug?: boolean;
}

/**
 * The slot provider registry interface.
 * This is the central coordination point for all slot providers.
 */
export interface ISlotProviderRegistry {
    /**
     * Register a new slot provider.
     * Returns false if provider ID is already registered.
     */
    register(provider: ISlotProvider): boolean;

    /**
     * Unregister a provider by ID.
     * Returns false if provider was not registered.
     */
    unregister(providerId: SlotProviderId): boolean;

    /**
     * Get a provider by ID.
     */
    getProvider(providerId: SlotProviderId): ISlotProvider | undefined;

    /**
     * Get all registered providers.
     */
    getAllProviders(): ISlotProvider[];

    /**
     * Enable a provider.
     */
    enableProvider(providerId: SlotProviderId): void;

    /**
     * Disable a provider.
     */
    disableProvider(providerId: SlotProviderId): void;

    /**
     * Check if a provider is enabled.
     */
    isProviderEnabled(providerId: SlotProviderId): boolean;

    /**
     * Generate all slots from all active providers.
     */
    generateAllSlots(context: SlotProviderContext): Promise<InjectedSlot[]>;

    /**
     * Dismiss a slot by ID.
     */
    dismissSlot(slotId: string, context: SlotProviderContext): void;

    /**
     * Subscribe to registry events.
     */
    subscribe(listener: SlotProviderRegistryListener): () => void;

    /**
     * Clear all providers and reset state.
     */
    clear(): void;
}

// ============================================================================
// Priority Helpers
// ============================================================================

/**
 * Numeric priority values for sorting
 */
export const PRIORITY_VALUES: Record<SlotPriority, number> = {
    low: 1,
    normal: 2,
    high: 3,
    critical: 4,
};

/**
 * Compare two priorities for sorting (higher first)
 */
export function comparePriorities(a: SlotPriority, b: SlotPriority): number {
    return PRIORITY_VALUES[b] - PRIORITY_VALUES[a];
}
