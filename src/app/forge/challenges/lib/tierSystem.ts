/**
 * Tier System for Challenges
 *
 * Ported from competition module with simplified structure.
 * Provides tier badges, colors, and point calculations.
 */

export type SkillTier = "bronze" | "silver" | "gold" | "platinum" | "diamond" | "master";

export interface TierConfig {
    tier: SkillTier;
    label: string;
    minPoints: number;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: "Shield" | "Crown" | "Diamond" | "Flame";
}

export const TIER_CONFIGS: TierConfig[] = [
    {
        tier: "bronze",
        label: "Bronze",
        minPoints: 0,
        color: "text-amber-600",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/30",
        icon: "Shield",
    },
    {
        tier: "silver",
        label: "Silver",
        minPoints: 1000,
        color: "text-slate-400",
        bgColor: "bg-slate-400/10",
        borderColor: "border-slate-400/30",
        icon: "Shield",
    },
    {
        tier: "gold",
        label: "Gold",
        minPoints: 2500,
        color: "text-yellow-400",
        bgColor: "bg-yellow-400/10",
        borderColor: "border-yellow-400/30",
        icon: "Shield",
    },
    {
        tier: "platinum",
        label: "Platinum",
        minPoints: 5000,
        color: "text-cyan-300",
        bgColor: "bg-cyan-300/10",
        borderColor: "border-cyan-300/30",
        icon: "Crown",
    },
    {
        tier: "diamond",
        label: "Diamond",
        minPoints: 10000,
        color: "text-blue-300",
        bgColor: "bg-blue-300/10",
        borderColor: "border-blue-300/30",
        icon: "Diamond",
    },
    {
        tier: "master",
        label: "Master",
        minPoints: 25000,
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/30",
        icon: "Flame",
    },
];

export function getTierConfig(tier: SkillTier): TierConfig {
    return TIER_CONFIGS.find((t) => t.tier === tier) || TIER_CONFIGS[0];
}

export function getTierFromPoints(points: number): SkillTier {
    for (let i = TIER_CONFIGS.length - 1; i >= 0; i--) {
        if (points >= TIER_CONFIGS[i].minPoints) {
            return TIER_CONFIGS[i].tier;
        }
    }
    return "bronze";
}

export type RankTrend = "up" | "down" | "stable" | "new";

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    displayName: string;
    avatarUrl?: string;
    tier: SkillTier;
    score: number;
    completionTime?: number;
    trend: RankTrend;
    previousRank?: number;
}

// Mock leaderboard data for demonstration
export function getMockLeaderboard(challengeId: string): LeaderboardEntry[] {
    return [
        {
            rank: 1,
            userId: "user-1",
            displayName: "AlexCoder",
            tier: "platinum",
            score: 98,
            completionTime: 23,
            trend: "stable",
        },
        {
            rank: 2,
            userId: "user-2",
            displayName: "DevMaster",
            tier: "gold",
            score: 95,
            completionTime: 28,
            trend: "up",
            previousRank: 4,
        },
        {
            rank: 3,
            userId: "user-3",
            displayName: "CodeNinja",
            tier: "gold",
            score: 92,
            completionTime: 31,
            trend: "down",
            previousRank: 2,
        },
        {
            rank: 4,
            userId: "user-4",
            displayName: "RustFan",
            tier: "silver",
            score: 88,
            completionTime: 35,
            trend: "new",
        },
        {
            rank: 5,
            userId: "user-5",
            displayName: "ReactWiz",
            tier: "silver",
            score: 85,
            completionTime: 40,
            trend: "stable",
        },
    ];
}
