"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap, TrendingUp, Flame } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";

interface XPToastProps {
    isVisible: boolean;
    xpAwarded: number;
    bonusXp?: number;
    leveledUp?: boolean;
    newLevel?: number;
    streakBonus?: boolean;
    onComplete?: () => void;
}

export function XPToast({
    isVisible,
    xpAwarded,
    bonusXp = 0,
    leveledUp = false,
    newLevel,
    streakBonus = false,
    onComplete,
}: XPToastProps) {
    const totalXp = xpAwarded + bonusXp;

    return (
        <AnimatePresence onExitComplete={onComplete}>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                    className="fixed bottom-6 right-6 z-50"
                >
                    <div className={cn(
                        "relative overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl",
                        leveledUp
                            ? "border-[var(--gold)]/40 bg-gradient-to-br from-[var(--gold)]/20 via-[var(--forge-bg-daylight)]/95 to-orange-500/10 shadow-[var(--gold)]/30"
                            : "border-[var(--ember)]/30 bg-[var(--forge-bg-daylight)]/95 shadow-[var(--ember)]/20"
                    )}>
                        {/* Animated shine effect */}
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: "200%" }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                        />

                        <div className="relative p-4">
                            <div className="flex items-center gap-4">
                                {/* XP Icon with pulse */}
                                <motion.div
                                    animate={{
                                        scale: [1, 1.1, 1],
                                    }}
                                    transition={{
                                        duration: 0.5,
                                        repeat: 2,
                                    }}
                                    className={cn(
                                        "w-14 h-14 rounded-xl flex items-center justify-center",
                                        leveledUp
                                            ? "bg-gradient-to-br from-[var(--gold)] to-orange-500 shadow-lg shadow-[var(--gold)]/40"
                                            : "bg-gradient-to-br from-[var(--ember)] to-[var(--ember-glow)] shadow-lg shadow-[var(--ember)]/40"
                                    )}
                                >
                                    {leveledUp ? (
                                        <TrendingUp className="w-7 h-7 text-white" />
                                    ) : (
                                        <Zap className="w-7 h-7 text-white" />
                                    )}
                                </motion.div>

                                <div>
                                    {/* Main XP amount */}
                                    <motion.div
                                        initial={{ scale: 0.5 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", bounce: 0.5 }}
                                        className="flex items-baseline gap-1"
                                    >
                                        <span className={cn(
                                            "text-3xl font-bold",
                                            leveledUp
                                                ? "bg-gradient-to-r from-[var(--gold)] to-orange-400 bg-clip-text text-transparent"
                                                : "bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] bg-clip-text text-transparent"
                                        )}>
                                            +{totalXp}
                                        </span>
                                        <span className="text-lg font-semibold text-[var(--forge-text-secondary)]">XP</span>
                                    </motion.div>

                                    {/* Level up message */}
                                    {leveledUp && newLevel && (
                                        <motion.p
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="text-sm font-medium text-[var(--gold)]"
                                        >
                                            Level Up! Now Level {newLevel}
                                        </motion.p>
                                    )}

                                    {/* Streak bonus indicator */}
                                    {streakBonus && bonusXp > 0 && !leveledUp && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="flex items-center gap-1 text-sm text-orange-500"
                                        >
                                            <Flame className="w-3.5 h-3.5" />
                                            <span>+{bonusXp} streak bonus!</span>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Progress bar animation at bottom */}
                        <motion.div
                            initial={{ scaleX: 1 }}
                            animate={{ scaleX: 0 }}
                            transition={{ duration: 3, ease: "linear" }}
                            className={cn(
                                "h-1 origin-left",
                                leveledUp
                                    ? "bg-gradient-to-r from-[var(--gold)] to-orange-400"
                                    : "bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)]"
                            )}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
