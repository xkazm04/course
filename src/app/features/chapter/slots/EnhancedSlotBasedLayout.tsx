"use client";

/**
 * Enhanced Slot-Based Layout
 *
 * An extension of SlotBasedLayout that supports injected slots from
 * third-party providers. Maintains backwards compatibility with the
 * original layout while adding provider integration.
 */

import React, { useMemo, useContext, createContext } from "react";
import { SlotRenderer } from "./SlotRenderer";
import { InjectedSlotRenderer, InjectedSlotList } from "./InjectedSlotRenderer";
import type { LayoutTemplate, SlotPlacement, LayoutRegion } from "../lib/contentSlots";
import type { ChapterState } from "../lib/useChapterState";
import type { InjectedSlot } from "../lib/slotProvider/types";

// ============================================================================
// Types
// ============================================================================

export interface EnhancedSlotBasedLayoutProps {
    /** Layout template with static slots */
    template: LayoutTemplate;
    /** Chapter state */
    state: ChapterState;
    /** Injected slots from providers */
    injectedSlots?: InjectedSlot[];
    /** Optional class name */
    className?: string;
    /** Show provider badges on injected slots */
    showProviderBadges?: boolean;
    /** Show dismiss buttons on injected slots */
    showDismissButtons?: boolean;
}

// Context for passing injected slots to nested components
interface InjectedSlotsContextValue {
    getInjectedSlotsForAnchor: (
        anchorSlotId: string,
        position: "before" | "after"
    ) => InjectedSlot[];
    showProviderBadges: boolean;
    showDismissButtons: boolean;
}

const InjectedSlotsContext = createContext<InjectedSlotsContextValue | null>(null);

// ============================================================================
// Helper Functions
// ============================================================================

interface ComputedRegionSlots {
    header: SlotPlacement[];
    main: SlotPlacement[];
    sidebar: SlotPlacement[];
    footer: SlotPlacement[];
}

interface ComputedInjectedSlots {
    header: InjectedSlot[];
    main: InjectedSlot[];
    sidebar: InjectedSlot[];
    footer: InjectedSlot[];
    anchored: Map<string, { before: InjectedSlot[]; after: InjectedSlot[] }>;
}

function computeAllRegionSlots(template: LayoutTemplate): ComputedRegionSlots {
    const result: ComputedRegionSlots = {
        header: [],
        main: [],
        sidebar: [],
        footer: [],
    };

    for (const placement of template.slots) {
        const region = placement.region;
        if (region === "header" || region === "main" || region === "sidebar" || region === "footer") {
            result[region].push(placement);
        }
    }

    const sortByOrder = (a: SlotPlacement, b: SlotPlacement) => (a.order ?? 0) - (b.order ?? 0);
    result.header.sort(sortByOrder);
    result.main.sort(sortByOrder);
    result.sidebar.sort(sortByOrder);
    result.footer.sort(sortByOrder);

    return result;
}

function computeInjectedSlots(slots: InjectedSlot[]): ComputedInjectedSlots {
    const result: ComputedInjectedSlots = {
        header: [],
        main: [],
        sidebar: [],
        footer: [],
        anchored: new Map(),
    };

    for (const slot of slots) {
        const { region, anchorSlotId, position } = slot.target;

        // If anchored to a specific slot
        if (anchorSlotId) {
            if (!result.anchored.has(anchorSlotId)) {
                result.anchored.set(anchorSlotId, { before: [], after: [] });
            }
            const anchored = result.anchored.get(anchorSlotId)!;
            if (position === "before") {
                anchored.before.push(slot);
            } else {
                anchored.after.push(slot);
            }
        } else {
            // Add to region
            if (region === "header" || region === "main" || region === "sidebar" || region === "footer") {
                result[region].push(slot);
            }
        }
    }

    // Sort each region by order
    const sortByOrder = (a: InjectedSlot, b: InjectedSlot) =>
        (a.target.order ?? 0) - (b.target.order ?? 0);

    result.header.sort(sortByOrder);
    result.main.sort(sortByOrder);
    result.sidebar.sort(sortByOrder);
    result.footer.sort(sortByOrder);

    return result;
}

// ============================================================================
// Slot Wrapper with Anchor Support
// ============================================================================

interface SlotWithAnchorsProps {
    placement: SlotPlacement;
    state: ChapterState;
}

function SlotWithAnchors({ placement, state }: SlotWithAnchorsProps) {
    const context = useContext(InjectedSlotsContext);

    if (!context) {
        // No context - just render the slot
        return <SlotRenderer slot={placement.slot} state={state} />;
    }

    const beforeSlots = context.getInjectedSlotsForAnchor(placement.slot.id, "before");
    const afterSlots = context.getInjectedSlotsForAnchor(placement.slot.id, "after");

    return (
        <>
            {/* Injected slots positioned before this slot */}
            {beforeSlots.length > 0 && (
                <InjectedSlotList
                    slots={beforeSlots}
                    state={state}
                    showProviderBadges={context.showProviderBadges}
                    showDismiss={context.showDismissButtons}
                    className="mb-4"
                />
            )}

            {/* The actual slot */}
            <SlotRenderer slot={placement.slot} state={state} />

            {/* Injected slots positioned after this slot */}
            {afterSlots.length > 0 && (
                <InjectedSlotList
                    slots={afterSlots}
                    state={state}
                    showProviderBadges={context.showProviderBadges}
                    showDismiss={context.showDismissButtons}
                    className="mt-4"
                />
            )}
        </>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export const EnhancedSlotBasedLayout: React.FC<EnhancedSlotBasedLayoutProps> = ({
    template,
    state,
    injectedSlots = [],
    className,
    showProviderBadges = true,
    showDismissButtons = true,
}) => {
    const { gridConfig } = template;
    const columns = gridConfig?.columns ?? 3;
    const mainSpan = gridConfig?.mainSpan ?? 2;
    const sidebarSpan = gridConfig?.sidebarSpan ?? 1;

    // Compute static slots
    const staticSlots = useMemo(
        () => computeAllRegionSlots(template),
        [template]
    );

    // Compute injected slots
    const computed = useMemo(
        () => computeInjectedSlots(injectedSlots),
        [injectedSlots]
    );

    // Context value
    const contextValue = useMemo<InjectedSlotsContextValue>(
        () => ({
            getInjectedSlotsForAnchor: (anchorSlotId, position) => {
                const anchored = computed.anchored.get(anchorSlotId);
                if (!anchored) return [];
                return position === "before" ? anchored.before : anchored.after;
            },
            showProviderBadges,
            showDismissButtons,
        }),
        [computed.anchored, showProviderBadges, showDismissButtons]
    );

    const hasSidebar = sidebarSpan > 0 && (staticSlots.sidebar.length > 0 || computed.sidebar.length > 0);

    // Grid classes
    const getGridClasses = () => {
        const baseClasses = "grid gap-6 grid-cols-1";
        if (columns === 3) return `${baseClasses} md:grid-cols-3`;
        if (columns === 2) return `${baseClasses} md:grid-cols-2`;
        return baseClasses;
    };

    const getMainSpanClasses = () => {
        if (columns === 3 && mainSpan === 2) return "md:col-span-2";
        if (mainSpan === 1) return "md:col-span-1";
        return "";
    };

    const getSidebarSpanClasses = () => {
        if (sidebarSpan === 1) return "md:col-span-1";
        return "";
    };

    return (
        <InjectedSlotsContext.Provider value={contextValue}>
            <div className={className} data-testid={`enhanced-slot-layout-${template.id}`}>
                {/* Header Region */}
                {(staticSlots.header.length > 0 || computed.header.length > 0) && (
                    <div className="mb-6 space-y-6" data-testid="layout-header-region">
                        {/* Injected slots at start of header */}
                        {computed.header
                            .filter((s) => s.target.position !== "after")
                            .map((slot) => (
                                <InjectedSlotRenderer
                                    key={slot.slot.id}
                                    injectedSlot={slot}
                                    state={state}
                                    showProviderBadge={showProviderBadges}
                                    showDismiss={showDismissButtons}
                                />
                            ))}

                        {staticSlots.header.map((placement) => (
                            <SlotWithAnchors
                                key={placement.slot.id}
                                placement={placement}
                                state={state}
                            />
                        ))}

                        {/* Injected slots at end of header */}
                        {computed.header
                            .filter((s) => s.target.position === "after")
                            .map((slot) => (
                                <InjectedSlotRenderer
                                    key={slot.slot.id}
                                    injectedSlot={slot}
                                    state={state}
                                    showProviderBadge={showProviderBadges}
                                    showDismiss={showDismissButtons}
                                />
                            ))}
                    </div>
                )}

                {/* Main Grid */}
                {hasSidebar ? (
                    <div className={getGridClasses()} data-testid="layout-grid">
                        {/* Main Region */}
                        <div
                            className={`space-y-6 ${getMainSpanClasses()}`}
                            data-testid="layout-main-region"
                        >
                            {computed.main
                                .filter((s) => s.target.position !== "after")
                                .map((slot) => (
                                    <InjectedSlotRenderer
                                        key={slot.slot.id}
                                        injectedSlot={slot}
                                        state={state}
                                        showProviderBadge={showProviderBadges}
                                        showDismiss={showDismissButtons}
                                    />
                                ))}

                            {staticSlots.main.map((placement) => (
                                <SlotWithAnchors
                                    key={placement.slot.id}
                                    placement={placement}
                                    state={state}
                                />
                            ))}

                            {computed.main
                                .filter((s) => s.target.position === "after")
                                .map((slot) => (
                                    <InjectedSlotRenderer
                                        key={slot.slot.id}
                                        injectedSlot={slot}
                                        state={state}
                                        showProviderBadge={showProviderBadges}
                                        showDismiss={showDismissButtons}
                                    />
                                ))}
                        </div>

                        {/* Sidebar Region */}
                        <div
                            className={`space-y-6 ${getSidebarSpanClasses()}`}
                            data-testid="layout-sidebar-region"
                        >
                            {computed.sidebar
                                .filter((s) => s.target.position !== "after")
                                .map((slot) => (
                                    <InjectedSlotRenderer
                                        key={slot.slot.id}
                                        injectedSlot={slot}
                                        state={state}
                                        showProviderBadge={showProviderBadges}
                                        showDismiss={showDismissButtons}
                                    />
                                ))}

                            {staticSlots.sidebar.map((placement) => (
                                <SlotWithAnchors
                                    key={placement.slot.id}
                                    placement={placement}
                                    state={state}
                                />
                            ))}

                            {computed.sidebar
                                .filter((s) => s.target.position === "after")
                                .map((slot) => (
                                    <InjectedSlotRenderer
                                        key={slot.slot.id}
                                        injectedSlot={slot}
                                        state={state}
                                        showProviderBadge={showProviderBadges}
                                        showDismiss={showDismissButtons}
                                    />
                                ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6" data-testid="layout-main-region">
                        {computed.main
                            .filter((s) => s.target.position !== "after")
                            .map((slot) => (
                                <InjectedSlotRenderer
                                    key={slot.slot.id}
                                    injectedSlot={slot}
                                    state={state}
                                    showProviderBadge={showProviderBadges}
                                    showDismiss={showDismissButtons}
                                />
                            ))}

                        {staticSlots.main.map((placement) => (
                            <SlotWithAnchors
                                key={placement.slot.id}
                                placement={placement}
                                state={state}
                            />
                        ))}

                        {computed.main
                            .filter((s) => s.target.position === "after")
                            .map((slot) => (
                                <InjectedSlotRenderer
                                    key={slot.slot.id}
                                    injectedSlot={slot}
                                    state={state}
                                    showProviderBadge={showProviderBadges}
                                    showDismiss={showDismissButtons}
                                />
                            ))}
                    </div>
                )}

                {/* Footer Region */}
                {(staticSlots.footer.length > 0 || computed.footer.length > 0) && (
                    <div className="mt-8 space-y-6" data-testid="layout-footer-region">
                        {computed.footer
                            .filter((s) => s.target.position !== "after")
                            .map((slot) => (
                                <InjectedSlotRenderer
                                    key={slot.slot.id}
                                    injectedSlot={slot}
                                    state={state}
                                    showProviderBadge={showProviderBadges}
                                    showDismiss={showDismissButtons}
                                />
                            ))}

                        {staticSlots.footer.map((placement) => (
                            <SlotWithAnchors
                                key={placement.slot.id}
                                placement={placement}
                                state={state}
                            />
                        ))}

                        {computed.footer
                            .filter((s) => s.target.position === "after")
                            .map((slot) => (
                                <InjectedSlotRenderer
                                    key={slot.slot.id}
                                    injectedSlot={slot}
                                    state={state}
                                    showProviderBadge={showProviderBadges}
                                    showDismiss={showDismissButtons}
                                />
                            ))}
                    </div>
                )}
            </div>
        </InjectedSlotsContext.Provider>
    );
};

export default EnhancedSlotBasedLayout;
