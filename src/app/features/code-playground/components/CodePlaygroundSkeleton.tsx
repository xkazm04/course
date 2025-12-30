"use client";

import React from "react";
import { cn } from "@/app/shared/lib/utils";

interface CodePlaygroundSkeletonProps {
    height?: string;
    className?: string;
}

// Deterministic line widths for skeleton code lines (looks like real code structure)
const CODE_LINE_WIDTHS = [75, 45, 60, 80, 35, 55, 70, 40, 65, 50, 78, 42, 58, 72, 38];

/**
 * CodePlaygroundSkeleton - Lightweight loading skeleton for CodePlayground
 *
 * Displays a shimmering skeleton that matches the CodePlayground layout
 * while the actual component is being lazy-loaded.
 */
export function CodePlaygroundSkeleton({
    height = "600px",
    className,
}: CodePlaygroundSkeletonProps) {
    return (
        <div
            className={cn(
                "bg-[var(--forge-bg-void)] rounded-2xl overflow-hidden shadow-2xl border border-[var(--forge-border-subtle)]",
                className
            )}
            style={{ height }}
            data-testid="code-playground-skeleton"
        >
            <div className="h-full flex text-[var(--forge-text-secondary)] font-mono text-sm animate-pulse">
                {/* Sidebar Skeleton */}
                <div className="w-[200px] bg-[var(--forge-bg-forge)] border-r border-[var(--forge-border-subtle)] flex flex-col shrink-0">
                    {/* Explorer Header */}
                    <div className="p-3 border-b border-[var(--forge-border-subtle)]">
                        <div className="h-4 w-20 bg-[var(--forge-bg-elevated)] rounded" />
                    </div>

                    {/* File List Skeleton */}
                    <div className="p-2 space-y-2">
                        <div className="h-3 w-12 bg-[var(--forge-bg-anvil)] rounded ml-2" />
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2 px-3 py-1.5"
                            >
                                <div className="w-4 h-4 bg-[var(--forge-bg-elevated)] rounded" />
                                <div
                                    className="h-4 bg-[var(--forge-bg-elevated)] rounded"
                                    style={{ width: `${60 + i * 15}px` }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content Skeleton */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Top Bar Skeleton */}
                    <div className="h-10 bg-[var(--forge-bg-void)] border-b border-[var(--forge-border-subtle)] flex items-center px-4 gap-2">
                        <div className="h-4 w-8 bg-[var(--forge-bg-elevated)] rounded" />
                        <div className="h-4 w-4 bg-[var(--forge-bg-anvil)] rounded" />
                        <div className="h-4 w-16 bg-[var(--forge-bg-elevated)] rounded" />

                        <div className="ml-auto flex items-center gap-2">
                            <div className="h-6 w-16 bg-[var(--forge-bg-elevated)] rounded" />
                            <div className="h-6 w-16 bg-[var(--forge-bg-elevated)] rounded" />
                            <div className="h-6 w-16 bg-[var(--ember)]/50 rounded-lg" />
                            <div className="h-6 w-6 bg-[var(--forge-bg-elevated)] rounded" />
                        </div>
                    </div>

                    {/* Editor and Preview Split Skeleton */}
                    <div className="flex-1 flex flex-col md:flex-row min-h-0">
                        {/* Editor Pane Skeleton */}
                        <div className="flex-1 flex flex-col min-w-0 border-r border-[var(--forge-border-subtle)]">
                            {/* Editor Tab Bar */}
                            <div className="flex bg-[var(--forge-bg-forge)] gap-1 px-2 py-1">
                                <div className="h-7 w-24 bg-[var(--forge-bg-void)] rounded-t border-t-2 border-t-[var(--ember)]/50" />
                            </div>

                            {/* Editor Content - Code Lines */}
                            <div className="flex-1 p-4 space-y-2 overflow-hidden">
                                {/* Line numbers + code lines with deterministic widths */}
                                {CODE_LINE_WIDTHS.map((width, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="w-6 h-4 bg-[var(--forge-bg-anvil)] rounded" />
                                        <div
                                            className="h-4 bg-[var(--forge-bg-elevated)] rounded"
                                            style={{
                                                width: `${width}%`,
                                                opacity: 1 - (i * 0.04)
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Preview Pane Skeleton */}
                        <div className="w-full md:w-[400px] flex flex-col bg-[var(--forge-bg-void)]">
                            {/* Preview Tab Bar */}
                            <div className="flex bg-[var(--forge-bg-forge)] gap-1 px-2 py-1 border-b border-[var(--forge-border-subtle)]">
                                <div className="h-7 w-20 bg-[var(--forge-bg-elevated)] rounded" />
                                <div className="h-7 w-20 bg-[var(--forge-bg-anvil)] rounded" />
                            </div>

                            {/* Preview Content */}
                            <div className="flex-1 flex items-center justify-center bg-[var(--forge-bg-workshop)]/5">
                                <div className="text-center space-y-3">
                                    <div className="w-12 h-12 mx-auto rounded-full bg-[var(--forge-bg-anvil)]" />
                                    <div className="h-4 w-32 bg-[var(--forge-bg-elevated)] rounded mx-auto" />
                                    <div className="h-3 w-24 bg-[var(--forge-bg-anvil)] rounded mx-auto" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CodePlaygroundSkeleton;
