/**
 * Collective Intelligence Storage
 *
 * Persistent storage for learner journeys, implicit prerequisites,
 * and emergent curriculum data.
 */

import {
    createLocalStorage,
    generateId,
} from "@/app/shared/lib/storageFactory";
import type {
    LearnerJourney,
    ChapterAttempt,
    ImplicitPrerequisite,
    StrugglePoint,
    CommonError,
    OptimalPath,
    EmergentCurriculum,
    CurriculumHealthMetrics,
    CurriculumRecommendation,
} from "./types";
import type { ChapterNodeId } from "../chapterGraph";

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
    LEARNER_JOURNEYS: "collective-learner-journeys",
    IMPLICIT_PREREQUISITES: "collective-implicit-prerequisites",
    STRUGGLE_POINTS: "collective-struggle-points",
    COMMON_ERRORS: "collective-common-errors",
    OPTIMAL_PATHS: "collective-optimal-paths",
    EMERGENT_CURRICULUM: "collective-emergent-curriculum",
    AGGREGATION_METADATA: "collective-aggregation-metadata",
} as const;

// ============================================================================
// Learner Journeys Storage
// ============================================================================

interface LearnerJourneysData {
    journeys: Record<string, LearnerJourney>;
    totalCount: number;
    lastUpdated: string;
}

const journeysStorage = createLocalStorage<LearnerJourneysData>({
    storageKey: STORAGE_KEYS.LEARNER_JOURNEYS,
    getDefault: () => ({
        journeys: {},
        totalCount: 0,
        lastUpdated: new Date().toISOString(),
    }),
});

export const learnerJourneyStorage = {
    /**
     * Get a learner's journey
     */
    getJourney: (userId: string): LearnerJourney | null => {
        const data = journeysStorage.get();
        return data.journeys[userId] || null;
    },

    /**
     * Create or get a learner's journey
     */
    getOrCreateJourney: (userId: string): LearnerJourney => {
        const existing = learnerJourneyStorage.getJourney(userId);
        if (existing) return existing;

        const newJourney: LearnerJourney = {
            userId,
            chapterSequence: [],
            successMetrics: {
                chaptersCompleted: 0,
                chaptersAttempted: 0,
                completionRate: 0,
                avgTimePerChapter: 0,
                overallStruggleScore: 0,
            },
            finalProfile: {
                pace: "normal",
                confidence: "moderate",
                strengthAreas: [],
                weaknessAreas: [],
            },
            timestamps: {
                started: Date.now(),
                lastActivity: Date.now(),
            },
        };

        journeysStorage.update((data) => ({
            journeys: { ...data.journeys, [userId]: newJourney },
            totalCount: data.totalCount + 1,
            lastUpdated: new Date().toISOString(),
        }));

        return newJourney;
    },

    /**
     * Record a chapter attempt
     */
    recordChapterAttempt: (
        userId: string,
        attempt: ChapterAttempt
    ): LearnerJourney => {
        const journey = learnerJourneyStorage.getOrCreateJourney(userId);

        // Check if this chapter was already attempted
        const existingIndex = journey.chapterSequence.findIndex(
            (a) => a.chapterId === attempt.chapterId
        );

        let updatedSequence: ChapterAttempt[];
        if (existingIndex >= 0) {
            // Update existing attempt
            updatedSequence = [...journey.chapterSequence];
            updatedSequence[existingIndex] = {
                ...updatedSequence[existingIndex],
                ...attempt,
                retryCount: (updatedSequence[existingIndex]?.retryCount || 0) + 1,
            };
        } else {
            // Add new attempt
            updatedSequence = [...journey.chapterSequence, attempt];
        }

        // Update success metrics
        const completed = updatedSequence.filter((a) => a.completed);
        const successMetrics = {
            chaptersCompleted: completed.length,
            chaptersAttempted: updatedSequence.length,
            completionRate:
                updatedSequence.length > 0
                    ? completed.length / updatedSequence.length
                    : 0,
            avgTimePerChapter:
                completed.length > 0
                    ? completed.reduce((sum, a) => sum + a.timeSpentMinutes, 0) /
                      completed.length
                    : 0,
            overallStruggleScore:
                updatedSequence.length > 0
                    ? updatedSequence.reduce(
                          (sum, a) => sum + a.struggleMetrics.frustrationScore,
                          0
                      ) / updatedSequence.length
                    : 0,
        };

        const updatedJourney: LearnerJourney = {
            ...journey,
            chapterSequence: updatedSequence,
            successMetrics,
            timestamps: {
                ...journey.timestamps,
                lastActivity: Date.now(),
                completed: completed.length === updatedSequence.length ? Date.now() : undefined,
            },
        };

        journeysStorage.update((data) => ({
            ...data,
            journeys: { ...data.journeys, [userId]: updatedJourney },
            lastUpdated: new Date().toISOString(),
        }));

        return updatedJourney;
    },

    /**
     * Get all journeys for analysis
     */
    getAllJourneys: (): LearnerJourney[] => {
        const data = journeysStorage.get();
        return Object.values(data.journeys);
    },

    /**
     * Get journeys with significant data
     */
    getAnalyzableJourneys: (minChapters: number = 2): LearnerJourney[] => {
        return learnerJourneyStorage
            .getAllJourneys()
            .filter((j) => j.chapterSequence.length >= minChapters);
    },

    /**
     * Get journey count
     */
    getJourneyCount: (): number => {
        const data = journeysStorage.get();
        return data.totalCount;
    },
};

// ============================================================================
// Implicit Prerequisites Storage
// ============================================================================

interface ImplicitPrerequisitesData {
    prerequisites: ImplicitPrerequisite[];
    lastComputed: string;
}

const prerequisitesStorage = createLocalStorage<ImplicitPrerequisitesData>({
    storageKey: STORAGE_KEYS.IMPLICIT_PREREQUISITES,
    getDefault: () => ({
        prerequisites: [],
        lastComputed: new Date().toISOString(),
    }),
});

export const implicitPrerequisiteStorage = {
    /**
     * Get all implicit prerequisites
     */
    getAll: (): ImplicitPrerequisite[] => {
        return prerequisitesStorage.get().prerequisites;
    },

    /**
     * Get prerequisites for a specific chapter
     */
    getForChapter: (chapterId: ChapterNodeId): ImplicitPrerequisite[] => {
        return implicitPrerequisiteStorage
            .getAll()
            .filter((p) => p.dependentChapterId === chapterId);
    },

    /**
     * Get chapters that depend on a specific prerequisite
     */
    getDependentsOf: (prereqId: ChapterNodeId): ImplicitPrerequisite[] => {
        return implicitPrerequisiteStorage
            .getAll()
            .filter((p) => p.prerequisiteChapterId === prereqId);
    },

    /**
     * Save a new or updated implicit prerequisite
     */
    save: (prerequisite: ImplicitPrerequisite): void => {
        prerequisitesStorage.update((data) => {
            // Check if this relationship already exists
            const existingIndex = data.prerequisites.findIndex(
                (p) =>
                    p.prerequisiteChapterId === prerequisite.prerequisiteChapterId &&
                    p.dependentChapterId === prerequisite.dependentChapterId
            );

            let updatedPrerequisites: ImplicitPrerequisite[];
            if (existingIndex >= 0) {
                updatedPrerequisites = [...data.prerequisites];
                updatedPrerequisites[existingIndex] = prerequisite;
            } else {
                updatedPrerequisites = [...data.prerequisites, prerequisite];
            }

            return {
                prerequisites: updatedPrerequisites,
                lastComputed: new Date().toISOString(),
            };
        });
    },

    /**
     * Save multiple prerequisites (bulk update)
     */
    saveAll: (prerequisites: ImplicitPrerequisite[]): void => {
        prerequisitesStorage.save({
            prerequisites,
            lastComputed: new Date().toISOString(),
        });
    },

    /**
     * Get high-confidence prerequisites only
     */
    getHighConfidence: (threshold: number = 0.7): ImplicitPrerequisite[] => {
        return implicitPrerequisiteStorage
            .getAll()
            .filter((p) => p.confidence >= threshold);
    },

    /**
     * Check if a prerequisite relationship exists
     */
    hasPrerequisite: (
        prereqId: ChapterNodeId,
        dependentId: ChapterNodeId
    ): boolean => {
        return implicitPrerequisiteStorage
            .getAll()
            .some(
                (p) =>
                    p.prerequisiteChapterId === prereqId &&
                    p.dependentChapterId === dependentId
            );
    },
};

// ============================================================================
// Struggle Points Storage
// ============================================================================

interface StrugglePointsData {
    points: StrugglePoint[];
    lastUpdated: string;
}

const strugglePointsStorage = createLocalStorage<StrugglePointsData>({
    storageKey: STORAGE_KEYS.STRUGGLE_POINTS,
    getDefault: () => ({
        points: [],
        lastUpdated: new Date().toISOString(),
    }),
});

export const strugglePointStorage = {
    /**
     * Get all struggle points
     */
    getAll: (): StrugglePoint[] => {
        return strugglePointsStorage.get().points;
    },

    /**
     * Get struggle points for a chapter
     */
    getForChapter: (chapterId: ChapterNodeId): StrugglePoint[] => {
        return strugglePointStorage
            .getAll()
            .filter((p) => p.chapterId === chapterId);
    },

    /**
     * Get severe struggle points
     */
    getSevere: (threshold: number = 0.6): StrugglePoint[] => {
        return strugglePointStorage
            .getAll()
            .filter((p) => p.severity >= threshold);
    },

    /**
     * Save or update a struggle point
     */
    save: (point: StrugglePoint): void => {
        strugglePointsStorage.update((data) => {
            const existingIndex = data.points.findIndex(
                (p) =>
                    p.chapterId === point.chapterId &&
                    p.sectionId === point.sectionId
            );

            let updatedPoints: StrugglePoint[];
            if (existingIndex >= 0) {
                updatedPoints = [...data.points];
                updatedPoints[existingIndex] = point;
            } else {
                updatedPoints = [...data.points, point];
            }

            return {
                points: updatedPoints,
                lastUpdated: new Date().toISOString(),
            };
        });
    },

    /**
     * Save all struggle points (bulk update)
     */
    saveAll: (points: StrugglePoint[]): void => {
        strugglePointsStorage.save({
            points,
            lastUpdated: new Date().toISOString(),
        });
    },
};

// ============================================================================
// Common Errors Storage
// ============================================================================

interface CommonErrorsData {
    errors: CommonError[];
    lastUpdated: string;
}

const commonErrorsStorage = createLocalStorage<CommonErrorsData>({
    storageKey: STORAGE_KEYS.COMMON_ERRORS,
    getDefault: () => ({
        errors: [],
        lastUpdated: new Date().toISOString(),
    }),
});

export const commonErrorStorage = {
    /**
     * Get all common errors
     */
    getAll: (): CommonError[] => {
        return commonErrorsStorage.get().errors;
    },

    /**
     * Get common errors for a chapter
     */
    getForChapter: (chapterId: ChapterNodeId): CommonError[] => {
        return commonErrorStorage
            .getAll()
            .filter((e) => e.chapterId === chapterId);
    },

    /**
     * Get most frequent errors
     */
    getMostFrequent: (limit: number = 10): CommonError[] => {
        return commonErrorStorage
            .getAll()
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, limit);
    },

    /**
     * Save or update a common error
     */
    save: (error: CommonError): void => {
        commonErrorsStorage.update((data) => {
            const existingIndex = data.errors.findIndex(
                (e) =>
                    e.errorType === error.errorType &&
                    e.chapterId === error.chapterId
            );

            let updatedErrors: CommonError[];
            if (existingIndex >= 0) {
                updatedErrors = [...data.errors];
                updatedErrors[existingIndex] = error;
            } else {
                updatedErrors = [...data.errors, error];
            }

            return {
                errors: updatedErrors,
                lastUpdated: new Date().toISOString(),
            };
        });
    },

    /**
     * Save all common errors (bulk update)
     */
    saveAll: (errors: CommonError[]): void => {
        commonErrorsStorage.save({
            errors,
            lastUpdated: new Date().toISOString(),
        });
    },
};

// ============================================================================
// Optimal Paths Storage
// ============================================================================

interface OptimalPathsData {
    paths: OptimalPath[];
    lastUpdated: string;
}

const optimalPathsStorage = createLocalStorage<OptimalPathsData>({
    storageKey: STORAGE_KEYS.OPTIMAL_PATHS,
    getDefault: () => ({
        paths: [],
        lastUpdated: new Date().toISOString(),
    }),
});

export const optimalPathStorage = {
    /**
     * Get all optimal paths
     */
    getAll: (): OptimalPath[] => {
        return optimalPathsStorage.get().paths;
    },

    /**
     * Get top paths by success rate
     */
    getTop: (limit: number = 5): OptimalPath[] => {
        return optimalPathStorage
            .getAll()
            .sort((a, b) => b.metrics.completionRate - a.metrics.completionRate)
            .slice(0, limit);
    },

    /**
     * Get paths suitable for a learner profile
     */
    getForProfile: (
        pace: string,
        confidence: string
    ): OptimalPath[] => {
        return optimalPathStorage
            .getAll()
            .filter(
                (p) =>
                    p.suitableFor.paces.includes(pace as never) ||
                    p.suitableFor.confidences.includes(confidence as never)
            );
    },

    /**
     * Get paths that include a specific chapter
     */
    getPathsWithChapter: (chapterId: ChapterNodeId): OptimalPath[] => {
        return optimalPathStorage
            .getAll()
            .filter((p) => p.chapterSequence.includes(chapterId));
    },

    /**
     * Save a new optimal path
     */
    save: (path: OptimalPath): void => {
        optimalPathsStorage.update((data) => {
            const existingIndex = data.paths.findIndex((p) => p.id === path.id);

            let updatedPaths: OptimalPath[];
            if (existingIndex >= 0) {
                updatedPaths = [...data.paths];
                updatedPaths[existingIndex] = path;
            } else {
                updatedPaths = [...data.paths, path];
            }

            return {
                paths: updatedPaths,
                lastUpdated: new Date().toISOString(),
            };
        });
    },

    /**
     * Save all optimal paths (bulk update)
     */
    saveAll: (paths: OptimalPath[]): void => {
        optimalPathsStorage.save({
            paths,
            lastUpdated: new Date().toISOString(),
        });
    },
};

// ============================================================================
// Emergent Curriculum Storage
// ============================================================================

const emergentCurriculumStorage = createLocalStorage<EmergentCurriculum | null>({
    storageKey: STORAGE_KEYS.EMERGENT_CURRICULUM,
    getDefault: () => null,
});

export const emergentCurriculumStore = {
    /**
     * Get the current emergent curriculum
     */
    get: (): EmergentCurriculum | null => {
        return emergentCurriculumStorage.get();
    },

    /**
     * Save the emergent curriculum
     */
    save: (curriculum: EmergentCurriculum): void => {
        emergentCurriculumStorage.save(curriculum);
    },

    /**
     * Check if curriculum needs recomputation
     */
    needsRecomputation: (maxAgeMs: number = 24 * 60 * 60 * 1000): boolean => {
        const curriculum = emergentCurriculumStorage.get();
        if (!curriculum) return true;

        const age = Date.now() - curriculum.generatedAt;
        return age > maxAgeMs;
    },

    /**
     * Get curriculum version
     */
    getVersion: (): string | null => {
        const curriculum = emergentCurriculumStorage.get();
        return curriculum?.version || null;
    },
};

// ============================================================================
// Aggregation Metadata Storage
// ============================================================================

interface AggregationMetadata {
    lastAggregation: string;
    journeysProcessed: number;
    processingTimeMs: number;
    errors: string[];
}

const aggregationMetadataStorage = createLocalStorage<AggregationMetadata>({
    storageKey: STORAGE_KEYS.AGGREGATION_METADATA,
    getDefault: () => ({
        lastAggregation: new Date().toISOString(),
        journeysProcessed: 0,
        processingTimeMs: 0,
        errors: [],
    }),
});

export const aggregationMetadataStore = {
    /**
     * Get aggregation metadata
     */
    get: (): AggregationMetadata => {
        return aggregationMetadataStorage.get();
    },

    /**
     * Record a successful aggregation
     */
    recordAggregation: (journeysProcessed: number, processingTimeMs: number): void => {
        aggregationMetadataStorage.save({
            lastAggregation: new Date().toISOString(),
            journeysProcessed,
            processingTimeMs,
            errors: [],
        });
    },

    /**
     * Record an aggregation error
     */
    recordError: (error: string): void => {
        aggregationMetadataStorage.update((data) => ({
            ...data,
            errors: [...data.errors.slice(-9), error], // Keep last 10 errors
        }));
    },
};

// ============================================================================
// Exports
// ============================================================================

export { generateId, STORAGE_KEYS };
