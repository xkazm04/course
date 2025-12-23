"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Flame, X, Snowflake } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { Confetti } from "./Confetti";

interface MilestoneCelebrationProps {
    milestone: number | null;
    onClose: () => void;
    className?: string;
}

const MILESTONE_CONFIG: Record<number, { title: string; description: string; reward: string; color: string }> = {
    7: {
        title: "One Week Wonder!",
        description: "You've maintained a 7-day streak!",
        reward: "+1 Streak Freeze",
        color: "from-amber-500 to-orange-500",
    },
    14: {
        title: "Two Week Champion!",
        description: "14 days of consistent learning!",
        reward: "+1 Streak Freeze",
        color: "from-emerald-500 to-teal-500",
    },
    30: {
        title: "Monthly Master!",
        description: "A full month of dedication!",
        reward: "+2 Streak Freezes",
        color: "from-purple-500 to-pink-500",
    },
    60: {
        title: "Two Month Legend!",
        description: "60 days of unstoppable progress!",
        reward: "+2 Streak Freezes",
        color: "from-cyan-500 to-blue-500",
    },
    100: {
        title: "Century Champion!",
        description: "100 days of excellence!",
        reward: "+3 Streak Freezes",
        color: "from-rose-500 to-red-500",
    },
    365: {
        title: "Year of Greatness!",
        description: "365 days of mastery!",
        reward: "+5 Streak Freezes",
        color: "from-indigo-500 to-violet-500",
    },
};

export const MilestoneCelebration = ({
    milestone,
    onClose,
    className,
}: MilestoneCelebrationProps) => {
    const [showConfetti, setShowConfetti] = useState(false);

    const config = milestone ? MILESTONE_CONFIG[milestone] : null;

    useEffect(() => {
        if (milestone) {
            setShowConfetti(true);
            const timeout = setTimeout(() => setShowConfetti(false), 4000);
            return () => clearTimeout(timeout);
        }
    }, [milestone]);

    return (
        <>
            <Confetti isActive={showConfetti} pieceCount={80} duration={4000} />

            <AnimatePresence>
                {milestone && config && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
                        onClick={onClose}
                        data-testid="milestone-celebration-overlay"
                    >
                        <motion.div
                            initial={{ scale: 0, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 10 }}
                            transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
                            className={cn(
                                "relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl",
                                className
                            )}
                            onClick={(e) => e.stopPropagation()}
                            data-testid="milestone-celebration-modal"
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                                data-testid="milestone-close-btn"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>

                            {/* Gradient Header */}
                            <div className={cn(
                                "relative pt-10 pb-16 px-6 text-center bg-gradient-to-br",
                                config.color
                            )}>
                                {/* Floating stars */}
                                <motion.div
                                    animate={{ y: [0, -10, 0], rotate: [0, 10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute top-6 left-6"
                                >
                                    <Star className="w-6 h-6 text-white/50 fill-white/50" />
                                </motion.div>
                                <motion.div
                                    animate={{ y: [0, -8, 0], rotate: [0, -10, 0] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                                    className="absolute top-10 right-8"
                                >
                                    <Star className="w-4 h-4 text-white/50 fill-white/50" />
                                </motion.div>
                                <motion.div
                                    animate={{ y: [0, -12, 0], rotate: [0, 15, 0] }}
                                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                                    className="absolute bottom-8 left-10"
                                >
                                    <Star className="w-5 h-5 text-white/50 fill-white/50" />
                                </motion.div>

                                {/* Trophy Icon */}
                                <motion.div
                                    initial={{ scale: 0, rotate: -30 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.2, type: "spring", bounce: 0.6 }}
                                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-4"
                                >
                                    <Trophy className="w-10 h-10 text-white" />
                                </motion.div>

                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-2xl font-black text-white mb-2"
                                >
                                    {config.title}
                                </motion.h2>

                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-white/90"
                                >
                                    {config.description}
                                </motion.p>
                            </div>

                            {/* Content */}
                            <div className="px-6 py-6 text-center -mt-8">
                                {/* Streak Badge */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.5, type: "spring", bounce: 0.5 }}
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 mb-6"
                                >
                                    <Flame className="w-6 h-6" />
                                    <span className="text-2xl font-black">{milestone}</span>
                                    <span className="font-bold">day streak!</span>
                                </motion.div>

                                {/* Reward */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="p-4 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 mb-6"
                                >
                                    <div className="flex items-center justify-center gap-2 text-cyan-700 dark:text-cyan-400">
                                        <Snowflake className="w-5 h-5" />
                                        <span className="font-bold">{config.reward}</span>
                                    </div>
                                    <p className="text-xs text-cyan-600 dark:text-cyan-500 mt-1">
                                        Reward added to your account
                                    </p>
                                </motion.div>

                                {/* Continue Button */}
                                <motion.button
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onClose}
                                    className={cn(
                                        "w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r shadow-lg transition-all",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                                        config.color
                                    )}
                                    data-testid="milestone-continue-btn"
                                >
                                    Keep Going!
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
