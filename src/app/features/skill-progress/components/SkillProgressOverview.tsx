"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles, TrendingUp, Crown, Flame, X,
    BarChart3, Grid3X3
} from "lucide-react";
import { PrismaticCard } from "@/app/shared/components";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { Skill, SkillCategory, CATEGORY_CONFIG } from "../lib/types";
import {
    mockSkills,
    getRadarChartData,
    getTopSkills,
    getTotalXp,
    getTotalCrowns,
    getOverallLevel,
    getSkillsByCategory,
} from "../lib/mockSkillData";
import { ProgressRing } from "./ProgressRing";
import { SkillRadarChart } from "./SkillRadarChart";
import { SkillCard } from "./SkillCard";
import { SkillCrown } from "./SkillCrown";
import { SkillLevelBadge } from "./SkillLevelBadge";
import { VariantShell, AnimatedPanel, type VariantShellContext } from "@/app/features/overview/components/VariantShell";

// SkillProgressOverview variant - uses VariantShell for selection and filter state
// Provides unique visual renderer: radar chart / grid view with skill detail modal

interface SkillProgressOverviewProps {
    className?: string;
}

type ViewMode = "radar" | "grid";

// Computed stats (from static data)
const radarData = getRadarChartData();
const topSkills = getTopSkills(5);
const totalXp = getTotalXp();
const totalCrowns = getTotalCrowns();
const overallLevel = getOverallLevel();

// Stats configuration (glow colors must match PrismaticCard: indigo, purple, cyan, emerald, orange)
const statsConfig = [
    { label: "Total XP", value: totalXp.toLocaleString(), icon: TrendingUp, color: "indigo" },
    { label: "Crowns Earned", value: totalCrowns, icon: Crown, color: "orange" },
    { label: "Skills Tracked", value: mockSkills.length, icon: Sparkles, color: "purple" },
    { label: "Overall Level", value: overallLevel, icon: Flame, color: "emerald" },
] as const;

// Filter function for category-based filtering
const filterByCategory = (skill: Skill, category: SkillCategory): boolean =>
    skill.category === category;

// Header Component
interface HeaderProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
}

const Header = ({ viewMode, onViewModeChange }: HeaderProps) => (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold tracking-wide text-xs uppercase mb-3"
            >
                <Sparkles size={ICON_SIZES.sm} />
                Skill Progress
            </motion.div>
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-slate-100"
            >
                Your Learning Journey
            </motion.h2>
        </div>

        {/* View Toggle */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2"
        >
            <button
                onClick={() => onViewModeChange("radar")}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all",
                    viewMode === "radar"
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                        : "bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"
                )}
                data-testid="view-mode-radar-btn"
            >
                <BarChart3 size={ICON_SIZES.sm} />
                Radar
            </button>
            <button
                onClick={() => onViewModeChange("grid")}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all",
                    viewMode === "grid"
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                        : "bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"
                )}
                data-testid="view-mode-grid-btn"
            >
                <Grid3X3 size={ICON_SIZES.sm} />
                Grid
            </button>
        </motion.div>
    </div>
);

// Stats Row Component
const StatsRow = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsConfig.map((stat, i) => (
            <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
            >
                <PrismaticCard glowColor={stat.color}>
                    <div className="p-4 flex items-center gap-3">
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            stat.color === "indigo" && "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400",
                            stat.color === "orange" && "bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400",
                            stat.color === "purple" && "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400",
                            stat.color === "emerald" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400"
                        )}>
                            <stat.icon size={ICON_SIZES.md} />
                        </div>
                        <div>
                            <div className="text-xl font-black text-slate-900 dark:text-slate-100">{stat.value}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</div>
                        </div>
                    </div>
                </PrismaticCard>
            </motion.div>
        ))}
    </div>
);

// Radar View Component
interface RadarViewProps {
    selectedCategory: SkillCategory | null;
    onCategoryClick: (category: string) => void;
    onClearFilter: () => void;
}

const RadarView = ({ selectedCategory, onCategoryClick, onClearFilter }: RadarViewProps) => (
    <motion.div
        key="radar"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
    >
        <PrismaticCard glowColor="purple">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Competency Radar
                    </h3>
                    {selectedCategory && (
                        <button
                            onClick={onClearFilter}
                            className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            data-testid="clear-category-filter-btn"
                        >
                            <X size={ICON_SIZES.xs} />
                            Clear filter
                        </button>
                    )}
                </div>
                <div className="flex items-center justify-center">
                    <SkillRadarChart
                        data={radarData}
                        size={320}
                        onCategoryClick={onCategoryClick}
                    />
                </div>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
                    Click on a category to filter skills
                </p>
            </div>
        </PrismaticCard>
    </motion.div>
);

// Grid View Component
interface GridViewProps {
    selectedCategory: SkillCategory | null;
    filteredSkills: Skill[];
    onCategoryChange: (category: SkillCategory) => void;
    onClearFilter: () => void;
    onSkillClick: (skill: Skill) => void;
}

const GridView = ({ selectedCategory, filteredSkills, onCategoryChange, onClearFilter, onSkillClick }: GridViewProps) => (
    <motion.div
        key="grid"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
    >
        <PrismaticCard glowColor="indigo">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        All Skills
                    </h3>
                    {selectedCategory && (
                        <button
                            onClick={onClearFilter}
                            className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            data-testid="clear-category-filter-grid-btn"
                        >
                            <X size={ICON_SIZES.xs} />
                            Clear filter
                        </button>
                    )}
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                        <button
                            key={key}
                            onClick={() => onCategoryChange(key as SkillCategory)}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                selectedCategory === key
                                    ? "bg-indigo-500 text-white"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                            )}
                            data-testid={`category-filter-${key}`}
                        >
                            {config.label}
                        </button>
                    ))}
                </div>

                {/* Skills Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                    {filteredSkills.map((skill, i) => (
                        <SkillCard
                            key={skill.id}
                            skill={skill}
                            index={i}
                            compact
                            onClick={() => onSkillClick(skill)}
                        />
                    ))}
                </div>
            </div>
        </PrismaticCard>
    </motion.div>
);

// Top Skills Panel Component
interface TopSkillsPanelProps {
    onSkillClick: (skill: Skill) => void;
}

const TopSkillsPanel = ({ onSkillClick }: TopSkillsPanelProps) => (
    <PrismaticCard glowColor="emerald">
        <div className="p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Top Skills</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">By XP</span>
            </div>
            <div className="space-y-3">
                {topSkills.map((skill, i) => (
                    <motion.button
                        key={skill.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        onClick={() => onSkillClick(skill)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                        data-testid={`top-skill-${skill.id}`}
                    >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold text-sm">
                            {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                    {skill.name}
                                </span>
                                <SkillCrown crowns={skill.crowns} size="sm" />
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                {skill.currentXp.toLocaleString()} XP
                            </div>
                        </div>
                        <ProgressRing
                            progress={(skill.currentXp / skill.maxXp) * 100}
                            size="sm"
                            color={skill.color}
                            showPercentage={false}
                        />
                    </motion.button>
                ))}
            </div>
        </div>
    </PrismaticCard>
);

// Tips Panel Component
const TipsPanel = () => (
    <PrismaticCard glowColor="cyan">
        <div className="p-5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">
                Level Up Tips
            </h3>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-2">
                    <span className="text-amber-500">1.</span>
                    <span>Complete courses to earn XP and crowns</span>
                </div>
                <div className="flex items-start gap-2">
                    <span className="text-amber-500">2.</span>
                    <span>Practice daily to maintain your streak</span>
                </div>
                <div className="flex items-start gap-2">
                    <span className="text-amber-500">3.</span>
                    <span>Balance skills across categories</span>
                </div>
            </div>
        </div>
    </PrismaticCard>
);

// Skill Detail Modal Component
interface SkillDetailModalProps {
    skill: Skill;
    onClose: () => void;
}

const SkillDetailModal = ({ skill, onClose }: SkillDetailModalProps) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        data-testid="skill-detail-modal-backdrop"
    >
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
        >
            <PrismaticCard glowColor={(skill.color as "indigo" | "purple" | "cyan" | "emerald" | "orange") || "indigo"}>
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                {skill.name}
                            </h3>
                            <SkillLevelBadge level={skill.level} size="sm" />
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                            data-testid="close-skill-detail-btn"
                        >
                            <X size={ICON_SIZES.md} />
                        </button>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                        {skill.description}
                    </p>

                    <div className="flex items-center justify-center mb-6">
                        <ProgressRing
                            progress={(skill.currentXp / skill.maxXp) * 100}
                            size="xl"
                            color={skill.color}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
                            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                {skill.currentXp.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-500">Current XP</div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
                            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                {skill.maxXp.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-500">Next Level</div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Crown size={ICON_SIZES.sm} className="text-amber-500" />
                            <SkillCrown crowns={skill.crowns} size="md" />
                        </div>
                        {skill.streak > 0 && (
                            <div className="flex items-center gap-1 text-orange-500">
                                <Flame size={ICON_SIZES.sm} className="fill-orange-500" />
                                <span className="text-sm font-bold">{skill.streak} day streak</span>
                            </div>
                        )}
                    </div>
                </div>
            </PrismaticCard>
        </motion.div>
    </motion.div>
);

// Main SkillProgressOverview Component - uses VariantShell for selection and filter state
export const SkillProgressOverview = ({ className }: SkillProgressOverviewProps) => {
    // View mode is a local UI concern, not part of the shell
    const [viewMode, setViewMode] = useState<ViewMode>("radar");

    return (
        <VariantShell<Skill, SkillCategory>
            items={mockSkills}
            getItemId={(skill) => skill.id}
            filterFn={filterByCategory}
            animationPreset="stagger-fast"
        >
            {(context: VariantShellContext<Skill, SkillCategory>) => {
                const { filteredItems, selection, filter } = context;
                const selectedCategory = filter.filter;
                const selectedSkill = selection.selected;

                const handleCategoryClick = (category: string) => {
                    filter.setFilter(category as SkillCategory);
                };

                return (
                    <div className={cn("space-y-6", className)} data-testid="skill-progress-overview">
                        <Header viewMode={viewMode} onViewModeChange={setViewMode} />
                        <StatsRow />

                        {/* Main Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left: Radar Chart or Grid */}
                            <div className="lg:col-span-2">
                                <AnimatePresence mode="wait">
                                    {viewMode === "radar" ? (
                                        <RadarView
                                            selectedCategory={selectedCategory}
                                            onCategoryClick={handleCategoryClick}
                                            onClearFilter={filter.clearFilter}
                                        />
                                    ) : (
                                        <GridView
                                            selectedCategory={selectedCategory}
                                            filteredSkills={filteredItems}
                                            onCategoryChange={filter.setFilter}
                                            onClearFilter={filter.clearFilter}
                                            onSkillClick={selection.setSelected}
                                        />
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Right: Top Skills and Tips */}
                            <div className="space-y-4">
                                <TopSkillsPanel onSkillClick={selection.setSelected} />
                                <TipsPanel />
                            </div>
                        </div>

                        {/* Skill Detail Modal */}
                        <AnimatePresence>
                            {selectedSkill && (
                                <SkillDetailModal
                                    skill={selectedSkill}
                                    onClose={() => selection.setSelected(null)}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                );
            }}
        </VariantShell>
    );
};
