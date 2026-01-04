"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Dna, TrendingUp, Zap, RefreshCw } from "lucide-react";
import { PrismaticCard } from "@/app/shared/components";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { LearningDNAProfile, LearningDNADimensions } from "../lib/types";

interface DNAScoreCardProps {
    profile: LearningDNAProfile | null;
    onSync?: () => void;
    isSyncing?: boolean;
    className?: string;
}

const DIMENSION_LABELS: Record<keyof LearningDNADimensions, { label: string; color: string }> = {
    contribution: { label: "Contribution", color: "var(--color-emerald)" },
    problemSolving: { label: "Problem Solving", color: "var(--color-amber)" },
    learning: { label: "Learning", color: "var(--color-cyan)" },
    community: { label: "Community", color: "var(--color-purple)" },
    breadth: { label: "Breadth", color: "var(--color-indigo)" },
    depth: { label: "Depth", color: "var(--color-orange)" },
};

/**
 * DNA Score Card - Displays the overall Learning DNA score and dimension breakdown
 */
export function DNAScoreCard({ profile, onSync, isSyncing, className }: DNAScoreCardProps) {
    const dimensions = useMemo(() => {
        if (!profile) return [];
        return Object.entries(profile.dimensions).map(([key, value]) => ({
            key: key as keyof LearningDNADimensions,
            value,
            ...DIMENSION_LABELS[key as keyof LearningDNADimensions],
        }));
    }, [profile]);

    const scoreColor = useMemo(() => {
        if (!profile) return "var(--text-muted)";
        if (profile.overallScore >= 80) return "var(--color-emerald)";
        if (profile.overallScore >= 60) return "var(--color-cyan)";
        if (profile.overallScore >= 40) return "var(--color-amber)";
        return "var(--color-orange)";
    }, [profile]);

    if (!profile) {
        return (
            <PrismaticCard glowColor="purple" className={className}>
                <div className="p-6 text-center" data-testid="dna-score-empty">
                    <Dna
                        size={ICON_SIZES.xl}
                        className="mx-auto mb-4 text-[var(--text-muted)]"
                    />
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                        Build Your Learning DNA
                    </h3>
                    <p className="text-sm text-[var(--text-muted-high)]">
                        Connect your platforms to generate your unique developer profile
                    </p>
                </div>
            </PrismaticCard>
        );
    }

    return (
        <PrismaticCard glowColor="purple" className={className}>
            <div className="p-6" data-testid="dna-score-card">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <motion.div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center"
                            style={{
                                background: `linear-gradient(135deg, var(--color-purple), var(--color-indigo))`,
                            }}
                            whileHover={{ rotate: 10 }}
                        >
                            <Dna size={ICON_SIZES.lg} className="text-white" />
                        </motion.div>
                        <div>
                            <h2 className="text-xl font-black text-[var(--text-primary)]">
                                Learning DNA
                            </h2>
                            <div className="flex items-center gap-2 text-sm text-[var(--text-muted-high)]">
                                <TrendingUp size={ICON_SIZES.sm} style={{ color: scoreColor }} />
                                <span>
                                    Last synced:{" "}
                                    {new Date(profile.lastSyncedAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {onSync && (
                        <button
                            onClick={onSync}
                            disabled={isSyncing}
                            className={cn(
                                "p-3 rounded-xl transition-colors",
                                "bg-[var(--surface-inset)] hover:bg-[var(--surface-overlay)]",
                                isSyncing && "opacity-50 cursor-not-allowed"
                            )}
                            data-testid="dna-sync-btn"
                        >
                            <RefreshCw
                                size={ICON_SIZES.md}
                                className={cn(
                                    "text-[var(--text-secondary)]",
                                    isSyncing && "animate-spin"
                                )}
                            />
                        </button>
                    )}
                </div>

                {/* Overall Score */}
                <div className="flex items-center justify-center mb-8">
                    <div className="relative">
                        {/* Background circle */}
                        <svg
                            width="160"
                            height="160"
                            viewBox="0 0 160 160"
                            className="transform -rotate-90"
                        >
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                fill="none"
                                stroke="var(--surface-inset)"
                                strokeWidth="12"
                            />
                            <motion.circle
                                cx="80"
                                cy="80"
                                r="70"
                                fill="none"
                                stroke={scoreColor}
                                strokeWidth="12"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 70}`}
                                initial={{ strokeDashoffset: 2 * Math.PI * 70 }}
                                animate={{
                                    strokeDashoffset:
                                        2 * Math.PI * 70 * (1 - profile.overallScore / 100),
                                }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                        </svg>
                        {/* Score text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <motion.span
                                className="text-4xl font-black"
                                style={{ color: scoreColor }}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 }}
                                data-testid="dna-overall-score"
                            >
                                {profile.overallScore}
                            </motion.span>
                            <span className="text-xs text-[var(--text-muted-high)] uppercase tracking-wider">
                                DNA Score
                            </span>
                        </div>
                    </div>
                </div>

                {/* Dimensions Grid */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted-high)]">
                        Dimension Breakdown
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        {dimensions.map((dim, i) => (
                            <motion.div
                                key={dim.key}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * i }}
                                className="bg-[var(--surface-inset)] rounded-xl p-3"
                                data-testid={`dna-dimension-${dim.key}`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-[var(--text-muted-high)]">
                                        {dim.label}
                                    </span>
                                    <span
                                        className="text-sm font-bold"
                                        style={{ color: dim.color }}
                                    >
                                        {dim.value}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-[var(--surface-overlay)] rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: dim.color }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${dim.value}%` }}
                                        transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Connected Platforms Count */}
                <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--text-muted-high)]">
                            Platforms connected
                        </span>
                        <span className="font-bold text-[var(--text-primary)]">
                            {profile.connectedPlatforms.filter((p) => p.status === "connected").length}{" "}
                            / 9
                        </span>
                    </div>
                </div>
            </div>
        </PrismaticCard>
    );
}
