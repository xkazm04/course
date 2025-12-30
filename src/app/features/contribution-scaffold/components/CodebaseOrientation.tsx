"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Folder,
    FolderOpen,
    FileCode,
    ChevronRight,
    ChevronDown,
    AlertCircle,
    CheckCircle,
    Circle,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { CodebaseOrientation as OrientationType, DirectoryInfo, FileInfo } from "../lib/types";

interface CodebaseOrientationProps {
    orientation: OrientationType;
}

export const CodebaseOrientation: React.FC<CodebaseOrientationProps> = ({
    orientation,
}) => {
    return (
        <div className="space-y-6">
            {/* Overview */}
            <section>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Project Overview
                </h4>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {orientation.overview}
                </p>
            </section>

            {/* Key directories */}
            <section>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                    Key Directories
                </h4>
                <div className="space-y-2">
                    {orientation.keyDirectories.map((dir, index) => (
                        <DirectoryCard key={index} directory={dir} />
                    ))}
                </div>
            </section>

            {/* Relevant files */}
            <section>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                    Files You'll Work With
                </h4>
                <div className="space-y-2">
                    {orientation.relevantFiles.map((file, index) => (
                        <FileCard key={index} file={file} />
                    ))}
                </div>
            </section>

            {/* Architecture notes */}
            {orientation.architectureNotes && (
                <section>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                        Architecture Notes
                    </h4>
                    <div className="p-3 rounded-lg bg-[var(--ember)]/10 border border-[var(--ember)]/20">
                        <p className="text-sm text-[var(--ember)]">
                            {orientation.architectureNotes}
                        </p>
                    </div>
                </section>
            )}

            {/* Style guide */}
            {orientation.styleGuide && (
                <section>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                        Style Guide
                    </h4>
                    <div className="p-3 rounded-lg bg-[var(--surface-overlay)]">
                        <p className="text-sm text-[var(--text-secondary)]">
                            {orientation.styleGuide}
                        </p>
                    </div>
                </section>
            )}
        </div>
    );
};

// Directory card component
interface DirectoryCardProps {
    directory: DirectoryInfo;
}

const DirectoryCard: React.FC<DirectoryCardProps> = ({ directory }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const importanceColors = {
        critical: "text-[var(--forge-error)] bg-[var(--forge-error)]/20",
        relevant: "text-[var(--forge-warning)] bg-[var(--forge-warning)]/20",
        contextual: "text-[var(--forge-text-muted)] bg-[var(--forge-bg-elevated)]",
    };

    return (
        <motion.div
            className={cn(
                "rounded-lg border border-[var(--border-subtle)]",
                "bg-[var(--surface-overlay)] overflow-hidden"
            )}
        >
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-3 p-3"
            >
                <div className="text-[var(--forge-warning)]">
                    {isExpanded ? (
                        <FolderOpen size={ICON_SIZES.md} />
                    ) : (
                        <Folder size={ICON_SIZES.md} />
                    )}
                </div>
                <div className="flex-1 text-left">
                    <code className="text-sm text-[var(--text-primary)] font-mono">
                        {directory.path}
                    </code>
                </div>
                <span className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium",
                    importanceColors[directory.importance]
                )}>
                    {directory.importance}
                </span>
            </button>
            {isExpanded && (
                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    className="px-3 pb-3 border-t border-[var(--border-subtle)]"
                >
                    <p className="text-sm text-[var(--text-muted)] mt-2">
                        {directory.purpose}
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
};

// File card component
interface FileCardProps {
    file: FileInfo;
}

const FileCard: React.FC<FileCardProps> = ({ file }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const likelihoodConfig = {
        high: { icon: AlertCircle, color: "text-[var(--forge-error)]", bg: "bg-[var(--forge-error)]/20", label: "Will modify" },
        medium: { icon: Circle, color: "text-[var(--forge-warning)]", bg: "bg-[var(--forge-warning)]/20", label: "May modify" },
        low: { icon: CheckCircle, color: "text-[var(--forge-success)]", bg: "bg-[var(--forge-success)]/20", label: "Reference only" },
    };

    const config = likelihoodConfig[file.modifyLikelihood];
    const Icon = config.icon;

    return (
        <motion.div
            className={cn(
                "rounded-lg border border-[var(--border-subtle)]",
                "bg-[var(--surface-overlay)] overflow-hidden"
            )}
        >
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-3 p-3"
            >
                <FileCode size={ICON_SIZES.md} className="text-[var(--forge-info)]" />
                <div className="flex-1 text-left min-w-0">
                    <code className="text-sm text-[var(--text-primary)] font-mono truncate block">
                        {file.path}
                    </code>
                </div>
                <div className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                    config.bg,
                    config.color
                )}>
                    <Icon size={ICON_SIZES.xs} />
                    {config.label}
                </div>
                {isExpanded ? (
                    <ChevronDown size={ICON_SIZES.sm} className="text-[var(--text-muted)]" />
                ) : (
                    <ChevronRight size={ICON_SIZES.sm} className="text-[var(--text-muted)]" />
                )}
            </button>
            {isExpanded && (
                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    className="px-3 pb-3 border-t border-[var(--border-subtle)]"
                >
                    <p className="text-sm text-[var(--text-muted)] mt-2">
                        {file.description}
                    </p>
                    {file.lineRanges && file.lineRanges.length > 0 && (
                        <div className="mt-2 space-y-1">
                            <span className="text-xs text-[var(--text-muted)]">Key sections:</span>
                            {file.lineRanges.map((range, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                    <code className="text-[var(--ember)]">L{range.start}-{range.end}</code>
                                    <span className="text-[var(--text-secondary)]">{range.purpose}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}
        </motion.div>
    );
};
