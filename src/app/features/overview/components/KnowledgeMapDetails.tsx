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
        className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    in_progress: {
        label: "In Progress",
        icon: PlayCircle,
        className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    },
    available: {
        label: "Available",
        icon: ChevronRight,
        className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
    },
    locked: {
        label: "Locked",
        icon: Lock,
        className: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
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
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        {categoryMeta.name}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                                    {node.title}
                                </h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                aria-label="Close details panel"
                                data-testid="knowledge-map-details-close-btn"
                            >
                                <X className="w-5 h-5 text-slate-400" />
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
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                            {node.description}
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
                                <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 mb-1">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-xs">Duration</span>
                                </div>
                                <span className="text-lg font-bold text-[var(--text-primary)]">
                                    {node.estimatedHours}h
                                </span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                    Difficulty
                                </div>
                                <span className={cn(
                                    "text-sm font-semibold",
                                    node.difficulty === "beginner" && "text-green-600 dark:text-green-400",
                                    node.difficulty === "intermediate" && "text-yellow-600 dark:text-yellow-400",
                                    node.difficulty === "advanced" && "text-orange-600 dark:text-orange-400",
                                    node.difficulty === "expert" && "text-red-600 dark:text-red-400",
                                )}>
                                    {node.difficulty.charAt(0).toUpperCase() + node.difficulty.slice(1)}
                                </span>
                            </div>
                        </div>

                        {/* Skills */}
                        <div>
                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                                Skills You'll Learn
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                                {node.skills.map((skill, i) => (
                                    <span
                                        key={i}
                                        className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Prerequisites */}
                        {prerequisites.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                                    Prerequisites
                                </h4>
                                <div className="space-y-1.5">
                                    {prerequisites.map((prereq) => (
                                        <button
                                            key={prereq.id}
                                            onClick={() => onSelectNode(prereq)}
                                            className={cn(
                                                "w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors",
                                                "hover:bg-slate-100 dark:hover:bg-slate-700",
                                                prereq.status === "completed" && "bg-emerald-50 dark:bg-emerald-900/20"
                                            )}
                                            aria-label={`Prerequisite: ${prereq.title}, ${prereq.status === "completed" ? "completed" : "not completed"}`}
                                            data-testid={`prerequisite-${prereq.id}-btn`}
                                        >
                                            {prereq.status === "completed" ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                <Clock className="w-4 h-4 text-slate-400" />
                                            )}
                                            <span className="text-sm text-[var(--text-primary)] flex-1">
                                                {prereq.title}
                                            </span>
                                            <ArrowRight className="w-4 h-4 text-slate-400" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Leads To */}
                        {leadsTo.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                                    Unlocks
                                </h4>
                                <div className="space-y-1.5">
                                    {leadsTo.slice(0, 3).map((next) => (
                                        <button
                                            key={next.id}
                                            onClick={() => onSelectNode(next)}
                                            className="w-full flex items-center gap-2 p-2 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                            aria-label={`Unlocks: ${next.title}`}
                                            data-testid={`unlocks-${next.id}-btn`}
                                        >
                                            <ChevronRight className="w-4 h-4 text-indigo-500" />
                                            <span className="text-sm text-[var(--text-primary)] flex-1">
                                                {next.title}
                                            </span>
                                            <ArrowRight className="w-4 h-4 text-slate-400" />
                                        </button>
                                    ))}
                                    {leadsTo.length > 3 && (
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            +{leadsTo.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Resources */}
                        {node.resources.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                                    Learning Resources
                                </h4>
                                <div className="space-y-2">
                                    {node.resources.map((resource, i) => {
                                        const ResourceIcon = RESOURCE_ICONS[resource.type];
                                        return (
                                            <div
                                                key={i}
                                                className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                                            >
                                                <ResourceIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                                <span className="text-sm text-[var(--text-primary)] flex-1">
                                                    {resource.title}
                                                </span>
                                                <span className="text-xs text-slate-400 capitalize">
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
                                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                                        : node.status === "in_progress"
                                            ? "bg-indigo-500 text-white hover:bg-indigo-600"
                                            : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400"
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
