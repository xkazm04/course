"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    Search,
    Filter,
    Target,
    Clock,
    ChevronDown,
    X,
    Zap,
    ArrowRight,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { mockChallenges, mockProjects } from "../lib/mockData";
import type { ChallengeType, ChallengeDifficulty } from "../lib/types";

// ============================================================================
// CONSTANTS
// ============================================================================

const typeOptions: { value: ChallengeType | "all"; label: string; emoji: string }[] = [
    { value: "all", label: "All Types", emoji: "🎯" },
    { value: "bug", label: "Bug Fix", emoji: "🐛" },
    { value: "feature", label: "Feature", emoji: "✨" },
    { value: "refactor", label: "Refactor", emoji: "🔧" },
    { value: "test", label: "Testing", emoji: "🧪" },
    { value: "docs", label: "Documentation", emoji: "📚" },
    { value: "performance", label: "Performance", emoji: "⚡" },
    { value: "security", label: "Security", emoji: "🔒" },
];

const difficultyOptions: { value: ChallengeDifficulty | "all"; label: string }[] = [
    { value: "all", label: "All Levels" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
];

const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "xp_high", label: "Highest XP" },
    { value: "xp_low", label: "Lowest XP" },
    { value: "time_short", label: "Quickest" },
    { value: "time_long", label: "Longest" },
];

const difficultyColors = {
    beginner: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    intermediate: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    advanced: "text-rose-500 bg-rose-500/10 border-rose-500/20",
};

const typeEmojis: Record<ChallengeType, string> = {
    bug: "🐛",
    feature: "✨",
    refactor: "🔧",
    test: "🧪",
    docs: "📚",
    performance: "⚡",
    security: "🔒",
};

// ============================================================================
// CHALLENGE CARD
// ============================================================================

function ChallengeCard({ challenge }: { challenge: typeof mockChallenges[0] }) {
    return (
        <Link
            href={`/forge/challenges/${challenge.id}`}
            className="group flex flex-col bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] overflow-hidden hover:border-[var(--accent-primary)] transition-all"
        >
            {/* Header */}
            <div className="p-5">
                <div className="flex items-start gap-4">
                    <div className="text-3xl">{typeEmojis[challenge.type]}</div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <span
                                className={cn(
                                    "px-2 py-0.5 rounded text-xs font-medium capitalize border",
                                    difficultyColors[challenge.difficulty]
                                )}
                            >
                                {challenge.difficulty}
                            </span>
                            <span className="text-xs text-[var(--text-muted)] capitalize">
                                {challenge.type}
                            </span>
                        </div>
                        <h3 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent-primary)] transition-colors line-clamp-2">
                            {challenge.title}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                            {challenge.description}
                        </p>
                    </div>
                </div>
            </div>

            {/* Meta */}
            <div className="px-5 py-3 mt-auto bg-[var(--surface-overlay)] border-t border-[var(--border-subtle)]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-amber-500 font-medium">
                            <Zap size={14} />
                            +{challenge.xpReward} XP
                        </span>
                        <span className="flex items-center gap-1 text-[var(--text-muted)]">
                            <Clock size={14} />
                            ~{challenge.estimatedMinutes}min
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)]">
                        <span className="text-xs">Start</span>
                        <ArrowRight size={14} />
                    </div>
                </div>
            </div>

            {/* Project */}
            <div className="px-5 py-2 bg-[var(--surface-base)] border-t border-[var(--border-subtle)]">
                <span className="text-xs text-[var(--text-muted)]">
                    Project: <span className="text-[var(--text-secondary)]">{challenge.projectName}</span>
                </span>
            </div>
        </Link>
    );
}

// ============================================================================
// RECOMMENDED SECTION
// ============================================================================

function RecommendedSection() {
    const recommended = mockChallenges.filter((c) => c.difficulty === "beginner").slice(0, 3);

    return (
        <div className="mb-8 p-6 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent rounded-xl border border-orange-500/20">
            <div className="flex items-center gap-2 mb-4">
                <Target size={20} className="text-orange-500" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    Recommended for You
                </h2>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
                Based on your skill level and interests, we think you'd enjoy these challenges.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
                {recommended.map((challenge) => (
                    <Link
                        key={challenge.id}
                        href={`/forge/challenges/${challenge.id}`}
                        className="group flex items-center gap-3 p-3 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border-default)] hover:border-[var(--accent-primary)] transition-colors"
                    >
                        <span className="text-2xl">{typeEmojis[challenge.type]}</span>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent-primary)]">
                                {challenge.title}
                            </h3>
                            <p className="text-xs text-[var(--text-muted)]">
                                +{challenge.xpReward} XP • ~{challenge.estimatedMinutes}min
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ChallengesPage() {
    const searchParams = useSearchParams();
    const projectFilter = searchParams.get("project");

    const [searchQuery, setSearchQuery] = useState("");
    const [type, setType] = useState<ChallengeType | "all">("all");
    const [difficulty, setDifficulty] = useState<ChallengeDifficulty | "all">("all");
    const [project, setProject] = useState<string>(projectFilter || "all");
    const [sort, setSort] = useState("newest");
    const [showFilters, setShowFilters] = useState(false);

    // Filter challenges
    const filteredChallenges = mockChallenges.filter((challenge) => {
        if (searchQuery && !challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !challenge.description.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        if (type !== "all" && challenge.type !== type) return false;
        if (difficulty !== "all" && challenge.difficulty !== difficulty) return false;
        if (project !== "all") {
            const proj = mockProjects.find((p) => p.slug === project);
            if (proj && challenge.projectId !== proj.id) return false;
        }
        return true;
    });

    // Sort challenges
    const sortedChallenges = [...filteredChallenges].sort((a, b) => {
        switch (sort) {
            case "xp_high":
                return b.xpReward - a.xpReward;
            case "xp_low":
                return a.xpReward - b.xpReward;
            case "time_short":
                return a.estimatedMinutes - b.estimatedMinutes;
            case "time_long":
                return b.estimatedMinutes - a.estimatedMinutes;
            default:
                return 0;
        }
    });

    const activeFilters = [
        type !== "all" && { key: "type", value: type },
        difficulty !== "all" && { key: "difficulty", value: difficulty },
        project !== "all" && { key: "project", value: project },
    ].filter(Boolean) as { key: string; value: string }[];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                    Challenges
                </h1>
                <p className="text-[var(--text-secondary)]">
                    Find a task that matches your skills. Each challenge is a real contribution to an open-source project.
                </p>
            </div>

            {/* Recommended */}
            <RecommendedSection />

            {/* Search & Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Search */}
                <div className="relative flex-1">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)]"
                    />
                    <input
                        type="text"
                        placeholder="Search challenges..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                </div>

                {/* Quick Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                    {difficultyOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setDifficulty(opt.value)}
                            className={cn(
                                "px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                                difficulty === opt.value
                                    ? "bg-[var(--accent-primary)] text-white"
                                    : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)]"
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* More Filters */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors",
                        showFilters
                            ? "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)]"
                            : "bg-[var(--surface-elevated)] border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                    )}
                >
                    <Filter size={18} />
                    More
                </button>

                {/* Sort */}
                <div className="relative">
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="appearance-none px-4 py-2.5 pr-10 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    >
                        {sortOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown
                        size={16}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
                    />
                </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
                <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-4 mb-6">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Type */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Challenge Type
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {typeOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setType(opt.value)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                            type === opt.value
                                                ? "bg-[var(--accent-primary)] text-white"
                                                : "bg-[var(--surface-overlay)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                        )}
                                    >
                                        <span>{opt.emoji}</span>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Project */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Project
                            </label>
                            <select
                                value={project}
                                onChange={(e) => setProject(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-overlay)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                            >
                                <option value="all">All Projects</option>
                                {mockProjects.map((p) => (
                                    <option key={p.id} value={p.slug}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Filters */}
            {activeFilters.length > 0 && (
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                    <span className="text-sm text-[var(--text-muted)]">Active filters:</span>
                    {activeFilters.map((filter) => (
                        <button
                            key={`${filter.key}-${filter.value}`}
                            onClick={() => {
                                if (filter.key === "type") setType("all");
                                if (filter.key === "difficulty") setDifficulty("all");
                                if (filter.key === "project") setProject("all");
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-sm"
                        >
                            <span className="capitalize">{filter.value.replace("_", " ")}</span>
                            <X size={14} />
                        </button>
                    ))}
                    <button
                        onClick={() => {
                            setType("all");
                            setDifficulty("all");
                            setProject("all");
                        }}
                        className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                        Clear all
                    </button>
                </div>
            )}

            {/* Results count */}
            <div className="text-sm text-[var(--text-muted)] mb-4">
                Showing {sortedChallenges.length} challenge{sortedChallenges.length !== 1 ? "s" : ""}
            </div>

            {/* Challenges Grid */}
            {sortedChallenges.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedChallenges.map((challenge) => (
                        <ChallengeCard key={challenge.id} challenge={challenge} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center mx-auto mb-4">
                        <Search size={24} className="text-[var(--text-muted)]" />
                    </div>
                    <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                        No challenges found
                    </h3>
                    <p className="text-[var(--text-secondary)] mb-4">
                        Try adjusting your search or filters
                    </p>
                    <button
                        onClick={() => {
                            setSearchQuery("");
                            setType("all");
                            setDifficulty("all");
                            setProject("all");
                        }}
                        className="text-[var(--accent-primary)] hover:underline"
                    >
                        Clear all filters
                    </button>
                </div>
            )}
        </div>
    );
}
