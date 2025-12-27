"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
    Filter,
    Sparkles,
    Clock,
    Languages,
    BarChart3,
    RefreshCw,
    TrendingUp,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { elevation } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import {
    TaskComplexity,
    MatchingPreferences,
    COMPLEXITY_CONFIG,
} from "../lib/types";

interface SkillMatcherProps {
    availableLanguages: string[];
    preferences: MatchingPreferences;
    onPreferencesChange: (prefs: MatchingPreferences) => void;
    onFindMatches: () => void;
    matchCount?: number;
}

export const SkillMatcher: React.FC<SkillMatcherProps> = ({
    availableLanguages,
    preferences,
    onPreferencesChange,
    onFindMatches,
    matchCount,
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const complexities: TaskComplexity[] = ["trivial", "simple", "moderate", "complex", "expert"];

    const updatePreference = <K extends keyof MatchingPreferences>(
        key: K,
        value: MatchingPreferences[K]
    ) => {
        onPreferencesChange({ ...preferences, [key]: value });
    };

    const toggleComplexity = (complexity: TaskComplexity) => {
        const current = preferences.preferredComplexity;
        const newValue = current.includes(complexity)
            ? current.filter(c => c !== complexity)
            : [...current, complexity];
        updatePreference("preferredComplexity", newValue);
    };

    const toggleLanguage = (lang: string) => {
        const current = preferences.preferredLanguages;
        const newValue = current.includes(lang)
            ? current.filter(l => l !== lang)
            : [...current, lang];
        updatePreference("preferredLanguages", newValue);
    };

    return (
        <motion.div
            layout
            className={cn(
                "rounded-xl border border-[var(--border-default)]",
                "bg-[var(--surface-elevated)]",
                elevation.elevated
            )}
        >
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <Filter size={ICON_SIZES.md} className="text-purple-400" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-semibold text-[var(--text-primary)]">
                            Skill Matcher
                        </h3>
                        <p className="text-xs text-[var(--text-muted)]">
                            Find issues that match your skills
                        </p>
                    </div>
                </div>
                {matchCount !== undefined && (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium">
                        {matchCount} matches
                    </span>
                )}
            </button>

            {/* Content */}
            {isExpanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4 space-y-4 border-t border-[var(--border-subtle)]"
                >
                    {/* Complexity preference */}
                    <div className="pt-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] mb-3">
                            <BarChart3 size={ICON_SIZES.sm} />
                            Preferred Complexity
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {complexities.map(c => {
                                const config = COMPLEXITY_CONFIG[c];
                                const isSelected = preferences.preferredComplexity.includes(c);
                                return (
                                    <motion.button
                                        key={c}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => toggleComplexity(c)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                            isSelected
                                                ? `${config.bgColor} ${config.color} ring-2 ring-current ring-offset-2 ring-offset-[var(--surface-elevated)]`
                                                : "bg-[var(--surface-overlay)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                                        )}
                                    >
                                        {config.label}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Languages */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] mb-3">
                            <Languages size={ICON_SIZES.sm} />
                            Preferred Languages
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {availableLanguages.map(lang => {
                                const isSelected = preferences.preferredLanguages.includes(lang);
                                return (
                                    <motion.button
                                        key={lang}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => toggleLanguage(lang)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                            isSelected
                                                ? "bg-indigo-500/20 text-indigo-400 ring-2 ring-indigo-500/50 ring-offset-2 ring-offset-[var(--surface-elevated)]"
                                                : "bg-[var(--surface-overlay)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                                        )}
                                    >
                                        {lang}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Time availability */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] mb-3">
                            <Clock size={ICON_SIZES.sm} />
                            Max Time Available
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min="1"
                                max="40"
                                value={preferences.maxEstimatedHours}
                                onChange={e => updatePreference("maxEstimatedHours", parseInt(e.target.value))}
                                className="flex-1 accent-[var(--accent-primary)]"
                            />
                            <span className="text-sm font-medium text-[var(--text-primary)] min-w-[60px] text-right">
                                {preferences.maxEstimatedHours}h
                            </span>
                        </div>
                    </div>

                    {/* Toggle options */}
                    <div className="flex flex-wrap gap-3">
                        <ToggleOption
                            label="Prefer stretch opportunities"
                            description="Show tasks that help you grow"
                            icon={<TrendingUp size={ICON_SIZES.sm} />}
                            checked={preferences.preferStretch}
                            onChange={checked => updatePreference("preferStretch", checked)}
                        />
                        <ToggleOption
                            label="Only mentorship available"
                            description="Filter to projects with mentors"
                            icon={<Sparkles size={ICON_SIZES.sm} />}
                            checked={preferences.onlyMentorshipAvailable}
                            onChange={checked => updatePreference("onlyMentorshipAvailable", checked)}
                        />
                    </div>

                    {/* Find matches button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onFindMatches}
                        className={cn(
                            "w-full py-3 rounded-xl font-semibold text-sm",
                            "bg-gradient-to-r from-purple-500 to-indigo-500 text-white",
                            "hover:from-purple-600 hover:to-indigo-600 transition-all",
                            "flex items-center justify-center gap-2"
                        )}
                    >
                        <RefreshCw size={ICON_SIZES.sm} />
                        Find Matching Issues
                    </motion.button>
                </motion.div>
            )}
        </motion.div>
    );
};

// Toggle option sub-component
interface ToggleOptionProps {
    label: string;
    description: string;
    icon: React.ReactNode;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

const ToggleOption: React.FC<ToggleOptionProps> = ({
    label,
    description,
    icon,
    checked,
    onChange,
}) => {
    return (
        <button
            onClick={() => onChange(!checked)}
            className={cn(
                "flex items-start gap-3 p-3 rounded-xl flex-1 min-w-[200px] text-left transition-colors",
                checked
                    ? "bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30"
                    : "bg-[var(--surface-overlay)] border border-transparent hover:border-[var(--border-default)]"
            )}
        >
            <div className={cn(
                "p-1.5 rounded-lg",
                checked ? "bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]" : "bg-[var(--surface-elevated)] text-[var(--text-muted)]"
            )}>
                {icon}
            </div>
            <div>
                <div className={cn(
                    "text-sm font-medium",
                    checked ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)]"
                )}>
                    {label}
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                    {description}
                </div>
            </div>
        </button>
    );
};

// Default preferences
export function getDefaultMatchingPreferences(): MatchingPreferences {
    return {
        preferredComplexity: ["simple", "moderate"],
        preferredLanguages: [],
        preferStretch: false,
        maxEstimatedHours: 8,
        onlyMentorshipAvailable: false,
    };
}
