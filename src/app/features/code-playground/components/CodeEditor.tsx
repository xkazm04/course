"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import json from "highlight.js/lib/languages/json";
import "highlight.js/styles/vs2015.css";
import { cn } from "@/app/shared/lib/utils";

// Register languages
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("jsx", javascript);
hljs.registerLanguage("tsx", typescript);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("json", json);

interface CodeEditorProps {
    code: string;
    language: string;
    onChange: (value: string) => void;
    className?: string;
    readOnly?: boolean;
}

export function CodeEditor({
    code,
    language,
    onChange,
    className,
    readOnly = false,
}: CodeEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLPreElement>(null);
    const [highlightedCode, setHighlightedCode] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

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
                });
            }
        },
        [onChange]
    );

    const lines = (code || "").split("\n");
    const lineCount = Math.max(lines.length, 1);

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
                className="absolute left-0 top-0 bottom-0 w-12 bg-[var(--forge-bg-void)] border-r border-[var(--forge-border-subtle)] select-none z-10 overflow-hidden"
                data-testid="code-editor-line-numbers"
            >
                <div className="p-3 text-right">
                    {Array.from({ length: lineCount }, (_, i) => (
                        <div
                            key={i}
                            className="text-[var(--forge-text-muted)] leading-6 h-6"
                        >
                            {i + 1}
                        </div>
                    ))}
                </div>
            </div>

            {/* Code display container */}
            <div className="relative ml-12 overflow-auto" style={{ height: "100%" }}>
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
        </div>
    );
}

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
