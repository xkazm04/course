"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Briefcase, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/app/shared/components";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import {
    LearningPathTimeline,
    MilestoneProgressCard,
    MarketTimingCard,
    RiskAssessmentCard,
    AlternativePathsCard,
} from "../LearningPathTimeline";
import type { PredictiveLearningPath } from "../../lib/predictiveTypes";

export interface PathStepProps {
    path: PredictiveLearningPath | null;
    loading: boolean;
    onBack: () => void;
    onViewJobs: () => void;
    prefersReducedMotion?: boolean | null;
}

export const PathStep = ({ path, loading, onBack, onViewJobs, prefersReducedMotion }: PathStepProps) => {
    if (loading || !path) {
        return (
            <motion.div
                key="path-loading"
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={prefersReducedMotion ? { duration: 0 } : undefined}
                className="text-center py-16"
            >
                <Loader2 size={ICON_SIZES.xl} className={cn("text-indigo-500 mx-auto mb-4", !prefersReducedMotion && "animate-spin")} />
                <p className="text-slate-600 dark:text-slate-300">Generating your optimal path...</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            key="path"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
            transition={prefersReducedMotion ? { duration: 0 } : undefined}
            className="space-y-6"
        >
            {/* Back Button */}
            <button
                onClick={onBack}
                data-testid="oracle-path-back-btn"
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium transition-colors flex items-center gap-1"
            >
                <ArrowLeft size={ICON_SIZES.sm} />
                Back to Insights
            </button>

            {/* Learning Path Timeline */}
            <LearningPathTimeline path={path} />

            {/* Milestones & Risk Assessment Side by Side */}
            <div className="grid md:grid-cols-2 gap-4">
                <MilestoneProgressCard milestones={path.milestones} />
                <RiskAssessmentCard assessment={path.riskAssessment} />
            </div>

            {/* Market Timing */}
            <MarketTimingCard advice={path.marketTiming} />

            {/* Alternative Paths */}
            <AlternativePathsCard alternatives={path.alternativePaths} />

            {/* Action */}
            <div className="flex justify-center pt-4">
                <Button
                    onClick={onViewJobs}
                    size="md"
                    variant="primary"
                    data-testid="oracle-path-view-jobs-btn"
                >
                    <Briefcase size={ICON_SIZES.sm} />
                    View Matching Jobs
                    <ChevronRight size={ICON_SIZES.sm} />
                </Button>
            </div>
        </motion.div>
    );
};
