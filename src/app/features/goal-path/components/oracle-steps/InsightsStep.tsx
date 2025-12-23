"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Target, Briefcase, TrendingUp, Zap, ChevronRight, Clock, BookOpen, Users, BarChart3 } from "lucide-react";
import { Button } from "@/app/shared/components";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import {
    SkillDemandCard,
    IndustryTrendCard,
    HorizonSelector,
    MarketTimingBadge,
} from "../PredictiveInsights";
import type { PredictionHorizon, SkillDemandPrediction, IndustryTrend, EmergingTechTrend, PredictiveJobPosting, PredictiveLearningPath, EstimatedOutcomes } from "../../lib/predictiveTypes";

export interface InsightsStepPredictions {
    skillDemand: SkillDemandPrediction[];
    industryTrends: IndustryTrend[];
    emergingTech: EmergingTechTrend[];
    matchingJobs: PredictiveJobPosting[];
    suggestedPath: PredictiveLearningPath | null;
}

export interface InsightsStepProps {
    predictions: InsightsStepPredictions;
    horizon: PredictionHorizon;
    onSetHorizon: (horizon: PredictionHorizon) => void;
    onViewPath: () => void;
    onViewJobs: () => void;
    topGrowingSkills: SkillDemandPrediction[];
    recommendedSkills: string[];
    estimatedOutcomes: EstimatedOutcomes;
    prefersReducedMotion?: boolean | null;
}

export const InsightsStep = ({
    predictions,
    horizon,
    onSetHorizon,
    onViewPath,
    onViewJobs,
    topGrowingSkills,
    recommendedSkills,
    estimatedOutcomes,
    prefersReducedMotion,
}: InsightsStepProps) => {
    return (
        <motion.div
            key="insights"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
            transition={prefersReducedMotion ? { duration: 0 } : undefined}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-1">
                        Career Intelligence Report
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        Real-time market analysis for your career path
                    </p>
                </div>
                <HorizonSelector value={horizon} onChange={onSetHorizon} />
            </div>

            {/* Estimated Outcomes - from Live Form */}
            <div className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-cyan-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-cyan-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-4">
                    <BarChart3 size={ICON_SIZES.sm} />
                    Estimated Outcomes
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Clock size={ICON_SIZES.sm} className="text-indigo-500" />
                        </div>
                        <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                            {estimatedOutcomes.totalHours}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Total Hours</div>
                    </div>
                    <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <BookOpen size={ICON_SIZES.sm} className="text-purple-500" />
                        </div>
                        <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                            {estimatedOutcomes.moduleCount}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Modules</div>
                    </div>
                    <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Users size={ICON_SIZES.sm} className="text-emerald-500" />
                        </div>
                        <div className="text-lg font-black text-slate-900 dark:text-slate-100">
                            {estimatedOutcomes.isJobReady ? "Yes" : "In Progress"}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Job Ready</div>
                    </div>
                    <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Target size={ICON_SIZES.sm} className="text-cyan-500" />
                        </div>
                        <div className="text-lg font-black text-slate-900 dark:text-slate-100">
                            {estimatedOutcomes.skillLevel}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Skill Level</div>
                    </div>
                </div>
                {estimatedOutcomes.salaryRange && (
                    <div className="mt-3 text-center text-sm text-slate-600 dark:text-slate-300">
                        Expected salary range: <span className="font-bold">${(estimatedOutcomes.salaryRange.min / 1000).toFixed(0)}k - ${(estimatedOutcomes.salaryRange.max / 1000).toFixed(0)}k</span>
                    </div>
                )}
            </div>

            {/* Market Timing */}
            {predictions.suggestedPath?.marketTiming && (
                <div className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-cyan-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-cyan-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Zap size={ICON_SIZES.lg} className="text-indigo-600 dark:text-indigo-400" />
                            <div>
                                <div className="font-bold text-slate-900 dark:text-slate-100">
                                    Market Timing Recommendation
                                </div>
                                <div className="text-sm text-slate-600 dark:text-slate-300">
                                    {predictions.suggestedPath.marketTiming.reasoning}
                                </div>
                            </div>
                        </div>
                        <MarketTimingBadge
                            recommendation={predictions.suggestedPath.marketTiming.recommendation}
                        />
                    </div>
                </div>
            )}

            {/* Recommended Skills */}
            {recommendedSkills.length > 0 && (
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                        <Sparkles size={ICON_SIZES.md} className="text-amber-500" />
                        Recommended Skills to Learn
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {recommendedSkills.map((skill) => (
                            <span
                                key={skill}
                                className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-medium rounded-lg border border-amber-200 dark:border-amber-800"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Top Growing Skills */}
            <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <TrendingUp size={ICON_SIZES.md} className="text-emerald-500" />
                    Fastest Growing Skills
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {topGrowingSkills.slice(0, 3).map((skill, i) => (
                        <SkillDemandCard
                            key={skill.skillId}
                            prediction={skill}
                            isRecommended={i === 0}
                        />
                    ))}
                </div>
            </div>

            {/* Industry Trends */}
            {predictions.industryTrends.length > 0 && (
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                        <Briefcase size={ICON_SIZES.md} className="text-blue-500" />
                        Industry Outlook
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                        {predictions.industryTrends.slice(0, 2).map((trend) => (
                            <IndustryTrendCard key={trend.sector} trend={trend} />
                        ))}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4 pt-4">
                <Button
                    onClick={onViewPath}
                    size="md"
                    variant="primary"
                    data-testid="oracle-view-path-btn"
                >
                    <Target size={ICON_SIZES.sm} />
                    View Learning Path
                    <ChevronRight size={ICON_SIZES.sm} />
                </Button>
                <Button
                    onClick={onViewJobs}
                    size="md"
                    variant="tertiary"
                    data-testid="oracle-view-jobs-btn"
                >
                    <Briefcase size={ICON_SIZES.sm} />
                    Browse Jobs
                    <ChevronRight size={ICON_SIZES.sm} />
                </Button>
            </div>
        </motion.div>
    );
};
