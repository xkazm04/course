"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    Flame,
    BookOpen,
    Map,
    Hammer,
    Zap,
    Trophy,
    X,
    Sparkles,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";

interface Achievement {
    id: string;
    slug: string;
    title: string;
    description: string;
    xpReward: number;
    rarity: string;
    icon: string;
    color: string;
}

interface AchievementModalProps {
    isVisible: boolean;
    achievement: Achievement | null;
    onClose: () => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    Flame,
    BookOpen,
    Map,
    Hammer,
    Zap,
    Trophy,
};

const RARITY_CONFIG = {
    common: {
        gradient: "from-gray-400 to-gray-500",
        glow: "shadow-gray-400/30",
        text: "text-gray-400",
        label: "Common",
    },
    uncommon: {
        gradient: "from-green-400 to-emerald-500",
        glow: "shadow-green-500/40",
        text: "text-green-400",
        label: "Uncommon",
    },
    rare: {
        gradient: "from-blue-400 to-cyan-500",
        glow: "shadow-blue-500/40",
        text: "text-blue-400",
        label: "Rare",
    },
    epic: {
        gradient: "from-purple-400 to-pink-500",
        glow: "shadow-purple-500/50",
        text: "text-purple-400",
        label: "Epic",
    },
    legendary: {
        gradient: "from-[var(--gold)] to-orange-500",
        glow: "shadow-[var(--gold)]/60",
        text: "text-[var(--gold)]",
        label: "Legendary",
    },
};

export function AchievementModal({ isVisible, achievement, onClose }: AchievementModalProps) {
    if (!achievement) return null;

    const IconComponent = ICON_MAP[achievement.icon] || Trophy;
    const rarityConfig = RARITY_CONFIG[achievement.rarity as keyof typeof RARITY_CONFIG] || RARITY_CONFIG.common;
    const isLegendary = achievement.rarity === "legendary";

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ type: "spring", bounce: 0.3 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="relative w-full max-w-sm">
                            {/* Particles for legendary */}
                            {isLegendary && (
                                <div className="absolute inset-0 pointer-events-none">
                                    {[...Array(12)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{
                                                opacity: 0,
                                                scale: 0,
                                                x: "50%",
                                                y: "50%",
                                            }}
                                            animate={{
                                                opacity: [0, 1, 0],
                                                scale: [0, 1, 0],
                                                x: `${50 + Math.cos(i * 30 * Math.PI / 180) * 120}%`,
                                                y: `${50 + Math.sin(i * 30 * Math.PI / 180) * 120}%`,
                                            }}
                                            transition={{
                                                duration: 1.5,
                                                delay: i * 0.05,
                                                repeat: Infinity,
                                                repeatDelay: 1,
                                            }}
                                            className="absolute w-2 h-2 rounded-full bg-[var(--gold)]"
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Card */}
                            <div className={cn(
                                "relative overflow-hidden rounded-3xl border-2 shadow-2xl",
                                isLegendary
                                    ? "border-[var(--gold)]/50 bg-gradient-to-b from-[var(--forge-bg-daylight)] via-[var(--forge-bg-daylight)] to-[var(--gold)]/10"
                                    : "border-[var(--forge-border-subtle)] bg-[var(--forge-bg-daylight)]",
                                rarityConfig.glow,
                                "shadow-xl"
                            )}>
                                {/* Close button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-[var(--forge-bg-elevated)] hover:bg-[var(--forge-bg-bench)] transition-colors"
                                >
                                    <X size={16} className="text-[var(--forge-text-muted)]" />
                                </button>

                                {/* Animated glow background for legendary */}
                                {isLegendary && (
                                    <motion.div
                                        animate={{
                                            opacity: [0.3, 0.6, 0.3],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                        className="absolute inset-0 bg-gradient-to-b from-[var(--gold)]/20 to-transparent"
                                    />
                                )}

                                <div className="relative p-8 text-center">
                                    {/* Achievement Unlocked text */}
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="flex items-center justify-center gap-2 mb-6"
                                    >
                                        <Sparkles className={cn("w-5 h-5", rarityConfig.text)} />
                                        <span className={cn("text-sm font-semibold uppercase tracking-wider", rarityConfig.text)}>
                                            Achievement Unlocked
                                        </span>
                                        <Sparkles className={cn("w-5 h-5", rarityConfig.text)} />
                                    </motion.div>

                                    {/* Icon */}
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{
                                            type: "spring",
                                            bounce: 0.4,
                                            delay: 0.1,
                                        }}
                                        className="relative mx-auto mb-6"
                                    >
                                        <div className={cn(
                                            "w-24 h-24 rounded-2xl flex items-center justify-center mx-auto",
                                            `bg-gradient-to-br ${rarityConfig.gradient}`,
                                            "shadow-lg",
                                            rarityConfig.glow
                                        )}>
                                            <IconComponent className="w-12 h-12 text-white" />
                                        </div>

                                        {/* Pulse ring */}
                                        <motion.div
                                            initial={{ scale: 1, opacity: 0.5 }}
                                            animate={{ scale: 1.5, opacity: 0 }}
                                            transition={{
                                                duration: 1,
                                                repeat: Infinity,
                                            }}
                                            className={cn(
                                                "absolute inset-0 rounded-2xl",
                                                `bg-gradient-to-br ${rarityConfig.gradient}`
                                            )}
                                        />
                                    </motion.div>

                                    {/* Title */}
                                    <motion.h2
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-2xl font-bold text-[var(--forge-text-primary)] mb-2"
                                    >
                                        {achievement.title}
                                    </motion.h2>

                                    {/* Rarity badge */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.35 }}
                                        className={cn(
                                            "inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-4",
                                            `bg-gradient-to-r ${rarityConfig.gradient}`,
                                            "text-white"
                                        )}
                                    >
                                        {rarityConfig.label}
                                    </motion.div>

                                    {/* Description */}
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                        className="text-[var(--forge-text-secondary)] mb-6"
                                    >
                                        {achievement.description}
                                    </motion.p>

                                    {/* XP Reward */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                        className={cn(
                                            "inline-flex items-center gap-2 px-4 py-2 rounded-xl",
                                            "bg-[var(--ember)]/10 border border-[var(--ember)]/20"
                                        )}
                                    >
                                        <Zap className="w-5 h-5 text-[var(--ember)]" />
                                        <span className="text-lg font-bold text-[var(--ember)]">
                                            +{achievement.xpReward} XP
                                        </span>
                                    </motion.div>
                                </div>

                                {/* Footer */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="px-8 pb-8"
                                >
                                    <button
                                        onClick={onClose}
                                        className={cn(
                                            "w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90",
                                            `bg-gradient-to-r ${rarityConfig.gradient}`
                                        )}
                                    >
                                        Awesome!
                                    </button>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
