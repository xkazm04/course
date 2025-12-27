"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Challenge, ChallengeStatus } from "./types";
import {
    getAllChallenges,
    getChallengesByStatus,
    getChallengeById,
} from "./challengeTemplates";
import {
    competitionStateStorage,
    joinChallenge as storageJoinChallenge,
    leaveChallenge as storageLeaveChallenge,
    getUserSubmission,
} from "./challengeStorage";

interface UseChallengeOptions {
    status?: ChallengeStatus;
    autoRefresh?: boolean;
    refreshInterval?: number;
}

interface UseChallengeReturn {
    challenges: Challenge[];
    activeChallenges: Challenge[];
    upcomingChallenges: Challenge[];
    completedChallenges: Challenge[];
    joinedChallengeIds: string[];
    isLoading: boolean;
    selectedChallenge: Challenge | null;
    selectChallenge: (id: string | null) => void;
    joinChallenge: (id: string) => void;
    leaveChallenge: (id: string) => void;
    hasJoined: (id: string) => boolean;
    hasSubmission: (id: string) => boolean;
    refresh: () => void;
}

export function useChallenge(options: UseChallengeOptions = {}): UseChallengeReturn {
    const { status, autoRefresh = false, refreshInterval = 60000 } = options;

    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [joinedChallengeIds, setJoinedChallengeIds] = useState<string[]>([]);
    const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load challenges
    const loadChallenges = useCallback(() => {
        setIsLoading(true);
        try {
            const allChallenges = status
                ? getChallengesByStatus(status)
                : getAllChallenges();
            setChallenges(allChallenges);

            const state = competitionStateStorage.get();
            setJoinedChallengeIds(state.activeChallengeIds);
        } finally {
            setIsLoading(false);
        }
    }, [status]);

    // Initial load
    useEffect(() => {
        loadChallenges();
    }, [loadChallenges]);

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(loadChallenges, refreshInterval);
        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, loadChallenges]);

    // Filtered challenge lists
    const activeChallenges = useMemo(
        () => challenges.filter((c) => c.status === "active"),
        [challenges]
    );

    const upcomingChallenges = useMemo(
        () => challenges.filter((c) => c.status === "upcoming"),
        [challenges]
    );

    const completedChallenges = useMemo(
        () => challenges.filter((c) => c.status === "completed"),
        [challenges]
    );

    // Selected challenge
    const selectedChallenge = useMemo(
        () => (selectedChallengeId ? getChallengeById(selectedChallengeId) : null),
        [selectedChallengeId]
    );

    // Actions
    const selectChallenge = useCallback((id: string | null) => {
        setSelectedChallengeId(id);
    }, []);

    const joinChallenge = useCallback((id: string) => {
        storageJoinChallenge(id);
        setJoinedChallengeIds((prev) => [...new Set([...prev, id])]);
    }, []);

    const leaveChallenge = useCallback((id: string) => {
        storageLeaveChallenge(id);
        setJoinedChallengeIds((prev) => prev.filter((cid) => cid !== id));
    }, []);

    const hasJoined = useCallback(
        (id: string) => joinedChallengeIds.includes(id),
        [joinedChallengeIds]
    );

    const hasSubmission = useCallback((id: string) => {
        return getUserSubmission(id) !== null;
    }, []);

    return {
        challenges,
        activeChallenges,
        upcomingChallenges,
        completedChallenges,
        joinedChallengeIds,
        isLoading,
        selectedChallenge,
        selectChallenge,
        joinChallenge,
        leaveChallenge,
        hasJoined,
        hasSubmission,
        refresh: loadChallenges,
    };
}
