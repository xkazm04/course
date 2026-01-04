"use client";

import { motion } from "framer-motion";
import { Map, LogIn, Sparkles, Flame } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
    type: "not-authenticated" | "no-progress";
}

export function EmptyState({ type }: EmptyStateProps) {
    if (type === "not-authenticated") {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md mx-auto text-center py-16 px-6"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[var(--ember)]/20 to-[var(--ember-glow)]/10 flex items-center justify-center"
                >
                    <LogIn className="w-10 h-10 text-[var(--ember)]" />
                </motion.div>

                <h2 className="text-2xl font-bold text-[var(--forge-text-primary)] mb-3">
                    Sign In to Track Progress
                </h2>
                <p className="text-[var(--forge-text-muted)] mb-8">
                    Create an account or sign in to save your progress, earn XP, unlock achievements, and track your learning journey.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/forge/profile"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] text-white font-medium hover:opacity-90 transition-opacity"
                    >
                        <LogIn className="w-4 h-4" />
                        Sign In
                    </Link>
                    <Link
                        href="/forge/map"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[var(--forge-border-subtle)] text-[var(--forge-text-primary)] font-medium hover:bg-[var(--forge-bg-elevated)] transition-colors"
                    >
                        <Map className="w-4 h-4" />
                        Explore Map
                    </Link>
                </div>
            </motion.div>
        );
    }

    // No progress state
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center py-16 px-6"
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="relative w-24 h-24 mx-auto mb-6"
            >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--gold)]/20 to-orange-500/10 flex items-center justify-center">
                    <Map className="w-12 h-12 text-[var(--gold)]" />
                </div>
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute -top-1 -right-1"
                >
                    <Sparkles className="w-6 h-6 text-[var(--gold)]" />
                </motion.div>
            </motion.div>

            <h2 className="text-2xl font-bold text-[var(--forge-text-primary)] mb-3">
                Start Your Journey
            </h2>
            <p className="text-[var(--forge-text-muted)] mb-4">
                Complete your first chapter to begin earning XP, maintaining streaks, and unlocking achievements.
            </p>

            {/* Benefits preview */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center"
                >
                    <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-[var(--ember)]/10 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-[var(--ember)]" />
                    </div>
                    <p className="text-xs text-[var(--forge-text-muted)]">Earn XP</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-center"
                >
                    <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <Flame className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-xs text-[var(--forge-text-muted)]">Build Streaks</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-center"
                >
                    <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-[var(--gold)]/10 flex items-center justify-center">
                        <Map className="w-5 h-5 text-[var(--gold)]" />
                    </div>
                    <p className="text-xs text-[var(--forge-text-muted)]">Unlock Badges</p>
                </motion.div>
            </div>

            <Link
                href="/forge/map"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-[var(--ember)]/20"
            >
                <Map className="w-5 h-5" />
                Explore the Map
            </Link>
        </motion.div>
    );
}
