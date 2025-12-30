"use client";

import React, { useState, useMemo, useCallback, memo } from "react";
import { ChevronDown, ChevronRight, Plus, Minus, Code2 } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import {
    computeDiff,
    formatDiffStats,
    type DiffHunk,
    type DiffLine,
    type DiffResult,
} from "../lib/codeDiff";

export interface DiffViewProps {
    oldCode: string;
    newCode: string;
    oldFilename?: string;
    newFilename?: string;
    className?: string;
}

/**
 * GitHub-style diff view component
 * Displays code changes with red/green highlighting, line numbers,
 * collapsible unchanged regions, and change statistics.
 */
const DiffViewComponent: React.FC<DiffViewProps> = ({
    oldCode,
    newCode,
    oldFilename,
    newFilename,
    className,
}) => {
    const [collapsedHunks, setCollapsedHunks] = useState<Set<number>>(new Set());

    // Compute diff
    const diffResult: DiffResult = useMemo(
        () => computeDiff(oldCode, newCode),
        [oldCode, newCode]
    );

    const toggleHunkCollapse = useCallback((index: number) => {
        setCollapsedHunks((prev) => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    }, []);

    const statsText = formatDiffStats(diffResult.stats);
    const hasChanges = diffResult.stats.added > 0 || diffResult.stats.removed > 0;

    return (
        <div
            className={cn("rounded-xl overflow-hidden border border-[var(--forge-border-subtle)]", className)}
            data-testid="diff-view-container"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[var(--forge-bg-anvil)] border-b border-[var(--forge-border-subtle)]">
                <div className="flex items-center gap-3">
                    <Code2 size={ICON_SIZES.sm} className="text-[var(--forge-text-muted)]" />
                    <div className="flex items-center gap-2 text-xs text-[var(--forge-text-muted)]">
                        {oldFilename && (
                            <span className="font-medium">{oldFilename}</span>
                        )}
                        {oldFilename && newFilename && newFilename !== oldFilename && (
                            <>
                                <span>→</span>
                                <span className="font-medium">{newFilename}</span>
                            </>
                        )}
                        {!oldFilename && !newFilename && (
                            <span className="font-medium">Code Changes</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Stats badges */}
                    {hasChanges ? (
                        <div className="flex items-center gap-2">
                            {diffResult.stats.added > 0 && (
                                <span
                                    className="flex items-center gap-1 text-xs font-medium text-[var(--forge-success)]"
                                    data-testid="diff-stats-added"
                                >
                                    <Plus size={12} />
                                    {diffResult.stats.added}
                                </span>
                            )}
                            {diffResult.stats.removed > 0 && (
                                <span
                                    className="flex items-center gap-1 text-xs font-medium text-[var(--forge-error)]"
                                    data-testid="diff-stats-removed"
                                >
                                    <Minus size={12} />
                                    {diffResult.stats.removed}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-xs text-[var(--forge-text-muted)]">No changes</span>
                    )}
                </div>
            </div>

            {/* Diff Content */}
            <div className="bg-[var(--forge-bg-void)] overflow-x-auto">
                {diffResult.hunks.map((hunk, hunkIndex) => (
                    <DiffHunkView
                        key={hunkIndex}
                        hunk={hunk}
                        hunkIndex={hunkIndex}
                        isCollapsed={collapsedHunks.has(hunkIndex)}
                        onToggleCollapse={() => toggleHunkCollapse(hunkIndex)}
                        isOnlyHunk={diffResult.hunks.length === 1}
                    />
                ))}

                {/* Show message if no hunks (empty files) */}
                {diffResult.hunks.length === 0 && (
                    <div className="p-4 text-center text-sm text-[var(--forge-text-muted)]">
                        Both versions are empty
                    </div>
                )}
            </div>
        </div>
    );
};

interface DiffHunkViewProps {
    hunk: DiffHunk;
    hunkIndex: number;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    isOnlyHunk: boolean;
}

const DiffHunkView: React.FC<DiffHunkViewProps> = memo(({
    hunk,
    hunkIndex,
    isCollapsed,
    onToggleCollapse,
    isOnlyHunk,
}) => {
    // Count context lines that can be collapsed
    const contextOnlyLines = hunk.lines.filter(l => l.type === "context" || l.type === "unchanged");
    const hasOnlyContext = contextOnlyLines.length === hunk.lines.length;
    const canCollapse = hasOnlyContext && hunk.lines.length > 6;

    // For collapsed view, show first 2, ellipsis, last 2
    const visibleLines = useMemo(() => {
        if (!canCollapse || !isCollapsed) {
            return hunk.lines;
        }
        // Show first 2, then a collapse indicator, then last 2
        const first = hunk.lines.slice(0, 2);
        const last = hunk.lines.slice(-2);
        return [...first, { type: "collapse-indicator" as const, count: hunk.lines.length - 4 }, ...last];
    }, [canCollapse, isCollapsed, hunk.lines]);

    return (
        <div
            className="border-b border-[var(--forge-border-subtle)]/30 last:border-b-0"
            data-testid={`diff-hunk-${hunkIndex}`}
        >
            {/* Hunk header (collapsible region indicator) */}
            {!isOnlyHunk && (
                <div className="flex items-center gap-2 px-4 py-1 bg-[var(--forge-bg-anvil)]/50 text-xs text-[var(--forge-text-muted)] font-mono">
                    <span>@@ -{hunk.startOld} +{hunk.startNew} @@</span>
                </div>
            )}

            {/* Collapsible toggle for context-only sections */}
            {canCollapse && (
                <button
                    onClick={onToggleCollapse}
                    className="flex items-center gap-2 w-full px-4 py-1 bg-[var(--forge-bg-anvil)]/30 hover:bg-[var(--forge-bg-elevated)]/30 text-xs text-[var(--forge-text-muted)] transition-colors"
                    data-testid={`diff-collapse-toggle-${hunkIndex}`}
                >
                    {isCollapsed ? (
                        <ChevronRight size={14} />
                    ) : (
                        <ChevronDown size={14} />
                    )}
                    <span>
                        {isCollapsed
                            ? `Show ${hunk.lines.length} unchanged lines`
                            : `Hide unchanged lines`}
                    </span>
                </button>
            )}

            {/* Lines */}
            <div>
                {visibleLines.map((line, lineIndex) => {
                    if ("count" in line && line.type === "collapse-indicator") {
                        return (
                            <div
                                key={`collapse-${lineIndex}`}
                                className="flex items-center justify-center py-1 bg-[var(--forge-bg-anvil)]/20 text-xs text-[var(--forge-text-muted)]"
                            >
                                ⋮ {line.count} lines hidden
                            </div>
                        );
                    }

                    const diffLine = line as DiffLine;
                    return (
                        <DiffLineView
                            key={lineIndex}
                            line={diffLine}
                            lineIndex={lineIndex}
                        />
                    );
                })}
            </div>
        </div>
    );
});

DiffHunkView.displayName = "DiffHunkView";

interface DiffLineViewProps {
    line: DiffLine;
    lineIndex: number;
}

const DiffLineView: React.FC<DiffLineViewProps> = memo(({ line }) => {
    const lineStyles = {
        added: "bg-[var(--forge-success)]/10 border-l-2 border-[var(--forge-success)]",
        removed: "bg-[var(--forge-error)]/10 border-l-2 border-[var(--forge-error)]",
        unchanged: "",
        context: "bg-[var(--forge-bg-anvil)]/20",
    };

    const prefixStyles = {
        added: "text-[var(--forge-success)]",
        removed: "text-[var(--forge-error)]",
        unchanged: "text-[var(--forge-text-muted)]",
        context: "text-[var(--forge-text-muted)]",
    };

    const prefixChar = {
        added: "+",
        removed: "-",
        unchanged: " ",
        context: " ",
    };

    const lineNumberStyles = {
        added: "text-[var(--forge-success)]/60",
        removed: "text-[var(--forge-error)]/60",
        unchanged: "text-[var(--forge-text-muted)]",
        context: "text-[var(--forge-text-muted)]",
    };

    return (
        <div
            className={cn(
                "flex font-mono text-sm leading-6",
                lineStyles[line.type]
            )}
            data-testid={`diff-line-${line.type}`}
        >
            {/* Old line number */}
            <div
                className={cn(
                    "flex-shrink-0 w-10 text-right pr-2 select-none text-xs",
                    lineNumberStyles[line.type]
                )}
            >
                {line.oldLineNumber ?? ""}
            </div>

            {/* New line number */}
            <div
                className={cn(
                    "flex-shrink-0 w-10 text-right pr-2 select-none text-xs border-r border-[var(--forge-border-subtle)]",
                    lineNumberStyles[line.type]
                )}
            >
                {line.newLineNumber ?? ""}
            </div>

            {/* Prefix (+/-/space) */}
            <div
                className={cn(
                    "flex-shrink-0 w-6 text-center select-none font-bold",
                    prefixStyles[line.type]
                )}
            >
                {prefixChar[line.type]}
            </div>

            {/* Content */}
            <div className="flex-1 pr-4 text-[var(--forge-text-secondary)]">
                <pre className="whitespace-pre">
                    {line.content || " "}
                </pre>
            </div>
        </div>
    );
});

DiffLineView.displayName = "DiffLineView";

export const DiffView = memo(DiffViewComponent);
export default DiffView;
