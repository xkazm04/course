"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, BarChart3, Code, Palette, RefreshCw } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { elevation } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { LeaderboardType, SkillTier } from "../lib/types";
import { useLeaderboard } from "../lib/useLeaderboard";
import { LeaderboardEntry, CompactLeaderboardEntry } from "./LeaderboardEntry";
import { TierBadge } from "./TierBadge";

interface LeaderboardProps {
    challengeId: string;
    variant?: "full" | "compact";
    showMetrics?: boolean;
    maxEntries?: number;
}

const TYPE_CONFIG: Record<LeaderboardType, { label: string; icon: React.ElementType }> = {
    overall: { label: "Overall", icon: Trophy },
    performance: { label: "Performance", icon: BarChart3 },
    code_quality: { label: "Code Quality", icon: Code },
    ux: { label: "UX", icon: Palette },
};

const TIER_FILTERS: (SkillTier | "all")[] = ["all", "bronze", "silver", "gold", "platinum", "diamond", "master"];

export const Leaderboard: React.FC<LeaderboardProps> = ({
    challengeId,
    variant = "full",
    showMetrics = true,
    maxEntries,
}) => {
    const [selectedType, setSelectedType] = useState<LeaderboardType>("overall");
    const [selectedTier, setSelectedTier] = useState<SkillTier | "all">("all");

    const {
        entries,
        userEntry,
        isLoading,
        totalParticipants,
        refresh,
    } = useLeaderboard({
        challengeId,
        type: selectedType,
        tierFilter: selectedTier === "all" ? undefined : selectedTier,
        autoRefresh: true,
        refreshInterval: 30000,
    });

    const displayedEntries = maxEntries ? entries.slice(0, maxEntries) : entries;

    if (variant === "compact") {
        return (
            <CompactLeaderboard
                entries={displayedEntries}
                userEntry={userEntry}
                isLoading={isLoading}
            />
        );
    }

    return (
        <div
            className={cn(
                "rounded-xl border border-[var(--forge-border-default)]",
                "bg-[var(--forge-bg-elevated)] overflow-hidden",
                elevation.elevated
            )}
        >
            {/* Header */}
            <div className="p-4 border-b border-[var(--forge-border-subtle)]">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Trophy size={ICON_SIZES.lg} className="text-[var(--forge-warning)]" />
                        <h3 className="text-lg font-semibold text-[var(--forge-text-primary)]">
                            Leaderboard
                        </h3>
                        <span className="text-sm text-[var(--forge-text-muted)]">
                            ({totalParticipants} participants)
                        </span>
                    </div>
                    <button
                        onClick={refresh}
                        className="p-2 rounded-lg hover:bg-[var(--forge-bg-anvil)] text-[var(--forge-text-muted)] transition-colors"
                    >
                        <RefreshCw size={ICON_SIZES.md} className={isLoading ? "animate-spin" : ""} />
                    </button>
                </div>

                {/* Type tabs */}
                <div className="flex gap-1 p-1 rounded-lg bg-[var(--forge-bg-anvil)]">
                    {(Object.keys(TYPE_CONFIG) as LeaderboardType[]).map((type) => {
                        const config = TYPE_CONFIG[type];
                        const Icon = config.icon;
                        return (
                            <button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                                    selectedType === type
                                        ? "bg-[var(--ember)] text-white shadow-ember-sm"
                                        : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                                )}
                            >
                                <Icon size={ICON_SIZES.sm} />
                                <span className="hidden sm:inline">{config.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Tier filter */}
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {TIER_FILTERS.map((tier) => (
                        <button
                            key={tier}
                            onClick={() => setSelectedTier(tier)}
                            className={cn(
                                "px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
                                selectedTier === tier
                                    ? "bg-[var(--ember)] text-white shadow-ember-sm"
                                    : "bg-[var(--forge-bg-workshop)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                            )}
                        >
                            {tier === "all" ? "All Tiers" : (
                                <span className="capitalize">{tier}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Entries */}
            <div className="divide-y divide-[var(--forge-border-subtle)]">
                {isLoading ? (
                    <LoadingState />
                ) : displayedEntries.length === 0 ? (
                    <EmptyState />
                ) : (
                    <AnimatePresence mode="popLayout">
                        {displayedEntries.map((entry) => (
                            <LeaderboardEntry
                                key={entry.userId}
                                entry={entry}
                                isCurrentUser={entry.userId === userEntry?.userId}
                                showMetrics={showMetrics}
                            />
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* User position if not in view */}
            {userEntry && !displayedEntries.find((e) => e.userId === userEntry.userId) && (
                <div className="p-4 border-t border-[var(--forge-border-subtle)] bg-[var(--forge-bg-workshop)]">
                    <p className="text-xs text-[var(--forge-text-muted)] mb-2">Your Position</p>
                    <LeaderboardEntry
                        entry={userEntry}
                        isCurrentUser
                        showMetrics={showMetrics}
                    />
                </div>
            )}
        </div>
    );
};

// Compact leaderboard variant
interface CompactLeaderboardProps {
    entries: ReturnType<typeof useLeaderboard>["entries"];
    userEntry: ReturnType<typeof useLeaderboard>["userEntry"];
    isLoading: boolean;
}

const CompactLeaderboard: React.FC<CompactLeaderboardProps> = ({
    entries,
    userEntry,
    isLoading,
}) => {
    if (isLoading) {
        return (
            <div className="p-4 text-center text-[var(--forge-text-muted)]">
                Loading...
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {entries.map((entry) => (
                <CompactLeaderboardEntry
                    key={entry.userId}
                    entry={entry}
                    isCurrentUser={entry.userId === userEntry?.userId}
                />
            ))}
            {userEntry && !entries.find((e) => e.userId === userEntry.userId) && (
                <>
                    <div className="border-t border-[var(--forge-border-subtle)] my-2" />
                    <CompactLeaderboardEntry entry={userEntry} isCurrentUser />
                </>
            )}
        </div>
    );
};

// Loading state
const LoadingState: React.FC = () => (
    <div className="p-8 text-center">
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block"
        >
            <RefreshCw size={ICON_SIZES.xl} className="text-[var(--forge-text-muted)]" />
        </motion.div>
        <p className="text-[var(--forge-text-muted)] mt-2">Loading leaderboard...</p>
    </div>
);

// Empty state
const EmptyState: React.FC = () => (
    <div className="p-8 text-center">
        <Trophy size={ICON_SIZES.xl} className="text-[var(--forge-text-muted)] mx-auto mb-2" />
        <p className="text-[var(--forge-text-muted)]">No submissions yet</p>
        <p className="text-xs text-[var(--forge-text-muted)] mt-1">Be the first to submit!</p>
    </div>
);
