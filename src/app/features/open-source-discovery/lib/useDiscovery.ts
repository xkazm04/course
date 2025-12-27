"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
    DiscoverableIssue,
    PartnerRepository,
    DiscoveryFilters,
    TaskComplexity,
    MatchResult,
    MatchingPreferences,
    SkillGap,
} from "./types";
import {
    getDiscoveryState,
    setFilters,
    toggleWatchRepository as toggleWatch,
    getWatchedRepositoryIds,
} from "./discoveryStorage";
import {
    getPartnerRepositories,
    getMockIssues,
    getUniqueLanguages,
} from "./partnerRegistry";

interface UseDiscoveryReturn {
    repositories: PartnerRepository[];
    issues: DiscoverableIssue[];
    filteredIssues: DiscoverableIssue[];
    filters: DiscoveryFilters;
    watchedRepositoryIds: string[];
    availableLanguages: string[];
    isLoading: boolean;
    setFilters: (filters: DiscoveryFilters) => void;
    toggleComplexityFilter: (complexity: TaskComplexity) => void;
    toggleLanguageFilter: (language: string) => void;
    toggleRepositoryFilter: (repoId: string) => void;
    toggleGoodFirstIssue: () => void;
    setMaxHours: (hours: number | null) => void;
    resetFilters: () => void;
    toggleWatchRepository: (repoId: string) => void;
    getMatchResults: (prefs: MatchingPreferences) => MatchResult[];
}

function calculateMatchScore(
    issue: DiscoverableIssue,
    prefs: MatchingPreferences
): MatchResult {
    let score = 50; // Base score
    const matchReasons: string[] = [];
    const skillGaps: SkillGap[] = [];
    const stretchOpportunities: string[] = [];

    // Complexity preference match
    if (prefs.preferredComplexity.includes(issue.analysis.complexity)) {
        score += 20;
        matchReasons.push(`Matches preferred complexity: ${issue.analysis.complexity}`);
    }

    // Language match
    const repoLanguages = prefs.preferredLanguages;
    const hasLanguageMatch = issue.analysis.requiredSkills.some(
        skill => repoLanguages.some(lang =>
            skill.skillName.toLowerCase().includes(lang.toLowerCase())
        )
    );
    if (hasLanguageMatch) {
        score += 15;
        matchReasons.push("Uses familiar technologies");
    }

    // Estimated time match
    if (issue.analysis.estimatedHours <= prefs.maxEstimatedHours) {
        score += 10;
        matchReasons.push("Fits time availability");
    } else {
        score -= 10;
    }

    // Good first issue bonus
    if (issue.labels.includes("good first issue")) {
        score += 10;
        matchReasons.push("Marked as good first issue");
    }

    // Stretch opportunities
    issue.analysis.requiredSkills.forEach(skill => {
        if (skill.isStretch) {
            stretchOpportunities.push(skill.skillName);
            if (prefs.preferStretch) {
                score += 5;
            }
        }
    });

    // Learning opportunities bonus
    if (issue.analysis.learningOpportunities.length > 0) {
        score += 5;
        matchReasons.push(`${issue.analysis.learningOpportunities.length} learning opportunities`);
    }

    // Confidence penalty for low-confidence analysis
    if (issue.analysis.confidence < 0.7) {
        score -= 10;
    }

    // Normalize score
    score = Math.max(0, Math.min(100, score));

    // Determine difficulty
    let estimatedDifficulty: MatchResult["estimatedDifficulty"] = "comfortable";
    if (stretchOpportunities.length > 1 || issue.analysis.complexity === "complex") {
        estimatedDifficulty = "challenging";
    }
    if (issue.analysis.complexity === "expert" || stretchOpportunities.length > 2) {
        estimatedDifficulty = "stretch";
    }

    return {
        issue,
        matchScore: score,
        matchReasons,
        skillGaps,
        stretchOpportunities,
        estimatedDifficulty,
    };
}

export function useDiscovery(): UseDiscoveryReturn {
    const [repositories, setRepositories] = useState<PartnerRepository[]>([]);
    const [issues, setIssues] = useState<DiscoverableIssue[]>([]);
    const [filters, setLocalFilters] = useState<DiscoveryFilters>({
        complexity: [],
        languages: [],
        repositories: [],
        hasGoodFirstIssueLabel: false,
        maxEstimatedHours: null,
    });
    const [watchedIds, setWatchedIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load initial data
    useEffect(() => {
        const state = getDiscoveryState();
        const repos = getPartnerRepositories();
        const mockIssues = getMockIssues();

        setRepositories(repos);
        setIssues(mockIssues);
        setLocalFilters(state.filters);
        setWatchedIds(getWatchedRepositoryIds());
        setIsLoading(false);
    }, []);

    const availableLanguages = useMemo(() => getUniqueLanguages(), []);

    // Filter issues based on current filters
    const filteredIssues = useMemo(() => {
        return issues.filter(issue => {
            // Complexity filter
            if (filters.complexity.length > 0 &&
                !filters.complexity.includes(issue.analysis.complexity)) {
                return false;
            }

            // Repository filter
            if (filters.repositories.length > 0 &&
                !filters.repositories.includes(issue.repositoryId)) {
                return false;
            }

            // Good first issue filter
            if (filters.hasGoodFirstIssueLabel &&
                !issue.labels.includes("good first issue")) {
                return false;
            }

            // Max hours filter
            if (filters.maxEstimatedHours !== null &&
                issue.analysis.estimatedHours > filters.maxEstimatedHours) {
                return false;
            }

            // Language filter (check if any required skill matches)
            if (filters.languages.length > 0) {
                const hasMatchingLanguage = issue.analysis.requiredSkills.some(
                    skill => filters.languages.some(
                        lang => skill.skillName.toLowerCase().includes(lang.toLowerCase())
                    )
                );
                if (!hasMatchingLanguage) {
                    return false;
                }
            }

            return true;
        });
    }, [issues, filters]);

    const handleSetFilters = useCallback((newFilters: DiscoveryFilters) => {
        setLocalFilters(newFilters);
        setFilters(newFilters);
    }, []);

    const toggleComplexityFilter = useCallback((complexity: TaskComplexity) => {
        setLocalFilters(prev => {
            const newComplexity = prev.complexity.includes(complexity)
                ? prev.complexity.filter(c => c !== complexity)
                : [...prev.complexity, complexity];
            const newFilters = { ...prev, complexity: newComplexity };
            setFilters(newFilters);
            return newFilters;
        });
    }, []);

    const toggleLanguageFilter = useCallback((language: string) => {
        setLocalFilters(prev => {
            const newLanguages = prev.languages.includes(language)
                ? prev.languages.filter(l => l !== language)
                : [...prev.languages, language];
            const newFilters = { ...prev, languages: newLanguages };
            setFilters(newFilters);
            return newFilters;
        });
    }, []);

    const toggleRepositoryFilter = useCallback((repoId: string) => {
        setLocalFilters(prev => {
            const newRepos = prev.repositories.includes(repoId)
                ? prev.repositories.filter(r => r !== repoId)
                : [...prev.repositories, repoId];
            const newFilters = { ...prev, repositories: newRepos };
            setFilters(newFilters);
            return newFilters;
        });
    }, []);

    const toggleGoodFirstIssue = useCallback(() => {
        setLocalFilters(prev => {
            const newFilters = { ...prev, hasGoodFirstIssueLabel: !prev.hasGoodFirstIssueLabel };
            setFilters(newFilters);
            return newFilters;
        });
    }, []);

    const setMaxHours = useCallback((hours: number | null) => {
        setLocalFilters(prev => {
            const newFilters = { ...prev, maxEstimatedHours: hours };
            setFilters(newFilters);
            return newFilters;
        });
    }, []);

    const resetFilters = useCallback(() => {
        const defaultFilters: DiscoveryFilters = {
            complexity: [],
            languages: [],
            repositories: [],
            hasGoodFirstIssueLabel: false,
            maxEstimatedHours: null,
        };
        setLocalFilters(defaultFilters);
        setFilters(defaultFilters);
    }, []);

    const handleToggleWatch = useCallback((repoId: string) => {
        const isNowWatched = toggleWatch(repoId);
        setWatchedIds(prev =>
            isNowWatched
                ? [...prev, repoId]
                : prev.filter(id => id !== repoId)
        );
    }, []);

    const getMatchResults = useCallback((prefs: MatchingPreferences): MatchResult[] => {
        return filteredIssues
            .map(issue => calculateMatchScore(issue, prefs))
            .sort((a, b) => b.matchScore - a.matchScore);
    }, [filteredIssues]);

    return {
        repositories,
        issues,
        filteredIssues,
        filters,
        watchedRepositoryIds: watchedIds,
        availableLanguages,
        isLoading,
        setFilters: handleSetFilters,
        toggleComplexityFilter,
        toggleLanguageFilter,
        toggleRepositoryFilter,
        toggleGoodFirstIssue,
        setMaxHours,
        resetFilters,
        toggleWatchRepository: handleToggleWatch,
        getMatchResults,
    };
}
