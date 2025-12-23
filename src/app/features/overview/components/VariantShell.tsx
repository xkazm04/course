"use client";

import React, { useState, useMemo, useCallback, createContext, useContext, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVariantAnimation, getStaggerDelay, getSpringConfig, type AnimationPreset } from "@/app/shared/hooks";
import { DURATION_NORMAL } from "@/app/shared/lib/motionPrimitives";

/**
 * VariantShell - Composition component that handles common concerns across all overview variants.
 *
 * Extracted patterns:
 * 1. Selection state management (selected item, hover state)
 * 2. Animation orchestration (stagger delays, spring configs, AnimatePresence)
 * 3. Filter/category state
 * 4. Zoom/viewport state
 *
 * Each variant provides only its unique visual renderer via render props.
 */

// Types for the shell's state management
export interface SelectionState<T> {
    selected: T | null;
    hovered: string | null;
    setSelected: (item: T | null) => void;
    setHovered: (id: string | null) => void;
}

export interface FilterState<T> {
    filter: T | null;
    setFilter: (filter: T | null) => void;
    clearFilter: () => void;
}

export interface ZoomState {
    zoom: number;
    setZoom: (zoom: number) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
    minZoom: number;
    maxZoom: number;
    zoomStep: number;
}

export interface AnimationConfig {
    staggerDelay: number;
    springConfig: { stiffness: number; damping: number; mass?: number };
    getItemAnimation: (index: number) => ReturnType<typeof useVariantAnimation>;
    containerAnimation: ReturnType<typeof useVariantAnimation>;
}

// Combined context for all variant shell state
export interface VariantShellContext<TItem, TFilter = string> {
    // Data
    items: TItem[];
    filteredItems: TItem[];

    // Selection
    selection: SelectionState<TItem>;

    // Filtering
    filter: FilterState<TFilter>;

    // Zoom/viewport
    zoom: ZoomState;

    // Animation
    animation: AnimationConfig;
}

// Create the context (generic is resolved at usage)
const VariantShellContextInternal = createContext<VariantShellContext<unknown, unknown> | null>(null);

// Hook to access the shell context
export function useVariantShellContext<TItem, TFilter = string>(): VariantShellContext<TItem, TFilter> {
    const context = useContext(VariantShellContextInternal);
    if (!context) {
        throw new Error("useVariantShellContext must be used within a VariantShell");
    }
    return context as VariantShellContext<TItem, TFilter>;
}

// Props for the VariantShell component
export interface VariantShellProps<TItem, TFilter = string> {
    /** Data items to display */
    items: TItem[];
    /** Initial selected item */
    initialSelected?: TItem | null;
    /** Function to get item ID for hover tracking */
    getItemId: (item: TItem) => string;
    /** Filter function to apply when filter is set */
    filterFn?: (item: TItem, filter: TFilter) => boolean;
    /** Animation preset for stagger delays */
    animationPreset?: AnimationPreset;
    /** Zoom configuration */
    zoomConfig?: {
        initial?: number;
        min?: number;
        max?: number;
        step?: number;
    };
    /** Render prop for the main content */
    children: (context: VariantShellContext<TItem, TFilter>) => ReactNode;
    /** Optional detail panel render prop (wrapped in AnimatePresence) */
    renderDetailPanel?: (item: TItem, onClose: () => void) => ReactNode;
    /** Custom container className */
    className?: string;
}

// Animation wrapper component for consistent AnimatePresence usage
export interface AnimatedPanelProps {
    isVisible: boolean;
    children: ReactNode;
    direction?: "left" | "right" | "up" | "down";
    mode?: "wait" | "sync" | "popLayout";
    className?: string;
}

export function AnimatedPanel({
    isVisible,
    children,
    direction = "right",
    mode = "wait",
    className
}: AnimatedPanelProps) {
    const animation = useVariantAnimation({
        preset: "smooth",
        direction,
        enableExit: true,
    });

    return (
        <AnimatePresence mode={mode}>
            {isVisible && (
                <motion.div
                    initial={animation.initial}
                    animate={animation.animate}
                    exit={animation.exit}
                    transition={animation.transition}
                    className={className}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Animation wrapper for staggered list items
export interface AnimatedItemProps {
    children: ReactNode;
    index: number;
    preset?: AnimationPreset;
    hoverScale?: number;
    className?: string;
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    "data-testid"?: string;
}

export function AnimatedItem({
    children,
    index,
    preset = "stagger-fast",
    hoverScale = 1.02,
    className,
    onClick,
    onMouseEnter,
    onMouseLeave,
    "data-testid": testId,
}: AnimatedItemProps) {
    const animation = useVariantAnimation({
        preset,
        index,
        hoverScale,
    });

    return (
        <motion.div
            initial={animation.initial}
            animate={animation.animate}
            whileHover={animation.whileHover}
            transition={animation.transition}
            className={className}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            data-testid={testId}
        >
            {children}
        </motion.div>
    );
}

// Main VariantShell component
export function VariantShell<TItem, TFilter = string>({
    items,
    initialSelected = null,
    getItemId,
    filterFn,
    animationPreset = "stagger-fast",
    zoomConfig = {},
    children,
    renderDetailPanel,
    className,
}: VariantShellProps<TItem, TFilter>) {
    // Selection state
    const [selected, setSelected] = useState<TItem | null>(initialSelected);
    const [hovered, setHovered] = useState<string | null>(null);

    // Filter state
    const [filter, setFilter] = useState<TFilter | null>(null);
    const clearFilter = useCallback(() => setFilter(null), []);

    // Zoom state
    const {
        initial: initialZoom = 1,
        min: minZoom = 0.5,
        max: maxZoom = 2,
        step: zoomStep = 0.2,
    } = zoomConfig;

    const [zoom, setZoom] = useState(initialZoom);
    const zoomIn = useCallback(() => setZoom(prev => Math.min(prev + zoomStep, maxZoom)), [maxZoom, zoomStep]);
    const zoomOut = useCallback(() => setZoom(prev => Math.max(prev - zoomStep, minZoom)), [minZoom, zoomStep]);
    const resetZoom = useCallback(() => setZoom(initialZoom), [initialZoom]);

    // Filtered items
    const filteredItems = useMemo(() => {
        if (!filter || !filterFn) return items;
        return items.filter(item => filterFn(item, filter));
    }, [items, filter, filterFn]);

    // Animation configuration
    const staggerDelay = getStaggerDelay(animationPreset);
    const springConfig = getSpringConfig("smooth");

    const containerAnimation = useVariantAnimation({
        preset: "fade",
        duration: DURATION_NORMAL,
    });

    const getItemAnimation = useCallback((index: number) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useVariantAnimation({
            preset: animationPreset,
            index,
        });
    }, [animationPreset]);

    // Build context
    const context: VariantShellContext<TItem, TFilter> = useMemo(() => ({
        items,
        filteredItems,
        selection: {
            selected,
            hovered,
            setSelected,
            setHovered,
        },
        filter: {
            filter,
            setFilter,
            clearFilter,
        },
        zoom: {
            zoom,
            setZoom,
            zoomIn,
            zoomOut,
            resetZoom,
            minZoom,
            maxZoom,
            zoomStep,
        },
        animation: {
            staggerDelay,
            springConfig,
            getItemAnimation,
            containerAnimation,
        },
    }), [
        items,
        filteredItems,
        selected,
        hovered,
        filter,
        clearFilter,
        zoom,
        zoomIn,
        zoomOut,
        resetZoom,
        minZoom,
        maxZoom,
        zoomStep,
        staggerDelay,
        springConfig,
        getItemAnimation,
        containerAnimation,
    ]);

    return (
        <VariantShellContextInternal.Provider value={context as VariantShellContext<unknown, unknown>}>
            <div className={className} data-testid="variant-shell">
                {children(context)}

                {/* Optional detail panel with AnimatePresence */}
                {renderDetailPanel && (
                    <AnimatedPanel
                        isVisible={selected !== null}
                        direction="right"
                    >
                        {selected && renderDetailPanel(selected, () => setSelected(null))}
                    </AnimatedPanel>
                )}
            </div>
        </VariantShellContextInternal.Provider>
    );
}

// Helper hook for creating item click/hover handlers
export function useItemHandlers<TItem>(
    item: TItem,
    getItemId: (item: TItem) => string,
) {
    const { selection } = useVariantShellContext<TItem>();

    const handleClick = useCallback(() => {
        selection.setSelected(item);
    }, [selection, item]);

    const handleMouseEnter = useCallback(() => {
        selection.setHovered(getItemId(item));
    }, [selection, getItemId, item]);

    const handleMouseLeave = useCallback(() => {
        selection.setHovered(null);
    }, [selection]);

    const isSelected = selection.selected !== null &&
        getItemId(selection.selected) === getItemId(item);
    const isHovered = selection.hovered === getItemId(item);

    return {
        onClick: handleClick,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        isSelected,
        isHovered,
    };
}

export default VariantShell;
