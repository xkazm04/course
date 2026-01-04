"use client";

import Link from "next/link";
import { Target, ChevronRight } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { mockContributions } from "../../lib/mockData";

const statusConfig = {
    claimed: { label: "Claimed", color: "text-[var(--forge-info)]", bg: "bg-[var(--forge-info)]/10" },
    in_progress: { label: "In Progress", color: "text-[var(--gold)]", bg: "bg-[var(--gold)]/10" },
    submitted: { label: "Submitted", color: "text-[var(--ember-glow)]", bg: "bg-[var(--ember-glow)]/10" },
    in_review: { label: "In Review", color: "text-[var(--forge-info)]", bg: "bg-[var(--forge-info)]/10" },
    changes_requested: { label: "Changes Requested", color: "text-[var(--forge-error)]", bg: "bg-[var(--forge-error)]/10" },
    approved: { label: "Approved", color: "text-[var(--forge-success)]", bg: "bg-[var(--forge-success)]/10" },
};

export function ActiveContributions() {
    const activeContribs = mockContributions.filter(
        (c) => c.status !== "merged" && c.status !== "closed"
    );

    return (
        <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-[var(--forge-border-subtle)]">
                <h3 className="font-semibold text-[var(--forge-text-primary)]">Active Work</h3>
                <Link
                    href="/forge/contributions"
                    className="text-sm text-[var(--ember)] hover:underline"
                >
                    View All
                </Link>
            </div>
            {activeContribs.length > 0 ? (
                <div className="divide-y divide-[var(--forge-border-subtle)]">
                    {activeContribs.map((contrib) => {
                        const status = statusConfig[contrib.status as keyof typeof statusConfig] || statusConfig.in_progress;
                        return (
                            <Link
                                key={contrib.id}
                                href={`/forge/workspace/${contrib.challengeId}`}
                                className="flex items-center gap-4 p-4 hover:bg-[var(--forge-bg-elevated)] transition-colors"
                            >
                                <div className="text-2xl">
                                    {contrib.challenge.type === "bug" ? "🐛" : "✨"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-[var(--forge-text-primary)] truncate">
                                        {contrib.challenge.title}
                                    </div>
                                    <div className="text-xs text-[var(--forge-text-muted)]">
                                        {contrib.projectName}
                                    </div>
                                </div>
                                <span className={cn("px-2 py-1 rounded text-xs font-medium", status.bg, status.color)}>
                                    {status.label}
                                </span>
                                <ChevronRight size={16} className="text-[var(--forge-text-muted)]" />
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="p-8 text-center">
                    <Target size={32} className="mx-auto text-[var(--forge-text-muted)] mb-3" />
                    <p className="text-[var(--forge-text-secondary)] mb-4">No active work</p>
                    <Link
                        href="/forge/challenges"
                        className="text-sm text-[var(--ember)] hover:underline"
                    >
                        Find a challenge
                    </Link>
                </div>
            )}
        </div>
    );
}
