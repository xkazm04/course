"use client";

/**
 * NodeDetailsPanel Component
 *
 * Side panel showing detailed information about a selected node.
 * Displays type-specific metadata and actions.
 */

import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Play,
    Lock,
    CheckCircle,
    Clock,
    Star,
    ChevronRight,
    BookOpen,
    Layers,
    Code,
    Video,
    FileText,
    HelpCircle,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { LEARNING_DOMAINS } from "@/app/shared/lib/learningDomains";
import type {
    MapNode,
    DomainNode,
    CourseNode,
    ChapterNode,
    SectionNode,
} from "../lib/types";
import {
    isDomainNode,
    isCourseNode,
    isChapterNode,
    isSectionNode,
    getChildCountLabel,
    getLevelLabel,
    getNextLevel,
} from "../lib/types";

// ============================================================================
// TYPES
// ============================================================================

interface NodeDetailsPanelProps {
    node: MapNode | null;
    onClose: () => void;
    onDrillDown: (nodeId: string) => void;
    onStartLearning: (nodeId: string) => void;
}

// ============================================================================
// SECTION TYPE ICONS
// ============================================================================

const SECTION_TYPE_ICONS = {
    video: Video,
    lesson: FileText,
    interactive: Code,
    exercise: Code,
    quiz: HelpCircle,
};

// ============================================================================
// COMPONENT
// ============================================================================

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = memo(function NodeDetailsPanel({
    node,
    onClose,
    onDrillDown,
    onStartLearning,
}) {
    if (!node) return null;

    const domain = LEARNING_DOMAINS[node.domainId];
    const DomainIcon = domain?.icon || Layers;
    const hasChildren = node.childIds.length > 0;
    const nextLevel = getNextLevel(node.level);

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={node.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-[380px] h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200 dark:border-slate-700 overflow-y-auto"
                data-testid="node-details-panel"
            >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                                    `bg-gradient-to-br from-${node.color}-500 to-${node.color}-600`
                                )}
                            >
                                <DomainIcon size={ICON_SIZES.md} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                    {node.name}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                    {getLevelLabel(node.level)} • {domain?.name || "Unknown Domain"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            data-testid="node-details-close-btn"
                        >
                            <X size={ICON_SIZES.sm} className="text-slate-500" />
                        </button>
                    </div>

                    {/* Status badges */}
                    <div className="flex items-center gap-2 mt-3">
                        {node.status === "locked" && (
                            <span className="px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full flex items-center gap-1">
                                <Lock size={12} />
                                Locked
                            </span>
                        )}
                        {node.status === "completed" && (
                            <span className="px-2 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center gap-1">
                                <CheckCircle size={12} />
                                Completed
                            </span>
                        )}
                        {node.status === "in_progress" && (
                            <span className="px-2 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full">
                                {node.progress}% Complete
                            </span>
                        )}
                        {node.status === "available" && (
                            <span className="px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                                Available
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Description */}
                    <p className="text-sm text-slate-600 dark:text-slate-400">{node.description}</p>

                    {/* Progress bar */}
                    {node.progress > 0 && node.progress < 100 && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                <span>Progress</span>
                                <span>{node.progress}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    className={cn(
                                        "h-full",
                                        `bg-gradient-to-r from-${node.color}-500 to-${node.color}-600`
                                    )}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${node.progress}%` }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Type-specific content */}
                    {isDomainNode(node) && <DomainDetails node={node} />}
                    {isCourseNode(node) && <CourseDetails node={node} />}
                    {isChapterNode(node) && <ChapterDetails node={node} />}
                    {isSectionNode(node) && <SectionDetails node={node} />}

                    {/* Children list */}
                    {hasChildren && nextLevel && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {getLevelLabel(nextLevel, true)} ({node.childIds.length})
                            </h4>
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                                {node.childIds.slice(0, 5).map((childId, index) => (
                                    <button
                                        key={childId}
                                        onClick={() => onDrillDown(childId)}
                                        className="w-full flex items-center justify-between p-2 text-left text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors group"
                                        data-testid={`child-node-${index}`}
                                    >
                                        <span className="truncate flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full bg-${node.color}-500`} />
                                            {/* Extract readable name from ID */}
                                            {childId.split("-").slice(-2).join(" ").replace(/-/g, " ")}
                                        </span>
                                        <ChevronRight
                                            size={14}
                                            className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors flex-shrink-0"
                                        />
                                    </button>
                                ))}
                                {node.childIds.length > 5 && (
                                    <p className="text-xs text-slate-400 dark:text-slate-500 pl-2">
                                        +{node.childIds.length - 5} more
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                <div className="sticky bottom-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700">
                    {node.status === "locked" ? (
                        <button
                            disabled
                            className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl font-medium flex items-center justify-center gap-2 cursor-not-allowed"
                            data-testid="locked-btn"
                        >
                            <Lock size={ICON_SIZES.sm} />
                            Complete Prerequisites to Unlock
                        </button>
                    ) : node.status === "completed" ? (
                        <button
                            onClick={() => onStartLearning(node.id)}
                            className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                            data-testid="review-btn"
                        >
                            <BookOpen size={ICON_SIZES.sm} />
                            Review Content
                        </button>
                    ) : hasChildren ? (
                        <button
                            onClick={() => onDrillDown(node.id)}
                            className={cn(
                                "w-full px-4 py-3 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg",
                                `bg-gradient-to-r from-${node.color}-500 to-${node.color}-600 hover:from-${node.color}-600 hover:to-${node.color}-700 shadow-${node.color}-500/20`
                            )}
                            data-testid="explore-btn"
                        >
                            <Layers size={ICON_SIZES.sm} />
                            Explore {getLevelLabel(nextLevel!, true)}
                        </button>
                    ) : (
                        <button
                            onClick={() => onStartLearning(node.id)}
                            className={cn(
                                "w-full px-4 py-3 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg",
                                `bg-gradient-to-r from-${node.color}-500 to-${node.color}-600 hover:from-${node.color}-600 hover:to-${node.color}-700 shadow-${node.color}-500/20`
                            )}
                            data-testid="start-learning-btn"
                        >
                            <Play size={ICON_SIZES.sm} />
                            {node.progress > 0 ? "Continue Learning" : "Start Learning"}
                        </button>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
});

// ============================================================================
// TYPE-SPECIFIC DETAIL COMPONENTS
// ============================================================================

function DomainDetails({ node }: { node: DomainNode }) {
    return (
        <div className="grid grid-cols-2 gap-3">
            <StatCard
                icon={BookOpen}
                label="Courses"
                value={node.courseCount.toString()}
                color={node.color}
            />
            <StatCard
                icon={Clock}
                label="Total Hours"
                value={`${node.totalHours}h`}
                color={node.color}
            />
        </div>
    );
}

function CourseDetails({ node }: { node: CourseNode }) {
    const difficultyColors = {
        beginner: "text-emerald-600 dark:text-emerald-400",
        intermediate: "text-amber-600 dark:text-amber-400",
        advanced: "text-red-600 dark:text-red-400",
    };

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <StatCard
                    icon={Layers}
                    label="Chapters"
                    value={node.chapterCount.toString()}
                    color={node.color}
                />
                <StatCard
                    icon={Clock}
                    label="Duration"
                    value={`${node.estimatedHours || 0}h`}
                    color={node.color}
                />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <span className="text-xs text-slate-500 dark:text-slate-400">Difficulty:</span>
                <span className={cn("text-sm font-medium capitalize", difficultyColors[node.difficulty])}>
                    {node.difficulty}
                </span>
            </div>
            {node.skills && node.skills.length > 0 && (
                <div className="space-y-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Skills:</span>
                    <div className="flex flex-wrap gap-1">
                        {node.skills.map((skill) => (
                            <span
                                key={skill}
                                className={cn(
                                    "px-2 py-0.5 text-xs rounded-full",
                                    `bg-${node.color}-100 dark:bg-${node.color}-900/30 text-${node.color}-700 dark:text-${node.color}-400`
                                )}
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function ChapterDetails({ node }: { node: ChapterNode }) {
    return (
        <div className="grid grid-cols-3 gap-3">
            <StatCard
                icon={Layers}
                label="Sections"
                value={node.sectionCount.toString()}
                color={node.color}
            />
            <StatCard
                icon={Clock}
                label="Duration"
                value={node.durationMinutes ? `${node.durationMinutes}m` : "—"}
                color={node.color}
            />
            <StatCard
                icon={Star}
                label="XP"
                value={node.xpReward?.toString() || "—"}
                color={node.color}
            />
        </div>
    );
}

function SectionDetails({ node }: { node: SectionNode }) {
    const TypeIcon = SECTION_TYPE_ICONS[node.sectionType] || FileText;

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    `bg-${node.color}-100 dark:bg-${node.color}-900/30`
                )}>
                    <TypeIcon size={16} className={`text-${node.color}-600 dark:text-${node.color}-400`} />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                        {node.sectionType}
                    </p>
                    {node.duration && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {node.duration}
                        </p>
                    )}
                </div>
            </div>
            {node.status === "completed" && (
                <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm text-emerald-700 dark:text-emerald-400">
                        Section completed
                    </span>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// STAT CARD
// ============================================================================

interface StatCardProps {
    icon: typeof Clock;
    label: string;
    value: string;
    color: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
    return (
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className={`text-${color}-500`} />
                <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
            </div>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{value}</p>
        </div>
    );
}

export default NodeDetailsPanel;
