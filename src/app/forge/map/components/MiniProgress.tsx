"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Play, BookOpen, Target } from "lucide-react";
import type { MapNode } from "@/app/features/knowledge-map/lib/types";

interface MiniProgressProps {
    nodes: MapNode[];
    levelName: string;
}

export function MiniProgress({ nodes, levelName }: MiniProgressProps) {
    const stats = useMemo(() => {
        const total = nodes.length;
        const completed = nodes.filter(n => n.status === "completed").length;
        const inProgress = nodes.filter(n => n.status === "in_progress").length;
        const available = nodes.filter(n => n.status === "available").length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { total, completed, inProgress, available, percentage };
    }, [nodes]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30"
        >
            <div className="bg-[var(--forge-bg-elevated)]/95 backdrop-blur-sm rounded-2xl border border-[var(--forge-border-subtle)] shadow-lg px-6 py-3">
                <div className="flex items-center gap-6">
                    {/* Level name */}
                    <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-[var(--forge-text-muted)]" />
                        <span className="text-sm font-medium text-[var(--forge-text-secondary)] max-w-[120px] truncate">
                            {levelName}
                        </span>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-8 bg-[var(--forge-border-subtle)]" />

                    {/* Progress bar */}
                    <div className="flex items-center gap-3">
                        <div className="w-32 h-2 rounded-full bg-[var(--forge-bg-elevated)] overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-[var(--forge-success)] to-[var(--forge-success)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${stats.percentage}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                        </div>
                        <span className="text-sm font-bold text-[var(--forge-text-primary)] w-10">
                            {stats.percentage}%
                        </span>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-8 bg-[var(--forge-border-subtle)]" />

                    {/* Stats */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[var(--forge-success)]">
                            <CheckCircle size={14} />
                            <span className="text-sm font-medium">{stats.completed}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[var(--ember)]">
                            <Play size={14} />
                            <span className="text-sm font-medium">{stats.inProgress}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[var(--forge-text-muted)]">
                            <Target size={14} />
                            <span className="text-sm font-medium">{stats.available}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
