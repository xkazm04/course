/**
 * Slot Provider Registry
 *
 * Central coordination point for all slot providers.
 * Manages registration, lifecycle, and slot generation across providers.
 */

import type {
    ISlotProvider,
    ISlotProviderRegistry,
    InjectedSlot,
    SlotProviderId,
    SlotProviderContext,
    SlotProviderRegistryEvent,
    SlotProviderRegistryListener,
    SlotProviderRegistryOptions,
    SlotProviderError,
} from "./types";
import { comparePriorities } from "./types";

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_OPTIONS: Required<SlotProviderRegistryOptions> = {
    maxTotalSlots: 50,
    maxSlotsPerProvider: 10,
    generationTimeout: 5000,
    parallel: true,
    debug: false,
};

// ============================================================================
// Slot Provider Registry Implementation
// ============================================================================

export class SlotProviderRegistry implements ISlotProviderRegistry {
    private providers: Map<SlotProviderId, ISlotProvider> = new Map();
    private enabledProviders: Set<SlotProviderId> = new Set();
    private listeners: Set<SlotProviderRegistryListener> = new Set();
    private options: Required<SlotProviderRegistryOptions>;
    private cachedSlots: InjectedSlot[] = [];

    constructor(options: SlotProviderRegistryOptions = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    // ========================================================================
    // Provider Registration
    // ========================================================================

    register(provider: ISlotProvider): boolean {
        const { id } = provider.config;

        if (this.providers.has(id)) {
            this.log(`Provider ${id} is already registered`);
            return false;
        }

        this.providers.set(id, provider);

        // Enable by default if specified
        if (provider.config.enabledByDefault !== false) {
            this.enabledProviders.add(id);
        }

        this.emit({ type: "provider-registered", provider });
        this.log(`Registered provider: ${id} (${provider.config.name})`);

        return true;
    }

    unregister(providerId: SlotProviderId): boolean {
        const provider = this.providers.get(providerId);

        if (!provider) {
            this.log(`Provider ${providerId} not found`);
            return false;
        }

        // Call dispose if available
        provider.dispose?.();

        this.providers.delete(providerId);
        this.enabledProviders.delete(providerId);

        // Remove cached slots from this provider
        this.cachedSlots = this.cachedSlots.filter(
            (slot) => slot.metadata.providerId !== providerId
        );

        this.emit({ type: "provider-unregistered", providerId });
        this.log(`Unregistered provider: ${providerId}`);

        return true;
    }

    getProvider(providerId: SlotProviderId): ISlotProvider | undefined {
        return this.providers.get(providerId);
    }

    getAllProviders(): ISlotProvider[] {
        return Array.from(this.providers.values());
    }

    // ========================================================================
    // Provider Enable/Disable
    // ========================================================================

    enableProvider(providerId: SlotProviderId): void {
        if (!this.providers.has(providerId)) {
            this.log(`Cannot enable unknown provider: ${providerId}`);
            return;
        }

        this.enabledProviders.add(providerId);
        this.emit({ type: "provider-enabled", providerId });
        this.log(`Enabled provider: ${providerId}`);
    }

    disableProvider(providerId: SlotProviderId): void {
        if (!this.providers.has(providerId)) {
            this.log(`Cannot disable unknown provider: ${providerId}`);
            return;
        }

        this.enabledProviders.delete(providerId);

        // Remove cached slots from this provider
        this.cachedSlots = this.cachedSlots.filter(
            (slot) => slot.metadata.providerId !== providerId
        );

        this.emit({ type: "provider-disabled", providerId });
        this.log(`Disabled provider: ${providerId}`);
    }

    isProviderEnabled(providerId: SlotProviderId): boolean {
        return this.enabledProviders.has(providerId);
    }

    // ========================================================================
    // Slot Generation
    // ========================================================================

    async generateAllSlots(context: SlotProviderContext): Promise<InjectedSlot[]> {
        const activeProviders = this.getActiveProviders(context);

        if (activeProviders.length === 0) {
            this.log("No active providers");
            return [];
        }

        this.log(`Generating slots from ${activeProviders.length} providers`);

        let allSlots: InjectedSlot[] = [];

        if (this.options.parallel) {
            allSlots = await this.generateInParallel(activeProviders, context);
        } else {
            allSlots = await this.generateSequentially(activeProviders, context);
        }

        // Filter expired and dismissed slots
        const now = Date.now();
        allSlots = allSlots.filter((slot) => {
            if (slot.dismissed) return false;
            if (slot.expiresAt && slot.expiresAt < now) return false;
            return true;
        });

        // Sort by priority
        allSlots.sort((a, b) => comparePriorities(a.priority, b.priority));

        // Apply max total slots limit
        if (allSlots.length > this.options.maxTotalSlots) {
            allSlots = allSlots.slice(0, this.options.maxTotalSlots);
        }

        // Cache the result
        this.cachedSlots = allSlots;

        this.emit({ type: "slots-updated", slots: allSlots });
        this.log(`Generated ${allSlots.length} total slots`);

        return allSlots;
    }

    private getActiveProviders(context: SlotProviderContext): ISlotProvider[] {
        return Array.from(this.providers.entries())
            .filter(([id]) => this.enabledProviders.has(id))
            .map(([, provider]) => provider)
            .filter((provider) => {
                // Check if provider should activate
                if (provider.shouldActivate) {
                    return provider.shouldActivate(context);
                }
                return true;
            });
    }

    private async generateInParallel(
        providers: ISlotProvider[],
        context: SlotProviderContext
    ): Promise<InjectedSlot[]> {
        const results = await Promise.allSettled(
            providers.map((provider) =>
                this.generateWithTimeout(provider, context)
            )
        );

        const allSlots: InjectedSlot[] = [];

        results.forEach((result, index) => {
            const provider = providers[index];

            if (result.status === "fulfilled") {
                const providerSlots = this.limitProviderSlots(
                    result.value,
                    provider.config.id
                );
                allSlots.push(...providerSlots);
            } else {
                this.handleProviderError(provider.config.id, result.reason);
            }
        });

        return allSlots;
    }

    private async generateSequentially(
        providers: ISlotProvider[],
        context: SlotProviderContext
    ): Promise<InjectedSlot[]> {
        const allSlots: InjectedSlot[] = [];

        for (const provider of providers) {
            try {
                const slots = await this.generateWithTimeout(provider, context);
                const limitedSlots = this.limitProviderSlots(slots, provider.config.id);
                allSlots.push(...limitedSlots);
            } catch (error) {
                this.handleProviderError(provider.config.id, error);
            }
        }

        return allSlots;
    }

    private async generateWithTimeout(
        provider: ISlotProvider,
        context: SlotProviderContext
    ): Promise<InjectedSlot[]> {
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Provider ${provider.config.id} timed out`));
            }, this.options.generationTimeout);
        });

        const generatePromise = Promise.resolve(provider.generateSlots(context))
            .then((result) => {
                // Handle any errors from the result
                if (result.errors && result.errors.length > 0) {
                    result.errors.forEach((error) => {
                        this.log(`Provider error: ${error.message}`, "warn");
                    });
                }
                return result.slots;
            });

        return Promise.race([generatePromise, timeoutPromise]);
    }

    private limitProviderSlots(
        slots: InjectedSlot[],
        providerId: SlotProviderId
    ): InjectedSlot[] {
        if (slots.length > this.options.maxSlotsPerProvider) {
            this.log(
                `Provider ${providerId} exceeded max slots (${slots.length} > ${this.options.maxSlotsPerProvider}), truncating`
            );
            return slots.slice(0, this.options.maxSlotsPerProvider);
        }
        return slots;
    }

    private handleProviderError(providerId: SlotProviderId, error: unknown): void {
        const providerError: SlotProviderError = {
            code: "GENERATION_FAILED",
            message: error instanceof Error ? error.message : String(error),
            recoverable: true,
        };

        this.log(`Provider ${providerId} failed: ${providerError.message}`, "error");
        this.emit({ type: "error", error: providerError, providerId });
    }

    // ========================================================================
    // Slot Interaction
    // ========================================================================

    dismissSlot(slotId: string, context: SlotProviderContext): void {
        const slot = this.cachedSlots.find((s) => s.slot.id === slotId);

        if (!slot) {
            this.log(`Slot ${slotId} not found`);
            return;
        }

        // Mark as dismissed
        slot.dismissed = true;

        // Notify provider
        const provider = this.providers.get(slot.metadata.providerId);
        provider?.onSlotDismissed?.(slotId, context);

        // Update cache
        this.cachedSlots = this.cachedSlots.filter((s) => s.slot.id !== slotId);
        this.emit({ type: "slots-updated", slots: this.cachedSlots });

        this.log(`Dismissed slot: ${slotId}`);
    }

    notifySlotInteraction(
        slotId: string,
        interactionType: string,
        data?: unknown
    ): void {
        const slot = this.cachedSlots.find((s) => s.slot.id === slotId);

        if (!slot) {
            return;
        }

        const provider = this.providers.get(slot.metadata.providerId);
        provider?.onSlotInteraction?.(slotId, interactionType, data);
    }

    // ========================================================================
    // Event System
    // ========================================================================

    subscribe(listener: SlotProviderRegistryListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    private emit(event: SlotProviderRegistryEvent): void {
        this.listeners.forEach((listener) => {
            try {
                listener(event);
            } catch (error) {
                console.error("Slot provider registry listener error:", error);
            }
        });
    }

    // ========================================================================
    // Utility
    // ========================================================================

    clear(): void {
        // Dispose all providers
        this.providers.forEach((provider) => {
            provider.dispose?.();
        });

        this.providers.clear();
        this.enabledProviders.clear();
        this.cachedSlots = [];
        this.log("Registry cleared");
    }

    getCachedSlots(): InjectedSlot[] {
        return [...this.cachedSlots];
    }

    private log(message: string, level: "log" | "warn" | "error" = "log"): void {
        if (this.options.debug) {
            console[level](`[SlotProviderRegistry] ${message}`);
        }
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let globalRegistry: SlotProviderRegistry | null = null;

/**
 * Get the global slot provider registry instance.
 * Creates one if it doesn't exist.
 */
export function getSlotProviderRegistry(
    options?: SlotProviderRegistryOptions
): SlotProviderRegistry {
    if (!globalRegistry) {
        globalRegistry = new SlotProviderRegistry(options);
    }
    return globalRegistry;
}

/**
 * Reset the global registry (mainly for testing)
 */
export function resetSlotProviderRegistry(): void {
    if (globalRegistry) {
        globalRegistry.clear();
        globalRegistry = null;
    }
}

/**
 * Create a new registry instance (for scoped/isolated use)
 */
export function createSlotProviderRegistry(
    options?: SlotProviderRegistryOptions
): SlotProviderRegistry {
    return new SlotProviderRegistry(options);
}
