"use client";

import React from "react";
import { cn } from "@/app/shared/lib/utils";
import { GripVertical } from "lucide-react";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";

interface DragHandleProps {
    /** Whether currently being dragged */
    isDragging: boolean;
    /** Callback when drag starts */
    onDragStart: () => void;
    /** Callback when double-clicked to reset */
    onDoubleClick: () => void;
    /** Additional class names */
    className?: string;
}

export function DragHandle({
    isDragging,
    onDragStart,
    onDoubleClick,
    className,
}: DragHandleProps) {
    return (
        <div
            className={cn(
                // Base styles
                "relative flex items-center justify-center shrink-0",
                "w-2 cursor-col-resize select-none",
                "transition-all duration-150 ease-out",
                // Background and border
                "bg-[var(--forge-border-subtle)]",
                // Hover state
                "hover:bg-[var(--ember)]/30 hover:w-3",
                // Active/dragging state
                isDragging && "bg-[var(--ember)]/50 w-3 shadow-[0_0_12px_var(--ember)]",
                className
            )}
            onMouseDown={(e) => {
                e.preventDefault();
                onDragStart();
            }}
            onDoubleClick={onDoubleClick}
            data-testid="split-pane-drag-handle"
            title="Drag to resize • Double-click to reset"
        >
            {/* Visual grip indicator */}
            <div
                className={cn(
                    "absolute inset-y-0 flex items-center justify-center",
                    "opacity-0 transition-opacity duration-150",
                    "hover:opacity-100",
                    isDragging && "opacity-100"
                )}
            >
                <GripVertical
                    size={ICON_SIZES.sm}
                    className={cn(
                        "text-[var(--forge-text-muted)]",
                        isDragging && "text-[var(--ember)]"
                    )}
                />
            </div>

            {/* Subtle glow effect on hover/drag */}
            <div
                className={cn(
                    "absolute inset-0 pointer-events-none",
                    "opacity-0 transition-opacity duration-200",
                    "bg-gradient-to-r from-transparent via-[var(--ember)]/20 to-transparent",
                    isDragging && "opacity-100"
                )}
            />
        </div>
    );
}

export default DragHandle;
