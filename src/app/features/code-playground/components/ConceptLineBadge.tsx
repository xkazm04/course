"use client";

import React from "react";
import { cn } from "@/app/shared/lib/utils";
import type { Concept } from "../lib/conceptBridge";
import { getConceptColor } from "../lib/conceptBridge";

export interface ConceptLineBadgeProps {
    /** Concepts linked to this line */
    concepts: Concept[];
    /** Line number */
    lineNumber: number;
    /** Callback when badge is clicked */
    onClick?: (lineNumber: number, concepts: Concept[]) => void;
    /** Callback when badge is hovered */
    onHover?: (lineNumber: number | null) => void;
    /** Whether the badge is currently highlighted */
    isHighlighted?: boolean;
}

/**
 * Small indicator badge shown in the line number gutter for concept-linked lines
 */
export function ConceptLineBadge({
    concepts,
    lineNumber,
    onClick,
    onHover,
    isHighlighted = false,
}: ConceptLineBadgeProps) {
    if (concepts.length === 0) return null;

    // Get colors for all concepts
    const colors = concepts.map(
        (c) => c.color || getConceptColor(c.id)
    );
    const primaryColor = colors[0];

    // For multiple concepts, create a gradient or multi-dot display
    const hasMultiple = concepts.length > 1;

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick?.(lineNumber, concepts);
            }}
            onMouseEnter={() => onHover?.(lineNumber)}
            onMouseLeave={() => onHover?.(null)}
            className={cn(
                "flex items-center justify-center gap-0.5",
                "w-3 h-3 shrink-0",
                "transition-all duration-150",
                "hover:scale-125 hover:ring-2 hover:ring-offset-1",
                "cursor-pointer",
                isHighlighted && "scale-110 ring-2 ring-offset-1"
            )}
            style={{
                // @ts-expect-error CSS custom property
                "--tw-ring-color": `${primaryColor}50`,
                "--tw-ring-offset-color": "transparent",
            }}
            title={concepts.map((c) => c.name).join(", ")}
            data-testid={`concept-badge-${lineNumber}`}
        >
            {hasMultiple ? (
                // Multiple concept indicator - stacked dots
                <div className="relative w-2.5 h-2.5">
                    {colors.slice(0, 3).map((color, i) => (
                        <div
                            key={i}
                            className="absolute w-1.5 h-1.5 rounded-full"
                            style={{
                                backgroundColor: color,
                                top: `${i * 2}px`,
                                left: `${i * 2}px`,
                                zIndex: 3 - i,
                            }}
                        />
                    ))}
                </div>
            ) : (
                // Single concept indicator
                <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: primaryColor }}
                />
            )}
        </button>
    );
}

export default ConceptLineBadge;
