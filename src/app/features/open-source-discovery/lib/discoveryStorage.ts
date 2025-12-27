"use client";

import { createTimestampedStorage } from "@/app/shared/lib/storageFactory";
import {
    DiscoveryState,
    DiscoveryFilters,
    DiscoverableIssue,
    PartnerRepository,
    DISCOVERY_STORAGE_KEY,
    DISCOVERY_VERSION,
} from "./types";

function getDefaultFilters(): DiscoveryFilters {
    return {
        complexity: [],
        languages: [],
        repositories: [],
        hasGoodFirstIssueLabel: false,
        maxEstimatedHours: null,
    };
}

function getDefaultState(): DiscoveryState {
    return {
        repositories: [],
        issues: [],
        watchedRepositoryIds: [],
        lastSyncAt: null,
        filters: getDefaultFilters(),
    };
}

const discoveryStorage = createTimestampedStorage<DiscoveryState & { lastUpdated?: string }>({
    storageKey: DISCOVERY_STORAGE_KEY,
    getDefault: getDefaultState,
    version: DISCOVERY_VERSION,
    migrate: (oldData: unknown) => {
        const data = oldData as Partial<DiscoveryState>;
        return {
            ...getDefaultState(),
            repositories: data?.repositories || [],
            issues: data?.issues || [],
            watchedRepositoryIds: data?.watchedRepositoryIds || [],
        };
    },
});

export function getDiscoveryState(): DiscoveryState {
    return discoveryStorage.get();
}

export function saveDiscoveryState(state: DiscoveryState): void {
    discoveryStorage.save({ ...state, lastUpdated: new Date().toISOString() });
}

export function getRepositories(): PartnerRepository[] {
    return getDiscoveryState().repositories;
}

export function setRepositories(repos: PartnerRepository[]): void {
    const state = getDiscoveryState();
    saveDiscoveryState({ ...state, repositories: repos });
}

export function getIssues(): DiscoverableIssue[] {
    return getDiscoveryState().issues;
}

export function setIssues(issues: DiscoverableIssue[]): void {
    const state = getDiscoveryState();
    saveDiscoveryState({ ...state, issues });
}

export function addIssue(issue: DiscoverableIssue): void {
    const state = getDiscoveryState();
    const exists = state.issues.some(i => i.id === issue.id);
    if (!exists) {
        saveDiscoveryState({
            ...state,
            issues: [issue, ...state.issues],
        });
    }
}

export function getWatchedRepositoryIds(): string[] {
    return getDiscoveryState().watchedRepositoryIds;
}

export function toggleWatchRepository(repoId: string): boolean {
    const state = getDiscoveryState();
    const isWatched = state.watchedRepositoryIds.includes(repoId);

    saveDiscoveryState({
        ...state,
        watchedRepositoryIds: isWatched
            ? state.watchedRepositoryIds.filter(id => id !== repoId)
            : [...state.watchedRepositoryIds, repoId],
    });

    return !isWatched;
}

export function getFilters(): DiscoveryFilters {
    return getDiscoveryState().filters;
}

export function setFilters(filters: DiscoveryFilters): void {
    const state = getDiscoveryState();
    saveDiscoveryState({ ...state, filters });
}

export function updateFilters(updates: Partial<DiscoveryFilters>): void {
    const state = getDiscoveryState();
    saveDiscoveryState({
        ...state,
        filters: { ...state.filters, ...updates },
    });
}

export function resetFilters(): void {
    const state = getDiscoveryState();
    saveDiscoveryState({ ...state, filters: getDefaultFilters() });
}

export function updateLastSync(): void {
    const state = getDiscoveryState();
    saveDiscoveryState({ ...state, lastSyncAt: new Date().toISOString() });
}

export function clearDiscoveryData(): void {
    discoveryStorage.clear();
}
