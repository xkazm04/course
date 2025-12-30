"use client";

import { motion } from "framer-motion";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import type { ViewportState } from "../lib/types";
import { MIN_SCALE, MAX_SCALE } from "../lib/hexUtils";

interface ZoomControlsProps {
    viewport: ViewportState;
    setViewport: (v: ViewportState | ((prev: ViewportState) => ViewportState)) => void;
}

export function ZoomControls({ viewport, setViewport }: ZoomControlsProps) {
    const zoomPercent = Math.round(viewport.scale * 100);

    const handleZoom = (delta: number) => {
        setViewport(prev => ({
            ...prev,
            scale: Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * delta)),
        }));
    };

    const handleReset = () => {
        setViewport({ scale: 1, offsetX: 0, offsetY: 0 });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 z-30"
        >
            <div className="flex items-center gap-1 bg-[var(--forge-bg-elevated)]/95 backdrop-blur-sm rounded-xl
                           border border-[var(--forge-border-subtle)] shadow-lg p-1">
                {/* Zoom out */}
                <button
                    onClick={() => handleZoom(0.8)}
                    disabled={viewport.scale <= MIN_SCALE}
                    className="p-2 rounded-lg hover:bg-[var(--forge-bg-elevated)] disabled:opacity-40
                              disabled:cursor-not-allowed transition-colors group relative"
                    title="Zoom out (-)"
                >
                    <ZoomOut className="w-4 h-4 text-[var(--forge-text-secondary)]" />
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded
                                   text-xs bg-[var(--forge-text-primary)] text-white opacity-0 group-hover:opacity-100
                                   transition-opacity pointer-events-none whitespace-nowrap">
                        Press -
                    </span>
                </button>

                {/* Zoom level indicator */}
                <button
                    onClick={handleReset}
                    className="px-3 py-1.5 min-w-[60px] text-sm font-medium text-[var(--forge-text-secondary)]
                              hover:bg-[var(--forge-bg-elevated)] rounded-lg transition-colors"
                    title="Reset zoom"
                >
                    {zoomPercent}%
                </button>

                {/* Zoom in */}
                <button
                    onClick={() => handleZoom(1.25)}
                    disabled={viewport.scale >= MAX_SCALE}
                    className="p-2 rounded-lg hover:bg-[var(--forge-bg-elevated)] disabled:opacity-40
                              disabled:cursor-not-allowed transition-colors group relative"
                    title="Zoom in (+)"
                >
                    <ZoomIn className="w-4 h-4 text-[var(--forge-text-secondary)]" />
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded
                                   text-xs bg-[var(--forge-text-primary)] text-white opacity-0 group-hover:opacity-100
                                   transition-opacity pointer-events-none whitespace-nowrap">
                        Press +
                    </span>
                </button>

                {/* Divider */}
                <div className="w-px h-6 bg-[var(--forge-border-subtle)] mx-1" />

                {/* Fit to view */}
                <button
                    onClick={handleReset}
                    className="p-2 rounded-lg hover:bg-[var(--forge-bg-elevated)] transition-colors"
                    title="Fit to view"
                >
                    <Maximize2 className="w-4 h-4 text-[var(--forge-text-secondary)]" />
                </button>
            </div>
        </motion.div>
    );
}
