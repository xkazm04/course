"use client";

import React, { useMemo } from "react";
import { useChapterState } from "./lib/useChapterState";
import { getModeConfig, VARIANT_TO_MODE } from "./lib/chapterModes";
import { SlotBasedLayout } from "./slots";
import {
    classicLayoutTemplate,
    expandableLayoutTemplate,
    ideLayoutTemplate,
} from "./lib/layoutTemplates";
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

    // Get mode configuration
    const modeConfig = useMemo(() => getModeConfig(mode), [mode]);

    // Determine course info based on mode
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

    // Initialize shared chapter state
    const chapterState = useChapterState({
        courseInfo,
        sections,
        initialSection: props.initialSection,
        enableVideoControls: modeConfig.enableVideoControls,
    });

    // Mode to template and wrapper config mapping (inlined from separate renderer files)
    const modeTemplates: Record<ChapterMode, { template: LayoutTemplate; wrapperClass?: string }> = {
        classic: { template: classicLayoutTemplate },
        expandable: { template: expandableLayoutTemplate, wrapperClass: "max-w-5xl mx-auto" },
        ide: { template: ideLayoutTemplate, wrapperClass: "space-y-6" },
    };

    const config = modeTemplates[mode] ?? modeTemplates.classic;

    if (!modeTemplates[mode]) {
        console.warn(`Unknown chapter mode: ${mode}, falling back to classic`);
    }

    const layout = <SlotBasedLayout template={config.template} state={chapterState} />;

    return config.wrapperClass ? (
        <div className={config.wrapperClass} data-testid={`chapter-view-${mode}`}>
            {layout}
        </div>
    ) : (
        <div data-testid={`chapter-view-${mode}`}>{layout}</div>
    );
};

export default ChapterView;
