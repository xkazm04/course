// Tier System Configuration and Utilities

import { SkillTier, ChallengeDifficulty, Submission, Challenge } from "./types";

export interface TierConfig {
    tier: SkillTier;
    minPoints: number;
    maxPoints: number;
    color: string;
    bgColor: string;
    icon: "Shield" | "Crown" | "Diamond" | "Flame";
    perks: string[];
}

export const TIER_CONFIGS: TierConfig[] = [
    {
        tier: "bronze",
        minPoints: 0,
        maxPoints: 999,
        color: "#CD7F32",
        bgColor: "rgba(205, 127, 50, 0.15)",
        icon: "Shield",
        perks: ["Access to beginner challenges"],
    },
    {
        tier: "silver",
        minPoints: 1000,
        maxPoints: 2499,
        color: "#C0C0C0",
        bgColor: "rgba(192, 192, 192, 0.15)",
        icon: "Shield",
        perks: ["Access to intermediate challenges", "Peer review eligibility"],
    },
    {
        tier: "gold",
        minPoints: 2500,
        maxPoints: 4999,
        color: "#FFD700",
        bgColor: "rgba(255, 215, 0, 0.15)",
        icon: "Shield",
        perks: ["Access to advanced challenges", "Create team competitions"],
    },
    {
        tier: "platinum",
        minPoints: 5000,
        maxPoints: 9999,
        color: "#E5E4E2",
        bgColor: "rgba(229, 228, 226, 0.15)",
        icon: "Crown",
        perks: ["Access to expert challenges", "Featured submissions"],
    },
    {
        tier: "diamond",
        minPoints: 10000,
        maxPoints: 24999,
        color: "#B9F2FF",
        bgColor: "rgba(185, 242, 255, 0.15)",
        icon: "Diamond",
        perks: ["Challenge creation beta", "Mentor badge"],
    },
    {
        tier: "master",
        minPoints: 25000,
        maxPoints: Infinity,
        color: "#FF4500",
        bgColor: "rgba(255, 69, 0, 0.15)",
        icon: "Flame",
        perks: ["Challenge creation access", "Featured profile"],
    },
];

// Get tier config by tier name
export function getTierConfig(tier: SkillTier): TierConfig {
    return TIER_CONFIGS.find((t) => t.tier === tier) || TIER_CONFIGS[0];
}

// Get tier from points
export function getTierFromPoints(points: number): SkillTier {
    for (let i = TIER_CONFIGS.length - 1; i >= 0; i--) {
        if (points >= TIER_CONFIGS[i].minPoints) {
            return TIER_CONFIGS[i].tier;
        }
    }
    return "bronze";
}

// Get points needed for next tier
export function getPointsToNextTier(currentPoints: number): number {
    const currentTier = getTierFromPoints(currentPoints);
    const currentConfig = getTierConfig(currentTier);

    if (currentTier === "master") return 0;

    return currentConfig.maxPoints - currentPoints + 1;
}

// Base points per difficulty
const BASE_POINTS: Record<ChallengeDifficulty, number> = {
    beginner: 50,
    intermediate: 100,
    advanced: 200,
    expert: 400,
};

// Rank multipliers (1st place gets 2x, 2nd 1.75x, etc.)
function getRankMultiplier(rank: number | undefined): number {
    if (!rank) return 0.5;
    if (rank === 1) return 2.0;
    if (rank === 2) return 1.75;
    if (rank === 3) return 1.5;
    if (rank <= 10) return 1.25;
    if (rank <= 25) return 1.1;
    if (rank <= 50) return 1.0;
    return 0.8;
}

// Calculate points from challenge completion
export function calculatePointsFromChallenge(
    submission: Submission,
    challenge: Challenge
): number {
    const basePoints = BASE_POINTS[challenge.difficulty];
    const rankMultiplier = getRankMultiplier(submission.rank);
    const completionBonus = submission.scores.overall > 80 ? 1.2 : 1;

    return Math.floor(basePoints * rankMultiplier * completionBonus);
}

// Difficulty colors for UI
export const DIFFICULTY_CONFIG: Record<
    ChallengeDifficulty,
    { label: string; color: string; bgColor: string }
> = {
    beginner: {
        label: "Beginner",
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/20",
    },
    intermediate: {
        label: "Intermediate",
        color: "text-blue-400",
        bgColor: "bg-blue-500/20",
    },
    advanced: {
        label: "Advanced",
        color: "text-purple-400",
        bgColor: "bg-purple-500/20",
    },
    expert: {
        label: "Expert",
        color: "text-red-400",
        bgColor: "bg-red-500/20",
    },
};

// Check if user can access challenge based on tier
export function canAccessChallenge(
    userTier: SkillTier,
    challengeDifficulty: ChallengeDifficulty,
    tierRestriction?: SkillTier
): boolean {
    const tierOrder: SkillTier[] = [
        "bronze",
        "silver",
        "gold",
        "platinum",
        "diamond",
        "master",
    ];

    // Check tier restriction if present
    if (tierRestriction) {
        const userTierIndex = tierOrder.indexOf(userTier);
        const restrictionIndex = tierOrder.indexOf(tierRestriction);
        if (userTierIndex < restrictionIndex) return false;
    }

    // Check difficulty access
    const difficultyTierMap: Record<ChallengeDifficulty, SkillTier> = {
        beginner: "bronze",
        intermediate: "silver",
        advanced: "gold",
        expert: "platinum",
    };

    const requiredTier = difficultyTierMap[challengeDifficulty];
    const userTierIndex = tierOrder.indexOf(userTier);
    const requiredTierIndex = tierOrder.indexOf(requiredTier);

    return userTierIndex >= requiredTierIndex;
}

// Get tier progress percentage
export function getTierProgress(currentPoints: number): number {
    const tier = getTierFromPoints(currentPoints);
    const config = getTierConfig(tier);

    if (tier === "master") return 100;

    const tierRange = config.maxPoints - config.minPoints;
    const pointsInTier = currentPoints - config.minPoints;

    return Math.min(100, Math.round((pointsInTier / tierRange) * 100));
}
