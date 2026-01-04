"use client";

import { useState, useCallback } from "react";
import type { ConsoleMessage } from "./types";

const STORAGE_PREFIX = "code-playground-filters-";

export type ConsoleLogType = ConsoleMessage["type"];

export interface ConsoleFilterState {
    log: boolean;
    info: boolean;
    warn: boolean;
    error: boolean;
}

const DEFAULT_FILTERS: ConsoleFilterState = {
    log: true,
    info: true,
    warn: true,
    error: true,
};

function loadFiltersFromStorage(playgroundId: string): ConsoleFilterState {
    if (typeof window === "undefined") return DEFAULT_FILTERS;

    const storageKey = `${STORAGE_PREFIX}${playgroundId}`;
    const savedData = localStorage.getItem(storageKey);

    if (savedData) {
        try {
            const parsed = JSON.parse(savedData) as ConsoleFilterState;
            if (typeof parsed === "object" && parsed !== null) {
                return {
                    log: parsed.log ?? true,
                    info: parsed.info ?? true,
                    warn: parsed.warn ?? true,
                    error: parsed.error ?? true,
                };
            }
        } catch {
            // Invalid data, use defaults
        }
    }
    return DEFAULT_FILTERS;
}

export function useConsoleFilters(playgroundId: string) {
    // Initialize from localStorage lazily
    const [filters, setFilters] = useState<ConsoleFilterState>(() =>
        loadFiltersFromStorage(playgroundId)
    );

    // Save to localStorage when filters change
    const saveFilters = useCallback((newFilters: ConsoleFilterState) => {
        if (typeof window === "undefined") return;

        const storageKey = `${STORAGE_PREFIX}${playgroundId}`;
        localStorage.setItem(storageKey, JSON.stringify(newFilters));
    }, [playgroundId]);

    // Toggle a specific filter
    const toggleFilter = useCallback((type: ConsoleLogType) => {
        setFilters(prev => {
            const newFilters = { ...prev, [type]: !prev[type] };
            saveFilters(newFilters);
            return newFilters;
        });
    }, [saveFilters]);

    // Filter messages based on current filter state
    const filterMessages = useCallback((messages: ConsoleMessage[]) => {
        return messages.filter(msg => filters[msg.type]);
    }, [filters]);

    // Count messages by type
    const getMessageCounts = useCallback((messages: ConsoleMessage[]) => {
        return messages.reduce(
            (counts, msg) => {
                counts[msg.type]++;
                return counts;
            },
            { log: 0, info: 0, warn: 0, error: 0 }
        );
    }, []);

    return {
        filters,
        toggleFilter,
        filterMessages,
        getMessageCounts,
    };
}
