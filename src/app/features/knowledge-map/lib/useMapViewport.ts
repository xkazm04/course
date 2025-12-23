"use client";

/**
 * useMapViewport Hook
 *
 * Manages viewport state (pan/zoom) for the knowledge map.
 * Simplified from the original infinite canvas implementation.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { ViewportState, Point } from "./types";

// Viewport constraints
const MIN_SCALE = 0.5;
const MAX_SCALE = 2.0;
const ZOOM_SPEED = 0.002;

export interface UseMapViewportOptions {
    /** Initial viewport state */
    initialViewport?: Partial<ViewportState>;
    /** Callback when viewport changes */
    onViewportChange?: (viewport: ViewportState) => void;
}

export interface UseMapViewportReturn {
    /** Current viewport state */
    viewport: ViewportState;
    /** Update viewport */
    setViewport: (viewport: ViewportState) => void;
    /** Pan by delta */
    panBy: (deltaX: number, deltaY: number) => void;
    /** Zoom by delta at a point */
    zoomBy: (delta: number, centerX: number, centerY: number) => void;
    /** Zoom to a specific scale at a point */
    zoomTo: (scale: number, centerX?: number, centerY?: number) => void;
    /** Reset viewport to default */
    resetViewport: () => void;
    /** Gesture event handlers for the canvas */
    handlers: {
        onPointerDown: (e: React.PointerEvent) => void;
        onPointerMove: (e: React.PointerEvent) => void;
        onPointerUp: (e: React.PointerEvent) => void;
        onPointerLeave: (e: React.PointerEvent) => void;
        onWheel: (e: React.WheelEvent) => void;
    };
    /** Is currently panning */
    isPanning: boolean;
}

const DEFAULT_VIEWPORT: ViewportState = {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
};

/**
 * Hook for managing viewport pan/zoom
 */
export function useMapViewport(
    options: UseMapViewportOptions = {}
): UseMapViewportReturn {
    const { initialViewport, onViewportChange } = options;

    const [viewport, setViewportState] = useState<ViewportState>({
        ...DEFAULT_VIEWPORT,
        ...initialViewport,
    });

    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef<Point | null>(null);
    const lastViewportRef = useRef<ViewportState>(viewport);

    // Keep ref in sync
    useEffect(() => {
        lastViewportRef.current = viewport;
    }, [viewport]);

    // Update viewport with callback
    const setViewport = useCallback(
        (newViewport: ViewportState) => {
            setViewportState(newViewport);
            onViewportChange?.(newViewport);
        },
        [onViewportChange]
    );

    // Pan by delta
    const panBy = useCallback(
        (deltaX: number, deltaY: number) => {
            setViewport({
                ...lastViewportRef.current,
                offsetX: lastViewportRef.current.offsetX - deltaX / lastViewportRef.current.scale,
                offsetY: lastViewportRef.current.offsetY - deltaY / lastViewportRef.current.scale,
            });
        },
        [setViewport]
    );

    // Zoom by delta at a center point
    const zoomBy = useCallback(
        (delta: number, centerX: number, centerY: number) => {
            const currentScale = lastViewportRef.current.scale;
            const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, currentScale - delta * ZOOM_SPEED));

            if (newScale === currentScale) return;

            // Zoom toward the center point
            const scaleFactor = newScale / currentScale;
            const newOffsetX = centerX - (centerX - lastViewportRef.current.offsetX) * scaleFactor;
            const newOffsetY = centerY - (centerY - lastViewportRef.current.offsetY) * scaleFactor;

            setViewport({
                scale: newScale,
                offsetX: newOffsetX,
                offsetY: newOffsetY,
            });
        },
        [setViewport]
    );

    // Zoom to a specific scale
    const zoomTo = useCallback(
        (scale: number, centerX?: number, centerY?: number) => {
            const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
            const cx = centerX ?? 0;
            const cy = centerY ?? 0;

            const currentScale = lastViewportRef.current.scale;
            const scaleFactor = newScale / currentScale;
            const newOffsetX = cx - (cx - lastViewportRef.current.offsetX) * scaleFactor;
            const newOffsetY = cy - (cy - lastViewportRef.current.offsetY) * scaleFactor;

            setViewport({
                scale: newScale,
                offsetX: newOffsetX,
                offsetY: newOffsetY,
            });
        },
        [setViewport]
    );

    // Reset viewport
    const resetViewport = useCallback(() => {
        setViewport({ ...DEFAULT_VIEWPORT, ...initialViewport });
    }, [setViewport, initialViewport]);

    // Pointer event handlers
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (e.button !== 0) return; // Only left mouse button

        panStartRef.current = { x: e.clientX, y: e.clientY };
        setIsPanning(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, []);

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (!isPanning || !panStartRef.current) return;

            const deltaX = e.clientX - panStartRef.current.x;
            const deltaY = e.clientY - panStartRef.current.y;

            panStartRef.current = { x: e.clientX, y: e.clientY };
            panBy(deltaX, deltaY);
        },
        [isPanning, panBy]
    );

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        setIsPanning(false);
        panStartRef.current = null;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }, []);

    const handlePointerLeave = useCallback(() => {
        if (isPanning) {
            setIsPanning(false);
            panStartRef.current = null;
        }
    }, [isPanning]);

    const handleWheel = useCallback(
        (e: React.WheelEvent) => {
            e.preventDefault();
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            const centerX = e.clientX - rect.left;
            const centerY = e.clientY - rect.top;
            zoomBy(e.deltaY, centerX, centerY);
        },
        [zoomBy]
    );

    return {
        viewport,
        setViewport,
        panBy,
        zoomBy,
        zoomTo,
        resetViewport,
        handlers: {
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp: handlePointerUp,
            onPointerLeave: handlePointerLeave,
            onWheel: handleWheel,
        },
        isPanning,
    };
}
