/**
 * Path History Manager
 *
 * Tracks navigation history in the knowledge map, enabling:
 * - Back/forward navigation like a browser
 * - Session persistence via sessionStorage
 * - History limit to prevent memory issues
 *
 * History entries capture the full navigation state (viewStack, selectedNode)
 * so we can restore exact positions when navigating history.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * A single entry in the navigation history
 */
export interface HistoryEntry {
    /** Unique ID for this entry */
    id: string;
    /** The viewStack at this point */
    viewStack: string[];
    /** Currently selected node ID (if any) */
    selectedNodeId: string | null;
    /** Timestamp of navigation */
    timestamp: number;
    /** Optional title for display */
    title?: string;
}

/**
 * Path history state
 */
export interface PathHistoryState {
    /** All history entries */
    entries: HistoryEntry[];
    /** Current position in history (index) */
    currentIndex: number;
}

/**
 * Path history manager configuration
 */
export interface PathHistoryConfig {
    /** Maximum number of entries to keep */
    maxEntries?: number;
    /** Key for sessionStorage */
    storageKey?: string;
    /** Whether to persist to sessionStorage */
    persist?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_ENTRIES = 50;
const DEFAULT_STORAGE_KEY = "knowledge-map-path-history";

// ============================================================================
// PATH HISTORY MANAGER CLASS
// ============================================================================

export class PathHistoryManager {
    private entries: HistoryEntry[] = [];
    private currentIndex: number = -1;
    private maxEntries: number;
    private storageKey: string;
    private persist: boolean;
    private listeners: Set<(state: PathHistoryState) => void> = new Set();

    constructor(config: PathHistoryConfig = {}) {
        this.maxEntries = config.maxEntries ?? DEFAULT_MAX_ENTRIES;
        this.storageKey = config.storageKey ?? DEFAULT_STORAGE_KEY;
        this.persist = config.persist ?? true;

        // Load from storage if persistence enabled
        if (this.persist) {
            this.loadFromStorage();
        }
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    /**
     * Push a new navigation entry
     * Clears any "future" entries if we're not at the end
     */
    public push(entry: Omit<HistoryEntry, "id" | "timestamp">): void {
        // Check if this is a duplicate of the current entry
        if (this.isDuplicate(entry)) {
            return;
        }

        // Remove any forward history if we're not at the end
        if (this.currentIndex < this.entries.length - 1) {
            this.entries = this.entries.slice(0, this.currentIndex + 1);
        }

        // Create new entry
        const newEntry: HistoryEntry = {
            ...entry,
            id: this.generateId(),
            timestamp: Date.now(),
        };

        // Add to history
        this.entries.push(newEntry);

        // Trim if over max
        if (this.entries.length > this.maxEntries) {
            this.entries = this.entries.slice(-this.maxEntries);
        }

        // Update current index
        this.currentIndex = this.entries.length - 1;

        // Persist and notify
        this.saveToStorage();
        this.notifyListeners();
    }

    /**
     * Replace the current entry (useful for updating selected node without new history)
     */
    public replace(entry: Omit<HistoryEntry, "id" | "timestamp">): void {
        if (this.currentIndex >= 0 && this.currentIndex < this.entries.length) {
            this.entries[this.currentIndex] = {
                ...entry,
                id: this.entries[this.currentIndex].id,
                timestamp: Date.now(),
            };
            this.saveToStorage();
            this.notifyListeners();
        } else {
            // No current entry, push instead
            this.push(entry);
        }
    }

    /**
     * Go back one entry
     * Returns the entry we navigated to, or null if can't go back
     */
    public goBack(): HistoryEntry | null {
        if (!this.canGoBack()) {
            return null;
        }

        this.currentIndex--;
        this.saveToStorage();
        this.notifyListeners();

        return this.getCurrentEntry();
    }

    /**
     * Go forward one entry
     * Returns the entry we navigated to, or null if can't go forward
     */
    public goForward(): HistoryEntry | null {
        if (!this.canGoForward()) {
            return null;
        }

        this.currentIndex++;
        this.saveToStorage();
        this.notifyListeners();

        return this.getCurrentEntry();
    }

    /**
     * Navigate to a specific history entry by index
     */
    public goTo(index: number): HistoryEntry | null {
        if (index < 0 || index >= this.entries.length) {
            return null;
        }

        this.currentIndex = index;
        this.saveToStorage();
        this.notifyListeners();

        return this.getCurrentEntry();
    }

    /**
     * Get the current history entry
     */
    public getCurrentEntry(): HistoryEntry | null {
        if (this.currentIndex < 0 || this.currentIndex >= this.entries.length) {
            return null;
        }
        return this.entries[this.currentIndex];
    }

    /**
     * Check if we can go back
     */
    public canGoBack(): boolean {
        return this.currentIndex > 0;
    }

    /**
     * Check if we can go forward
     */
    public canGoForward(): boolean {
        return this.currentIndex < this.entries.length - 1;
    }

    /**
     * Get all entries
     */
    public getEntries(): HistoryEntry[] {
        return [...this.entries];
    }

    /**
     * Get current index
     */
    public getCurrentIndex(): number {
        return this.currentIndex;
    }

    /**
     * Get full state
     */
    public getState(): PathHistoryState {
        return {
            entries: [...this.entries],
            currentIndex: this.currentIndex,
        };
    }

    /**
     * Clear all history
     */
    public clear(): void {
        this.entries = [];
        this.currentIndex = -1;
        this.saveToStorage();
        this.notifyListeners();
    }

    /**
     * Subscribe to state changes
     */
    public subscribe(listener: (state: PathHistoryState) => void): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    // ========================================================================
    // PRIVATE METHODS
    // ========================================================================

    /**
     * Generate a unique ID for an entry
     */
    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * Check if the new entry is a duplicate of the current one
     */
    private isDuplicate(entry: Omit<HistoryEntry, "id" | "timestamp">): boolean {
        const current = this.getCurrentEntry();
        if (!current) return false;

        // Compare viewStacks
        if (entry.viewStack.length !== current.viewStack.length) return false;
        for (let i = 0; i < entry.viewStack.length; i++) {
            if (entry.viewStack[i] !== current.viewStack[i]) return false;
        }

        return true;
    }

    /**
     * Notify all listeners of state change
     */
    private notifyListeners(): void {
        const state = this.getState();
        for (const listener of this.listeners) {
            listener(state);
        }
    }

    /**
     * Save state to sessionStorage
     */
    private saveToStorage(): void {
        if (!this.persist || typeof window === "undefined") return;

        try {
            const state: PathHistoryState = {
                entries: this.entries,
                currentIndex: this.currentIndex,
            };
            sessionStorage.setItem(this.storageKey, JSON.stringify(state));
        } catch (err) {
            console.warn("Failed to save path history to storage:", err);
        }
    }

    /**
     * Load state from sessionStorage
     */
    private loadFromStorage(): void {
        if (typeof window === "undefined") return;

        try {
            const stored = sessionStorage.getItem(this.storageKey);
            if (stored) {
                const state: PathHistoryState = JSON.parse(stored);
                if (Array.isArray(state.entries) && typeof state.currentIndex === "number") {
                    this.entries = state.entries;
                    this.currentIndex = state.currentIndex;
                }
            }
        } catch (err) {
            console.warn("Failed to load path history from storage:", err);
        }
    }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a path history manager instance
 */
export function createPathHistoryManager(
    config?: PathHistoryConfig
): PathHistoryManager {
    return new PathHistoryManager(config);
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let globalHistoryManager: PathHistoryManager | null = null;

/**
 * Get the global path history manager instance
 */
export function getPathHistoryManager(): PathHistoryManager {
    if (!globalHistoryManager) {
        globalHistoryManager = new PathHistoryManager();
    }
    return globalHistoryManager;
}

// ============================================================================
// REACT HOOK
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from "react";

/**
 * Hook to use path history in React components
 */
export function usePathHistory(config?: PathHistoryConfig) {
    const manager = useMemo(() => {
        if (config) {
            return createPathHistoryManager(config);
        }
        return getPathHistoryManager();
    }, [config]);

    const [state, setState] = useState<PathHistoryState>(manager.getState());

    useEffect(() => {
        return manager.subscribe(setState);
    }, [manager]);

    const push = useCallback(
        (entry: Omit<HistoryEntry, "id" | "timestamp">) => {
            manager.push(entry);
        },
        [manager]
    );

    const replace = useCallback(
        (entry: Omit<HistoryEntry, "id" | "timestamp">) => {
            manager.replace(entry);
        },
        [manager]
    );

    const goBack = useCallback(() => {
        return manager.goBack();
    }, [manager]);

    const goForward = useCallback(() => {
        return manager.goForward();
    }, [manager]);

    const goTo = useCallback(
        (index: number) => {
            return manager.goTo(index);
        },
        [manager]
    );

    const clear = useCallback(() => {
        manager.clear();
    }, [manager]);

    return {
        entries: state.entries,
        currentIndex: state.currentIndex,
        currentEntry: state.entries[state.currentIndex] || null,
        canGoBack: state.currentIndex > 0,
        canGoForward: state.currentIndex < state.entries.length - 1,
        push,
        replace,
        goBack,
        goForward,
        goTo,
        clear,
    };
}
