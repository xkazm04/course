"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Clock,
    Users,
    Bug,
    AlertTriangle,
    Sparkles,
    FileCode,
    Play,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { elevation } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { SeedProject, Assignment } from "../lib/types";
import { PreviousDevContext } from "./PreviousDevContext";

interface ProjectDetailProps {
    project: SeedProject;
    assignments: Assignment[];
    onBack: () => void;
    onStartAssignment: (assignmentId: string) => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
    project,
    assignments,
    onBack,
    onStartAssignment,
}) => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 rounded-lg hover:bg-[var(--forge-bg-anvil)] transition-colors text-[var(--forge-text-muted)]"
                >
                    <ArrowLeft size={ICON_SIZES.md} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-[var(--forge-text-primary)]">
                        {project.name}
                    </h1>
                    <p className="text-[var(--forge-text-muted)]">{project.description}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tech Stack */}
                    <section className={cn("rounded-xl border border-[var(--forge-border-default)] bg-[var(--forge-bg-elevated)] p-4", elevation.elevated)}>
                        <h3 className="font-semibold text-[var(--forge-text-primary)] mb-3">Tech Stack</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.entries(project.techStack).map(([key, value]) => value && (
                                <div key={key} className="flex items-center gap-2">
                                    <span className="text-xs text-[var(--forge-text-muted)] uppercase w-20">{key}:</span>
                                    <span className="text-sm text-[var(--forge-text-primary)]">{value}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Issues Overview */}
                    <section className={cn("rounded-xl border border-[var(--forge-border-default)] bg-[var(--forge-bg-elevated)] p-4", elevation.elevated)}>
                        <h3 className="font-semibold text-[var(--forge-text-primary)] mb-3 flex items-center gap-2">
                            <Bug size={ICON_SIZES.sm} className="text-[var(--forge-error)]" />
                            Known Issues ({project.knownIssues.length})
                        </h3>
                        <div className="space-y-2">
                            {project.knownIssues.map((issue, i) => (
                                <IssueItem key={i} description={issue} type="bug" />
                            ))}
                        </div>
                    </section>

                    {/* Code Smells */}
                    <section className={cn("rounded-xl border border-[var(--forge-border-default)] bg-[var(--forge-bg-elevated)] p-4", elevation.elevated)}>
                        <h3 className="font-semibold text-[var(--forge-text-primary)] mb-3 flex items-center gap-2">
                            <AlertTriangle size={ICON_SIZES.sm} className="text-[var(--forge-warning)]" />
                            Code Smells ({project.codeSmells.length})
                        </h3>
                        <div className="space-y-2">
                            {project.codeSmells.map((smell, i) => (
                                <IssueItem key={i} description={smell} type="smell" />
                            ))}
                        </div>
                    </section>

                    {/* Missing Features */}
                    <section className={cn("rounded-xl border border-[var(--forge-border-default)] bg-[var(--forge-bg-elevated)] p-4", elevation.elevated)}>
                        <h3 className="font-semibold text-[var(--forge-text-primary)] mb-3 flex items-center gap-2">
                            <Sparkles size={ICON_SIZES.sm} className="text-[var(--ember)]" />
                            Missing Features ({project.missingFeatures.length})
                        </h3>
                        <div className="space-y-2">
                            {project.missingFeatures.map((feature, i) => (
                                <IssueItem key={i} description={feature} type="feature" />
                            ))}
                        </div>
                    </section>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Stats */}
                    <div className={cn("rounded-xl border border-[var(--forge-border-default)] bg-[var(--forge-bg-elevated)] p-4", elevation.elevated)}>
                        <div className="grid grid-cols-2 gap-4">
                            <StatItem icon={Clock} label="Est. Hours" value={`${project.estimatedHours}h`} />
                            <StatItem icon={Users} label="Completed" value={project.timesAssigned.toString()} />
                            <StatItem icon={FileCode} label="Files" value={project.repository.files.length.toString()} />
                            <StatItem icon={Bug} label="Issues" value={project.knownIssues.length.toString()} />
                        </div>
                    </div>

                    {/* Previous Developer */}
                    <PreviousDevContext
                        developer={project.previousDeveloper}
                        projectHistory={project.projectHistory}
                        variant="full"
                    />

                    {/* Start Assignment */}
                    <button
                        onClick={() => {
                            const assignment = assignments[0];
                            if (assignment) onStartAssignment(assignment.id);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-forge text-white font-medium hover:opacity-90 transition-colors shadow-ember"
                    >
                        <Play size={ICON_SIZES.sm} />
                        Start Assignment
                    </button>
                </div>
            </div>
        </div>
    );
};

// Issue item component
interface IssueItemProps {
    description: string;
    type: "bug" | "smell" | "feature";
}

const IssueItem: React.FC<IssueItemProps> = ({ description, type }) => {
    const colors = {
        bug: "bg-[var(--forge-error)]/10 border-[var(--forge-error)]/20 text-[var(--forge-error)]",
        smell: "bg-[var(--forge-warning)]/10 border-[var(--forge-warning)]/20 text-[var(--forge-warning)]",
        feature: "bg-[var(--ember)]/10 border-[var(--ember)]/20 text-[var(--ember)]",
    }[type];

    return (
        <div className={cn("p-2 rounded-lg border text-sm", colors)}>
            {description}
        </div>
    );
};

// Stat item component
interface StatItemProps {
    icon: React.ElementType;
    label: string;
    value: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon: Icon, label, value }) => (
    <div className="text-center">
        <Icon size={ICON_SIZES.md} className="mx-auto mb-1 text-[var(--forge-text-muted)]" />
        <div className="text-lg font-bold text-[var(--forge-text-primary)]">{value}</div>
        <div className="text-xs text-[var(--forge-text-muted)]">{label}</div>
    </div>
);
