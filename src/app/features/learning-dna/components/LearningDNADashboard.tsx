"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dna, Settings, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { useLearningDNA } from "../lib/useLearningDNA";
import { DNAScoreCard } from "./DNAScoreCard";
import { SkillRadar } from "./SkillRadar";
import { PlatformGrid } from "./PlatformGrid";
import { SignalTimeline } from "./SignalTimeline";

interface LearningDNADashboardProps {
    userId?: string;
    useMockData?: boolean;
    className?: string;
}

/**
 * Learning DNA Dashboard - Main component for the cross-platform learning profile
 */
export function LearningDNADashboard({
    userId = "demo-user",
    useMockData = true,
    className,
}: LearningDNADashboardProps) {
    const {
        profile,
        connections,
        syncStatus,
        isLoading,
        isSyncing,
        error,
        connectPlatform,
        disconnectPlatform,
        syncAll,
        syncPlatform,
        topSkills,
        connectedCount,
    } = useLearningDNA({ userId, useMockData });

    const [showPlatforms, setShowPlatforms] = useState(false);

    if (isLoading) {
        return (
            <div
                className={cn("animate-pulse space-y-6", className)}
                data-testid="dna-dashboard-loading"
            >
                {/* Score Card Skeleton */}
                <div className="h-80 rounded-3xl bg-[var(--surface-elevated)]" />
                {/* Skills Skeleton */}
                <div className="h-64 rounded-3xl bg-[var(--surface-elevated)]" />
            </div>
        );
    }

    return (
        <div className={cn("space-y-6", className)} data-testid="learning-dna-dashboard">
            {/* Error Banner */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 rounded-xl bg-[var(--status-error-bg)] text-[var(--status-error-text)] text-sm"
                        data-testid="dna-error-banner"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <motion.div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{
                            background: `linear-gradient(135deg, var(--color-purple), var(--color-indigo))`,
                        }}
                        whileHover={{ rotate: 10, scale: 1.05 }}
                    >
                        <Dna size={ICON_SIZES.lg} className="text-white" />
                    </motion.div>
                    <div>
                        <h1 className="text-2xl font-black text-[var(--text-primary)]">
                            Learning DNA
                        </h1>
                        <p className="text-sm text-[var(--text-muted-high)]">
                            Your unified developer capability profile
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {profile && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-subtle)]">
                            <Sparkles
                                size={ICON_SIZES.sm}
                                className="text-[var(--color-amber)]"
                            />
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                                Score: {profile.overallScore}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* DNA Score Card */}
                <DNAScoreCard
                    profile={profile}
                    onSync={syncAll}
                    isSyncing={isSyncing}
                />

                {/* Skill Radar */}
                <SkillRadar skills={topSkills} maxSkills={8} />
            </div>

            {/* Signal Timeline */}
            {profile && profile.signals.length > 0 && (
                <SignalTimeline signals={profile.signals} maxSignals={6} />
            )}

            {/* Platform Connections Toggle */}
            <div className="border-t border-[var(--border-subtle)] pt-6">
                <button
                    onClick={() => setShowPlatforms(!showPlatforms)}
                    className={cn(
                        "w-full flex items-center justify-between p-4 rounded-xl",
                        "bg-[var(--surface-elevated)] hover:bg-[var(--surface-overlay)]",
                        "transition-colors border border-[var(--border-default)]"
                    )}
                    data-testid="toggle-platforms-btn"
                >
                    <div className="flex items-center gap-3">
                        <Settings
                            size={ICON_SIZES.md}
                            className="text-[var(--text-secondary)]"
                        />
                        <div className="text-left">
                            <span className="font-medium text-[var(--text-primary)]">
                                Manage Platform Connections
                            </span>
                            <p className="text-xs text-[var(--text-muted-high)]">
                                {connectedCount} platforms connected
                            </p>
                        </div>
                    </div>
                    {showPlatforms ? (
                        <ChevronUp size={ICON_SIZES.md} className="text-[var(--text-muted)]" />
                    ) : (
                        <ChevronDown size={ICON_SIZES.md} className="text-[var(--text-muted)]" />
                    )}
                </button>

                <AnimatePresence>
                    {showPlatforms && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-6">
                                <PlatformGrid
                                    connections={connections}
                                    syncStatus={syncStatus}
                                    onConnect={connectPlatform}
                                    onDisconnect={disconnectPlatform}
                                    onSync={syncPlatform}
                                    onSyncAll={syncAll}
                                    isSyncing={isSyncing}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
