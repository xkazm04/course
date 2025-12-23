"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp, Briefcase, Clock, Compass } from "lucide-react";
import { Button } from "@/app/shared/components";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";

export interface WelcomeStepProps {
    onStart: () => void;
    prefersReducedMotion?: boolean | null;
}

export const WelcomeStep = ({ onStart, prefersReducedMotion }: WelcomeStepProps) => {
    return (
        <motion.div
            key="welcome"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
            transition={prefersReducedMotion ? { duration: 0 } : undefined}
            className="text-center py-12"
        >
            <motion.div
                initial={prefersReducedMotion ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", bounce: 0.5 }}
                className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-200 dark:shadow-indigo-900/50"
            >
                <Compass size={48} className="text-white" />
            </motion.div>

            <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 mb-4">
                AI Career Oracle
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-2 max-w-xl mx-auto">
                Predictive intelligence for your career path
            </p>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-lg mx-auto">
                We analyze market trends, skill demand forecasts, and job opportunities to create
                a personalized learning path optimized for where the market is heading.
            </p>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-10">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                    <TrendingUp size={ICON_SIZES.lg} className="text-indigo-500 mx-auto mb-2" />
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Skill Demand Forecasts
                    </div>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <Briefcase size={ICON_SIZES.lg} className="text-purple-500 mx-auto mb-2" />
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Live Job Matching
                    </div>
                </div>
                <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
                    <Clock size={ICON_SIZES.lg} className="text-cyan-500 mx-auto mb-2" />
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Optimal Timing
                    </div>
                </div>
            </div>

            <Button
                onClick={onStart}
                size="lg"
                variant="primary"
                data-testid="oracle-start-btn"
            >
                <Sparkles size={ICON_SIZES.md} />
                Begin Career Analysis
                <ArrowRight size={ICON_SIZES.md} />
            </Button>
        </motion.div>
    );
};
