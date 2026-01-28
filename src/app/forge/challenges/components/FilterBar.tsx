"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Filter, ChevronDown } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { ChallengeType, ChallengeDifficulty } from "../../lib/types";
import { mockProjects } from "../../lib/mockData";
import { typeOptions } from "./constants";
import { forgeEasing, staggerDelay } from "../../lib/animations";

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
        <div className="p-4">
            {/* Main row */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <motion.div
                    className="relative flex-1 min-w-[200px]"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--forge-text-muted)]" />
                    <input
                        type="text"
                        placeholder="Search challenges..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] text-sm text-[var(--forge-text-primary)] placeholder-[var(--forge-text-muted)] focus:outline-none focus:border-[var(--ember)]/50 focus:ring-2 focus:ring-[var(--ember)]/10 transition-all"
                    />
                    <AnimatePresence>
                        {searchQuery && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={() => onSearchChange("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] transition-colors"
                            >
                                <X size={14} />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Type filter chips */}
                <motion.div
                    className="flex items-center gap-1 overflow-x-auto scrollbar-hide"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    {typeOptions.map((opt, i) => (
                        <motion.button
                            key={opt.value}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: staggerDelay(i, 0.05) }}
                            onClick={() => onTypeChange(opt.value)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all",
                                type === opt.value
                                    ? "bg-gradient-to-r from-[var(--ember)]/20 to-[var(--gold)]/20 text-[var(--ember)] border border-[var(--ember)]/30 shadow-sm"
                                    : "text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-elevated)] hover:text-[var(--forge-text-primary)]"
                            )}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span className="text-sm">{opt.emoji}</span>
                            <span>{opt.label}</span>
                        </motion.button>
                    ))}
                </motion.div>

                {/* Project filter */}
                <motion.div
                    className="relative"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <select
                        value={project}
                        onChange={(e) => onProjectChange(e.target.value)}
                        className={cn(
                            "appearance-none px-4 py-2.5 pr-10 rounded-xl text-sm font-medium transition-all cursor-pointer",
                            "focus:outline-none focus:ring-2 focus:ring-[var(--ember)]/20",
                            project !== "all"
                                ? "bg-[var(--forge-info)]/10 text-[var(--forge-info)] border border-[var(--forge-info)]/30"
                                : "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)] border border-[var(--forge-border-subtle)] hover:border-[var(--ember)]/30"
                        )}
                    >
                        <option value="all">All Projects</option>
                        {mockProjects.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--forge-text-muted)] pointer-events-none" />
                </motion.div>

                {/* Clear filters */}
                <AnimatePresence>
                    {hasActiveFilters && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9, x: 10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9, x: 10 }}
                            onClick={onClearAll}
                            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-[var(--forge-error)] bg-[var(--forge-error)]/10 hover:bg-[var(--forge-error)]/20 rounded-xl transition-colors border border-[var(--forge-error)]/20"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <X size={14} />
                            Clear all
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Active filters summary */}
            <AnimatePresence>
                {hasActiveFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--forge-border-subtle)]"
                    >
                        <Filter size={12} className="text-[var(--forge-text-muted)]" />
                        <span className="text-xs text-[var(--forge-text-muted)]">Active filters:</span>
                        <div className="flex items-center gap-2">
                            {searchQuery && (
                                <FilterTag
                                    label={`"${searchQuery}"`}
                                    onRemove={() => onSearchChange("")}
                                />
                            )}
                            {type !== "all" && (
                                <FilterTag
                                    label={typeOptions.find(t => t.value === type)?.label || type}
                                    onRemove={() => onTypeChange("all")}
                                    color="ember"
                                />
                            )}
                            {difficulty !== "all" && (
                                <FilterTag
                                    label={difficulty}
                                    onRemove={() => onDifficultyChange("all")}
                                    color={difficulty === "beginner" ? "success" : difficulty === "intermediate" ? "gold" : "error"}
                                />
                            )}
                            {project !== "all" && (
                                <FilterTag
                                    label={mockProjects.find(p => p.id === project)?.name || "Project"}
                                    onRemove={() => onProjectChange("all")}
                                    color="info"
                                />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Filter tag component
function FilterTag({
    label,
    onRemove,
    color = "default",
}: {
    label: string;
    onRemove: () => void;
    color?: "default" | "ember" | "success" | "gold" | "error" | "info";
}) {
    const colorClasses = {
        default: "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)]",
        ember: "bg-[var(--ember)]/10 text-[var(--ember)]",
        success: "bg-[var(--forge-success)]/10 text-[var(--forge-success)]",
        gold: "bg-[var(--gold)]/10 text-[var(--gold)]",
        error: "bg-[var(--forge-error)]/10 text-[var(--forge-error)]",
        info: "bg-[var(--forge-info)]/10 text-[var(--forge-info)]",
    };

    return (
        <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
                colorClasses[color]
            )}
        >
            {label}
            <button
                onClick={onRemove}
                className="p-0.5 rounded hover:bg-black/10 transition-colors"
            >
                <X size={10} />
            </button>
        </motion.span>
    );
}
