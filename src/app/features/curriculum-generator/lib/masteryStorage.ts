"use client";

/**
 * Mastery Signal Storage Module
 *
 * Persists mastery signals and skill proficiencies for Career Oracle integration.
 * Provides functions to track, aggregate, and query mastery data.
 */

import { createLocalStorage, createArrayStorage, generateId } from "@/app/shared/lib/storageFactory";
import type {
    MasterySignal,
    SkillProficiency,
    PathRecalibration,
    DifficultyAdjustment,
    PacingAdjustment,
} from "./masterySignal";
import {
    aggregateSkillProficiency,
    generatePathRecalibration,
} from "./masterySignal";
import type { DifficultyLevel } from "./types";

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
    MASTERY_SIGNALS: "mastery_signals_v1",
    SKILL_PROFICIENCIES: "skill_proficiencies_v1",
    PATH_RECALIBRATIONS: "path_recalibrations_v1",
};

// ============================================================================
// MASTERY SIGNALS STORAGE
// ============================================================================

const masterySignalStorage = createArrayStorage<MasterySignal>({
    storageKey: STORAGE_KEYS.MASTERY_SIGNALS,
});

/**
 * Store a new mastery signal
 */
export function storeMasterySignal(signal: MasterySignal): MasterySignal {
    return masterySignalStorage.add(signal);
}

/**
 * Get all mastery signals for a user
 */
export function getUserMasterySignals(userId: string): MasterySignal[] {
    return masterySignalStorage.getAll().filter((s) => s.userId === userId);
}

/**
 * Get mastery signals for a specific skill
 */
export function getSkillMasterySignals(userId: string, skillId: string): MasterySignal[] {
    return masterySignalStorage
        .getAll()
        .filter((s) => s.userId === userId && s.skillId === skillId);
}

/**
 * Get recent mastery signals (last N days)
 */
export function getRecentMasterySignals(userId: string, days: number = 30): MasterySignal[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return masterySignalStorage
        .getAll()
        .filter(
            (s) =>
                s.userId === userId &&
                new Date(s.derivedAt) >= cutoffDate
        )
        .sort((a, b) => new Date(b.derivedAt).getTime() - new Date(a.derivedAt).getTime());
}

/**
 * Get mastery signals for a content item
 */
export function getContentMasterySignals(contentId: string): MasterySignal[] {
    return masterySignalStorage.getAll().filter((s) => s.contentId === contentId);
}

// ============================================================================
// SKILL PROFICIENCIES STORAGE
// ============================================================================

interface SkillProficienciesData {
    proficiencies: Record<string, SkillProficiency>; // keyed by `${userId}-${skillId}`
    lastUpdated: string;
}

const skillProficienciesStorage = createLocalStorage<SkillProficienciesData>({
    storageKey: STORAGE_KEYS.SKILL_PROFICIENCIES,
    getDefault: () => ({
        proficiencies: {},
        lastUpdated: new Date().toISOString(),
    }),
});

/**
 * Generate storage key for skill proficiency
 */
function proficiencyKey(userId: string, skillId: string): string {
    return `${userId}-${skillId}`;
}

/**
 * Update or create skill proficiency from mastery signals
 */
export function updateSkillProficiency(
    userId: string,
    skillId: string,
    skillName: string
): SkillProficiency {
    const signals = getSkillMasterySignals(userId, skillId);
    const proficiency = aggregateSkillProficiency(signals, skillId, skillName, userId);

    skillProficienciesStorage.update((data) => ({
        proficiencies: {
            ...data.proficiencies,
            [proficiencyKey(userId, skillId)]: proficiency,
        },
        lastUpdated: new Date().toISOString(),
    }));

    return proficiency;
}

/**
 * Get skill proficiency for a user
 */
export function getSkillProficiency(
    userId: string,
    skillId: string
): SkillProficiency | null {
    const data = skillProficienciesStorage.get();
    return data.proficiencies[proficiencyKey(userId, skillId)] || null;
}

/**
 * Get all skill proficiencies for a user
 */
export function getUserSkillProficiencies(userId: string): SkillProficiency[] {
    const data = skillProficienciesStorage.get();
    return Object.values(data.proficiencies).filter((p) => p.userId === userId);
}

/**
 * Recalculate all skill proficiencies for a user
 */
export function recalculateUserProficiencies(userId: string): SkillProficiency[] {
    const allSignals = getUserMasterySignals(userId);

    // Group signals by skill
    const signalsBySkill = new Map<string, MasterySignal[]>();
    for (const signal of allSignals) {
        const existing = signalsBySkill.get(signal.skillId) || [];
        existing.push(signal);
        signalsBySkill.set(signal.skillId, existing);
    }

    // Aggregate each skill
    const proficiencies: SkillProficiency[] = [];
    for (const [skillId, signals] of signalsBySkill) {
        const skillName = signals[0]?.skillName || skillId;
        const proficiency = aggregateSkillProficiency(signals, skillId, skillName, userId);
        proficiencies.push(proficiency);

        // Store in cache
        skillProficienciesStorage.update((data) => ({
            proficiencies: {
                ...data.proficiencies,
                [proficiencyKey(userId, skillId)]: proficiency,
            },
            lastUpdated: new Date().toISOString(),
        }));
    }

    return proficiencies;
}

// ============================================================================
// PATH RECALIBRATIONS STORAGE
// ============================================================================

interface PathRecalibrationsData {
    recalibrations: Record<string, PathRecalibration>; // keyed by `${userId}-${pathId}`
}

const pathRecalibrationsStorage = createLocalStorage<PathRecalibrationsData>({
    storageKey: STORAGE_KEYS.PATH_RECALIBRATIONS,
    getDefault: () => ({
        recalibrations: {},
    }),
});

/**
 * Generate storage key for path recalibration
 */
function recalibrationKey(userId: string, pathId: string): string {
    return `${userId}-${pathId}`;
}

/**
 * Generate and store path recalibration
 */
export function generateAndStoreRecalibration(
    userId: string,
    pathId: string,
    moduleDifficulties: Record<string, DifficultyLevel>,
    moduleEstimatedHours: Record<string, number>
): PathRecalibration {
    const proficiencies = getUserSkillProficiencies(userId);
    const recalibration = generatePathRecalibration(
        userId,
        pathId,
        proficiencies,
        moduleDifficulties,
        moduleEstimatedHours
    );

    pathRecalibrationsStorage.update((data) => ({
        recalibrations: {
            ...data.recalibrations,
            [recalibrationKey(userId, pathId)]: recalibration,
        },
    }));

    return recalibration;
}

/**
 * Get latest path recalibration
 */
export function getPathRecalibration(
    userId: string,
    pathId: string
): PathRecalibration | null {
    const data = pathRecalibrationsStorage.get();
    return data.recalibrations[recalibrationKey(userId, pathId)] || null;
}

/**
 * Get difficulty adjustments for a path
 */
export function getPathDifficultyAdjustments(
    userId: string,
    pathId: string
): DifficultyAdjustment[] {
    const recalibration = getPathRecalibration(userId, pathId);
    return recalibration?.difficultyAdjustments || [];
}

/**
 * Get pacing adjustments for a path
 */
export function getPathPacingAdjustments(
    userId: string,
    pathId: string
): PacingAdjustment[] {
    const recalibration = getPathRecalibration(userId, pathId);
    return recalibration?.pacingAdjustments || [];
}

// ============================================================================
// MASTERY ANALYTICS
// ============================================================================

export interface MasteryAnalytics {
    /** Total mastery signals generated */
    totalSignals: number;
    /** Skills being tracked */
    skillsTracked: number;
    /** Average proficiency across skills */
    averageProficiency: number;
    /** Skills improving */
    improvingSkills: number;
    /** Skills declining */
    decliningSkills: number;
    /** Mastery level distribution */
    masteryDistribution: Record<string, number>;
    /** Recent activity (signals in last 7 days) */
    recentActivity: number;
    /** Path fitness score if available */
    pathFitness?: number;
}

/**
 * Get mastery analytics for a user
 */
export function getMasteryAnalytics(userId: string): MasteryAnalytics {
    const signals = getUserMasterySignals(userId);
    const proficiencies = getUserSkillProficiencies(userId);

    // Recent activity
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentSignals = signals.filter((s) => new Date(s.derivedAt) >= weekAgo);

    // Mastery distribution
    const masteryDistribution: Record<string, number> = {
        struggling: 0,
        developing: 0,
        proficient: 0,
        advanced: 0,
        mastered: 0,
    };

    for (const p of proficiencies) {
        masteryDistribution[p.masteryLevel]++;
    }

    // Trend analysis
    const improvingSkills = proficiencies.filter((p) => p.trend === "improving").length;
    const decliningSkills = proficiencies.filter((p) => p.trend === "declining").length;

    // Average proficiency
    const averageProficiency =
        proficiencies.length > 0
            ? proficiencies.reduce((sum, p) => sum + p.proficiency, 0) / proficiencies.length
            : 0;

    return {
        totalSignals: signals.length,
        skillsTracked: proficiencies.length,
        averageProficiency,
        improvingSkills,
        decliningSkills,
        masteryDistribution,
        recentActivity: recentSignals.length,
    };
}

/**
 * Get skills that need attention (struggling or declining)
 */
export function getSkillsNeedingAttention(userId: string): SkillProficiency[] {
    const proficiencies = getUserSkillProficiencies(userId);

    return proficiencies.filter(
        (p) =>
            p.masteryLevel === "struggling" ||
            (p.masteryLevel === "developing" && p.trend === "declining")
    );
}

/**
 * Get high-performing skills
 */
export function getHighPerformingSkills(userId: string): SkillProficiency[] {
    const proficiencies = getUserSkillProficiencies(userId);

    return proficiencies.filter(
        (p) =>
            p.masteryLevel === "mastered" ||
            p.masteryLevel === "advanced"
    );
}

// ============================================================================
// DATA CLEANUP
// ============================================================================

/**
 * Clear old mastery signals (older than specified days)
 */
export function cleanupOldSignals(days: number = 90): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const allSignals = masterySignalStorage.getAll();
    const recentSignals = allSignals.filter(
        (s) => new Date(s.derivedAt) >= cutoffDate
    );

    const removedCount = allSignals.length - recentSignals.length;

    // Clear and re-add recent signals
    if (removedCount > 0) {
        masterySignalStorage.getAll().forEach((s) => {
            if (new Date(s.derivedAt) < cutoffDate) {
                masterySignalStorage.remove(s.id);
            }
        });
    }

    return removedCount;
}

/**
 * Clear all mastery data for a user
 */
export function clearUserMasteryData(userId: string): void {
    // Clear signals
    const signals = getUserMasterySignals(userId);
    for (const signal of signals) {
        masterySignalStorage.remove(signal.id);
    }

    // Clear proficiencies
    skillProficienciesStorage.update((data) => {
        const filteredProficiencies: Record<string, SkillProficiency> = {};
        for (const [key, proficiency] of Object.entries(data.proficiencies)) {
            if (proficiency.userId !== userId) {
                filteredProficiencies[key] = proficiency;
            }
        }
        return {
            proficiencies: filteredProficiencies,
            lastUpdated: new Date().toISOString(),
        };
    });

    // Clear recalibrations
    pathRecalibrationsStorage.update((data) => {
        const filteredRecalibrations: Record<string, PathRecalibration> = {};
        for (const [key, recalibration] of Object.entries(data.recalibrations)) {
            if (recalibration.userId !== userId) {
                filteredRecalibrations[key] = recalibration;
            }
        }
        return { recalibrations: filteredRecalibrations };
    });
}

// ============================================================================
// EXPORTS
// ============================================================================

export const masteryStorage = {
    // Signals
    storeMasterySignal,
    getUserMasterySignals,
    getSkillMasterySignals,
    getRecentMasterySignals,
    getContentMasterySignals,

    // Proficiencies
    updateSkillProficiency,
    getSkillProficiency,
    getUserSkillProficiencies,
    recalculateUserProficiencies,

    // Recalibrations
    generateAndStoreRecalibration,
    getPathRecalibration,
    getPathDifficultyAdjustments,
    getPathPacingAdjustments,

    // Analytics
    getMasteryAnalytics,
    getSkillsNeedingAttention,
    getHighPerformingSkills,

    // Cleanup
    cleanupOldSignals,
    clearUserMasteryData,
};
