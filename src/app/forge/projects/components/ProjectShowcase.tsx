"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
    Github,
    ExternalLink,
    Star,
    Users,
    Target,
    GitBranch,
    ArrowRight,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { ForgeProject } from "../../lib/types";
import { forgeEasing, staggerDelay } from "../../lib/animations";

interface ProjectShowcaseProps {
    project: ForgeProject;
}

const statusConfig = {
    planning: { label: "Planning", color: "bg-[var(--forge-info)] text-white" },
    active: { label: "Active", color: "bg-[var(--forge-success)] text-white" },
    mature: { label: "Stable", color: "bg-[var(--gold)] text-black" },
};

export function ProjectShowcase({ project }: ProjectShowcaseProps) {
    const status = statusConfig[project.status];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: forgeEasing }}
            className="grid lg:grid-cols-[1fr_280px] gap-4"
        >
            {/* Left: Screenshot Hero */}
            <div className="relative aspect-[16/10] lg:aspect-auto lg:min-h-[360px] rounded-2xl overflow-hidden bg-gradient-to-br from-[var(--ember)] via-[var(--ember-glow)] to-[var(--gold)]">
                {/* Decorative pattern */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
                </div>

                {/* Screenshot placeholder - would show real screenshot */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3/4 h-3/4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl flex items-center justify-center">
                        <span className="text-white/40 text-sm">Project Preview</span>
                    </div>
                </div>

                {/* Top overlay: Status + Actions */}
                <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                    <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className={cn("px-3 py-1 rounded-full text-xs font-semibold", status.color)}
                    >
                        {status.label}
                    </motion.span>

                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-2"
                    >
                        <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30 backdrop-blur-sm text-white text-xs font-medium hover:bg-black/40 transition-colors"
                        >
                            <Github size={14} />
                            GitHub
                        </a>
                        {project.demoUrl && (
                            <a
                                href={project.demoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[var(--ember)] text-xs font-semibold hover:bg-white/90 transition-colors"
                            >
                                <ExternalLink size={14} />
                                Demo
                            </a>
                        )}
                    </motion.div>
                </div>

                {/* Bottom overlay: Title + Progress */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h1 className="text-2xl font-bold text-white mb-1">{project.name}</h1>
                        <p className="text-white/70 text-sm mb-3">vs {project.targetProduct}</p>

                        {/* Feature parity progress */}
                        <div className="max-w-xs">
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-white/60">Feature Parity</span>
                                <span className="text-white font-semibold">{project.featureParityPercent}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${project.featureParityPercent}%` }}
                                    transition={{ duration: 0.8, delay: 0.4, ease: forgeEasing }}
                                    className="h-full rounded-full bg-white"
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right: Info Sidebar */}
            <div className="flex flex-col gap-3">
                {/* Tech Stack */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, ease: forgeEasing }}
                    className="p-4 rounded-xl bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl border border-[var(--forge-border-subtle)]"
                >
                    <h3 className="text-xs font-semibold text-[var(--forge-text-muted)] uppercase tracking-wider mb-2">
                        Tech Stack
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                        {project.techStack.slice(0, 6).map((tech, i) => (
                            <span
                                key={tech}
                                className="px-2 py-1 rounded-md text-xs font-medium bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)] border border-[var(--forge-border-subtle)]"
                            >
                                {tech}
                            </span>
                        ))}
                        {project.techStack.length > 6 && (
                            <span className="px-2 py-1 rounded-md text-xs font-medium text-[var(--forge-text-muted)]">
                                +{project.techStack.length - 6}
                            </span>
                        )}
                    </div>
                </motion.div>

                {/* Skills */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25, ease: forgeEasing }}
                    className="p-4 rounded-xl bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl border border-[var(--forge-border-subtle)]"
                >
                    <h3 className="text-xs font-semibold text-[var(--forge-text-muted)] uppercase tracking-wider mb-2">
                        Skills You'll Learn
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                        {project.skillsTaught.slice(0, 4).map((skill) => (
                            <span
                                key={skill}
                                className="px-2 py-1 rounded-md text-xs font-medium bg-[var(--ember)]/10 text-[var(--ember)] border border-[var(--ember)]/20"
                            >
                                {skill}
                            </span>
                        ))}
                        {project.skillsTaught.length > 4 && (
                            <span className="px-2 py-1 rounded-md text-xs font-medium text-[var(--forge-text-muted)]">
                                +{project.skillsTaught.length - 4}
                            </span>
                        )}
                    </div>
                </motion.div>

                {/* Quick Stats */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, ease: forgeEasing }}
                    className="grid grid-cols-2 gap-2"
                >
                    <StatMini icon={Star} label="Stars" value={project.starCount} color="text-[var(--gold)]" />
                    <StatMini icon={Users} label="Contributors" value={project.contributorCount} color="text-[var(--ember)]" />
                    <StatMini icon={Target} label="Open Tasks" value={project.openChallenges} color="text-[var(--forge-success)]" />
                    <StatMini icon={GitBranch} label="Completed" value={project.completedChallenges} color="text-[var(--forge-info)]" />
                </motion.div>

                {/* Maintainers */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35, ease: forgeEasing }}
                    className="p-3 rounded-xl bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl border border-[var(--forge-border-subtle)] flex items-center gap-3"
                >
                    <div className="flex -space-x-2">
                        {project.leadMaintainers.slice(0, 3).map((m) => (
                            <img
                                key={m.id}
                                src={m.avatarUrl}
                                alt={m.username}
                                className="w-8 h-8 rounded-full border-2 border-[var(--forge-bg-elevated)]"
                            />
                        ))}
                    </div>
                    <div className="text-xs">
                        <div className="font-medium text-[var(--forge-text-primary)]">
                            {project.leadMaintainers.map((m) => m.username).join(", ")}
                        </div>
                        <div className="text-[var(--forge-text-muted)]">Maintainers</div>
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, ease: forgeEasing }}
                >
                    <Link
                        href={`/forge/challenges?project=${project.id}`}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] text-white font-semibold shadow-lg shadow-[var(--ember)]/30 hover:shadow-xl hover:shadow-[var(--ember)]/40 transition-all"
                    >
                        Start Contributing
                        <ArrowRight size={16} />
                    </Link>
                </motion.div>
            </div>
        </motion.div>
    );
}

// Mini stat component for sidebar
function StatMini({
    icon: Icon,
    label,
    value,
    color,
}: {
    icon: typeof Star;
    label: string;
    value: number;
    color: string;
}) {
    return (
        <div className="p-3 rounded-xl bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl border border-[var(--forge-border-subtle)] flex items-center gap-2">
            <Icon size={14} className={color} />
            <div>
                <div className="text-sm font-bold text-[var(--forge-text-primary)]">{value}</div>
                <div className="text-[10px] text-[var(--forge-text-muted)]">{label}</div>
            </div>
        </div>
    );
}
