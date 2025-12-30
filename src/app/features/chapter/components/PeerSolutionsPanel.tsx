/**
 * Peer Solutions Panel Component
 *
 * Displays peer solutions surfaced by the AI Learning Conductor
 * when a learner is struggling with content.
 */

"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    X,
    ChevronRight,
    Sparkles,
    Search,
    Filter,
    ArrowUpDown,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { PeerSolutionCard } from "./PeerSolutionCard";
import { useLearningConductor } from "../lib/LearningConductorContext";
import { peerSolutionStorage } from "../lib/conductorStorage";
import type { PeerSolution } from "../lib/conductorTypes";

// ============================================================================
// Types
// ============================================================================

export interface PeerSolutionsPanelProps {
    sectionId: string;
    questionId?: string;
    codeChallenge?: string;
    isOpen?: boolean;
    onToggle?: () => void;
    onSolutionView?: (solutionId: string) => void;
    className?: string;
}

type SortOption = "helpfulness" | "recent" | "upvotes";
type FilterOption = "all" | "code" | "explanation" | "approach" | "debugging";

// ============================================================================
// Main Component
// ============================================================================

export function PeerSolutionsPanel({
    sectionId,
    questionId,
    codeChallenge,
    isOpen: controlledIsOpen,
    onToggle,
    onSolutionView,
    className,
}: PeerSolutionsPanelProps) {
    const conductor = useLearningConductor();
    const [isOpen, setIsOpen] = useState(controlledIsOpen ?? false);
    const [sortBy, setSortBy] = useState<SortOption>("helpfulness");
    const [filterBy, setFilterBy] = useState<FilterOption>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [solutions, setSolutions] = useState<PeerSolution[]>([]);

    // Use controlled state if provided
    const panelIsOpen = controlledIsOpen ?? isOpen;
    const handleToggle = onToggle ?? (() => setIsOpen((prev) => !prev));

    // Load solutions
    useEffect(() => {
        let filtered = conductor.getPeerSolutions(sectionId);

        // Filter by question if provided
        if (questionId) {
            filtered = filtered.filter((s) => s.questionId === questionId);
        }

        // Filter by code challenge if provided
        if (codeChallenge) {
            filtered = filtered.filter((s) => s.codeChallenge === codeChallenge);
        }

        setSolutions(filtered);
    }, [sectionId, questionId, codeChallenge, conductor]);

    // Filter and sort solutions
    const displayedSolutions = React.useMemo(() => {
        let result = [...solutions];

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (s) =>
                    s.content.toLowerCase().includes(query) ||
                    s.tags.some((t) => t.toLowerCase().includes(query))
            );
        }

        // Apply type filter
        if (filterBy !== "all") {
            result = result.filter((s) => s.solutionType === filterBy);
        }

        // Apply sorting
        switch (sortBy) {
            case "helpfulness":
                result.sort((a, b) => b.helpfulnessScore - a.helpfulnessScore);
                break;
            case "recent":
                result.sort((a, b) => b.createdAt - a.createdAt);
                break;
            case "upvotes":
                result.sort((a, b) => b.upvotes - a.upvotes);
                break;
        }

        return result;
    }, [solutions, searchQuery, filterBy, sortBy]);

    // Handle upvote
    const handleUpvote = useCallback((solutionId: string) => {
        peerSolutionStorage.upvoteSolution(solutionId);
        setSolutions((prev) =>
            prev.map((s) =>
                s.id === solutionId
                    ? { ...s, upvotes: s.upvotes + 1, helpfulnessScore: s.helpfulnessScore + 0.1 }
                    : s
            )
        );
    }, []);

    // Handle solution view tracking
    const handleSolutionView = useCallback(
        (solutionId: string) => {
            onSolutionView?.(solutionId);
        },
        [onSolutionView]
    );

    // Don't render if no solutions
    if (solutions.length === 0) {
        return null;
    }

    return (
        <div className={cn("relative", className)}>
            {/* Toggle Button */}
            <button
                onClick={handleToggle}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                    "bg-gradient-to-r from-[var(--ember-glow)]/20 to-[var(--forge-info)]/20",
                    "border border-[var(--ember-glow)]/30 hover:border-[var(--ember-glow)]/50",
                    "text-[var(--ember-glow)] hover:text-[var(--ember-bright)]"
                )}
                data-testid="peer-solutions-toggle-btn"
            >
                <Users size={18} />
                <span className="text-sm font-medium">Peer Solutions</span>
                <span className="px-2 py-0.5 text-xs bg-[var(--ember-glow)]/30 rounded-full">
                    {solutions.length}
                </span>
                <motion.div
                    animate={{ rotate: panelIsOpen ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronRight size={16} />
                </motion.div>
            </button>

            {/* Panel */}
            <AnimatePresence>
                {panelIsOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-3"
                        data-testid="peer-solutions-panel"
                    >
                        <div className="bg-[var(--forge-bg-anvil)]/80 backdrop-blur-sm border border-[var(--forge-border-subtle)] rounded-xl overflow-hidden">
                            {/* Header */}
                            <div className="px-4 py-3 border-b border-[var(--forge-border-subtle)]">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Sparkles size={16} className="text-[var(--ember)]" />
                                        <h3 className="text-sm font-semibold text-[var(--forge-text-secondary)]">
                                            Solutions from fellow learners
                                        </h3>
                                    </div>
                                    <button
                                        onClick={handleToggle}
                                        className="p-1 text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] transition-colors"
                                        data-testid="peer-solutions-close-btn"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Search and Filters */}
                                <div className="flex flex-wrap gap-2">
                                    {/* Search */}
                                    <div className="flex-1 min-w-[200px] relative">
                                        <Search
                                            size={14}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--forge-text-muted)]"
                                        />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search solutions..."
                                            className="w-full pl-9 pr-3 py-1.5 text-sm bg-[var(--forge-bg-void)]/50 border border-[var(--forge-border-subtle)] rounded-lg text-[var(--forge-text-secondary)] placeholder:text-[var(--forge-text-muted)] focus:outline-none focus:border-[var(--ember)]/50"
                                            data-testid="peer-solutions-search-input"
                                        />
                                    </div>

                                    {/* Filter dropdown */}
                                    <div className="relative">
                                        <button
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--forge-bg-void)]/50 border border-[var(--forge-border-subtle)] rounded-lg text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] hover:border-[var(--forge-border-default)] transition-colors"
                                            data-testid="peer-solutions-filter-btn"
                                        >
                                            <Filter size={14} />
                                            <span className="capitalize">{filterBy}</span>
                                        </button>
                                        {/* Filter options would go in a dropdown */}
                                    </div>

                                    {/* Sort dropdown */}
                                    <div className="relative">
                                        <button
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--forge-bg-void)]/50 border border-[var(--forge-border-subtle)] rounded-lg text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] hover:border-[var(--forge-border-default)] transition-colors"
                                            data-testid="peer-solutions-sort-btn"
                                        >
                                            <ArrowUpDown size={14} />
                                            <span className="capitalize">{sortBy}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Filter chips */}
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {(
                                        ["all", "code", "explanation", "approach", "debugging"] as FilterOption[]
                                    ).map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => setFilterBy(filter)}
                                            className={cn(
                                                "px-2.5 py-1 text-xs rounded-full transition-colors",
                                                filterBy === filter
                                                    ? "bg-[var(--ember)]/50 text-[var(--ember)]"
                                                    : "bg-[var(--forge-bg-elevated)]/50 text-[var(--forge-text-muted)] hover:bg-[var(--forge-bg-elevated)] hover:text-[var(--forge-text-secondary)]"
                                            )}
                                            data-testid={`peer-solutions-filter-chip-${filter}`}
                                        >
                                            {filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Solutions List */}
                            <div
                                className="max-h-[400px] overflow-y-auto p-3 space-y-3"
                                data-testid="peer-solutions-list"
                            >
                                {displayedSolutions.length > 0 ? (
                                    displayedSolutions.map((solution) => (
                                        <PeerSolutionCard
                                            key={solution.id}
                                            solution={solution}
                                            onUpvote={handleUpvote}
                                            onView={handleSolutionView}
                                            compact
                                        />
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-[var(--forge-text-muted)]">
                                        <Users size={32} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No solutions match your criteria</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-4 py-3 border-t border-[var(--forge-border-subtle)] bg-[var(--forge-bg-void)]/30">
                                <p className="text-xs text-[var(--forge-text-muted)] text-center">
                                    Solutions are anonymized and ranked by helpfulness.
                                    <button
                                        className="text-[var(--ember)] hover:text-[var(--ember-glow)] ml-1"
                                        data-testid="peer-solutions-contribute-btn"
                                    >
                                        Contribute your solution
                                    </button>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default PeerSolutionsPanel;
