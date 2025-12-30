"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Compass,
    GitBranch,
    Sparkles,
    Filter,
    X,
    SlidersHorizontal,
    LayoutGrid,
    List,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { useDiscovery } from "../lib/useDiscovery";
import { MatchingPreferences, TaskComplexity, COMPLEXITY_CONFIG } from "../lib/types";
import { IssueCard } from "./IssueCard";
import { SkillMatcher, getDefaultMatchingPreferences } from "./SkillMatcher";
import { RepositoryBrowser } from "./RepositoryBrowser";

type ViewMode = "issues" | "repositories";
type LayoutMode = "grid" | "list";

export const DiscoveryDashboard: React.FC = () => {
    const {
        repositories,
        filteredIssues,
        filters,
        watchedRepositoryIds,
        availableLanguages,
        isLoading,
        toggleComplexityFilter,
        toggleGoodFirstIssue,
        resetFilters,
        toggleWatchRepository,
        getMatchResults,
    } = useDiscovery();

    const [viewMode, setViewMode] = useState<ViewMode>("issues");
    const [layoutMode, setLayoutMode] = useState<LayoutMode>("grid");
    const [preferences, setPreferences] = useState<MatchingPreferences>(
        getDefaultMatchingPreferences()
    );
    const [showMatcher, setShowMatcher] = useState(true);
    const [selectedRepoId, setSelectedRepoId] = useState<string | undefined>();

    const matchResults = useMemo(() => {
        return getMatchResults(preferences);
    }, [getMatchResults, preferences]);

    const activeFiltersCount =
        filters.complexity.length +
        filters.languages.length +
        filters.repositories.length +
        (filters.hasGoodFirstIssueLabel ? 1 : 0) +
        (filters.maxEstimatedHours !== null ? 1 : 0);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <Compass size={ICON_SIZES.xl} className="text-[var(--ember)]" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--forge-text-primary)]">
                        Discover Contributions
                    </h2>
                    <p className="text-[var(--forge-text-muted)] mt-1">
                        Find real open-source issues that match your skills
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* View toggle */}
                    <div className="flex rounded-lg bg-[var(--forge-bg-elevated)] p-1">
                        <button
                            onClick={() => setViewMode("issues")}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                                viewMode === "issues"
                                    ? "bg-[var(--ember)] text-white"
                                    : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                            )}
                        >
                            Issues
                        </button>
                        <button
                            onClick={() => setViewMode("repositories")}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                                viewMode === "repositories"
                                    ? "bg-[var(--ember)] text-white"
                                    : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                            )}
                        >
                            Repositories
                        </button>
                    </div>
                </div>
            </div>

            {/* Content based on view mode */}
            {viewMode === "issues" ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sidebar - Skill Matcher & Filters */}
                    <div className="lg:col-span-1 space-y-4">
                        <SkillMatcher
                            availableLanguages={availableLanguages}
                            preferences={preferences}
                            onPreferencesChange={setPreferences}
                            onFindMatches={() => {}}
                            matchCount={matchResults.length}
                        />

                        {/* Quick filters */}
                        <QuickFilters
                            filters={filters}
                            onToggleComplexity={toggleComplexityFilter}
                            onToggleGoodFirstIssue={toggleGoodFirstIssue}
                            onReset={resetFilters}
                            activeCount={activeFiltersCount}
                        />
                    </div>

                    {/* Main content - Issues */}
                    <div className="lg:col-span-2">
                        <IssueListHeader
                            count={matchResults.length}
                            layoutMode={layoutMode}
                            onLayoutChange={setLayoutMode}
                        />
                        <div className={cn(
                            "mt-4",
                            layoutMode === "grid"
                                ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                                : "space-y-4"
                        )}>
                            <AnimatePresence mode="popLayout">
                                {matchResults.map(result => (
                                    <IssueCard
                                        key={result.issue.id}
                                        issue={result.issue}
                                        matchScore={result.matchScore}
                                        stretchOpportunities={result.stretchOpportunities}
                                        onClaim={issue => console.log("Claim:", issue.id)}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>

                        {matchResults.length === 0 && (
                            <EmptyState
                                title="No matching issues found"
                                description="Try adjusting your filters or preferences to see more issues"
                                onReset={resetFilters}
                            />
                        )}
                    </div>
                </div>
            ) : (
                <RepositoryBrowser
                    repositories={repositories}
                    watchedRepositoryIds={watchedRepositoryIds}
                    onToggleWatch={toggleWatchRepository}
                    onSelectRepository={repo => setSelectedRepoId(repo.id)}
                    selectedRepositoryId={selectedRepoId}
                />
            )}
        </div>
    );
};

// Quick filters component
interface QuickFiltersProps {
    filters: {
        complexity: TaskComplexity[];
        hasGoodFirstIssueLabel: boolean;
    };
    onToggleComplexity: (c: TaskComplexity) => void;
    onToggleGoodFirstIssue: () => void;
    onReset: () => void;
    activeCount: number;
}

const QuickFilters: React.FC<QuickFiltersProps> = ({
    filters,
    onToggleComplexity,
    onToggleGoodFirstIssue,
    onReset,
    activeCount,
}) => {
    const complexities: TaskComplexity[] = ["trivial", "simple", "moderate", "complex", "expert"];

    return (
        <div className="rounded-xl border border-[var(--forge-border-default)] bg-[var(--forge-bg-elevated)] p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal size={ICON_SIZES.sm} className="text-[var(--forge-text-muted)]" />
                    <span className="text-sm font-medium text-[var(--forge-text-primary)]">
                        Quick Filters
                    </span>
                </div>
                {activeCount > 0 && (
                    <button
                        onClick={onReset}
                        className="text-xs text-[var(--ember)] hover:underline"
                    >
                        Reset ({activeCount})
                    </button>
                )}
            </div>

            {/* Good first issue toggle */}
            <button
                onClick={onToggleGoodFirstIssue}
                className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-3 transition-colors",
                    filters.hasGoodFirstIssueLabel
                        ? "bg-[var(--forge-success)]/20 text-[var(--forge-success)]"
                        : "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                )}
            >
                <Sparkles size={ICON_SIZES.sm} />
                Good First Issues Only
            </button>

            {/* Complexity filters */}
            <div className="space-y-1">
                <span className="text-xs text-[var(--forge-text-muted)]">Complexity</span>
                <div className="flex flex-wrap gap-1.5">
                    {complexities.map(c => {
                        const config = COMPLEXITY_CONFIG[c];
                        const isSelected = filters.complexity.includes(c);
                        return (
                            <button
                                key={c}
                                onClick={() => onToggleComplexity(c)}
                                className={cn(
                                    "px-2 py-1 rounded text-xs font-medium transition-colors",
                                    isSelected
                                        ? `${config.bgColor} ${config.color}`
                                        : "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)]"
                                )}
                            >
                                {config.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Issue list header
interface IssueListHeaderProps {
    count: number;
    layoutMode: LayoutMode;
    onLayoutChange: (mode: LayoutMode) => void;
}

const IssueListHeader: React.FC<IssueListHeaderProps> = ({
    count,
    layoutMode,
    onLayoutChange,
}) => {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--forge-text-muted)]">
                {count} issue{count !== 1 ? "s" : ""} found
            </span>
            <div className="flex rounded-lg bg-[var(--forge-bg-elevated)] p-1">
                <button
                    onClick={() => onLayoutChange("grid")}
                    className={cn(
                        "p-1.5 rounded transition-colors",
                        layoutMode === "grid"
                            ? "bg-[var(--forge-bg-anvil)] text-[var(--forge-text-primary)]"
                            : "text-[var(--forge-text-muted)]"
                    )}
                >
                    <LayoutGrid size={ICON_SIZES.sm} />
                </button>
                <button
                    onClick={() => onLayoutChange("list")}
                    className={cn(
                        "p-1.5 rounded transition-colors",
                        layoutMode === "list"
                            ? "bg-[var(--forge-bg-anvil)] text-[var(--forge-text-primary)]"
                            : "text-[var(--forge-text-muted)]"
                    )}
                >
                    <List size={ICON_SIZES.sm} />
                </button>
            </div>
        </div>
    );
};

// Empty state
interface EmptyStateProps {
    title: string;
    description: string;
    onReset: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, onReset }) => {
    return (
        <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--forge-bg-elevated)] mb-4">
                <GitBranch size={ICON_SIZES.xl} className="text-[var(--forge-text-muted)]" />
            </div>
            <h3 className="text-lg font-medium text-[var(--forge-text-primary)]">{title}</h3>
            <p className="text-[var(--forge-text-muted)] mt-1 max-w-md mx-auto">{description}</p>
            <button
                onClick={onReset}
                className="mt-4 px-4 py-2 rounded-lg bg-[var(--ember)] text-white text-sm font-medium hover:brightness-110 transition-colors"
            >
                Reset Filters
            </button>
        </div>
    );
};
