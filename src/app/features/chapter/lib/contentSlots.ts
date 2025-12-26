/**
 * Content Slot System
 *
 * Defines a union type for content slots that separates content from presentation.
 * Each mode can define its layout as a slot arrangement while content types remain identical.
 */

import type { ChapterState } from "./useChapterState";

// ============================================================================
// Base Slot Interface
// ============================================================================

interface BaseSlot {
    id: string;
}

// ============================================================================
// Video Slot - Video player with playback controls
// ============================================================================

export interface VideoSlotData {
    currentTime?: string;
    totalTime?: string;
    progress?: number;
    resolution?: string;
}

export interface VideoSlot extends BaseSlot {
    type: "video";
    data?: VideoSlotData;
}

// ============================================================================
// Code Slot - Code blocks with syntax highlighting
// ============================================================================

export interface CodeSlotData {
    code: string;
    language?: string;
    filename?: string;
    showLineNumbers?: boolean;
    showCopy?: boolean;
    showHeader?: boolean;
    /** Previous code version for diff view (when sections build on previous code) */
    previousCode?: string;
    /** Previous filename if it changed */
    previousFilename?: string;
    /** Whether to show diff view by default */
    showDiffByDefault?: boolean;
}

export interface CodeSlot extends BaseSlot {
    type: "code";
    data: CodeSlotData;
}

// ============================================================================
// Key Points Slot - Bullet points of key takeaways
// ============================================================================

export interface KeyPointsSlotData {
    title?: string;
    points: string[];
    icon?: "message" | "sparkles" | "check";
}

export interface KeyPointsSlot extends BaseSlot {
    type: "keyPoints";
    data: KeyPointsSlotData;
}

// ============================================================================
// Quiz Slot - Interactive quiz component
// ============================================================================

export interface QuizSlotData {
    quizId?: string;
    sectionId: string;
    showButton?: boolean;
    inline?: boolean;
}

export interface QuizSlot extends BaseSlot {
    type: "quiz";
    data: QuizSlotData;
}

// ============================================================================
// Navigation Slot - Previous/Next chapter navigation
// ============================================================================

export interface NavigationSlotData {
    showPrevious?: boolean;
    showNext?: boolean;
    previousLabel?: string;
    nextLabel?: string;
    compact?: boolean;
}

export interface NavigationSlot extends BaseSlot {
    type: "navigation";
    data?: NavigationSlotData;
}

// ============================================================================
// Text Slot - Descriptive content blocks
// ============================================================================

export interface TextSlotData {
    title?: string;
    content: string;
    variant?: "prose" | "description" | "highlight";
}

export interface TextSlot extends BaseSlot {
    type: "text";
    data: TextSlotData;
}

// ============================================================================
// Progress Slot - Progress indicator/sidebar
// ============================================================================

export interface ProgressSlotData {
    variant?: "sidebar" | "header" | "inline";
    showSections?: boolean;
    showXp?: boolean;
}

export interface ProgressSlot extends BaseSlot {
    type: "progress";
    data?: ProgressSlotData;
}

// ============================================================================
// Actions Slot - Action buttons (bookmark, like, etc.)
// ============================================================================

export interface ActionsSlotData {
    showBookmark?: boolean;
    showLike?: boolean;
    variant?: "icon" | "full";
}

export interface ActionsSlot extends BaseSlot {
    type: "actions";
    data?: ActionsSlotData;
}

// ============================================================================
// Section List Slot - Expandable section list
// ============================================================================

export interface SectionListSlotData {
    expandable?: boolean;
    showQuizButtons?: boolean;
}

export interface SectionListSlot extends BaseSlot {
    type: "sectionList";
    data?: SectionListSlotData;
}

// ============================================================================
// Playground Slot - Code playground (for IDE mode)
// ============================================================================

export interface PlaygroundSlotData {
    playgroundId: string;
    title?: string;
    showFileExplorer?: boolean;
    height?: string;
}

export interface PlaygroundSlot extends BaseSlot {
    type: "playground";
    data: PlaygroundSlotData;
}

// ============================================================================
// Header Slot - Chapter header with title and metadata
// ============================================================================

export interface HeaderSlotData {
    variant?: "compact" | "full";
    showProgress?: boolean;
    showDuration?: boolean;
    showSectionCount?: boolean;
}

export interface HeaderSlot extends BaseSlot {
    type: "header";
    data?: HeaderSlotData;
}

// ============================================================================
// Content Slot Union Type
// ============================================================================

export type ContentSlot =
    | VideoSlot
    | CodeSlot
    | KeyPointsSlot
    | QuizSlot
    | NavigationSlot
    | TextSlot
    | ProgressSlot
    | ActionsSlot
    | SectionListSlot
    | PlaygroundSlot
    | HeaderSlot;

// ============================================================================
// Slot Type Helper
// ============================================================================

export type SlotType = ContentSlot["type"];

// ============================================================================
// Layout Region Types
// ============================================================================

export type LayoutRegion = "main" | "sidebar" | "header" | "footer";

export interface SlotPlacement {
    slot: ContentSlot;
    region: LayoutRegion;
    order?: number;
}

// ============================================================================
// Layout Template Interface
// ============================================================================

/**
 * Responsive configuration for layout templates
 */
export interface ResponsiveConfig {
    /** Breakpoint-specific class overrides */
    breakpoints?: {
        sm?: string;
        md?: string;
        lg?: string;
        xl?: string;
    };
    /** Whether the layout should be full-width on mobile */
    mobileFullWidth?: boolean;
}

/**
 * Complete declarative layout template with all mode-specific metadata.
 * This is the single source of truth for each mode - ChapterView is a pure
 * interpreter that renders based entirely on template data.
 */
export interface LayoutTemplate {
    /** Unique identifier for the template */
    id: string;
    /** Human-readable name */
    name: string;
    /** Description of the layout behavior */
    description: string;
    /** Content slot placements */
    slots: SlotPlacement[];
    /** Grid configuration */
    gridConfig?: {
        columns?: number;
        mainSpan?: number;
        sidebarSpan?: number;
    };
    /** CSS class to apply to the wrapper element */
    wrapperClass?: string;
    /** Data-testid attribute for testing */
    dataTestId?: string;
    /** Whether video controls are enabled in this mode */
    enableVideoControls?: boolean;
    /** Responsive configuration */
    responsiveConfig?: ResponsiveConfig;
}

// ============================================================================
// Slot Renderer Props
// ============================================================================

export interface SlotRendererProps<T extends ContentSlot = ContentSlot> {
    slot: T;
    state: ChapterState;
}

// ============================================================================
// Slot Factory Functions
// ============================================================================

export function createVideoSlot(id: string, data?: VideoSlotData): VideoSlot {
    return { id, type: "video", data };
}

export function createCodeSlot(id: string, data: CodeSlotData): CodeSlot {
    return { id, type: "code", data };
}

export function createKeyPointsSlot(id: string, data: KeyPointsSlotData): KeyPointsSlot {
    return { id, type: "keyPoints", data };
}

export function createQuizSlot(id: string, data: QuizSlotData): QuizSlot {
    return { id, type: "quiz", data };
}

export function createNavigationSlot(id: string, data?: NavigationSlotData): NavigationSlot {
    return { id, type: "navigation", data };
}

export function createTextSlot(id: string, data: TextSlotData): TextSlot {
    return { id, type: "text", data };
}

export function createProgressSlot(id: string, data?: ProgressSlotData): ProgressSlot {
    return { id, type: "progress", data };
}

export function createActionsSlot(id: string, data?: ActionsSlotData): ActionsSlot {
    return { id, type: "actions", data };
}

export function createSectionListSlot(id: string, data?: SectionListSlotData): SectionListSlot {
    return { id, type: "sectionList", data };
}

export function createPlaygroundSlot(id: string, data: PlaygroundSlotData): PlaygroundSlot {
    return { id, type: "playground", data };
}

export function createHeaderSlot(id: string, data?: HeaderSlotData): HeaderSlot {
    return { id, type: "header", data };
}

// ============================================================================
// Type Guards
// ============================================================================

export function isVideoSlot(slot: ContentSlot): slot is VideoSlot {
    return slot.type === "video";
}

export function isCodeSlot(slot: ContentSlot): slot is CodeSlot {
    return slot.type === "code";
}

export function isKeyPointsSlot(slot: ContentSlot): slot is KeyPointsSlot {
    return slot.type === "keyPoints";
}

export function isQuizSlot(slot: ContentSlot): slot is QuizSlot {
    return slot.type === "quiz";
}

export function isNavigationSlot(slot: ContentSlot): slot is NavigationSlot {
    return slot.type === "navigation";
}

export function isTextSlot(slot: ContentSlot): slot is TextSlot {
    return slot.type === "text";
}

export function isProgressSlot(slot: ContentSlot): slot is ProgressSlot {
    return slot.type === "progress";
}

export function isActionsSlot(slot: ContentSlot): slot is ActionsSlot {
    return slot.type === "actions";
}

export function isSectionListSlot(slot: ContentSlot): slot is SectionListSlot {
    return slot.type === "sectionList";
}

export function isPlaygroundSlot(slot: ContentSlot): slot is PlaygroundSlot {
    return slot.type === "playground";
}

export function isHeaderSlot(slot: ContentSlot): slot is HeaderSlot {
    return slot.type === "header";
}
