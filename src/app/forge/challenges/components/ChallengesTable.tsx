"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Zap, Clock, TrendingUp, Filter } from "lucide-react";
import type { Challenge } from "../../lib/types";
import { ChallengeRow } from "./ChallengeRow";
import { forgeEasing } from "../../lib/animations";

interface ChallengesTableProps {
    challenges: Challenge[];
    totalCount: number;
    onClearFilters: () => void;
}

export function ChallengesTable({
    challenges,
    totalCount,
    onClearFilters,
}: ChallengesTableProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: forgeEasing }}
            className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] shadow-sm overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--ember)]/20 to-[var(--gold)]/20 flex items-center justify-center">
                        <Filter size={18} className="text-[var(--ember)]" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-[var(--forge-text-primary)]">
                            All Challenges
                        </h2>
                        <p className="text-xs text-[var(--forge-text-muted)]">
                            {challenges.length} of {totalCount} challenges
                        </p>
                    </div>
                </div>

                {/* Legend */}
                <div className="hidden md:flex items-center gap-4 text-xs text-[var(--forge-text-muted)]">
                    <div className="flex items-center gap-1.5">
                        <Zap size={12} className="text-[var(--gold)]" />
                        <span>XP</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock size={12} />
                        <span>Time</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <TrendingUp size={12} />
                        <span>Success</span>
                    </div>
                </div>
            </div>

            {/* Challenge List */}
            <div className="divide-y divide-[var(--forge-border-subtle)]/50">
                <AnimatePresence mode="popLayout">
                    {challenges.length > 0 ? (
                        challenges.map((challenge, index) => (
                            <ChallengeRow
                                key={challenge.id}
                                challenge={challenge}
                                index={index}
                            />
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-16 px-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--forge-bg-elevated)] to-[var(--ember)]/10 flex items-center justify-center mx-auto mb-4">
                                    <Search size={24} className="text-[var(--forge-text-muted)]" />
                                </div>
                                <h3 className="font-semibold text-[var(--forge-text-primary)] mb-2">
                                    No challenges found
                                </h3>
                                <p className="text-sm text-[var(--forge-text-muted)] mb-6 max-w-sm mx-auto">
                                    We couldn't find any challenges matching your filters. Try adjusting your search criteria.
                                </p>
                                <motion.button
                                    onClick={onClearFilters}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--ember)]/10 text-[var(--ember)] font-medium hover:bg-[var(--ember)]/20 transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    data-testid="clear-filters-btn"
                                >
                                    <Sparkles size={16} />
                                    Clear all filters
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            {challenges.length > 0 && (
                <div className="px-6 py-4 bg-[var(--forge-bg-elevated)]/50 border-t border-[var(--forge-border-subtle)]">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--forge-text-secondary)]">
                            Showing <span className="font-medium text-[var(--forge-text-primary)]">{challenges.length}</span> of{" "}
                            <span className="font-medium text-[var(--forge-text-primary)]">{totalCount}</span> challenges
                        </span>
                        <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[var(--forge-success)]" />
                                Beginner
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[var(--gold)]" />
                                Intermediate
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[var(--forge-error)]" />
                                Advanced
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
