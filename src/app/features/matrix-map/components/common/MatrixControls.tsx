"use client";

import React from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";

interface MatrixControlsProps {
    scale: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
    minScale?: number;
    maxScale?: number;
    className?: string;
}

export function MatrixControls({
    scale,
    onZoomIn,
    onZoomOut,
    onReset,
    minScale = 0.4,
    maxScale = 2.5,
    className,
}: MatrixControlsProps) {
    const scalePercent = Math.round(scale * 100);
    const canZoomIn = scale < maxScale;
    const canZoomOut = scale > minScale;

    return (
        <div
            className={cn(
                "flex flex-col gap-1 p-1.5 bg-[var(--forge-bg-elevated)]/90 backdrop-blur-sm rounded-xl border border-[var(--forge-border-subtle)] shadow-md",
                className
            )}
        >
            <button
                onClick={onZoomIn}
                disabled={!canZoomIn}
                className={cn(
                    "p-2 rounded-lg transition-colors",
                    canZoomIn
                        ? "text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-anvil)] hover:text-[var(--forge-text-primary)]"
                        : "text-[var(--forge-text-muted)] cursor-not-allowed"
                )}
                title="Zoom in"
            >
                <ZoomIn size={18} />
            </button>

            <div className="px-2 py-1 text-center text-xs font-medium text-[var(--forge-text-secondary)] min-w-[3rem]">
                {scalePercent}%
            </div>

            <button
                onClick={onZoomOut}
                disabled={!canZoomOut}
                className={cn(
                    "p-2 rounded-lg transition-colors",
                    canZoomOut
                        ? "text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-anvil)] hover:text-[var(--forge-text-primary)]"
                        : "text-[var(--forge-text-muted)] cursor-not-allowed"
                )}
                title="Zoom out"
            >
                <ZoomOut size={18} />
            </button>

            <div className="h-px bg-[var(--forge-border-subtle)] my-1" />

            <button
                onClick={onReset}
                className="p-2 rounded-lg text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-anvil)] hover:text-[var(--forge-text-primary)] transition-colors"
                title="Reset view"
            >
                <Maximize2 size={18} />
            </button>
        </div>
    );
}
