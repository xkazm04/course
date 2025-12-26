"use client";

/**
 * CompactPreferencesStep Component
 *
 * Compact preferences step for the Oracle wizard.
 * Allows setting weekly hours, learning style, and focus areas.
 */

import React from "react";
import { motion } from "framer-motion";
import { Clock, BookOpen, Target, Check } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { learningStyleOptions } from "@/app/features/goal-path/lib/useCareerOracle";
import type { UserSkillProfile } from "@/app/features/goal-path/lib/predictiveTypes";

// ============================================================================
// TYPES
// ============================================================================

export interface CompactPreferencesStepProps {
    /** Weekly hours for learning */
    weeklyHours?: number;
    /** Preferred learning style */
    learningStyle?: string;
    /** Focus areas */
    focusAreas: string[];
    /** Callback when preferences change */
    onPreferencesChange: (prefs: Partial<UserSkillProfile>) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const hourOptions = [5, 10, 15, 20, 25];

const focusAreaOptions = [
    { id: "frontend", label: "Frontend" },
    { id: "backend", label: "Backend" },
    { id: "fullstack", label: "Full Stack" },
    { id: "devops", label: "DevOps" },
    { id: "data", label: "Data" },
    { id: "mobile", label: "Mobile" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function CompactPreferencesStep({
    weeklyHours = 10,
    learningStyle = "video",
    focusAreas = [],
    onPreferencesChange,
}: CompactPreferencesStepProps) {
    return (
        <div className="h-full flex flex-col gap-3" data-testid="compact-preferences-step">
            {/* Header */}
            <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Set your preferences
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Customize your learning experience
                </p>
            </div>

            <div className="flex-1 flex flex-col sm:flex-row gap-4 overflow-y-auto">
                {/* Weekly hours */}
                <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Clock size={12} className="text-slate-400" />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            Hours per week
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {hourOptions.map(hours => (
                            <button
                                key={hours}
                                onClick={() => onPreferencesChange({ weeklyHours: hours })}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-medium",
                                    "transition-colors",
                                    weeklyHours === hours
                                        ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                                        : "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                )}
                            >
                                {hours}h
                            </button>
                        ))}
                    </div>
                </div>

                {/* Learning style */}
                <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-2">
                        <BookOpen size={12} className="text-slate-400" />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            Learning style
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {learningStyleOptions.map(option => (
                            <button
                                key={option.id}
                                onClick={() =>
                                    onPreferencesChange({
                                        learningStyle: option.id as UserSkillProfile["learningStyle"],
                                    })
                                }
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
                                    "text-xs font-medium",
                                    "transition-colors",
                                    learningStyle === option.id
                                        ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                                        : "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                )}
                            >
                                <span>{option.icon}</span>
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Focus areas */}
                <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Target size={12} className="text-slate-400" />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            Focus areas
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {focusAreaOptions.map(option => {
                            const isSelected = focusAreas.includes(option.id);

                            return (
                                <motion.button
                                    key={option.id}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        const newAreas = isSelected
                                            ? focusAreas.filter(a => a !== option.id)
                                            : [...focusAreas, option.id];
                                        onPreferencesChange({ focusAreas: newAreas });
                                    }}
                                    className={cn(
                                        "flex items-center gap-1 px-2.5 py-1.5 rounded-lg",
                                        "text-xs font-medium",
                                        "transition-colors",
                                        isSelected
                                            ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                                            : "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                    )}
                                >
                                    {isSelected && <Check size={10} />}
                                    {option.label}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
