"use client";

import React, { useMemo } from "react";
import { useChapterState } from "./lib/useChapterState";
import { VARIANT_TO_MODE } from "./lib/chapterModes";
import { SlotBasedLayout } from "./slots";
import { getLayoutTemplate } from "./lib/layoutTemplates";
import { COURSE_INFO, HOOKS_FUNDAMENTALS_COURSE_INFO, CHAPTER_SECTIONS } from "./lib/chapterData";
import type { ChapterMode } from "./lib/chapterModes";
import type { CourseInfo, ChapterSection } from "./lib/chapterData";
import type { LayoutTemplate } from "./lib/contentSlots";

/**
 * Props for the unified ChapterView component
 */
export interface ChapterViewProps {
    /**
     * Display mode for the chapter view
     * - 'classic': Video player with content layout and sidebar progress
     * - 'expandable': Scrollable view with collapsible sections
     * - 'ide': Interactive code playground with file explorer
     */
    mode: ChapterMode;

    /**
     * Optional course info override
     * Defaults to shared COURSE_INFO
     */
    courseInfo?: CourseInfo;

    /**
     * Optional sections override
     * Defaults to shared CHAPTER_SECTIONS
     */
    sections?: ChapterSection[];

    /**
     * Initial section index (for classic mode) or initial active section id
     */
    initialSection?: number;
}

/**
 * Legacy variant key prop support
 */
export interface ChapterViewVariantProps {
    /**
     * Legacy variant key (A, C, D) for backwards compatibility
     * Prefer using 'mode' prop instead
     */
    variant: string;
    courseInfo?: CourseInfo;
    sections?: ChapterSection[];
    initialSection?: number;
}

/**
 * Unified ChapterView component with polymorphic mode rendering
 *
 * This component consolidates VariantA, VariantC, and VariantD into a single
 * component with shared state management and mode-specific renderers.
 *
 * @example
 * // Using mode prop (preferred)
 * <ChapterView mode="classic" />
 * <ChapterView mode="expandable" />
 * <ChapterView mode="ide" />
 *
 * @example
 * // Using legacy variant key
 * <ChapterView variant="A" />
 * <ChapterView variant="C" />
 * <ChapterView variant="D" />
 *
 * @example
 * // With custom course info
 * <ChapterView
 *   mode="expandable"
 *   courseInfo={customCourse}
 *   sections={customSections}
 * />
 */
/**
 * ChapterView - Pure Interpreter Pattern
 *
 * This component acts as a pure interpreter of LayoutTemplate data.
 * All mode-specific configuration (wrapperClass, dataTestId, enableVideoControls,
 * responsiveConfig) is defined declaratively in the templates themselves.
 *
 * Adding a new mode requires only adding a new template - no code changes here.
 */
export const ChapterView: React.FC<ChapterViewProps | ChapterViewVariantProps> = (props) => {
    // Normalize props - support both 'mode' and legacy 'variant' props
    const mode: ChapterMode = useMemo(() => {
        if ("mode" in props) {
            return props.mode;
        }
        if ("variant" in props) {
            return VARIANT_TO_MODE[props.variant] ?? "classic";
        }
        return "classic";
    }, [props]);

    // Get the complete template - single source of truth for all mode configuration
    const template: LayoutTemplate = useMemo(() => getLayoutTemplate(mode), [mode]);

    // Determine course info based on mode (still uses mode for content selection)
    const courseInfo = useMemo(() => {
        if (props.courseInfo) {
            return props.courseInfo;
        }
        // Use different default course info based on mode
        if (mode === "expandable") {
            return HOOKS_FUNDAMENTALS_COURSE_INFO;
        }
        return COURSE_INFO;
    }, [props.courseInfo, mode]);

    // Get sections
    const sections = props.sections ?? CHAPTER_SECTIONS;

    // Initialize shared chapter state using template's enableVideoControls
    const chapterState = useChapterState({
        courseInfo,
        sections,
        initialSection: props.initialSection,
        enableVideoControls: template.enableVideoControls ?? true,
    });

    // Pure rendering - all configuration comes from template
    const layout = <SlotBasedLayout template={template} state={chapterState} />;

    // Render with template-defined wrapper and test id
    return (
        <div
            className={template.wrapperClass}
            data-testid={template.dataTestId ?? `chapter-view-${template.id}`}
        >
            {layout}
        </div>
    );
};

export default ChapterView;
