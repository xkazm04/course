"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Scan,
    Bug,
    AlertTriangle,
    Sparkles,
    Shield,
    Zap,
    FileCode,
    Clock,
    ChevronRight,
    Filter,
    RefreshCw,
    Search,
    Database,
    ExternalLink,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import {
    getApprovedChallenges,
    type ScannedChallenge,
    type GetChallengesOptions,
} from "../lib/remixApi";

// Challenge type configuration
const TYPE_CONFIG = {
    bug: { icon: Bug, color: "text-red-400", bg: "bg-red-500/10", label: "Bug" },
    smell: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", label: "Code Smell" },
    missing_feature: { icon: Sparkles, color: "text-purple-400", bg: "bg-purple-500/10", label: "Missing Feature" },
    security: { icon: Shield, color: "text-red-500", bg: "bg-red-500/20", label: "Security" },
    performance: { icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10", label: "Performance" },
};

const SEVERITY_CONFIG = {
    low: { color: "text-blue-400", bg: "bg-blue-500/10" },
    medium: { color: "text-amber-400", bg: "bg-amber-500/10" },
    high: { color: "text-orange-400", bg: "bg-orange-500/10" },
    critical: { color: "text-red-400", bg: "bg-red-500/10" },
};

const DIFFICULTY_CONFIG = {
    beginner: { color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Beginner" },
    intermediate: { color: "text-amber-400", bg: "bg-amber-500/10", label: "Intermediate" },
    advanced: { color: "text-red-400", bg: "bg-red-500/10", label: "Advanced" },
};

interface ScannedProjectsProps {
    onSelectChallenge?: (challenge: ScannedChallenge) => void;
}

export const ScannedProjects: React.FC<ScannedProjectsProps> = ({ onSelectChallenge }) => {
    const [challenges, setChallenges] = useState<ScannedChallenge[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState<GetChallengesOptions>({});
    const [selectedChallenge, setSelectedChallenge] = useState<ScannedChallenge | null>(null);

    const fetchChallenges = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const result = await getApprovedChallenges(filters);

        if (result.error) {
            setError(result.error);
        } else if (result.data) {
            setChallenges(result.data.challenges);
        }

        setIsLoading(false);
    }, [filters]);

    useEffect(() => {
        fetchChallenges();
    }, [fetchChallenges]);

    // Filter by search query
    const filteredChallenges = challenges.filter((challenge) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            challenge.title.toLowerCase().includes(query) ||
            challenge.description.toLowerCase().includes(query) ||
            challenge.location.file.toLowerCase().includes(query) ||
            challenge.tags?.some((t) => t.toLowerCase().includes(query))
        );
    });

    // Group by project
    const challengesByProject = filteredChallenges.reduce((acc, challenge) => {
        const projectName = challenge.project?.name || "Unknown Project";
        if (!acc[projectName]) {
            acc[projectName] = {
                project: challenge.project,
                challenges: [],
            };
        }
        acc[projectName].challenges.push(challenge);
        return acc;
    }, {} as Record<string, { project: ScannedChallenge["project"]; challenges: ScannedChallenge[] }>);

    const handleSelectChallenge = (challenge: ScannedChallenge) => {
        setSelectedChallenge(challenge);
        onSelectChallenge?.(challenge);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[var(--accent-primary)]/10">
                        <Scan size={ICON_SIZES.lg} className="text-[var(--accent-primary)]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">
                            Scanned Challenges
                        </h2>
                        <p className="text-sm text-[var(--text-muted)]">
                            Real-world issues discovered through automated scanning
                        </p>
                    </div>
                </div>

                <button
                    onClick={fetchChallenges}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface-overlay)] text-[var(--text-secondary)] hover:bg-[var(--surface-base)] transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={ICON_SIZES.sm} className={cn(isLoading && "animate-spin")} />
                    Refresh
                </button>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search
                        size={ICON_SIZES.sm}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search challenges..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--surface-base)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                </div>

                {/* Type Filter */}
                <select
                    value={filters.type || ""}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value as ScannedChallenge["type"] || undefined })}
                    className="px-4 py-2 rounded-lg bg-[var(--surface-base)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                >
                    <option value="">All Types</option>
                    <option value="bug">Bugs</option>
                    <option value="smell">Code Smells</option>
                    <option value="missing_feature">Missing Features</option>
                    <option value="security">Security</option>
                    <option value="performance">Performance</option>
                </select>

                {/* Difficulty Filter */}
                <select
                    value={filters.difficulty || ""}
                    onChange={(e) => setFilters({ ...filters, difficulty: e.target.value as ScannedChallenge["difficulty"] || undefined })}
                    className="px-4 py-2 rounded-lg bg-[var(--surface-base)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                >
                    <option value="">All Difficulties</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                </select>
            </div>

            {/* Error State */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-red-500/10 border border-red-500/20"
                >
                    <p className="text-red-400">{error}</p>
                    <button
                        onClick={fetchChallenges}
                        className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
                    >
                        Try again
                    </button>
                </motion.div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw size={ICON_SIZES.lg} className="animate-spin text-[var(--text-muted)]" />
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && filteredChallenges.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--surface-overlay)] flex items-center justify-center">
                        <Database size={ICON_SIZES.lg} className="text-[var(--text-muted)]" />
                    </div>
                    <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                        No challenges available
                    </h3>
                    <p className="text-[var(--text-muted)] max-w-md mx-auto">
                        {searchQuery
                            ? "No challenges match your search. Try different keywords."
                            : "Scan a codebase with the /remix-scanner skill to generate new challenges."}
                    </p>
                </motion.div>
            )}

            {/* Challenges by Project */}
            {!isLoading && !error && Object.entries(challengesByProject).length > 0 && (
                <div className="space-y-6">
                    {Object.entries(challengesByProject).map(([projectName, { project, challenges }]) => (
                        <div key={projectName} className="space-y-3">
                            {/* Project Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileCode size={ICON_SIZES.sm} className="text-[var(--text-muted)]" />
                                    <h3 className="font-medium text-[var(--text-primary)]">{projectName}</h3>
                                    {project?.language && (
                                        <span className="px-2 py-0.5 rounded text-xs bg-[var(--surface-overlay)] text-[var(--text-muted)]">
                                            {project.language}
                                        </span>
                                    )}
                                    {project?.framework && (
                                        <span className="px-2 py-0.5 rounded text-xs bg-[var(--surface-overlay)] text-[var(--text-muted)]">
                                            {project.framework}
                                        </span>
                                    )}
                                </div>
                                <span className="text-sm text-[var(--text-muted)]">
                                    {challenges.length} challenge{challenges.length !== 1 ? "s" : ""}
                                </span>
                            </div>

                            {/* Challenge Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {challenges.map((challenge) => (
                                    <ChallengeCard
                                        key={challenge.id}
                                        challenge={challenge}
                                        onClick={() => handleSelectChallenge(challenge)}
                                        isSelected={selectedChallenge?.id === challenge.id}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Challenge Detail Modal */}
            <AnimatePresence>
                {selectedChallenge && (
                    <ChallengeDetailModal
                        challenge={selectedChallenge}
                        onClose={() => setSelectedChallenge(null)}
                        onStart={() => {
                            // Handle starting the challenge
                            console.log("Starting challenge:", selectedChallenge.id);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// Challenge Card Component
interface ChallengeCardProps {
    challenge: ScannedChallenge;
    onClick: () => void;
    isSelected?: boolean;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, onClick, isSelected }) => {
    const typeConfig = TYPE_CONFIG[challenge.type];
    const difficultyConfig = DIFFICULTY_CONFIG[challenge.difficulty];
    const TypeIcon = typeConfig.icon;

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={cn(
                "w-full p-4 rounded-xl border text-left transition-colors",
                isSelected
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/5"
                    : "border-[var(--border-default)] bg-[var(--surface-elevated)] hover:border-[var(--border-subtle)]"
            )}
        >
            <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg", typeConfig.bg)}>
                    <TypeIcon size={ICON_SIZES.md} className={typeConfig.color} />
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-[var(--text-primary)] truncate mb-1">
                        {challenge.title}
                    </h4>

                    <div className="flex items-center gap-2 flex-wrap text-xs mb-2">
                        <span className={cn("px-2 py-0.5 rounded", typeConfig.bg, typeConfig.color)}>
                            {typeConfig.label}
                        </span>
                        <span className={cn("px-2 py-0.5 rounded", difficultyConfig.bg, difficultyConfig.color)}>
                            {difficultyConfig.label}
                        </span>
                        {challenge.estimated_minutes && (
                            <span className="flex items-center gap-1 text-[var(--text-muted)]">
                                <Clock size={ICON_SIZES.xs} />
                                {challenge.estimated_minutes}m
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-[var(--text-muted)] line-clamp-2">
                        {challenge.description}
                    </p>
                </div>

                <ChevronRight size={ICON_SIZES.md} className="text-[var(--text-muted)] flex-shrink-0" />
            </div>
        </motion.button>
    );
};

// Challenge Detail Modal
interface ChallengeDetailModalProps {
    challenge: ScannedChallenge;
    onClose: () => void;
    onStart: () => void;
}

const ChallengeDetailModal: React.FC<ChallengeDetailModalProps> = ({ challenge, onClose, onStart }) => {
    const typeConfig = TYPE_CONFIG[challenge.type];
    const severityConfig = SEVERITY_CONFIG[challenge.severity];
    const difficultyConfig = DIFFICULTY_CONFIG[challenge.difficulty];
    const TypeIcon = typeConfig.icon;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 p-4 border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
                    <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-lg", typeConfig.bg)}>
                            <TypeIcon size={ICON_SIZES.lg} className={typeConfig.color} />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                {challenge.title}
                            </h2>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className={cn("px-2 py-0.5 rounded text-xs", typeConfig.bg, typeConfig.color)}>
                                    {typeConfig.label}
                                </span>
                                <span className={cn("px-2 py-0.5 rounded text-xs capitalize", severityConfig.bg, severityConfig.color)}>
                                    {challenge.severity}
                                </span>
                                <span className={cn("px-2 py-0.5 rounded text-xs", difficultyConfig.bg, difficultyConfig.color)}>
                                    {difficultyConfig.label}
                                </span>
                                {challenge.estimated_minutes && (
                                    <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                                        <Clock size={ICON_SIZES.xs} />
                                        ~{challenge.estimated_minutes} minutes
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Description */}
                    <div>
                        <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">
                            Description
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                            {challenge.description}
                        </p>
                    </div>

                    {/* Location */}
                    <div>
                        <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">
                            Location
                        </h3>
                        <code className="text-sm text-[var(--accent-primary)]">
                            {challenge.location.file}:{challenge.location.startLine}-{challenge.location.endLine}
                        </code>
                    </div>

                    {/* Code Snippet */}
                    {challenge.code_snippet && (
                        <div>
                            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">
                                Code
                            </h3>
                            <pre className="p-3 rounded-lg bg-[var(--surface-base)] border border-[var(--border-subtle)] text-xs overflow-x-auto">
                                <code className="text-[var(--text-secondary)]">
                                    {challenge.code_snippet}
                                </code>
                            </pre>
                        </div>
                    )}

                    {/* Instructions */}
                    <div>
                        <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">
                            Instructions
                        </h3>
                        <div className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                            {challenge.user_instructions}
                        </div>
                    </div>

                    {/* Expected Output */}
                    <div>
                        <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">
                            Expected Outcome
                        </h3>
                        <div className="text-sm text-[var(--text-secondary)]">
                            {challenge.expected_output}
                        </div>
                    </div>

                    {/* Tags */}
                    {challenge.tags && challenge.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {challenge.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-2 py-0.5 rounded text-xs bg-[var(--surface-overlay)] text-[var(--text-muted)]"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 p-4 border-t border-[var(--border-subtle)] bg-[var(--surface-elevated)] flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-overlay)] transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={onStart}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white font-medium hover:bg-[var(--accent-primary-hover)] transition-colors"
                    >
                        Start Challenge
                        <ChevronRight size={ICON_SIZES.sm} />
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ScannedProjects;
