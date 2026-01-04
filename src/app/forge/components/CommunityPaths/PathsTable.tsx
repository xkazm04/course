"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { BookOpen, Users, Clock, Layers, Inbox } from "lucide-react";
import { PathRow } from "./PathRow";
import type { CommunityPath } from "../../lib/communityPathsTypes";

interface PathsTableProps {
    paths: CommunityPath[];
    isLoading?: boolean;
}

export function PathsTable({ paths, isLoading }: PathsTableProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    if (isLoading) {
        return <PathsTableSkeleton />;
    }

    if (paths.length === 0) {
        return <PathsTableEmpty />;
    }

    return (
        <div className="rounded-2xl border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/40 backdrop-blur-xl overflow-hidden">
            {/* Table */}
            <table className="w-full">
                {/* Header */}
                <thead className="hidden md:table-header-group">
                    <tr className="border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/60">
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--forge-text-muted)] uppercase tracking-wider">
                            Path
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-[var(--forge-text-muted)] uppercase tracking-wider w-[100px]">
                            Domain
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-[var(--forge-text-muted)] uppercase tracking-wider w-[80px]">
                            <span className="inline-flex items-center gap-1">
                                <BookOpen size={12} />
                                Courses
                            </span>
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-[var(--forge-text-muted)] uppercase tracking-wider w-[80px]">
                            <span className="inline-flex items-center gap-1">
                                <Layers size={12} />
                                Chapters
                            </span>
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-[var(--forge-text-muted)] uppercase tracking-wider w-[80px]">
                            <span className="inline-flex items-center gap-1">
                                <Clock size={12} />
                                Hours
                            </span>
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-[var(--forge-text-muted)] uppercase tracking-wider w-[80px]">
                            <span className="inline-flex items-center gap-1">
                                <Users size={12} />
                                Learners
                            </span>
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-[var(--forge-text-muted)] uppercase tracking-wider w-[100px]">
                            Action
                        </th>
                    </tr>
                </thead>

                {/* Body */}
                <tbody className="divide-y divide-[var(--forge-border-subtle)]">
                    <AnimatePresence initial={false}>
                        {paths.map((path, index) => (
                            <PathRow
                                key={path.id}
                                path={path}
                                isExpanded={expandedId === path.id}
                                onToggle={() => toggleExpand(path.id)}
                                index={index}
                            />
                        ))}
                    </AnimatePresence>
                </tbody>
            </table>
        </div>
    );
}

function PathsTableSkeleton() {
    return (
        <div className="rounded-2xl border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/40 backdrop-blur-xl overflow-hidden">
            <table className="w-full">
                <tbody className="divide-y divide-[var(--forge-border-subtle)]">
                    {[...Array(5)].map((_, i) => (
                        <tr key={i}>
                            <td className="px-4 py-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-6 h-6 rounded bg-[var(--forge-bg-bench)] animate-pulse" />
                                    <div className="w-10 h-10 rounded-xl bg-[var(--forge-bg-bench)] animate-pulse" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-48 rounded bg-[var(--forge-bg-bench)] animate-pulse" />
                                        <div className="h-3 w-32 rounded bg-[var(--forge-bg-bench)] animate-pulse" />
                                    </div>
                                    <div className="hidden md:flex items-center gap-8">
                                        <div className="h-6 w-16 rounded-full bg-[var(--forge-bg-bench)] animate-pulse" />
                                        <div className="h-4 w-8 rounded bg-[var(--forge-bg-bench)] animate-pulse" />
                                        <div className="h-4 w-8 rounded bg-[var(--forge-bg-bench)] animate-pulse" />
                                        <div className="h-4 w-12 rounded bg-[var(--forge-bg-bench)] animate-pulse" />
                                        <div className="h-4 w-12 rounded bg-[var(--forge-bg-bench)] animate-pulse" />
                                    </div>
                                    <div className="h-8 w-20 rounded-lg bg-[var(--forge-bg-bench)] animate-pulse" />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function PathsTableEmpty() {
    return (
        <div className="rounded-2xl border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/40 backdrop-blur-xl overflow-hidden">
            <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 rounded-2xl bg-[var(--forge-bg-bench)] flex items-center justify-center mb-4">
                    <Inbox size={28} className="text-[var(--forge-text-muted)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--forge-text-primary)] mb-2">
                    No paths found
                </h3>
                <p className="text-sm text-[var(--forge-text-muted)] text-center max-w-md">
                    Try adjusting your filters or search terms to find learning paths that match your interests.
                </p>
            </div>
        </div>
    );
}
