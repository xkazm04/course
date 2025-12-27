"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    Hammer,
    Github,
    ExternalLink,
    Users,
    Target,
    Star,
    GitPullRequest,
    Trophy,
    ArrowLeft,
    BookOpen,
    Code,
    Clock,
    ChevronRight,
    Play,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { mockProjects, mockChallenges } from "../../lib/mockData";

// ============================================================================
// TABS
// ============================================================================

type TabId = "overview" | "challenges" | "contributors" | "roadmap";

const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "challenges", label: "Challenges" },
    { id: "contributors", label: "Contributors" },
    { id: "roadmap", label: "Roadmap" },
];

// ============================================================================
// OVERVIEW TAB
// ============================================================================

function OverviewTab({ project }: { project: typeof mockProjects[0] }) {
    return (
        <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
                {/* Description */}
                <section>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                        About This Project
                    </h2>
                    <div className="prose prose-invert max-w-none">
                        <p className="text-[var(--text-secondary)]">
                            {project.description}
                        </p>
                    </div>
                </section>

                {/* Screenshots */}
                <section>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                        Screenshots
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="aspect-video bg-[var(--surface-overlay)] rounded-lg border border-[var(--border-default)] flex items-center justify-center"
                            >
                                <span className="text-[var(--text-muted)] text-sm">
                                    Screenshot {i}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Getting Started */}
                <section>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                        Getting Started
                    </h2>
                    <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-bold text-[var(--accent-primary)]">1</span>
                                </div>
                                <div>
                                    <h3 className="font-medium text-[var(--text-primary)] mb-1">
                                        Fork the Repository
                                    </h3>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        Click the Fork button on GitHub to create your own copy.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-bold text-[var(--accent-primary)]">2</span>
                                </div>
                                <div>
                                    <h3 className="font-medium text-[var(--text-primary)] mb-1">
                                        Set Up Development Environment
                                    </h3>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        Clone your fork, install dependencies with <code className="px-1 py-0.5 bg-[var(--surface-overlay)] rounded text-xs">npm install</code>, and run <code className="px-1 py-0.5 bg-[var(--surface-overlay)] rounded text-xs">npm run dev</code>.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-bold text-[var(--accent-primary)]">3</span>
                                </div>
                                <div>
                                    <h3 className="font-medium text-[var(--text-primary)] mb-1">
                                        Pick a Challenge
                                    </h3>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        Browse available challenges and claim one that matches your skill level.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
                {/* Quick Stats */}
                <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                        Project Stats
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--text-muted)]">Contributors</span>
                            <span className="font-medium text-[var(--text-primary)]">{project.contributorCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--text-muted)]">Open Challenges</span>
                            <span className="font-medium text-[var(--text-primary)]">{project.openChallenges}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--text-muted)]">Completed</span>
                            <span className="font-medium text-[var(--text-primary)]">{project.completedChallenges}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--text-muted)]">GitHub Stars</span>
                            <span className="font-medium text-[var(--text-primary)]">{project.starCount}</span>
                        </div>
                    </div>
                </div>

                {/* Tech Stack */}
                <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                        Tech Stack
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {project.techStack.map((tech) => (
                            <span
                                key={tech}
                                className="px-3 py-1.5 rounded-lg bg-[var(--surface-overlay)] text-sm text-[var(--text-secondary)]"
                            >
                                {tech}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Skills */}
                <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                        Skills You'll Learn
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {project.skillsTaught.map((skill) => (
                            <span
                                key={skill}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-sm text-emerald-500"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Maintainers */}
                <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                        Lead Maintainers
                    </h3>
                    <div className="space-y-3">
                        {project.leadMaintainers.map((maintainer) => (
                            <div key={maintainer.id} className="flex items-center gap-3">
                                <img
                                    src={maintainer.avatarUrl}
                                    alt={maintainer.username}
                                    className="w-10 h-10 rounded-full"
                                />
                                <div>
                                    <div className="font-medium text-[var(--text-primary)]">
                                        {maintainer.username}
                                    </div>
                                    <div className="text-xs text-[var(--text-muted)] capitalize">
                                        {maintainer.role}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// CHALLENGES TAB
// ============================================================================

function ChallengesTab({ project }: { project: typeof mockProjects[0] }) {
    const projectChallenges = mockChallenges.filter((c) => c.projectId === project.id);

    const difficultyColors = {
        beginner: "text-emerald-500 bg-emerald-500/10",
        intermediate: "text-amber-500 bg-amber-500/10",
        advanced: "text-rose-500 bg-rose-500/10",
    };

    const typeIcons: Record<string, string> = {
        bug: "bug",
        feature: "feature",
        refactor: "refactor",
        test: "test",
        docs: "docs",
        performance: "performance",
        security: "security",
    };

    const typeEmojis: Record<string, string> = {
        bug: "🐛",
        feature: "✨",
        refactor: "🔧",
        test: "🧪",
        docs: "📚",
        performance: "⚡",
        security: "🔒",
    };

    return (
        <div>
            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
                <div className="flex gap-2">
                    {["all", "beginner", "intermediate", "advanced"].map((level) => (
                        <button
                            key={level}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--surface-overlay)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                            {level === "all" ? "All Levels" : level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Challenges List */}
            {projectChallenges.length > 0 ? (
                <div className="space-y-4">
                    {projectChallenges.map((challenge) => (
                        <Link
                            key={challenge.id}
                            href={`/forge/challenges/${challenge.id}`}
                            className="group flex items-center gap-4 p-4 bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] hover:border-[var(--accent-primary)] transition-colors"
                        >
                            <div className="text-3xl">{typeEmojis[challenge.type]}</div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span
                                        className={cn(
                                            "px-2 py-0.5 rounded text-xs font-medium capitalize",
                                            difficultyColors[challenge.difficulty]
                                        )}
                                    >
                                        {challenge.difficulty}
                                    </span>
                                    <span className="text-xs text-[var(--text-muted)] capitalize">
                                        {challenge.type}
                                    </span>
                                </div>
                                <h3 className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors mb-1">
                                    {challenge.title}
                                </h3>
                                <p className="text-sm text-[var(--text-secondary)] line-clamp-1">
                                    {challenge.description}
                                </p>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                                <div className="text-center">
                                    <div className="font-medium text-amber-500">+{challenge.xpReward}</div>
                                    <div className="text-xs text-[var(--text-muted)]">XP</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-medium text-[var(--text-primary)]">~{challenge.estimatedMinutes}</div>
                                    <div className="text-xs text-[var(--text-muted)]">min</div>
                                </div>
                                <ChevronRight size={20} className="text-[var(--text-muted)]" />
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <Target size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
                    <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                        No challenges yet
                    </h3>
                    <p className="text-[var(--text-secondary)]">
                        Challenges for this project are being prepared.
                    </p>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// CONTRIBUTORS TAB
// ============================================================================

function ContributorsTab({ project }: { project: typeof mockProjects[0] }) {
    const contributors = [
        { id: "1", username: "alex_dev", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex", contributions: 45, level: 12 },
        { id: "2", username: "sarah_coder", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah", contributions: 38, level: 10 },
        { id: "3", username: "mike_js", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike", contributions: 27, level: 8 },
        { id: "4", username: "emma_react", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma", contributions: 22, level: 7 },
        { id: "5", username: "john_ts", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=john", contributions: 18, level: 6 },
    ];

    return (
        <div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {contributors.map((contributor, index) => (
                    <div
                        key={contributor.id}
                        className="flex items-center gap-4 p-4 bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)]"
                    >
                        <div className="relative">
                            <img
                                src={contributor.avatarUrl}
                                alt={contributor.username}
                                className="w-12 h-12 rounded-full"
                            />
                            {index < 3 && (
                                <div
                                    className={cn(
                                        "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                                        index === 0 && "bg-amber-500 text-white",
                                        index === 1 && "bg-gray-400 text-white",
                                        index === 2 && "bg-orange-600 text-white"
                                    )}
                                >
                                    {index + 1}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-[var(--text-primary)] truncate">
                                {contributor.username}
                            </div>
                            <div className="text-sm text-[var(--text-muted)]">
                                Level {contributor.level}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-semibold text-[var(--text-primary)]">
                                {contributor.contributions}
                            </div>
                            <div className="text-xs text-[var(--text-muted)]">PRs</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// ROADMAP TAB
// ============================================================================

function RoadmapTab({ project }: { project: typeof mockProjects[0] }) {
    const features = [
        { title: "User Authentication", status: "completed", challengeCount: 5 },
        { title: "Dashboard Overview", status: "completed", challengeCount: 8 },
        { title: "Contact Management", status: "in_progress", challengeCount: 12 },
        { title: "Deal Pipeline", status: "in_progress", challengeCount: 15 },
        { title: "Email Integration", status: "planned", challengeCount: 10 },
        { title: "Reporting & Analytics", status: "planned", challengeCount: 8 },
        { title: "API & Integrations", status: "planned", challengeCount: 6 },
    ];

    const statusColors = {
        planned: "bg-gray-500/20 text-gray-400",
        in_progress: "bg-blue-500/20 text-blue-400",
        completed: "bg-emerald-500/20 text-emerald-400",
    };

    return (
        <div className="space-y-4">
            {features.map((feature, index) => (
                <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)]"
                >
                    <div
                        className={cn(
                            "w-3 h-3 rounded-full",
                            feature.status === "completed" && "bg-emerald-500",
                            feature.status === "in_progress" && "bg-blue-500",
                            feature.status === "planned" && "bg-gray-500"
                        )}
                    />
                    <div className="flex-1">
                        <h3 className="font-medium text-[var(--text-primary)]">
                            {feature.title}
                        </h3>
                        <p className="text-sm text-[var(--text-muted)]">
                            {feature.challengeCount} challenges
                        </p>
                    </div>
                    <span
                        className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium capitalize",
                            statusColors[feature.status as keyof typeof statusColors]
                        )}
                    >
                        {feature.status.replace("_", " ")}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ProjectDetailPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [activeTab, setActiveTab] = useState<TabId>("overview");

    const project = mockProjects.find((p) => p.slug === slug);

    if (!project) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                    Project Not Found
                </h1>
                <p className="text-[var(--text-secondary)] mb-8">
                    The project you're looking for doesn't exist.
                </p>
                <Link
                    href="/forge/projects"
                    className="text-[var(--accent-primary)] hover:underline"
                >
                    Back to Projects
                </Link>
            </div>
        );
    }

    const statusColors = {
        planning: "text-blue-500 bg-blue-500/10",
        active: "text-emerald-500 bg-emerald-500/10",
        mature: "text-purple-500 bg-purple-500/10",
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Back Link */}
            <Link
                href="/forge/projects"
                className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6"
            >
                <ArrowLeft size={16} />
                Back to Projects
            </Link>

            {/* Header */}
            <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6 mb-8">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Logo & Basic Info */}
                    <div className="flex items-start gap-4 flex-1">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <Hammer size={40} className="text-orange-500" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                                    {project.name}
                                </h1>
                                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", statusColors[project.status])}>
                                    {project.status}
                                </span>
                            </div>
                            <p className="text-[var(--text-muted)] mb-3">
                                Open-source {project.targetProduct} alternative
                            </p>
                            <p className="text-[var(--text-secondary)]">
                                {project.tagline}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--surface-overlay)] border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--surface-base)] transition-colors"
                        >
                            <Github size={18} />
                            View on GitHub
                        </a>
                        {project.demoUrl && (
                            <a
                                href={project.demoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--surface-overlay)] border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--surface-base)] transition-colors"
                            >
                                <Play size={18} />
                                Live Demo
                            </a>
                        )}
                        <Link
                            href={`/forge/challenges?project=${project.slug}`}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium hover:opacity-90 transition-opacity"
                        >
                            <Target size={18} />
                            Browse Challenges
                        </Link>
                    </div>
                </div>

                {/* Progress */}
                <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-[var(--text-muted)]">Feature Parity Progress</span>
                        <span className="font-medium text-[var(--text-primary)]">
                            {project.featureParityPercent}% of {project.targetProduct}
                        </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-[var(--surface-overlay)]">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                            style={{ width: `${project.featureParityPercent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-[var(--border-default)] mb-8">
                <div className="flex gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                                activeTab === tab.id
                                    ? "border-[var(--accent-primary)] text-[var(--accent-primary)]"
                                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && <OverviewTab project={project} />}
            {activeTab === "challenges" && <ChallengesTab project={project} />}
            {activeTab === "contributors" && <ContributorsTab project={project} />}
            {activeTab === "roadmap" && <RoadmapTab project={project} />}
        </div>
    );
}
