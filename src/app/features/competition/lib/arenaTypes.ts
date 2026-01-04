// 3D Championship Arena Types

import { SkillTier, LeaderboardEntry, RankTrend } from "./types";

// Avatar configuration based on tier
export interface TierArmor {
    helmet: string | null;
    shoulderPads: boolean;
    cape: boolean;
    aura: string | null;
    particleEffect: "none" | "sparks" | "flames" | "lightning" | "cosmic";
    materialType: "basic" | "metallic" | "glowing" | "crystalline" | "ethereal";
}

export const TIER_ARMOR_CONFIGS: Record<SkillTier, TierArmor> = {
    bronze: {
        helmet: null,
        shoulderPads: false,
        cape: false,
        aura: null,
        particleEffect: "none",
        materialType: "basic",
    },
    silver: {
        helmet: "basic",
        shoulderPads: false,
        cape: false,
        aura: null,
        particleEffect: "sparks",
        materialType: "metallic",
    },
    gold: {
        helmet: "crowned",
        shoulderPads: true,
        cape: false,
        aura: "#FFD700",
        particleEffect: "sparks",
        materialType: "metallic",
    },
    platinum: {
        helmet: "visored",
        shoulderPads: true,
        cape: true,
        aura: "#E5E4E2",
        particleEffect: "sparks",
        materialType: "glowing",
    },
    diamond: {
        helmet: "crystalline",
        shoulderPads: true,
        cape: true,
        aura: "#B9F2FF",
        particleEffect: "lightning",
        materialType: "crystalline",
    },
    master: {
        helmet: "legendary",
        shoulderPads: true,
        cape: true,
        aura: "#FF4500",
        particleEffect: "cosmic",
        materialType: "ethereal",
    },
};

// Arena position for competitors
export interface ArenaPosition {
    x: number;
    y: number;
    z: number;
    rotation: number;
}

// Podium configuration
export interface PodiumConfig {
    rank: 1 | 2 | 3;
    height: number;
    color: string;
    glowColor: string;
    position: ArenaPosition;
}

export const PODIUM_CONFIGS: PodiumConfig[] = [
    {
        rank: 1,
        height: 3.5,
        color: "#FFD700",
        glowColor: "#FFA500",
        position: { x: 0, y: 0, z: 0, rotation: 0 },
    },
    {
        rank: 2,
        height: 2.5,
        color: "#C0C0C0",
        glowColor: "#E8E8E8",
        position: { x: -4, y: 0, z: 1, rotation: 15 },
    },
    {
        rank: 3,
        height: 1.8,
        color: "#CD7F32",
        glowColor: "#E8A556",
        position: { x: 4, y: 0, z: 1, rotation: -15 },
    },
];

// Animation states for rank changes
export interface RankChangeAnimation {
    type: "climb" | "descend" | "enter" | "exit" | "celebrate";
    fromPosition: ArenaPosition;
    toPosition: ArenaPosition;
    duration: number;
}

// Extended leaderboard entry for 3D arena
export interface ArenaCompetitor extends LeaderboardEntry {
    position: ArenaPosition;
    armor: TierArmor;
    animation: RankChangeAnimation | null;
    isAnimating: boolean;
}

// Arena view modes
export type ArenaViewMode = "podium" | "stadium" | "orbital";

// VR mode configuration
export interface VRConfig {
    enabled: boolean;
    handTracking: boolean;
    teleportEnabled: boolean;
    interactionDistance: number;
}

// Arena state
export interface ArenaState {
    competitors: ArenaCompetitor[];
    viewMode: ArenaViewMode;
    vrConfig: VRConfig;
    selectedCompetitor: string | null;
    cameraPosition: ArenaPosition;
    isLoading: boolean;
}

// Calculate arena position based on rank
export function getArenaPositionForRank(rank: number, totalCompetitors: number): ArenaPosition {
    // Top 3 on podiums
    if (rank <= 3) {
        const podium = PODIUM_CONFIGS.find((p) => p.rank === rank);
        return podium?.position ?? { x: 0, y: 0, z: 0, rotation: 0 };
    }

    // Ranks 4-10: Front row of stadium
    if (rank <= 10) {
        const angle = ((rank - 4) / 6) * Math.PI - Math.PI / 2;
        const radius = 12;
        return {
            x: Math.cos(angle) * radius,
            y: 0,
            z: Math.sin(angle) * radius + 8,
            rotation: -angle * (180 / Math.PI),
        };
    }

    // Ranks 11-25: Second row
    if (rank <= 25) {
        const angle = ((rank - 11) / 14) * Math.PI - Math.PI / 2;
        const radius = 18;
        return {
            x: Math.cos(angle) * radius,
            y: 2,
            z: Math.sin(angle) * radius + 10,
            rotation: -angle * (180 / Math.PI),
        };
    }

    // Ranks 26+: Upper tiers
    const tier = Math.floor((rank - 26) / 20);
    const posInTier = (rank - 26) % 20;
    const angle = (posInTier / 19) * Math.PI - Math.PI / 2;
    const radius = 24 + tier * 6;

    return {
        x: Math.cos(angle) * radius,
        y: 4 + tier * 2,
        z: Math.sin(angle) * radius + 12,
        rotation: -angle * (180 / Math.PI),
    };
}

// Get animation for rank change
export function getRankChangeAnimation(
    entry: LeaderboardEntry,
    previousRank: number | undefined
): RankChangeAnimation | null {
    if (entry.trend === "new") {
        return {
            type: "enter",
            fromPosition: { x: 0, y: 20, z: -30, rotation: 0 },
            toPosition: getArenaPositionForRank(entry.rank, 100),
            duration: 2000,
        };
    }

    if (previousRank === undefined || previousRank === entry.rank) {
        return null;
    }

    const fromPos = getArenaPositionForRank(previousRank, 100);
    const toPos = getArenaPositionForRank(entry.rank, 100);

    if (entry.rank < previousRank) {
        // Climbing up
        return {
            type: entry.rank <= 3 ? "celebrate" : "climb",
            fromPosition: fromPos,
            toPosition: toPos,
            duration: 1500,
        };
    } else {
        // Descending
        return {
            type: "descend",
            fromPosition: fromPos,
            toPosition: toPos,
            duration: 1000,
        };
    }
}
