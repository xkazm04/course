"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    ActiveContribution,
    CompletedContribution,
    ContributionStatus,
    ContributionStats,
    MOCK_CONTRIBUTIONS,
} from "./types";
import {
    getActiveContributions,
    getCompletedContributions,
    addActiveContribution,
    updateContributionStatus,
    addContributionNote,
    completeContribution,
    removeActiveContribution,
} from "./contributionStorage";

interface UseContributionReturn {
    activeContributions: ActiveContribution[];
    completedContributions: CompletedContribution[];
    stats: ContributionStats;
    isLoading: boolean;
    claimIssue: (params: ClaimIssueParams) => ActiveContribution;
    updateStatus: (id: string, status: ContributionStatus, metadata?: Record<string, unknown>) => void;
    updateNotes: (id: string, notes: string) => void;
    markComplete: (id: string, outcome: "merged" | "closed" | "abandoned", skills?: string[], reflection?: string) => void;
    abandonContribution: (id: string) => void;
    getContributionById: (id: string) => ActiveContribution | undefined;
}

interface ClaimIssueParams {
    issueId: string;
    issueTitle: string;
    issueUrl: string;
    repositoryId: string;
    repositoryName: string;
    repositoryOwner: string;
}

export function useContribution(): UseContributionReturn {
    const [activeContributions, setActiveContributions] = useState<ActiveContribution[]>([]);
    const [completedContributions, setCompletedContributions] = useState<CompletedContribution[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load initial data
    useEffect(() => {
        let stored = getActiveContributions();
        const completed = getCompletedContributions();

        // Use mock data if empty (for demo)
        if (stored.length === 0) {
            stored = MOCK_CONTRIBUTIONS;
        }

        setActiveContributions(stored);
        setCompletedContributions(completed);
        setIsLoading(false);
    }, []);

    // Calculate stats
    const stats = useMemo((): ContributionStats => {
        const allContributions = [...activeContributions, ...completedContributions];
        const merged = completedContributions.filter(c => c.outcome === "merged");
        const closed = completedContributions.filter(c => c.outcome === "closed");
        const pending = activeContributions.length;

        // Top repositories
        const repoCounts: Record<string, number> = {};
        allContributions.forEach(c => {
            const key = `${c.repositoryOwner}/${c.repositoryName}`;
            repoCounts[key] = (repoCounts[key] || 0) + 1;
        });
        const topRepositories = Object.entries(repoCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Skills gained
        const skillCounts: Record<string, number> = {};
        completedContributions.forEach(c => {
            c.skillsGained.forEach(skill => {
                skillCounts[skill] = (skillCounts[skill] || 0) + 1;
            });
        });
        const skillsGained = Object.entries(skillCounts)
            .map(([skill, count]) => ({ skill, count }))
            .sort((a, b) => b.count - a.count);

        // Average time to merge
        const mergedWithTime = merged.filter(c => c.totalTimeSpentHours > 0);
        const avgTimeToMergeHours = mergedWithTime.length > 0
            ? Math.round(mergedWithTime.reduce((sum, c) => sum + c.totalTimeSpentHours, 0) / mergedWithTime.length)
            : 0;

        return {
            totalContributions: allContributions.length,
            mergedCount: merged.length,
            pendingCount: pending,
            closedCount: closed.length,
            avgTimeToMergeHours,
            topRepositories,
            skillsGained,
        };
    }, [activeContributions, completedContributions]);

    const claimIssue = useCallback((params: ClaimIssueParams): ActiveContribution => {
        const contribution = addActiveContribution({
            ...params,
            status: "claimed",
            notes: "",
        });
        setActiveContributions(prev => [contribution, ...prev]);
        return contribution;
    }, []);

    const updateStatus = useCallback((
        id: string,
        status: ContributionStatus,
        metadata?: Record<string, unknown>
    ) => {
        const updated = updateContributionStatus(id, status, metadata);
        if (updated) {
            setActiveContributions(prev =>
                prev.map(c => c.id === id ? updated : c)
            );
        }
    }, []);

    const updateNotes = useCallback((id: string, notes: string) => {
        const updated = addContributionNote(id, notes);
        if (updated) {
            setActiveContributions(prev =>
                prev.map(c => c.id === id ? updated : c)
            );
        }
    }, []);

    const markComplete = useCallback((
        id: string,
        outcome: "merged" | "closed" | "abandoned",
        skills?: string[],
        reflection?: string
    ) => {
        const completed = completeContribution(id, outcome, skills, reflection);
        if (completed) {
            setActiveContributions(prev => prev.filter(c => c.id !== id));
            setCompletedContributions(prev => [completed, ...prev]);
        }
    }, []);

    const abandonContribution = useCallback((id: string) => {
        const removed = removeActiveContribution(id);
        if (removed) {
            setActiveContributions(prev => prev.filter(c => c.id !== id));
        }
    }, []);

    const getContributionById = useCallback((id: string): ActiveContribution | undefined => {
        return activeContributions.find(c => c.id === id);
    }, [activeContributions]);

    return {
        activeContributions,
        completedContributions,
        stats,
        isLoading,
        claimIssue,
        updateStatus,
        updateNotes,
        markComplete,
        abandonContribution,
        getContributionById,
    };
}
