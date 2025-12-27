"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, FileCode, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { elevation } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { ProjectDiff, FileDiff, DiffHunk } from "../lib/types";

interface DiffViewerProps {
    diff: ProjectDiff;
    mode?: "unified" | "split";
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
    diff,
    mode = "unified",
}) => {
    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className={cn("rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] p-4", elevation.elevated)}>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <FileCode size={ICON_SIZES.sm} className="text-[var(--text-muted)]" />
                        <span className="text-sm text-[var(--text-primary)]">
                            {diff.filesChanged} files changed
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Plus size={ICON_SIZES.sm} className="text-emerald-400" />
                        <span className="text-sm text-emerald-400">+{diff.linesAdded}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Minus size={ICON_SIZES.sm} className="text-red-400" />
                        <span className="text-sm text-red-400">-{diff.linesRemoved}</span>
                    </div>
                </div>
            </div>

            {/* File Diffs */}
            <div className="space-y-3">
                {diff.fileDiffs.map((fileDiff) => (
                    <FileDiffCard key={fileDiff.path} fileDiff={fileDiff} mode={mode} />
                ))}
            </div>
        </div>
    );
};

// File diff card
interface FileDiffCardProps {
    fileDiff: FileDiff;
    mode: "unified" | "split";
}

const FileDiffCard: React.FC<FileDiffCardProps> = ({ fileDiff, mode }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const statusColors = {
        modified: "text-amber-400 bg-amber-500/10",
        added: "text-emerald-400 bg-emerald-500/10",
        deleted: "text-red-400 bg-red-500/10",
    }[fileDiff.status];

    return (
        <div className={cn("rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] overflow-hidden", elevation.elevated)}>
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 hover:bg-[var(--surface-overlay)] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className={cn("px-2 py-0.5 rounded text-xs font-medium", statusColors)}>
                        {fileDiff.status}
                    </span>
                    <span className="text-sm text-[var(--text-primary)] font-mono">
                        {fileDiff.path}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-emerald-400">+{fileDiff.additions}</span>
                    <span className="text-xs text-red-400">-{fileDiff.deletions}</span>
                    {isExpanded ? (
                        <ChevronUp size={ICON_SIZES.sm} className="text-[var(--text-muted)]" />
                    ) : (
                        <ChevronDown size={ICON_SIZES.sm} className="text-[var(--text-muted)]" />
                    )}
                </div>
            </button>

            {/* Hunks */}
            {isExpanded && (
                <div className="border-t border-[var(--border-subtle)]">
                    {fileDiff.hunks.map((hunk, i) => (
                        <DiffHunkView key={i} hunk={hunk} />
                    ))}
                </div>
            )}
        </div>
    );
};

// Diff hunk view
interface DiffHunkViewProps {
    hunk: DiffHunk;
}

const DiffHunkView: React.FC<DiffHunkViewProps> = ({ hunk }) => (
    <div className="font-mono text-xs">
        {/* Hunk header */}
        <div className="px-3 py-1 bg-blue-500/10 text-blue-400 border-b border-[var(--border-subtle)]">
            @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
        </div>
        {/* Lines */}
        <div className="divide-y divide-[var(--border-subtle)]">
            {hunk.changes.map((change, i) => (
                <DiffLine key={i} type={change.type} content={change.content} lineNumber={change.lineNumber} />
            ))}
        </div>
    </div>
);

// Individual diff line
interface DiffLineProps {
    type: "add" | "remove" | "context";
    content: string;
    lineNumber?: number;
}

const DiffLine: React.FC<DiffLineProps> = ({ type, content, lineNumber }) => {
    const styles = {
        add: "bg-emerald-500/10 text-emerald-300",
        remove: "bg-red-500/10 text-red-300",
        context: "text-[var(--text-muted)]",
    }[type];

    const prefix = {
        add: "+",
        remove: "-",
        context: " ",
    }[type];

    return (
        <div className={cn("flex", styles)}>
            <span className="w-12 px-2 text-right text-[var(--text-muted)] border-r border-[var(--border-subtle)] select-none">
                {lineNumber || ""}
            </span>
            <span className="w-6 text-center select-none">{prefix}</span>
            <pre className="flex-1 px-2 overflow-x-auto whitespace-pre">{content}</pre>
        </div>
    );
};

// Compact diff summary for submission results
interface DiffSummaryProps {
    diff: ProjectDiff;
}

export const DiffSummary: React.FC<DiffSummaryProps> = ({ diff }) => (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-[var(--surface-overlay)]">
        <div className="flex items-center gap-1">
            <FileCode size={ICON_SIZES.sm} className="text-[var(--text-muted)]" />
            <span className="text-sm text-[var(--text-primary)]">{diff.filesChanged} files</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-400">
            <Plus size={ICON_SIZES.xs} />
            <span className="text-sm">{diff.linesAdded}</span>
        </div>
        <div className="flex items-center gap-1 text-red-400">
            <Minus size={ICON_SIZES.xs} />
            <span className="text-sm">{diff.linesRemoved}</span>
        </div>
    </div>
);
