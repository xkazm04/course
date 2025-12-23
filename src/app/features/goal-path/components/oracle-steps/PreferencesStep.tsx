"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Clock, Sparkles, Target } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { FOCUS_AREAS } from "@/app/shared/lib/learningDomains";
import { learningStyleOptions, riskToleranceOptions } from "../../lib/useCareerOracle";

export interface OraclePreferences {
    weeklyHours: number;
    learningStyle: "video" | "text" | "project" | "interactive";
    riskTolerance: "conservative" | "moderate" | "aggressive";
    remotePreference: "no" | "hybrid" | "full" | "any";
    focusAreas?: string[];
}

export interface PreferencesStepProps {
    preferences: Partial<OraclePreferences>;
    onUpdatePreferences: (prefs: Partial<OraclePreferences>) => void;
    onUpdateFocusAreas: (focusAreas: string[]) => void;
    onNext: () => void;
    onBack: () => void;
    prefersReducedMotion?: boolean | null;
}

export const PreferencesStep = ({
    preferences,
    onUpdatePreferences,
    onUpdateFocusAreas,
    onNext,
    onBack,
    prefersReducedMotion,
}: PreferencesStepProps) => {
    const focusAreas = preferences.focusAreas ?? [];

    const toggleFocus = (id: string) => {
        const newFocus = focusAreas.includes(id)
            ? focusAreas.filter(f => f !== id)
            : [...focusAreas, id];
        onUpdateFocusAreas(newFocus);
    };

    return (
        <motion.div
            key="preferences"
            initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
            transition={prefersReducedMotion ? { duration: 0 } : undefined}
        >
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center">
                    <Clock size={ICON_SIZES.md} className="text-cyan-600 dark:text-cyan-400" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                    Customize your path
                </h2>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
                Help us tailor recommendations to your situation and preferences.
            </p>

            {/* Focus Areas */}
            <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <Target size={ICON_SIZES.sm} className="text-indigo-500" />
                    Focus Areas
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Select the areas you want to specialize in
                </p>
                <div className="grid grid-cols-3 gap-2">
                    {FOCUS_AREAS.map(area => (
                        <button
                            key={area.id}
                            onClick={() => toggleFocus(area.id)}
                            data-testid={`oracle-focus-${area.id}`}
                            className={cn(
                                "p-3 min-h-[56px] rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1",
                                focusAreas.includes(area.id)
                                    ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-700"
                            )}
                        >
                            <area.icon size={ICON_SIZES.md} />
                            <span className="text-xs font-medium">{area.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Weekly Hours */}
            <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Weekly learning hours
                </label>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min="2"
                        max="40"
                        value={preferences.weeklyHours ?? 10}
                        onChange={(e) =>
                            onUpdatePreferences({ weeklyHours: Number(e.target.value) })
                        }
                        data-testid="oracle-weekly-hours-slider"
                        className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500"
                    />
                    <span className="w-20 text-center px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded-lg font-bold">
                        {preferences.weeklyHours ?? 10}h/week
                    </span>
                </div>
            </div>

            {/* Learning Style */}
            <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Preferred learning style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {learningStyleOptions.map((style) => {
                        const isSelected = preferences.learningStyle === style.id;
                        return (
                            <button
                                key={style.id}
                                onClick={() =>
                                    onUpdatePreferences({
                                        learningStyle: style.id as "video" | "text" | "project" | "interactive",
                                    })
                                }
                                data-testid={`oracle-style-${style.id}`}
                                className={cn(
                                    "p-3 rounded-xl border-2 text-center transition-all",
                                    isSelected
                                        ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20"
                                        : "border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-700"
                                )}
                            >
                                <span className="text-2xl">{style.icon}</span>
                                <div className={cn(
                                    "text-xs font-medium mt-1",
                                    isSelected
                                        ? "text-cyan-700 dark:text-cyan-400"
                                        : "text-slate-600 dark:text-slate-400"
                                )}>
                                    {style.label}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Risk Tolerance */}
            <div className="mb-8">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Career risk tolerance
                </label>
                <div className="grid sm:grid-cols-3 gap-2">
                    {riskToleranceOptions.map((option) => {
                        const isSelected = preferences.riskTolerance === option.id;
                        return (
                            <button
                                key={option.id}
                                onClick={() =>
                                    onUpdatePreferences({
                                        riskTolerance: option.id as "conservative" | "moderate" | "aggressive",
                                    })
                                }
                                data-testid={`oracle-risk-${option.id}`}
                                className={cn(
                                    "p-3 rounded-xl border-2 text-left transition-all",
                                    isSelected
                                        ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20"
                                        : "border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-700"
                                )}
                            >
                                <div className={cn(
                                    "font-bold",
                                    isSelected
                                        ? "text-cyan-700 dark:text-cyan-400"
                                        : "text-slate-900 dark:text-slate-100"
                                )}>
                                    {option.label}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {option.description}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    data-testid="oracle-prefs-back-btn"
                    className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium transition-colors flex items-center gap-1"
                >
                    <ArrowLeft size={ICON_SIZES.sm} />
                    Back
                </button>
                <button
                    onClick={onNext}
                    data-testid="oracle-analyze-btn"
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                    <Sparkles size={ICON_SIZES.sm} />
                    Analyze My Path
                    <ArrowRight size={ICON_SIZES.sm} />
                </button>
            </div>
        </motion.div>
    );
};
