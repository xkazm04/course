/**
 * Slot Provider Protocol Module
 *
 * Enables third-party providers to inject content slots into chapter layouts.
 *
 * @example
 * ```typescript
 * // 1. Create a provider
 * const myProvider: ISlotProvider = {
 *   config: {
 *     id: "my-provider",
 *     name: "My Provider",
 *     description: "Adds custom hints",
 *     version: "1.0.0",
 *     supportedSlotTypes: ["text"],
 *     supportedRegions: ["main", "sidebar"],
 *   },
 *
 *   async generateSlots(context) {
 *     const builder = createSlotBuilder({ providerId: "my-provider" });
 *     return {
 *       slots: [
 *         builder.createHint("hint-1", "Remember to check for null!"),
 *       ],
 *     };
 *   },
 * };
 *
 * // 2. Register with the registry
 * const registry = getSlotProviderRegistry();
 * registry.register(myProvider);
 *
 * // 3. Use in React with the provider context
 * <SlotProviderProvider
 *   chapterState={state}
 *   chapterId="chapter-1"
 *   initialProviders={[myProvider]}
 * >
 *   <ChapterView mode="expandable" />
 * </SlotProviderProvider>
 *
 * // 4. Access injected slots in components
 * function MyComponent() {
 *   const { injectedSlots } = useSlotProvider();
 *   // Render injected slots...
 * }
 * ```
 */

// Types
export type {
    // Core protocol types
    SlotProviderId,
    SlotPriority,
    SlotInjectionTarget,
    InjectedSlotMetadata,
    InjectedSlot,
    SlotProviderContext,
    SlotProviderResult,
    SlotProviderError,
    SlotProviderConfig,
    ISlotProvider,
    // Registry types
    SlotProviderRegistryEvent,
    SlotProviderRegistryListener,
    SlotProviderRegistryOptions,
    ISlotProviderRegistry,
} from "./types";

// Priority helpers
export { PRIORITY_VALUES, comparePriorities } from "./types";

// Registry
export {
    SlotProviderRegistry,
    getSlotProviderRegistry,
    resetSlotProviderRegistry,
    createSlotProviderRegistry,
} from "./SlotProviderRegistry";

// React integration
export {
    SlotProviderProvider,
    useSlotProvider,
    useInjectedSlots,
    useAnchoredSlots,
    useProviderStatus,
    useInjectedSlotContext,
} from "./SlotProviderContext";

export type { SlotProviderProviderProps } from "./SlotProviderContext";

// Slot builders
export {
    InjectedSlotBuilder,
    createSlotBuilder,
} from "./slotBuilders";

export type { InjectedSlotBuilderConfig } from "./slotBuilders";

// Built-in providers
export {
    createAIHintProvider,
    aiHintProvider,
    createCommunityPracticeProvider,
    communityPracticeProvider,
} from "./providers";
