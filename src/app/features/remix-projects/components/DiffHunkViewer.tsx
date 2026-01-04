"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { DiffHunk } from "../lib/types";

// ============================================================================
// Types
// ============================================================================

type LineType = "add" | "remove" | "context";

interface ParsedLine {
    type: LineType;
    content: string;
    oldLineNumber: number | null;
    newLineNumber: number | null;
}

interface CollapsedSection {
    startIndex: number;
    endIndex: number;
    lineCount: number;
}

// ============================================================================
// Line Parsing
// ============================================================================

function parseHunkContent(hunk: DiffHunk): ParsedLine[] {
    const lines = hunk.content.split("\n");
    const parsed: ParsedLine[] = [];

    let oldLine = hunk.oldStart;
    let newLine = hunk.newStart;

    for (const line of lines) {
        if (line === "") continue;

        const prefix = line[0];
        const content = line.slice(1);

        if (prefix === "+") {
            parsed.push({
                type: "add",
                content,
                oldLineNumber: null,
                newLineNumber: newLine++,
            });
        } else if (prefix === "-") {
            parsed.push({
                type: "remove",
                content,
                oldLineNumber: oldLine++,
                newLineNumber: null,
            });
        } else {
            // Context line (space prefix or hunk header @@)
            if (prefix === "@") {
                // Skip the hunk header line if present
                continue;
            }
            parsed.push({
                type: "context",
                content: prefix === " " ? content : line,
                oldLineNumber: oldLine++,
                newLineNumber: newLine++,
            });
        }
    }

    return parsed;
}

function findCollapsibleSections(
    lines: ParsedLine[],
    threshold: number = 5
): CollapsedSection[] {
    const sections: CollapsedSection[] = [];
    let contextStart: number | null = null;
    let contextCount = 0;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].type === "context") {
            if (contextStart === null) {
                contextStart = i;
            }
            contextCount++;
        } else {
            if (contextStart !== null && contextCount > threshold) {
                // Keep first 2 and last 2 context lines visible
                const keepStart = 2;
                const keepEnd = 2;
                if (contextCount > keepStart + keepEnd) {
                    sections.push({
                        startIndex: contextStart + keepStart,
                        endIndex: i - keepEnd,
                        lineCount: contextCount - keepStart - keepEnd,
                    });
                }
            }
            contextStart = null;
            contextCount = 0;
        }
    }

    // Handle trailing context lines
    if (contextStart !== null && contextCount > threshold) {
        const keepStart = 2;
        if (contextCount > keepStart) {
            sections.push({
                startIndex: contextStart + keepStart,
                endIndex: lines.length,
                lineCount: contextCount - keepStart,
            });
        }
    }

    return sections;
}

// ============================================================================
// Sub-components
// ============================================================================

interface LineNumberGutterProps {
    oldLineNumber: number | null;
    newLineNumber: number | null;
    type: LineType;
}

const LineNumberGutter: React.FC<LineNumberGutterProps> = ({
    oldLineNumber,
    newLineNumber,
    type,
}) => {
    const gutterBg = {
        add: "bg-green-950/20",
        remove: "bg-red-950/20",
        context: "",
    }[type];

    return (
        <div className={cn(
            "flex-shrink-0 flex font-mono text-xs select-none border-r border-[var(--forge-border-subtle)]",
            gutterBg
        )}>
            <span className="w-12 px-2 text-right text-gray-500" data-testid="diff-line-old-number">
                {oldLineNumber ?? ""}
            </span>
            <span className="w-12 px-2 text-right text-gray-500 border-l border-[var(--forge-border-subtle)]" data-testid="diff-line-new-number">
                {newLineNumber ?? ""}
            </span>
        </div>
    );
};

interface DiffLineContentProps {
    type: LineType;
    content: string;
}

const DiffLineContent: React.FC<DiffLineContentProps> = ({ type, content }) => {
    const lineStyles = {
        add: "bg-green-950/30 text-green-400",
        remove: "bg-red-950/30 text-red-400",
        context: "text-[var(--forge-text-secondary)]",
    }[type];

    const prefix = {
        add: "+",
        remove: "-",
        context: " ",
    }[type];

    return (
        <div className={cn("flex-1 flex font-mono text-xs", lineStyles)}>
            <span className="w-6 flex-shrink-0 text-center select-none opacity-60" data-testid="diff-line-prefix">
                {prefix}
            </span>
            <pre className="flex-1 px-2 overflow-x-auto whitespace-pre" data-testid="diff-line-content">
                {content}
            </pre>
        </div>
    );
};

interface DiffLineProps {
    line: ParsedLine;
    lineIndex: number;
}

const DiffLine: React.FC<DiffLineProps> = ({ line, lineIndex }) => {
    return (
        <div
            className="flex min-h-[1.5rem] hover:brightness-110 transition-all duration-100"
            data-testid={`diff-line-${lineIndex}`}
        >
            <LineNumberGutter
                oldLineNumber={line.oldLineNumber}
                newLineNumber={line.newLineNumber}
                type={line.type}
            />
            <DiffLineContent type={line.type} content={line.content} />
        </div>
    );
};

interface CollapsedIndicatorProps {
    lineCount: number;
    onExpand: () => void;
}

const CollapsedIndicator: React.FC<CollapsedIndicatorProps> = ({
    lineCount,
    onExpand,
}) => {
    return (
        <button
            onClick={onExpand}
            className={cn(
                "w-full flex items-center gap-2 px-4 py-1.5",
                "bg-[var(--forge-bg-anvil)] hover:bg-[var(--forge-bg-elevated)]",
                "border-y border-[var(--forge-border-subtle)]",
                "text-xs text-gray-500 hover:text-[var(--forge-text-primary)]",
                "transition-colors duration-150 cursor-pointer"
            )}
            data-testid="diff-collapsed-indicator"
        >
            <ChevronRight size={ICON_SIZES.xs} />
            <span className="font-mono">
                ... {lineCount} unchanged line{lineCount !== 1 ? "s" : ""} ...
            </span>
        </button>
    );
};

// ============================================================================
// Main Component
// ============================================================================

interface DiffHunkViewerProps {
    hunk: DiffHunk;
    hunkIndex?: number;
    scrollIntoView?: boolean;
    collapseLongUnchanged?: boolean;
    unchangedThreshold?: number;
}

export const DiffHunkViewer: React.FC<DiffHunkViewerProps> = ({
    hunk,
    hunkIndex = 0,
    scrollIntoView = false,
    collapseLongUnchanged = true,
    unchangedThreshold = 5,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

    // Parse the hunk content into structured lines
    const parsedLines = parseHunkContent(hunk);

    // Find collapsible sections
    const collapsibleSections = collapseLongUnchanged
        ? findCollapsibleSections(parsedLines, unchangedThreshold)
        : [];

    // Smooth scroll into view when requested
    useEffect(() => {
        if (scrollIntoView && containerRef.current) {
            containerRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    }, [scrollIntoView]);

    // Handle section expansion
    const handleExpandSection = useCallback((sectionIndex: number) => {
        setExpandedSections((prev) => {
            const next = new Set(prev);
            next.add(sectionIndex);
            return next;
        });
    }, []);

    // Determine if a line should be hidden (inside a collapsed section)
    const isLineHidden = useCallback(
        (lineIndex: number): { hidden: boolean; sectionIndex: number } => {
            for (let i = 0; i < collapsibleSections.length; i++) {
                const section = collapsibleSections[i];
                if (
                    lineIndex >= section.startIndex &&
                    lineIndex < section.endIndex &&
                    !expandedSections.has(i)
                ) {
                    return { hidden: true, sectionIndex: i };
                }
            }
            return { hidden: false, sectionIndex: -1 };
        },
        [collapsibleSections, expandedSections]
    );

    // Build rendered lines with collapsed indicators
    const renderLines = () => {
        const result: React.ReactNode[] = [];
        let lastRenderedSectionIndex = -1;

        for (let i = 0; i < parsedLines.length; i++) {
            const { hidden, sectionIndex } = isLineHidden(i);

            if (hidden) {
                // Show collapsed indicator only once per section
                if (sectionIndex !== lastRenderedSectionIndex) {
                    const section = collapsibleSections[sectionIndex];
                    result.push(
                        <CollapsedIndicator
                            key={`collapsed-${sectionIndex}`}
                            lineCount={section.lineCount}
                            onExpand={() => handleExpandSection(sectionIndex)}
                        />
                    );
                    lastRenderedSectionIndex = sectionIndex;
                }
            } else {
                result.push(
                    <DiffLine key={`line-${i}`} line={parsedLines[i]} lineIndex={i} />
                );
            }
        }

        return result;
    };

    return (
        <div
            ref={containerRef}
            className="font-mono text-xs overflow-hidden"
            data-testid={`diff-hunk-${hunkIndex}`}
        >
            {/* Hunk header */}
            <div
                className="px-4 py-1.5 bg-blue-950/30 text-blue-400 border-b border-[var(--forge-border-subtle)] font-semibold"
                data-testid={`diff-hunk-header-${hunkIndex}`}
            >
                @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
            </div>

            {/* Diff lines */}
            <div className="divide-y divide-[var(--forge-border-subtle)]/30">
                {renderLines()}
            </div>
        </div>
    );
};

// ============================================================================
// Enhanced version that works with change-based hunks
// ============================================================================

interface DiffChange {
    type: "add" | "remove" | "context";
    content: string;
    lineNumber?: number;
}

interface EnhancedDiffHunk {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    changes?: DiffChange[];
    content?: string;
}

interface EnhancedDiffHunkViewerProps {
    hunk: EnhancedDiffHunk;
    hunkIndex?: number;
    scrollIntoView?: boolean;
    collapseLongUnchanged?: boolean;
    unchangedThreshold?: number;
}

export const EnhancedDiffHunkViewer: React.FC<EnhancedDiffHunkViewerProps> = ({
    hunk,
    hunkIndex = 0,
    scrollIntoView = false,
    collapseLongUnchanged = true,
    unchangedThreshold = 5,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

    // Convert changes to parsed lines format
    const parsedLines: ParsedLine[] = React.useMemo(() => {
        if (hunk.changes) {
            let oldLine = hunk.oldStart;
            let newLine = hunk.newStart;

            return hunk.changes.map((change) => {
                if (change.type === "add") {
                    return {
                        type: "add" as const,
                        content: change.content,
                        oldLineNumber: null,
                        newLineNumber: newLine++,
                    };
                } else if (change.type === "remove") {
                    return {
                        type: "remove" as const,
                        content: change.content,
                        oldLineNumber: oldLine++,
                        newLineNumber: null,
                    };
                } else {
                    return {
                        type: "context" as const,
                        content: change.content,
                        oldLineNumber: oldLine++,
                        newLineNumber: newLine++,
                    };
                }
            });
        }

        // Fallback to parsing content string
        if (hunk.content) {
            return parseHunkContent(hunk as DiffHunk);
        }

        return [];
    }, [hunk]);

    // Find collapsible sections
    const collapsibleSections = collapseLongUnchanged
        ? findCollapsibleSections(parsedLines, unchangedThreshold)
        : [];

    // Smooth scroll into view when requested
    useEffect(() => {
        if (scrollIntoView && containerRef.current) {
            containerRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    }, [scrollIntoView]);

    // Handle section expansion
    const handleExpandSection = useCallback((sectionIndex: number) => {
        setExpandedSections((prev) => {
            const next = new Set(prev);
            next.add(sectionIndex);
            return next;
        });
    }, []);

    // Determine if a line should be hidden (inside a collapsed section)
    const isLineHidden = useCallback(
        (lineIndex: number): { hidden: boolean; sectionIndex: number } => {
            for (let i = 0; i < collapsibleSections.length; i++) {
                const section = collapsibleSections[i];
                if (
                    lineIndex >= section.startIndex &&
                    lineIndex < section.endIndex &&
                    !expandedSections.has(i)
                ) {
                    return { hidden: true, sectionIndex: i };
                }
            }
            return { hidden: false, sectionIndex: -1 };
        },
        [collapsibleSections, expandedSections]
    );

    // Build rendered lines with collapsed indicators
    const renderLines = () => {
        const result: React.ReactNode[] = [];
        let lastRenderedSectionIndex = -1;

        for (let i = 0; i < parsedLines.length; i++) {
            const { hidden, sectionIndex } = isLineHidden(i);

            if (hidden) {
                // Show collapsed indicator only once per section
                if (sectionIndex !== lastRenderedSectionIndex) {
                    const section = collapsibleSections[sectionIndex];
                    result.push(
                        <CollapsedIndicator
                            key={`collapsed-${sectionIndex}`}
                            lineCount={section.lineCount}
                            onExpand={() => handleExpandSection(sectionIndex)}
                        />
                    );
                    lastRenderedSectionIndex = sectionIndex;
                }
            } else {
                result.push(
                    <DiffLine key={`line-${i}`} line={parsedLines[i]} lineIndex={i} />
                );
            }
        }

        return result;
    };

    return (
        <div
            ref={containerRef}
            className="font-mono text-xs overflow-hidden"
            data-testid={`diff-hunk-enhanced-${hunkIndex}`}
        >
            {/* Hunk header */}
            <div
                className="px-4 py-1.5 bg-blue-950/30 text-blue-400 border-b border-[var(--forge-border-subtle)] font-semibold"
                data-testid={`diff-hunk-header-enhanced-${hunkIndex}`}
            >
                @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
            </div>

            {/* Diff lines */}
            <div className="divide-y divide-[var(--forge-border-subtle)]/30">
                {renderLines()}
            </div>
        </div>
    );
};

export default DiffHunkViewer;
