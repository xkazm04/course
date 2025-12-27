"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Leaderboard, LeaderboardEntry, LeaderboardType, SkillTier } from "./types";
import { getMockLeaderboard } from "./challengeTemplates";
import { competitionStateStorage } from "./challengeStorage";

interface UseLeaderboardOptions {
    challengeId: string;
    type?: LeaderboardType;
    tierFilter?: SkillTier;
    autoRefresh?: boolean;
    refreshInterval?: number;
}

interface UseLeaderboardReturn {
    leaderboard: Leaderboard | null;
    entries: LeaderboardEntry[];
    userEntry: LeaderboardEntry | null;
    userRank: number | null;
    isLoading: boolean;
    totalParticipants: number;
    topThree: LeaderboardEntry[];
    setType: (type: LeaderboardType) => void;
    setTierFilter: (tier: SkillTier | undefined) => void;
    refresh: () => void;
}

export function useLeaderboard(options: UseLeaderboardOptions): UseLeaderboardReturn {
    const {
        challengeId,
        type: initialType = "overall",
        tierFilter: initialTierFilter,
        autoRefresh = false,
        refreshInterval = 30000,
    } = options;

    const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
    const [type, setType] = useState<LeaderboardType>(initialType);
    const [tierFilter, setTierFilter] = useState<SkillTier | undefined>(initialTierFilter);
    const [isLoading, setIsLoading] = useState(true);

    // Load leaderboard
    const loadLeaderboard = useCallback(() => {
        setIsLoading(true);
        try {
            // In production, this would be an API call
            const data = getMockLeaderboard(challengeId);
            setLeaderboard({
                ...data,
                type,
                tier: tierFilter,
            });
        } finally {
            setIsLoading(false);
        }
    }, [challengeId, type, tierFilter]);

    // Initial load and refresh on dependencies change
    useEffect(() => {
        loadLeaderboard();
    }, [loadLeaderboard]);

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(loadLeaderboard, refreshInterval);
        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, loadLeaderboard]);

    // Filtered entries
    const entries = useMemo(() => {
        if (!leaderboard) return [];

        let filtered = leaderboard.entries;

        if (tierFilter) {
            filtered = filtered.filter((e) => e.tier === tierFilter);
        }

        return filtered;
    }, [leaderboard, tierFilter]);

    // Find current user's entry
    const userEntry = useMemo(() => {
        if (!leaderboard) return null;

        const state = competitionStateStorage.get();
        return leaderboard.entries.find((e) => e.userId === state.userId) || null;
    }, [leaderboard]);

    // User's rank
    const userRank = useMemo(() => {
        return userEntry?.rank || null;
    }, [userEntry]);

    // Top three
    const topThree = useMemo(() => {
        return entries.slice(0, 3);
    }, [entries]);

    // Total participants
    const totalParticipants = useMemo(() => {
        return leaderboard?.entries.length || 0;
    }, [leaderboard]);

    return {
        leaderboard,
        entries,
        userEntry,
        userRank,
        isLoading,
        totalParticipants,
        topThree,
        setType,
        setTierFilter,
        refresh: loadLeaderboard,
    };
}
