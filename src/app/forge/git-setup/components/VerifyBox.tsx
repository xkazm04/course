"use client";

import { CheckCircle2 } from "lucide-react";
import { CodeBlock } from "./CodeBlock";

interface VerifyBoxProps {
    title: string;
    description: string;
    command: string;
    expectedOutput?: string;
}

export function VerifyBox({ title, description, command, expectedOutput }: VerifyBoxProps) {
    return (
        <div className="p-4 rounded-lg bg-[var(--forge-success)]/10 border border-[var(--forge-success)]/20">
            <h4 className="font-medium text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[var(--forge-success)]" />
                {title}
            </h4>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
                {description}
            </p>
            <CodeBlock code={command} />
            {expectedOutput && (
                <p className="text-sm text-[var(--text-muted)] mt-2">
                    You should see something like: <code>{expectedOutput}</code>
                </p>
            )}
        </div>
    );
}
