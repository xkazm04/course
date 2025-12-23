"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Target } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { careerGoalOptions } from "../../lib/useCareerOracle";
import type { IndustrySector } from "../../lib/predictiveTypes";

export interface GoalStepProps {
    selectedGoal?: string;
    onSelectGoal: (goal: string, sector: IndustrySector) => void;
    onNext: () => void;
    onBack: () => void;
    prefersReducedMotion?: boolean | null;
}

export const GoalStep = ({ selectedGoal, onSelectGoal, onNext, onBack, prefersReducedMotion }: GoalStepProps) => {
    return (
        <motion.div
            key="goal"
            initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
            transition={prefersReducedMotion ? { duration: 0 } : undefined}
        >
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <Target size={ICON_SIZES.md} className="text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                    What's your career goal?
                </h2>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
                Select your target role so we can analyze market demand and create your optimal path.
            </p>

            <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {careerGoalOptions.map((goal) => {
                    const isSelected = selectedGoal === goal.label;
                    return (
                        <motion.button
                            key={goal.id}
                            whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                            onClick={() => onSelectGoal(goal.label, goal.sector)}
                            data-testid={`goal-btn-${goal.id}`}
                            className={cn(
                                "p-4 rounded-xl border-2 text-left transition-all",
                                isSelected
                                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-purple-300 dark:hover:border-purple-700"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <span className={cn(
                                    "font-bold",
                                    isSelected
                                        ? "text-purple-700 dark:text-purple-400"
                                        : "text-slate-900 dark:text-slate-100"
                                )}>
                                    {goal.label}
                                </span>
                                {isSelected && (
                                    <Check size={ICON_SIZES.md} className="text-purple-500" />
                                )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 capitalize">
                                {goal.sector.replace("_", " ")}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    data-testid="oracle-goal-back-btn"
                    className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium transition-colors flex items-center gap-1"
                >
                    <ArrowLeft size={ICON_SIZES.sm} />
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!selectedGoal}
                    data-testid="oracle-goal-next-btn"
                    className={cn(
                        "px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2",
                        selectedGoal
                            ? "bg-purple-600 text-white hover:bg-purple-700"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                    )}
                >
                    Continue
                    <ArrowRight size={ICON_SIZES.sm} />
                </button>
            </div>
        </motion.div>
    );
};
