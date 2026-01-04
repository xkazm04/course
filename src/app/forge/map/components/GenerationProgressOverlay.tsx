"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle, Zap, BookOpen, FileText, Sparkles } from "lucide-react";
import {
    useDynamicNodes,
    useGenerationJobs,
    useIsPolling,
    useOverallProgress,
} from "../lib/usePathSyncStore";
import { cn } from "@/app/shared/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface NodeStats {
    total: number;
    ready: number;
    generating: number;
    pending: number;
}

// ============================================================================
// Component
// ============================================================================

export function GenerationProgressOverlay() {
    const dynamicNodes = useDynamicNodes();
    const generationJobs = useGenerationJobs();
    const isPolling = useIsPolling();
    const overallProgress = useOverallProgress();

    // Calculate stats by node type
    const stats = useMemo(() => {
        const nodes = Object.values(dynamicNodes);
        const jobs = Object.values(generationJobs);

        // Count nodes by type
        const byType: Record<string, NodeStats> = {
            topic: { total: 0, ready: 0, generating: 0, pending: 0 },
            skill: { total: 0, ready: 0, generating: 0, pending: 0 },
            course: { total: 0, ready: 0, generating: 0, pending: 0 },
            lesson: { total: 0, ready: 0, generating: 0, pending: 0 },
        };

        for (const node of nodes) {
            const type = node.nodeType;
            if (!byType[type]) continue;

            byType[type].total++;
            if (node.status === "ready" || node.status === "completed") {
                byType[type].ready++;
            } else if (node.status === "generating") {
                byType[type].generating++;
            } else if (node.status === "pending") {
                byType[type].pending++;
            }
        }

        // Jobs are for chapter content
        const totalJobs = jobs.length;
        const completedJobs = jobs.filter(
            j => j.status === "ready" || j.status === "completed"
        ).length;
        const generatingJobs = jobs.filter(j => j.status === "generating").length;

        return {
            byType,
            totalNodes: nodes.length,
            totalJobs,
            completedJobs,
            generatingJobs,
            pendingJobs: totalJobs - completedJobs - generatingJobs,
        };
    }, [dynamicNodes, generationJobs]);

    // Don't show if no nodes or no jobs
    const hasNodes = stats.totalNodes > 0;
    const hasJobs = stats.totalJobs > 0;
    const isGenerating = isPolling && hasJobs;
    const isComplete = hasJobs && stats.completedJobs === stats.totalJobs;

    // Don't render if nothing to show
    if (!hasNodes && !hasJobs) return null;

    // Show complete state briefly then hide
    if (isComplete && !isPolling) return null;

    return (
        <AnimatePresence>
            {(isGenerating || (hasNodes && !isComplete)) && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="absolute top-20 left-1/2 -translate-x-1/2 z-20"
                >
                    <div className="bg-[var(--forge-bg-elevated)]/95 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-xl overflow-hidden min-w-[320px]">
                        {/* Header */}
                        <div className="px-4 py-2.5 bg-gradient-to-r from-[var(--ember)]/20 via-[var(--ember)]/10 to-transparent border-b border-[var(--forge-border-subtle)]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {isGenerating ? (
                                        <Loader2 size={14} className="text-[var(--ember)] animate-spin" />
                                    ) : (
                                        <Sparkles size={14} className="text-[var(--gold)]" />
                                    )}
                                    <span className="text-sm font-medium text-[var(--forge-text-primary)]">
                                        {isGenerating ? "Forging Content..." : "Path Created"}
                                    </span>
                                </div>
                                <span className="text-xs text-[var(--forge-text-muted)]">
                                    {stats.totalNodes} nodes
                                </span>
                            </div>
                        </div>

                        {/* Progress bar */}
                        {hasJobs && (
                            <div className="px-4 py-2 border-b border-[var(--forge-border-subtle)]">
                                <div className="flex items-center justify-between text-xs text-[var(--forge-text-muted)] mb-1.5">
                                    <span>Content generation</span>
                                    <span className="font-medium text-[var(--forge-text-secondary)]">
                                        {stats.completedJobs} / {stats.totalJobs} chapters
                                    </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-[var(--forge-bg-bench)] overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-[var(--ember)] via-[var(--ember-glow)] to-[var(--gold)]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${overallProgress}%` }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-[var(--forge-text-muted)] mt-1">
                                    <span>{overallProgress}% complete</span>
                                    {stats.generatingJobs > 0 && (
                                        <span className="flex items-center gap-1 text-[var(--ember)]">
                                            <Loader2 size={8} className="animate-spin" />
                                            {stats.generatingJobs} generating
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Node breakdown */}
                        <div className="px-4 py-2.5">
                            <div className="grid grid-cols-4 gap-2">
                                <NodeStat
                                    icon={<Zap size={12} />}
                                    label="Topics"
                                    stats={stats.byType.topic}
                                    color="text-purple-400"
                                />
                                <NodeStat
                                    icon={<Zap size={12} />}
                                    label="Skills"
                                    stats={stats.byType.skill}
                                    color="text-cyan-400"
                                />
                                <NodeStat
                                    icon={<BookOpen size={12} />}
                                    label="Courses"
                                    stats={stats.byType.course}
                                    color="text-[var(--forge-success)]"
                                />
                                <NodeStat
                                    icon={<FileText size={12} />}
                                    label="Chapters"
                                    stats={stats.byType.lesson}
                                    color="text-[var(--ember)]"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ============================================================================
// Sub-components
// ============================================================================

interface NodeStatProps {
    icon: React.ReactNode;
    label: string;
    stats: NodeStats;
    color: string;
}

function NodeStat({ icon, label, stats, color }: NodeStatProps) {
    const isComplete = stats.ready === stats.total && stats.total > 0;
    const hasGenerating = stats.generating > 0;

    return (
        <div className="flex flex-col items-center text-center">
            <div className={cn("mb-0.5", color)}>
                {isComplete ? (
                    <CheckCircle size={12} className="text-[var(--forge-success)]" />
                ) : hasGenerating ? (
                    <Loader2 size={12} className="animate-spin" />
                ) : (
                    icon
                )}
            </div>
            <div className="text-xs font-medium text-[var(--forge-text-primary)]">
                {stats.ready}/{stats.total}
            </div>
            <div className="text-[9px] text-[var(--forge-text-muted)]">{label}</div>
        </div>
    );
}
