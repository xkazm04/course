"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    Search,
    ChevronDown,
    ChevronUp,
    X,
    ArrowUpDown,
    ArrowRight,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { mockChallenges, mockProjects } from "../lib/mockData";
import type { ChallengeType, ChallengeDifficulty, Challenge } from "../lib/types";
import { DemoBanner } from "../components";

// ============================================================================
// CONSTANTS
// ============================================================================

const typeOptions: { value: ChallengeType | "all"; label: string; emoji: string }[] = [
    { value: "all", label: "All", emoji: "🎯" },
    { value: "bug", label: "Bug", emoji: "🐛" },
    { value: "feature", label: "Feature", emoji: "✨" },
    { value: "refactor", label: "Refactor", emoji: "🔧" },
    { value: "test", label: "Test", emoji: "🧪" },
    { value: "docs", label: "Docs", emoji: "📚" },
    { value: "performance", label: "Perf", emoji: "⚡" },
    { value: "security", label: "Security", emoji: "🔒" },
];

const difficultyOptions: { value: ChallengeDifficulty | "all"; label: string }[] = [
    { value: "all", label: "All Levels" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
];

type SortKey = "title" | "xpReward" | "estimatedMinutes" | "difficulty" | "successRate" | "timesCompleted";
type SortDir = "asc" | "desc";

const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };

const difficultyColors = {
    beginner: "bg-[var(--forge-success)]/10 text-[var(--forge-success)] border-[var(--forge-success)]/20",
    intermediate: "bg-[var(--gold)]/10 text-[var(--gold)] border-[var(--gold)]/20",
    advanced: "bg-[var(--forge-error)]/10 text-[var(--forge-error)] border-[var(--forge-error)]/20",
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
// TABLE HEADER CELL
// ============================================================================

function SortableHeader({
    label,
    sortKey,
    currentSort,
    currentDir,
    onSort,
    align = "left",
}: {
    label: string;
    sortKey: SortKey;
    currentSort: SortKey;
    currentDir: SortDir;
    onSort: (key: SortKey) => void;
    align?: "left" | "center" | "right";
}) {
    const isActive = currentSort === sortKey;
    const alignClass = align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";

    return (
        <button
            onClick={() => onSort(sortKey)}
            className={cn(
                "flex items-center gap-1 text-xs font-medium uppercase tracking-wider transition-colors w-full",
                alignClass,
                isActive ? "text-[var(--ember)]" : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)]"
            )}
        >
            {label}
            {isActive ? (
                currentDir === "asc" ? (
                    <ChevronUp size={14} />
                ) : (
                    <ChevronDown size={14} />
                )
            ) : (
                <ArrowUpDown size={12} className="opacity-40" />
            )}
        </button>
    );
}

// ============================================================================
// TABLE ROW
// ============================================================================

function ChallengeRow({ challenge, index }: { challenge: Challenge; index: number }) {
    return (
        <Link
            href={`/forge/challenges/${challenge.id}`}
            className={cn(
                "group grid grid-cols-[2fr_100px_80px_100px_80px_70px_70px_60px] gap-4 px-4 py-3 items-center hover:bg-[var(--ember)]/5 transition-colors",
                index % 2 === 0 ? "bg-[var(--forge-bg-daylight)]/40" : "bg-[var(--forge-bg-daylight)]/60"
            )}
        >
            {/* Title & Project */}
            <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg flex-shrink-0">{typeEmojis[challenge.type]}</span>
                <div className="min-w-0">
                    <div className="font-medium text-[var(--forge-text-primary)] group-hover:text-[var(--ember)] transition-colors truncate">
                        {challenge.title}
                    </div>
                    <div className="text-xs text-[var(--forge-text-muted)] truncate">{challenge.projectName}</div>
                </div>
            </div>

            {/* Difficulty */}
            <div>
                <span className={cn("px-2 py-0.5 rounded text-xs font-medium capitalize border", difficultyColors[challenge.difficulty])}>
                    {challenge.difficulty}
                </span>
            </div>

            {/* Type */}
            <div className="text-xs text-[var(--forge-text-secondary)] capitalize">{challenge.type}</div>

            {/* XP */}
            <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gradient-to-r from-[var(--ember)]/5 to-[var(--ember-glow)]/5 text-[var(--ember)] text-sm font-semibold">
                    +{challenge.xpReward}
                </span>
            </div>

            {/* Time */}
            <div className="text-sm text-[var(--forge-text-secondary)] text-right">
                {challenge.estimatedMinutes}min
            </div>

            {/* Completed */}
            <div className="text-sm text-[var(--forge-text-secondary)] text-center">
                {challenge.timesCompleted}
            </div>

            {/* Success */}
            <div className="text-sm text-center">
                <span className={cn(
                    "font-medium",
                    (challenge.successRate || 0) >= 0.8 ? "text-[var(--forge-success)]" :
                        (challenge.successRate || 0) >= 0.5 ? "text-[var(--gold)]" : "text-[var(--forge-error)]"
                )}>
                    {Math.round((challenge.successRate || 0) * 100)}%
                </span>
            </div>

            {/* Action */}
            <div className="flex justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--ember)]">
                    <ArrowRight size={16} />
                </span>
            </div>
        </Link>
    );
}

// ============================================================================
// STATS ROW
// ============================================================================

function StatsRow({ challenges }: { challenges: Challenge[] }) {
    const totalXP = challenges.reduce((sum, c) => sum + c.xpReward, 0);
    const avgTime = Math.round(challenges.reduce((sum, c) => sum + c.estimatedMinutes, 0) / (challenges.length || 1));
    const avgSuccess = Math.round(
        (challenges.reduce((sum, c) => sum + (c.successRate || 0), 0) / (challenges.length || 1)) * 100
    );

    const stats = [
        { label: "Challenges", value: challenges.length, icon: "🎯" },
        { label: "Total XP", value: totalXP.toLocaleString(), icon: "⚡" },
        { label: "Avg Time", value: `${avgTime}min`, icon: "⏱️" },
        { label: "Avg Success", value: `${avgSuccess}%`, icon: "📈" },
    ];

    return (
        <div className="flex items-center gap-6 px-4 py-3 bg-gradient-to-r from-[var(--ember)]/5 to-[var(--ember-glow)]/5 border-b border-[var(--ember)]/10">
            {stats.map((stat, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span>{stat.icon}</span>
                    <span className="text-sm text-[var(--forge-text-secondary)]">{stat.label}:</span>
                    <span className="text-sm font-semibold text-[var(--forge-text-primary)]">{stat.value}</span>
                </div>
            ))}
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
    const [sortKey, setSortKey] = useState<SortKey>("xpReward");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [showFilters, setShowFilters] = useState(false);

    // Handle sort
    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDir("desc");
        }
    };

    // Filter and sort challenges
    const filteredAndSorted = useMemo(() => {
        let result = mockChallenges.filter((challenge) => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!challenge.title.toLowerCase().includes(query) &&
                    !challenge.description.toLowerCase().includes(query) &&
                    !challenge.projectName.toLowerCase().includes(query)) {
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

    const activeFilters = [
        type !== "all" && { key: "type", value: type, label: typeOptions.find(t => t.value === type)?.label || type },
        difficulty !== "all" && { key: "difficulty", value: difficulty },
        project !== "all" && { key: "project", value: project },
    ].filter(Boolean) as { key: string; value: string; label?: string }[];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-[var(--forge-text-primary)]">Challenges</h1>
                    <DemoBanner />
                </div>
                <p className="text-[var(--forge-text-secondary)]">
                    Browse and filter all available challenges. Each is a real contribution to an open-source project.
                </p>
            </div>

            {/* Filter Bar */}
            <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm mb-6">
                {/* Main filter row */}
                <div className="flex flex-wrap items-center gap-3 p-4 border-b border-[var(--forge-border-subtle)]">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--forge-text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search challenges..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] text-sm text-[var(--forge-text-primary)] placeholder-[var(--forge-text-muted)] focus:outline-none focus:border-[var(--ember)]/50 focus:ring-2 focus:ring-[var(--ember)]/10"
                        />
                    </div>

                    {/* Difficulty pills */}
                    <div className="flex items-center gap-1 p-1 bg-[var(--forge-bg-elevated)] rounded-lg">
                        {difficultyOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setDifficulty(opt.value)}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                                    difficulty === opt.value
                                        ? "bg-[var(--forge-bg-daylight)] text-[var(--forge-text-primary)] shadow-sm"
                                        : "text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)]"
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Type pills */}
                    <div className="flex items-center gap-1 overflow-x-auto">
                        {typeOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setType(opt.value)}
                                className={cn(
                                    "flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                                    type === opt.value
                                        ? "bg-[var(--ember)]/10 text-[var(--ember)] border border-[var(--ember)]/20"
                                        : "text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-elevated)]"
                                )}
                            >
                                <span>{opt.emoji}</span>
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Project filter */}
                    <select
                        value={project}
                        onChange={(e) => setProject(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] text-sm text-[var(--forge-text-secondary)] focus:outline-none focus:border-[var(--ember)]/50"
                    >
                        <option value="all">All Projects</option>
                        {mockProjects.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    {/* Clear filters */}
                    {activeFilters.length > 0 && (
                        <button
                            onClick={() => {
                                setType("all");
                                setDifficulty("all");
                                setProject("all");
                                setSearchQuery("");
                            }}
                            className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-[var(--forge-error)] hover:bg-[var(--forge-error)]/5 rounded-lg transition-colors"
                        >
                            <X size={14} />
                            Clear all
                        </button>
                    )}
                </div>

                {/* Stats row */}
                <StatsRow challenges={filteredAndSorted} />
            </div>

            {/* Table */}
            <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[2fr_100px_80px_100px_80px_70px_70px_60px] gap-4 px-4 py-3 bg-[var(--forge-bg-elevated)] border-b border-[var(--forge-border-subtle)]">
                    <SortableHeader
                        label="Challenge"
                        sortKey="title"
                        currentSort={sortKey}
                        currentDir={sortDir}
                        onSort={handleSort}
                    />
                    <SortableHeader
                        label="Difficulty"
                        sortKey="difficulty"
                        currentSort={sortKey}
                        currentDir={sortDir}
                        onSort={handleSort}
                    />
                    <div className="text-xs font-medium uppercase tracking-wider text-[var(--forge-text-muted)]">Type</div>
                    <SortableHeader
                        label="XP"
                        sortKey="xpReward"
                        currentSort={sortKey}
                        currentDir={sortDir}
                        onSort={handleSort}
                        align="right"
                    />
                    <SortableHeader
                        label="Time"
                        sortKey="estimatedMinutes"
                        currentSort={sortKey}
                        currentDir={sortDir}
                        onSort={handleSort}
                        align="right"
                    />
                    <SortableHeader
                        label="Done"
                        sortKey="timesCompleted"
                        currentSort={sortKey}
                        currentDir={sortDir}
                        onSort={handleSort}
                        align="center"
                    />
                    <SortableHeader
                        label="Success"
                        sortKey="successRate"
                        currentSort={sortKey}
                        currentDir={sortDir}
                        onSort={handleSort}
                        align="center"
                    />
                    <div></div>
                </div>

                {/* Table body */}
                <div className="divide-y divide-[var(--forge-border-subtle)]">
                    {filteredAndSorted.length > 0 ? (
                        filteredAndSorted.map((challenge, index) => (
                            <ChallengeRow key={challenge.id} challenge={challenge} index={index} />
                        ))
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-12 h-12 rounded-full bg-[var(--forge-bg-elevated)] flex items-center justify-center mx-auto mb-3">
                                <Search size={20} className="text-[var(--forge-text-muted)]" />
                            </div>
                            <h3 className="font-medium text-[var(--forge-text-primary)] mb-1">No challenges found</h3>
                            <p className="text-sm text-[var(--forge-text-muted)] mb-4">Try adjusting your filters</p>
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setType("all");
                                    setDifficulty("all");
                                    setProject("all");
                                }}
                                className="text-sm text-[var(--ember)] hover:underline"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>

                {/* Table footer */}
                {filteredAndSorted.length > 0 && (
                    <div className="px-4 py-3 bg-[var(--forge-bg-elevated)] border-t border-[var(--forge-border-subtle)] text-sm text-[var(--forge-text-secondary)]">
                        Showing {filteredAndSorted.length} of {mockChallenges.length} challenges
                    </div>
                )}
            </div>

            {/* Quick legend */}
            <div className="flex items-center justify-center gap-6 mt-6 text-xs text-[var(--forge-text-muted)]">
                <div className="flex items-center gap-1">
                    <span className={cn("px-2 py-0.5 rounded border", difficultyColors.beginner)}>Beginner</span>
                    <span>= Good first issue</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className={cn("px-2 py-0.5 rounded border", difficultyColors.intermediate)}>Intermediate</span>
                    <span>= Some experience</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className={cn("px-2 py-0.5 rounded border", difficultyColors.advanced)}>Advanced</span>
                    <span>= Expert level</span>
                </div>
            </div>
        </div>
    );
}
