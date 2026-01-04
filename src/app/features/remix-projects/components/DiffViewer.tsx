"use client";

import React, { useState, useRef, useCallback } from "react";
import { Plus, Minus, FileCode, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { elevation } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { ProjectDiff, FileChange } from "../lib/types";
import { EnhancedDiffHunkViewer } from "./DiffHunkViewer";

interface DiffViewerProps {
    diff: ProjectDiff;
    mode?: "unified" | "split";
    scrollToHunk?: number;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
    diff,
    mode = "unified",
    scrollToHunk,
}) => {
    const totalFiles = diff.filesModified + diff.filesAdded + diff.filesDeleted;

    return (
        <div className="space-y-4" data-testid="diff-viewer">
            {/* Summary */}
            <div className={cn("rounded-xl border border-[var(--forge-border-default)] bg-[var(--forge-bg-elevated)] p-4", elevation.elevated)}>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <FileCode size={ICON_SIZES.sm} className="text-[var(--forge-text-muted)]" />
                        <span className="text-sm text-[var(--forge-text-primary)]" data-testid="diff-files-changed">
                            {totalFiles} files changed
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Plus size={ICON_SIZES.sm} className="text-[var(--forge-success)]" />
                        <span className="text-sm text-[var(--forge-success)]" data-testid="diff-lines-added">+{diff.linesAdded}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Minus size={ICON_SIZES.sm} className="text-[var(--forge-error)]" />
                        <span className="text-sm text-[var(--forge-error)]" data-testid="diff-lines-removed">-{diff.linesRemoved}</span>
                    </div>
                </div>
            </div>

            {/* File Diffs */}
            <div className="space-y-3">
                {diff.changes.map((fileChange, fileIndex) => (
                    <FileDiffCard
                        key={fileChange.path}
                        fileChange={fileChange}
                        mode={mode}
                        fileIndex={fileIndex}
                        scrollToHunk={scrollToHunk}
                    />
                ))}
            </div>
        </div>
    );
};

// File diff card
interface FileDiffCardProps {
    fileChange: FileChange;
    mode: "unified" | "split";
    fileIndex: number;
    scrollToHunk?: number;
}

const FileDiffCard: React.FC<FileDiffCardProps> = ({
    fileChange,
    mode,
    fileIndex,
    scrollToHunk,
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    const statusColors = {
        modified: "text-[var(--forge-warning)] bg-[var(--forge-warning)]/10",
        added: "text-[var(--forge-success)] bg-[var(--forge-success)]/10",
        deleted: "text-[var(--forge-error)] bg-[var(--forge-error)]/10",
        renamed: "text-[var(--forge-info)] bg-[var(--forge-info)]/10",
    }[fileChange.type];

    return (
        <div
            ref={containerRef}
            className={cn("rounded-xl border border-[var(--forge-border-default)] bg-[var(--forge-bg-elevated)] overflow-hidden", elevation.elevated)}
            data-testid={`diff-file-card-${fileIndex}`}
        >
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 hover:bg-[var(--forge-bg-anvil)] transition-colors"
                data-testid={`diff-file-header-${fileIndex}`}
            >
                <div className="flex items-center gap-3">
                    <span className={cn("px-2 py-0.5 rounded text-xs font-medium", statusColors)} data-testid={`diff-file-status-${fileIndex}`}>
                        {fileChange.type}
                    </span>
                    <span className="text-sm text-[var(--forge-text-primary)] font-mono" data-testid={`diff-file-path-${fileIndex}`}>
                        {fileChange.path}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--forge-success)]" data-testid={`diff-file-additions-${fileIndex}`}>+{fileChange.linesAdded}</span>
                    <span className="text-xs text-[var(--forge-error)]" data-testid={`diff-file-deletions-${fileIndex}`}>-{fileChange.linesRemoved}</span>
                    {isExpanded ? (
                        <ChevronUp size={ICON_SIZES.sm} className="text-[var(--forge-text-muted)]" />
                    ) : (
                        <ChevronDown size={ICON_SIZES.sm} className="text-[var(--forge-text-muted)]" />
                    )}
                </div>
            </button>

            {/* Hunks - using enhanced viewer */}
            {isExpanded && (
                <div className="border-t border-[var(--forge-border-subtle)]">
                    {fileChange.hunks.map((hunk, hunkIndex) => (
                        <EnhancedDiffHunkViewer
                            key={hunkIndex}
                            hunk={hunk}
                            hunkIndex={hunkIndex}
                            scrollIntoView={scrollToHunk === hunkIndex}
                            collapseLongUnchanged={true}
                            unchangedThreshold={5}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// Compact diff summary for submission results
interface DiffSummaryProps {
    diff: ProjectDiff;
}

export const DiffSummary: React.FC<DiffSummaryProps> = ({ diff }) => {
    const totalFiles = diff.filesModified + diff.filesAdded + diff.filesDeleted;

    return (
        <div className="flex items-center gap-4 p-3 rounded-lg bg-[var(--forge-bg-anvil)]" data-testid="diff-summary">
            <div className="flex items-center gap-1">
                <FileCode size={ICON_SIZES.sm} className="text-[var(--forge-text-muted)]" />
                <span className="text-sm text-[var(--forge-text-primary)]" data-testid="diff-summary-files">
                    {totalFiles} files
                </span>
            </div>
            <div className="flex items-center gap-1 text-[var(--forge-success)]">
                <Plus size={ICON_SIZES.xs} />
                <span className="text-sm" data-testid="diff-summary-additions">{diff.linesAdded}</span>
            </div>
            <div className="flex items-center gap-1 text-[var(--forge-error)]">
                <Minus size={ICON_SIZES.xs} />
                <span className="text-sm" data-testid="diff-summary-deletions">{diff.linesRemoved}</span>
            </div>
        </div>
    );
};
