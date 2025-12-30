"use client";

import React, { useMemo, memo, useState, useCallback } from "react";
import { GitCompare, Code2 } from "lucide-react";
import { CodeBlock } from "@/app/shared/components";
import { cn, elevation } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { DiffView } from "../components/DiffView";
import { hasChanges as checkHasChanges } from "../lib/codeDiff";
import type { CodeSlot } from "../lib/contentSlots";
import type { ChapterState } from "../lib/useChapterState";

export interface CodeSlotRendererProps {
    slot: CodeSlot;
    state: ChapterState;
    className?: string;
}

/**
 * CodeSlotRenderer - Renders syntax-highlighted code blocks with optional diff view
 *
 * Features:
 * - Standard code display with syntax highlighting
 * - GitHub-style diff view when previousCode is provided
 * - "Show Changes" toggle to switch between views
 * - Stats summary showing lines added/removed
 *
 * Memoized to prevent re-renders when unrelated ChapterState properties change.
 */
const CodeSlotRendererComponent: React.FC<CodeSlotRendererProps> = ({ slot, className }) => {
    const { data } = slot;

    // Determine if diff view is available
    const hasPreviousCode = Boolean(data.previousCode);
    const hasActualChanges = hasPreviousCode && checkHasChanges(data.previousCode!, data.code);

    // State for toggling between diff and normal view
    const [showDiff, setShowDiff] = useState(
        hasActualChanges && (data.showDiffByDefault ?? false)
    );

    const toggleDiffView = useCallback(() => {
        setShowDiff((prev) => !prev);
    }, []);

    // Memoize code block props to prevent unnecessary prop object recreation
    const codeBlockProps = useMemo(() => ({
        code: data.code,
        language: data.language ?? "typescript",
        filename: data.filename,
        showLineNumbers: data.showLineNumbers ?? true,
        showCopy: data.showCopy ?? true,
        showHeader: data.showHeader,
    }), [data.code, data.language, data.filename, data.showLineNumbers, data.showCopy, data.showHeader]);

    // If no previous code or no changes, show normal code block
    if (!hasActualChanges) {
        return (
            <CodeBlock
                {...codeBlockProps}
                className={className}
                data-testid={`code-slot-${slot.id}`}
            />
        );
    }

    // Show code with diff toggle
    return (
        <div className={cn("space-y-0 rounded-xl overflow-hidden", elevation.flat, className)} data-testid={`code-slot-${slot.id}`}>
            {/* Toggle Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[var(--forge-bg-anvil)] rounded-t-xl border-b border-[var(--forge-border-subtle)]">
                <div className="flex items-center gap-2">
                    {showDiff ? (
                        <GitCompare size={ICON_SIZES.sm} className="text-[var(--ember)]" />
                    ) : (
                        <Code2 size={ICON_SIZES.sm} className="text-[var(--forge-text-muted)]" />
                    )}
                    {data.filename && (
                        <span className="text-xs font-medium text-[var(--forge-text-muted)]">
                            {data.filename}
                        </span>
                    )}
                    {!data.filename && data.language && (
                        <span className="text-xs font-medium text-[var(--forge-text-muted)] uppercase">
                            {data.language}
                        </span>
                    )}
                </div>

                {/* Show Changes Toggle */}
                <button
                    onClick={toggleDiffView}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium transition-colors",
                        showDiff
                            ? "bg-[var(--ember)]/20 text-[var(--ember)] hover:bg-[var(--ember)]/30"
                            : "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)] hover:bg-[var(--forge-bg-anvil)] hover:text-[var(--forge-text-secondary)]"
                    )}
                    data-testid="code-show-changes-toggle"
                    aria-pressed={showDiff}
                >
                    <GitCompare size={14} />
                    {showDiff ? "Hide Changes" : "Show Changes"}
                </button>
            </div>

            {/* Content Area */}
            {showDiff ? (
                <div className="rounded-b-xl overflow-hidden">
                    <DiffView
                        oldCode={data.previousCode!}
                        newCode={data.code}
                        oldFilename={data.previousFilename ?? data.filename}
                        newFilename={data.filename}
                        className="rounded-t-none border-t-0"
                    />
                </div>
            ) : (
                <CodeBlock
                    {...codeBlockProps}
                    showHeader={false}
                    className="rounded-t-none"
                />
            )}
        </div>
    );
};

/**
 * Custom comparison function for CodeSlotRenderer
 * Only re-renders when slot or className changes (not state)
 */
function areCodePropsEqual(
    prevProps: CodeSlotRendererProps,
    nextProps: CodeSlotRendererProps
): boolean {
    // Check slot identity and data
    if (prevProps.slot.id !== nextProps.slot.id) return false;
    if (prevProps.className !== nextProps.className) return false;

    const prevData = prevProps.slot.data;
    const nextData = nextProps.slot.data;
    return (
        prevData.code === nextData.code &&
        prevData.language === nextData.language &&
        prevData.filename === nextData.filename &&
        prevData.showLineNumbers === nextData.showLineNumbers &&
        prevData.showCopy === nextData.showCopy &&
        prevData.showHeader === nextData.showHeader &&
        prevData.previousCode === nextData.previousCode &&
        prevData.previousFilename === nextData.previousFilename &&
        prevData.showDiffByDefault === nextData.showDiffByDefault
    );
}

export const CodeSlotRenderer = memo(CodeSlotRendererComponent, areCodePropsEqual);

export default CodeSlotRenderer;
