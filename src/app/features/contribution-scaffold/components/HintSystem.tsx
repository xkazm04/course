"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    Lightbulb,
    Lock,
    Unlock,
    MapPin,
    Code,
    TestTube,
    Bug,
    Compass,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { ProgressiveHint, HintCategory } from "../lib/types";

interface HintSystemProps {
    hints: ProgressiveHint[];
    onUnlock?: (hintId: string) => void;
}

const CATEGORY_CONFIG: Record<HintCategory, {
    icon: React.ElementType;
    label: string;
    color: string;
}> = {
    approach: { icon: Compass, label: "Approach", color: "ember" },
    location: { icon: MapPin, label: "Location", color: "success" },
    implementation: { icon: Code, label: "Implementation", color: "ember" },
    testing: { icon: TestTube, label: "Testing", color: "info" },
    debugging: { icon: Bug, label: "Debugging", color: "warning" },
};

export const HintSystem: React.FC<HintSystemProps> = ({ hints, onUnlock }) => {
    const groupedHints = hints.reduce((acc, hint) => {
        if (!acc[hint.level]) acc[hint.level] = [];
        acc[hint.level].push(hint);
        return acc;
    }, {} as Record<number, ProgressiveHint[]>);

    const levels = Object.keys(groupedHints).map(Number).sort();

    return (
        <div className="space-y-6">
            {/* Info header */}
            <div className="p-3 rounded-lg bg-[var(--ember)]/10 border border-[var(--ember)]/20">
                <div className="flex items-start gap-2">
                    <Lightbulb size={ICON_SIZES.md} className="text-[var(--ember)] flex-shrink-0" />
                    <div>
                        <h4 className="text-sm font-medium text-[var(--ember)]">Progressive Hints</h4>
                        <p className="text-xs text-[var(--ember)]/70 mt-1">
                            Hints are designed to guide without giving away the solution.
                            Start with Level 1 hints and only unlock more if needed.
                        </p>
                    </div>
                </div>
            </div>

            {/* Hints by level */}
            {levels.map(level => (
                <div key={level}>
                    <div className="flex items-center gap-2 mb-3">
                        <LevelBadge level={level} />
                        <span className="text-xs text-[var(--text-muted)]">
                            {level === 1 ? "Subtle guidance" :
                             level === 2 ? "Moderate direction" :
                             "Detailed guidance"}
                        </span>
                    </div>
                    <div className="space-y-2">
                        {groupedHints[level].map(hint => (
                            <HintCard
                                key={hint.id}
                                hint={hint}
                                onUnlock={() => onUnlock?.(hint.id)}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// Level badge
interface LevelBadgeProps {
    level: number;
}

const LevelBadge: React.FC<LevelBadgeProps> = ({ level }) => {
    const colors = {
        1: "bg-[var(--forge-success)]/20 text-[var(--forge-success)] border-[var(--forge-success)]/30",
        2: "bg-[var(--forge-warning)]/20 text-[var(--forge-warning)] border-[var(--forge-warning)]/30",
        3: "bg-[var(--forge-error)]/20 text-[var(--forge-error)] border-[var(--forge-error)]/30",
    };

    return (
        <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-semibold border",
            colors[level as keyof typeof colors] || colors[1]
        )}>
            Level {level}
        </span>
    );
};

// Hint card
interface HintCardProps {
    hint: ProgressiveHint;
    onUnlock: () => void;
}

const HintCard: React.FC<HintCardProps> = ({ hint, onUnlock }) => {
    const config = CATEGORY_CONFIG[hint.category];
    const Icon = config.icon;

    const colorClasses = {
        ember: "bg-[var(--ember)]/10 border-[var(--ember)]/20 text-[var(--ember)]",
        success: "bg-[var(--forge-success)]/10 border-[var(--forge-success)]/20 text-[var(--forge-success)]",
        info: "bg-[var(--forge-info)]/10 border-[var(--forge-info)]/20 text-[var(--forge-info)]",
        warning: "bg-[var(--forge-warning)]/10 border-[var(--forge-warning)]/20 text-[var(--forge-warning)]",
    };

    if (!hint.unlocked) {
        return (
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={onUnlock}
                className={cn(
                    "w-full rounded-lg border border-[var(--border-subtle)]",
                    "bg-[var(--surface-overlay)] p-4",
                    "flex items-center gap-3 group"
                )}
            >
                <div className="p-2 rounded-lg bg-[var(--surface-base)] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
                    <Lock size={ICON_SIZES.md} />
                </div>
                <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            colorClasses[config.color as keyof typeof colorClasses]
                        )}>
                            {config.label}
                        </span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        Click to reveal this hint
                    </p>
                </div>
                <Unlock size={ICON_SIZES.sm} className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors" />
            </motion.button>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "rounded-lg border p-4",
                colorClasses[config.color as keyof typeof colorClasses]
            )}
        >
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[var(--surface-base)]/50">
                    <Icon size={ICON_SIZES.md} />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium opacity-70">
                            {config.label}
                        </span>
                    </div>
                    <p className="text-sm leading-relaxed">
                        {hint.content}
                    </p>
                    {hint.unlockedAt && (
                        <span className="text-xs opacity-50 mt-2 block">
                            Unlocked {new Date(hint.unlockedAt).toLocaleDateString()}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
