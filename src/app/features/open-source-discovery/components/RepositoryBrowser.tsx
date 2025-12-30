"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Star,
    Users,
    Clock,
    GitBranch,
    ExternalLink,
    Eye,
    EyeOff,
    Search,
    BookOpen,
    Shield,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { elevation } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { PartnerRepository, FRIENDLINESS_CONFIG } from "../lib/types";

interface RepositoryBrowserProps {
    repositories: PartnerRepository[];
    watchedRepositoryIds: string[];
    onToggleWatch: (repoId: string) => void;
    onSelectRepository: (repo: PartnerRepository) => void;
    selectedRepositoryId?: string;
}

export const RepositoryBrowser: React.FC<RepositoryBrowserProps> = ({
    repositories,
    watchedRepositoryIds,
    onToggleWatch,
    onSelectRepository,
    selectedRepositoryId,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterFriendliness, setFilterFriendliness] = useState<string | null>(null);

    const filteredRepos = repositories.filter(repo => {
        const matchesSearch = searchQuery === "" ||
            repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            repo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            repo.languages.some(l => l.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesFriendliness = !filterFriendliness ||
            repo.learnerFriendliness === filterFriendliness;

        return matchesSearch && matchesFriendliness;
    });

    return (
        <div className="space-y-4">
            {/* Search and filters */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search
                        size={ICON_SIZES.sm}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--forge-text-muted)]"
                    />
                    <input
                        type="text"
                        placeholder="Search repositories..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className={cn(
                            "w-full pl-9 pr-4 py-2 rounded-lg",
                            "bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-default)]",
                            "text-[var(--forge-text-primary)] placeholder:text-[var(--forge-text-muted)]",
                            "focus:outline-none focus:ring-2 focus:ring-[var(--ember)]/50"
                        )}
                    />
                </div>
                <div className="flex gap-2">
                    {(["beginner", "intermediate", "advanced"] as const).map(level => (
                        <motion.button
                            key={level}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setFilterFriendliness(
                                filterFriendliness === level ? null : level
                            )}
                            className={cn(
                                "px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                                filterFriendliness === level
                                    ? `bg-${FRIENDLINESS_CONFIG[level].color}-500/20 text-${FRIENDLINESS_CONFIG[level].color}-400`
                                    : "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                            )}
                        >
                            {FRIENDLINESS_CONFIG[level].label}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Repository grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                    {filteredRepos.map(repo => (
                        <RepositoryCard
                            key={repo.id}
                            repository={repo}
                            isWatched={watchedRepositoryIds.includes(repo.id)}
                            isSelected={selectedRepositoryId === repo.id}
                            onToggleWatch={() => onToggleWatch(repo.id)}
                            onSelect={() => onSelectRepository(repo)}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {filteredRepos.length === 0 && (
                <div className="text-center py-12 text-[var(--forge-text-muted)]">
                    <Search size={ICON_SIZES.xl} className="mx-auto mb-3 opacity-50" />
                    <p>No repositories match your search</p>
                </div>
            )}
        </div>
    );
};

// Repository card sub-component
interface RepositoryCardProps {
    repository: PartnerRepository;
    isWatched: boolean;
    isSelected: boolean;
    onToggleWatch: () => void;
    onSelect: () => void;
}

const RepositoryCard: React.FC<RepositoryCardProps> = ({
    repository,
    isWatched,
    isSelected,
    onToggleWatch,
    onSelect,
}) => {
    const friendlinessConfig = FRIENDLINESS_CONFIG[repository.learnerFriendliness];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
                "rounded-xl border overflow-hidden transition-colors",
                isSelected
                    ? "border-[var(--ember)] bg-[var(--ember)]/5"
                    : "border-[var(--forge-border-default)] bg-[var(--forge-bg-elevated)]",
                elevation.hoverable
            )}
        >
            {/* Header */}
            <div className="p-4 cursor-pointer" onClick={onSelect}>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-[var(--forge-text-muted)]">
                                {repository.owner}
                            </span>
                            <FriendlinessBadge level={repository.learnerFriendliness} />
                        </div>
                        <h3 className="font-semibold text-[var(--forge-text-primary)] truncate">
                            {repository.name}
                        </h3>
                        <p className="text-sm text-[var(--forge-text-secondary)] line-clamp-2 mt-1">
                            {repository.description}
                        </p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={e => {
                            e.stopPropagation();
                            onToggleWatch();
                        }}
                        className={cn(
                            "p-2 rounded-lg transition-colors",
                            isWatched
                                ? "bg-[var(--ember)]/20 text-[var(--ember)]"
                                : "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                        )}
                    >
                        {isWatched ? (
                            <Eye size={ICON_SIZES.md} />
                        ) : (
                            <EyeOff size={ICON_SIZES.md} />
                        )}
                    </motion.button>
                </div>

                {/* Languages */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                    {repository.languages.slice(0, 4).map(lang => (
                        <span
                            key={lang}
                            className="px-2 py-0.5 rounded text-xs bg-[var(--forge-bg-anvil)] text-[var(--forge-text-secondary)]"
                        >
                            {lang}
                        </span>
                    ))}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-3 text-xs text-[var(--forge-text-muted)]">
                    <span className="flex items-center gap-1">
                        <Star size={ICON_SIZES.xs} className="text-[var(--forge-warning)]" />
                        {formatNumber(repository.stars)}
                    </span>
                    <span className="flex items-center gap-1">
                        <Users size={ICON_SIZES.xs} />
                        {repository.activeContributors} contributors
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock size={ICON_SIZES.xs} />
                        ~{repository.avgResponseTime}h response
                    </span>
                </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--forge-border-subtle)] bg-[var(--forge-bg-workshop)]">
                {repository.mentorshipAvailable && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-[var(--forge-success)]/20 text-[var(--forge-success)]">
                        <Shield size={ICON_SIZES.xs} />
                        Mentorship
                    </span>
                )}
                {repository.contributingGuidelinesUrl && (
                    <a
                        href={repository.contributingGuidelinesUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] transition-colors"
                        onClick={e => e.stopPropagation()}
                    >
                        <BookOpen size={ICON_SIZES.xs} />
                        Contributing Guide
                    </a>
                )}
                <a
                    href={repository.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto flex items-center gap-1 text-xs text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] transition-colors"
                    onClick={e => e.stopPropagation()}
                >
                    <GitBranch size={ICON_SIZES.xs} />
                    View on GitHub
                    <ExternalLink size={ICON_SIZES.xs} />
                </a>
            </div>
        </motion.div>
    );
};

// Friendliness badge sub-component
interface FriendlinessBadgeProps {
    level: PartnerRepository["learnerFriendliness"];
}

const FriendlinessBadge: React.FC<FriendlinessBadgeProps> = ({ level }) => {
    const config = FRIENDLINESS_CONFIG[level];
    const colorClasses = {
        emerald: "bg-[var(--forge-success)]/20 text-[var(--forge-success)]",
        amber: "bg-[var(--forge-warning)]/20 text-[var(--forge-warning)]",
        purple: "bg-[var(--ember)]/20 text-[var(--ember)]",
    };

    return (
        <span className={cn(
            "px-1.5 py-0.5 rounded text-xs font-medium",
            colorClasses[config.color as keyof typeof colorClasses]
        )}>
            {config.label}
        </span>
    );
};

function formatNumber(num: number): string {
    if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
}
