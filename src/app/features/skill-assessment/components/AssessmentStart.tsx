"use client";

import React from "react";
import { motion } from "framer-motion";
import { Play, Clock, Sparkles, Zap } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";

interface AssessmentStartProps {
    onStart: () => void;
    className?: string;
}

/**
 * Initial screen to start the skill assessment
 */
export const AssessmentStart = ({
    onStart,
    className,
}: AssessmentStartProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className={cn("w-full max-w-md mx-auto text-center", className)}
            data-testid="assessment-start"
        >
            {/* Icon */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="mb-6"
            >
                <div className="relative inline-flex">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl">
                        <Sparkles size={ICON_SIZES.xl} className="text-white" />
                    </div>
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 blur opacity-30"
                    />
                </div>
            </motion.div>

            {/* Title */}
            <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-3"
            >
                Get Your Personalized Roadmap
            </motion.h2>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed"
            >
                Answer 5 quick questions to unlock a curriculum tailored specifically to your goals and experience level.
            </motion.p>

            {/* Benefit indicators */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="flex flex-col items-start gap-2 mb-6 text-sm text-slate-600 dark:text-slate-300"
            >
                <div className="flex items-center gap-2" data-testid="assessment-benefit-tailored">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Tailored modules based on your skill level</span>
                </div>
                <div className="flex items-center gap-2" data-testid="assessment-benefit-order">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Custom learning order for faster progress</span>
                </div>
                <div className="flex items-center gap-2" data-testid="assessment-benefit-matched">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Skill-matched content recommendations</span>
                </div>
            </motion.div>

            {/* Features */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex justify-center gap-6 mb-8 text-sm"
            >
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Clock size={ICON_SIZES.sm} className="text-indigo-500" />
                    <span>60 seconds</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Zap size={ICON_SIZES.sm} className="text-amber-500" />
                    <span>5 questions</span>
                </div>
            </motion.div>

            {/* Start button */}
            <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={onStart}
                className={cn(
                    "group flex items-center justify-center gap-2 w-full px-6 py-4 rounded-xl font-bold text-white",
                    "bg-gradient-to-r from-indigo-600 to-purple-600",
                    "hover:from-indigo-500 hover:to-purple-500",
                    "transition-all hover:scale-[1.02] active:scale-[0.98]",
                    "shadow-xl shadow-indigo-500/25"
                )}
                data-testid="assessment-begin-btn"
            >
                <Play size={ICON_SIZES.md} className="group-hover:scale-110 transition-transform" />
                Begin Assessment
            </motion.button>

            {/* Skip option */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-4 text-xs text-slate-400 dark:text-slate-500"
            >
                Or explore the platform without personalization
            </motion.p>
        </motion.div>
    );
};
