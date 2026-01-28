"use client";

import React, { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import DOMPurify from "dompurify";
import { Lightbulb, AlertTriangle, Info, Copy, Check } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";

// ============================================================================
// XSS Sanitization Configuration
// ============================================================================

/**
 * DOMPurify configuration for markdown content sanitization.
 * Whitelists only safe HTML tags and attributes to prevent XSS attacks.
 * This is critical for user-generated content like peer solutions.
 */
const ALLOWED_TAGS = [
    // Text formatting
    "p", "br", "strong", "b", "em", "i", "u", "s", "del", "ins", "mark",
    "sub", "sup", "small",
    // Headings
    "h1", "h2", "h3", "h4", "h5", "h6",
    // Lists
    "ul", "ol", "li",
    // Code
    "pre", "code", "kbd", "samp", "var",
    // Tables
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup", "col",
    // Block elements
    "div", "span", "blockquote", "hr",
    // Links and images
    "a", "img",
    // Details/summary (for collapsible content)
    "details", "summary",
];

const ALLOWED_ATTR = [
    // Common
    "class", "id", "title",
    // Links
    "href", "target", "rel",
    // Images
    "src", "alt", "width", "height",
    // Tables
    "colspan", "rowspan", "scope",
    // Code blocks (for syntax highlighting)
    "data-language",
];

const FORBID_TAGS = ["script", "style", "iframe", "object", "embed", "form", "input", "button", "textarea", "select"];
const FORBID_ATTR = ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "onchange", "onsubmit", "style"];

/**
 * Sanitize markdown content to prevent XSS attacks.
 * This should be called BEFORE passing content to ReactMarkdown.
 *
 * Note: While ReactMarkdown provides some sanitization, DOMPurify adds
 * an extra defense layer especially important for user-generated content.
 */
function sanitizeContent(content: string): string {
    if (typeof window === "undefined") {
        // Server-side: return content as-is (ReactMarkdown handles basic sanitization)
        // Note: For full SSR support, consider using isomorphic-dompurify
        return content;
    }

    return DOMPurify.sanitize(content, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
        FORBID_TAGS,
        FORBID_ATTR,
        // Force all links to open in new tab and have safe rel attributes
        ADD_ATTR: ["target", "rel"],
        // Disallow data: and javascript: URLs
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    });
}

// ============================================================================
// Types
// ============================================================================

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

type CalloutType = 'tip' | 'warning' | 'info';

// ============================================================================
// Callout Component
// ============================================================================

interface CalloutProps {
    type: CalloutType;
    children: React.ReactNode;
}

function Callout({ type, children }: CalloutProps) {
    const config = {
        tip: {
            icon: Lightbulb,
            borderColor: "border-l-green-500",
            iconColor: "text-green-500",
            labelColor: "text-green-600 dark:text-green-400",
            label: "Tip"
        },
        warning: {
            icon: AlertTriangle,
            borderColor: "border-l-amber-500",
            iconColor: "text-amber-500",
            labelColor: "text-amber-600 dark:text-amber-400",
            label: "Warning"
        },
        info: {
            icon: Info,
            borderColor: "border-l-blue-500",
            iconColor: "text-blue-500",
            labelColor: "text-blue-600 dark:text-blue-400",
            label: "Note"
        }
    };

    const { icon: Icon, borderColor, iconColor, labelColor, label } = config[type];

    // Compact inline design - single line with icon
    return (
        <div className={cn(
            "flex items-start gap-2.5 py-2.5 px-3 my-3",
            "border-l-2 bg-[var(--forge-bg-elevated)]/50 rounded-r-lg",
            borderColor
        )}>
            <Icon size={16} className={cn(iconColor, "flex-shrink-0 mt-0.5")} />
            <div className="flex-1 min-w-0 text-sm">
                <span className={cn("font-medium mr-1.5", labelColor)}>{label}:</span>
                <span className="text-[var(--forge-text-secondary)] [&>p]:inline [&>p]:mb-0">
                    {children}
                </span>
            </div>
        </div>
    );
}

// ============================================================================
// Code Block Component
// ============================================================================

interface CodeBlockProps {
    children: React.ReactNode;
    className?: string;
}

function CodeBlock({ children, className }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);
    const language = className?.replace("language-", "") || "text";
    const codeString = String(children).replace(/\n$/, "");

    const handleCopy = () => {
        navigator.clipboard.writeText(codeString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group my-4">
            <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
                <span className="text-xs text-[var(--forge-text-muted)] bg-[var(--forge-bg-elevated)]/80 px-2 py-0.5 rounded">
                    {language}
                </span>
                <button
                    onClick={handleCopy}
                    className="p-1.5 rounded bg-[var(--forge-bg-elevated)] hover:bg-[var(--forge-bg-bench)] transition-colors opacity-0 group-hover:opacity-100"
                    title="Copy code"
                >
                    {copied ? (
                        <Check size={14} className="text-green-500" />
                    ) : (
                        <Copy size={14} className="text-[var(--forge-text-muted)]" />
                    )}
                </button>
            </div>
            <pre className={cn(
                "bg-[var(--forge-bg-void)] rounded-lg p-4 pt-10 overflow-x-auto",
                "border border-[var(--forge-border-subtle)]",
                "text-sm font-mono",
                className
            )}>
                <code>{children}</code>
            </pre>
        </div>
    );
}

// ============================================================================
// Inline Code Component
// ============================================================================

function InlineCode({ children }: { children: React.ReactNode }) {
    return (
        <code className="px-1.5 py-0.5 bg-[var(--ember)]/10 text-[var(--ember)] rounded text-sm font-mono">
            {children}
        </code>
    );
}

// ============================================================================
// Custom Markdown Components
// ============================================================================

const markdownComponents = {
    pre: ({ children }: { children: React.ReactNode }) => {
        // Just pass through, let code handle the rendering
        return <>{children}</>;
    },
    code: ({ inline, className, children, ...props }: {
        inline?: boolean;
        className?: string;
        children: React.ReactNode;
    }) => {
        // Check if this is truly inline code (no newlines, no language class)
        const codeString = String(children);
        const hasNewlines = codeString.includes('\n');
        const hasLanguageClass = className?.startsWith('language-');
        const isInlineCode = inline || (!hasNewlines && !hasLanguageClass);

        if (isInlineCode) {
            return <InlineCode>{children}</InlineCode>;
        }
        return <CodeBlock className={className}>{children}</CodeBlock>;
    },
    h2: ({ children }: { children: React.ReactNode }) => (
        <h2 className="text-2xl font-bold text-[var(--forge-text-primary)] mt-8 mb-4 first:mt-0">
            {children}
        </h2>
    ),
    h3: ({ children }: { children: React.ReactNode }) => (
        <h3 className="text-xl font-semibold text-[var(--forge-text-primary)] mt-6 mb-3">
            {children}
        </h3>
    ),
    h4: ({ children }: { children: React.ReactNode }) => (
        <h4 className="text-lg font-semibold text-[var(--forge-text-primary)] mt-4 mb-2">
            {children}
        </h4>
    ),
    p: ({ children, node }: { children: React.ReactNode; node?: any }) => {
        // Use div instead of p to avoid hydration errors when code blocks are nested
        // This is safer than trying to detect block elements which can fail after minification
        return (
            <div className="text-[var(--forge-text-secondary)] leading-relaxed mb-4 [&:last-child]:mb-0">
                {children}
            </div>
        );
    },
    ul: ({ children }: { children: React.ReactNode }) => (
        <ul className="list-disc list-inside space-y-2 mb-4 text-[var(--forge-text-secondary)] ml-2">
            {children}
        </ul>
    ),
    ol: ({ children }: { children: React.ReactNode }) => (
        <ol className="list-decimal list-inside space-y-2 mb-4 text-[var(--forge-text-secondary)] ml-2">
            {children}
        </ol>
    ),
    li: ({ children }: { children: React.ReactNode }) => (
        <li className="leading-relaxed">{children}</li>
    ),
    blockquote: ({ children }: { children: React.ReactNode }) => (
        <blockquote className="border-l-4 border-[var(--ember)] pl-4 my-4 italic text-[var(--forge-text-muted)]">
            {children}
        </blockquote>
    ),
    table: ({ children }: { children: React.ReactNode }) => (
        <div className="overflow-x-auto my-4">
            <table className="w-full border-collapse border border-[var(--forge-border-subtle)]">
                {children}
            </table>
        </div>
    ),
    thead: ({ children }: { children: React.ReactNode }) => (
        <thead className="bg-[var(--forge-bg-elevated)]">{children}</thead>
    ),
    th: ({ children }: { children: React.ReactNode }) => (
        <th className="border border-[var(--forge-border-subtle)] px-4 py-2 text-left font-semibold text-[var(--forge-text-primary)]">
            {children}
        </th>
    ),
    td: ({ children }: { children: React.ReactNode }) => (
        <td className="border border-[var(--forge-border-subtle)] px-4 py-2 text-[var(--forge-text-secondary)]">
            {children}
        </td>
    ),
    strong: ({ children }: { children: React.ReactNode }) => (
        <strong className="font-semibold text-[var(--forge-text-primary)]">{children}</strong>
    ),
    a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
        <a
            href={href}
            className="text-[var(--ember)] hover:text-[var(--ember-glow)] underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
        >
            {children}
        </a>
    ),
    hr: () => (
        <hr className="my-8 border-[var(--forge-border-subtle)]" />
    ),
};

// ============================================================================
// Callout Processing
// ============================================================================

/**
 * Process content to extract custom callouts (:::tip, :::warning, :::info)
 * and render them as special Callout components
 */
function processCallouts(content: string): React.ReactNode[] {
    const calloutRegex = /:::(tip|warning|info)\n([\s\S]*?):::/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    while ((match = calloutRegex.exec(content)) !== null) {
        // Add content before callout
        if (match.index > lastIndex) {
            const beforeContent = content.slice(lastIndex, match.index);
            if (beforeContent.trim()) {
                parts.push(
                    <ReactMarkdown
                        key={`md-${keyIndex++}`}
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={markdownComponents as any}
                    >
                        {beforeContent}
                    </ReactMarkdown>
                );
            }
        }

        // Add callout
        const type = match[1] as CalloutType;
        const calloutContent = match[2].trim();
        parts.push(
            <Callout key={`callout-${keyIndex++}`} type={type}>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents as any}
                >
                    {calloutContent}
                </ReactMarkdown>
            </Callout>
        );

        lastIndex = match.index + match[0].length;
    }

    // Add remaining content
    if (lastIndex < content.length) {
        const remainingContent = content.slice(lastIndex);
        if (remainingContent.trim()) {
            parts.push(
                <ReactMarkdown
                    key={`md-${keyIndex++}`}
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={markdownComponents as any}
                >
                    {remainingContent}
                </ReactMarkdown>
            );
        }
    }

    // If no callouts found, render entire content
    if (parts.length === 0) {
        parts.push(
            <ReactMarkdown
                key="md-full"
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={markdownComponents as any}
            >
                {content}
            </ReactMarkdown>
        );
    }

    return parts;
}

// ============================================================================
// Main Component
// ============================================================================

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    // Sanitize content first to prevent XSS attacks from user-generated content
    const sanitizedContent = useMemo(() => sanitizeContent(content), [content]);
    const processedContent = useMemo(() => processCallouts(sanitizedContent), [sanitizedContent]);

    return (
        <div className={cn("markdown-content", className)} data-testid="markdown-renderer">
            {processedContent}
        </div>
    );
}

export default MarkdownRenderer;
