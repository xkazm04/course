"use client";

/**
 * Project Discovery Component
 *
 * Displays discovered open-source projects with matching scores and learning paths.
 * Allows users to browse and select projects to contribute to.
 */

import React, { useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
    Search,
    Star,
    GitFork,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    Clock,
    Target,
    Sparkles,
    Filter,
    Code,
    Building2,
    TrendingUp,
    ChevronRight,
    Loader2,
} from "lucide-react";
import { PrismaticCard } from "@/app/shared/components";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { ProjectMatch, AnalyzedIssue, SkillLevel } from "../lib/types";

// ============================================================================
// TYPES
// ============================================================================

interface ProjectDiscoveryProps {
    matches: ProjectMatch[];
    recommendations?: {
        nextSteps: AnalyzedIssue[];
        stretchGoals: AnalyzedIssue[];
        partnerOpportunities: AnalyzedIssue[];
    } | null;
    isLoading: boolean;
    onSearch: (filters: SearchFilters) => void;
    onSelectProject: (analyzedIssue: AnalyzedIssue) => void;
    onLoadRecommendations: () => void;
}

interface SearchFilters {
    targetRole: string;
    preferredLanguages: string[];
    weeklyHoursAvailable: number;
    preferredDifficulty?: "beginner" | "intermediate" | "advanced";
    preferPartnerCompanies: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LANGUAGES = [
    "JavaScript",
    "TypeScript",
    "Python",
    "Java",
    "Go",
    "Rust",
    "Ruby",
    "C#",
    "PHP",
    "Swift",
];

const ROLES = [
    { value: "frontend-developer", label: "Frontend Developer" },
    { value: "backend-developer", label: "Backend Developer" },
    { value: "fullstack-developer", label: "Fullstack Developer" },
    { value: "mobile-developer", label: "Mobile Developer" },
    { value: "devops-engineer", label: "DevOps Engineer" },
    { value: "data-engineer", label: "Data Engineer" },
    { value: "ml-engineer", label: "ML Engineer" },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ProjectDiscovery = ({
    matches,
    recommendations,
    isLoading,
    onSearch,
    onSelectProject,
    onLoadRecommendations,
}: ProjectDiscoveryProps) => {
    const prefersReducedMotion = useReducedMotion();

    const [filters, setFilters] = useState<SearchFilters>({
        targetRole: "fullstack-developer",
        preferredLanguages: ["TypeScript", "JavaScript"],
        weeklyHoursAvailable: 10,
        preferPartnerCompanies: false,
    });

    const [showFilters, setShowFilters] = useState(false);
    const [activeTab, setActiveTab] = useState<"search" | "recommended">("recommended");

    const handleSearch = useCallback(() => {
        onSearch(filters);
    }, [filters, onSearch]);

    const toggleLanguage = useCallback((lang: string) => {
        setFilters((prev) => ({
            ...prev,
            preferredLanguages: prev.preferredLanguages.includes(lang)
                ? prev.preferredLanguages.filter((l) => l !== lang)
                : [...prev.preferredLanguages, lang],
        }));
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <PrismaticCard className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={ICON_SIZES.md} className="text-[var(--ember)]" />
                            <span className="text-sm font-medium text-[var(--ember)]">
                                Live Projects
                            </span>
                        </div>
                        <h1 className="text-2xl font-black text-[var(--forge-text-primary)] mb-1">
                            Contribute to Real Open Source
                        </h1>
                        <p className="text-[var(--forge-text-secondary)]">
                            Build your portfolio with real GitHub contributions
                        </p>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        data-testid="toggle-filters-btn"
                        className={cn(
                            "p-2 rounded-xl transition-colors",
                            showFilters
                                ? "bg-[var(--ember)]/10 text-[var(--ember)]"
                                : "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)] hover:bg-[var(--ember)]/10"
                        )}
                    >
                        <Filter size={ICON_SIZES.md} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => {
                            setActiveTab("recommended");
                            onLoadRecommendations();
                        }}
                        data-testid="recommended-tab-btn"
                        className={cn(
                            "px-4 py-2 rounded-xl font-medium transition-all",
                            activeTab === "recommended"
                                ? "bg-gradient-forge text-white shadow-ember-sm"
                                : "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)] hover:bg-[var(--ember)]/10"
                        )}
                    >
                        For You
                    </button>
                    <button
                        onClick={() => setActiveTab("search")}
                        data-testid="search-tab-btn"
                        className={cn(
                            "px-4 py-2 rounded-xl font-medium transition-all",
                            activeTab === "search"
                                ? "bg-gradient-forge text-white shadow-ember-sm"
                                : "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)] hover:bg-[var(--ember)]/10"
                        )}
                    >
                        Search
                    </button>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <motion.div
                        initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-[var(--forge-border-subtle)] pt-4 space-y-4"
                    >
                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--forge-text-secondary)] mb-2">
                                Target Role
                            </label>
                            <select
                                value={filters.targetRole}
                                onChange={(e) =>
                                    setFilters((prev) => ({ ...prev, targetRole: e.target.value }))
                                }
                                data-testid="role-select"
                                className="w-full px-3 py-2 bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] rounded-xl text-[var(--forge-text-primary)]"
                            >
                                {ROLES.map((role) => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Languages */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--forge-text-secondary)] mb-2">
                                Preferred Languages
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {LANGUAGES.map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => toggleLanguage(lang)}
                                        data-testid={`language-${lang.toLowerCase()}-btn`}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg font-medium text-sm transition-all",
                                            filters.preferredLanguages.includes(lang)
                                                ? "bg-[var(--ember)] text-white"
                                                : "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)] hover:bg-[var(--ember)]/10"
                                        )}
                                    >
                                        {lang}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Time Available */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--forge-text-secondary)] mb-2">
                                Weekly Hours Available: {filters.weeklyHoursAvailable}h
                            </label>
                            <input
                                type="range"
                                min="2"
                                max="40"
                                value={filters.weeklyHoursAvailable}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        weeklyHoursAvailable: parseInt(e.target.value),
                                    }))
                                }
                                data-testid="hours-slider"
                                className="w-full"
                            />
                        </div>

                        {/* Difficulty */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--forge-text-secondary)] mb-2">
                                Difficulty
                            </label>
                            <div className="flex gap-2">
                                {["beginner", "intermediate", "advanced"].map((diff) => (
                                    <button
                                        key={diff}
                                        onClick={() =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                preferredDifficulty:
                                                    prev.preferredDifficulty === diff
                                                        ? undefined
                                                        : (diff as "beginner" | "intermediate" | "advanced"),
                                            }))
                                        }
                                        data-testid={`difficulty-${diff}-btn`}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg font-medium text-sm capitalize transition-all",
                                            filters.preferredDifficulty === diff
                                                ? "bg-[var(--ember)] text-white"
                                                : "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)] hover:bg-[var(--ember)]/10"
                                        )}
                                    >
                                        {diff}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Partner Companies Toggle */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        preferPartnerCompanies: !prev.preferPartnerCompanies,
                                    }))
                                }
                                data-testid="partner-toggle-btn"
                                className={cn(
                                    "w-12 h-6 rounded-full transition-colors relative",
                                    filters.preferPartnerCompanies
                                        ? "bg-[var(--ember)]"
                                        : "bg-[var(--forge-bg-anvil)]"
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform",
                                        filters.preferPartnerCompanies
                                            ? "translate-x-6"
                                            : "translate-x-0.5"
                                    )}
                                />
                            </button>
                            <span className="text-sm text-[var(--forge-text-muted)]">
                                Show partner companies only (hiring opportunities)
                            </span>
                        </div>

                        {/* Search Button */}
                        <button
                            onClick={handleSearch}
                            disabled={isLoading}
                            data-testid="search-projects-btn"
                            className="w-full py-3 bg-gradient-forge text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-ember"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={ICON_SIZES.md} className="animate-spin" />
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <Search size={ICON_SIZES.md} />
                                    Find Projects
                                </>
                            )}
                        </button>
                    </motion.div>
                )}
            </PrismaticCard>

            {/* Loading State */}
            {isLoading && (
                <div className="text-center py-12">
                    <Loader2 size={ICON_SIZES.xl} className="mx-auto animate-spin text-[var(--ember)] mb-4" />
                    <p className="text-[var(--forge-text-muted)]">
                        Analyzing projects for the best matches...
                    </p>
                </div>
            )}

            {/* Recommendations Tab */}
            {activeTab === "recommended" && recommendations && !isLoading && (
                <div className="space-y-6">
                    {/* Next Steps */}
                    {recommendations.nextSteps.length > 0 && (
                        <RecommendationSection
                            title="Ready for You"
                            subtitle="Projects matching your current skills"
                            icon={Target}
                            iconColor="text-[var(--forge-success)]"
                            items={recommendations.nextSteps}
                            onSelect={onSelectProject}
                        />
                    )}

                    {/* Stretch Goals */}
                    {recommendations.stretchGoals.length > 0 && (
                        <RecommendationSection
                            title="Stretch Goals"
                            subtitle="Level up with these challenges"
                            icon={TrendingUp}
                            iconColor="text-[var(--gold)]"
                            items={recommendations.stretchGoals}
                            onSelect={onSelectProject}
                        />
                    )}

                    {/* Partner Opportunities */}
                    {recommendations.partnerOpportunities.length > 0 && (
                        <RecommendationSection
                            title="Hiring Partners"
                            subtitle="Companies actively hiring contributors"
                            icon={Building2}
                            iconColor="text-[var(--ember-glow)]"
                            items={recommendations.partnerOpportunities}
                            onSelect={onSelectProject}
                        />
                    )}
                </div>
            )}

            {/* Search Results */}
            {activeTab === "search" && matches.length > 0 && !isLoading && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-[var(--forge-text-primary)]">
                        {matches.length} Matching Projects
                    </h2>
                    {matches.map((match) => (
                        <ProjectMatchCard
                            key={match.analyzedIssue.issue.id}
                            match={match}
                            onSelect={() => onSelectProject(match.analyzedIssue)}
                        />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && activeTab === "search" && matches.length === 0 && (
                <PrismaticCard className="p-8 text-center">
                    <Search size={ICON_SIZES.xl} className="mx-auto text-[var(--forge-text-muted)] mb-4" />
                    <h3 className="text-lg font-bold text-[var(--forge-text-primary)] mb-2">
                        No Projects Found
                    </h3>
                    <p className="text-[var(--forge-text-muted)]">
                        Try adjusting your filters or search for different languages.
                    </p>
                </PrismaticCard>
            )}
        </div>
    );
};

// ============================================================================
// RECOMMENDATION SECTION
// ============================================================================

interface RecommendationSectionProps {
    title: string;
    subtitle: string;
    icon: React.ElementType;
    iconColor: string;
    items: AnalyzedIssue[];
    onSelect: (issue: AnalyzedIssue) => void;
}

const RecommendationSection = ({
    title,
    subtitle,
    icon: Icon,
    iconColor,
    items,
    onSelect,
}: RecommendationSectionProps) => {
    return (
        <PrismaticCard className="p-6">
            <div className="flex items-center gap-2 mb-1">
                <Icon size={ICON_SIZES.md} className={iconColor} />
                <h2 className="text-lg font-bold text-[var(--forge-text-primary)]">{title}</h2>
            </div>
            <p className="text-sm text-[var(--forge-text-muted)] mb-4">{subtitle}</p>

            <div className="space-y-3">
                {items.map((issue) => (
                    <IssueCard key={issue.issue.id} analyzedIssue={issue} onSelect={() => onSelect(issue)} />
                ))}
            </div>
        </PrismaticCard>
    );
};

// ============================================================================
// ISSUE CARD
// ============================================================================

interface IssueCardProps {
    analyzedIssue: AnalyzedIssue;
    onSelect: () => void;
}

const IssueCard = ({ analyzedIssue, onSelect }: IssueCardProps) => {
    const { issue, difficulty, estimatedHours, matchScore } = analyzedIssue;

    return (
        <button
            onClick={onSelect}
            data-testid={`issue-card-${issue.id}`}
            className="w-full p-4 rounded-xl bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] hover:border-[var(--ember)]/50 transition-all text-left group"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    {/* Repo Info */}
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-[var(--ember)]">
                            {issue.repository.fullName}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-[var(--forge-text-muted)]">
                            <Star size={ICON_SIZES.xs} />
                            {issue.repository.stars.toLocaleString()}
                        </div>
                        {issue.repository.isPartner && (
                            <span className="px-1.5 py-0.5 bg-[var(--ember)]/10 text-[var(--ember)] text-xs font-medium rounded">
                                Partner
                            </span>
                        )}
                    </div>

                    {/* Issue Title */}
                    <h3 className="font-semibold text-[var(--forge-text-primary)] truncate group-hover:text-[var(--ember)] transition-colors">
                        {issue.title}
                    </h3>

                    {/* Labels */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {issue.isGoodFirstIssue && (
                            <span className="px-2 py-0.5 bg-[var(--forge-success)]/10 text-[var(--forge-success)] text-xs font-medium rounded-full">
                                Good First Issue
                            </span>
                        )}
                        <span
                            className={cn(
                                "px-2 py-0.5 text-xs font-medium rounded-full",
                                difficulty.overall === "beginner"
                                    ? "bg-[var(--forge-success)]/10 text-[var(--forge-success)]"
                                    : difficulty.overall === "intermediate"
                                    ? "bg-[var(--forge-warning)]/10 text-[var(--forge-warning)]"
                                    : "bg-[var(--forge-error)]/10 text-[var(--forge-error)]"
                            )}
                        >
                            {difficulty.overall}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-[var(--forge-text-muted)]">
                            <Clock size={ICON_SIZES.xs} />
                            {estimatedHours}h
                        </span>
                    </div>
                </div>

                {/* Match Score */}
                <div className="flex flex-col items-center">
                    <div
                        className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold",
                            matchScore >= 80
                                ? "bg-[var(--forge-success)]/10 text-[var(--forge-success)]"
                                : matchScore >= 60
                                ? "bg-[var(--forge-warning)]/10 text-[var(--forge-warning)]"
                                : "bg-[var(--forge-bg-anvil)] text-[var(--forge-text-muted)]"
                        )}
                    >
                        {matchScore}
                    </div>
                    <span className="text-xs text-[var(--forge-text-muted)] mt-1">Match</span>
                </div>
            </div>
        </button>
    );
};

// ============================================================================
// PROJECT MATCH CARD
// ============================================================================

interface ProjectMatchCardProps {
    match: ProjectMatch;
    onSelect: () => void;
}

const ProjectMatchCard = ({ match, onSelect }: ProjectMatchCardProps) => {
    const { analyzedIssue, score, reasons, skillGaps, gapLearningHours } = match;
    const { issue, difficulty, estimatedHours } = analyzedIssue;

    return (
        <PrismaticCard static className="p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                    {/* Repo Info */}
                    <div className="flex items-center gap-2 mb-2">
                        <a
                            href={issue.repository.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid={`repo-link-${issue.id}`}
                            className="flex items-center gap-1 text-sm font-medium text-[var(--ember)] hover:underline"
                        >
                            {issue.repository.fullName}
                            <ExternalLink size={ICON_SIZES.xs} />
                        </a>
                        <div className="flex items-center gap-3 text-xs text-[var(--forge-text-muted)]">
                            <span className="flex items-center gap-1">
                                <Star size={ICON_SIZES.xs} />
                                {issue.repository.stars.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                                <GitFork size={ICON_SIZES.xs} />
                                {issue.repository.forks.toLocaleString()}
                            </span>
                            <span className="px-1.5 py-0.5 bg-[var(--forge-bg-anvil)] rounded">
                                {issue.repository.language}
                            </span>
                        </div>
                    </div>

                    {/* Issue Title */}
                    <h3 className="text-lg font-bold text-[var(--forge-text-primary)] mb-2">
                        {issue.title}
                    </h3>

                    {/* Labels */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {issue.isGoodFirstIssue && (
                            <span className="px-2 py-1 bg-[var(--forge-success)]/10 text-[var(--forge-success)] text-xs font-medium rounded-full flex items-center gap-1">
                                <CheckCircle2 size={ICON_SIZES.xs} />
                                Good First Issue
                            </span>
                        )}
                        <span
                            className={cn(
                                "px-2 py-1 text-xs font-medium rounded-full capitalize",
                                difficulty.overall === "beginner"
                                    ? "bg-[var(--forge-success)]/10 text-[var(--forge-success)]"
                                    : difficulty.overall === "intermediate"
                                    ? "bg-[var(--forge-warning)]/10 text-[var(--forge-warning)]"
                                    : "bg-[var(--forge-error)]/10 text-[var(--forge-error)]"
                            )}
                        >
                            {difficulty.overall}
                        </span>
                        <span className="flex items-center gap-1 px-2 py-1 bg-[var(--forge-bg-anvil)] text-[var(--forge-text-muted)] text-xs font-medium rounded-full">
                            <Clock size={ICON_SIZES.xs} />
                            ~{estimatedHours}h
                        </span>
                    </div>
                </div>

                {/* Match Score */}
                <div className="text-center">
                    <div
                        className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black",
                            score >= 80
                                ? "bg-[var(--forge-success)]/10 text-[var(--forge-success)]"
                                : score >= 60
                                ? "bg-[var(--forge-warning)]/10 text-[var(--forge-warning)]"
                                : "bg-[var(--forge-bg-anvil)] text-[var(--forge-text-muted)]"
                        )}
                    >
                        {score}%
                    </div>
                    <span className="text-xs text-[var(--forge-text-muted)] mt-1">Match</span>
                </div>
            </div>

            {/* Match Reasons */}
            {reasons.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-sm font-medium text-[var(--forge-text-secondary)] mb-2">
                        Why this matches:
                    </h4>
                    <ul className="space-y-1">
                        {reasons.map((reason, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-[var(--forge-text-muted)]">
                                <CheckCircle2 size={ICON_SIZES.sm} className="text-[var(--forge-success)] flex-shrink-0" />
                                {reason.description}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Skill Gaps */}
            {skillGaps.length > 0 && (
                <div className="mb-4 p-3 rounded-xl bg-[var(--forge-warning)]/5 border border-[var(--forge-warning)]/20">
                    <h4 className="flex items-center gap-2 text-sm font-medium text-[var(--forge-warning)] mb-2">
                        <AlertCircle size={ICON_SIZES.sm} />
                        Skills to develop (+{gapLearningHours}h learning)
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {skillGaps.map((gap, i) => (
                            <span
                                key={i}
                                className="px-2 py-1 bg-[var(--forge-warning)]/10 text-[var(--forge-warning)] text-xs font-medium rounded-full"
                            >
                                {gap.skill}: {gap.userLevel} → {gap.requiredLevel}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* CTA */}
            <button
                onClick={onSelect}
                data-testid={`start-project-${issue.id}-btn`}
                className="w-full py-3 bg-gradient-forge text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-ember"
            >
                <Code size={ICON_SIZES.md} />
                Start Contributing
                <ChevronRight size={ICON_SIZES.md} />
            </button>
        </PrismaticCard>
    );
};

export default ProjectDiscovery;
