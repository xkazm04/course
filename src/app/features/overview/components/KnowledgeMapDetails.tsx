"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Clock, BookOpen, Video, Code, ChevronRight,
    CheckCircle2, PlayCircle, Lock, ArrowRight
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { PrismaticCard } from "@/app/shared/components";
import { CurriculumNode, getCategoryMeta, CurriculumData } from "../lib/curriculumTypes";
import { getPrerequisites, getConnectionsForNode } from "../lib/curriculumData";

interface KnowledgeMapDetailsProps {
    node: CurriculumNode | null;
    data: CurriculumData;
    onClose: () => void;
    onSelectNode: (node: CurriculumNode) => void;
}

const RESOURCE_ICONS = {
    article: BookOpen,
    video: Video,
    practice: Code,
    course: BookOpen,
};

const STATUS_CONFIG = {
    completed: {
        label: "Completed",
        icon: CheckCircle2,
        className: "bg-[var(--forge-success)]/20 text-[var(--forge-success)]",
    },
    in_progress: {
        label: "In Progress",
        icon: PlayCircle,
        className: "bg-[var(--ember)]/20 text-[var(--ember)]",
    },
    available: {
        label: "Available",
        icon: ChevronRight,
        className: "bg-[var(--forge-bg-workshop)] text-[var(--forge-text-secondary)]",
    },
    locked: {
        label: "Locked",
        icon: Lock,
        className: "bg-[var(--forge-bg-workshop)] text-[var(--forge-text-muted)]",
    },
};

export const KnowledgeMapDetails: React.FC<KnowledgeMapDetailsProps> = ({
    node,
    data,
    onClose,
    onSelectNode,
}) => {
    if (!node) return null;

    const categoryMeta = getCategoryMeta(node.category);
    const statusConfig = STATUS_CONFIG[node.status];
    const StatusIcon = statusConfig.icon;
    const prerequisites = getPrerequisites(node.id);

    // Get nodes that this node leads to
    const leadsTo = data.connections
        .filter(conn => conn.from === node.id && conn.type === "required")
        .map(conn => data.nodes.find(n => n.id === conn.to))
        .filter((n): n is CurriculumNode => n !== undefined);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute top-0 right-0 h-full w-80 z-20"
                id={`knowledge-map-details-${node.id}`}
                role="region"
                aria-label={`Details for ${node.title}`}
                data-testid="knowledge-map-details-panel"
            >
                <PrismaticCard className="h-full overflow-y-auto">
                    <div className="p-4 space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div className="flex-1 pr-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <span
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: categoryMeta.color }}
                                    />
                                    <span className="text-xs font-medium text-[var(--forge-text-muted)]">
                                        {categoryMeta.name}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-[var(--forge-text-primary)]">
                                    {node.title}
                                </h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-[var(--forge-bg-workshop)] rounded-lg transition-colors"
                                aria-label="Close details panel"
                                data-testid="knowledge-map-details-close-btn"
                            >
                                <X className="w-5 h-5 text-[var(--forge-text-muted)]" />
                            </button>
                        </div>

                        {/* Status Badge */}
                        <div className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium",
                            statusConfig.className
                        )}>
                            <StatusIcon className="w-4 h-4" />
                            {statusConfig.label}
                        </div>

                        {/* Description */}
                        <p className="text-sm text-[var(--forge-text-secondary)] leading-relaxed">
                            {node.description}
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[var(--forge-bg-workshop)] rounded-lg p-3 text-center">
                                <div className="flex items-center justify-center gap-1 text-[var(--forge-text-muted)] mb-1">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-xs">Duration</span>
                                </div>
                                <span className="text-lg font-bold text-[var(--forge-text-primary)]">
                                    {node.estimatedHours}h
                                </span>
                            </div>
                            <div className="bg-[var(--forge-bg-workshop)] rounded-lg p-3 text-center">
                                <div className="text-xs text-[var(--forge-text-muted)] mb-1">
                                    Difficulty
                                </div>
                                <span className={cn(
                                    "text-sm font-semibold",
                                    node.difficulty === "beginner" && "text-[var(--forge-success)]",
                                    node.difficulty === "intermediate" && "text-[var(--forge-warning)]",
                                    node.difficulty === "advanced" && "text-[var(--ember)]",
                                    node.difficulty === "expert" && "text-[var(--forge-error)]",
                                )}>
                                    {node.difficulty.charAt(0).toUpperCase() + node.difficulty.slice(1)}
                                </span>
                            </div>
                        </div>

                        {/* Skills */}
                        <div>
                            <h4 className="text-xs font-semibold text-[var(--forge-text-muted)] uppercase tracking-wide mb-2">
                                Skills You'll Learn
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                                {node.skills.map((skill, i) => (
                                    <span
                                        key={i}
                                        className="px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--ember)]/20 text-[var(--ember)]"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Prerequisites */}
                        {prerequisites.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-[var(--forge-text-muted)] uppercase tracking-wide mb-2">
                                    Prerequisites
                                </h4>
                                <div className="space-y-1.5">
                                    {prerequisites.map((prereq) => (
                                        <button
                                            key={prereq.id}
                                            onClick={() => onSelectNode(prereq)}
                                            className={cn(
                                                "w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors",
                                                "hover:bg-[var(--forge-bg-workshop)]",
                                                prereq.status === "completed" && "bg-[var(--forge-success)]/10"
                                            )}
                                            aria-label={`Prerequisite: ${prereq.title}, ${prereq.status === "completed" ? "completed" : "not completed"}`}
                                            data-testid={`prerequisite-${prereq.id}-btn`}
                                        >
                                            {prereq.status === "completed" ? (
                                                <CheckCircle2 className="w-4 h-4 text-[var(--forge-success)]" />
                                            ) : (
                                                <Clock className="w-4 h-4 text-[var(--forge-text-muted)]" />
                                            )}
                                            <span className="text-sm text-[var(--forge-text-primary)] flex-1">
                                                {prereq.title}
                                            </span>
                                            <ArrowRight className="w-4 h-4 text-[var(--forge-text-muted)]" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Leads To */}
                        {leadsTo.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-[var(--forge-text-muted)] uppercase tracking-wide mb-2">
                                    Unlocks
                                </h4>
                                <div className="space-y-1.5">
                                    {leadsTo.slice(0, 3).map((next) => (
                                        <button
                                            key={next.id}
                                            onClick={() => onSelectNode(next)}
                                            className="w-full flex items-center gap-2 p-2 rounded-lg text-left hover:bg-[var(--forge-bg-workshop)] transition-colors"
                                            aria-label={`Unlocks: ${next.title}`}
                                            data-testid={`unlocks-${next.id}-btn`}
                                        >
                                            <ChevronRight className="w-4 h-4 text-[var(--ember)]" />
                                            <span className="text-sm text-[var(--forge-text-primary)] flex-1">
                                                {next.title}
                                            </span>
                                            <ArrowRight className="w-4 h-4 text-[var(--forge-text-muted)]" />
                                        </button>
                                    ))}
                                    {leadsTo.length > 3 && (
                                        <span className="text-xs text-[var(--forge-text-muted)]">
                                            +{leadsTo.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Resources */}
                        {node.resources.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-[var(--forge-text-muted)] uppercase tracking-wide mb-2">
                                    Learning Resources
                                </h4>
                                <div className="space-y-2">
                                    {node.resources.map((resource, i) => {
                                        const ResourceIcon = RESOURCE_ICONS[resource.type];
                                        return (
                                            <div
                                                key={i}
                                                className="flex items-center gap-2 p-2 rounded-lg bg-[var(--forge-bg-workshop)]"
                                            >
                                                <ResourceIcon className="w-4 h-4 text-[var(--forge-text-muted)]" />
                                                <span className="text-sm text-[var(--forge-text-primary)] flex-1">
                                                    {resource.title}
                                                </span>
                                                <span className="text-xs text-[var(--forge-text-muted)] capitalize">
                                                    {resource.type}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Action Button */}
                        {node.status !== "locked" && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                    "w-full py-2.5 rounded-xl font-medium text-sm transition-colors",
                                    node.status === "completed"
                                        ? "bg-[var(--forge-success)]/20 text-[var(--forge-success)] hover:bg-[var(--forge-success)]/30"
                                        : node.status === "in_progress"
                                            ? "bg-[var(--ember)] text-[var(--forge-text-primary)] hover:opacity-90"
                                            : "bg-[var(--ember)]/20 text-[var(--ember)] hover:bg-[var(--ember)]/30"
                                )}
                                data-testid={`knowledge-map-action-${node.status}-btn`}
                            >
                                {node.status === "completed" ? "Review" :
                                    node.status === "in_progress" ? "Continue Learning" :
                                        "Start Learning"}
                            </motion.button>
                        )}
                    </div>
                </PrismaticCard>
            </motion.div>
        </AnimatePresence>
    );
};

export default KnowledgeMapDetails;
