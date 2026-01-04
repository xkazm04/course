/**
 * Content Slot Renderers
 *
 * Each slot renderer handles a specific content type.
 * The SlotRenderer component delegates to the correct renderer based on slot type.
 */

// Main slot renderer
export { SlotRenderer, SlotListRenderer } from "./SlotRenderer";
export type { SlotRendererComponentProps, SlotListRendererProps } from "./SlotRenderer";

// Layout components
export { SlotBasedLayout } from "./SlotBasedLayout";
export type { SlotBasedLayoutProps } from "./SlotBasedLayout";

// Enhanced layout with provider support
export { EnhancedSlotBasedLayout } from "./EnhancedSlotBasedLayout";
export type { EnhancedSlotBasedLayoutProps } from "./EnhancedSlotBasedLayout";

// Injected slot renderers
export { InjectedSlotRenderer, InjectedSlotList } from "./InjectedSlotRenderer";
export type { InjectedSlotRendererProps, InjectedSlotListProps } from "./InjectedSlotRenderer";

// Individual slot renderers
export { VideoSlotRenderer } from "./VideoSlotRenderer";
export type { VideoSlotRendererProps } from "./VideoSlotRenderer";

export { CodeSlotRenderer } from "./CodeSlotRenderer";
export type { CodeSlotRendererProps } from "./CodeSlotRenderer";

export { KeyPointsSlotRenderer } from "./KeyPointsSlotRenderer";
export type { KeyPointsSlotRendererProps } from "./KeyPointsSlotRenderer";

export { NavigationSlotRenderer } from "./NavigationSlotRenderer";
export type { NavigationSlotRendererProps } from "./NavigationSlotRenderer";

export { TextSlotRenderer } from "./TextSlotRenderer";
export type { TextSlotRendererProps } from "./TextSlotRenderer";

export { ProgressSlotRenderer } from "./ProgressSlotRenderer";
export type { ProgressSlotRendererProps } from "./ProgressSlotRenderer";

export { ActionsSlotRenderer } from "./ActionsSlotRenderer";
export type { ActionsSlotRendererProps } from "./ActionsSlotRenderer";

export { SectionListSlotRenderer } from "./SectionListSlotRenderer";
export type { SectionListSlotRendererProps } from "./SectionListSlotRenderer";

export { PlaygroundSlotRenderer } from "./PlaygroundSlotRenderer";
export type { PlaygroundSlotRendererProps } from "./PlaygroundSlotRenderer";

export { HeaderSlotRenderer } from "./HeaderSlotRenderer";
export type { HeaderSlotRendererProps } from "./HeaderSlotRenderer";

// ComposableLayoutEngine-based renderer
export {
    ChapterLayoutRenderer,
    SingleColumnChapterLayout,
    useChapterLayout,
} from "./ChapterLayoutRenderer";
export type { ChapterLayoutRendererProps, SingleColumnLayoutProps } from "./ChapterLayoutRenderer";
