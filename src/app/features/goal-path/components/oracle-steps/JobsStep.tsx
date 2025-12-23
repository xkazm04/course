"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import {
    JobPostingCard,
    JobFilterPanel,
    SkillGapSummary,
} from "../JobMarketCard";
import type { PredictiveJobPosting } from "../../lib/predictiveTypes";

interface JobStepFilters {
    remote?: "no" | "hybrid" | "full" | "any";
    seniorityLevel?: string[];
    minSalary?: number;
}

export interface JobsStepProps {
    jobs: PredictiveJobPosting[];
    filters: JobStepFilters;
    loading: boolean;
    skillGaps: string[];
    onSetFilters: (filters: JobStepFilters) => void;
    onRefresh: () => void;
    onBack: () => void;
    onViewPath: () => void;
    prefersReducedMotion?: boolean | null;
}

export const JobsStep = ({
    jobs,
    filters,
    loading,
    skillGaps,
    onSetFilters,
    onRefresh,
    onBack,
    onViewPath,
    prefersReducedMotion,
}: JobsStepProps) => {
    return (
        <motion.div
            key="jobs"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
            transition={prefersReducedMotion ? { duration: 0 } : undefined}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <button
                        onClick={onBack}
                        data-testid="oracle-jobs-back-btn"
                        className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium transition-colors flex items-center gap-1 mb-2"
                    >
                        <ArrowLeft size={ICON_SIZES.sm} />
                        Back to Insights
                    </button>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                        Matching Job Opportunities
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        {jobs.length} positions match your target profile
                    </p>
                </div>
                <button
                    onClick={onRefresh}
                    disabled={loading}
                    data-testid="oracle-jobs-refresh-btn"
                    className="px-4 py-2 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors flex items-center gap-2"
                >
                    <RefreshCw size={ICON_SIZES.sm} className={cn(loading && !prefersReducedMotion && "animate-spin")} />
                    Refresh
                </button>
            </div>

            {/* Skill Gaps */}
            <SkillGapSummary gaps={skillGaps} onStartLearning={onViewPath} />

            {/* Filters */}
            <JobFilterPanel filters={filters} onChange={onSetFilters} />

            {/* Job List */}
            {loading ? (
                <div className="text-center py-12">
                    <Loader2 size={ICON_SIZES.xl} className={cn("text-indigo-500 mx-auto mb-4", !prefersReducedMotion && "animate-spin")} />
                    <p className="text-slate-600 dark:text-slate-300">Loading jobs...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {jobs.map((job) => (
                        <JobPostingCard key={job.id} job={job} />
                    ))}

                    {jobs.length === 0 && (
                        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                            No jobs match your current filters. Try adjusting your criteria.
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};
