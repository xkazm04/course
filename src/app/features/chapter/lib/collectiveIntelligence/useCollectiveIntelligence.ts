/**
 * useCollectiveIntelligence Hook
 *
 * React hook for accessing collective intelligence data and contributing
 * learner behavior to the emergent curriculum system.
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChapterNodeId } from "../chapterGraph";
import type { SectionBehavior } from "../conductorTypes";
import type {
    LearnerJourney,
    ChapterAttempt,
    ImplicitPrerequisite,
    StrugglePoint,
    OptimalPath,
    EmergentCurriculum,
    SectionBehaviorSummary,
    StruggleMetrics,
    ChapterSuccessMetrics,
    CollectiveIntelligenceConfig,
    DEFAULT_COLLECTIVE_INTELLIGENCE_CONFIG,
} from "./types";
import {
    learnerJourneyStorage,
    implicitPrerequisiteStorage,
    strugglePointStorage,
    optimalPathStorage,
} from "./storage";
import {
    getEmergentCurriculum,
    getImplicitPrerequisitesForChapter,
    getStrugglePointsForChapter,
    getRecommendedPath,
} from "./curriculumGenerator";

// ============================================================================
// TYPES
// ============================================================================

export interface UseCollectiveIntelligenceOptions {
    /** User ID for tracking */
    userId: string;
    /** Current course ID */
    courseId?: string;
    /** Current chapter ID */
    chapterId?: ChapterNodeId;
    /** Whether to auto-refresh data */
    autoRefresh?: boolean;
    /** Refresh interval in milliseconds */
    refreshInterval?: number;
    /** Minimum confidence for prerequisites */
    minPrerequisiteConfidence?: number;
}

export interface UseCollectiveIntelligenceReturn {
    // Current state
    journey: LearnerJourney | null;
    curriculum: EmergentCurriculum | null;
    isLoading: boolean;

    // Chapter-specific data
    chapterPrerequisites: ImplicitPrerequisite[];
    chapterStrugglePoints: StrugglePoint[];
    recommendedPath: OptimalPath | null;

    // Actions
    recordChapterStart: (chapterId: ChapterNodeId) => void;
    recordChapterComplete: (chapterId: ChapterNodeId, behaviors: SectionBehavior[]) => void;
    recordSectionBehavior: (sectionId: string, behavior: Partial<SectionBehavior>) => void;

    // Queries
    shouldShowPrerequisiteWarning: (chapterId: ChapterNodeId) => boolean;
    getPrerequisitesFor: (chapterId: ChapterNodeId) => ImplicitPrerequisite[];
    getStrugglePointsFor: (chapterId: ChapterNodeId) => StrugglePoint[];
    getOptimalPathForProfile: (pace: string, confidence: string) => OptimalPath | null;

    // Refresh
    refreshCurriculum: () => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useCollectiveIntelligence(
    options: UseCollectiveIntelligenceOptions
): UseCollectiveIntelligenceReturn {
    const {
        userId,
        courseId,
        chapterId,
        autoRefresh = false,
        refreshInterval = 60000, // 1 minute
        minPrerequisiteConfidence = 0.7,
    } = options;

    // State
    const [journey, setJourney] = useState<LearnerJourney | null>(null);
    const [curriculum, setCurriculum] = useState<EmergentCurriculum | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentAttempt, setCurrentAttempt] = useState<Partial<ChapterAttempt> | null>(
        null
    );

    // Load initial data
    useEffect(() => {
        setIsLoading(true);
        try {
            const existingJourney = learnerJourneyStorage.getJourney(userId);
            setJourney(existingJourney);

            const existingCurriculum = getEmergentCurriculum();
            setCurriculum(existingCurriculum);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            const refreshedCurriculum = getEmergentCurriculum();
            setCurriculum(refreshedCurriculum);
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval]);

    // Chapter-specific data
    const chapterPrerequisites = useMemo(() => {
        if (!chapterId) return [];
        return getImplicitPrerequisitesForChapter(chapterId, minPrerequisiteConfidence);
    }, [chapterId, minPrerequisiteConfidence]);

    const chapterStrugglePoints = useMemo(() => {
        if (!chapterId) return [];
        return getStrugglePointsForChapter(chapterId);
    }, [chapterId]);

    const recommendedPath = useMemo(() => {
        if (!journey) return null;
        return getRecommendedPath(
            journey.finalProfile.pace,
            journey.finalProfile.confidence
        );
    }, [journey]);

    // Actions
    const recordChapterStart = useCallback(
        (startChapterId: ChapterNodeId) => {
            setCurrentAttempt({
                chapterId: startChapterId,
                startedAt: Date.now(),
                completed: false,
                timeSpentMinutes: 0,
                retryCount: 0,
                sectionBehaviors: [],
                struggleMetrics: createDefaultStruggleMetrics(),
                successMetrics: createDefaultSuccessMetrics(),
            });
        },
        []
    );

    const recordSectionBehavior = useCallback(
        (sectionId: string, behavior: Partial<SectionBehavior>) => {
            if (!currentAttempt) return;

            const summary = sectionBehaviorToSummary(sectionId, behavior);

            setCurrentAttempt((prev) => {
                if (!prev) return null;

                const existingIndex = prev.sectionBehaviors?.findIndex(
                    (s) => s.sectionId === sectionId
                );

                let updatedBehaviors: SectionBehaviorSummary[];
                if (existingIndex !== undefined && existingIndex >= 0) {
                    updatedBehaviors = [...(prev.sectionBehaviors || [])];
                    updatedBehaviors[existingIndex] = {
                        ...updatedBehaviors[existingIndex]!,
                        ...summary,
                    };
                } else {
                    updatedBehaviors = [...(prev.sectionBehaviors || []), summary];
                }

                return {
                    ...prev,
                    sectionBehaviors: updatedBehaviors,
                };
            });
        },
        [currentAttempt]
    );

    const recordChapterComplete = useCallback(
        (completedChapterId: ChapterNodeId, behaviors: SectionBehavior[]) => {
            if (!currentAttempt || currentAttempt.chapterId !== completedChapterId) {
                // Create new attempt if not tracking
                const newAttempt: ChapterAttempt = {
                    chapterId: completedChapterId,
                    startedAt: Date.now() - 60000, // Assume 1 minute if not tracked
                    completedAt: Date.now(),
                    completed: true,
                    timeSpentMinutes: 1,
                    retryCount: 0,
                    sectionBehaviors: behaviors.map((b, i) =>
                        sectionBehaviorToSummary(`section-${i}`, b)
                    ),
                    struggleMetrics: calculateStruggleMetrics(behaviors),
                    successMetrics: calculateSuccessMetrics(behaviors),
                };

                const updatedJourney = learnerJourneyStorage.recordChapterAttempt(
                    userId,
                    newAttempt
                );
                setJourney(updatedJourney);
            } else {
                // Complete the tracked attempt
                const completedAttempt: ChapterAttempt = {
                    chapterId: completedChapterId,
                    startedAt: currentAttempt.startedAt!,
                    completedAt: Date.now(),
                    completed: true,
                    timeSpentMinutes: Math.round(
                        (Date.now() - currentAttempt.startedAt!) / 60000
                    ),
                    retryCount: currentAttempt.retryCount ?? 0,
                    sectionBehaviors: currentAttempt.sectionBehaviors ?? [],
                    struggleMetrics:
                        currentAttempt.struggleMetrics ?? createDefaultStruggleMetrics(),
                    successMetrics:
                        currentAttempt.successMetrics ?? createDefaultSuccessMetrics(),
                };

                const updatedJourney = learnerJourneyStorage.recordChapterAttempt(
                    userId,
                    completedAttempt
                );
                setJourney(updatedJourney);
            }

            setCurrentAttempt(null);
        },
        [currentAttempt, userId]
    );

    // Queries
    const shouldShowPrerequisiteWarning = useCallback(
        (queryChapterId: ChapterNodeId): boolean => {
            if (!journey) return false;

            const prereqs = getImplicitPrerequisitesForChapter(
                queryChapterId,
                minPrerequisiteConfidence
            );

            if (prereqs.length === 0) return false;

            const completedChapters = new Set(
                journey.chapterSequence
                    .filter((a) => a.completed)
                    .map((a) => a.chapterId)
            );

            return prereqs.some(
                (p) => !completedChapters.has(p.prerequisiteChapterId)
            );
        },
        [journey, minPrerequisiteConfidence]
    );

    const getPrerequisitesFor = useCallback(
        (queryChapterId: ChapterNodeId): ImplicitPrerequisite[] => {
            return getImplicitPrerequisitesForChapter(
                queryChapterId,
                minPrerequisiteConfidence
            );
        },
        [minPrerequisiteConfidence]
    );

    const getStrugglePointsFor = useCallback(
        (queryChapterId: ChapterNodeId): StrugglePoint[] => {
            return getStrugglePointsForChapter(queryChapterId);
        },
        []
    );

    const getOptimalPathForProfile = useCallback(
        (pace: string, confidence: string): OptimalPath | null => {
            return getRecommendedPath(pace, confidence);
        },
        []
    );

    const refreshCurriculum = useCallback(() => {
        setIsLoading(true);
        try {
            const refreshedCurriculum = getEmergentCurriculum();
            setCurriculum(refreshedCurriculum);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        journey,
        curriculum,
        isLoading,
        chapterPrerequisites,
        chapterStrugglePoints,
        recommendedPath,
        recordChapterStart,
        recordChapterComplete,
        recordSectionBehavior,
        shouldShowPrerequisiteWarning,
        getPrerequisitesFor,
        getStrugglePointsFor,
        getOptimalPathForProfile,
        refreshCurriculum,
    };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createDefaultStruggleMetrics(): StruggleMetrics {
    return {
        errorCount: 0,
        hintsRequested: 0,
        videoReplays: 0,
        significantPauses: 0,
        avgTimeOverExpected: 0,
        abandonedSections: [],
        frustrationScore: 0,
    };
}

function createDefaultSuccessMetrics(): ChapterSuccessMetrics {
    return {
        completionRate: 0,
        firstTrySuccessRate: 0,
        speedFactor: 1.0,
        quizAccuracy: 0,
        codeAccuracy: 0,
    };
}

function sectionBehaviorToSummary(
    sectionId: string,
    behavior: Partial<SectionBehavior>
): SectionBehaviorSummary {
    return {
        sectionId,
        timeSpent: behavior.timeSpent ?? 0,
        completed: behavior.completedAt !== null,
        errorCount: behavior.code?.errorCount ?? 0,
        retryCount: behavior.quiz?.attempts ?? 0,
        hintsUsed: behavior.code?.hintsRequested ?? 0,
        pauseCount: behavior.video?.pauseCount ?? 0,
        replayCount: behavior.video?.replayCount ?? 0,
    };
}

function calculateStruggleMetrics(behaviors: SectionBehavior[]): StruggleMetrics {
    let errorCount = 0;
    let hintsRequested = 0;
    let videoReplays = 0;
    let significantPauses = 0;
    const abandonedSections: string[] = [];

    for (const behavior of behaviors) {
        errorCount += behavior.code.errorCount;
        hintsRequested += behavior.code.hintsRequested;
        videoReplays += behavior.video.replayCount;
        significantPauses += behavior.video.pauseCount;
    }

    const frustrationScore = Math.min(
        1,
        (errorCount * 0.2 + hintsRequested * 0.2 + significantPauses * 0.1) / 10
    );

    return {
        errorCount,
        hintsRequested,
        videoReplays,
        significantPauses,
        avgTimeOverExpected: 0,
        abandonedSections,
        frustrationScore,
    };
}

function calculateSuccessMetrics(behaviors: SectionBehavior[]): ChapterSuccessMetrics {
    const completed = behaviors.filter((b) => b.completedAt !== null);
    const completionRate =
        behaviors.length > 0 ? completed.length / behaviors.length : 0;

    let totalQuizCorrect = 0;
    let totalQuizAttempts = 0;
    let totalCodeSuccess = 0;
    let totalCodeAttempts = 0;

    for (const behavior of behaviors) {
        totalQuizCorrect += behavior.quiz.correctCount;
        totalQuizAttempts += behavior.quiz.attempts;
        totalCodeSuccess += behavior.code.successCount;
        totalCodeAttempts += behavior.code.errorCount + behavior.code.successCount;
    }

    const quizAccuracy =
        totalQuizAttempts > 0 ? totalQuizCorrect / totalQuizAttempts : 0;
    const codeAccuracy =
        totalCodeAttempts > 0 ? totalCodeSuccess / totalCodeAttempts : 0;

    return {
        completionRate,
        firstTrySuccessRate: quizAccuracy * 0.5 + codeAccuracy * 0.5,
        speedFactor: 1.0,
        quizAccuracy,
        codeAccuracy,
    };
}

// ============================================================================
// EXPORT
// ============================================================================

export default useCollectiveIntelligence;
