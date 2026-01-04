// ============================================================================
// XP Calculator
// Exponential level system from 0-50
// Formula: XP_required(level) = 100 * (level ^ 1.8)
// ============================================================================

export interface LevelInfo {
    level: number;
    currentXp: number;
    xpForCurrentLevel: number;
    xpToNextLevel: number;
    progressPercent: number;
    totalXpForNextLevel: number;
}

export interface LevelThreshold {
    level: number;
    xpRequired: number;
    cumulativeXp: number;
}

/**
 * Calculate XP required to complete a specific level
 */
export function xpRequiredForLevel(level: number): number {
    return Math.ceil(100 * Math.pow(level, 1.8));
}

/**
 * Calculate total cumulative XP needed to reach a level
 */
export function totalXpForLevel(targetLevel: number): number {
    let total = 0;
    for (let l = 1; l < targetLevel; l++) {
        total += xpRequiredForLevel(l);
    }
    return Math.ceil(total);
}

/**
 * Calculate user's current level from total XP
 */
export function calculateLevel(xp: number): number {
    let level = 1;
    let cumulative = 0;

    while (cumulative <= xp && level <= 50) {
        cumulative += xpRequiredForLevel(level);
        if (cumulative <= xp) {
            level++;
        }
    }

    return Math.min(level, 50);
}

/**
 * Get complete level info for a user's XP
 */
export function getLevelInfo(xp: number): LevelInfo {
    const level = calculateLevel(xp);
    const xpAtLevelStart = totalXpForLevel(level);
    const xpForCurrentLevel = xpRequiredForLevel(level);
    const xpIntoCurrentLevel = xp - xpAtLevelStart;
    const xpToNextLevel = xpForCurrentLevel - xpIntoCurrentLevel;
    const progressPercent = Math.min(100, Math.round((xpIntoCurrentLevel / xpForCurrentLevel) * 100));

    return {
        level,
        currentXp: xp,
        xpForCurrentLevel,
        xpToNextLevel: Math.max(0, xpToNextLevel),
        progressPercent,
        totalXpForNextLevel: xpAtLevelStart + xpForCurrentLevel,
    };
}

/**
 * Check if XP gain resulted in a level up
 */
export function checkLevelUp(previousXp: number, newXp: number): { leveledUp: boolean; newLevel: number; previousLevel: number } {
    const previousLevel = calculateLevel(previousXp);
    const newLevel = calculateLevel(newXp);

    return {
        leveledUp: newLevel > previousLevel,
        newLevel,
        previousLevel,
    };
}

/**
 * Calculate streak bonus percentage (5% per day, max 50%)
 */
export function calculateStreakBonus(streakDays: number): number {
    const bonusPercent = Math.min(streakDays * 5, 50);
    return bonusPercent / 100;
}

/**
 * Apply streak bonus to base XP
 */
export function applyStreakBonus(baseXp: number, streakDays: number): { totalXp: number; bonusXp: number } {
    const bonusMultiplier = calculateStreakBonus(streakDays);
    const bonusXp = Math.floor(baseXp * bonusMultiplier);
    return {
        totalXp: baseXp + bonusXp,
        bonusXp,
    };
}

/**
 * Get all level thresholds (for UI display)
 */
export function getLevelThresholds(maxLevel: number = 50): LevelThreshold[] {
    const thresholds: LevelThreshold[] = [];
    let cumulative = 0;

    for (let level = 1; level <= maxLevel; level++) {
        const required = xpRequiredForLevel(level);
        thresholds.push({
            level,
            xpRequired: required,
            cumulativeXp: cumulative,
        });
        cumulative += required;
    }

    return thresholds;
}

/**
 * Key level milestones for UI
 */
export const LEVEL_MILESTONES = [5, 10, 15, 20, 25, 30, 40, 50];

/**
 * Get XP info for key milestones
 */
export function getMilestoneInfo(): Array<{ level: number; totalXp: number; effort: string }> {
    return [
        { level: 1, totalXp: 0, effort: "Start" },
        { level: 5, totalXp: totalXpForLevel(5), effort: "1 week" },
        { level: 10, totalXp: totalXpForLevel(10), effort: "1 month" },
        { level: 20, totalXp: totalXpForLevel(20), effort: "4 months" },
        { level: 30, totalXp: totalXpForLevel(30), effort: "9 months" },
        { level: 50, totalXp: totalXpForLevel(50), effort: "3+ years" },
    ];
}
