"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Filter,
    X,
    ChevronDown,
    ChevronUp,
    Check,
    Layers,
    Target,
    Gauge,
    Tag,
    Globe,
} from "lucide-react";
import type { FilterFacets, FilterMode, FilterCriteria } from "../lib/filterEngine";
import type { NodeLevel, NodeStatus, DifficultyLevel } from "@/app/features/knowledge-map/lib/types";

interface FilterPanelProps {
    facets: FilterFacets | null;
    filters: FilterCriteria;
    filterMode: FilterMode;
    onToggleFilter: <T extends keyof FilterCriteria>(
        key: T,
        value: FilterCriteria[T] extends (infer U)[] | undefined ? U : never
    ) => void;
    onSetFilterMode: (mode: FilterMode) => void;
    onClearFilters: () => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

interface FilterSectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultExpanded?: boolean;
}

function FilterSection({ title, icon, children, defaultExpanded = true }: FilterSectionProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className="border-b border-[var(--forge-border-subtle)] last:border-b-0">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--forge-bg-workshop)] transition-colors"
            >
                <div className="flex items-center gap-2 text-[var(--forge-text-secondary)]">
                    {icon}
                    <span className="text-sm font-medium">{title}</span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[var(--forge-text-muted)]" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--forge-text-muted)]" />
                )}
            </button>

            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-3 pb-3">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

interface FilterChipProps {
    label: string;
    count: number;
    selected: boolean;
    onClick: () => void;
    colorClass?: string;
}

function FilterChip({ label, count, selected, onClick, colorClass }: FilterChipProps) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all
                ${selected
                    ? `bg-[var(--ember)]/20 text-[var(--ember)] border border-[var(--ember)]/30`
                    : `bg-[var(--forge-bg-anvil)] text-[var(--forge-text-secondary)] border border-transparent hover:bg-[var(--forge-bg-workshop)]`
                }
                ${colorClass || ""}
                ${count === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
            disabled={count === 0}
        >
            {selected && <Check className="w-3 h-3" />}
            <span>{label}</span>
            <span className="text-[var(--forge-text-muted)]">({count})</span>
        </button>
    );
}

export function FilterPanel({
    facets,
    filters,
    filterMode,
    onToggleFilter,
    onSetFilterMode,
    onClearFilters,
    isCollapsed = false,
    onToggleCollapse,
}: FilterPanelProps) {
    // Count active filters
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.levels?.length) count += filters.levels.length;
        if (filters.statuses?.length) count += filters.statuses.length;
        if (filters.difficulties?.length) count += filters.difficulties.length;
        if (filters.skills?.length) count += filters.skills.length;
        if (filters.domainId) count += 1;
        return count;
    }, [filters]);

    // Status color mapping
    const statusColors: Record<NodeStatus, string> = {
        completed: "text-[var(--forge-success)]",
        in_progress: "text-[var(--ember)]",
        available: "text-[var(--forge-text-secondary)]",
        locked: "text-[var(--forge-text-muted)]",
    };

    // Difficulty color mapping
    const difficultyColors: Record<DifficultyLevel, string> = {
        beginner: "text-green-500",
        intermediate: "text-yellow-500",
        advanced: "text-red-500",
    };

    if (isCollapsed) {
        return (
            <button
                onClick={onToggleCollapse}
                className="flex items-center gap-2 px-3 py-2 rounded-lg
                    bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)]
                    hover:bg-[var(--forge-bg-workshop)] transition-colors"
            >
                <Filter className="w-4 h-4 text-[var(--forge-text-muted)]" />
                <span className="text-sm text-[var(--forge-text-secondary)]">Filters</span>
                {activeFilterCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[var(--ember)] text-white text-xs">
                        {activeFilterCount}
                    </span>
                )}
            </button>
        );
    }

    return (
        <div className="bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--forge-border-subtle)]">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[var(--ember)]" />
                    <span className="text-sm font-medium text-[var(--forge-text-primary)]">
                        Filters
                    </span>
                    {activeFilterCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[var(--ember)] text-white text-xs">
                            {activeFilterCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {activeFilterCount > 0 && (
                        <button
                            onClick={onClearFilters}
                            className="text-xs text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] transition-colors"
                        >
                            Clear all
                        </button>
                    )}
                    {onToggleCollapse && (
                        <button
                            onClick={onToggleCollapse}
                            className="p-1 rounded hover:bg-[var(--forge-bg-workshop)] text-[var(--forge-text-muted)] transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Mode Toggle */}
            <div className="px-3 py-2 border-b border-[var(--forge-border-subtle)] flex items-center gap-2">
                <span className="text-xs text-[var(--forge-text-muted)]">Match:</span>
                <div className="flex rounded-md overflow-hidden border border-[var(--forge-border-subtle)]">
                    <button
                        onClick={() => onSetFilterMode("AND")}
                        className={`px-2 py-1 text-xs transition-colors
                            ${filterMode === "AND"
                                ? "bg-[var(--ember)] text-white"
                                : "bg-[var(--forge-bg-anvil)] text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-workshop)]"
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => onSetFilterMode("OR")}
                        className={`px-2 py-1 text-xs transition-colors
                            ${filterMode === "OR"
                                ? "bg-[var(--ember)] text-white"
                                : "bg-[var(--forge-bg-anvil)] text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-workshop)]"
                            }`}
                    >
                        Any
                    </button>
                </div>
            </div>

            {/* Filter Sections */}
            {facets && (
                <div className="max-h-[400px] overflow-y-auto">
                    {/* Level Filter */}
                    <FilterSection
                        title="Level"
                        icon={<Layers className="w-4 h-4" />}
                    >
                        <div className="flex flex-wrap gap-1.5">
                            {facets.levels.map(facet => (
                                <FilterChip
                                    key={facet.value}
                                    label={facet.label}
                                    count={facet.count}
                                    selected={facet.selected}
                                    onClick={() => onToggleFilter("levels", facet.value)}
                                />
                            ))}
                        </div>
                    </FilterSection>

                    {/* Status Filter */}
                    <FilterSection
                        title="Status"
                        icon={<Target className="w-4 h-4" />}
                    >
                        <div className="flex flex-wrap gap-1.5">
                            {facets.statuses.map(facet => (
                                <FilterChip
                                    key={facet.value}
                                    label={facet.label}
                                    count={facet.count}
                                    selected={facet.selected}
                                    onClick={() => onToggleFilter("statuses", facet.value)}
                                    colorClass={statusColors[facet.value]}
                                />
                            ))}
                        </div>
                    </FilterSection>

                    {/* Difficulty Filter */}
                    {facets.difficulties.some(d => d.count > 0) && (
                        <FilterSection
                            title="Difficulty"
                            icon={<Gauge className="w-4 h-4" />}
                        >
                            <div className="flex flex-wrap gap-1.5">
                                {facets.difficulties.map(facet => (
                                    <FilterChip
                                        key={facet.value}
                                        label={facet.label}
                                        count={facet.count}
                                        selected={facet.selected}
                                        onClick={() => onToggleFilter("difficulties", facet.value)}
                                        colorClass={difficultyColors[facet.value]}
                                    />
                                ))}
                            </div>
                        </FilterSection>
                    )}

                    {/* Skills Filter */}
                    {facets.skills.length > 0 && (
                        <FilterSection
                            title="Skills"
                            icon={<Tag className="w-4 h-4" />}
                            defaultExpanded={false}
                        >
                            <div className="flex flex-wrap gap-1.5">
                                {facets.skills.map(facet => (
                                    <FilterChip
                                        key={facet.value}
                                        label={facet.label}
                                        count={facet.count}
                                        selected={facet.selected}
                                        onClick={() => onToggleFilter("skills", facet.value)}
                                    />
                                ))}
                            </div>
                        </FilterSection>
                    )}

                    {/* Domain Filter */}
                    {facets.domains.length > 1 && (
                        <FilterSection
                            title="Domain"
                            icon={<Globe className="w-4 h-4" />}
                            defaultExpanded={false}
                        >
                            <div className="flex flex-wrap gap-1.5">
                                {facets.domains.map(facet => (
                                    <FilterChip
                                        key={facet.value}
                                        label={facet.label}
                                        count={facet.count}
                                        selected={facet.selected}
                                        onClick={() => {
                                            // Domain is single-select
                                            const newDomainId = filters.domainId === facet.value
                                                ? undefined
                                                : facet.value;
                                            // Use a custom handler for domain since it's single-select
                                        }}
                                    />
                                ))}
                            </div>
                        </FilterSection>
                    )}
                </div>
            )}

            {/* No facets available */}
            {!facets && (
                <div className="px-4 py-6 text-center text-[var(--forge-text-muted)]">
                    <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No filters available</p>
                </div>
            )}
        </div>
    );
}
