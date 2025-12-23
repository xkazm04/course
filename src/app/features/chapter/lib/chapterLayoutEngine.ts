/**
 * Chapter Layout Engine
 *
 * A chapter-specific implementation of the ComposableLayoutEngine pattern.
 * This provides type-safe layout composition for chapter content using
 * the three-phase compiler pattern:
 *
 * 1. PARSE: ContentSlot union type defines all available slot types
 * 2. TRANSFORM: LayoutTemplate arranges slots into regions
 * 3. RENDER: chapterRendererMap dispatches to typed renderers
 *
 * @example
 * ```tsx
 * // Use the engine to render a chapter layout
 * const template = chapterEngine.createBuilder({ id: "custom", name: "Custom" })
 *   .addSlot(createVideoSlot("video-1"), "main", 1)
 *   .addSlot(createProgressSlot("progress-1"), "sidebar", 1)
 *   .build();
 *
 * <ChapterLayoutRenderer template={template} state={chapterState} />
 * ```
 */

import {
    createLayoutEngine,
    createSlotTypeGuard,
    type RendererMap,
    type StandardLayoutRegion,
} from "@/app/shared/lib/composable-layout";
import type { ContentSlot, SlotType } from "./contentSlots";
import type { ChapterState } from "./useChapterState";

// Import all slot renderers
import { VideoSlotRenderer } from "../slots/VideoSlotRenderer";
import { CodeSlotRenderer } from "../slots/CodeSlotRenderer";
import { KeyPointsSlotRenderer } from "../slots/KeyPointsSlotRenderer";
import { NavigationSlotRenderer } from "../slots/NavigationSlotRenderer";
import { TextSlotRenderer } from "../slots/TextSlotRenderer";
import { ProgressSlotRenderer } from "../slots/ProgressSlotRenderer";
import { ActionsSlotRenderer } from "../slots/ActionsSlotRenderer";
import { SectionListSlotRenderer } from "../slots/SectionListSlotRenderer";
import { PlaygroundSlotRenderer } from "../slots/PlaygroundSlotRenderer";
import { HeaderSlotRenderer } from "../slots/HeaderSlotRenderer";

// ============================================================================
// Type Helpers
// ============================================================================

/**
 * Chapter-specific slot type.
 * This is a re-export from contentSlots for convenience.
 */
export type ChapterSlot = ContentSlot;

/**
 * Chapter-specific context type.
 * This is the ChapterState that gets passed to all renderers.
 */
export type ChapterContext = ChapterState;

/**
 * Chapter-specific region type.
 */
export type ChapterRegion = StandardLayoutRegion;

// ============================================================================
// Renderer Map
// ============================================================================

/**
 * Adapter wrapper to convert legacy slot renderer props to new engine props.
 * Legacy renderers expect { slot, state } but engine provides { slot, context }.
 */
function createRendererAdapter<T extends ContentSlot>(
    Renderer: React.FC<{ slot: T; state: ChapterState; className?: string }>
): React.FC<{ slot: T; context: ChapterState; className?: string }> {
    return function AdaptedRenderer({ slot, context, className }) {
        return Renderer({ slot, state: context, className });
    };
}

/**
 * The renderer map for chapter slots.
 * Maps each slot type to its corresponding renderer component.
 */
export const chapterRendererMap: RendererMap<ContentSlot, ChapterState> = {
    video: createRendererAdapter(VideoSlotRenderer),
    code: createRendererAdapter(CodeSlotRenderer),
    keyPoints: createRendererAdapter(KeyPointsSlotRenderer),
    quiz: () => null, // Quiz feature removed
    navigation: createRendererAdapter(NavigationSlotRenderer),
    text: createRendererAdapter(TextSlotRenderer),
    progress: createRendererAdapter(ProgressSlotRenderer),
    actions: createRendererAdapter(ActionsSlotRenderer),
    sectionList: createRendererAdapter(SectionListSlotRenderer),
    playground: createRendererAdapter(PlaygroundSlotRenderer),
    header: createRendererAdapter(HeaderSlotRenderer),
};

// ============================================================================
// Chapter Layout Engine
// ============================================================================

/**
 * The chapter layout engine instance.
 * Use this to validate templates, compute regions, and render layouts.
 */
export const chapterEngine = createLayoutEngine<ContentSlot, ChapterState, ChapterRegion>({
    renderers: chapterRendererMap,
    regions: ["header", "main", "sidebar", "footer"] as const,
    defaultGridConfig: {
        columns: 3,
        mainSpan: 2,
        sidebarSpan: 1,
        gap: "1.5rem",
    },
    fallbackRenderer: ({ slot }) => {
        console.warn(`Unknown chapter slot type: ${slot.type}`);
        return null;
    },
    onRenderError: (error, slot) => {
        console.error(`Error rendering chapter slot "${slot.id}" of type "${slot.type}":`, error);
    },
});

// ============================================================================
// Type Guards (using the engine pattern)
// ============================================================================

export const isVideoSlot = createSlotTypeGuard<ContentSlot, "video">("video");
export const isCodeSlot = createSlotTypeGuard<ContentSlot, "code">("code");
export const isKeyPointsSlot = createSlotTypeGuard<ContentSlot, "keyPoints">("keyPoints");
export const isQuizSlot = createSlotTypeGuard<ContentSlot, "quiz">("quiz");
export const isNavigationSlot = createSlotTypeGuard<ContentSlot, "navigation">("navigation");
export const isTextSlot = createSlotTypeGuard<ContentSlot, "text">("text");
export const isProgressSlot = createSlotTypeGuard<ContentSlot, "progress">("progress");
export const isActionsSlot = createSlotTypeGuard<ContentSlot, "actions">("actions");
export const isSectionListSlot = createSlotTypeGuard<ContentSlot, "sectionList">("sectionList");
export const isPlaygroundSlot = createSlotTypeGuard<ContentSlot, "playground">("playground");
export const isHeaderSlot = createSlotTypeGuard<ContentSlot, "header">("header");

// ============================================================================
// Convenience Exports
// ============================================================================

/**
 * Create a layout builder for chapter layouts.
 */
export function createChapterLayoutBuilder(config: { id: string; name: string; description?: string }) {
    return chapterEngine.createBuilder(config);
}

/**
 * Validate a chapter layout template.
 */
export function validateChapterLayout(template: Parameters<typeof chapterEngine.validate>[0]) {
    return chapterEngine.validate(template);
}

/**
 * Get slots for a region from a chapter layout template.
 */
export function getChapterSlotsForRegion(
    template: Parameters<typeof chapterEngine.getSlotsForRegion>[0],
    region: ChapterRegion
) {
    return chapterEngine.getSlotsForRegion(template, region);
}

/**
 * Compute all region slots for a chapter layout template.
 */
export function computeChapterRegionSlots(
    template: Parameters<typeof chapterEngine.computeAllRegionSlots>[0]
) {
    return chapterEngine.computeAllRegionSlots(template);
}
