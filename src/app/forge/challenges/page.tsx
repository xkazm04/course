"use client";

import React, { useState, useMemo, Suspense, lazy } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/app/shared/lib/utils";
import { mockChallenges, mockProjects } from "../lib/mockData";
import type { ChallengeType, ChallengeDifficulty } from "../lib/types";
import { DemoBanner } from "../components";
import { SkeletonTable } from "../components/LazySection";
import {
    difficultyOrder,
    difficultyColors,
    typeOptions,
    type SortKey,
    type SortDir,
} from "./components/constants";
import { FilterBar } from "./components/FilterBar";
import { StatsRow } from "./components/StatsRow";

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
        let result = mockChallenges.filter((challenge) => {
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
// LEGEND
// ============================================================================

function DifficultyLegend() {
    return (
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
                <StatsRow challenges={filteredAndSorted} />
            </div>

            {/* Table - Lazy loaded */}
            <Suspense fallback={<SkeletonTable rows={8} />}>
                <ChallengesTable
                    challenges={filteredAndSorted}
                    totalCount={mockChallenges.length}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                    onClearFilters={clearAll}
                />
            </Suspense>

            {/* Legend */}
            <DifficultyLegend />
        </div>
    );
}
