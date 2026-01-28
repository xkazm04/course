"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Command, Clock, Bookmark, ArrowRight } from "lucide-react";
import type { SearchHistoryEntry, SavedSearch } from "../lib/useMapSearch";

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    suggestions?: string[];
    history?: SearchHistoryEntry[];
    savedSearches?: SavedSearch[];
    onSelectSuggestion?: (suggestion: string) => void;
    onSelectHistory?: (entry: SearchHistoryEntry) => void;
    onSelectSaved?: (saved: SavedSearch) => void;
    onDeleteSaved?: (id: string) => void;
    onClearHistory?: () => void;
    isSearching?: boolean;
    placeholder?: string;
    autoFocus?: boolean;
}

export function SearchInput({
    value,
    onChange,
    onFocus,
    onBlur,
    suggestions = [],
    history = [],
    savedSearches = [],
    onSelectSuggestion,
    onSelectHistory,
    onSelectSaved,
    onDeleteSaved,
    onClearHistory,
    isSearching = false,
    placeholder = "Search nodes...",
    autoFocus = false,
}: SearchInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    // Combine all selectable items for keyboard navigation
    const selectableItems = [
        ...suggestions.map(s => ({ type: "suggestion" as const, value: s })),
        ...savedSearches.map(s => ({ type: "saved" as const, value: s })),
        ...history.map(h => ({ type: "history" as const, value: h })),
    ];

    const showDropdown = isFocused && (
        value.length > 0 ||
        suggestions.length > 0 ||
        history.length > 0 ||
        savedSearches.length > 0
    );

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < selectableItems.length - 1 ? prev + 1 : prev
                );
                break;

            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
                break;

            case "Enter":
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < selectableItems.length) {
                    const item = selectableItems[selectedIndex];
                    if (item.type === "suggestion") {
                        onSelectSuggestion?.(item.value);
                        onChange(item.value);
                    } else if (item.type === "saved") {
                        onSelectSaved?.(item.value);
                    } else if (item.type === "history") {
                        onSelectHistory?.(item.value);
                        onChange(item.value.query);
                    }
                    setSelectedIndex(-1);
                }
                break;

            case "Escape":
                e.preventDefault();
                setSelectedIndex(-1);
                inputRef.current?.blur();
                break;
        }
    };

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsFocused(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleFocus = () => {
        setIsFocused(true);
        onFocus?.();
    };

    const handleBlur = () => {
        // Delay blur to allow click on dropdown items
        setTimeout(() => {
            onBlur?.();
        }, 150);
    };

    const clearInput = () => {
        onChange("");
        inputRef.current?.focus();
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Search Input */}
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--forge-text-muted)]">
                    {isSearching ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                            <Search className="w-4 h-4" />
                        </motion.div>
                    ) : (
                        <Search className="w-4 h-4" />
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    className="w-full pl-10 pr-20 py-2.5 rounded-lg
                        bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)]
                        text-[var(--forge-text-primary)] placeholder:text-[var(--forge-text-muted)]
                        focus:outline-none focus:ring-2 focus:ring-[var(--ember)]/50 focus:border-[var(--ember)]
                        transition-all duration-200"
                />

                {/* Right side buttons */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {value && (
                        <button
                            onClick={clearInput}
                            className="p-1 rounded hover:bg-[var(--forge-bg-workshop)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}

                    {/* Keyboard shortcut hint */}
                    <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[var(--forge-bg-anvil)] text-[var(--forge-text-muted)] text-xs">
                        <Command className="w-3 h-3" />
                        <span>K</span>
                    </div>
                </div>
            </div>

            {/* Dropdown */}
            <AnimatePresence>
                {showDropdown && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 right-0 mt-2 z-50
                            bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)]
                            rounded-lg shadow-xl overflow-hidden"
                    >
                        <div className="max-h-80 overflow-y-auto">
                            {/* Suggestions */}
                            {suggestions.length > 0 && (
                                <div className="p-2">
                                    <div className="text-xs font-medium text-[var(--forge-text-muted)] px-2 py-1 uppercase tracking-wide">
                                        Suggestions
                                    </div>
                                    {suggestions.map((suggestion, index) => (
                                        <button
                                            key={suggestion}
                                            onClick={() => {
                                                onSelectSuggestion?.(suggestion);
                                                onChange(suggestion);
                                            }}
                                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left
                                                ${selectedIndex === index
                                                    ? "bg-[var(--ember)]/10 text-[var(--ember)]"
                                                    : "text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-workshop)]"
                                                }
                                                transition-colors`}
                                        >
                                            <ArrowRight className="w-3 h-3 text-[var(--forge-text-muted)]" />
                                            <span>{suggestion}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Saved Searches */}
                            {savedSearches.length > 0 && (
                                <div className="p-2 border-t border-[var(--forge-border-subtle)]">
                                    <div className="text-xs font-medium text-[var(--forge-text-muted)] px-2 py-1 uppercase tracking-wide">
                                        Saved Searches
                                    </div>
                                    {savedSearches.map((saved, index) => {
                                        const itemIndex = suggestions.length + index;
                                        return (
                                            <div
                                                key={saved.id}
                                                className={`flex items-center gap-2 px-2 py-1.5 rounded group
                                                    ${selectedIndex === itemIndex
                                                        ? "bg-[var(--ember)]/10"
                                                        : "hover:bg-[var(--forge-bg-workshop)]"
                                                    }
                                                    transition-colors`}
                                            >
                                                <button
                                                    onClick={() => onSelectSaved?.(saved)}
                                                    className="flex-1 flex items-center gap-2 text-left"
                                                >
                                                    <Bookmark className="w-3 h-3 text-[var(--forge-text-muted)]" />
                                                    <span className="text-[var(--forge-text-primary)]">{saved.name}</span>
                                                    <span className="text-xs text-[var(--forge-text-muted)]">
                                                        &quot;{saved.query}&quot;
                                                    </span>
                                                </button>
                                                {onDeleteSaved && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteSaved(saved.id);
                                                        }}
                                                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--forge-bg-anvil)] text-[var(--forge-text-muted)] hover:text-red-500 transition-all"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Recent Searches */}
                            {history.length > 0 && (
                                <div className="p-2 border-t border-[var(--forge-border-subtle)]">
                                    <div className="flex items-center justify-between px-2 py-1">
                                        <span className="text-xs font-medium text-[var(--forge-text-muted)] uppercase tracking-wide">
                                            Recent
                                        </span>
                                        {onClearHistory && (
                                            <button
                                                onClick={onClearHistory}
                                                className="text-xs text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] transition-colors"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                    {history.map((entry, index) => {
                                        const itemIndex = suggestions.length + savedSearches.length + index;
                                        return (
                                            <button
                                                key={`${entry.query}-${entry.timestamp}`}
                                                onClick={() => {
                                                    onSelectHistory?.(entry);
                                                    onChange(entry.query);
                                                }}
                                                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left
                                                    ${selectedIndex === itemIndex
                                                        ? "bg-[var(--ember)]/10 text-[var(--ember)]"
                                                        : "text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-workshop)]"
                                                    }
                                                    transition-colors`}
                                            >
                                                <Clock className="w-3 h-3 text-[var(--forge-text-muted)]" />
                                                <span className="flex-1 truncate">{entry.query}</span>
                                                <span className="text-xs text-[var(--forge-text-muted)]">
                                                    {entry.resultCount} results
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Empty state */}
                            {suggestions.length === 0 &&
                                savedSearches.length === 0 &&
                                history.length === 0 &&
                                value.length > 0 && (
                                    <div className="px-4 py-6 text-center text-[var(--forge-text-muted)]">
                                        <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No suggestions found</p>
                                        <p className="text-xs mt-1">Try a different search term</p>
                                    </div>
                                )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
