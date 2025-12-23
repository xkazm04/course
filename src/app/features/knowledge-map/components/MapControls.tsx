"use client";

/**
 * MapControls Component
 *
 * Zoom and navigation controls for the knowledge map.
 */

import React, { memo } from "react";
import { motion } from "framer-motion";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";

interface MapControlsProps {
    scale: number;
    minScale?: number;
    maxScale?: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
    onFitToContent?: () => void;
    className?: string;
}

const ControlButton: React.FC<{
    onClick: () => void;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
}> = memo(function ControlButton({ onClick, disabled, title, children }) {
    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={cn(
                "w-9 h-9 flex items-center justify-center rounded-lg transition-colors",
                disabled
                    ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
            )}
            whileHover={!disabled ? { scale: 1.05 } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
        >
            {children}
        </motion.button>
    );
});

export const MapControls: React.FC<MapControlsProps> = memo(function MapControls({
    scale,
    minScale = 0.5,
    maxScale = 2.0,
    onZoomIn,
    onZoomOut,
    onReset,
    onFitToContent,
    className,
}) {
    const scalePercent = Math.round(scale * 100);
    const canZoomIn = scale < maxScale;
    const canZoomOut = scale > minScale;

    return (
        <div
            className={cn(
                "flex flex-col gap-1 p-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700 shadow-md",
                className
            )}
        >
            {/* Zoom in */}
            <ControlButton
                onClick={onZoomIn}
                disabled={!canZoomIn}
                title="Zoom in"
            >
                <ZoomIn size={ICON_SIZES.sm} />
            </ControlButton>

            {/* Scale indicator */}
            <div className="flex items-center justify-center h-9 text-xs font-medium text-slate-600 dark:text-slate-400">
                {scalePercent}%
            </div>

            {/* Zoom out */}
            <ControlButton
                onClick={onZoomOut}
                disabled={!canZoomOut}
                title="Zoom out"
            >
                <ZoomOut size={ICON_SIZES.sm} />
            </ControlButton>

            {/* Divider */}
            <div className="h-px bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* Reset */}
            <ControlButton
                onClick={onReset}
                title="Reset view"
            >
                <RotateCcw size={ICON_SIZES.sm} />
            </ControlButton>

            {/* Fit to content */}
            {onFitToContent && (
                <ControlButton
                    onClick={onFitToContent}
                    title="Fit to content"
                >
                    <Maximize2 size={ICON_SIZES.sm} />
                </ControlButton>
            )}
        </div>
    );
});

export default MapControls;
