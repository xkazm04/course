// ============================================================================
// XP Calculator
// Exponential level system from 0-50
// Formula: XP_required(level) = 100 * (level ^ 1.8)
//
// Overflow Protection:
// - JavaScript safe integer range is -(2^53 - 1) to (2^53 - 1)
// - We cap values at MAX_SAFE_XP (slightly below MAX_SAFE_INTEGER)
// - All arithmetic operations use safe functions that detect overflow
// - For leaderboard aggregation, we track if capping occurred
// ============================================================================

/**
 * Maximum safe XP value - slightly below JS MAX_SAFE_INTEGER to allow room
 * for arithmetic operations without hitting the boundary
 */
export const MAX_SAFE_XP = Number.MAX_SAFE_INTEGER - 1_000_000; // ~9 quadrillion

/**
 * Threshold above which we start being extra cautious with arithmetic
 * This is about 10 trillion XP - way beyond any realistic individual value
 * but important for aggregated leaderboard totals
 */
export const XP_CAUTION_THRESHOLD = 10_000_000_000_000; // 10 trillion

// ============================================================================
// SAFE ARITHMETIC UTILITIES
// ============================================================================

/**
 * Result of a safe arithmetic operation
 */
export interface SafeXpResult {
    value: number;
    capped: boolean;  // true if the value was capped due to overflow risk
    original?: number; // original uncapped value if it was valid
}

/**
 * Check if a number is within safe integer range for XP calculations
 */
export function isXpSafe(value: number): boolean {
    return Number.isFinite(value) &&
           Number.isInteger(value) &&
           value >= 0 &&
           value <= MAX_SAFE_XP;
}

/**
 * Clamp an XP value to the safe range
 * Returns the capped value and whether capping occurred
 */
export function clampXp(value: number): SafeXpResult {
    // Handle invalid inputs
    if (!Number.isFinite(value) || Number.isNaN(value)) {
        return { value: 0, capped: true };
    }

    // Negative values are invalid for XP
    if (value < 0) {
        return { value: 0, capped: true };
    }

    // Cap at MAX_SAFE_XP
    if (value > MAX_SAFE_XP) {
        return { value: MAX_SAFE_XP, capped: true, original: value };
    }

    // Round to integer (XP should always be whole numbers)
    const rounded = Math.floor(value);
    return { value: rounded, capped: false };
}

/**
 * Safely add two XP values with overflow detection
 */
export function safeAddXp(a: number, b: number): SafeXpResult {
    // Validate inputs
    const clampedA = clampXp(a);
    const clampedB = clampXp(b);

    // If either input was already capped, propagate that
    if (clampedA.capped || clampedB.capped) {
        const sum = clampedA.value + clampedB.value;
        return clampXp(sum);
    }

    // Check if sum would overflow
    if (clampedA.value > MAX_SAFE_XP - clampedB.value) {
        return { value: MAX_SAFE_XP, capped: true, original: clampedA.value + clampedB.value };
    }

    const sum = clampedA.value + clampedB.value;
    return { value: sum, capped: false };
}

/**
 * Safely subtract XP values (result is always >= 0)
 */
export function safeSubtractXp(a: number, b: number): SafeXpResult {
    const clampedA = clampXp(a);
    const clampedB = clampXp(b);

    const diff = clampedA.value - clampedB.value;

    // XP can't go negative
    if (diff < 0) {
        return { value: 0, capped: true };
    }

    return { value: diff, capped: clampedA.capped || clampedB.capped };
}

/**
 * Safely multiply XP value by a multiplier
 */
export function safeMultiplyXp(xp: number, multiplier: number): SafeXpResult {
    const clampedXp = clampXp(xp);

    // Validate multiplier
    if (!Number.isFinite(multiplier) || multiplier < 0) {
        return { value: 0, capped: true };
    }

    // For large values, check for potential overflow before multiplying
    if (clampedXp.value > XP_CAUTION_THRESHOLD && multiplier > 1) {
        // Use conservative calculation
        const maxSafeMultiplier = MAX_SAFE_XP / clampedXp.value;
        if (multiplier > maxSafeMultiplier) {
            return { value: MAX_SAFE_XP, capped: true };
        }
    }

    const result = Math.floor(clampedXp.value * multiplier);

    if (result > MAX_SAFE_XP) {
        return { value: MAX_SAFE_XP, capped: true, original: result };
    }

    return { value: result, capped: clampedXp.capped };
}

/**
 * Aggregate multiple XP values safely (for leaderboards)
 * Returns total and tracks if any overflow/capping occurred
 */
export function safeAggregateXp(values: number[]): SafeXpResult {
    let total = 0;
    let anyCapped = false;

    for (const value of values) {
        const result = safeAddXp(total, value);
        total = result.value;
        if (result.capped) {
            anyCapped = true;
        }

        // Early exit if we've hit the cap
        if (total >= MAX_SAFE_XP) {
            return { value: MAX_SAFE_XP, capped: true };
        }
    }

    return { value: total, capped: anyCapped };
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface LevelInfo {
    level: number;
    currentXp: number;
    xpForCurrentLevel: number;
    xpToNextLevel: number;
    progressPercent: number;
    totalXpForNextLevel: number;
    /** True if XP value was capped due to overflow protection */
    xpCapped?: boolean;
}

export interface LevelThreshold {
    level: number;
    xpRequired: number;
    cumulativeXp: number;
}

// ============================================================================
// XP CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate XP required to complete a specific level
 * Uses safe arithmetic to prevent overflow on extreme levels
 */
export function xpRequiredForLevel(level: number): number {
    // Validate input
    if (!Number.isFinite(level) || level < 1) {
        return 100; // Default to level 1 requirement
    }

    const result = Math.ceil(100 * Math.pow(level, 1.8));

    // Clamp result to safe range
    return Math.min(result, MAX_SAFE_XP);
}

/**
 * Calculate total cumulative XP needed to reach a level
 * Uses safe addition to prevent overflow
 */
export function totalXpForLevel(targetLevel: number): number {
    // Validate input
    if (!Number.isFinite(targetLevel) || targetLevel < 1) {
        return 0;
    }

    let total = 0;
    for (let l = 1; l < targetLevel; l++) {
        const required = xpRequiredForLevel(l);
        const sum = safeAddXp(total, required);
        total = sum.value;

        // Early exit if we've hit the cap
        if (sum.capped) {
            return MAX_SAFE_XP;
        }
    }

    return Math.ceil(total);
}

/**
 * Calculate user's current level from total XP
 * Handles extremely large XP values gracefully
 */
export function calculateLevel(xp: number): number {
    // Validate and clamp input
    const safeXp = clampXp(xp).value;

    let level = 1;
    let cumulative = 0;

    while (cumulative <= safeXp && level <= 50) {
        const levelXp = xpRequiredForLevel(level);
        const sum = safeAddXp(cumulative, levelXp);
        cumulative = sum.value;

        if (cumulative <= safeXp) {
            level++;
        }

        // Safety check - if we've capped, user is max level
        if (sum.capped) {
            return 50;
        }
    }

    return Math.min(level, 50);
}

/**
 * Get complete level info for a user's XP
 * Returns xpCapped: true if any values were capped due to overflow protection
 */
export function getLevelInfo(xp: number): LevelInfo {
    // Clamp input XP
    const clampedXp = clampXp(xp);
    const safeXp = clampedXp.value;

    const level = calculateLevel(safeXp);
    const xpAtLevelStart = totalXpForLevel(level);
    const xpForCurrentLevel = xpRequiredForLevel(level);

    // Use safe subtraction for XP into current level
    const xpIntoCurrentLevel = safeSubtractXp(safeXp, xpAtLevelStart).value;
    const xpToNextLevel = safeSubtractXp(xpForCurrentLevel, xpIntoCurrentLevel).value;

    // Calculate progress percent safely
    const progressPercent = xpForCurrentLevel > 0
        ? Math.min(100, Math.round((xpIntoCurrentLevel / xpForCurrentLevel) * 100))
        : 100;

    // Calculate total XP for next level safely
    const totalXpForNextLevel = safeAddXp(xpAtLevelStart, xpForCurrentLevel).value;

    return {
        level,
        currentXp: safeXp,
        xpForCurrentLevel,
        xpToNextLevel: Math.max(0, xpToNextLevel),
        progressPercent,
        totalXpForNextLevel,
        xpCapped: clampedXp.capped,
    };
}

/**
 * Check if XP gain resulted in a level up
 * Handles overflow gracefully for extreme XP values
 */
export function checkLevelUp(
    previousXp: number,
    newXp: number
): { leveledUp: boolean; newLevel: number; previousLevel: number; xpCapped: boolean } {
    const safePreviousXp = clampXp(previousXp);
    const safeNewXp = clampXp(newXp);

    const previousLevel = calculateLevel(safePreviousXp.value);
    const newLevel = calculateLevel(safeNewXp.value);

    return {
        leveledUp: newLevel > previousLevel,
        newLevel,
        previousLevel,
        xpCapped: safePreviousXp.capped || safeNewXp.capped,
    };
}

/**
 * Calculate streak bonus percentage (5% per day, max 50%)
 */
export function calculateStreakBonus(streakDays: number): number {
    // Validate input
    if (!Number.isFinite(streakDays) || streakDays < 0) {
        return 0;
    }

    const bonusPercent = Math.min(streakDays * 5, 50);
    return bonusPercent / 100;
}

/**
 * Apply streak bonus to base XP
 * Uses safe multiplication to prevent overflow
 */
export function applyStreakBonus(
    baseXp: number,
    streakDays: number
): { totalXp: number; bonusXp: number; xpCapped: boolean } {
    const safeBaseXp = clampXp(baseXp);
    const bonusMultiplier = calculateStreakBonus(streakDays);

    // Calculate bonus XP safely
    const bonusResult = safeMultiplyXp(safeBaseXp.value, bonusMultiplier);

    // Add base + bonus safely
    const totalResult = safeAddXp(safeBaseXp.value, bonusResult.value);

    return {
        totalXp: totalResult.value,
        bonusXp: bonusResult.value,
        xpCapped: safeBaseXp.capped || bonusResult.capped || totalResult.capped,
    };
}

/**
 * Get all level thresholds (for UI display)
 * Uses safe arithmetic for cumulative totals
 */
export function getLevelThresholds(maxLevel: number = 50): LevelThreshold[] {
    // Validate input
    const safeMaxLevel = Math.min(Math.max(1, maxLevel), 100);

    const thresholds: LevelThreshold[] = [];
    let cumulative = 0;

    for (let level = 1; level <= safeMaxLevel; level++) {
        const required = xpRequiredForLevel(level);
        thresholds.push({
            level,
            xpRequired: required,
            cumulativeXp: cumulative,
        });

        // Use safe addition for cumulative
        const sum = safeAddXp(cumulative, required);
        cumulative = sum.value;
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
