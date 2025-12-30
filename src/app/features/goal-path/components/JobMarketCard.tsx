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
            ? "text-[var(--forge-success)]"
            : job.matchScore >= 60
            ? "text-[var(--forge-warning)]"
            : "text-[var(--forge-error)]";

    const matchBg =
        job.matchScore >= 80
            ? "bg-[var(--forge-success)]/10"
            : job.matchScore >= 60
            ? "bg-[var(--forge-warning)]/10"
            : "bg-[var(--forge-error)]/10";

    const competitionColors = {
        low: "text-[var(--forge-success)] bg-[var(--forge-success)]/10",
        moderate: "text-[var(--forge-warning)] bg-[var(--forge-warning)]/10",
        high: "text-[var(--ember)] bg-[var(--ember)]/10",
        very_high: "text-[var(--forge-error)] bg-[var(--forge-error)]/10",
    };

    return (
        <motion.div
            whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
            data-testid={`job-posting-card-${job.id}`}
            className={cn(
                "p-5 rounded-xl border transition-all",
                "bg-[var(--forge-bg-elevated)]",
                "border-[var(--forge-border-subtle)]",
                "hover:border-[var(--ember)]",
                "hover:shadow-xl hover:shadow-[var(--ember)]/10"
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-lg text-[var(--forge-text-primary)]">
                            {job.title}
                        </h4>
                        <span className="px-2 py-0.5 bg-[var(--forge-bg-anvil)] text-[var(--forge-text-muted)] text-xs rounded-full capitalize">
                            {job.seniorityLevel}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--forge-text-secondary)]">
                        <Building2 size={ICON_SIZES.sm} className="text-[var(--forge-text-muted)]" />
                        <span className="font-medium">{job.company}</span>
                        <span className="text-xs text-[var(--forge-text-muted)] capitalize">
                            ({job.companySize})
                        </span>
                    </div>
                </div>

                {/* Match Score */}
                <div className={cn("px-3 py-2 rounded-xl text-center", matchBg)}>
                    <div className={cn("text-2xl font-black", matchColor)}>{job.matchScore}%</div>
                    <div className="text-xs text-[var(--forge-text-muted)]">Match</div>
                </div>
            </div>

            {/* Location & Salary */}
            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                <div className="flex items-center gap-1 text-[var(--forge-text-secondary)]">
                    <MapPin size={ICON_SIZES.sm} className="text-[var(--forge-text-muted)]" />
                    <span>{job.location.city ? `${job.location.city}, ` : ""}{job.location.country}</span>
                    <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium ml-1",
                        job.location.remote === "full" && "bg-[var(--forge-success)]/10 text-[var(--forge-success)]",
                        job.location.remote === "hybrid" && "bg-[var(--forge-info)]/10 text-[var(--forge-info)]",
                        job.location.remote === "no" && "bg-[var(--forge-bg-anvil)] text-[var(--forge-text-muted)]"
                    )}>
                        {job.location.remote === "full" ? "Remote" : job.location.remote === "hybrid" ? "Hybrid" : "On-site"}
                    </span>
                </div>
                <div className="flex items-center gap-1 text-[var(--forge-text-secondary)]">
                    <DollarSign size={ICON_SIZES.sm} className="text-[var(--forge-success)]" />
                    <span className="font-medium">
                        {job.salary.min && job.salary.max
                            ? `$${(job.salary.min / 1000).toFixed(0)}k - $${(job.salary.max / 1000).toFixed(0)}k`
                            : "Competitive"}
                    </span>
                </div>
            </div>

            {/* Required Skills */}
            <div className="mb-4">
                <div className="text-xs font-medium text-[var(--forge-text-muted)] uppercase tracking-wider mb-2">
                    Required Skills
                </div>
                <div className="flex flex-wrap gap-2">
                    {job.requiredSkills.map((skill) => (
                        <div
                            key={skill.skill}
                            className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
                                job.skillGaps.includes(skill.skill)
                                    ? "bg-[var(--forge-error)]/10 text-[var(--forge-error)] border border-[var(--forge-error)]/30"
                                    : "bg-[var(--forge-success)]/10 text-[var(--forge-success)] border border-[var(--forge-success)]/30"
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
                <div className="mb-4 p-3 bg-[var(--forge-warning)]/10 rounded-lg border border-[var(--forge-warning)]/30">
                    <div className="flex items-center gap-2 text-sm">
                        <Clock size={ICON_SIZES.sm} className="text-[var(--forge-warning)]" />
                        <span className="text-[var(--forge-warning)]">
                            ~{job.estimatedTimeToQualify} weeks to qualify with current skills
                        </span>
                    </div>
                </div>
            )}

            {/* Footer Stats */}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--forge-border-subtle)]">
                <div className="flex items-center gap-4 text-xs text-[var(--forge-text-muted)]">
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
                    className="flex items-center gap-1 text-sm font-medium text-[var(--ember)] hover:text-[var(--ember)]/80 transition-colors"
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
                "bg-[var(--forge-bg-elevated)]",
                "border-[var(--forge-border-subtle)]",
                "hover:border-[var(--forge-info)]",
                "hover:shadow-lg hover:shadow-[var(--forge-info)]/10"
            )}
        >
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h4 className="font-bold text-[var(--forge-text-primary)]">{company.name}</h4>
                    <span className="text-xs text-[var(--forge-text-muted)] capitalize">
                        {company.industry.replace("_", " ")}
                    </span>
                </div>
                {company.employeeRating && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-[var(--forge-warning)]/10 rounded-lg">
                        <span className="text-[var(--forge-warning)]">★</span>
                        <span className="text-sm font-bold text-[var(--forge-warning)]">
                            {company.employeeRating}
                        </span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div>
                    <div className="text-[var(--forge-text-muted)] text-xs">Open Positions</div>
                    <div className="font-bold text-[var(--forge-text-primary)]">{company.openPositions}</div>
                </div>
                <div>
                    <div className="text-[var(--forge-text-muted)] text-xs">Avg. Time to Hire</div>
                    <div className="font-bold text-[var(--forge-text-primary)]">{company.avgTimeToHire} days</div>
                </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
                {company.soughtSkills.slice(0, 3).map((skill) => (
                    <span
                        key={skill}
                        className="px-2 py-0.5 bg-[var(--ember)]/10 text-[var(--ember)] text-xs rounded-full"
                    >
                        {skill}
                    </span>
                ))}
            </div>

            <div className="flex items-center justify-between text-xs">
                <div className={cn(
                    "flex items-center gap-1",
                    company.hiringTrend === "rising" && "text-[var(--forge-success)]",
                    company.hiringTrend === "stable" && "text-[var(--forge-text-muted)]",
                    company.hiringTrend === "declining" && "text-[var(--forge-error)]"
                )}>
                    <TrendingUp size={ICON_SIZES.xs} />
                    <span className="capitalize">{company.hiringTrend} hiring</span>
                </div>
                <div className="flex items-center gap-1 text-[var(--forge-text-muted)]">
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
        <div className="flex flex-wrap items-center gap-4 p-4 bg-[var(--forge-bg-elevated)] rounded-xl">
            {/* Remote Filter */}
            <div>
                <label className="text-xs font-medium text-[var(--forge-text-muted)] uppercase tracking-wider block mb-1">
                    Remote
                </label>
                <select
                    value={filters.remote ?? "any"}
                    onChange={(e) => onChange({ ...filters, remote: e.target.value as "no" | "hybrid" | "full" | "any" })}
                    data-testid="job-filter-remote"
                    className="px-3 py-1.5 bg-[var(--forge-bg-anvil)] border border-[var(--forge-border-subtle)] rounded-lg text-sm text-[var(--forge-text-secondary)]"
                >
                    <option value="any">Any</option>
                    <option value="full">Remote Only</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="no">On-site</option>
                </select>
            </div>

            {/* Min Salary Filter */}
            <div>
                <label className="text-xs font-medium text-[var(--forge-text-muted)] uppercase tracking-wider block mb-1">
                    Min Salary
                </label>
                <select
                    value={filters.minSalary ?? 0}
                    onChange={(e) => onChange({ ...filters, minSalary: Number(e.target.value) })}
                    data-testid="job-filter-salary"
                    className="px-3 py-1.5 bg-[var(--forge-bg-anvil)] border border-[var(--forge-border-subtle)] rounded-lg text-sm text-[var(--forge-text-secondary)]"
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
                className="px-3 py-1.5 text-sm text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] transition-colors"
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
            <div className="p-4 bg-[var(--forge-success)]/10 rounded-xl border border-[var(--forge-success)]/30">
                <div className="flex items-center gap-2 text-[var(--forge-success)]">
                    <CheckCircle size={ICON_SIZES.md} />
                    <span className="font-bold">You have all the skills needed!</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 bg-[var(--forge-warning)]/10 rounded-xl border border-[var(--forge-warning)]/30">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h4 className="font-bold text-[var(--forge-warning)]">Skill Gaps Identified</h4>
                    <p className="text-sm text-[var(--forge-warning)]/80">
                        Learn these {gaps.length} skills to increase your match
                    </p>
                </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
                {gaps.map((skill) => (
                    <span
                        key={skill}
                        className="px-3 py-1 bg-[var(--forge-bg-elevated)] text-[var(--forge-warning)] text-sm font-medium rounded-full border border-[var(--forge-warning)]/30"
                    >
                        {skill}
                    </span>
                ))}
            </div>
            {onStartLearning && (
                <button
                    onClick={onStartLearning}
                    data-testid="skill-gap-start-learning"
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--forge-warning)] hover:bg-[var(--forge-warning)]/90 text-[var(--forge-bg-anvil)] rounded-lg font-medium transition-colors"
                >
                    Start Learning Path
                    <ArrowRight size={ICON_SIZES.sm} />
                </button>
            )}
        </div>
    );
};
