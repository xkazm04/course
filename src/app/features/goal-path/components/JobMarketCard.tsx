"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
    Building2,
    MapPin,
    DollarSign,
    Clock,
    Users,
    TrendingUp,
    ExternalLink,
    CheckCircle,
    XCircle,
    ArrowRight,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { PredictiveJobPosting, CompanyInsight } from "../lib/predictiveTypes";

// ============================================================================
// JOB POSTING CARD
// ============================================================================

interface JobPostingCardProps {
    job: PredictiveJobPosting;
    onViewDetails?: () => void;
    showSkillGaps?: boolean;
}

export const JobPostingCard = ({
    job,
    onViewDetails,
    showSkillGaps = true,
}: JobPostingCardProps) => {
    const prefersReducedMotion = useReducedMotion();
    const matchColor =
        job.matchScore >= 80
            ? "text-emerald-600 dark:text-emerald-400"
            : job.matchScore >= 60
            ? "text-amber-600 dark:text-amber-400"
            : "text-red-600 dark:text-red-400";

    const matchBg =
        job.matchScore >= 80
            ? "bg-emerald-50 dark:bg-emerald-900/20"
            : job.matchScore >= 60
            ? "bg-amber-50 dark:bg-amber-900/20"
            : "bg-red-50 dark:bg-red-900/20";

    const competitionColors = {
        low: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30",
        moderate: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30",
        high: "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30",
        very_high: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30",
    };

    return (
        <motion.div
            whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
            data-testid={`job-posting-card-${job.id}`}
            className={cn(
                "p-5 rounded-xl border transition-all",
                "bg-white dark:bg-slate-800/50",
                "border-slate-200 dark:border-slate-700",
                "hover:border-indigo-400 dark:hover:border-indigo-500",
                "hover:shadow-xl hover:shadow-indigo-100/30 dark:hover:shadow-indigo-900/20"
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                            {job.title}
                        </h4>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs rounded-full capitalize">
                            {job.seniorityLevel}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Building2 size={ICON_SIZES.sm} className="text-slate-400" />
                        <span className="font-medium">{job.company}</span>
                        <span className="text-xs text-slate-400 capitalize">
                            ({job.companySize})
                        </span>
                    </div>
                </div>

                {/* Match Score */}
                <div className={cn("px-3 py-2 rounded-xl text-center", matchBg)}>
                    <div className={cn("text-2xl font-black", matchColor)}>{job.matchScore}%</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Match</div>
                </div>
            </div>

            {/* Location & Salary */}
            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    <MapPin size={ICON_SIZES.sm} className="text-slate-400" />
                    <span>{job.location.city ? `${job.location.city}, ` : ""}{job.location.country}</span>
                    <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium ml-1",
                        job.location.remote === "full" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                        job.location.remote === "hybrid" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                        job.location.remote === "no" && "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                    )}>
                        {job.location.remote === "full" ? "Remote" : job.location.remote === "hybrid" ? "Hybrid" : "On-site"}
                    </span>
                </div>
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    <DollarSign size={ICON_SIZES.sm} className="text-emerald-500" />
                    <span className="font-medium">
                        {job.salary.min && job.salary.max
                            ? `$${(job.salary.min / 1000).toFixed(0)}k - $${(job.salary.max / 1000).toFixed(0)}k`
                            : "Competitive"}
                    </span>
                </div>
            </div>

            {/* Required Skills */}
            <div className="mb-4">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Required Skills
                </div>
                <div className="flex flex-wrap gap-2">
                    {job.requiredSkills.map((skill) => (
                        <div
                            key={skill.skill}
                            className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
                                job.skillGaps.includes(skill.skill)
                                    ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                            )}
                        >
                            {job.skillGaps.includes(skill.skill) ? (
                                <XCircle size={ICON_SIZES.xs} />
                            ) : (
                                <CheckCircle size={ICON_SIZES.xs} />
                            )}
                            {skill.skill}
                        </div>
                    ))}
                </div>
            </div>

            {/* Skill Gaps Warning */}
            {showSkillGaps && job.skillGaps.length > 0 && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 text-sm">
                        <Clock size={ICON_SIZES.sm} className="text-amber-600 dark:text-amber-400" />
                        <span className="text-amber-800 dark:text-amber-300">
                            ~{job.estimatedTimeToQualify} weeks to qualify with current skills
                        </span>
                    </div>
                </div>
            )}

            {/* Footer Stats */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    {job.applicantCount && (
                        <div className="flex items-center gap-1">
                            <Users size={ICON_SIZES.xs} />
                            <span>{job.applicantCount} applicants</span>
                        </div>
                    )}
                    <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full", competitionColors[job.competitionLevel])}>
                        <TrendingUp size={ICON_SIZES.xs} />
                        <span className="capitalize">{job.competitionLevel.replace("_", " ")} competition</span>
                    </div>
                </div>
                <button
                    onClick={onViewDetails}
                    data-testid={`job-view-details-${job.id}`}
                    className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                    View Details
                    <ExternalLink size={ICON_SIZES.sm} />
                </button>
            </div>
        </motion.div>
    );
};

// ============================================================================
// COMPANY INSIGHT CARD
// ============================================================================

interface CompanyInsightCardProps {
    company: CompanyInsight;
    onClick?: () => void;
}

export const CompanyInsightCard = ({ company, onClick }: CompanyInsightCardProps) => {
    const prefersReducedMotion = useReducedMotion();
    return (
        <motion.div
            whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
            onClick={onClick}
            data-testid={`company-insight-card-${company.name.toLowerCase().replace(/\s+/g, '-')}`}
            className={cn(
                "p-4 rounded-xl border cursor-pointer transition-all",
                "bg-white dark:bg-slate-800/50",
                "border-slate-200 dark:border-slate-700",
                "hover:border-cyan-400 dark:hover:border-cyan-500",
                "hover:shadow-lg hover:shadow-cyan-100/50 dark:hover:shadow-cyan-900/20"
            )}
        >
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">{company.name}</h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                        {company.industry.replace("_", " ")}
                    </span>
                </div>
                {company.employeeRating && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <span className="text-amber-500">★</span>
                        <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                            {company.employeeRating}
                        </span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div>
                    <div className="text-slate-500 dark:text-slate-400 text-xs">Open Positions</div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">{company.openPositions}</div>
                </div>
                <div>
                    <div className="text-slate-500 dark:text-slate-400 text-xs">Avg. Time to Hire</div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">{company.avgTimeToHire} days</div>
                </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
                {company.soughtSkills.slice(0, 3).map((skill) => (
                    <span
                        key={skill}
                        className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs rounded-full"
                    >
                        {skill}
                    </span>
                ))}
            </div>

            <div className="flex items-center justify-between text-xs">
                <div className={cn(
                    "flex items-center gap-1",
                    company.hiringTrend === "rising" && "text-emerald-600 dark:text-emerald-400",
                    company.hiringTrend === "stable" && "text-slate-600 dark:text-slate-400",
                    company.hiringTrend === "declining" && "text-red-600 dark:text-red-400"
                )}>
                    <TrendingUp size={ICON_SIZES.xs} />
                    <span className="capitalize">{company.hiringTrend} hiring</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    Interview difficulty:
                    <span className="font-bold">
                        {"●".repeat(company.interviewDifficulty)}
                        {"○".repeat(5 - company.interviewDifficulty)}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

// ============================================================================
// JOB FILTER PANEL
// ============================================================================

interface JobFilters {
    remote?: "no" | "hybrid" | "full" | "any";
    seniorityLevel?: string[];
    minSalary?: number;
}

interface JobFilterPanelProps {
    filters: JobFilters;
    onChange: (filters: JobFilters) => void;
}

export const JobFilterPanel = ({ filters, onChange }: JobFilterPanelProps) => {
    return (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            {/* Remote Filter */}
            <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Remote
                </label>
                <select
                    value={filters.remote ?? "any"}
                    onChange={(e) => onChange({ ...filters, remote: e.target.value as "no" | "hybrid" | "full" | "any" })}
                    data-testid="job-filter-remote"
                    className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200"
                >
                    <option value="any">Any</option>
                    <option value="full">Remote Only</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="no">On-site</option>
                </select>
            </div>

            {/* Min Salary Filter */}
            <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Min Salary
                </label>
                <select
                    value={filters.minSalary ?? 0}
                    onChange={(e) => onChange({ ...filters, minSalary: Number(e.target.value) })}
                    data-testid="job-filter-salary"
                    className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200"
                >
                    <option value={0}>Any</option>
                    <option value={100000}>$100k+</option>
                    <option value={150000}>$150k+</option>
                    <option value={200000}>$200k+</option>
                </select>
            </div>

            {/* Clear Filters */}
            <button
                onClick={() => onChange({})}
                data-testid="job-filter-clear"
                className="px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
                Clear filters
            </button>
        </div>
    );
};

// ============================================================================
// SKILL GAP SUMMARY
// ============================================================================

interface SkillGapSummaryProps {
    gaps: string[];
    onStartLearning?: () => void;
}

export const SkillGapSummary = ({ gaps, onStartLearning }: SkillGapSummaryProps) => {
    if (gaps.length === 0) {
        return (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle size={ICON_SIZES.md} />
                    <span className="font-bold">You have all the skills needed!</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h4 className="font-bold text-amber-800 dark:text-amber-300">Skill Gaps Identified</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                        Learn these {gaps.length} skills to increase your match
                    </p>
                </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
                {gaps.map((skill) => (
                    <span
                        key={skill}
                        className="px-3 py-1 bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 text-sm font-medium rounded-full border border-amber-300 dark:border-amber-700"
                    >
                        {skill}
                    </span>
                ))}
            </div>
            {onStartLearning && (
                <button
                    onClick={onStartLearning}
                    data-testid="skill-gap-start-learning"
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
                >
                    Start Learning Path
                    <ArrowRight size={ICON_SIZES.sm} />
                </button>
            )}
        </div>
    );
};
