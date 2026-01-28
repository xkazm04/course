"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, Sparkles, GitCompare, BookOpen, Clock, Layers, Zap, TrendingUp } from "lucide-react";
import { PathFilters } from "./PathFilters";
import { PathsTable } from "./PathsTable";
import { PathComparisonPanel } from "./PathComparisonPanel";
import { useCommunityPaths } from "../../lib/useCommunityPaths";
import { PageHero, type PageHeroStat } from "../PageHero";
import { useAnimatedCounter } from "../../lib/useAnimatedCounter";
import { forgeEasing, staggerDelay } from "../../lib/animations";
import { cn } from "@/app/shared/lib/utils";

const MAX_COMPARISON_PATHS = 4;

// ============================================================================
// ANIMATED STATS BAR
// ============================================================================

interface StatsBarProps {
    totalPaths: number;
    aiPaths: number;
    totalHours: number;
    totalLearners: number;
}

function AnimatedStatsBar({ totalPaths, aiPaths, totalHours, totalLearners }: StatsBarProps) {
    const { count: pathCount } = useAnimatedCounter({ target: totalPaths, duration: 1200 });
    const { count: aiCount } = useAnimatedCounter({ target: aiPaths, duration: 1200, delay: 100 });
    const { count: hoursCount } = useAnimatedCounter({ target: totalHours, duration: 1200, delay: 200 });
    const { count: learnersCount } = useAnimatedCounter({ target: totalLearners, duration: 1200, delay: 300 });

    const stats = [
        { label: "Learning Paths", value: pathCount, icon: BookOpen, color: "text-[var(--ember)]" },
        { label: "AI Generated", value: aiCount, icon: Sparkles, color: "text-[var(--gold)]" },
        { label: "Total Hours", value: hoursCount, icon: Clock, color: "text-[var(--forge-info)]" },
        { label: "Active Learners", value: learnersCount.toLocaleString(), icon: TrendingUp, color: "text-[var(--forge-success)]" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, ease: forgeEasing }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
        >
            {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: staggerDelay(i, 0.08), ease: forgeEasing }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="flex items-center gap-3 p-4 rounded-xl bg-[var(--forge-bg-daylight)]/60 backdrop-blur-xl border border-[var(--forge-border-subtle)] hover:border-[var(--ember)]/20 transition-all"
                    >
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-current/10", stat.color)}>
                            <Icon size={18} />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-[var(--forge-text-primary)]">
                                {stat.value}
                            </div>
                            <div className="text-xs text-[var(--forge-text-muted)]">{stat.label}</div>
                        </div>
                    </motion.div>
                );
            })}
        </motion.div>
    );
}

// ============================================================================
// COMPARISON HINT
// ============================================================================

function ComparisonHint({ selectedCount }: { selectedCount: number }) {
    if (selectedCount === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--ember)]/10 border border-[var(--ember)]/20"
        >
            <GitCompare size={14} className="text-[var(--ember)]" />
            <span className="text-xs text-[var(--ember)] font-medium">
                {selectedCount < 2
                    ? `Select ${2 - selectedCount} more to compare`
                    : `${selectedCount} paths selected`}
            </span>
        </motion.div>
    );
}

// ============================================================================
// MAIN VIEW
// ============================================================================

export function CommunityPathsView() {
    // Use real database data - fetches from /api/community-paths
    const { paths, isLoading, filters, setFilter } = useCommunityPaths({ useMockData: false });

    // Selection state for path comparison
    const [selectedPathIds, setSelectedPathIds] = useState<string[]>([]);

    // Get selected path objects
    const selectedPaths = useMemo(
        () => paths.filter((p) => selectedPathIds.includes(p.id)),
        [paths, selectedPathIds]
    );

    // Compute aggregate stats
    const stats = useMemo(() => ({
        totalPaths: paths.length,
        aiPaths: paths.filter(p => p.pathType === "ai_generated").length,
        totalHours: Math.round(paths.reduce((sum, p) => sum + (p.estimatedHours || 0), 0)),
        totalLearners: paths.reduce((sum, p) => sum + (p.enrollmentCount || 0), 0),
    }), [paths]);

    // Hero stats
    const heroStats: PageHeroStat[] = useMemo(() => [
        { value: paths.length, label: "Community Paths" },
        { value: new Set(paths.map(p => p.domain)).size, label: "Domains Covered" },
        { value: paths.filter(p => p.pathType === "ai_generated").length, label: "AI Generated" },
    ], [paths]);

    // Clear selection
    const clearSelection = useCallback(() => {
        setSelectedPathIds([]);
    }, []);

    return (
        <section className="pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Hero Section */}
                <PageHero
                    title="Explore Learning Paths"
                    titleHighlight="Learning Paths"
                    subtitle="Discover curated and AI-generated learning paths from our community. Enroll to start your journey and master new skills."
                    badge={{ icon: Users, text: "Community" }}
                    stats={heroStats}
                />

                {/* Animated Stats Bar */}
                <AnimatedStatsBar {...stats} />

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, ease: forgeEasing }}
                    className="mb-6"
                >
                    <PathFilters filters={filters} onFilterChange={setFilter} />
                </motion.div>

                {/* Results count with comparison hint */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="flex items-center justify-between mb-4"
                >
                    <div className="flex items-center gap-3">
                        <p className="text-sm text-[var(--forge-text-muted)]">
                            Showing <span className="text-[var(--forge-text-primary)] font-medium">{paths.length}</span> paths
                        </p>
                        <ComparisonHint selectedCount={selectedPathIds.length} />
                    </div>
                    <div className="flex items-center gap-4">
                        {stats.aiPaths > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-[var(--gold)]">
                                <Sparkles size={12} />
                                <span>{stats.aiPaths} AI-generated paths</span>
                            </div>
                        )}
                        {selectedPathIds.length === 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-[var(--forge-text-muted)]">
                                <GitCompare size={12} />
                                <span>Select paths to compare</span>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Comparison Panel */}
                <PathComparisonPanel
                    selectedPaths={selectedPaths}
                    onClearSelection={clearSelection}
                />

                {/* Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, ease: forgeEasing }}
                >
                    <PathsTable
                        paths={paths}
                        isLoading={isLoading}
                        selectedIds={selectedPathIds}
                        onSelectionChange={setSelectedPathIds}
                        maxSelections={MAX_COMPARISON_PATHS}
                    />
                </motion.div>
            </div>
        </section>
    );
}
