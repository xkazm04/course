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
                            ? "bg-indigo-100 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                    )}
                    title={focusMode ? "Exit focus mode" : "Enter focus mode to isolate current path"}
                    data-testid="knowledge-map-focus-mode-btn"
                >
                    <Focus className={cn(
                        "w-4 h-4",
                        focusMode && "text-indigo-500"
                    )} />
                    <span className="font-medium">
                        {focusMode ? "Focus On" : "Focus"}
                    </span>
                    {focusMode && focusedPathId && (
                        <span className="px-1.5 py-0.5 text-xs bg-indigo-200 dark:bg-indigo-800 rounded-md">
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
                            ? "bg-gradient-to-r from-emerald-100 via-amber-100 to-red-100 dark:from-emerald-900/40 dark:via-amber-900/40 dark:to-red-900/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                    )}
                    title={skillGapMode ? "Disable skill gap overlay" : "Show skill gap analysis overlay"}
                    data-testid="knowledge-map-skill-gap-btn"
                >
                    <Target className={cn(
                        "w-4 h-4",
                        skillGapMode && "text-amber-600 dark:text-amber-400"
                    )} />
                    <span className="font-medium">
                        {skillGapMode ? "Skill Gap" : "Gaps"}
                    </span>
                    {skillGapMode && skillGapStats && (
                        <div className="flex items-center gap-1">
                            <span className="px-1 py-0.5 text-[10px] bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 rounded" title="Mastered skills">
                                {skillGapStats.totalMastered}
                            </span>
                            <span className="px-1 py-0.5 text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 rounded" title="Partial skills">
                                {skillGapStats.totalPartial}
                            </span>
                            <span className="px-1 py-0.5 text-[10px] bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300 rounded" title="Skill gaps">
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
                        "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
                        "text-slate-700 dark:text-slate-300",
                        "focus:outline-none focus:ring-2 focus:ring-indigo-500",
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
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                {categoryFilter && (
                    <button
                        onClick={() => onCategoryFilterChange(null)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                        data-testid="knowledge-map-clear-filter-btn"
                    >
                        <X className="w-3 h-3 text-slate-400" />
                    </button>
                )}
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden" data-testid="knowledge-map-zoom-controls">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleZoomOut}
                    disabled={viewport.scale <= 0.3}
                    className={cn(
                        "p-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    title="Zoom out"
                    data-testid="knowledge-map-zoom-out-btn"
                >
                    <ZoomOut className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </motion.button>

                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleZoomIn}
                    disabled={viewport.scale >= 2}
                    className={cn(
                        "p-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    title="Zoom in"
                    data-testid="knowledge-map-zoom-in-btn"
                >
                    <ZoomIn className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </motion.button>

                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onFitToScreen}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="Fit to screen"
                    data-testid="knowledge-map-fit-screen-btn"
                >
                    <Maximize2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </motion.button>

                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleReset}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="Reset view"
                    data-testid="knowledge-map-reset-btn"
                >
                    <RotateCcw className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </motion.button>
            </div>
        </div>
    );
};

export default KnowledgeMapControls;
