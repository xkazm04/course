/**
 * Built-in Slot Providers
 *
 * These are the default providers that ship with OpenForge.
 * Third-party developers can create their own providers following the same pattern.
 */

// AI-powered providers
export { createAIHintProvider, aiHintProvider } from "./AIHintProvider";

// Community content providers
export { createCommunityPracticeProvider, communityPracticeProvider } from "./CommunityPracticeProvider";

// Re-export types for convenience
export type { ISlotProvider } from "../types";
