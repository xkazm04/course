"use client";

/**
 * Slot Provider React Context
 *
 * Provides React integration for the slot provider system.
 * Components can subscribe to injected slots and interact with them.
 */

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useMemo,
    type ReactNode,
} from "react";
import type { ChapterState } from "../useChapterState";
import type { ContentSlot, LayoutRegion } from "../contentSlots";
import type {
    InjectedSlot,
    SlotProviderId,
    SlotProviderContext as ProviderContext,
    ISlotProvider,
    SlotProviderRegistryEvent,
} from "./types";
import {
    SlotProviderRegistry,
    getSlotProviderRegistry,
} from "./SlotProviderRegistry";

// ============================================================================
// Context Types
// ============================================================================

interface SlotProviderContextValue {
    /** The registry instance */
    registry: SlotProviderRegistry;
    /** All currently injected slots */
    injectedSlots: InjectedSlot[];
    /** Whether slots are currently being generated */
    isGenerating: boolean;
    /** Last error from slot generation */
    lastError: Error | null;
    /** Get injected slots for a specific region */
    getInjectedSlotsForRegion: (region: LayoutRegion) => InjectedSlot[];
    /** Get injected slots positioned relative to a specific slot */
    getInjectedSlotsForAnchor: (
        anchorSlotId: string,
        position: "before" | "after"
    ) => InjectedSlot[];
    /** Dismiss a slot */
    dismissSlot: (slotId: string) => void;
    /** Register a provider */
    registerProvider: (provider: ISlotProvider) => boolean;
    /** Unregister a provider */
    unregisterProvider: (providerId: SlotProviderId) => boolean;
    /** Trigger slot regeneration */
    regenerateSlots: () => Promise<void>;
    /** Notify of slot interaction */
    notifyInteraction: (slotId: string, type: string, data?: unknown) => void;
}

const SlotProviderReactContext = createContext<SlotProviderContextValue | null>(
    null
);

// ============================================================================
// Provider Props
// ============================================================================

export interface SlotProviderProviderProps {
    /** React children */
    children: ReactNode;
    /** Chapter state for context */
    chapterState: ChapterState;
    /** Current chapter ID */
    chapterId: string;
    /** Current section ID if applicable */
    sectionId?: string;
    /** User ID if authenticated */
    userId?: string;
    /** Existing slots in the layout */
    existingSlots?: ContentSlot[];
    /** Custom context data */
    customData?: Record<string, unknown>;
    /** Initial providers to register */
    initialProviders?: ISlotProvider[];
    /** Custom registry instance (if not using global) */
    registry?: SlotProviderRegistry;
    /** Enable debug mode */
    debug?: boolean;
    /** Auto-generate slots on mount and context changes */
    autoGenerate?: boolean;
}

// ============================================================================
// Provider Component
// ============================================================================

export function SlotProviderProvider({
    children,
    chapterState,
    chapterId,
    sectionId,
    userId,
    existingSlots = [],
    customData,
    initialProviders = [],
    registry: customRegistry,
    debug = false,
    autoGenerate = true,
}: SlotProviderProviderProps) {
    // Use custom registry or global singleton
    const registry = useMemo(
        () => customRegistry ?? getSlotProviderRegistry({ debug }),
        [customRegistry, debug]
    );

    const [injectedSlots, setInjectedSlots] = useState<InjectedSlot[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [lastError, setLastError] = useState<Error | null>(null);

    // Build provider context
    const providerContext = useMemo<ProviderContext>(
        () => ({
            chapterState,
            chapterId,
            sectionId,
            userId,
            existingSlots,
            customData,
        }),
        [chapterState, chapterId, sectionId, userId, existingSlots, customData]
    );

    // Register initial providers on mount
    useEffect(() => {
        initialProviders.forEach((provider) => {
            registry.register(provider);
        });

        // Cleanup on unmount
        return () => {
            initialProviders.forEach((provider) => {
                registry.unregister(provider.config.id);
            });
        };
        // Only run on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Subscribe to registry events
    useEffect(() => {
        const unsubscribe = registry.subscribe(
            (event: SlotProviderRegistryEvent) => {
                if (event.type === "slots-updated") {
                    setInjectedSlots(event.slots);
                } else if (event.type === "error") {
                    setLastError(new Error(event.error.message));
                }
            }
        );

        return unsubscribe;
    }, [registry]);

    // Generate slots function
    const regenerateSlots = useCallback(async () => {
        setIsGenerating(true);
        setLastError(null);

        try {
            const slots = await registry.generateAllSlots(providerContext);
            setInjectedSlots(slots);
        } catch (error) {
            setLastError(
                error instanceof Error ? error : new Error(String(error))
            );
        } finally {
            setIsGenerating(false);
        }
    }, [registry, providerContext]);

    // Auto-generate on context changes
    useEffect(() => {
        if (autoGenerate) {
            regenerateSlots();
        }
    }, [autoGenerate, regenerateSlots]);

    // Get slots for a region
    const getInjectedSlotsForRegion = useCallback(
        (region: LayoutRegion): InjectedSlot[] => {
            return injectedSlots.filter(
                (slot) =>
                    slot.target.region === region && !slot.target.anchorSlotId
            );
        },
        [injectedSlots]
    );

    // Get slots for an anchor
    const getInjectedSlotsForAnchor = useCallback(
        (anchorSlotId: string, position: "before" | "after"): InjectedSlot[] => {
            return injectedSlots.filter(
                (slot) =>
                    slot.target.anchorSlotId === anchorSlotId &&
                    slot.target.position === position
            );
        },
        [injectedSlots]
    );

    // Dismiss a slot
    const dismissSlot = useCallback(
        (slotId: string) => {
            registry.dismissSlot(slotId, providerContext);
        },
        [registry, providerContext]
    );

    // Register provider
    const registerProvider = useCallback(
        (provider: ISlotProvider): boolean => {
            const result = registry.register(provider);
            if (result && autoGenerate) {
                regenerateSlots();
            }
            return result;
        },
        [registry, autoGenerate, regenerateSlots]
    );

    // Unregister provider
    const unregisterProvider = useCallback(
        (providerId: SlotProviderId): boolean => {
            return registry.unregister(providerId);
        },
        [registry]
    );

    // Notify interaction
    const notifyInteraction = useCallback(
        (slotId: string, type: string, data?: unknown) => {
            registry.notifySlotInteraction(slotId, type, data);
        },
        [registry]
    );

    // Context value
    const value = useMemo<SlotProviderContextValue>(
        () => ({
            registry,
            injectedSlots,
            isGenerating,
            lastError,
            getInjectedSlotsForRegion,
            getInjectedSlotsForAnchor,
            dismissSlot,
            registerProvider,
            unregisterProvider,
            regenerateSlots,
            notifyInteraction,
        }),
        [
            registry,
            injectedSlots,
            isGenerating,
            lastError,
            getInjectedSlotsForRegion,
            getInjectedSlotsForAnchor,
            dismissSlot,
            registerProvider,
            unregisterProvider,
            regenerateSlots,
            notifyInteraction,
        ]
    );

    return (
        <SlotProviderReactContext.Provider value={value}>
            {children}
        </SlotProviderReactContext.Provider>
    );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Access the slot provider context.
 * Must be used within a SlotProviderProvider.
 */
export function useSlotProvider(): SlotProviderContextValue {
    const context = useContext(SlotProviderReactContext);

    if (!context) {
        throw new Error(
            "useSlotProvider must be used within a SlotProviderProvider"
        );
    }

    return context;
}

/**
 * Get injected slots for a specific region.
 * Convenience hook for common use case.
 */
export function useInjectedSlots(region: LayoutRegion): InjectedSlot[] {
    const { getInjectedSlotsForRegion } = useSlotProvider();
    return getInjectedSlotsForRegion(region);
}

/**
 * Get injected slots positioned relative to an anchor slot.
 */
export function useAnchoredSlots(
    anchorSlotId: string,
    position: "before" | "after"
): InjectedSlot[] {
    const { getInjectedSlotsForAnchor } = useSlotProvider();
    return getInjectedSlotsForAnchor(anchorSlotId, position);
}

/**
 * Check if a specific provider is registered and enabled.
 */
export function useProviderStatus(
    providerId: SlotProviderId
): { registered: boolean; enabled: boolean } {
    const { registry } = useSlotProvider();
    const provider = registry.getProvider(providerId);

    return {
        registered: !!provider,
        enabled: registry.isProviderEnabled(providerId),
    };
}

/**
 * Hook for components rendered from injected slots.
 * Provides utilities for the slot to interact with the system.
 */
export function useInjectedSlotContext(slotId: string) {
    const { dismissSlot, notifyInteraction } = useSlotProvider();

    const dismiss = useCallback(() => {
        dismissSlot(slotId);
    }, [dismissSlot, slotId]);

    const trackInteraction = useCallback(
        (type: string, data?: unknown) => {
            notifyInteraction(slotId, type, data);
        },
        [notifyInteraction, slotId]
    );

    return {
        dismiss,
        trackInteraction,
    };
}
