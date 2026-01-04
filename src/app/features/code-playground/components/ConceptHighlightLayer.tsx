"use client";

import React from "react";
import { cn } from "@/app/shared/lib/utils";
import type { ConceptCodeRegion, Concept } from "../lib/conceptBridge";
import { getConceptColor } from "../lib/conceptBridge";

export interface ConceptHighlightLayerProps {
    /** All concept regions for the current file */
    regions: ConceptCodeRegion[];
    /** The currently active concept ID (highlighted from content) */
    activeConceptId: string | null;
    /** The currently hovered line number */
    hoveredLine: number | null;
    /** Whether concept highlighting is enabled */
    isEnabled: boolean;
    /** Concept definitions map */
    concepts?: Map<string, Concept>;
    /** Line height in pixels */
    lineHeight?: number;
    /** Top padding in pixels */
    topPadding?: number;
}

/**
 * Renders a transparent overlay layer with concept region highlights
 */
export function ConceptHighlightLayer({
    regions,
    activeConceptId,
    hoveredLine,
    isEnabled,
    concepts = new Map(),
    lineHeight = 24,
    topPadding = 12,
}: ConceptHighlightLayerProps) {
    if (!isEnabled || regions.length === 0) return null;

    // Group regions by their primary concept for coloring
    const getRegionColor = (region: ConceptCodeRegion): string => {
        const primaryConceptId = region.conceptIds[0];
        if (!primaryConceptId) return "transparent";

        const concept = concepts.get(primaryConceptId);
        return concept?.color || getConceptColor(primaryConceptId);
    };

    // Determine if a region should be highlighted
    const isRegionActive = (region: ConceptCodeRegion): boolean => {
        if (activeConceptId && region.conceptIds.includes(activeConceptId)) {
            return true;
        }
        return false;
    };

    // Determine if a region is being hovered
    const isRegionHovered = (region: ConceptCodeRegion): boolean => {
        if (hoveredLine === null) return false;
        return hoveredLine >= region.startLine && hoveredLine <= region.endLine;
    };

    return (
        <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            aria-hidden="true"
            data-testid="concept-highlight-layer"
        >
            {regions.map((region, index) => {
                const color = getRegionColor(region);
                const isActive = isRegionActive(region);
                const isHovered = isRegionHovered(region);
                const showHighlight = isActive || isHovered;

                // Calculate position
                const top = topPadding + (region.startLine - 1) * lineHeight;
                const height = (region.endLine - region.startLine + 1) * lineHeight;

                return (
                    <div
                        key={`${region.fileId}-${region.startLine}-${region.endLine}-${index}`}
                        className={cn(
                            "absolute left-0 right-0 transition-all duration-200",
                            showHighlight ? "opacity-100" : "opacity-0"
                        )}
                        style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            backgroundColor: color,
                            opacity: showHighlight ? (isActive ? 0.15 : 0.08) : 0,
                            borderLeft: showHighlight ? `3px solid ${color}` : "none",
                        }}
                        data-testid={`concept-region-${region.startLine}-${region.endLine}`}
                    />
                );
            })}
        </div>
    );
}

export default ConceptHighlightLayer;
