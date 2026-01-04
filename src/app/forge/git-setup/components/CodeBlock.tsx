"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";

export function CopyButton({ text, className }: { text: string; className?: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={cn(
                "p-2 rounded-lg hover:bg-white/10 transition-colors",
                className
            )}
            title="Copy to clipboard"
        >
            {copied ? (
                <Check size={16} className="text-green-500" />
            ) : (
                <Copy size={16} className="text-[var(--text-muted)]" />
            )}
        </button>
    );
}

export function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
    return (
        <div className="relative group">
            <pre className="p-4 rounded-lg bg-[var(--forge-bg-void)] border border-[var(--border-default)] overflow-x-auto">
                <code className="text-sm font-mono text-[var(--text-primary)]">
                    {code}
                </code>
            </pre>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyButton text={code} />
            </div>
        </div>
    );
}
