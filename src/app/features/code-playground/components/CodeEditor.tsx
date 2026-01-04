"use client";

import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import json from "highlight.js/lib/languages/json";
import "highlight.js/styles/vs2015.css";
import { cn } from "@/app/shared/lib/utils";
import type { Concept, ConceptCodeRegion } from "../lib/conceptBridge";
import { ConceptHighlightLayer } from "./ConceptHighlightLayer";
import { ConceptLineBadge } from "./ConceptLineBadge";
import { ConceptTooltip } from "./ConceptTooltip";

// Register languages
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("jsx", javascript);
hljs.registerLanguage("tsx", typescript);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("json", json);

export interface CodeEditorHandle {
    scrollToLine: (lineNumber: number) => void;
}

interface CodeEditorProps {
    code: string;
    language: string;
    onChange: (value: string) => void;
    className?: string;
    readOnly?: boolean;
    /** Set of line numbers that have errors */
    errorLines?: Set<number>;
    /** Currently highlighted line (will flash briefly) */
    highlightedLine?: number | null;
    /** Callback when an error line indicator is clicked */
    onErrorLineClick?: (lineNumber: number) => void;
    /** Concept code regions for this file */
    conceptRegions?: ConceptCodeRegion[];
    /** Currently active concept ID (highlighted from curriculum content) */
    activeConceptId?: string | null;
    /** Whether concept highlighting is enabled */
    conceptsEnabled?: boolean;
    /** Function to get concepts for a specific line */
    getConceptsForLine?: (lineNumber: number) => Concept[];
    /** Callback when a concept is clicked */
    onConceptClick?: (concept: Concept) => void;
    /** Callback when hovering over a concept line */
    onConceptLineHover?: (lineNumber: number | null) => void;
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(function CodeEditor({
    code,
    language,
    onChange,
    className,
    readOnly = false,
    errorLines,
    highlightedLine,
    onErrorLineClick,
    conceptRegions = [],
    activeConceptId = null,
    conceptsEnabled = false,
    getConceptsForLine,
    onConceptClick,
    onConceptLineHover,
}, ref) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLPreElement>(null);
    const [highlightedCode, setHighlightedCode] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const [flashingLine, setFlashingLine] = useState<number | null>(null);
    const [activeLine, setActiveLine] = useState<number>(1);

    // Concept bridge state
    const [conceptHoveredLine, setConceptHoveredLine] = useState<number | null>(null);
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [tooltipConcepts, setTooltipConcepts] = useState<Concept[]>([]);
    const [isTooltipSticky, setIsTooltipSticky] = useState(false);

    // Expose scrollToLine method via ref
    useImperativeHandle(ref, () => ({
        scrollToLine: (lineNumber: number) => {
            const textarea = textareaRef.current;
            const container = containerRef.current;
            if (!textarea || !container) return;

            const lineHeight = 24; // 6 units (h-6) = 24px
            const scrollTop = Math.max(0, (lineNumber - 1) * lineHeight - container.clientHeight / 3);

            textarea.scrollTop = scrollTop;
            if (highlightRef.current) {
                highlightRef.current.scrollTop = scrollTop;
            }
            if (lineNumbersRef.current) {
                const lineNumsInner = lineNumbersRef.current.querySelector('div');
                if (lineNumsInner) {
                    lineNumsInner.scrollTop = scrollTop;
                }
            }

            // Trigger flash animation
            setFlashingLine(lineNumber);
            setTimeout(() => setFlashingLine(null), 1500);
        },
    }));

    // Handle external highlight line changes
    useEffect(() => {
        if (highlightedLine !== null && highlightedLine !== undefined) {
            setFlashingLine(highlightedLine);
            setTimeout(() => setFlashingLine(null), 1500);
        }
    }, [highlightedLine]);

    // Highlight code
    useEffect(() => {
        try {
            const highlighted = hljs.highlight(code || "", {
                language: language === "jsx" || language === "tsx" ? "javascript" : language,
                ignoreIllegals: true,
            });
            setHighlightedCode(highlighted.value);
        } catch {
            setHighlightedCode(escapeHtml(code || ""));
        }
    }, [code, language]);

    // Sync scroll between textarea and highlighted code
    const handleScroll = useCallback(() => {
        if (textareaRef.current && highlightRef.current) {
            highlightRef.current.scrollTop = textareaRef.current.scrollTop;
            highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    }, []);

    // Handle input changes
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            onChange(e.target.value);
        },
        [onChange]
    );

    // Calculate active line from cursor position
    const updateActiveLine = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const cursorPosition = textarea.selectionStart;
        const textBeforeCursor = textarea.value.substring(0, cursorPosition);
        const lineNumber = textBeforeCursor.split("\n").length;

        setActiveLine(lineNumber);
    }, []);

    // Handle click/selection change to update active line
    const handleSelect = useCallback(() => {
        updateActiveLine();
    }, [updateActiveLine]);

    // Handle focus to update active line
    const handleFocus = useCallback(() => {
        updateActiveLine();
    }, [updateActiveLine]);

    // Handle tab key for indentation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Tab") {
                e.preventDefault();
                const textarea = textareaRef.current;
                if (!textarea) return;

                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const value = textarea.value;

                // Insert 2 spaces for tab
                const newValue = value.substring(0, start) + "  " + value.substring(end);
                onChange(newValue);

                // Move cursor after inserted spaces
                requestAnimationFrame(() => {
                    textarea.selectionStart = textarea.selectionEnd = start + 2;
                    updateActiveLine();
                });
            } else {
                // Update active line on any key press
                requestAnimationFrame(updateActiveLine);
            }
        },
        [onChange, updateActiveLine]
    );

    const lines = (code || "").split("\n");
    const lineCount = Math.max(lines.length, 1);

    // Handle concept badge click
    const handleConceptBadgeClick = useCallback(
        (lineNumber: number, concepts: Concept[], event?: React.MouseEvent) => {
            if (concepts.length === 0) return;

            const rect = event?.currentTarget?.getBoundingClientRect();
            if (rect) {
                setTooltipPosition({
                    x: rect.right + 8,
                    y: rect.top,
                });
            }
            setTooltipConcepts(concepts);
            setIsTooltipSticky(true);
            setTooltipVisible(true);
        },
        []
    );

    // Handle concept badge hover
    const handleConceptBadgeHover = useCallback(
        (lineNumber: number | null) => {
            setConceptHoveredLine(lineNumber);
            onConceptLineHover?.(lineNumber);

            if (lineNumber === null) {
                // Only hide tooltip if not sticky
                if (!isTooltipSticky) {
                    setTooltipVisible(false);
                }
                return;
            }

            // Get concepts for this line
            const concepts = getConceptsForLine?.(lineNumber) || [];
            if (concepts.length > 0 && !isTooltipSticky) {
                // Calculate position based on line number
                const lineElement = lineNumbersRef.current?.querySelector(`[data-line="${lineNumber}"]`);
                if (lineElement) {
                    const rect = lineElement.getBoundingClientRect();
                    setTooltipPosition({
                        x: rect.right + 8,
                        y: rect.top,
                    });
                } else {
                    // Fallback position calculation
                    const container = containerRef.current;
                    if (container) {
                        const containerRect = container.getBoundingClientRect();
                        setTooltipPosition({
                            x: containerRect.left + 70,
                            y: containerRect.top + 12 + (lineNumber - 1) * 24,
                        });
                    }
                }
                setTooltipConcepts(concepts);
                setTooltipVisible(true);
            }
        },
        [getConceptsForLine, isTooltipSticky, onConceptLineHover]
    );

    // Handle concept tooltip concept click
    const handleTooltipConceptClick = useCallback(
        (concept: Concept) => {
            setTooltipVisible(false);
            setIsTooltipSticky(false);
            onConceptClick?.(concept);
        },
        [onConceptClick]
    );

    // Handle tooltip close
    const handleTooltipClose = useCallback(() => {
        setTooltipVisible(false);
        setIsTooltipSticky(false);
    }, []);

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative font-mono text-sm bg-[var(--forge-bg-void)] rounded overflow-hidden",
                className
            )}
            data-testid="code-editor-container"
        >
            {/* Line numbers */}
            <div
                ref={lineNumbersRef}
                className="absolute left-0 top-0 bottom-0 w-14 bg-[var(--forge-bg-void)] border-r border-[var(--forge-border-subtle)] select-none z-10 overflow-hidden"
                data-testid="code-editor-line-numbers"
            >
                <div className="p-3 text-right overflow-hidden" style={{ height: '100%' }}>
                    {Array.from({ length: lineCount }, (_, i) => {
                        const lineNum = i + 1;
                        const hasError = errorLines?.has(lineNum);
                        const isFlashing = flashingLine === lineNum;
                        const isActive = activeLine === lineNum;
                        const lineConcepts = conceptsEnabled ? (getConceptsForLine?.(lineNum) || []) : [];
                        const hasConcepts = lineConcepts.length > 0;

                        return (
                            <div
                                key={i}
                                className={cn(
                                    "leading-6 h-6 flex items-center justify-end gap-1 pr-1 transition-colors duration-75",
                                    hasError && "text-[var(--forge-error)]",
                                    !hasError && !isActive && "text-[var(--forge-text-muted)]",
                                    !hasError && isActive && "text-[var(--forge-text-secondary)]",
                                    isFlashing && "bg-[var(--forge-error)]/30 animate-pulse",
                                    isActive && !isFlashing && "bg-[var(--forge-bg-elevated)]/30"
                                )}
                                data-line={lineNum}
                                data-testid={hasError ? `error-line-${lineNum}` : hasConcepts ? `concept-line-${lineNum}` : undefined}
                            >
                                {/* Concept badge - shown when concepts are enabled and line has concepts */}
                                {hasConcepts && !hasError && (
                                    <ConceptLineBadge
                                        concepts={lineConcepts}
                                        lineNumber={lineNum}
                                        onClick={(ln, concepts) => {
                                            const lineEl = lineNumbersRef.current?.querySelector(`[data-line="${ln}"]`);
                                            if (lineEl) {
                                                const rect = lineEl.getBoundingClientRect();
                                                setTooltipPosition({ x: rect.right + 8, y: rect.top });
                                            }
                                            handleConceptBadgeClick(ln, concepts);
                                        }}
                                        onHover={handleConceptBadgeHover}
                                        isHighlighted={conceptHoveredLine === lineNum || lineConcepts.some(c => c.id === activeConceptId)}
                                    />
                                )}
                                {hasError && (
                                    <button
                                        onClick={() => onErrorLineClick?.(lineNum)}
                                        className="w-2 h-2 rounded-full bg-[var(--forge-error)] shrink-0 hover:ring-2 hover:ring-[var(--forge-error)]/50 transition-all cursor-pointer"
                                        title={`Error at line ${lineNum}`}
                                        data-testid={`error-indicator-${lineNum}`}
                                    />
                                )}
                                <span>{lineNum}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Code display container */}
            <div className="relative ml-14 overflow-auto" style={{ height: "100%" }}>
                {/* Concept highlight layer (bottom-most) */}
                {conceptsEnabled && conceptRegions.length > 0 && (
                    <ConceptHighlightLayer
                        regions={conceptRegions}
                        activeConceptId={activeConceptId}
                        hoveredLine={conceptHoveredLine}
                        isEnabled={conceptsEnabled}
                        lineHeight={24}
                        topPadding={12}
                    />
                )}

                {/* Active line highlight layer */}
                <div
                    className="absolute left-0 right-0 pointer-events-none"
                    style={{
                        top: `${12 + (activeLine - 1) * 24}px`, // 12px padding + line offset
                        height: "24px",
                        backgroundColor: "var(--forge-bg-elevated)",
                        opacity: 0.3,
                        transition: "top 0.05s ease-out",
                    }}
                    aria-hidden="true"
                    data-testid="code-editor-active-line-highlight"
                />

                {/* Highlighted code layer (background) */}
                <pre
                    ref={highlightRef}
                    className="absolute inset-0 p-3 m-0 text-[var(--forge-text-secondary)] overflow-hidden pointer-events-none leading-6"
                    aria-hidden="true"
                >
                    <code
                        className={`hljs language-${language}`}
                        dangerouslySetInnerHTML={{ __html: highlightedCode + "\n" }}
                    />
                </pre>

                {/* Textarea layer (editable, transparent) */}
                <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={handleChange}
                    onScroll={handleScroll}
                    onKeyDown={handleKeyDown}
                    onSelect={handleSelect}
                    onClick={handleSelect}
                    onFocus={handleFocus}
                    readOnly={readOnly}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoComplete="off"
                    autoCorrect="off"
                    className={cn(
                        "relative w-full h-full p-3 m-0 resize-none bg-transparent text-transparent caret-[var(--forge-text-bright)] outline-none leading-6",
                        "selection:bg-[var(--ember)]/30",
                        readOnly && "cursor-default"
                    )}
                    style={{
                        fontFamily: "inherit",
                        fontSize: "inherit",
                        lineHeight: "inherit",
                        whiteSpace: "pre",
                        overflowWrap: "normal",
                        minHeight: `${lineCount * 24 + 24}px`,
                    }}
                    data-testid="code-editor-textarea"
                />
            </div>

            {/* Concept tooltip */}
            {conceptsEnabled && (
                <ConceptTooltip
                    concepts={tooltipConcepts}
                    position={tooltipPosition}
                    isVisible={tooltipVisible}
                    isSticky={isTooltipSticky}
                    onConceptClick={handleTooltipConceptClick}
                    onClose={handleTooltipClose}
                />
            )}
        </div>
    );
});

// HTML escape helper
function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

export default CodeEditor;

export type { CodeEditorProps };
