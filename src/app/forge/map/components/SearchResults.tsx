"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MapPin,
    Clock,
    BookOpen,
    ChevronRight,
    Layers,
    X,
    Bookmark,
    CheckCircle,
    Play,
    Lock,
    Target,
} from "lucide-react";
import type { SearchResult } from "../lib/searchEngine";
import type { MapNode, NodeStatus, NodeLevel, CourseNode } from "@/app/features/knowledge-map/lib/types";

interface SearchResultsProps {
    results: SearchResult[];
    isSearching: boolean;
    query: string;
    highlightedNodeIds: Set<string>;
    onNavigateToResult: (nodeId: string) => void;
    onClose: () => void;
    onSaveSearch?: () => void;
    totalNodes?: number;
}

// Status icon mapping
const statusIcons: Record<NodeStatus, React.ReactNode> = {
    completed: <CheckCircle className="w-3 h-3 text-[var(--forge-success)]" />,
    in_progress: <Play className="w-3 h-3 text-[var(--ember)]" />,
    available: <Target className="w-3 h-3 text-[var(--forge-text-muted)]" />,
    locked: <Lock className="w-3 h-3 text-[var(--forge-text-muted)]" />,
};

// Level icon mapping
const levelIcons: Record<NodeLevel, React.ReactNode> = {
    domain: <Layers className="w-3 h-3" />,
    course: <BookOpen className="w-3 h-3" />,
    chapter: <BookOpen className="w-3 h-3" />,
    section: <BookOpen className="w-3 h-3" />,
    concept: <Target className="w-3 h-3" />,
};

interface ResultItemProps {
    result: SearchResult;
    onClick: () => void;
    isHighlighted: boolean;
}

function ResultItem({ result, onClick, isHighlighted }: ResultItemProps) {
    const { node, score, highlightedName } = result;

    // Render highlighted name with mark tags
    const renderHighlightedName = () => {
        if (!highlightedName.includes("<mark>")) {
            return <span>{node.name}</span>;
        }

        // Parse and render the highlighted text
        const parts = highlightedName.split(/(<mark>.*?<\/mark>)/g);
        return (
            <>
                {parts.map((part, index) => {
                    if (part.startsWith("<mark>")) {
                        const text = part.replace(/<\/?mark>/g, "");
                        return (
                            <span
                                key={index}
                                className="bg-[var(--ember)]/30 text-[var(--ember)] px-0.5 rounded"
                            >
                                {text}
                            </span>
                        );
                    }
                    return <span key={index}>{part}</span>;
                })}
            </>
        );
    };

    // Get skills for course nodes
    const skills = node.level === "course" ? (node as CourseNode).skills?.slice(0, 3) : null;

    return (
        <motion.button
            onClick={onClick}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            whileHover={{ x: 4 }}
            className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors
                ${isHighlighted
                    ? "bg-[var(--ember)]/10 border border-[var(--ember)]/30"
                    : "bg-[var(--forge-bg-workshop)] hover:bg-[var(--forge-bg-anvil)] border border-transparent"
                }`}
        >
            {/* Status/Level indicator */}
            <div className="flex flex-col items-center gap-1 pt-0.5">
                {statusIcons[node.status]}
                {levelIcons[node.level]}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Name */}
                <div className="font-medium text-[var(--forge-text-primary)] truncate">
                    {renderHighlightedName()}
                </div>

                {/* Description */}
                <p className="text-xs text-[var(--forge-text-muted)] line-clamp-2 mt-0.5">
                    {node.description}
                </p>

                {/* Meta info */}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--forge-text-muted)]">
                    {/* Level badge */}
                    <span className="px-1.5 py-0.5 rounded bg-[var(--forge-bg-elevated)] capitalize">
                        {node.level}
                    </span>

                    {/* Progress */}
                    {node.progress > 0 && (
                        <span className="flex items-center gap-1">
                            <div className="w-12 h-1 rounded-full bg-[var(--forge-bg-elevated)]">
                                <div
                                    className="h-full rounded-full bg-[var(--ember)]"
                                    style={{ width: `${node.progress}%` }}
                                />
                            </div>
                            <span>{node.progress}%</span>
                        </span>
                    )}

                    {/* Estimated hours */}
                    {node.estimatedHours && (
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {node.estimatedHours}h
                        </span>
                    )}
                </div>

                {/* Skills (for courses) */}
                {skills && skills.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5">
                        {skills.map(skill => (
                            <span
                                key={skill}
                                className="px-1.5 py-0.5 rounded text-xs bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)]"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                )}

                {/* Match score indicator */}
                {score > 0 && score < 0.3 && (
                    <div className="text-xs text-[var(--forge-success)] mt-1">
                        Strong match
                    </div>
                )}
            </div>

            {/* Navigate arrow */}
            <div className="flex-shrink-0 pt-0.5">
                <ChevronRight className="w-4 h-4 text-[var(--forge-text-muted)]" />
            </div>
        </motion.button>
    );
}

export function SearchResults({
    results,
    isSearching,
    query,
    highlightedNodeIds,
    onNavigateToResult,
    onClose,
    onSaveSearch,
    totalNodes = 0,
}: SearchResultsProps) {
    // Group results by level
    const groupedResults = useMemo(() => {
        const groups: Record<NodeLevel, SearchResult[]> = {
            domain: [],
            course: [],
            chapter: [],
            section: [],
            concept: [],
        };

        for (const result of results) {
            groups[result.node.level].push(result);
        }

        return groups;
    }, [results]);

    // Check if there are any results
    const hasResults = results.length > 0;

    return (
        <div className="bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] rounded-lg overflow-hidden shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--forge-border-subtle)]">
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[var(--ember)]" />
                    <span className="font-medium text-[var(--forge-text-primary)]">
                        Search Results
                    </span>
                    {query && (
                        <span className="text-sm text-[var(--forge-text-muted)]">
                            for &quot;{query}&quot;
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--forge-text-muted)]">
                        {results.length} of {totalNodes}
                    </span>
                    {onSaveSearch && hasResults && (
                        <button
                            onClick={onSaveSearch}
                            className="p-1.5 rounded hover:bg-[var(--forge-bg-workshop)] text-[var(--forge-text-muted)] hover:text-[var(--ember)] transition-colors"
                            title="Save search"
                        >
                            <Bookmark className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded hover:bg-[var(--forge-bg-workshop)] text-[var(--forge-text-muted)] transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Results List */}
            <div className="max-h-[400px] overflow-y-auto">
                {isSearching ? (
                    <div className="px-4 py-8 text-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="inline-block"
                        >
                            <MapPin className="w-8 h-8 text-[var(--ember)]" />
                        </motion.div>
                        <p className="text-sm text-[var(--forge-text-muted)] mt-2">
                            Searching...
                        </p>
                    </div>
                ) : !hasResults ? (
                    <div className="px-4 py-8 text-center">
                        <MapPin className="w-8 h-8 text-[var(--forge-text-muted)] mx-auto mb-2 opacity-50" />
                        <p className="text-sm text-[var(--forge-text-muted)]">
                            {query ? "No results found" : "Start typing to search"}
                        </p>
                        {query && (
                            <p className="text-xs text-[var(--forge-text-muted)] mt-1">
                                Try adjusting your search or filters
                            </p>
                        )}
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        <div className="p-2 space-y-1">
                            {/* Display results grouped by level */}
                            {(Object.keys(groupedResults) as NodeLevel[]).map(level => {
                                const levelResults = groupedResults[level];
                                if (levelResults.length === 0) return null;

                                return (
                                    <div key={level} className="space-y-1">
                                        {/* Level header */}
                                        <div className="flex items-center gap-2 px-2 pt-2 pb-1">
                                            {levelIcons[level]}
                                            <span className="text-xs font-medium text-[var(--forge-text-muted)] uppercase tracking-wide">
                                                {level}s ({levelResults.length})
                                            </span>
                                        </div>

                                        {/* Results for this level */}
                                        {levelResults.map(result => (
                                            <ResultItem
                                                key={result.node.id}
                                                result={result}
                                                onClick={() => onNavigateToResult(result.node.id)}
                                                isHighlighted={highlightedNodeIds.has(result.node.id)}
                                            />
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </AnimatePresence>
                )}
            </div>

            {/* Footer with navigation hint */}
            {hasResults && (
                <div className="px-4 py-2 border-t border-[var(--forge-border-subtle)] bg-[var(--forge-bg-workshop)]">
                    <div className="flex items-center justify-between text-xs text-[var(--forge-text-muted)]">
                        <span>Click a result to navigate on the map</span>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 rounded bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)]">
                                    ↑↓
                                </kbd>
                                Navigate
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 rounded bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)]">
                                    Enter
                                </kbd>
                                Select
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
