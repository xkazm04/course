"use client";

import React from "react";
import Link from "next/link";
import {
    Hammer,
    Github,
    Target,
    Users,
    Trophy,
    ArrowRight,
    Zap,
    BookOpen,
    GitPullRequest,
    Star,
    ChevronRight,
    Flame,
    TrendingUp,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { useForge } from "./layout";
import { mockProjects, mockChallenges, mockLeaderboard } from "./lib/mockData";

// ============================================================================
// HERO SECTION
// ============================================================================

function HeroSection() {
    const { isNewUser } = useForge();

    return (
        <section className="relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-amber-500/5" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
                <div className="text-center max-w-4xl mx-auto">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface-elevated)] border border-[var(--border-default)] mb-6">
                        <Zap size={16} className="text-amber-500" />
                        <span className="text-sm text-[var(--text-secondary)]">
                            Learn by Building Real Software
                        </span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] mb-6">
                        Build Open-Source{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                            SaaS Alternatives
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-lg sm:text-xl text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
                        Learn software development by contributing to real projects.
                        Build clones of popular SaaS products, get AI-powered code reviews,
                        and prove your skills with merged PRs.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        {isNewUser ? (
                            <>
                                <Link
                                    href="/forge/onboarding"
                                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium hover:opacity-90 transition-opacity"
                                >
                                    Start Your Journey
                                    <ArrowRight size={18} />
                                </Link>
                                <Link
                                    href="/forge/projects"
                                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium hover:bg-[var(--surface-overlay)] transition-colors"
                                >
                                    Explore Projects
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/forge/dashboard"
                                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium hover:opacity-90 transition-opacity"
                                >
                                    Continue Learning
                                    <ArrowRight size={18} />
                                </Link>
                                <Link
                                    href="/forge/challenges"
                                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium hover:bg-[var(--surface-overlay)] transition-colors"
                                >
                                    Find Challenges
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap items-center justify-center gap-8 mt-12 pt-8 border-t border-[var(--border-subtle)]">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[var(--text-primary)]">15+</div>
                            <div className="text-sm text-[var(--text-muted)]">Active Projects</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[var(--text-primary)]">500+</div>
                            <div className="text-sm text-[var(--text-muted)]">Challenges</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[var(--text-primary)]">2,400+</div>
                            <div className="text-sm text-[var(--text-muted)]">Contributors</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[var(--text-primary)]">8,500+</div>
                            <div className="text-sm text-[var(--text-muted)]">PRs Merged</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// HOW IT WORKS
// ============================================================================

function HowItWorksSection() {
    const steps = [
        {
            icon: BookOpen,
            title: "Assess Your Skills",
            description: "Take a quick assessment to understand your current level and get personalized project recommendations.",
        },
        {
            icon: Target,
            title: "Pick a Challenge",
            description: "Choose from hundreds of real coding tasks - from beginner-friendly bugs to complex features.",
        },
        {
            icon: Github,
            title: "Code & Submit PR",
            description: "Fork the project, implement your solution, and submit a real pull request to the repository.",
        },
        {
            icon: Zap,
            title: "Get AI Review",
            description: "Receive instant, detailed feedback from our AI tutor on code quality, patterns, and improvements.",
        },
        {
            icon: GitPullRequest,
            title: "Merge & Level Up",
            description: "Get your PR merged, earn XP, and build a verified portfolio of open-source contributions.",
        },
    ];

    return (
        <section className="py-16 bg-[var(--surface-elevated)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
                        How OpenForge Works
                    </h2>
                    <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
                        A structured path from learner to contributor, with AI guidance every step of the way.
                    </p>
                </div>

                <div className="grid md:grid-cols-5 gap-4">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <div key={index} className="relative">
                                <div className="bg-[var(--surface-base)] rounded-xl p-6 h-full border border-[var(--border-default)]">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
                                            <Icon size={20} className="text-orange-500" />
                                        </div>
                                        <span className="text-sm font-medium text-[var(--text-muted)]">
                                            Step {index + 1}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                                        {step.title}
                                    </h3>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        {step.description}
                                    </p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                                        <ChevronRight size={16} className="text-[var(--text-muted)]" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// FEATURED PROJECTS
// ============================================================================

function FeaturedProjectsSection() {
    return (
        <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                            Featured Projects
                        </h2>
                        <p className="text-[var(--text-secondary)]">
                            Build open-source alternatives to popular SaaS products
                        </p>
                    </div>
                    <Link
                        href="/forge/projects"
                        className="flex items-center gap-1 text-sm font-medium text-[var(--accent-primary)] hover:underline"
                    >
                        View All
                        <ChevronRight size={16} />
                    </Link>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {mockProjects.map((project) => (
                        <Link
                            key={project.id}
                            href={`/forge/projects/${project.slug}`}
                            className="group bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] overflow-hidden hover:border-[var(--accent-primary)] transition-colors"
                        >
                            {/* Project Header */}
                            <div className="p-4 border-b border-[var(--border-subtle)]">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center flex-shrink-0">
                                        <Hammer size={24} className="text-orange-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-primary)] transition-colors">
                                            {project.name}
                                        </h3>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            {project.targetProduct} alternative
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Project Body */}
                            <div className="p-4">
                                <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2">
                                    {project.tagline}
                                </p>

                                {/* Progress bar */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-[var(--text-muted)]">Feature Parity</span>
                                        <span className="font-medium text-[var(--text-primary)]">
                                            {project.featureParityPercent}%
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full bg-[var(--surface-overlay)]">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                                            style={{ width: `${project.featureParityPercent}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                                    <span className="flex items-center gap-1">
                                        <Users size={12} />
                                        {project.contributorCount}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Target size={12} />
                                        {project.openChallenges} open
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Star size={12} />
                                        {project.starCount}
                                    </span>
                                </div>
                            </div>

                            {/* Tech stack */}
                            <div className="px-4 pb-4">
                                <div className="flex flex-wrap gap-1">
                                    {project.techStack.slice(0, 3).map((tech) => (
                                        <span
                                            key={tech}
                                            className="px-2 py-0.5 rounded text-xs bg-[var(--surface-overlay)] text-[var(--text-muted)]"
                                        >
                                            {tech}
                                        </span>
                                    ))}
                                    {project.techStack.length > 3 && (
                                        <span className="px-2 py-0.5 rounded text-xs bg-[var(--surface-overlay)] text-[var(--text-muted)]">
                                            +{project.techStack.length - 3}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// RECENT CHALLENGES
// ============================================================================

function RecentChallengesSection() {
    const difficultyColors = {
        beginner: "text-emerald-500 bg-emerald-500/10",
        intermediate: "text-amber-500 bg-amber-500/10",
        advanced: "text-rose-500 bg-rose-500/10",
    };

    const typeIcons = {
        bug: "🐛",
        feature: "✨",
        refactor: "🔧",
        test: "🧪",
        docs: "📚",
        performance: "⚡",
        security: "🔒",
    };

    return (
        <section className="py-16 bg-[var(--surface-elevated)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                            Recent Challenges
                        </h2>
                        <p className="text-[var(--text-secondary)]">
                            Jump into a task and start coding
                        </p>
                    </div>
                    <Link
                        href="/forge/challenges"
                        className="flex items-center gap-1 text-sm font-medium text-[var(--accent-primary)] hover:underline"
                    >
                        Browse All
                        <ChevronRight size={16} />
                    </Link>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mockChallenges.slice(0, 6).map((challenge) => (
                        <Link
                            key={challenge.id}
                            href={`/forge/challenges/${challenge.id}`}
                            className="group bg-[var(--surface-base)] rounded-xl border border-[var(--border-default)] p-4 hover:border-[var(--accent-primary)] transition-colors"
                        >
                            <div className="flex items-start gap-3">
                                <div className="text-2xl">{typeIcons[challenge.type]}</div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span
                                            className={cn(
                                                "px-2 py-0.5 rounded text-xs font-medium capitalize",
                                                difficultyColors[challenge.difficulty]
                                            )}
                                        >
                                            {challenge.difficulty}
                                        </span>
                                        <span className="text-xs text-[var(--text-muted)]">
                                            ~{challenge.estimatedMinutes}min
                                        </span>
                                    </div>
                                    <h3 className="font-medium text-[var(--text-primary)] mb-1 group-hover:text-[var(--accent-primary)] transition-colors">
                                        {challenge.title}
                                    </h3>
                                    <p className="text-xs text-[var(--text-muted)] mb-2">
                                        {challenge.projectName}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-amber-500">
                                                +{challenge.xpReward} XP
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {challenge.tags.slice(0, 2).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="px-1.5 py-0.5 rounded text-xs bg-[var(--surface-overlay)] text-[var(--text-muted)]"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// LEADERBOARD PREVIEW
// ============================================================================

function LeaderboardPreviewSection() {
    return (
        <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Leaderboard */}
                    <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] overflow-hidden">
                        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Trophy size={20} className="text-amber-500" />
                                <h3 className="font-semibold text-[var(--text-primary)]">
                                    Top Contributors
                                </h3>
                            </div>
                            <Link
                                href="/forge/leaderboard"
                                className="text-sm text-[var(--accent-primary)] hover:underline"
                            >
                                View All
                            </Link>
                        </div>
                        <div className="divide-y divide-[var(--border-subtle)]">
                            {mockLeaderboard.slice(0, 5).map((entry) => (
                                <div
                                    key={entry.userId}
                                    className="flex items-center gap-4 p-4 hover:bg-[var(--surface-overlay)] transition-colors"
                                >
                                    <div
                                        className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                                            entry.rank === 1 && "bg-amber-500/20 text-amber-500",
                                            entry.rank === 2 && "bg-gray-400/20 text-gray-400",
                                            entry.rank === 3 && "bg-orange-600/20 text-orange-600",
                                            entry.rank > 3 && "bg-[var(--surface-overlay)] text-[var(--text-muted)]"
                                        )}
                                    >
                                        {entry.rank}
                                    </div>
                                    <img
                                        src={entry.avatarUrl}
                                        alt={entry.username}
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-[var(--text-primary)] truncate">
                                            {entry.username}
                                        </div>
                                        <div className="text-xs text-[var(--text-muted)]">
                                            Level {entry.level} • {entry.mergedPRs} PRs merged
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-[var(--text-primary)]">
                                            {entry.xp.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-[var(--text-muted)]">XP</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Why Join */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                                Why Learn with OpenForge?
                            </h3>
                            <p className="text-[var(--text-secondary)]">
                                Unlike traditional courses, every line of code you write here
                                goes into real projects used by real people.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)]">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                    <GitPullRequest size={20} className="text-emerald-500" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                                        Real Portfolio
                                    </h4>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        Build a GitHub profile with merged PRs that prove your skills
                                        to employers - not just certificates.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)]">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                    <Zap size={20} className="text-blue-500" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                                        AI-Powered Learning
                                    </h4>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        Get instant, detailed code reviews from our AI tutor that
                                        explains patterns, suggests improvements, and teaches best practices.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)]">
                                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                    <TrendingUp size={20} className="text-purple-500" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                                        Skill Progression
                                    </h4>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        Track your growth with evidence-based skill profiles updated
                                        from every contribution you make.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// CTA SECTION
// ============================================================================

function CTASection() {
    const { isNewUser } = useForge();

    return (
        <section className="py-16 bg-gradient-to-br from-orange-500/10 via-transparent to-amber-500/10">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
                <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
                    Ready to Start Building?
                </h2>
                <p className="text-lg text-[var(--text-secondary)] mb-8">
                    Join thousands of developers learning by contributing to real open-source projects.
                </p>
                <Link
                    href={isNewUser ? "/forge/onboarding" : "/forge/challenges"}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium text-lg hover:opacity-90 transition-opacity"
                >
                    {isNewUser ? "Get Started Free" : "Find Your Next Challenge"}
                    <ArrowRight size={20} />
                </Link>
            </div>
        </section>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ForgePage() {
    return (
        <div>
            <HeroSection />
            <HowItWorksSection />
            <FeaturedProjectsSection />
            <RecentChallengesSection />
            <LeaderboardPreviewSection />
            <CTASection />
        </div>
    );
}
