"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    ArrowRight,
    Sparkles,
    Target,
    Clock,
    TrendingUp,
    CheckCircle2
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { AssessmentResult as AssessmentResultType } from "../lib/types";
import { getPathConfig } from "../lib/assessmentData";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";

interface AssessmentResultProps {
    result: AssessmentResultType;
    onStartLearning: () => void;
    onRetake?: () => void;
    className?: string;
}

/**
 * Displays personalized assessment results with path recommendation
 */
export const AssessmentResultDisplay = ({
    result,
    onStartLearning,
    onRetake,
    className,
}: AssessmentResultProps) => {
    const pathConfig = getPathConfig(result.recommendedPath);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={cn("w-full max-w-lg mx-auto text-center", className)}
            data-testid="assessment-result"
        >
            {/* Success animation */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-6"
            >
                <div className="relative inline-flex">
                    <motion.div
                        className={cn(
                            "w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl",
                            `bg-gradient-to-br ${pathConfig.gradient}`
                        )}
                        animate={{
                            boxShadow: [
                                "0 0 0 0 rgba(99, 102, 241, 0.4)",
                                "0 0 0 20px rgba(99, 102, 241, 0)",
                            ]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        <Sparkles size={ICON_SIZES.xl} className="text-white" />
                    </motion.div>
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                    >
                        <CheckCircle2 size={ICON_SIZES.md} className="text-white" />
                    </motion.div>
                </div>
            </motion.div>

            {/* Title */}
            <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-2"
            >
                Your Path is Ready!
            </motion.h2>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-slate-500 dark:text-slate-400 mb-8"
            >
                We&apos;ve customized your learning journey
            </motion.p>

            {/* Result card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
            >
                {/* Recommended path */}
                <div className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-4",
                    `bg-gradient-to-r ${pathConfig.gradient} text-white`
                )}>
                    <Target size={ICON_SIZES.sm} />
                    {result.pathDisplayName}
                </div>

                {/* Confidence badge */}
                <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300 mb-4">
                    <div className="flex items-center gap-1">
                        <TrendingUp size={ICON_SIZES.sm} className="text-green-500" />
                        <span>{result.confidence}% Match</span>
                    </div>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <div className="flex items-center gap-1">
                        <Clock size={ICON_SIZES.sm} className="text-indigo-500" />
                        <span>{result.estimatedWeeks} weeks</span>
                    </div>
                </div>

                {/* Summary */}
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {result.summary}
                </p>

                {/* Personalized tags */}
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {result.personalizedTags.map((tag, index) => (
                        <motion.span
                            key={tag}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                            className="px-3 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                            data-testid={`result-tag-${index}`}
                        >
                            {tag}
                        </motion.span>
                    ))}
                </div>
            </motion.div>

            {/* Actions */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="space-y-3"
            >
                <button
                    onClick={onStartLearning}
                    className={cn(
                        "w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-white transition-all",
                        "hover:scale-[1.02] active:scale-[0.98]",
                        "shadow-xl shadow-indigo-500/25",
                        `bg-gradient-to-r ${pathConfig.gradient}`
                    )}
                    data-testid="assessment-start-learning-btn"
                >
                    Start Learning Now
                    <ArrowRight size={ICON_SIZES.md} />
                </button>

                {onRetake && (
                    <button
                        onClick={onRetake}
                        className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                        data-testid="assessment-retake-btn"
                    >
                        Retake Assessment
                    </button>
                )}
            </motion.div>
        </motion.div>
    );
};
