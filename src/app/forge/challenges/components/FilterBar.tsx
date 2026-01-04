"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { ChallengeType, ChallengeDifficulty } from "../../lib/types";
import { mockProjects } from "../../lib/mockData";
import { typeOptions, difficultyOptions } from "./constants";

interface FilterBarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    type: ChallengeType | "all";
    onTypeChange: (value: ChallengeType | "all") => void;
    difficulty: ChallengeDifficulty | "all";
    onDifficultyChange: (value: ChallengeDifficulty | "all") => void;
    project: string;
    onProjectChange: (value: string) => void;
    onClearAll: () => void;
    hasActiveFilters: boolean;
}

export function FilterBar({
    searchQuery,
    onSearchChange,
    type,
    onTypeChange,
    difficulty,
    onDifficultyChange,
    project,
    onProjectChange,
    onClearAll,
    hasActiveFilters,
}: FilterBarProps) {
    return (
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-[var(--forge-border-subtle)]">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--forge-text-muted)]" />
                <input
                    type="text"
                    placeholder="Search challenges..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] text-sm text-[var(--forge-text-primary)] placeholder-[var(--forge-text-muted)] focus:outline-none focus:border-[var(--ember)]/50 focus:ring-2 focus:ring-[var(--ember)]/10"
                />
            </div>

            {/* Difficulty pills */}
            <div className="flex items-center gap-1 p-1 bg-[var(--forge-bg-elevated)] rounded-lg">
                {difficultyOptions.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => onDifficultyChange(opt.value)}
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
                        onClick={() => onTypeChange(opt.value)}
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
                onChange={(e) => onProjectChange(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] text-sm text-[var(--forge-text-secondary)] focus:outline-none focus:border-[var(--ember)]/50"
            >
                <option value="all">All Projects</option>
                {mockProjects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>

            {/* Clear filters */}
            {hasActiveFilters && (
                <button
                    onClick={onClearAll}
                    className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-[var(--forge-error)] hover:bg-[var(--forge-error)]/5 rounded-lg transition-colors"
                >
                    <X size={14} />
                    Clear all
                </button>
            )}
        </div>
    );
}
