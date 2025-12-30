"use client";

import React from "react";
import { motion } from "framer-motion";
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Filter, X, Focus, Target } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ViewportState, DEFAULT_VIEWPORT, CurriculumCategory, CATEGORY_META } from "../lib/curriculumTypes";

interface KnowledgeMapControlsProps {
    viewport: ViewportState;
    onViewportChange: (viewport: ViewportState) => void;
    onFitToScreen: () => void;
    categoryFilter: string | null;
    onCategoryFilterChange: (category: string | null) => void;
    focusMode?: boolean;
    onFocusModeChange?: (enabled: boolean) => void;
    focusedPathId?: string | null;
    skillGapMode?: boolean;
    onSkillGapModeChange?: (enabled: boolean) => void;
    skillGapStats?: {
        totalMastered: number;
        totalPartial: number;
        totalGap: number;
    };
}

export const KnowledgeMapControls: React.FC<KnowledgeMapControlsProps> = ({
    viewport,
    onViewportChange,
    onFitToScreen,
    categoryFilter,
    onCategoryFilterChange,
    focusMode = false,
    onFocusModeChange,
    focusedPathId,
    skillGapMode = false,
    onSkillGapModeChange,
    skillGapStats,
}) => {
    const handleZoomIn = () => {
        onViewportChange({
            ...viewport,
            scale: Math.min(2, viewport.scale + 0.2),
        });
    };

    const handleZoomOut = () => {
        onViewportChange({
            ...viewport,
            scale: Math.max(0.3, viewport.scale - 0.2),
        });
    };

    const handleReset = () => {
        onViewportChange(DEFAULT_VIEWPORT);
    };

    const handleFocusModeToggle = () => {
        onFocusModeChange?.(!focusMode);
    };

    const handleSkillGapModeToggle = () => {
        onSkillGapModeChange?.(!skillGapMode);
    };

    return (
        <div className="flex items-center gap-2" data-testid="knowledge-map-controls">
            {/* Focus Mode Toggle */}
            {onFocusModeChange && (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleFocusModeToggle}
                    className={cn(
                        "flex items-center gap-2 px-3 py-2 text-sm rounded-xl",
                        "border transition-all duration-200",
                        focusMode
                            ? "bg-[var(--ember)]/20 border-[var(--ember)]/50 text-[var(--ember)]"
                            : "bg-[var(--forge-bg-elevated)] border-[var(--forge-border-subtle)] text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-workshop)]"
                    )}
                    title={focusMode ? "Exit focus mode" : "Enter focus mode to isolate current path"}
                    data-testid="knowledge-map-focus-mode-btn"
                >
                    <Focus className={cn(
                        "w-4 h-4",
                        focusMode && "text-[var(--ember)]"
                    )} />
                    <span className="font-medium">
                        {focusMode ? "Focus On" : "Focus"}
                    </span>
                    {focusMode && focusedPathId && (
                        <span className="px-1.5 py-0.5 text-xs bg-[var(--ember)]/30 rounded-md">
                            Active
                        </span>
                    )}
                </motion.button>
            )}

            {/* Skill Gap Mode Toggle */}
            {onSkillGapModeChange && (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSkillGapModeToggle}
                    className={cn(
                        "flex items-center gap-2 px-3 py-2 text-sm rounded-xl",
                        "border transition-all duration-200",
                        skillGapMode
                            ? "bg-[var(--forge-warning)]/20 border-[var(--forge-warning)]/50 text-[var(--forge-warning)]"
                            : "bg-[var(--forge-bg-elevated)] border-[var(--forge-border-subtle)] text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-workshop)]"
                    )}
                    title={skillGapMode ? "Disable skill gap overlay" : "Show skill gap analysis overlay"}
                    data-testid="knowledge-map-skill-gap-btn"
                >
                    <Target className={cn(
                        "w-4 h-4",
                        skillGapMode && "text-[var(--forge-warning)]"
                    )} />
                    <span className="font-medium">
                        {skillGapMode ? "Skill Gap" : "Gaps"}
                    </span>
                    {skillGapMode && skillGapStats && (
                        <div className="flex items-center gap-1">
                            <span className="px-1 py-0.5 text-[10px] bg-[var(--forge-success)]/20 text-[var(--forge-success)] rounded" title="Mastered skills">
                                {skillGapStats.totalMastered}
                            </span>
                            <span className="px-1 py-0.5 text-[10px] bg-[var(--forge-warning)]/20 text-[var(--forge-warning)] rounded" title="Partial skills">
                                {skillGapStats.totalPartial}
                            </span>
                            <span className="px-1 py-0.5 text-[10px] bg-[var(--forge-error)]/20 text-[var(--forge-error)] rounded" title="Skill gaps">
                                {skillGapStats.totalGap}
                            </span>
                        </div>
                    )}
                </motion.button>
            )}

            {/* Category Filter Dropdown */}
            <div className="relative">
                <select
                    value={categoryFilter || ""}
                    onChange={(e) => onCategoryFilterChange(e.target.value || null)}
                    className={cn(
                        "appearance-none pl-8 pr-8 py-2 text-sm rounded-xl",
                        "bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)]",
                        "text-[var(--forge-text-primary)]",
                        "focus:outline-none focus:ring-2 focus:ring-[var(--ember)]",
                        "cursor-pointer"
                    )}
                    data-testid="knowledge-map-category-filter"
                >
                    <option value="">All Categories</option>
                    {CATEGORY_META.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                        </option>
                    ))}
                </select>
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--forge-text-muted)] pointer-events-none" />
                {categoryFilter && (
                    <button
                        onClick={() => onCategoryFilterChange(null)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-[var(--forge-bg-workshop)] rounded"
                        data-testid="knowledge-map-clear-filter-btn"
                    >
                        <X className="w-3 h-3 text-[var(--forge-text-muted)]" />
                    </button>
                )}
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-[var(--forge-bg-elevated)] rounded-xl border border-[var(--forge-border-subtle)] overflow-hidden" data-testid="knowledge-map-zoom-controls">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleZoomOut}
                    disabled={viewport.scale <= 0.3}
                    className={cn(
                        "p-2 hover:bg-[var(--forge-bg-workshop)] transition-colors",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    title="Zoom out"
                    data-testid="knowledge-map-zoom-out-btn"
                >
                    <ZoomOut className="w-4 h-4 text-[var(--forge-text-secondary)]" />
                </motion.button>

                <div className="w-px h-6 bg-[var(--forge-border-subtle)]" />

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleZoomIn}
                    disabled={viewport.scale >= 2}
                    className={cn(
                        "p-2 hover:bg-[var(--forge-bg-workshop)] transition-colors",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    title="Zoom in"
                    data-testid="knowledge-map-zoom-in-btn"
                >
                    <ZoomIn className="w-4 h-4 text-[var(--forge-text-secondary)]" />
                </motion.button>

                <div className="w-px h-6 bg-[var(--forge-border-subtle)]" />

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onFitToScreen}
                    className="p-2 hover:bg-[var(--forge-bg-workshop)] transition-colors"
                    title="Fit to screen"
                    data-testid="knowledge-map-fit-screen-btn"
                >
                    <Maximize2 className="w-4 h-4 text-[var(--forge-text-secondary)]" />
                </motion.button>

                <div className="w-px h-6 bg-[var(--forge-border-subtle)]" />

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleReset}
                    className="p-2 hover:bg-[var(--forge-bg-workshop)] transition-colors"
                    title="Reset view"
                    data-testid="knowledge-map-reset-btn"
                >
                    <RotateCcw className="w-4 h-4 text-[var(--forge-text-secondary)]" />
                </motion.button>
            </div>
        </div>
    );
};

export default KnowledgeMapControls;
