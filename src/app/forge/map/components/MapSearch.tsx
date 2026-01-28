"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Filter, Save, Bookmark } from "lucide-react";
import { SearchInput } from "./SearchInput";
import { FilterPanel } from "./FilterPanel";
import { SearchResults } from "./SearchResults";
import type { MapSearchHook } from "../lib/useMapSearch";
import type { MapNode } from "@/app/features/knowledge-map/lib/types";

interface MapSearchProps {
    search: MapSearchHook;
    onNavigateToNode: (node: MapNode | undefined) => void;
    totalNodes: number;
}

export function MapSearch({ search, onNavigateToNode, totalNodes }: MapSearchProps) {
    const [showFilters, setShowFilters] = useState(false);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [saveSearchName, setSaveSearchName] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        query,
        isActive,
        results,
        isSearching,
        filters,
        filterMode,
        facets,
        suggestions,
        highlightedNodeIds,
        history,
        savedSearches,
        updateQuery,
        toggleFilter,
        setFilterMode,
        clearFilters,
        clearSearch,
        clearHistory,
        saveCurrentSearch,
        deleteSavedSearch,
        loadSavedSearch,
        activate,
        deactivate,
        navigateToResult,
    } = search;

    // Keyboard shortcut: Cmd/Ctrl+K to open search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd/Ctrl+K to focus search
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                activate();
                inputRef.current?.focus();
            }

            // Escape to close search
            if (e.key === "Escape" && isActive) {
                e.preventDefault();
                deactivate();
                clearSearch();
            }

            // Cmd/Ctrl+Shift+K to toggle filters
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "k") {
                e.preventDefault();
                setShowFilters(prev => !prev);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isActive, activate, deactivate, clearSearch]);

    // Handle navigation to a search result
    const handleNavigateToResult = useCallback((nodeId: string) => {
        const node = navigateToResult(nodeId);
        onNavigateToNode(node);
    }, [navigateToResult, onNavigateToNode]);

    // Handle closing the search
    const handleClose = useCallback(() => {
        deactivate();
        clearSearch();
        setShowFilters(false);
    }, [deactivate, clearSearch]);

    // Handle saving search
    const handleSaveSearch = useCallback(() => {
        if (!saveSearchName.trim()) return;
        saveCurrentSearch(saveSearchName.trim());
        setSaveSearchName("");
        setShowSaveDialog(false);
    }, [saveSearchName, saveCurrentSearch]);

    // Show search results panel when there's a query or results
    const showResults = isActive && (query.trim() || results.length > 0);

    return (
        <>
            {/* Search overlay backdrop */}
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                        onClick={handleClose}
                    />
                )}
            </AnimatePresence>

            {/* Search container */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
                <AnimatePresence mode="wait">
                    {isActive ? (
                        <motion.div
                            key="active-search"
                            initial={{ opacity: 0, y: -8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-3"
                        >
                            {/* Main search bar */}
                            <div className="relative">
                                <SearchInput
                                    value={query}
                                    onChange={updateQuery}
                                    suggestions={suggestions}
                                    history={history}
                                    savedSearches={savedSearches}
                                    onSelectSuggestion={(s) => updateQuery(s)}
                                    onSelectHistory={(h) => updateQuery(h.query)}
                                    onSelectSaved={loadSavedSearch}
                                    onDeleteSaved={deleteSavedSearch}
                                    onClearHistory={clearHistory}
                                    isSearching={isSearching}
                                    placeholder="Search nodes, skills, topics..."
                                    autoFocus
                                />

                                {/* Action buttons */}
                                <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    {/* Filter toggle */}
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`p-1.5 rounded transition-colors ${
                                            showFilters || Object.keys(filters).length > 0
                                                ? "bg-[var(--ember)]/20 text-[var(--ember)]"
                                                : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-workshop)]"
                                        }`}
                                        title="Toggle filters (Cmd+Shift+K)"
                                    >
                                        <Filter className="w-4 h-4" />
                                    </button>

                                    {/* Save search */}
                                    {(query.trim() || Object.keys(filters).length > 0) && (
                                        <button
                                            onClick={() => setShowSaveDialog(true)}
                                            className="p-1.5 rounded text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-workshop)] transition-colors"
                                            title="Save search"
                                        >
                                            <Bookmark className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Filter panel */}
                            <AnimatePresence>
                                {showFilters && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <FilterPanel
                                            facets={facets}
                                            filters={filters}
                                            filterMode={filterMode}
                                            onToggleFilter={toggleFilter}
                                            onSetFilterMode={setFilterMode}
                                            onClearFilters={clearFilters}
                                            onToggleCollapse={() => setShowFilters(false)}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Results panel */}
                            <AnimatePresence>
                                {showResults && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <SearchResults
                                            results={results}
                                            isSearching={isSearching}
                                            query={query}
                                            highlightedNodeIds={highlightedNodeIds}
                                            onNavigateToResult={handleNavigateToResult}
                                            onClose={handleClose}
                                            onSaveSearch={() => setShowSaveDialog(true)}
                                            totalNodes={totalNodes}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <motion.button
                            key="collapsed-search"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={activate}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg
                                bg-[var(--forge-bg-elevated)]/90 backdrop-blur-sm
                                border border-[var(--forge-border-subtle)]
                                text-[var(--forge-text-muted)]
                                hover:border-[var(--ember)]/50 hover:text-[var(--forge-text-primary)]
                                transition-all cursor-text shadow-lg"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            <span className="flex-1 text-left">Search nodes...</span>
                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[var(--forge-bg-anvil)] text-xs">
                                <span>⌘</span>
                                <span>K</span>
                            </div>
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Save search dialog */}
            <AnimatePresence>
                {showSaveDialog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                        onClick={() => setShowSaveDialog(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] rounded-lg shadow-xl w-full max-w-md"
                        >
                            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--forge-border-subtle)]">
                                <div className="flex items-center gap-2">
                                    <Save className="w-4 h-4 text-[var(--ember)]" />
                                    <span className="font-medium text-[var(--forge-text-primary)]">
                                        Save Search
                                    </span>
                                </div>
                                <button
                                    onClick={() => setShowSaveDialog(false)}
                                    className="p-1 rounded hover:bg-[var(--forge-bg-workshop)] text-[var(--forge-text-muted)] transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-4">
                                <label className="block text-sm text-[var(--forge-text-secondary)] mb-2">
                                    Search name
                                </label>
                                <input
                                    type="text"
                                    value={saveSearchName}
                                    onChange={(e) => setSaveSearchName(e.target.value)}
                                    placeholder="e.g., React Basics"
                                    className="w-full px-3 py-2 rounded-lg
                                        bg-[var(--forge-bg-anvil)] border border-[var(--forge-border-subtle)]
                                        text-[var(--forge-text-primary)] placeholder:text-[var(--forge-text-muted)]
                                        focus:outline-none focus:ring-2 focus:ring-[var(--ember)]/50 focus:border-[var(--ember)]
                                        transition-all"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSaveSearch();
                                        if (e.key === "Escape") setShowSaveDialog(false);
                                    }}
                                />

                                {query && (
                                    <p className="mt-2 text-xs text-[var(--forge-text-muted)]">
                                        Query: &quot;{query}&quot;
                                    </p>
                                )}

                                {Object.keys(filters).length > 0 && (
                                    <p className="text-xs text-[var(--forge-text-muted)]">
                                        + {Object.keys(filters).length} filter(s)
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 px-4 py-3 border-t border-[var(--forge-border-subtle)]">
                                <button
                                    onClick={() => setShowSaveDialog(false)}
                                    className="px-3 py-1.5 rounded-lg text-sm
                                        text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-workshop)]
                                        transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveSearch}
                                    disabled={!saveSearchName.trim()}
                                    className="px-3 py-1.5 rounded-lg text-sm
                                        bg-[var(--ember)] text-white
                                        hover:bg-[var(--ember)]/90
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
