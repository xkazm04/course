"use client";

import { motion } from "framer-motion";
import {
    Flame,
    BookOpen,
    Map,
    Hammer,
    Zap,
    Trophy,
    Lock,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";

interface AchievementCardProps {
    id: string;
    slug: string;
    title: string;
    description: string;
    type: string;
    xpReward: number;
    rarity: string;
    icon: string;
    color: string;
    progress: number;
    isUnlocked: boolean;
    unlockedAt: string | null;
}

const RARITY_STYLES = {
    common: {
        border: "border-gray-400/30",
        bg: "from-gray-100/5 to-gray-200/5",
        glow: "",
        badge: "bg-gray-500/20 text-gray-400",
    },
    uncommon: {
        border: "border-green-500/30",
        bg: "from-green-500/5 to-emerald-500/5",
        glow: "shadow-green-500/10",
        badge: "bg-green-500/20 text-green-400",
    },
    rare: {
        border: "border-blue-500/30",
        bg: "from-blue-500/5 to-cyan-500/5",
        glow: "shadow-blue-500/20",
        badge: "bg-blue-500/20 text-blue-400",
    },
    epic: {
        border: "border-purple-500/40",
        bg: "from-purple-500/10 to-pink-500/5",
        glow: "shadow-purple-500/30 shadow-lg",
        badge: "bg-purple-500/20 text-purple-400",
    },
    legendary: {
        border: "border-[var(--gold)]/50",
        bg: "from-[var(--gold)]/10 to-orange-500/5",
        glow: "shadow-[var(--gold)]/40 shadow-xl",
        badge: "bg-[var(--gold)]/20 text-[var(--gold)]",
    },
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    Flame,
    BookOpen,
    Map,
    Hammer,
    Zap,
    Trophy,
};

export function AchievementCard({
    title,
    description,
    xpReward,
    rarity,
    icon,
    color,
    progress,
    isUnlocked,
}: AchievementCardProps) {
    const styles = RARITY_STYLES[rarity as keyof typeof RARITY_STYLES] || RARITY_STYLES.common;
    const IconComponent = ICON_MAP[icon] || Trophy;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: isUnlocked ? 1.02 : 1 }}
            className={cn(
                "relative rounded-xl border overflow-hidden transition-all duration-300",
                styles.border,
                isUnlocked ? styles.glow : "opacity-60",
                isUnlocked
                    ? `bg-gradient-to-br ${styles.bg}`
                    : "bg-[var(--forge-bg-elevated)]/50"
            )}
        >
            {/* Legendary animated border */}
            {rarity === "legendary" && isUnlocked && (
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--gold)]/0 via-[var(--gold)]/20 to-[var(--gold)]/0 animate-pulse" />
            )}

            <div className="relative p-4">
                {/* Header with icon */}
                <div className="flex items-start gap-3 mb-3">
                    <div
                        className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            isUnlocked
                                ? "bg-gradient-to-br shadow-lg"
                                : "bg-[var(--forge-bg-elevated)]"
                        )}
                        style={{
                            background: isUnlocked
                                ? `linear-gradient(135deg, ${color}30, ${color}10)`
                                : undefined,
                            boxShadow: isUnlocked
                                ? `0 4px 20px ${color}30`
                                : undefined,
                        }}
                    >
                        {isUnlocked ? (
                            <span style={{ color }}>
                                <IconComponent className="w-6 h-6" />
                            </span>
                        ) : (
                            <Lock className="w-5 h-5 text-[var(--forge-text-muted)]" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className={cn(
                            "font-semibold truncate",
                            isUnlocked
                                ? "text-[var(--forge-text-primary)]"
                                : "text-[var(--forge-text-muted)]"
                        )}>
                            {title}
                        </h4>
                        <span className={cn(
                            "inline-block px-2 py-0.5 rounded-full text-[10px] font-medium capitalize",
                            styles.badge
                        )}>
                            {rarity}
                        </span>
                    </div>
                </div>

                {/* Description */}
                <p className={cn(
                    "text-xs mb-3 line-clamp-2",
                    isUnlocked
                        ? "text-[var(--forge-text-secondary)]"
                        : "text-[var(--forge-text-muted)]"
                )}>
                    {description}
                </p>

                {/* Progress bar (for locked achievements) */}
                {!isUnlocked && progress > 0 && (
                    <div className="mb-3">
                        <div className="flex justify-between text-[10px] text-[var(--forge-text-muted)] mb-1">
                            <span>Progress</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--forge-bg-bench)]">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: color }}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </div>
                )}

                {/* XP Reward */}
                <div className="flex items-center justify-between">
                    <span className={cn(
                        "flex items-center gap-1 text-sm font-medium",
                        isUnlocked ? "text-[var(--ember)]" : "text-[var(--forge-text-muted)]"
                    )}>
                        <Zap className="w-3.5 h-3.5" />
                        +{xpReward} XP
                    </span>

                    {isUnlocked && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-1 text-[var(--forge-success)] text-xs"
                        >
                            <Trophy className="w-3 h-3" />
                            Unlocked
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
