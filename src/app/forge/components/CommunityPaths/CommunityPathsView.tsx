"use client";

import { motion } from "framer-motion";
import { Users, Sparkles } from "lucide-react";
import { PathFilters } from "./PathFilters";
import { PathsTable } from "./PathsTable";
import { useCommunityPaths } from "../../lib/useCommunityPaths";

export function CommunityPathsView() {
    // Use real database data - fetches from /api/community-paths
    const { paths, isLoading, filters, setFilter } = useCommunityPaths({ useMockData: false });

    return (
        <section className="py-12 pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--ember)]/10 border border-[var(--ember)]/20 mb-6">
                        <Users size={16} className="text-[var(--ember)]" />
                        <span className="text-sm text-[var(--forge-text-secondary)]">
                            Community Learning Paths
                        </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                        Explore{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--ember)] via-[var(--gold)] to-[var(--ember-glow)]">
                            Learning Paths
                        </span>
                    </h1>
                    <p className="text-lg text-[var(--forge-text-secondary)] max-w-2xl mx-auto">
                        Discover curated and AI-generated learning paths from our community.
                        <span className="text-[var(--gold)]"> Enroll</span> to start your journey.
                    </p>
                </motion.div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <PathFilters filters={filters} onFilterChange={setFilter} />
                </motion.div>

                {/* Results count */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center justify-between mb-4"
                >
                    <p className="text-sm text-[var(--forge-text-muted)]">
                        Showing <span className="text-[var(--forge-text-primary)] font-medium">{paths.length}</span> paths
                    </p>
                    {paths.some((p) => p.pathType === "ai_generated") && (
                        <div className="flex items-center gap-1.5 text-xs text-[var(--gold)]">
                            <Sparkles size={12} />
                            <span>AI-generated paths available</span>
                        </div>
                    )}
                </motion.div>

                {/* Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <PathsTable paths={paths} isLoading={isLoading} />
                </motion.div>
            </div>
        </section>
    );
}
