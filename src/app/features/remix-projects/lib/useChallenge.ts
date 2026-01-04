/**
 * useChallenge Hook
 *
 * Unified hook for accessing challenges from any source (seed templates or scanned).
 * Provides a consistent API regardless of the challenge origin.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import type {
    Challenge,
    ChallengeItem,
    ChallengeType,
    ChallengeDifficulty,
    ChallengeSeverity,
} from "./challenge";
import {
    seedProjectToChallenge,
    scannedToChallenge,
    getChallengeItemsByType,
    getChallengeItemsByDifficulty,
    getChallengeItemsBySeverity,
    getChallengeTotalMinutes,
    getChallengeCompletionEstimate,
} from "./challenge";
import { getAllSeedProjects, getSeedProjectById } from "./seedProjectTemplates";
import {
    getApprovedChallenges,
    getScannedProjects,
    getScannedProject,
} from "./remixApi";
import type { ScannedProject, ScannedChallenge, GetChallengesOptions } from "./remixApi";
import type { SeedProject, ProjectDifficulty, ProjectDomain } from "./types";

// =============================================================================
// Types
// =============================================================================

export interface ChallengeFilters {
    difficulty?: ProjectDifficulty | ProjectDifficulty[];
    domain?: ProjectDomain | ProjectDomain[];
    type?: ChallengeType | ChallengeType[];
    language?: string;
    framework?: string;
    searchQuery?: string;
    source?: "all" | "seed" | "scanned";
}

export interface UseChallengesResult {
    challenges: Challenge[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;

    // Filter helpers
    filteredChallenges: Challenge[];
    setFilters: (filters: ChallengeFilters) => void;
    filters: ChallengeFilters;

    // Pagination (for large lists)
    page: number;
    setPage: (page: number) => void;
    pageSize: number;
    setPageSize: (size: number) => void;
    totalCount: number;
    hasMore: boolean;
}

export interface UseChallengeResult {
    challenge: Challenge | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;

    // Item helpers
    getItemsByType: (type: ChallengeType) => ChallengeItem[];
    getItemsByDifficulty: (difficulty: ChallengeDifficulty) => ChallengeItem[];
    getItemsBySeverity: (severity: ChallengeSeverity) => ChallengeItem[];
    totalMinutes: number;
    getCompletionEstimate: (completedIds: Set<string>) => number;
}

// =============================================================================
// Data Fetching Helpers
// =============================================================================

/**
 * Fetch all seed project challenges
 */
async function fetchSeedChallenges(): Promise<Challenge[]> {
    const projects = getAllSeedProjects();
    return projects.map(seedProjectToChallenge);
}

/**
 * Fetch all scanned project challenges
 */
async function fetchScannedChallenges(
    options: GetChallengesOptions = {}
): Promise<Challenge[]> {
    // Get scanned projects
    const projectsResult = await getScannedProjects({
        language: options.type ? undefined : undefined, // Could add language filter
    });

    if (projectsResult.error || !projectsResult.data) {
        console.error("Failed to fetch scanned projects:", projectsResult.error);
        return [];
    }

    const projects = projectsResult.data.projects;

    // Get challenges for each project
    const challengesByProject: Map<string, ScannedChallenge[]> = new Map();

    const challengesResult = await getApprovedChallenges(options);
    if (challengesResult.error || !challengesResult.data) {
        console.error("Failed to fetch scanned challenges:", challengesResult.error);
        return [];
    }

    // Group challenges by project
    for (const challenge of challengesResult.data.challenges) {
        const projectChallenges = challengesByProject.get(challenge.project_id) || [];
        projectChallenges.push(challenge);
        challengesByProject.set(challenge.project_id, projectChallenges);
    }

    // Convert to unified challenges
    const unifiedChallenges: Challenge[] = [];

    for (const project of projects) {
        const projectChallenges = challengesByProject.get(project.id) || [];
        if (projectChallenges.length > 0) {
            unifiedChallenges.push(scannedToChallenge(project, projectChallenges));
        }
    }

    return unifiedChallenges;
}

/**
 * Fetch a single seed project challenge by ID
 */
async function fetchSeedChallenge(id: string): Promise<Challenge | null> {
    const project = getSeedProjectById(id);
    return project ? seedProjectToChallenge(project) : null;
}

/**
 * Fetch a single scanned project challenge by ID
 */
async function fetchScannedChallenge(id: string): Promise<Challenge | null> {
    const projectResult = await getScannedProject(id);
    if (projectResult.error || !projectResult.data) {
        return null;
    }

    const challengesResult = await getApprovedChallenges({ project_id: id });
    if (challengesResult.error || !challengesResult.data) {
        return null;
    }

    return scannedToChallenge(
        projectResult.data.project,
        challengesResult.data.challenges
    );
}

// =============================================================================
// Filter Helpers
// =============================================================================

function matchesFilter<T>(value: T, filter: T | T[] | undefined): boolean {
    if (filter === undefined) return true;
    if (Array.isArray(filter)) {
        return filter.includes(value);
    }
    return value === filter;
}

function applyChallengeFilters(
    challenges: Challenge[],
    filters: ChallengeFilters
): Challenge[] {
    return challenges.filter(challenge => {
        // Difficulty filter
        if (!matchesFilter(challenge.difficulty, filters.difficulty)) {
            return false;
        }

        // Domain filter
        if (!matchesFilter(challenge.domain, filters.domain)) {
            return false;
        }

        // Language filter
        if (filters.language && challenge.techStack.language !== filters.language) {
            return false;
        }

        // Framework filter
        if (filters.framework && challenge.techStack.framework !== filters.framework) {
            return false;
        }

        // Source filter
        if (filters.source && filters.source !== "all") {
            if (filters.source !== challenge.origin.source) {
                return false;
            }
        }

        // Type filter (at least one item matches)
        if (filters.type) {
            const types = Array.isArray(filters.type) ? filters.type : [filters.type];
            const hasMatchingType = challenge.items.some(item =>
                types.includes(item.type)
            );
            if (!hasMatchingType) {
                return false;
            }
        }

        // Search query filter
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            const matchesName = challenge.name.toLowerCase().includes(query);
            const matchesDescription = challenge.description.toLowerCase().includes(query);
            const matchesTech = [
                challenge.techStack.language,
                challenge.techStack.framework,
                challenge.techStack.database,
            ]
                .filter(Boolean)
                .some(tech => tech?.toLowerCase().includes(query));
            const matchesItems = challenge.items.some(
                item =>
                    item.title.toLowerCase().includes(query) ||
                    item.description.toLowerCase().includes(query)
            );

            if (!matchesName && !matchesDescription && !matchesTech && !matchesItems) {
                return false;
            }
        }

        return true;
    });
}

// =============================================================================
// useChallenges Hook - Fetch multiple challenges
// =============================================================================

/**
 * Hook for fetching and managing multiple challenges from all sources
 */
export function useChallenges(
    initialFilters: ChallengeFilters = {}
): UseChallengesResult {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<ChallengeFilters>(initialFilters);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const fetchChallenges = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const allChallenges: Challenge[] = [];

            // Fetch based on source filter
            const source = filters.source || "all";

            if (source === "all" || source === "seed") {
                const seedChallenges = await fetchSeedChallenges();
                allChallenges.push(...seedChallenges);
            }

            if (source === "all" || source === "scanned") {
                const scannedChallenges = await fetchScannedChallenges({
                    difficulty: Array.isArray(filters.difficulty)
                        ? filters.difficulty[0]
                        : filters.difficulty,
                    type: Array.isArray(filters.type)
                        ? filters.type[0] as GetChallengesOptions["type"]
                        : filters.type as GetChallengesOptions["type"],
                });
                allChallenges.push(...scannedChallenges);
            }

            setChallenges(allChallenges);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch challenges");
        } finally {
            setIsLoading(false);
        }
    }, [filters.source, filters.difficulty, filters.type]);

    useEffect(() => {
        fetchChallenges();
    }, [fetchChallenges]);

    // Apply client-side filters
    const filteredChallenges = useMemo(
        () => applyChallengeFilters(challenges, filters),
        [challenges, filters]
    );

    // Pagination
    const totalCount = filteredChallenges.length;
    const paginatedChallenges = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredChallenges.slice(start, start + pageSize);
    }, [filteredChallenges, page, pageSize]);

    const hasMore = page * pageSize < totalCount;

    return {
        challenges: paginatedChallenges,
        isLoading,
        error,
        refetch: fetchChallenges,
        filteredChallenges,
        setFilters,
        filters,
        page,
        setPage,
        pageSize,
        setPageSize,
        totalCount,
        hasMore,
    };
}

// =============================================================================
// useChallenge Hook - Fetch a single challenge
// =============================================================================

export interface UseChallengeOptions {
    /** ID of the challenge to fetch */
    id: string;
    /** Source hint to optimize fetching ("seed" | "scanned" | "auto") */
    sourceHint?: "seed" | "scanned" | "auto";
}

/**
 * Hook for fetching and managing a single challenge
 */
export function useChallenge(options: UseChallengeOptions): UseChallengeResult {
    const { id, sourceHint = "auto" } = options;

    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchChallenge = useCallback(async () => {
        if (!id) {
            setChallenge(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            let result: Challenge | null = null;

            // Try based on source hint
            if (sourceHint === "seed" || sourceHint === "auto") {
                result = await fetchSeedChallenge(id);
            }

            if (!result && (sourceHint === "scanned" || sourceHint === "auto")) {
                result = await fetchScannedChallenge(id);
            }

            if (!result) {
                setError(`Challenge not found: ${id}`);
            }

            setChallenge(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch challenge");
        } finally {
            setIsLoading(false);
        }
    }, [id, sourceHint]);

    useEffect(() => {
        fetchChallenge();
    }, [fetchChallenge]);

    // Item helpers
    const getItemsByType = useCallback(
        (type: ChallengeType) => {
            if (!challenge) return [];
            return getChallengeItemsByType(challenge, type);
        },
        [challenge]
    );

    const getItemsByDifficulty = useCallback(
        (difficulty: ChallengeDifficulty) => {
            if (!challenge) return [];
            return getChallengeItemsByDifficulty(challenge, difficulty);
        },
        [challenge]
    );

    const getItemsBySeverity = useCallback(
        (severity: ChallengeSeverity) => {
            if (!challenge) return [];
            return getChallengeItemsBySeverity(challenge, severity);
        },
        [challenge]
    );

    const totalMinutes = useMemo(
        () => (challenge ? getChallengeTotalMinutes(challenge) : 0),
        [challenge]
    );

    const getCompletionEstimate = useCallback(
        (completedIds: Set<string>) => {
            if (!challenge) return 0;
            return getChallengeCompletionEstimate(challenge, completedIds);
        },
        [challenge]
    );

    return {
        challenge,
        isLoading,
        error,
        refetch: fetchChallenge,
        getItemsByType,
        getItemsByDifficulty,
        getItemsBySeverity,
        totalMinutes,
        getCompletionEstimate,
    };
}

// =============================================================================
// useChallengeItem Hook - Work with a specific challenge item
// =============================================================================

export interface UseChallengeItemResult {
    item: ChallengeItem | null;
    challenge: Challenge | null;
    isLoading: boolean;
    error: string | null;
}

/**
 * Hook for fetching a specific challenge item by ID
 */
export function useChallengeItem(
    challengeId: string,
    itemId: string
): UseChallengeItemResult {
    const { challenge, isLoading, error } = useChallenge({ id: challengeId });

    const item = useMemo(() => {
        if (!challenge) return null;
        return challenge.items.find(i => i.id === itemId) || null;
    }, [challenge, itemId]);

    return {
        item,
        challenge,
        isLoading,
        error,
    };
}

// =============================================================================
// Factory function for creating challenges from arbitrary sources
// =============================================================================

/**
 * Convert a SeedProject to a Challenge (synchronous helper)
 */
export function fromSeedProject(project: SeedProject): Challenge {
    return seedProjectToChallenge(project);
}

/**
 * Convert a ScannedProject with challenges to a Challenge (synchronous helper)
 */
export function fromScannedProject(
    project: ScannedProject,
    challenges: ScannedChallenge[]
): Challenge {
    return scannedToChallenge(project, challenges);
}
