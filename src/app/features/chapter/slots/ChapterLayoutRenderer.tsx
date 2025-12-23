"use client";

/**
 * ChapterLayoutRenderer
 *
 * A React component that renders chapter layouts using the ComposableLayoutEngine.
 * This is the RENDER phase of the compiler pattern, handling the actual React
 * component tree generation from layout templates.
 *
 * @example
 * ```tsx
 * <ChapterLayoutRenderer
 *   template={classicLayoutTemplate}
 *   state={chapterState}
 * />
 * ```
 */

import React, { useMemo } from "react";
import { StandardGridLayout, useLayoutEngine } from "@/app/shared/lib/composable-layout";
import { chapterEngine } from "../lib/chapterLayoutEngine";
import type { LayoutTemplate } from "@/app/shared/lib/composable-layout";
import type { ContentSlot } from "../lib/contentSlots";
import type { ChapterState } from "../lib/useChapterState";

// ============================================================================
// Props
// ============================================================================

export interface ChapterLayoutRendererProps {
    /**
     * The layout template to render.
     */
    template: LayoutTemplate<ContentSlot, "header" | "main" | "sidebar" | "footer">;

    /**
     * The chapter state passed to all slot renderers.
     */
    state: ChapterState;

    /**
     * Optional CSS class for the root container.
     */
    className?: string;

    /**
     * Optional CSS class for individual slot containers.
     */
    slotClassName?: string;

    /**
     * Whether to validate the template before rendering.
     * Defaults to false in production, true in development.
     */
    validateTemplate?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ChapterLayoutRenderer - Renders chapter layouts using the ComposableLayoutEngine.
 *
 * This component provides:
 * - Type-safe rendering of chapter slot types
 * - Automatic region-based layout with grid support
 * - Template validation in development mode
 * - Memoized slot computations for performance
 */
export const ChapterLayoutRenderer: React.FC<ChapterLayoutRendererProps> = ({
    template,
    state,
    className,
    slotClassName,
    validateTemplate = process.env.NODE_ENV === "development",
}) => {
    // Validate template in development
    useMemo(() => {
        if (validateTemplate) {
            const result = chapterEngine.validate(template);
            if (!result.valid) {
                console.error("Chapter layout template validation failed:", result.errors);
            }
            if (result.warnings.length > 0) {
                console.warn("Chapter layout template warnings:", result.warnings);
            }
        }
    }, [template, validateTemplate]);

    return (
        <StandardGridLayout
            engine={chapterEngine}
            template={template}
            context={state}
            className={className}
            slotClassName={slotClassName}
            testIdPrefix="chapter-layout"
            data-testid={`chapter-layout-${template.id}`}
        />
    );
};

// ============================================================================
// Hook for Custom Rendering
// ============================================================================

/**
 * useChapterLayout - Hook for custom chapter layout rendering.
 *
 * Use this when you need more control over how the layout is rendered,
 * for example when implementing custom region layouts.
 *
 * @example
 * ```tsx
 * const { regionSlots, renderSlot } = useChapterLayout(template, state);
 *
 * return (
 *   <div>
 *     {regionSlots.main.map(placement => renderSlot(placement.slot))}
 *   </div>
 * );
 * ```
 */
export function useChapterLayout(
    template: LayoutTemplate<ContentSlot, "header" | "main" | "sidebar" | "footer">,
    state: ChapterState
) {
    const { regionSlots, getSlotById, validate, gridConfig } = useLayoutEngine(
        chapterEngine,
        template
    );

    // Create a render function bound to the current state
    const renderSlot = useMemo(() => {
        return (slot: ContentSlot, className?: string) => {
            return chapterEngine.renderSlot(slot, state, className);
        };
    }, [state]);

    return {
        regionSlots,
        getSlotById,
        validate,
        gridConfig,
        renderSlot,
        engine: chapterEngine,
    };
}

// ============================================================================
// Alternative Layouts
// ============================================================================

/**
 * Props for single-column chapter layout.
 */
export interface SingleColumnLayoutProps {
    template: LayoutTemplate<ContentSlot, "header" | "main" | "sidebar" | "footer">;
    state: ChapterState;
    className?: string;
}

/**
 * SingleColumnChapterLayout - A simplified single-column layout for chapters.
 * Renders all slots in a single vertical stack, ignoring region configurations.
 */
export const SingleColumnChapterLayout: React.FC<SingleColumnLayoutProps> = ({
    template,
    state,
    className,
}) => {
    const regionSlots = useMemo(
        () => chapterEngine.computeAllRegionSlots(template),
        [template]
    );

    // Combine all slots in order: header, main, sidebar, footer
    const allSlots = useMemo(() => {
        return [
            ...regionSlots.header,
            ...regionSlots.main,
            ...regionSlots.sidebar,
            ...regionSlots.footer,
        ];
    }, [regionSlots]);

    return (
        <div className={className} data-testid={`chapter-single-column-${template.id}`}>
            <div className="space-y-6">
                {allSlots.map((placement) => (
                    <React.Fragment key={placement.slot.id}>
                        {chapterEngine.renderSlot(placement.slot, state)}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default ChapterLayoutRenderer;
