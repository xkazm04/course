/**
 * Universe Camera Hook
 *
 * Manages camera state (pan, zoom) with smooth animations and zoom level transitions.
 * Handles both mouse wheel/drag and pinch-to-zoom interactions.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { CameraState, ZoomLevel } from "./types";
import { ZOOM_LEVEL_CONFIGS } from "./types";

// ============================================================================
// CAMERA CONFIGURATION
// ============================================================================

interface CameraConfig {
    minScale: number;
    maxScale: number;
    zoomSensitivity: number;
    panSensitivity: number;
    animationDuration: number;
    animationEasing: (t: number) => number;
}

const DEFAULT_CAMERA_CONFIG: CameraConfig = {
    minScale: 0.1,
    maxScale: 4.0,
    zoomSensitivity: 0.002,
    panSensitivity: 1,
    animationDuration: 300,
    animationEasing: (t) => 1 - Math.pow(1 - t, 3), // Ease out cubic
};

// ============================================================================
// ZOOM LEVEL DETECTION
// ============================================================================

/**
 * Determine current zoom level from scale
 */
export function getZoomLevelFromScale(scale: number): ZoomLevel {
    for (const config of ZOOM_LEVEL_CONFIGS) {
        if (scale >= config.minScale && scale < config.maxScale) {
            return config.level;
        }
    }
    return scale < ZOOM_LEVEL_CONFIGS[0].minScale ? "galaxy" : "star";
}

/**
 * Get scale for a target zoom level
 */
export function getScaleForZoomLevel(level: ZoomLevel): number {
    const config = ZOOM_LEVEL_CONFIGS.find((c) => c.level === level);
    if (!config) return 1;
    return (config.minScale + config.maxScale) / 2;
}

// ============================================================================
// CAMERA HOOK
// ============================================================================

export interface UseUniverseCameraOptions {
    initialX?: number;
    initialY?: number;
    initialScale?: number;
    config?: Partial<CameraConfig>;
}

export interface UseUniverseCameraReturn {
    camera: CameraState;
    zoomLevel: ZoomLevel;
    isPanning: boolean;

    // Camera controls
    pan: (deltaX: number, deltaY: number) => void;
    zoom: (delta: number, centerX?: number, centerY?: number) => void;
    zoomTo: (targetScale: number, x?: number, y?: number) => void;
    panTo: (x: number, y: number) => void;
    focusOn: (x: number, y: number, scale?: number) => void;
    reset: () => void;

    // Zoom level controls
    setZoomLevel: (level: ZoomLevel) => void;

    // Event handlers
    handleWheel: (e: WheelEvent) => void;
    handlePanStart: (x: number, y: number) => void;
    handlePanMove: (x: number, y: number) => void;
    handlePanEnd: () => void;

    // Utilities
    screenToWorld: (screenX: number, screenY: number, viewportWidth: number, viewportHeight: number) => { x: number; y: number };
    worldToScreen: (worldX: number, worldY: number, viewportWidth: number, viewportHeight: number) => { x: number; y: number };
}

export function useUniverseCamera(
    options: UseUniverseCameraOptions = {}
): UseUniverseCameraReturn {
    const {
        initialX = 0,
        initialY = 0,
        initialScale = 0.5,
        config: userConfig = {},
    } = options;

    const config = { ...DEFAULT_CAMERA_CONFIG, ...userConfig };

    // Camera state
    const [camera, setCamera] = useState<CameraState>({
        x: initialX,
        y: initialY,
        scale: initialScale,
        targetX: initialX,
        targetY: initialY,
        targetScale: initialScale,
    });

    // Panning state
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef<{ x: number; y: number; cameraX: number; cameraY: number } | null>(null);

    // Animation state
    const animationRef = useRef<number | null>(null);
    const animationStartRef = useRef<{ x: number; y: number; scale: number } | null>(null);
    const animationStartTimeRef = useRef<number>(0);

    // Derived zoom level
    const zoomLevel = getZoomLevelFromScale(camera.scale);

    // ========================================================================
    // ANIMATION
    // ========================================================================

    const animate = useCallback(() => {
        if (!animationStartRef.current) return;

        const elapsed = Date.now() - animationStartTimeRef.current;
        const progress = Math.min(elapsed / config.animationDuration, 1);
        const eased = config.animationEasing(progress);

        setCamera((prev) => {
            const start = animationStartRef.current!;
            const newX = start.x + (prev.targetX - start.x) * eased;
            const newY = start.y + (prev.targetY - start.y) * eased;
            const newScale = start.scale + (prev.targetScale - start.scale) * eased;

            return {
                ...prev,
                x: newX,
                y: newY,
                scale: newScale,
            };
        });

        if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
        } else {
            animationRef.current = null;
            animationStartRef.current = null;
        }
    }, [config.animationDuration, config.animationEasing]);

    const startAnimation = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        animationStartRef.current = {
            x: camera.x,
            y: camera.y,
            scale: camera.scale,
        };
        animationStartTimeRef.current = Date.now();
        animationRef.current = requestAnimationFrame(animate);
    }, [camera.x, camera.y, camera.scale, animate]);

    // ========================================================================
    // CAMERA CONTROLS
    // ========================================================================

    const pan = useCallback((deltaX: number, deltaY: number) => {
        setCamera((prev) => ({
            ...prev,
            x: prev.x - deltaX / prev.scale,
            y: prev.y - deltaY / prev.scale,
            targetX: prev.targetX - deltaX / prev.scale,
            targetY: prev.targetY - deltaY / prev.scale,
        }));
    }, []);

    const zoom = useCallback(
        (delta: number, centerX?: number, centerY?: number) => {
            setCamera((prev) => {
                const scaleFactor = 1 - delta * config.zoomSensitivity;
                const newScale = Math.max(
                    config.minScale,
                    Math.min(config.maxScale, prev.scale * scaleFactor)
                );

                // Zoom toward center point if provided
                let newX = prev.x;
                let newY = prev.y;

                if (centerX !== undefined && centerY !== undefined) {
                    const scaleRatio = newScale / prev.scale;
                    newX = centerX - (centerX - prev.x) * scaleRatio;
                    newY = centerY - (centerY - prev.y) * scaleRatio;
                }

                return {
                    ...prev,
                    x: newX,
                    y: newY,
                    scale: newScale,
                    targetX: newX,
                    targetY: newY,
                    targetScale: newScale,
                };
            });
        },
        [config.minScale, config.maxScale, config.zoomSensitivity]
    );

    const zoomTo = useCallback(
        (targetScale: number, x?: number, y?: number) => {
            setCamera((prev) => ({
                ...prev,
                targetX: x ?? prev.targetX,
                targetY: y ?? prev.targetY,
                targetScale: Math.max(config.minScale, Math.min(config.maxScale, targetScale)),
            }));
            startAnimation();
        },
        [config.minScale, config.maxScale, startAnimation]
    );

    const panTo = useCallback(
        (x: number, y: number) => {
            setCamera((prev) => ({
                ...prev,
                targetX: x,
                targetY: y,
            }));
            startAnimation();
        },
        [startAnimation]
    );

    const focusOn = useCallback(
        (x: number, y: number, scale?: number) => {
            setCamera((prev) => ({
                ...prev,
                targetX: x,
                targetY: y,
                targetScale: scale ?? prev.targetScale,
            }));
            startAnimation();
        },
        [startAnimation]
    );

    const reset = useCallback(() => {
        setCamera((prev) => ({
            ...prev,
            targetX: initialX,
            targetY: initialY,
            targetScale: initialScale,
        }));
        startAnimation();
    }, [initialX, initialY, initialScale, startAnimation]);

    const setZoomLevel = useCallback(
        (level: ZoomLevel) => {
            const targetScale = getScaleForZoomLevel(level);
            zoomTo(targetScale);
        },
        [zoomTo]
    );

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    const handleWheel = useCallback(
        (e: WheelEvent) => {
            e.preventDefault();
            zoom(e.deltaY);
        },
        [zoom]
    );

    const handlePanStart = useCallback((x: number, y: number) => {
        setIsPanning(true);
        panStartRef.current = {
            x,
            y,
            cameraX: camera.x,
            cameraY: camera.y,
        };
    }, [camera.x, camera.y]);

    const handlePanMove = useCallback(
        (x: number, y: number) => {
            if (!panStartRef.current || !isPanning) return;

            const deltaX = x - panStartRef.current.x;
            const deltaY = y - panStartRef.current.y;

            setCamera((prev) => ({
                ...prev,
                x: panStartRef.current!.cameraX - deltaX / prev.scale,
                y: panStartRef.current!.cameraY - deltaY / prev.scale,
                targetX: panStartRef.current!.cameraX - deltaX / prev.scale,
                targetY: panStartRef.current!.cameraY - deltaY / prev.scale,
            }));
        },
        [isPanning]
    );

    const handlePanEnd = useCallback(() => {
        setIsPanning(false);
        panStartRef.current = null;
    }, []);

    // ========================================================================
    // COORDINATE TRANSFORMS
    // ========================================================================

    const screenToWorld = useCallback(
        (screenX: number, screenY: number, viewportWidth: number, viewportHeight: number) => {
            return {
                x: camera.x + (screenX - viewportWidth / 2) / camera.scale,
                y: camera.y + (screenY - viewportHeight / 2) / camera.scale,
            };
        },
        [camera.x, camera.y, camera.scale]
    );

    const worldToScreen = useCallback(
        (worldX: number, worldY: number, viewportWidth: number, viewportHeight: number) => {
            return {
                x: (worldX - camera.x) * camera.scale + viewportWidth / 2,
                y: (worldY - camera.y) * camera.scale + viewportHeight / 2,
            };
        },
        [camera.x, camera.y, camera.scale]
    );

    // Cleanup animation on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return {
        camera,
        zoomLevel,
        isPanning,
        pan,
        zoom,
        zoomTo,
        panTo,
        focusOn,
        reset,
        setZoomLevel,
        handleWheel,
        handlePanStart,
        handlePanMove,
        handlePanEnd,
        screenToWorld,
        worldToScreen,
    };
}
