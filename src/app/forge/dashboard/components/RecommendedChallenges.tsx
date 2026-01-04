"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { mockChallenges } from "../../lib/mockData";

export function RecommendedChallenges() {
    const recommended = mockChallenges.filter((c) => c.difficulty === "beginner").slice(0, 3);

    return (
        <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-[var(--forge-border-subtle)]">
                <div className="flex items-center gap-2">
                    <Star size={18} className="text-[var(--ember)]" />
                    <h3 className="font-semibold text-[var(--forge-text-primary)]">Recommended</h3>
                </div>
                <Link
                    href="/forge/challenges"
                    className="text-sm text-[var(--ember)] hover:underline"
                >
                    See All
                </Link>
            </div>
            <div className="divide-y divide-[var(--forge-border-subtle)]">
                {recommended.map((challenge) => (
                    <Link
                        key={challenge.id}
                        href={`/forge/challenges/${challenge.id}`}
                        className="flex items-center gap-4 p-4 hover:bg-[var(--forge-bg-elevated)] transition-colors"
                    >
                        <div className="text-xl">
                            {challenge.type === "bug" ? "🐛" : challenge.type === "feature" ? "✨" : "🔧"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-[var(--forge-text-primary)] truncate">
                                {challenge.title}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-[var(--forge-text-muted)]">
                                <span>{challenge.projectName}</span>
                                <span>~{challenge.estimatedMinutes}min</span>
                            </div>
                        </div>
                        <span className="text-sm font-medium text-[var(--ember)]">
                            +{challenge.xpReward} XP
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
