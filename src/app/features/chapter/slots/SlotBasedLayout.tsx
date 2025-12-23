"use client";

import React, { useMemo } from "react";
import { SlotRenderer } from "./SlotRenderer";
import type { LayoutTemplate, SlotPlacement } from "../lib/contentSlots";
import type { ChapterState } from "../lib/useChapterState";

export interface SlotBasedLayoutProps {
    template: LayoutTemplate;
    state: ChapterState;
    className?: string;
}

/**
 * Computes slots for all regions in a single pass, sorted by order.
 * This avoids multiple filter+sort operations on the same array.
 */
function computeAllRegionSlots(template: LayoutTemplate): {
    header: SlotPlacement[];
    main: SlotPlacement[];
    sidebar: SlotPlacement[];
    footer: SlotPlacement[];
} {
    const result = {
        header: [] as SlotPlacement[],
        main: [] as SlotPlacement[],
        sidebar: [] as SlotPlacement[],
        footer: [] as SlotPlacement[],
    };

    // Single pass to categorize slots by region
    for (const placement of template.slots) {
        const region = placement.region;
        if (region === "header" || region === "main" || region === "sidebar" || region === "footer") {
            result[region].push(placement);
        }
    }

    // Sort each region by order
    const sortByOrder = (a: SlotPlacement, b: SlotPlacement) => (a.order ?? 0) - (b.order ?? 0);
    result.header.sort(sortByOrder);
    result.main.sort(sortByOrder);
    result.sidebar.sort(sortByOrder);
    result.footer.sort(sortByOrder);

    return result;
}

/**
 * SlotBasedLayout - Renders a layout template with content slots
 *
 * This component takes a layout template and renders all slots
 * according to their region and order configuration.
 */
export const SlotBasedLayout: React.FC<SlotBasedLayoutProps> = ({ template, state, className }) => {
    const { gridConfig } = template;
    const columns = gridConfig?.columns ?? 3;
    const mainSpan = gridConfig?.mainSpan ?? 2;
    const sidebarSpan = gridConfig?.sidebarSpan ?? 1;

    // Memoize all region slots in a single computation
    const { header: headerSlots, main: mainSlots, sidebar: sidebarSlots, footer: footerSlots } = useMemo(
        () => computeAllRegionSlots(template),
        [template]
    );

    const hasSidebar = sidebarSpan > 0 && sidebarSlots.length > 0;

    // Generate responsive grid classes based on column configuration
    // Mobile: single column stack, tablet (md): 2 columns, desktop (lg): full columns
    const getGridClasses = () => {
        // Base classes: single column on mobile, responsive on larger screens
        const baseClasses = "grid gap-6 grid-cols-1";

        if (columns === 3) {
            return `${baseClasses} md:grid-cols-3`;
        } else if (columns === 2) {
            return `${baseClasses} md:grid-cols-2`;
        }
        return baseClasses;
    };

    // Generate responsive span classes for main region
    const getMainSpanClasses = () => {
        // On mobile: full width (col-span-1 in single column grid)
        // On md+: use configured mainSpan
        if (columns === 3 && mainSpan === 2) {
            return "md:col-span-2";
        } else if (mainSpan === 1) {
            return "md:col-span-1";
        }
        return "";
    };

    // Generate responsive span classes for sidebar region
    const getSidebarSpanClasses = () => {
        // On mobile: full width (stacks below main)
        // On md+: use configured sidebarSpan
        if (sidebarSpan === 1) {
            return "md:col-span-1";
        }
        return "";
    };

    return (
        <div className={className} data-testid={`slot-layout-${template.id}`}>
            {/* Header Region */}
            {headerSlots.length > 0 && (
                <div className="mb-6 space-y-6" data-testid="layout-header-region">
                    {headerSlots.map((placement) => (
                        <SlotRenderer
                            key={placement.slot.id}
                            slot={placement.slot}
                            state={state}
                        />
                    ))}
                </div>
            )}

            {/* Main Grid - Responsive: stacks on mobile, multi-column on md+ */}
            {hasSidebar ? (
                <div
                    className={getGridClasses()}
                    data-testid="layout-grid"
                >
                    {/* Main Region - Full width on mobile, spans configured columns on md+ */}
                    <div
                        className={`space-y-6 ${getMainSpanClasses()}`}
                        data-testid="layout-main-region"
                    >
                        {mainSlots.map((placement) => (
                            <SlotRenderer
                                key={placement.slot.id}
                                slot={placement.slot}
                                state={state}
                            />
                        ))}
                    </div>

                    {/* Sidebar Region - Stacks below main on mobile, side column on md+ */}
                    <div
                        className={`space-y-6 ${getSidebarSpanClasses()}`}
                        data-testid="layout-sidebar-region"
                    >
                        {sidebarSlots.map((placement) => (
                            <SlotRenderer
                                key={placement.slot.id}
                                slot={placement.slot}
                                state={state}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                /* Single column layout */
                <div className="space-y-6" data-testid="layout-main-region">
                    {mainSlots.map((placement) => (
                        <SlotRenderer
                            key={placement.slot.id}
                            slot={placement.slot}
                            state={state}
                        />
                    ))}
                </div>
            )}

            {/* Footer Region */}
            {footerSlots.length > 0 && (
                <div className="mt-8 space-y-6" data-testid="layout-footer-region">
                    {footerSlots.map((placement) => (
                        <SlotRenderer
                            key={placement.slot.id}
                            slot={placement.slot}
                            state={state}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default SlotBasedLayout;
