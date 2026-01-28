"use client";

import React, { useState, useMemo, Suspense, lazy } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Target, Flame, Trophy, Clock, Sparkles, Zap } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { mockChallenges, mockProjects } from "../lib/mockData";
import type { ChallengeType, ChallengeDifficulty, Challenge } from "../lib/types";
import { SkeletonTable } from "../components/LazySection";
import { PageHero, type PageHeroStat } from "../components/PageHero";
import { GradientCard, GradientCardGrid, gradientPresets } from "../components/GradientCard";
import { ForgeGlowButton } from "../components/ForgeGlowButton";
import { staggerContainer, staggerChild, forgeEasing, fadeUpVariants } from "../lib/animations";
import { useAnimatedCounter } from "../lib/useAnimatedCounter";
import {
    difficultyOrder,
    difficultyColors,
    typeOptions,
    typeEmojis,
    type SortKey,
    type SortDir,
} from "./components/constants";
import { FilterBar } from "./components/FilterBar";

// Lazy load the heavy table component
const ChallengesTable = lazy(() =>
    import("./components/ChallengesTable").then((m) => ({ default: m.ChallengesTable }))
);

// ============================================================================
// HOOKS
// ============================================================================

function useChallengesFilter(projectFilter: string | null) {
    const [searchQuery, setSearchQuery] = useState("");
    const [type, setType] = useState<ChallengeType | "all">("all");
    const [difficulty, setDifficulty] = useState<ChallengeDifficulty | "all">("all");
    const [project, setProject] = useState<string>(projectFilter || "all");
    const [sortKey, setSortKey] = useState<SortKey>("xpReward");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDir("desc");
        }
    };

    const clearAll = () => {
        setType("all");
        setDifficulty("all");
        setProject("all");
        setSearchQuery("");
    };

    const filteredAndSorted = useMemo(() => {
        const result = mockChallenges.filter((challenge) => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (
                    !challenge.title.toLowerCase().includes(query) &&
                    !challenge.description.toLowerCase().includes(query) &&
                    !challenge.projectName.toLowerCase().includes(query)
                ) {
                    return false;
                }
            }
            if (type !== "all" && challenge.type !== type) return false;
            if (difficulty !== "all" && challenge.difficulty !== difficulty) return false;
            if (project !== "all") {
                const proj = mockProjects.find((p) => p.slug === project || p.id === project);
                if (proj && challenge.projectId !== proj.id) return false;
            }
            return true;
        });

        result.sort((a, b) => {
            let comparison = 0;
            switch (sortKey) {
                case "title":
                    comparison = a.title.localeCompare(b.title);
                    break;
                case "xpReward":
                    comparison = a.xpReward - b.xpReward;
                    break;
                case "estimatedMinutes":
                    comparison = a.estimatedMinutes - b.estimatedMinutes;
                    break;
                case "difficulty":
                    comparison = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
                    break;
                case "successRate":
                    comparison = (a.successRate || 0) - (b.successRate || 0);
                    break;
                case "timesCompleted":
                    comparison = a.timesCompleted - b.timesCompleted;
                    break;
            }
            return sortDir === "asc" ? comparison : -comparison;
        });

        return result;
    }, [searchQuery, type, difficulty, project, sortKey, sortDir]);

    const hasActiveFilters = type !== "all" || difficulty !== "all" || project !== "all" || searchQuery !== "";

    return {
        searchQuery,
        setSearchQuery,
        type,
        setType,
        difficulty,
        setDifficulty,
        project,
        setProject,
        sortKey,
        sortDir,
        handleSort,
        clearAll,
        filteredAndSorted,
        hasActiveFilters,
    };
}

// ============================================================================
// FEATURED CHALLENGES SECTION
// ============================================================================

const DIFFICULTY_GRADIENTS: Record<ChallengeDifficulty, keyof typeof gradientPresets> = {
    beginner: "success",
    intermediate: "gold",
    advanced: "error",
};

function FeaturedChallenges({ challenges }: { challenges: Challenge[] }) {
    // Get top 3 challenges with highest XP
    const featured = useMemo(() => {
        return [...challenges]
            .sort((a, b) => b.xpReward - a.xpReward)
            .slice(0, 3);
    }, [challenges]);

    if (featured.length === 0) return null;

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4, ease: forgeEasing }}
            className="mb-8"
        >
            <div className="flex items-center gap-2 mb-4">
                <Sparkles size={20} className="text-[var(--gold)]" />
                <h2 className="text-lg font-semibold text-[var(--forge-text-primary)]">
                    Featured Challenges
                </h2>
            </div>

            <GradientCardGrid columns={3} gap="md">
                {featured.map((challenge, index) => (
                    <GradientCard
                        key={challenge.id}
                        title={challenge.title}
                        subtitle={`${challenge.projectName} • ${challenge.estimatedMinutes}min`}
                        gradient={DIFFICULTY_GRADIENTS[challenge.difficulty]}
                        pattern={index === 0 ? "topLeft" : index === 1 ? "center" : "bottomRight"}
                        showHexPattern
                        badge={`+${challenge.xpReward} XP`}
                        badgeVariant={challenge.difficulty === "advanced" ? "warning" : "default"}
                        progress={Math.round((challenge.successRate || 0) * 100)}
                        progressLabel={`${Math.round((challenge.successRate || 0) * 100)}% success`}
                        href={`/forge/challenges/${challenge.id}`}
                        index={index}
                        size="md"
                    >
                        <div className="flex items-center gap-2 text-white/80 text-sm">
                            <span>{typeEmojis[challenge.type]}</span>
                            <span className="capitalize">{challenge.type}</span>
                            <span className="mx-1">•</span>
                            <span className="capitalize">{challenge.difficulty}</span>
                        </div>
                    </GradientCard>
                ))}
            </GradientCardGrid>
        </motion.section>
    );
}

// ============================================================================
// ANIMATED STATS BAR
// ============================================================================

function AnimatedStatsBar({ challenges }: { challenges: Challenge[] }) {
    const totalXP = challenges.reduce((sum, c) => sum + c.xpReward, 0);
    const avgTime = Math.round(challenges.reduce((sum, c) => sum + c.estimatedMinutes, 0) / (challenges.length || 1));
    const avgSuccess = Math.round(
        (challenges.reduce((sum, c) => sum + (c.successRate || 0), 0) / (challenges.length || 1)) * 100
    );

    const { count: countChallenges } = useAnimatedCounter({ target: challenges.length, duration: 1500 });
    const { count: countXP } = useAnimatedCounter({ target: totalXP, duration: 1500, increment: 10, delay: 100 });
    const { count: countTime } = useAnimatedCounter({ target: avgTime, duration: 1500, delay: 200 });
    const { count: countSuccess } = useAnimatedCounter({ target: avgSuccess, duration: 1500, delay: 300 });

    const stats = [
        { label: "Challenges", value: countChallenges, icon: Target, color: "text-[var(--ember)]" },
        { label: "Total XP", value: countXP.toLocaleString(), icon: Zap, color: "text-[var(--gold)]" },
        { label: "Avg Time", value: `${countTime}min`, icon: Clock, color: "text-[var(--forge-info)]" },
        { label: "Avg Success", value: `${countSuccess}%`, icon: Trophy, color: "text-[var(--forge-success)]" },
    ];

    return (
        <motion.div
            variants={fadeUpVariants}
            custom={2}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-between gap-4 px-6 py-4 bg-gradient-to-r from-[var(--ember)]/5 via-[var(--forge-bg-elevated)]/50 to-[var(--gold)]/5 rounded-xl border border-[var(--forge-border-subtle)] mb-6"
        >
            {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                    <motion.div
                        key={stat.label}
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 + 0.3 }}
                    >
                        <div className={cn("p-2 rounded-lg bg-[var(--forge-bg-elevated)]", stat.color)}>
                            <Icon size={18} />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-[var(--forge-text-primary)]">
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
// DIFFICULTY SELECTOR (Visual)
// ============================================================================

interface DifficultySelectorProps {
    value: ChallengeDifficulty | "all";
    onChange: (value: ChallengeDifficulty | "all") => void;
    challenges: Challenge[];
}

function DifficultySelector({ value, onChange, challenges }: DifficultySelectorProps) {
    const counts = useMemo(() => ({
        all: challenges.length,
        beginner: challenges.filter(c => c.difficulty === "beginner").length,
        intermediate: challenges.filter(c => c.difficulty === "intermediate").length,
        advanced: challenges.filter(c => c.difficulty === "advanced").length,
    }), [challenges]);

    const options: { value: ChallengeDifficulty | "all"; label: string; color: string; bgColor: string }[] = [
        { value: "all", label: "All Levels", color: "text-[var(--forge-text-primary)]", bgColor: "bg-[var(--forge-bg-elevated)]" },
        { value: "beginner", label: "Beginner", color: "text-[var(--forge-success)]", bgColor: "bg-[var(--forge-success)]/10" },
        { value: "intermediate", label: "Intermediate", color: "text-[var(--gold)]", bgColor: "bg-[var(--gold)]/10" },
        { value: "advanced", label: "Advanced", color: "text-[var(--forge-error)]", bgColor: "bg-[var(--forge-error)]/10" },
    ];

    return (
        <motion.div
            className="flex items-center gap-2 p-1 bg-[var(--forge-bg-elevated)]/50 rounded-xl"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
        >
            {options.map((opt, i) => (
                <motion.button
                    key={opt.value}
                    variants={staggerChild}
                    onClick={() => onChange(opt.value)}
                    className={cn(
                        "relative px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        value === opt.value
                            ? `${opt.bgColor} ${opt.color} shadow-sm`
                            : "text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)]"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <span>{opt.label}</span>
                    <span className={cn(
                        "ml-2 text-xs",
                        value === opt.value ? "opacity-80" : "opacity-50"
                    )}>
                        ({counts[opt.value]})
                    </span>
                    {value === opt.value && (
                        <motion.div
                            layoutId="difficulty-indicator"
                            className="absolute inset-0 rounded-lg border-2 border-current opacity-30"
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                    )}
                </motion.button>
            ))}
        </motion.div>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ChallengesPage() {
    const searchParams = useSearchParams();
    const projectFilter = searchParams.get("project");

    const {
        searchQuery,
        setSearchQuery,
        type,
        setType,
        difficulty,
        setDifficulty,
        project,
        setProject,
        sortKey,
        sortDir,
        handleSort,
        clearAll,
        filteredAndSorted,
        hasActiveFilters,
    } = useChallengesFilter(projectFilter);

    // Hero stats from all challenges
    const heroStats: PageHeroStat[] = [
        { value: mockChallenges.length, label: "Total Challenges" },
        { value: mockChallenges.reduce((sum, c) => sum + c.xpReward, 0), label: "XP Available", increment: 100 },
        { value: mockChallenges.filter(c => c.difficulty === "beginner").length, label: "Beginner Friendly" },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {/* Hero Section */}
            <PageHero
                title="Forge Your Skills"
                titleHighlight="Skills"
                subtitle="Master real-world development through open-source contributions. Each challenge is a step toward becoming a better developer."
                badge={{ icon: Target, text: "Challenges" }}
                stats={heroStats}
                actions={[
                    { label: "Random Challenge", href: `/forge/challenges/${mockChallenges[Math.floor(Math.random() * mockChallenges.length)]?.id}`, variant: "primary", icon: Flame },
                ]}
            />

            {/* Featured Challenges */}
            <FeaturedChallenges challenges={mockChallenges} />

            {/* Difficulty Selector */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-6"
            >
                <DifficultySelector
                    value={difficulty}
                    onChange={setDifficulty}
                    challenges={mockChallenges}
                />
            </motion.div>

            {/* Animated Stats Bar */}
            <AnimatedStatsBar challenges={filteredAndSorted} />

            {/* Filter Bar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm mb-6"
            >
                <FilterBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    type={type}
                    onTypeChange={setType}
                    difficulty={difficulty}
                    onDifficultyChange={setDifficulty}
                    project={project}
                    onProjectChange={setProject}
                    onClearAll={clearAll}
                    hasActiveFilters={hasActiveFilters}
                />
            </motion.div>

            {/* Challenge List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <Suspense fallback={<SkeletonTable rows={8} />}>
                    <ChallengesTable
                        challenges={filteredAndSorted}
                        totalCount={mockChallenges.length}
                        onClearFilters={clearAll}
                    />
                </Suspense>
            </motion.div>

            {/* Bottom CTA */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center py-12"
            >
                <p className="text-[var(--forge-text-muted)] mb-4">
                    Can't find what you're looking for?
                </p>
                <ForgeGlowButton href="/forge/projects" icon="sparkles">
                    Explore Projects
                </ForgeGlowButton>
            </motion.div>
        </div>
    );
}
