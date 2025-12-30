"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    Github,
    Star,
    Users,
    Target,
    GitBranch,
    ExternalLink,
    CheckCircle,
    Clock,
    Code2,
    Rocket,
    Zap,
    ArrowRight,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { mockProjects, mockChallenges, mockProjectFeatures } from "../lib/mockData";
import type { ForgeProject } from "../lib/types";
import { DemoBanner } from "../components";

// ============================================================================
// PROJECT CAROUSEL ITEM
// ============================================================================

function ProjectCarouselItem({
    project,
    isSelected,
    onClick,
}: {
    project: ForgeProject;
    isSelected: boolean;
    onClick: () => void;
}) {
    const statusColors = {
        planning: "from-[var(--forge-info)] to-[var(--forge-info)]",
        active: "from-[var(--forge-success)] to-[var(--forge-success)]",
        mature: "from-[var(--ember-glow)] to-[var(--ember-glow)]",
    };

    return (
        <button
            onClick={onClick}
            className={cn(
                "flex-shrink-0 group relative w-28 px-3 py-4 rounded-xl transition-all duration-300",
                isSelected
                    ? "bg-gradient-to-br from-[var(--ember)] to-[var(--ember-glow)] shadow-lg shadow-[var(--ember)]/30 scale-105"
                    : "bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl border border-[var(--forge-border-subtle)] hover:border-[var(--ember)]/50 hover:shadow-md"
            )}
        >
            {/* Status dot */}
            <div
                className={cn(
                    "absolute top-2 right-2 w-2 h-2 rounded-full",
                    isSelected ? "bg-white/80" : `bg-gradient-to-r ${statusColors[project.status]}`
                )}
            />

            {/* Icon */}
            <div
                className={cn(
                    "w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center transition-colors",
                    isSelected
                        ? "bg-white/20 text-white"
                        : "bg-gradient-to-br from-[var(--ember)]/10 to-[var(--ember-glow)]/10 text-[var(--ember)]"
                )}
            >
                <Code2 size={20} />
            </div>

            {/* Name */}
            <div
                className={cn(
                    "text-xs font-semibold text-center truncate",
                    isSelected ? "text-white" : "text-[var(--forge-text-primary)]"
                )}
            >
                {project.name}
            </div>

            {/* Target product */}
            <div
                className={cn(
                    "text-[10px] text-center truncate mt-0.5",
                    isSelected ? "text-white/70" : "text-[var(--forge-text-muted)]"
                )}
            >
                {project.targetProduct}
            </div>
        </button>
    );
}

// ============================================================================
// PROJECT STATS
// ============================================================================

function ProjectStats({ project }: { project: ForgeProject }) {
    const stats = [
        { icon: Users, label: "Contributors", value: project.contributorCount, color: "text-[var(--ember)]" },
        { icon: Star, label: "Stars", value: project.starCount.toLocaleString(), color: "text-[var(--gold)]" },
        { icon: Target, label: "Open Challenges", value: project.openChallenges, color: "text-[var(--forge-success)]" },
        { icon: GitBranch, label: "Completed PRs", value: project.completedChallenges, color: "text-[var(--ember-glow)]" },
    ];

    return (
        <div className="grid grid-cols-4 gap-3">
            {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={i}
                        className="bg-[var(--forge-bg-daylight)]/60 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] p-4 text-center"
                    >
                        <Icon size={18} className={cn("mx-auto mb-2", stat.color)} />
                        <div className="text-xl font-bold text-[var(--forge-text-primary)]">{stat.value}</div>
                        <div className="text-xs text-[var(--forge-text-muted)]">{stat.label}</div>
                    </div>
                );
            })}
        </div>
    );
}

// ============================================================================
// TECH STACK
// ============================================================================

function TechStack({ techStack }: { techStack: string[] }) {
    const techColors: Record<string, string> = {
        React: "bg-[var(--forge-info)]/10 text-[var(--forge-info)] border-[var(--forge-info)]/20",
        TypeScript: "bg-[var(--forge-info)]/10 text-[var(--forge-info)] border-[var(--forge-info)]/20",
        "Next.js": "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)] border-[var(--forge-border-subtle)]",
        PostgreSQL: "bg-[var(--ember)]/10 text-[var(--ember)] border-[var(--ember)]/20",
        Prisma: "bg-[var(--ember-glow)]/10 text-[var(--ember-glow)] border-[var(--ember-glow)]/20",
        "Tailwind CSS": "bg-[var(--forge-info)]/10 text-[var(--forge-info)] border-[var(--forge-info)]/20",
        Supabase: "bg-[var(--forge-success)]/10 text-[var(--forge-success)] border-[var(--forge-success)]/20",
        "DnD Kit": "bg-[var(--ember)]/10 text-[var(--ember)] border-[var(--ember)]/20",
        MongoDB: "bg-[var(--forge-success)]/10 text-[var(--forge-success)] border-[var(--forge-success)]/20",
        "Framer Motion": "bg-[var(--ember-glow)]/10 text-[var(--ember-glow)] border-[var(--ember-glow)]/20",
        ClickHouse: "bg-[var(--gold)]/10 text-[var(--gold)] border-[var(--gold)]/20",
        Redis: "bg-[var(--forge-error)]/10 text-[var(--forge-error)] border-[var(--forge-error)]/20",
    };

    return (
        <div className="flex flex-wrap gap-2">
            {techStack.map((tech) => (
                <span
                    key={tech}
                    className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium border",
                        techColors[tech] || "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)] border-[var(--forge-border-subtle)]"
                    )}
                >
                    {tech}
                </span>
            ))}
        </div>
    );
}

// ============================================================================
// FEATURE LIST
// ============================================================================

function FeatureList({ projectId }: { projectId: string }) {
    const features = mockProjectFeatures[projectId] || [];

    const statusConfig = {
        completed: { icon: CheckCircle, color: "text-[var(--forge-success)]", bg: "bg-[var(--forge-success)]/10", label: "Done" },
        in_progress: { icon: Clock, color: "text-[var(--gold)]", bg: "bg-[var(--gold)]/10", label: "In Progress" },
        planned: { icon: Rocket, color: "text-[var(--forge-text-muted)]", bg: "bg-[var(--forge-bg-elevated)]", label: "Planned" },
    };

    if (features.length === 0) {
        return (
            <div className="text-center py-8 text-[var(--forge-text-muted)]">
                Feature roadmap coming soon
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {features.map((feature, i) => {
                const config = statusConfig[feature.status as keyof typeof statusConfig] || statusConfig.planned;
                const Icon = config.icon;

                return (
                    <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-lg bg-[var(--forge-bg-daylight)]/40 border border-[var(--forge-border-subtle)]"
                    >
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.bg)}>
                            <Icon size={14} className={config.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-[var(--forge-text-primary)] text-sm">{feature.title}</div>
                            <div className="text-xs text-[var(--forge-text-muted)] truncate">{feature.description}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={cn("px-2 py-0.5 rounded text-xs font-medium", config.bg, config.color)}>
                                {config.label}
                            </span>
                            <span className="text-xs text-[var(--forge-text-muted)]">
                                {feature.challengeCount} tasks
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ============================================================================
// RELATED CHALLENGES
// ============================================================================

function RelatedChallenges({ projectId }: { projectId: string }) {
    const challenges = mockChallenges.filter((c) => c.projectId === projectId).slice(0, 3);

    const difficultyColors = {
        beginner: "bg-[var(--forge-success)]/10 text-[var(--forge-success)]",
        intermediate: "bg-[var(--gold)]/10 text-[var(--gold)]",
        advanced: "bg-[var(--forge-error)]/10 text-[var(--forge-error)]",
    };

    const typeEmoji = {
        bug: "🐛",
        feature: "✨",
        refactor: "🔧",
        test: "🧪",
        docs: "📝",
        performance: "⚡",
        security: "🔒",
    };

    return (
        <div className="space-y-2">
            {challenges.map((challenge) => (
                <Link
                    key={challenge.id}
                    href={`/forge/challenges/${challenge.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[var(--forge-bg-daylight)]/40 border border-[var(--forge-border-subtle)] hover:bg-[var(--forge-bg-daylight)]/60 hover:border-[var(--ember)]/30 transition-all group"
                >
                    <span className="text-xl">{typeEmoji[challenge.type] || "📋"}</span>
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-[var(--forge-text-primary)] text-sm group-hover:text-[var(--ember)] transition-colors truncate">
                            {challenge.title}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[var(--forge-text-muted)]">
                            <span>~{challenge.estimatedMinutes}min</span>
                            <span className="text-[var(--ember)] font-medium">+{challenge.xpReward} XP</span>
                        </div>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded text-xs font-medium capitalize", difficultyColors[challenge.difficulty])}>
                        {challenge.difficulty}
                    </span>
                </Link>
            ))}
            <Link
                href={`/forge/challenges?project=${projectId}`}
                className="flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-medium text-[var(--ember)] hover:bg-[var(--ember)]/5 transition-colors"
            >
                View all challenges
                <ArrowRight size={14} />
            </Link>
        </div>
    );
}

// ============================================================================
// MAINTAINERS
// ============================================================================

function Maintainers({ project }: { project: ForgeProject }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
                {project.leadMaintainers.map((m) => (
                    <img
                        key={m.id}
                        src={m.avatarUrl}
                        alt={m.username}
                        className="w-10 h-10 rounded-full border-2 border-[var(--forge-bg-elevated)] shadow-sm"
                    />
                ))}
            </div>
            <div className="text-sm">
                <div className="font-medium text-[var(--forge-text-primary)]">
                    {project.leadMaintainers.map((m) => m.username).join(", ")}
                </div>
                <div className="text-xs text-[var(--forge-text-muted)]">Project Maintainers</div>
            </div>
        </div>
    );
}

// ============================================================================
// PROJECT DETAIL VIEW
// ============================================================================

function ProjectDetailView({ project }: { project: ForgeProject }) {
    const statusColors = {
        planning: "bg-[var(--forge-info)]/10 text-[var(--forge-info)]",
        active: "bg-[var(--forge-success)]/10 text-[var(--forge-success)]",
        mature: "bg-[var(--ember-glow)]/10 text-[var(--ember-glow)]",
    };

    return (
        <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--ember)] via-[var(--ember-glow)] to-[var(--ember)] p-8">
                {/* Decorative elements */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--ember-glow)]/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
                </div>

                <div className="relative">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold capitalize", "bg-white/20 text-white")}>
                                    {project.status}
                                </span>
                                <span className="text-sm text-white/70">{project.category.replace("_", " ")}</span>
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
                            <p className="text-lg text-white/80 max-w-2xl">{project.tagline}</p>
                        </div>
                        <div className="flex gap-2">
                            <a
                                href={project.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                            >
                                <Github size={18} />
                                GitHub
                            </a>
                            {project.demoUrl && (
                                <a
                                    href={project.demoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-[var(--ember)] font-medium hover:bg-white/90 transition-colors"
                                >
                                    <ExternalLink size={18} />
                                    Live Demo
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="max-w-md">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-white/70">Feature Parity with {project.targetProduct}</span>
                            <span className="font-semibold text-white">{project.featureParityPercent}%</span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-white/20 backdrop-blur-sm overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${project.featureParityPercent}%` }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="h-full rounded-full bg-gradient-to-r from-white via-white to-white/80"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <ProjectStats project={project} />

            {/* Two column layout */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-[var(--forge-text-primary)] mb-3">About This Project</h2>
                        <p className="text-[var(--forge-text-secondary)] whitespace-pre-line leading-relaxed">
                            {project.description}
                        </p>
                    </div>

                    {/* Features Roadmap */}
                    <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-[var(--forge-text-primary)] mb-4">Feature Roadmap</h2>
                        <FeatureList projectId={project.id} />
                    </div>

                    {/* Screenshot placeholder */}
                    <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm overflow-hidden">
                        <div className="aspect-video bg-gradient-to-br from-[var(--forge-bg-elevated)] to-[var(--forge-bg-daylight)] flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-[var(--forge-bg-elevated)] flex items-center justify-center mx-auto mb-3">
                                    <Code2 size={24} className="text-[var(--forge-text-muted)]" />
                                </div>
                                <div className="text-[var(--forge-text-muted)] font-medium">Project Screenshot</div>
                                <div className="text-sm text-[var(--forge-text-muted)]">Coming soon</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Tech Stack */}
                    <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-[var(--forge-text-primary)] mb-4">Tech Stack</h2>
                        <TechStack techStack={project.techStack} />
                    </div>

                    {/* Skills */}
                    <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-[var(--forge-text-primary)] mb-4">
                            <Zap size={18} className="inline-block mr-2 text-[var(--gold)]" />
                            Skills You'll Learn
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {project.skillsTaught.map((skill) => (
                                <span
                                    key={skill}
                                    className="px-3 py-1.5 rounded-lg text-sm bg-gradient-to-r from-[var(--ember)]/5 to-[var(--ember-glow)]/5 text-[var(--ember)] border border-[var(--ember)]/10"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Related Challenges */}
                    <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-[var(--forge-text-primary)] mb-4">Available Challenges</h2>
                        <RelatedChallenges projectId={project.id} />
                    </div>

                    {/* Maintainers */}
                    <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm p-6">
                        <Maintainers project={project} />
                    </div>

                    {/* CTA */}
                    <Link
                        href={`/forge/challenges?project=${project.id}`}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] text-white font-semibold shadow-lg shadow-[var(--ember)]/30 hover:shadow-xl hover:shadow-[var(--ember)]/40 transition-all"
                    >
                        Start Contributing
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ProjectsPage() {
    const [selectedProject, setSelectedProject] = useState<ForgeProject>(mockProjects[0]);
    const carouselRef = useRef<HTMLDivElement>(null);

    const scrollCarousel = (direction: "left" | "right") => {
        if (!carouselRef.current) return;
        const scrollAmount = direction === "left" ? -200 : 200;
        carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-[var(--forge-text-primary)]">Projects</h1>
                    <DemoBanner />
                </div>
                <p className="text-[var(--forge-text-secondary)]">
                    Choose a project to contribute to. Each is an open-source alternative to popular SaaS products.
                </p>
            </div>

            {/* Project Carousel */}
            <div className="relative mb-8">
                {/* Scroll buttons */}
                <button
                    onClick={() => scrollCarousel("left")}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 rounded-full bg-[var(--forge-bg-daylight)] shadow-lg border border-[var(--forge-border-subtle)] flex items-center justify-center text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] hover:shadow-xl transition-all"
                >
                    <ChevronLeft size={18} />
                </button>
                <button
                    onClick={() => scrollCarousel("right")}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 rounded-full bg-[var(--forge-bg-daylight)] shadow-lg border border-[var(--forge-border-subtle)] flex items-center justify-center text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] hover:shadow-xl transition-all"
                >
                    <ChevronRight size={18} />
                </button>

                {/* Carousel container */}
                <div
                    ref={carouselRef}
                    className="flex gap-3 overflow-x-auto scrollbar-hide px-2 py-2"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {mockProjects.map((project) => (
                        <ProjectCarouselItem
                            key={project.id}
                            project={project}
                            isSelected={selectedProject.id === project.id}
                            onClick={() => setSelectedProject(project)}
                        />
                    ))}
                </div>

                {/* Gradient fades */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[var(--forge-bg-daylight)] to-transparent pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--forge-bg-daylight)] to-transparent pointer-events-none" />
            </div>

            {/* Project Detail */}
            <AnimatePresence mode="wait">
                <ProjectDetailView project={selectedProject} />
            </AnimatePresence>
        </div>
    );
}
