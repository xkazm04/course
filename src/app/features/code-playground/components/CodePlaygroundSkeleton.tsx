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
                "bg-[#1e1e1e] rounded-2xl overflow-hidden shadow-2xl border border-white/10",
                className
            )}
            style={{ height }}
            data-testid="code-playground-skeleton"
        >
            <div className="h-full flex text-neutral-300 font-mono text-sm animate-pulse">
                {/* Sidebar Skeleton */}
                <div className="w-[200px] bg-[#252526] border-r border-[#3e3e42] flex flex-col shrink-0">
                    {/* Explorer Header */}
                    <div className="p-3 border-b border-[#3e3e42]">
                        <div className="h-4 w-20 bg-neutral-700/50 rounded" />
                    </div>

                    {/* File List Skeleton */}
                    <div className="p-2 space-y-2">
                        <div className="h-3 w-12 bg-neutral-700/30 rounded ml-2" />
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2 px-3 py-1.5"
                            >
                                <div className="w-4 h-4 bg-neutral-700/50 rounded" />
                                <div
                                    className="h-4 bg-neutral-700/50 rounded"
                                    style={{ width: `${60 + i * 15}px` }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content Skeleton */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Top Bar Skeleton */}
                    <div className="h-10 bg-[#1e1e1e] border-b border-[#3e3e42] flex items-center px-4 gap-2">
                        <div className="h-4 w-8 bg-neutral-700/50 rounded" />
                        <div className="h-4 w-4 bg-neutral-700/30 rounded" />
                        <div className="h-4 w-16 bg-neutral-700/50 rounded" />

                        <div className="ml-auto flex items-center gap-2">
                            <div className="h-6 w-16 bg-neutral-700/50 rounded" />
                            <div className="h-6 w-16 bg-neutral-700/50 rounded" />
                            <div className="h-6 w-16 bg-emerald-600/50 rounded-lg" />
                            <div className="h-6 w-6 bg-neutral-700/50 rounded" />
                        </div>
                    </div>

                    {/* Editor and Preview Split Skeleton */}
                    <div className="flex-1 flex flex-col md:flex-row min-h-0">
                        {/* Editor Pane Skeleton */}
                        <div className="flex-1 flex flex-col min-w-0 border-r border-[#3e3e42]">
                            {/* Editor Tab Bar */}
                            <div className="flex bg-[#252526] gap-1 px-2 py-1">
                                <div className="h-7 w-24 bg-[#1e1e1e] rounded-t border-t-2 border-t-indigo-500/50" />
                            </div>

                            {/* Editor Content - Code Lines */}
                            <div className="flex-1 p-4 space-y-2 overflow-hidden">
                                {/* Line numbers + code lines with deterministic widths */}
                                {CODE_LINE_WIDTHS.map((width, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="w-6 h-4 bg-neutral-800/50 rounded" />
                                        <div
                                            className="h-4 bg-neutral-700/40 rounded"
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
                        <div className="w-full md:w-[400px] flex flex-col bg-[#1e1e1e]">
                            {/* Preview Tab Bar */}
                            <div className="flex bg-[#252526] gap-1 px-2 py-1 border-b border-[#3e3e42]">
                                <div className="h-7 w-20 bg-neutral-700/40 rounded" />
                                <div className="h-7 w-20 bg-neutral-700/30 rounded" />
                            </div>

                            {/* Preview Content */}
                            <div className="flex-1 flex items-center justify-center bg-white/5">
                                <div className="text-center space-y-3">
                                    <div className="w-12 h-12 mx-auto rounded-full bg-neutral-700/30" />
                                    <div className="h-4 w-32 bg-neutral-700/40 rounded mx-auto" />
                                    <div className="h-3 w-24 bg-neutral-700/30 rounded mx-auto" />
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
