"use client";

/**
 * Lesson Content Renderer
 *
 * Renders lesson content with support for:
 * - Custom markdown blocks (:::video, :::code, :::callout, etc.)
 * - Standard markdown with GFM support
 * - Interactive components
 */

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import {
    parseMarkdownToBlocks,
    type BlockData,
} from "../lib/markdownParser";
import {
    BlockRenderer,
    VideoBlock,
    CodeBlock,
    CalloutBlock,
    KeypointsBlock,
} from "./CustomBlockRenderer";
import type { FullLesson, LessonSection } from "../lib/types";

// ============================================================================
// Markdown Components for ReactMarkdown
// ============================================================================

const markdownComponents = {
    // Headings
    h1: ({ children }: any) => (
        <h1 className="text-2xl font-bold text-[var(--forge-text-primary)] mt-8 mb-4 first:mt-0">
            {children}
        </h1>
    ),
    h2: ({ children }: any) => (
        <h2 className="text-xl font-semibold text-[var(--forge-text-primary)] mt-6 mb-3 pb-2 border-b border-[var(--forge-border-subtle)]">
            {children}
        </h2>
    ),
    h3: ({ children }: any) => (
        <h3 className="text-lg font-semibold text-[var(--forge-text-primary)] mt-5 mb-2">
            {children}
        </h3>
    ),
    h4: ({ children }: any) => (
        <h4 className="text-base font-semibold text-[var(--forge-text-primary)] mt-4 mb-2">
            {children}
        </h4>
    ),

    // Paragraphs
    p: ({ children }: any) => (
        <p className="text-[var(--forge-text-secondary)] leading-relaxed mb-4 last:mb-0">
            {children}
        </p>
    ),

    // Lists
    ul: ({ children }: any) => (
        <ul className="list-disc list-inside space-y-1 mb-4 text-[var(--forge-text-secondary)]">
            {children}
        </ul>
    ),
    ol: ({ children }: any) => (
        <ol className="list-decimal list-inside space-y-1 mb-4 text-[var(--forge-text-secondary)]">
            {children}
        </ol>
    ),
    li: ({ children }: any) => (
        <li className="text-[var(--forge-text-secondary)]">{children}</li>
    ),

    // Inline elements
    strong: ({ children }: any) => (
        <strong className="font-semibold text-[var(--forge-text-primary)]">{children}</strong>
    ),
    em: ({ children }: any) => (
        <em className="italic text-[var(--forge-text-secondary)]">{children}</em>
    ),
    code: ({ children, className }: any) => {
        // Inline code (no language class)
        if (!className) {
            return (
                <code className="px-1.5 py-0.5 rounded bg-[var(--forge-bg-bench)] text-[var(--ember)] font-mono text-sm">
                    {children}
                </code>
            );
        }
        // Code block - handled separately
        return <code className={className}>{children}</code>;
    },

    // Code blocks
    pre: ({ children }: any) => {
        // Extract code content and language
        const codeElement = React.Children.toArray(children).find(
            (child: any) => child?.type === "code"
        ) as React.ReactElement | undefined;

        if (codeElement) {
            const props = codeElement.props as { className?: string; children?: React.ReactNode };
            const className = props.className || "";
            const language = className.replace("language-", "") || "text";
            const code = String(props.children || "").trim();

            return (
                <CodeBlock
                    data={{
                        type: "code",
                        language,
                        code,
                    }}
                />
            );
        }

        return (
            <pre className="my-4 p-4 rounded-xl bg-[#0d1117] border border-[var(--forge-border-subtle)] overflow-x-auto">
                {children}
            </pre>
        );
    },

    // Links
    a: ({ href, children }: any) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--ember)] hover:text-[var(--ember-glow)] underline underline-offset-2 transition-colors"
        >
            {children}
        </a>
    ),

    // Blockquote
    blockquote: ({ children }: any) => (
        <blockquote className="my-4 pl-4 border-l-4 border-[var(--ember)] bg-[var(--ember)]/5 py-2 pr-4 rounded-r-lg">
            {children}
        </blockquote>
    ),

    // Horizontal rule
    hr: () => (
        <hr className="my-8 border-[var(--forge-border-subtle)]" />
    ),

    // Tables
    table: ({ children }: any) => (
        <div className="my-4 overflow-x-auto">
            <table className="w-full border-collapse">{children}</table>
        </div>
    ),
    th: ({ children }: any) => (
        <th className="px-4 py-2 text-left text-sm font-semibold text-[var(--forge-text-primary)] bg-[var(--forge-bg-bench)] border border-[var(--forge-border-subtle)]">
            {children}
        </th>
    ),
    td: ({ children }: any) => (
        <td className="px-4 py-2 text-sm text-[var(--forge-text-secondary)] border border-[var(--forge-border-subtle)]">
            {children}
        </td>
    ),
};

// ============================================================================
// Content Block Renderer (handles both custom and text blocks)
// ============================================================================

interface ContentBlockRendererProps {
    blocks: BlockData[];
}

function ContentBlockRenderer({ blocks }: ContentBlockRendererProps) {
    return (
        <>
            {blocks.map((block, index) => {
                if (block.type === "text") {
                    return (
                        <div key={index} className="prose-content">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={markdownComponents}
                            >
                                {block.content}
                            </ReactMarkdown>
                        </div>
                    );
                }

                return (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <BlockRenderer block={block} />
                    </motion.div>
                );
            })}
        </>
    );
}

// ============================================================================
// Section Renderer
// ============================================================================

interface SectionRendererProps {
    section: LessonSection;
    index: number;
}

export function SectionRenderer({ section, index }: SectionRendererProps) {
    const blocks = useMemo(
        () => parseMarkdownToBlocks(section.content_markdown),
        [section.content_markdown]
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="mb-8"
        >
            <ContentBlockRenderer blocks={blocks} />

            {/* Code snippet if separate from markdown */}
            {section.code_snippet && (
                <CodeBlock
                    data={{
                        type: "code",
                        language: section.code_language || "javascript",
                        code: section.code_snippet,
                    }}
                />
            )}

            {/* Key points if separate from markdown */}
            {section.key_points && section.key_points.length > 0 && (
                <KeypointsBlock
                    data={{
                        type: "keypoints",
                        points: section.key_points,
                    }}
                />
            )}
        </motion.div>
    );
}

// ============================================================================
// Full Lesson Renderer
// ============================================================================

interface LessonRendererProps {
    lesson: FullLesson;
    className?: string;
}

export function LessonRenderer({ lesson, className = "" }: LessonRendererProps) {
    const introBlocks = useMemo(
        () => lesson.content.introduction
            ? parseMarkdownToBlocks(lesson.content.introduction)
            : [],
        [lesson.content.introduction]
    );

    const mainBlocks = useMemo(
        () => parseMarkdownToBlocks(lesson.content.content_markdown),
        [lesson.content.content_markdown]
    );

    return (
        <div className={`lesson-content ${className}`}>
            {/* Introduction */}
            {introBlocks.length > 0 && (
                <div className="mb-8 p-6 rounded-xl bg-gradient-to-br from-[var(--forge-bg-elevated)] to-[var(--forge-bg-bench)] border border-[var(--forge-border-subtle)]">
                    <ContentBlockRenderer blocks={introBlocks} />
                </div>
            )}

            {/* Main content */}
            <div className="space-y-6">
                <ContentBlockRenderer blocks={mainBlocks} />
            </div>
        </div>
    );
}

// ============================================================================
// Markdown Only Renderer (for simple content)
// ============================================================================

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export function MarkdownOnlyRenderer({ content, className = "" }: MarkdownRendererProps) {
    const blocks = useMemo(() => parseMarkdownToBlocks(content), [content]);

    return (
        <div className={className}>
            <ContentBlockRenderer blocks={blocks} />
        </div>
    );
}

// ============================================================================
// Exports
// ============================================================================

export { ContentBlockRenderer };
