"use client";

/**
 * PathPreviewSidebar Component
 *
 * Right sidebar showing the generated learning path preview.
 * Displays modules, milestones, and confirmation actions.
 * Features orchestrated staggered animations for a polished reveal sequence.
 */

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { X, Sparkles, Clock, BookOpen, Loader2, Check } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { PathModuleCard } from "./PathModuleCard";
import { PathMilestoneMarker } from "./PathMilestoneMarker";
import { AnimatedCounter } from "./AnimatedCounter";
import { PathEffectivenessScore } from "./PathEffectivenessScore";
import type { PredictiveLearningPath } from "@/app/features/goal-path/lib/predictiveTypes";
import type { HypotheticalMapNode } from "../../lib/types";

// ============================================================================
// ANIMATION CONSTANTS
// ============================================================================

/** Base delay before any animations start */
const ANIMATION_BASE_DELAY = 0.1;

/** Delay increment between stats items */
const STATS_STAGGER_DELAY = 0.08;

/** Total duration for stats section animation */
const STATS_ANIMATION_DURATION = 0.4;

/** Delay before module cards start animating (after stats complete) */
const MODULE_START_DELAY = ANIMATION_BASE_DELAY + (STATS_STAGGER_DELAY * 3) + STATS_ANIMATION_DURATION;

/** Delay increment between module cards */
const MODULE_STAGGER_DELAY = 0.05;

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

        // Calculate path completion potential as a percentage
        // This represents how much of the learning journey this path covers
        const totalNodes = newNodesCount + existingNodesCount;
        const completionPotential = totalNodes > 0
            ? Math.round((newNodesCount / Math.max(totalNodes, moduleCount)) * 100)
            : 0;

        return { totalHours, moduleCount, newNodesCount, existingNodesCount, completionPotential };
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
                    data-testid="path-preview-close-btn"
                >
                    <X size={ICON_SIZES.sm} />
                </button>
            </div>

            {/* Path Effectiveness Score - Compound Outcome Metric */}
            <div className="p-4 pt-0 mt-4 space-y-3" data-testid="path-stats-section">
                {/* Main effectiveness score with drill-down */}
                <PathEffectivenessScore
                    path={path}
                    animationDelay={ANIMATION_BASE_DELAY}
                />

                {/* Compact stats row - supporting metrics */}
                <motion.div
                    className={cn(
                        "flex items-center justify-between gap-2 px-3 py-2 rounded-lg",
                        "bg-[var(--forge-bg-anvil)]",
                        "border border-[var(--forge-border-subtle)]"
                    )}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        delay: ANIMATION_BASE_DELAY + 0.2,
                        duration: 0.3,
                        ease: "easeOut"
                    }}
                    data-testid="compact-stats-row"
                >
                    {/* Modules */}
                    <motion.div
                        className="flex items-center gap-1.5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: ANIMATION_BASE_DELAY + STATS_STAGGER_DELAY }}
                        data-testid="stat-modules"
                    >
                        <BookOpen size={12} className="text-[var(--forge-text-muted)]" />
                        <div className="flex items-baseline gap-1">
                            <AnimatedCounter
                                value={stats.moduleCount}
                                duration={0.6}
                                delay={ANIMATION_BASE_DELAY + STATS_STAGGER_DELAY + 0.1}
                                className="text-xs font-bold text-[var(--forge-text-primary)]"
                            />
                            <span className="text-[10px] text-[var(--forge-text-muted)]">modules</span>
                        </div>
                    </motion.div>

                    {/* Divider */}
                    <div className="w-px h-3 bg-[var(--forge-border-subtle)]" />

                    {/* Hours */}
                    <motion.div
                        className="flex items-center gap-1.5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: ANIMATION_BASE_DELAY + (STATS_STAGGER_DELAY * 2) }}
                        data-testid="stat-hours"
                    >
                        <Clock size={12} className="text-[var(--forge-text-muted)]" />
                        <div className="flex items-baseline gap-1">
                            <AnimatedCounter
                                value={stats.totalHours}
                                duration={0.6}
                                delay={ANIMATION_BASE_DELAY + (STATS_STAGGER_DELAY * 2) + 0.1}
                                className="text-xs font-bold text-[var(--forge-text-primary)]"
                            />
                            <span className="text-[10px] text-[var(--forge-text-muted)]">hrs</span>
                        </div>
                    </motion.div>

                    {/* Divider */}
                    <div className="w-px h-3 bg-[var(--forge-border-subtle)]" />

                    {/* New Nodes */}
                    <motion.div
                        className="flex items-center gap-1.5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: ANIMATION_BASE_DELAY + (STATS_STAGGER_DELAY * 3) }}
                        data-testid="stat-new-nodes"
                    >
                        <Sparkles size={12} className="text-[var(--ember)]" />
                        <div className="flex items-baseline gap-1">
                            <AnimatedCounter
                                value={stats.newNodesCount}
                                duration={0.6}
                                delay={ANIMATION_BASE_DELAY + (STATS_STAGGER_DELAY * 3) + 0.1}
                                className="text-xs font-bold text-[var(--ember)]"
                            />
                            <span className="text-[10px] text-[var(--forge-text-muted)]">new</span>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Module list with Timeline Spine */}
            <div className="flex-1 overflow-y-auto p-4 pt-0" data-testid="path-module-list">
                <div className="relative pl-8">
                    {/* Timeline Spine - vertical line */}
                    <motion.div
                        className="absolute left-3 top-0 bottom-0 w-0.5"
                        initial={{ scaleY: 0, opacity: 0 }}
                        animate={{ scaleY: 1, opacity: 1 }}
                        transition={{
                            delay: MODULE_START_DELAY - 0.1,
                            duration: 0.6,
                            ease: "easeOut"
                        }}
                        style={{ transformOrigin: "top" }}
                        data-testid="timeline-spine"
                    >
                        {/* Gradient background for the spine */}
                        <div className="absolute inset-0 bg-gradient-to-b from-[var(--forge-border-subtle)] via-[var(--forge-text-muted)]/30 to-[var(--forge-border-subtle)]" />
                    </motion.div>

                    <div className="space-y-3 relative">
                        {path.modules.map((module, index) => {
                            // Check if there's a milestone after this module
                            const milestoneAfter = milestonesWithModules.find(
                                m => m.moduleIndex === index
                            );

                            // Check if this module creates a new node
                            const isHypothetical = hypotheticalNodes.some(
                                h => h.sourceModuleId === module.id
                            );

                            // Check if the next module is hypothetical (for connector line styling)
                            const nextModule = path.modules[index + 1];
                            const isNextHypothetical = nextModule
                                ? hypotheticalNodes.some(h => h.sourceModuleId === nextModule.id)
                                : false;

                            // Calculate animation delay: stats animate first, then modules cascade
                            const animationDelay = MODULE_START_DELAY + (index * MODULE_STAGGER_DELAY);

                            const isLast = index === path.modules.length - 1;

                            return (
                                <React.Fragment key={module.id}>
                                    {/* Timeline segment for this module */}
                                    <div className="relative">
                                        {/* Connector line segment - dashed for hypothetical, solid for existing */}
                                        {!isLast && !milestoneAfter && (
                                            <motion.div
                                                className={cn(
                                                    "absolute left-[-20px] top-[24px] w-0.5 h-[calc(100%+12px)]",
                                                    isHypothetical || isNextHypothetical
                                                        ? "border-l-2 border-dashed border-[var(--ember)]/40"
                                                        : "bg-[var(--forge-text-muted)]/20"
                                                )}
                                                initial={{ scaleY: 0, opacity: 0 }}
                                                animate={{ scaleY: 1, opacity: 1 }}
                                                transition={{
                                                    delay: animationDelay + 0.1,
                                                    duration: 0.3,
                                                    ease: "easeOut"
                                                }}
                                                style={{ transformOrigin: "top" }}
                                                data-testid={`timeline-segment-${index}`}
                                            />
                                        )}

                                        <PathModuleCard
                                            module={module}
                                            index={index}
                                            isHypothetical={isHypothetical}
                                            animationDelay={animationDelay}
                                            onHover={(isHovering) =>
                                                onModuleHover?.(isHovering ? module.id : null)
                                            }
                                            showTimelineNode
                                        />
                                    </div>

                                    {milestoneAfter && index < path.modules.length - 1 && (
                                        <PathMilestoneMarker
                                            milestone={milestoneAfter}
                                            animationDelay={animationDelay + 0.03}
                                            showTimelineNode
                                        />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
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
