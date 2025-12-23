"use client";

/**
 * LayoutRenderer Components
 *
 * React components for rendering layout templates using the ComposableLayoutEngine.
 * These components handle the RENDER phase of the compiler pattern.
 */

import React, { useMemo, useCallback } from "react";
import type {
    BaseSlot,
    LayoutTemplate,
    SlotPlacement,
    IComposableLayoutEngine,
    StandardLayoutRegion,
    ComputedRegionSlots,
} from "./types";

// ============================================================================
// Layout Renderer Props
// ============================================================================

export interface LayoutRendererProps<
    TSlot extends BaseSlot,
    TContext = unknown,
    TRegion extends string = StandardLayoutRegion
> {
    /**
     * The layout engine instance to use for rendering.
     */
    engine: IComposableLayoutEngine<TSlot, TContext, TRegion>;

    /**
     * The layout template to render.
     */
    template: LayoutTemplate<TSlot, TRegion>;

    /**
     * Context data passed to all slot renderers.
     */
    context: TContext;

    /**
     * Optional CSS class for the root container.
     */
    className?: string;

    /**
     * Optional CSS class for slot containers.
     */
    slotClassName?: string;

    /**
     * Test ID prefix for the layout.
     */
    testIdPrefix?: string;
}

// ============================================================================
// Slot List Renderer
// ============================================================================

interface SlotListProps<TSlot extends BaseSlot, TContext, TRegion extends string> {
    engine: IComposableLayoutEngine<TSlot, TContext, TRegion>;
    slots: SlotPlacement<TSlot, TRegion>[];
    context: TContext;
    className?: string;
    slotClassName?: string;
    testId?: string;
}

function SlotList<TSlot extends BaseSlot, TContext, TRegion extends string>({
    engine,
    slots,
    context,
    className,
    slotClassName,
    testId,
}: SlotListProps<TSlot, TContext, TRegion>): React.ReactElement {
    return (
        <div className={className} data-testid={testId}>
            {slots.map((placement) => (
                <React.Fragment key={placement.slot.id}>
                    {engine.renderSlot(placement.slot, context, slotClassName)}
                </React.Fragment>
            ))}
        </div>
    );
}

// ============================================================================
// Standard Grid Layout Renderer
// ============================================================================

/**
 * StandardGridLayout - Renders a standard 4-region grid layout (header, main, sidebar, footer).
 * This is the most common layout pattern and is optimized for this use case.
 */
export function StandardGridLayout<TSlot extends BaseSlot, TContext>({
    engine,
    template,
    context,
    className,
    slotClassName,
    testIdPrefix = "layout",
}: LayoutRendererProps<TSlot, TContext, StandardLayoutRegion>): React.ReactElement {
    const { gridConfig } = template;
    const columns = gridConfig?.columns ?? 3;
    const mainSpan = gridConfig?.mainSpan ?? 2;
    const sidebarSpan = gridConfig?.sidebarSpan ?? 1;
    const gap = gridConfig?.gap ?? "1.5rem";

    // Memoize all region slots in a single computation
    const regionSlots = useMemo(
        () => engine.computeAllRegionSlots(template) as ComputedRegionSlots<TSlot, StandardLayoutRegion>,
        [engine, template]
    );

    const headerSlots = regionSlots.header;
    const mainSlots = regionSlots.main;
    const sidebarSlots = regionSlots.sidebar;
    const footerSlots = regionSlots.footer;

    const hasSidebar = sidebarSpan > 0 && sidebarSlots.length > 0;

    return (
        <div className={className} data-testid={`${testIdPrefix}-${template.id}`}>
            {/* Header Region */}
            {headerSlots.length > 0 && (
                <SlotList
                    engine={engine}
                    slots={headerSlots}
                    context={context}
                    className="mb-6 space-y-6"
                    slotClassName={slotClassName}
                    testId={`${testIdPrefix}-header-region`}
                />
            )}

            {/* Main Grid */}
            {hasSidebar ? (
                <div
                    className="grid"
                    style={{
                        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                        gap,
                    }}
                    data-testid={`${testIdPrefix}-grid`}
                >
                    {/* Main Region */}
                    <div
                        className="space-y-6"
                        style={{ gridColumn: `span ${mainSpan} / span ${mainSpan}` }}
                        data-testid={`${testIdPrefix}-main-region`}
                    >
                        {mainSlots.map((placement) => (
                            <React.Fragment key={placement.slot.id}>
                                {engine.renderSlot(placement.slot, context, slotClassName)}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Sidebar Region */}
                    <div
                        className="space-y-6"
                        style={{ gridColumn: `span ${sidebarSpan} / span ${sidebarSpan}` }}
                        data-testid={`${testIdPrefix}-sidebar-region`}
                    >
                        {sidebarSlots.map((placement) => (
                            <React.Fragment key={placement.slot.id}>
                                {engine.renderSlot(placement.slot, context, slotClassName)}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            ) : (
                /* Single column layout */
                <SlotList
                    engine={engine}
                    slots={mainSlots}
                    context={context}
                    className="space-y-6"
                    slotClassName={slotClassName}
                    testId={`${testIdPrefix}-main-region`}
                />
            )}

            {/* Footer Region */}
            {footerSlots.length > 0 && (
                <SlotList
                    engine={engine}
                    slots={footerSlots}
                    context={context}
                    className="mt-8 space-y-6"
                    slotClassName={slotClassName}
                    testId={`${testIdPrefix}-footer-region`}
                />
            )}
        </div>
    );
}

// ============================================================================
// Generic Layout Renderer
// ============================================================================

export interface GenericLayoutRendererProps<
    TSlot extends BaseSlot,
    TContext,
    TRegion extends string
> extends LayoutRendererProps<TSlot, TContext, TRegion> {
    /**
     * Custom region renderer function.
     */
    renderRegion: (
        region: TRegion,
        slots: SlotPlacement<TSlot, TRegion>[],
        renderSlot: (slot: TSlot) => React.ReactNode
    ) => React.ReactNode;
}

/**
 * GenericLayoutRenderer - A flexible layout renderer that delegates region rendering
 * to a custom function. Use this for non-standard layout patterns.
 */
export function GenericLayoutRenderer<TSlot extends BaseSlot, TContext, TRegion extends string>({
    engine,
    template,
    context,
    className,
    slotClassName,
    testIdPrefix = "layout",
    renderRegion,
}: GenericLayoutRendererProps<TSlot, TContext, TRegion>): React.ReactElement {
    // Memoize all region slots
    const regionSlots = useMemo(
        () => engine.computeAllRegionSlots(template),
        [engine, template]
    );

    // Create a render function for slots
    const renderSlot = useCallback(
        (slot: TSlot) => engine.renderSlot(slot, context, slotClassName),
        [engine, context, slotClassName]
    );

    // Get all regions from the engine config
    const regions = engine.getConfig().regions;

    return (
        <div className={className} data-testid={`${testIdPrefix}-${template.id}`}>
            {regions.map((region) => (
                <React.Fragment key={region}>
                    {renderRegion(region, regionSlots[region], renderSlot)}
                </React.Fragment>
            ))}
        </div>
    );
}

// ============================================================================
// Hook for Using Layout Engine
// ============================================================================

/**
 * useLayoutEngine - A hook for using the layout engine in components.
 * Provides memoized access to common engine operations.
 */
export function useLayoutEngine<TSlot extends BaseSlot, TContext, TRegion extends string>(
    engine: IComposableLayoutEngine<TSlot, TContext, TRegion>,
    template: LayoutTemplate<TSlot, TRegion>
) {
    const regionSlots = useMemo(
        () => engine.computeAllRegionSlots(template),
        [engine, template]
    );

    const getSlotById = useCallback(
        (slotId: string) => engine.getSlotById(template, slotId),
        [engine, template]
    );

    const validate = useCallback(
        () => engine.validate(template),
        [engine, template]
    );

    return {
        regionSlots,
        getSlotById,
        validate,
        gridConfig: template.gridConfig,
    };
}
