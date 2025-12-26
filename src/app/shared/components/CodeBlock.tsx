"use client";

import React, { useState, useCallback } from "react";
import { Copy, Check, Code2 } from "lucide-react";
import { cn, elevation } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";

export interface CodeBlockProps {
    /** The code content to display */
    code: string;
    /** Optional filename to show in the header */
    filename?: string;
    /** Programming language for syntax highlighting hints */
    language?: string;
    /** Whether to show line numbers */
    showLineNumbers?: boolean;
    /** Whether to show the copy button */
    showCopy?: boolean;
    /** Whether to show the header bar */
    showHeader?: boolean;
    /** Additional class names for the container */
    className?: string;
    /** Maximum height before scrolling (default: none) */
    maxHeight?: string;
}

/**
 * Shared CodeBlock component with copy-to-clipboard, line numbers, and syntax highlighting support.
 * Provides consistent code display across the course platform.
 */
export const CodeBlock = ({
    code,
    filename,
    language,
    showLineNumbers = false,
    showCopy = true,
    showHeader = true,
    className,
    maxHeight,
}: CodeBlockProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [code]);

    const lines = code.split("\n");

    return (
        <div className={cn("relative rounded-xl overflow-hidden", elevation.flat, className)}>
            {/* Header Bar */}
            {showHeader && (
                <div className="flex items-center justify-between px-4 py-2 bg-slate-800 dark:bg-slate-800">
                    <div className="flex items-center gap-2">
                        <Code2 size={ICON_SIZES.sm} className="text-slate-400" />
                        {filename && (
                            <span className="text-xs font-medium text-slate-400">
                                {filename}
                            </span>
                        )}
                        {!filename && language && (
                            <span className="text-xs font-medium text-slate-400 uppercase">
                                {language}
                            </span>
                        )}
                    </div>
                    {showCopy && (
                        <button
                            onClick={handleCopy}
                            data-testid="code-block-copy-btn"
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                            aria-label={copied ? "Copied!" : "Copy code"}
                        >
                            {copied ? (
                                <Check size={ICON_SIZES.sm} className="text-emerald-400" />
                            ) : (
                                <Copy size={ICON_SIZES.sm} />
                            )}
                            <span>{copied ? "Copied!" : "Copy"}</span>
                        </button>
                    )}
                </div>
            )}

            {/* Code Content */}
            <div
                className={cn(
                    "bg-slate-900 dark:bg-slate-900 overflow-x-auto",
                    !showHeader && "rounded-xl"
                )}
                style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}
            >
                {showLineNumbers ? (
                    <div className="flex">
                        {/* Line Numbers Column */}
                        <div className="flex-shrink-0 py-4 pl-4 pr-2 select-none border-r border-slate-700/50">
                            {lines.map((_, i) => (
                                <div
                                    key={i}
                                    className="text-xs text-slate-500 font-mono leading-6 text-right"
                                    style={{ minWidth: "2ch" }}
                                >
                                    {i + 1}
                                </div>
                            ))}
                        </div>
                        {/* Code Column */}
                        <pre className="flex-1 p-4 overflow-x-auto">
                            <code className="text-sm text-slate-300 font-mono">
                                {lines.map((line, i) => (
                                    <div key={i} className="leading-6">
                                        {line || " "}
                                    </div>
                                ))}
                            </code>
                        </pre>
                    </div>
                ) : (
                    <pre className="p-4">
                        <code className="text-sm text-slate-300 font-mono">{code}</code>
                    </pre>
                )}
            </div>
        </div>
    );
};

export default CodeBlock;
