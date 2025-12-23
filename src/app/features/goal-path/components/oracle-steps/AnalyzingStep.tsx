"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";

const analysisSteps = [
    { label: "Analyzing skill market demand...", delay: 0 },
    { label: "Scanning industry trends...", delay: 0.5 },
    { label: "Matching job opportunities...", delay: 1 },
    { label: "Generating optimal path...", delay: 1.5 },
] as const;

export interface AnalyzingStepProps {
    prefersReducedMotion?: boolean | null;
}

export const AnalyzingStep = ({ prefersReducedMotion }: AnalyzingStepProps) => {
    return (
        <motion.div
            key="analyzing"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : undefined}
            className="text-center py-16"
        >
            <motion.div
                animate={prefersReducedMotion ? undefined : { rotate: 360 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 mx-auto mb-8"
            >
                <div className="w-full h-full rounded-full border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400" />
            </motion.div>

            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-4">
                Analyzing Market Intelligence
            </h2>

            <div className="space-y-3 max-w-md mx-auto">
                {analysisSteps.map((step, i) => (
                    <motion.div
                        key={i}
                        initial={prefersReducedMotion ? false : { opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={prefersReducedMotion ? { duration: 0 } : { delay: step.delay }}
                        className="flex items-center gap-3 text-slate-600 dark:text-slate-300"
                    >
                        <Loader2 size={ICON_SIZES.sm} className={cn("text-indigo-500", !prefersReducedMotion && "animate-spin")} />
                        <span>{step.label}</span>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};
