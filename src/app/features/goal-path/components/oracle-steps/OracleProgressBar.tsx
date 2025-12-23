"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/app/shared/lib/utils";
import type { OracleStep } from "../../lib/predictiveTypes";

const stepLabels: Record<OracleStep, string> = {
    welcome: "Start",
    skills: "Skills",
    goal: "Goal",
    preferences: "Preferences",
    analyzing: "Analyzing",
    insights: "Insights",
    path: "Path",
    jobs: "Jobs",
};

export const stepOrder: OracleStep[] = [
    "welcome",
    "skills",
    "goal",
    "preferences",
    "analyzing",
    "insights",
    "path",
    "jobs",
];

export interface OracleProgressBarProps {
    currentStep: OracleStep;
    prefersReducedMotion?: boolean | null;
}

export const OracleProgressBar = ({ currentStep, prefersReducedMotion }: OracleProgressBarProps) => {
    const currentIndex = stepOrder.indexOf(currentStep);
    const mainSteps: OracleStep[] = ["skills", "goal", "preferences", "insights"];

    return (
        <div className="mb-8">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest font-bold">
                {mainSteps.map((step) => {
                    const stepIndex = stepOrder.indexOf(step);
                    const isActive = currentIndex >= stepIndex;
                    return (
                        <span
                            key={step}
                            className={cn(isActive && "text-indigo-600 dark:text-indigo-400")}
                        >
                            {stepLabels[step]}
                        </span>
                    );
                })}
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-full"
                    initial={prefersReducedMotion ? false : { width: 0 }}
                    animate={{
                        width: `${Math.min(100, ((currentIndex + 1) / mainSteps.length) * 100)}%`,
                    }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, ease: "easeInOut" }}
                />
            </div>
        </div>
    );
};
