"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Folder,
    FolderOpen,
    FileCode,
    FileJson,
    FileText,
    ChevronRight,
    ChevronDown,
    AlertTriangle,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { DirectoryNode, ProjectFile } from "../lib/types";

interface CodeExplorerProps {
    structure: DirectoryNode;
    files: ProjectFile[];
    selectedFile: string | null;
    onSelectFile: (path: string) => void;
    modifiedFiles?: string[];
}

export const CodeExplorer: React.FC<CodeExplorerProps> = ({
    structure,
    files,
    selectedFile,
    onSelectFile,
    modifiedFiles = [],
}) => {
    return (
        <div className="h-full overflow-y-auto">
            <div className="p-2">
                <TreeNode
                    node={structure}
                    files={files}
                    selectedFile={selectedFile}
                    onSelectFile={onSelectFile}
                    modifiedFiles={modifiedFiles}
                    level={0}
                />
            </div>
        </div>
    );
};

// Tree node component
interface TreeNodeProps {
    node: DirectoryNode;
    files: ProjectFile[];
    selectedFile: string | null;
    onSelectFile: (path: string) => void;
    modifiedFiles: string[];
    level: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({
    node,
    files,
    selectedFile,
    onSelectFile,
    modifiedFiles,
    level,
}) => {
    const [isExpanded, setIsExpanded] = useState(level < 2);
    const isDirectory = node.type === "directory";
    const isSelected = selectedFile === node.path;
    const isModified = modifiedFiles.includes(node.path);
    const file = files.find((f) => f.path === node.path);
    const hasIssues = file && file.issues.length > 0;

    const getFileIcon = () => {
        if (isDirectory) {
            return isExpanded ? (
                <FolderOpen size={ICON_SIZES.sm} className="text-amber-400" />
            ) : (
                <Folder size={ICON_SIZES.sm} className="text-amber-400" />
            );
        }

        switch (node.language) {
            case "javascript":
            case "typescript":
                return <FileCode size={ICON_SIZES.sm} className="text-yellow-400" />;
            case "json":
                return <FileJson size={ICON_SIZES.sm} className="text-amber-400" />;
            case "markdown":
                return <FileText size={ICON_SIZES.sm} className="text-blue-400" />;
            default:
                return <FileCode size={ICON_SIZES.sm} className="text-[var(--text-muted)]" />;
        }
    };

    const handleClick = () => {
        if (isDirectory) {
            setIsExpanded(!isExpanded);
        } else {
            onSelectFile(node.path);
        }
    };

    return (
        <div>
            <motion.button
                onClick={handleClick}
                className={cn(
                    "w-full flex items-center gap-1 px-2 py-1 rounded-md text-left text-sm",
                    "hover:bg-[var(--surface-overlay)] transition-colors",
                    isSelected && "bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]"
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                whileHover={{ x: 2 }}
            >
                {isDirectory && (
                    <span className="text-[var(--text-muted)]">
                        {isExpanded ? (
                            <ChevronDown size={ICON_SIZES.xs} />
                        ) : (
                            <ChevronRight size={ICON_SIZES.xs} />
                        )}
                    </span>
                )}
                {getFileIcon()}
                <span
                    className={cn(
                        "flex-1 truncate",
                        isSelected ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)]"
                    )}
                >
                    {node.name}
                </span>
                {isModified && (
                    <span className="w-2 h-2 rounded-full bg-amber-400" title="Modified" />
                )}
                {hasIssues && (
                    <AlertTriangle
                        size={ICON_SIZES.xs}
                        className="text-red-400"
                        title={`${file.issues.length} issue(s)`}
                    />
                )}
            </motion.button>

            <AnimatePresence>
                {isDirectory && isExpanded && node.children && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        {node.children.map((child) => (
                            <TreeNode
                                key={child.path}
                                node={child}
                                files={files}
                                selectedFile={selectedFile}
                                onSelectFile={onSelectFile}
                                modifiedFiles={modifiedFiles}
                                level={level + 1}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// File info panel
interface FileInfoProps {
    file: ProjectFile;
}

export const FileInfo: React.FC<FileInfoProps> = ({ file }) => {
    return (
        <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--surface-base)]">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>{file.linesOfCode} lines</span>
                <span>Complexity: {file.complexity}</span>
                {file.issues.length > 0 && (
                    <span className="text-red-400">{file.issues.length} issue(s)</span>
                )}
            </div>
        </div>
    );
};

// Issues list for a file
interface FileIssuesProps {
    file: ProjectFile;
}

export const FileIssues: React.FC<FileIssuesProps> = ({ file }) => {
    if (file.issues.length === 0) return null;

    return (
        <div className="p-3 space-y-2">
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase">
                Known Issues
            </h4>
            {file.issues.map((issue, i) => (
                <div
                    key={i}
                    className={cn(
                        "p-2 rounded-lg text-xs",
                        issue.severity === "critical" && "bg-red-500/10 border border-red-500/20",
                        issue.severity === "high" && "bg-red-500/10",
                        issue.severity === "medium" && "bg-amber-500/10",
                        issue.severity === "low" && "bg-blue-500/10"
                    )}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-medium uppercase",
                                issue.type === "bug" && "bg-red-500/20 text-red-400",
                                issue.type === "security" && "bg-red-500/20 text-red-400",
                                issue.type === "performance" && "bg-amber-500/20 text-amber-400",
                                issue.type === "smell" && "bg-purple-500/20 text-purple-400",
                                issue.type === "style" && "bg-blue-500/20 text-blue-400"
                            )}
                        >
                            {issue.type}
                        </span>
                        <span className="text-[var(--text-muted)]">Line {issue.line}</span>
                    </div>
                    <p className="text-[var(--text-secondary)]">{issue.description}</p>
                </div>
            ))}
        </div>
    );
};
