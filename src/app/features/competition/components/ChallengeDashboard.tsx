"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Trophy,
    Clock,
    Filter,
    RefreshCw,
    ChevronRight,
    Target,
    Zap,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { elevation } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { ChallengeDifficulty, ChallengeStatus } from "../lib/types";
import { useChallenge } from "../lib/useChallenge";
import { getUserStats } from "../lib/challengeStorage";
import { ChallengeCard } from "./ChallengeCard";
import { ChallengeDetail } from "./ChallengeDetail";
import { TierDisplay, TierBadge } from "./TierBadge";
import { Leaderboard } from "./Leaderboard";

type ViewMode = "dashboard" | "detail" | "submission";
type FilterMode = "all" | "active" | "upcoming" | "completed";

export const ChallengeDashboard: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
    const [filterMode, setFilterMode] = useState<FilterMode>("all");
    const [difficultyFilter, setDifficultyFilter] = useState<ChallengeDifficulty | "all">("all");

    const {
        challenges,
        activeChallenges,
        upcomingChallenges,
        completedChallenges,
        joinedChallengeIds,
        isLoading,
        selectedChallenge,
        selectChallenge,
        joinChallenge,
        hasJoined,
        hasSubmission,
        refresh,
    } = useChallenge({ autoRefresh: true });

    const userStats = getUserStats();

    // Filter challenges
    const getFilteredChallenges = () => {
        let filtered = challenges;

        if (filterMode === "active") filtered = activeChallenges;
        else if (filterMode === "upcoming") filtered = upcomingChallenges;
        else if (filterMode === "completed") filtered = completedChallenges;

        if (difficultyFilter !== "all") {
            filtered = filtered.filter((c) => c.difficulty === difficultyFilter);
        }

        return filtered;
    };

    const filteredChallenges = getFilteredChallenges();

    // Handle challenge selection
    const handleSelectChallenge = (id: string) => {
        selectChallenge(id);
        setViewMode("detail");
    };

    const handleBack = () => {
        selectChallenge(null);
        setViewMode("dashboard");
    };

    if (viewMode === "detail" && selectedChallenge) {
        return (
            <div className="space-y-6">
                <ChallengeDetail
                    challenge={selectedChallenge}
                    hasJoined={hasJoined(selectedChallenge.id)}
                    onBack={handleBack}
                    onJoin={() => joinChallenge(selectedChallenge.id)}
                    onStartSubmission={() => setViewMode("submission")}
                />
                {hasJoined(selectedChallenge.id) && (
                    <Leaderboard challengeId={selectedChallenge.id} />
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--forge-text-primary)]">
                        Competitions
                    </h2>
                    <p className="text-[var(--forge-text-muted)] mt-1">
                        Build solutions, compete on metrics, climb the ranks
                    </p>
                </div>
                <button
                    onClick={refresh}
                    className="p-2 rounded-lg hover:bg-[var(--forge-bg-anvil)] text-[var(--forge-text-muted)] transition-colors"
                >
                    <RefreshCw size={ICON_SIZES.md} className={isLoading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* User tier card */}
            <div
                className={cn(
                    "rounded-xl border border-[var(--forge-border-default)]",
                    "bg-[var(--forge-bg-elevated)] p-6",
                    elevation.elevated
                )}
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <TierDisplay
                        tier={userStats.tier}
                        points={userStats.progression.currentPoints}
                        pointsToNext={userStats.progression.pointsToNextTier}
                    />
                    <div className="flex gap-6">
                        <StatBox
                            icon={Trophy}
                            value={userStats.progression.challengesCompleted}
                            label="Completed"
                            color="amber"
                        />
                        <StatBox
                            icon={Target}
                            value={`${(userStats.progression.winRate * 100).toFixed(0)}%`}
                            label="Win Rate"
                            color="emerald"
                        />
                        <StatBox
                            icon={Zap}
                            value={joinedChallengeIds.length}
                            label="Active"
                            color="blue"
                        />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
                {/* Status filter */}
                <div className="flex rounded-lg bg-[var(--forge-bg-elevated)] p-1">
                    {(["all", "active", "upcoming", "completed"] as FilterMode[]).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setFilterMode(filter)}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
                                filterMode === filter
                                    ? "bg-[var(--ember)] text-white shadow-ember-sm"
                                    : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                            )}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                {/* Difficulty filter */}
                <div className="flex items-center gap-2">
                    <Filter size={ICON_SIZES.sm} className="text-[var(--forge-text-muted)]" />
                    <select
                        value={difficultyFilter}
                        onChange={(e) => setDifficultyFilter(e.target.value as ChallengeDifficulty | "all")}
                        className="px-3 py-1.5 rounded-lg bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-default)] text-[var(--forge-text-primary)] text-sm"
                    >
                        <option value="all">All Difficulties</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                    </select>
                </div>

                <span className="text-sm text-[var(--forge-text-muted)]">
                    {filteredChallenges.length} challenges
                </span>
            </div>

            {/* Active challenges highlight */}
            {filterMode === "all" && activeChallenges.length > 0 && (
                <section>
                    <h3 className="text-lg font-semibold text-[var(--forge-text-primary)] mb-4 flex items-center gap-2">
                        <Zap size={ICON_SIZES.md} className="text-[var(--forge-warning)]" />
                        Active Challenges
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeChallenges.slice(0, 3).map((challenge) => (
                            <ChallengeCard
                                key={challenge.id}
                                challenge={challenge}
                                hasJoined={hasJoined(challenge.id)}
                                hasSubmission={hasSubmission(challenge.id)}
                                onSelect={handleSelectChallenge}
                                onJoin={joinChallenge}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* All challenges / filtered results */}
            <section>
                {filterMode !== "all" && (
                    <h3 className="text-lg font-semibold text-[var(--forge-text-primary)] mb-4 capitalize">
                        {filterMode} Challenges
                    </h3>
                )}
                {filterMode === "all" && (
                    <h3 className="text-lg font-semibold text-[var(--forge-text-primary)] mb-4 flex items-center gap-2">
                        <Clock size={ICON_SIZES.md} className="text-[var(--forge-info)]" />
                        Upcoming Challenges
                    </h3>
                )}

                {isLoading ? (
                    <LoadingState />
                ) : filteredChallenges.length === 0 ? (
                    <EmptyState filterMode={filterMode} />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence mode="popLayout">
                            {(filterMode === "all" ? upcomingChallenges : filteredChallenges).map((challenge) => (
                                <ChallengeCard
                                    key={challenge.id}
                                    challenge={challenge}
                                    hasJoined={hasJoined(challenge.id)}
                                    hasSubmission={hasSubmission(challenge.id)}
                                    onSelect={handleSelectChallenge}
                                    onJoin={joinChallenge}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </section>
        </div>
    );
};

// Stat box component
interface StatBoxProps {
    icon: React.ElementType;
    value: number | string;
    label: string;
    color: "amber" | "emerald" | "blue";
}

const StatBox: React.FC<StatBoxProps> = ({ icon: Icon, value, label, color }) => {
    const colorClasses = {
        amber: "bg-[var(--forge-warning)]/10 text-[var(--forge-warning)]",
        emerald: "bg-[var(--forge-success)]/10 text-[var(--forge-success)]",
        blue: "bg-[var(--forge-info)]/10 text-[var(--forge-info)]",
    }[color];

    return (
        <div className="text-center">
            <div className={cn("inline-flex p-2 rounded-lg mb-1", colorClasses)}>
                <Icon size={ICON_SIZES.md} />
            </div>
            <p className="text-xl font-bold text-[var(--forge-text-primary)]">{value}</p>
            <p className="text-xs text-[var(--forge-text-muted)]">{label}</p>
        </div>
    );
};

// Loading state
const LoadingState: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
            <div
                key={i}
                className="h-64 rounded-xl bg-[var(--forge-bg-elevated)] animate-pulse"
            />
        ))}
    </div>
);

// Empty state
interface EmptyStateProps {
    filterMode: FilterMode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ filterMode }) => (
    <div className="text-center py-12">
        <Trophy size={ICON_SIZES.xl} className="text-[var(--forge-text-muted)] mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-[var(--forge-text-primary)]">
            No {filterMode !== "all" ? filterMode : ""} challenges found
        </h3>
        <p className="text-[var(--forge-text-muted)] mt-1">
            {filterMode === "active"
                ? "Check back soon for new challenges!"
                : filterMode === "completed"
                ? "Complete some challenges to see them here."
                : "Try adjusting your filters."}
        </p>
    </div>
);
