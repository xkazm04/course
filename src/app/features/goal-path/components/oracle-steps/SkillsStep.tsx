"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Brain } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { commonSkills } from "../../lib/useCareerOracle";

export interface SkillsStepProps {
    selectedSkills: string[];
    onUpdateSkills: (skills: string[]) => void;
    onNext: () => void;
    onBack: () => void;
    prefersReducedMotion?: boolean | null;
}

export const SkillsStep = ({
    selectedSkills,
    onUpdateSkills,
    onNext,
    onBack,
    prefersReducedMotion,
}: SkillsStepProps) => {
    const toggleSkill = (skill: string) => {
        if (selectedSkills.includes(skill)) {
            onUpdateSkills(selectedSkills.filter((s) => s !== skill));
        } else {
            onUpdateSkills([...selectedSkills, skill]);
        }
    };

    return (
        <motion.div
            key="skills"
            initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
            transition={prefersReducedMotion ? { duration: 0 } : undefined}
        >
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                    <Brain size={ICON_SIZES.md} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                    What skills do you have?
                </h2>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
                Select your current skills so we can analyze your market position and skill gaps.
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
                {commonSkills.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                        <button
                            key={skill}
                            onClick={() => toggleSkill(skill)}
                            data-testid={`skill-btn-${skill.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                            className={cn(
                                "px-4 py-2 rounded-xl font-medium transition-all",
                                isSelected
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50"
                                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                            )}
                        >
                            {isSelected && <Check size={ICON_SIZES.sm} className="inline mr-1" />}
                            {skill}
                        </button>
                    );
                })}
            </div>

            {selectedSkills.length > 0 && (
                <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <div className="text-sm text-emerald-700 dark:text-emerald-400">
                        <strong>{selectedSkills.length}</strong> skills selected
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    data-testid="oracle-skills-back-btn"
                    className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium transition-colors flex items-center gap-1"
                >
                    <ArrowLeft size={ICON_SIZES.sm} />
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={selectedSkills.length === 0}
                    data-testid="oracle-skills-next-btn"
                    className={cn(
                        "px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2",
                        selectedSkills.length > 0
                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
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
