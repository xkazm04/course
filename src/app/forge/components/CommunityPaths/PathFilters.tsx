"use client";

import { useState, useEffect } from "react";
import { Search, ChevronDown, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { CommunityPathsFilters, PathDomain, PathDifficulty } from "../../lib/communityPathsTypes";

interface PathFiltersProps {
    filters: CommunityPathsFilters;
    onFilterChange: (key: keyof CommunityPathsFilters, value: string) => void;
}

const DOMAINS: { value: PathDomain | "all"; label: string }[] = [
    { value: "all", label: "All Domains" },
    { value: "frontend", label: "Frontend" },
    { value: "backend", label: "Backend" },
    { value: "fullstack", label: "Fullstack" },
    { value: "data", label: "Data Science" },
    { value: "devops", label: "DevOps" },
    { value: "mobile", label: "Mobile" },
    { value: "design", label: "Design" },
    { value: "ai-ml", label: "AI/ML" },
];

const DIFFICULTIES: { value: PathDifficulty | "all"; label: string }[] = [
    { value: "all", label: "All Levels" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
];

const DURATIONS = [
    { value: "any", label: "Any Duration" },
    { value: "short", label: "< 10 hours" },
    { value: "medium", label: "10-30 hours" },
    { value: "long", label: "30-60 hours" },
    { value: "extended", label: "60+ hours" },
];

const SORT_OPTIONS = [
    { value: "popular", label: "Most Popular" },
    { value: "recent", label: "Most Recent" },
    { value: "duration_asc", label: "Shortest First" },
    { value: "duration_desc", label: "Longest First" },
];

function FilterDropdown({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find((o) => o.value === value);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    "bg-[var(--forge-bg-elevated)]/60 border border-[var(--forge-border-subtle)]",
                    "hover:border-[var(--ember)]/30 hover:bg-[var(--forge-bg-elevated)]",
                    isOpen && "border-[var(--ember)]/50 bg-[var(--forge-bg-elevated)]"
                )}
            >
                <span className="text-[var(--forge-text-secondary)]">{selectedOption?.label || label}</span>
                <ChevronDown
                    size={14}
                    className={cn(
                        "text-[var(--forge-text-muted)] transition-transform",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 mt-2 z-50 min-w-[160px] py-1 rounded-xl bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] shadow-xl shadow-black/20 backdrop-blur-xl">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full px-3 py-2 text-left text-sm transition-colors",
                                    option.value === value
                                        ? "bg-[var(--ember)]/10 text-[var(--ember)]"
                                        : "text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-bench)] hover:text-[var(--forge-text-primary)]"
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export function PathFilters({ filters, onFilterChange }: PathFiltersProps) {
    const [searchValue, setSearchValue] = useState(filters.search || "");

    // Debounce search
    useEffect(() => {
        const timeout = setTimeout(() => {
            onFilterChange("search", searchValue);
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchValue, onFilterChange]);

    const hasActiveFilters =
        filters.domain !== "all" ||
        filters.difficulty !== "all" ||
        filters.duration !== "any" ||
        filters.search;

    const clearFilters = () => {
        onFilterChange("domain", "all");
        onFilterChange("difficulty", "all");
        onFilterChange("duration", "any");
        onFilterChange("search", "");
        setSearchValue("");
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Main filter row */}
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[var(--forge-bg-elevated)]/40 backdrop-blur-xl border border-[var(--forge-border-subtle)]">
                <div className="flex items-center gap-2 text-[var(--forge-text-muted)]">
                    <SlidersHorizontal size={16} />
                    <span className="text-sm font-medium hidden sm:inline">Filters</span>
                </div>

                <div className="h-6 w-px bg-[var(--forge-border-subtle)] hidden sm:block" />

                <div className="flex flex-wrap items-center gap-2">
                    <FilterDropdown
                        label="Domain"
                        value={filters.domain || "all"}
                        options={DOMAINS}
                        onChange={(v) => onFilterChange("domain", v)}
                    />
                    <FilterDropdown
                        label="Level"
                        value={filters.difficulty || "all"}
                        options={DIFFICULTIES}
                        onChange={(v) => onFilterChange("difficulty", v)}
                    />
                    <FilterDropdown
                        label="Duration"
                        value={filters.duration || "any"}
                        options={DURATIONS}
                        onChange={(v) => onFilterChange("duration", v)}
                    />
                    <FilterDropdown
                        label="Sort"
                        value={filters.sort || "popular"}
                        options={SORT_OPTIONS}
                        onChange={(v) => onFilterChange("sort", v)}
                    />
                </div>

                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--forge-text-muted)]"
                        />
                        <input
                            type="text"
                            placeholder="Search paths..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className={cn(
                                "w-full pl-9 pr-4 py-2 rounded-lg text-sm",
                                "bg-[var(--forge-bg-forge)] border border-[var(--forge-border-subtle)]",
                                "text-[var(--forge-text-primary)] placeholder:text-[var(--forge-text-muted)]",
                                "focus:outline-none focus:border-[var(--ember)]/50 focus:ring-1 focus:ring-[var(--ember)]/20",
                                "transition-all"
                            )}
                        />
                        {searchValue && (
                            <button
                                onClick={() => setSearchValue("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)]"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-[var(--ember)] hover:bg-[var(--ember)]/10 transition-colors"
                    >
                        <X size={14} />
                        Clear
                    </button>
                )}
            </div>
        </div>
    );
}
