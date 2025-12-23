/**
 * Chapter display mode definitions
 * Defines the polymorphic mode system for ChapterView
 */

import type { ComponentType } from "react";
import type { ChapterState } from "./useChapterState";

/**
 * Available chapter display modes
 */
export type ChapterMode = "classic" | "expandable" | "ide";

/**
 * Props passed to each mode renderer
 */
export interface ModeRendererProps {
    state: ChapterState;
}

/**
 * Mode renderer component type
 */
export type ModeRenderer = ComponentType<ModeRendererProps>;

/**
 * Map of mode names to their renderer components
 */
export type ModeRendererMap = Record<ChapterMode, ModeRenderer>;

/**
 * Mode configuration with metadata
 */
export interface ModeConfig {
    key: ChapterMode;
    name: string;
    description: string;
    enableVideoControls: boolean;
}

/**
 * Available mode configurations
 */
export const MODE_CONFIGS: ModeConfig[] = [
    {
        key: "classic",
        name: "Classic",
        description: "Video player with content layout and sidebar progress",
        enableVideoControls: true,
    },
    {
        key: "expandable",
        name: "Expandable",
        description: "Scrollable view with collapsible sections",
        enableVideoControls: true,
    },
    {
        key: "ide",
        name: "IDE",
        description: "Interactive code playground with file explorer",
        enableVideoControls: false,
    },
];

/**
 * Get mode config by key
 */
export function getModeConfig(mode: ChapterMode): ModeConfig {
    return MODE_CONFIGS.find((c) => c.key === mode) ?? MODE_CONFIGS[0];
}

/**
 * Legacy variant key mapping for backwards compatibility
 */
export const VARIANT_TO_MODE: Record<string, ChapterMode> = {
    A: "classic",
    C: "expandable",
    D: "ide",
};

/**
 * Mode to legacy variant key mapping
 */
export const MODE_TO_VARIANT: Record<ChapterMode, string> = {
    classic: "A",
    expandable: "C",
    ide: "D",
};
