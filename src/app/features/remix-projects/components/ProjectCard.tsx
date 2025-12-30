"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    Package,
    Clock,
    Bug,
    AlertTriangle,
    Sparkles,
    Users,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { elevation } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { SeedProject } from "../lib/types";

interface ProjectCardProps {
    project: SeedProject;
    onSelect?: (id: string) => void;
    onStartAssignment?: (id: string) => void;
}

const DOMAIN_CONFIG: Record<SeedProject["domain"], { icon: string; label: string; color: string }> = {
    web_app: { icon: "🌐", label: "Web App", color: "text-[var(--forge-info)]" },
    api: { icon: "🔌", label: "API", color: "text-[var(--forge-success)]" },
    cli_tool: { icon: "💻", label: "CLI Tool", color: "text-[var(--ember)]" },
    mobile_app: { icon: "📱", label: "Mobile App", color: "text-[var(--ember)]" },
    data_pipeline: { icon: "🔄", label: "Data Pipeline", color: "text-[var(--forge-warning)]" },
    library: { icon: "📚", label: "Library", color: "text-[var(--forge-info)]" },
};

const DIFFICULTY_CONFIG: Record<SeedProject["difficulty"], { label: string; color: string; bgColor: string }> = {
    beginner: { label: "Beginner", color: "text-[var(--forge-success)]", bgColor: "bg-[var(--forge-success)]/20" },
    intermediate: { label: "Intermediate", color: "text-[var(--forge-warning)]", bgColor: "bg-[var(--forge-warning)]/20" },
    advanced: { label: "Advanced", color: "text-[var(--forge-error)]", bgColor: "bg-[var(--forge-error)]/20" },
};

export const ProjectCard: React.FC<ProjectCardProps> = ({
    project,
    onSelect,
    onStartAssignment,
}) => {
    const domainConfig = DOMAIN_CONFIG[project.domain];
    const difficultyConfig = DIFFICULTY_CONFIG[project.difficulty];

    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            className={cn(
                "rounded-xl border border-[var(--forge-border-default)]",
                "bg-[var(--forge-bg-elevated)] overflow-hidden cursor-pointer",
                elevation.hoverable
            )}
            onClick={() => onSelect?.(project.id)}
        >
            {/* Header */}
            <div className="p-4 border-b border-[var(--forge-border-subtle)]">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="text-3xl">{domainConfig.icon}</div>
                        <div>
                            <h3 className="font-semibold text-[var(--forge-text-primary)]">
                                {project.name}
                            </h3>
                            <span className={cn("text-xs", domainConfig.color)}>
                                {domainConfig.label}
                            </span>
                        </div>
                    </div>
                    <span
                        className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            difficultyConfig.bgColor,
                            difficultyConfig.color
                        )}
                    >
                        {difficultyConfig.label}
                    </span>
                </div>
                <p className="text-sm text-[var(--forge-text-muted)] mt-3 line-clamp-2">
                    {project.description}
                </p>
            </div>

            {/* Tech Stack */}
            <div className="px-4 py-3 border-b border-[var(--forge-border-subtle)]">
                <div className="flex flex-wrap gap-1">
                    {Object.entries(project.techStack)
                        .filter(([_, value]) => value)
                        .slice(0, 4)
                        .map(([key, value]) => (
                            <span
                                key={key}
                                className="px-2 py-0.5 rounded text-xs bg-[var(--forge-bg-anvil)] text-[var(--forge-text-muted)]"
                            >
                                {value}
                            </span>
                        ))}
                </div>
            </div>

            {/* Stats */}
            <div className="p-4 grid grid-cols-3 gap-2">
                <StatBadge
                    icon={Bug}
                    count={project.knownIssues.length}
                    label="Issues"
                    color="red"
                />
                <StatBadge
                    icon={AlertTriangle}
                    count={project.codeSmells.length}
                    label="Smells"
                    color="amber"
                />
                <StatBadge
                    icon={Sparkles}
                    count={project.missingFeatures.length}
                    label="Missing"
                    color="purple"
                />
            </div>

            {/* Previous developer context */}
            <div className="px-4 py-3 bg-[var(--forge-bg-workshop)] border-t border-[var(--forge-border-subtle)]">
                <div className="flex items-center gap-2 text-xs text-[var(--forge-text-muted)]">
                    <span className="text-lg">{project.previousDeveloper.avatar}</span>
                    <span className="italic line-clamp-1">
                        "{project.previousDeveloper.timeConstraints}"
                    </span>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--forge-border-subtle)] flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-[var(--forge-text-muted)]">
                    <div className="flex items-center gap-1">
                        <Clock size={ICON_SIZES.xs} />
                        <span>{project.estimatedHours}h</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Users size={ICON_SIZES.xs} />
                        <span>{project.timesAssigned}</span>
                    </div>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onStartAssignment?.(project.id);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-gradient-forge text-white hover:opacity-90 transition-colors shadow-ember-sm"
                >
                    Start
                    <ChevronRight size={ICON_SIZES.sm} />
                </button>
            </div>
        </motion.div>
    );
};

// Stat badge component
interface StatBadgeProps {
    icon: React.ElementType;
    count: number;
    label: string;
    color: "red" | "amber" | "purple";
}

const StatBadge: React.FC<StatBadgeProps> = ({ icon: Icon, count, label, color }) => {
    const colorClasses = {
        red: "text-[var(--forge-error)] bg-[var(--forge-error)]/10",
        amber: "text-[var(--forge-warning)] bg-[var(--forge-warning)]/10",
        purple: "text-[var(--ember)] bg-[var(--ember)]/10",
    }[color];

    return (
        <div className={cn("rounded-lg p-2 text-center", colorClasses)}>
            <div className="flex items-center justify-center gap-1">
                <Icon size={ICON_SIZES.sm} />
                <span className="font-bold">{count}</span>
            </div>
            <span className="text-xs opacity-75">{label}</span>
        </div>
    );
};
