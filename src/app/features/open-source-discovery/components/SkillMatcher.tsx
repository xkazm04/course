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
                "rounded-xl border border-[var(--forge-border-default)]",
                "bg-[var(--forge-bg-elevated)]",
                elevation.elevated
            )}
        >
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[var(--ember)]/20">
                        <Filter size={ICON_SIZES.md} className="text-[var(--ember)]" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-semibold text-[var(--forge-text-primary)]">
                            Skill Matcher
                        </h3>
                        <p className="text-xs text-[var(--forge-text-muted)]">
                            Find issues that match your skills
                        </p>
                    </div>
                </div>
                {matchCount !== undefined && (
                    <span className="px-3 py-1 rounded-full bg-[var(--forge-success)]/20 text-[var(--forge-success)] text-sm font-medium">
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
                    className="px-4 pb-4 space-y-4 border-t border-[var(--forge-border-subtle)]"
                >
                    {/* Complexity preference */}
                    <div className="pt-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-[var(--forge-text-secondary)] mb-3">
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
                                                ? `${config.bgColor} ${config.color} ring-2 ring-current ring-offset-2 ring-offset-[var(--forge-bg-elevated)]`
                                                : "bg-[var(--forge-bg-anvil)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
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
                        <label className="flex items-center gap-2 text-sm font-medium text-[var(--forge-text-secondary)] mb-3">
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
                                                ? "bg-[var(--ember)]/20 text-[var(--ember)] ring-2 ring-[var(--ember)]/50 ring-offset-2 ring-offset-[var(--forge-bg-elevated)]"
                                                : "bg-[var(--forge-bg-anvil)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
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
                        <label className="flex items-center gap-2 text-sm font-medium text-[var(--forge-text-secondary)] mb-3">
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
                                className="flex-1 accent-[var(--ember)]"
                            />
                            <span className="text-sm font-medium text-[var(--forge-text-primary)] min-w-[60px] text-right">
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
                            "bg-gradient-forge text-white",
                            "hover:brightness-110 transition-all",
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
                    ? "bg-[var(--ember)]/10 border border-[var(--ember)]/30"
                    : "bg-[var(--forge-bg-anvil)] border border-transparent hover:border-[var(--forge-border-default)]"
            )}
        >
            <div className={cn(
                "p-1.5 rounded-lg",
                checked ? "bg-[var(--ember)]/20 text-[var(--ember)]" : "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)]"
            )}>
                {icon}
            </div>
            <div>
                <div className={cn(
                    "text-sm font-medium",
                    checked ? "text-[var(--ember)]" : "text-[var(--forge-text-primary)]"
                )}>
                    {label}
                </div>
                <div className="text-xs text-[var(--forge-text-muted)]">
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
