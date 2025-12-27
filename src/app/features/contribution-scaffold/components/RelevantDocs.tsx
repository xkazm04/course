"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    FileText,
    BookOpen,
    Video,
    MessageSquare,
    ExternalLink,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { DocumentLink } from "../lib/types";

interface RelevantDocsProps {
    docs: DocumentLink[];
}

const TYPE_CONFIG: Record<DocumentLink["type"], {
    icon: React.ElementType;
    label: string;
    color: string;
}> = {
    official: { icon: FileText, label: "Official", color: "indigo" },
    blog: { icon: BookOpen, label: "Blog", color: "emerald" },
    video: { icon: Video, label: "Video", color: "red" },
    stackoverflow: { icon: MessageSquare, label: "Stack Overflow", color: "amber" },
};

export const RelevantDocs: React.FC<RelevantDocsProps> = ({ docs }) => {
    const groupedDocs = docs.reduce((acc, doc) => {
        if (!acc[doc.type]) acc[doc.type] = [];
        acc[doc.type].push(doc);
        return acc;
    }, {} as Record<string, DocumentLink[]>);

    return (
        <div className="space-y-4">
            {/* All docs list */}
            <div className="space-y-2">
                {docs.map((doc, index) => (
                    <DocCard key={index} doc={doc} />
                ))}
            </div>

            {docs.length === 0 && (
                <div className="text-center py-8 text-[var(--text-muted)]">
                    <FileText size={ICON_SIZES.xl} className="mx-auto mb-2 opacity-50" />
                    <p>No relevant documentation found</p>
                </div>
            )}
        </div>
    );
};

// Document card component
interface DocCardProps {
    doc: DocumentLink;
}

const DocCard: React.FC<DocCardProps> = ({ doc }) => {
    const config = TYPE_CONFIG[doc.type];
    const Icon = config.icon;

    const colorClasses = {
        indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        red: "bg-red-500/10 text-red-400 border-red-500/20",
        amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    };

    return (
        <motion.a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.01, x: 4 }}
            whileTap={{ scale: 0.99 }}
            className={cn(
                "block rounded-lg border border-[var(--border-subtle)]",
                "bg-[var(--surface-overlay)] p-4",
                "hover:border-[var(--border-default)] transition-colors group"
            )}
        >
            <div className="flex items-start gap-3">
                <div className={cn(
                    "p-2 rounded-lg border",
                    colorClasses[config.color as keyof typeof colorClasses]
                )}>
                    <Icon size={ICON_SIZES.md} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h5 className="font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent-primary)] transition-colors">
                            {doc.title}
                        </h5>
                        <ExternalLink
                            size={ICON_SIZES.sm}
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-[var(--text-muted)] transition-opacity"
                        />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                            "px-1.5 py-0.5 rounded text-xs font-medium",
                            colorClasses[config.color as keyof typeof colorClasses]
                        )}>
                            {config.label}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                            {doc.relevance}
                        </span>
                    </div>
                </div>
            </div>
        </motion.a>
    );
};
