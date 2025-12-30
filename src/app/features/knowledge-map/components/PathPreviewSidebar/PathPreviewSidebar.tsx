"use client";

/**
 * PathPreviewSidebar Component
 *
 * Right sidebar showing the generated learning path preview.
 * Displays modules, milestones, and confirmation actions.
 */

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { X, Sparkles, Clock, BookOpen, Loader2, Check } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { PathModuleCard } from "./PathModuleCard";
import { PathMilestoneMarker } from "./PathMilestoneMarker";
import type { PredictiveLearningPath } from "@/app/features/goal-path/lib/predictiveTypes";
import type { HypotheticalMapNode } from "../../lib/types";

// ============================================================================
// TYPES
// ============================================================================

export interface PathPreviewSidebarProps {
    /** Generated learning path */
    path: PredictiveLearningPath;
    /** Hypothetical nodes to be created */
    hypotheticalNodes: HypotheticalMapNode[];
    /** Recommended existing node IDs */
    recommendedNodeIds: Set<string>;
    /** Close sidebar */
    onClose: () => void;
    /** Confirm and create path */
    onConfirm: () => Promise<void>;
    /** Whether confirmation is in progress */
    isConfirming: boolean;
    /** Callback when hovering over a module */
    onModuleHover?: (moduleId: string | null) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PathPreviewSidebar({
    path,
    hypotheticalNodes,
    recommendedNodeIds,
    onClose,
    onConfirm,
    isConfirming,
    onModuleHover,
}: PathPreviewSidebarProps) {
    // Calculate stats
    const stats = useMemo(() => {
        const totalHours = path.modules.reduce((sum, m) => sum + m.estimatedHours, 0);
        const moduleCount = path.modules.length;
        const newNodesCount = hypotheticalNodes.length;
        const existingNodesCount = recommendedNodeIds.size;

        return { totalHours, moduleCount, newNodesCount, existingNodesCount };
    }, [path.modules, hypotheticalNodes, recommendedNodeIds]);

    // Find milestone positions
    const milestonesWithModules = useMemo(() => {
        return path.milestones.map(milestone => {
            // Find the module index closest to this milestone
            const moduleIndex = Math.min(
                Math.floor((milestone.targetWeek / path.estimatedWeeks) * path.modules.length),
                path.modules.length - 1
            );
            return { ...milestone, moduleIndex };
        });
    }, [path.milestones, path.modules.length, path.estimatedWeeks]);

    return (
        <div
            className={cn(
                "w-[320px] h-full flex flex-col",
                "bg-[var(--forge-bg-elevated)]",
                "border-l border-[var(--forge-border-subtle)]",
                "shadow-lg z-40 overflow-hidden"
            )}
            data-testid="path-preview-sidebar"
        >
            {/* Header */}
            <div className={cn(
                "p-4 border-b flex items-center justify-between",
                "border-[var(--forge-border-subtle)]",
                "bg-[var(--forge-bg-anvil)]"
            )}>
                <div>
                    <h3 className="font-semibold text-[var(--forge-text-primary)]">
                        Your Learning Path
                    </h3>
                    <p className="text-xs mt-0.5 text-[var(--forge-text-secondary)]">
                        {path.modules.length} modules • {stats.totalHours} hours
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg transition-colors hover:bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)]"
                >
                    <X size={ICON_SIZES.sm} />
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 p-4 pt-0 mt-4">
                <div className="text-center p-2 rounded-lg bg-[var(--forge-bg-anvil)]">
                    <div className="flex items-center justify-center gap-1 mb-0.5 text-[var(--forge-text-secondary)]">
                        <BookOpen size={12} />
                    </div>
                    <p className="text-sm font-bold text-[var(--forge-text-primary)]">
                        {stats.moduleCount}
                    </p>
                    <p className="text-xs text-[var(--forge-text-secondary)]">Modules</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-[var(--forge-bg-anvil)]">
                    <div className="flex items-center justify-center gap-1 mb-0.5 text-[var(--forge-text-secondary)]">
                        <Clock size={12} />
                    </div>
                    <p className="text-sm font-bold text-[var(--forge-text-primary)]">
                        {stats.totalHours}
                    </p>
                    <p className="text-xs text-[var(--forge-text-secondary)]">Hours</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-[var(--forge-bg-anvil)]">
                    <div className="flex items-center justify-center gap-1 mb-0.5 text-[var(--forge-text-secondary)]">
                        <Sparkles size={12} />
                    </div>
                    <p className="text-sm font-bold text-[var(--forge-text-primary)]">
                        {stats.newNodesCount}
                    </p>
                    <p className="text-xs text-[var(--forge-text-secondary)]">New</p>
                </div>
            </div>

            {/* Module list */}
            <div className="flex-1 overflow-y-auto p-4 pt-0">
                <div className="space-y-3">
                    {path.modules.map((module, index) => {
                        // Check if there's a milestone after this module
                        const milestoneAfter = milestonesWithModules.find(
                            m => m.moduleIndex === index
                        );

                        // Check if this module creates a new node
                        const isHypothetical = hypotheticalNodes.some(
                            h => h.sourceModuleId === module.id
                        );

                        return (
                            <React.Fragment key={module.id}>
                                <PathModuleCard
                                    module={module}
                                    index={index}
                                    isHypothetical={isHypothetical}
                                    onHover={(isHovering) =>
                                        onModuleHover?.(isHovering ? module.id : null)
                                    }
                                />

                                {milestoneAfter && index < path.modules.length - 1 && (
                                    <PathMilestoneMarker milestone={milestoneAfter} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Footer with confirm button */}
            <div className="p-4 border-t border-[var(--forge-border-subtle)]">
                <button
                    onClick={onConfirm}
                    disabled={isConfirming}
                    className={cn(
                        "w-full flex items-center justify-center gap-2",
                        "px-4 py-3 rounded-xl",
                        "text-sm font-semibold",
                        "transition-all duration-200",
                        isConfirming
                            ? "bg-[var(--forge-bg-anvil)] text-[var(--forge-text-muted)] cursor-wait"
                            : "bg-[var(--ember)] text-white hover:opacity-90"
                    )}
                    data-testid="confirm-path-btn"
                >
                    {isConfirming ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Creating nodes...
                        </>
                    ) : (
                        <>
                            <Check size={16} />
                            Confirm & Add to Map
                        </>
                    )}
                </button>

                <p className="text-xs text-center mt-2 text-[var(--forge-text-secondary)]">
                    This will add {stats.newNodesCount} new courses to your knowledge map
                </p>
            </div>
        </div>
    );
}
