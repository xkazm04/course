"use client";

import { useId } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { Challenge } from "../../lib/types";
import { difficultyColors, typeEmojis } from "./constants";

interface ChallengeRowProps {
    challenge: Challenge;
    index: number;
    rowIndex: number;
    gridCols: string;
}

export function ChallengeRow({ challenge, index, rowIndex, gridCols }: ChallengeRowProps) {
    const rowId = useId();
    const summaryId = `${rowId}-summary`;

    // Create a screen reader summary for the row
    const rowSummary = `${challenge.title} - ${challenge.difficulty} ${challenge.type} challenge. ${challenge.xpReward} XP, ${challenge.estimatedMinutes} minutes. ${Math.round((challenge.successRate || 0) * 100)}% success rate.`;

    return (
        <tr
            className={cn(
                `group cursor-pointer hover:bg-[var(--ember)]/5 transition-colors grid ${gridCols} gap-4 px-4 py-3 items-center`,
                index % 2 === 0 ? "bg-[var(--forge-bg-daylight)]/40" : "bg-[var(--forge-bg-daylight)]/60"
            )}
            aria-rowindex={rowIndex}
            aria-describedby={summaryId}
            data-testid={`challenge-row-${challenge.id}`}
        >
            {/* Hidden summary for screen readers - absolutely positioned to not affect grid */}
            <span id={summaryId} className="sr-only">
                {rowSummary}
            </span>

            {/* Title & Project */}
            <td className="contents">
                <Link
                    href={`/forge/challenges/${challenge.id}`}
                    className="flex items-center gap-3 min-w-0"
                    data-testid={`challenge-link-${challenge.id}`}
                >
                    <span className="text-lg flex-shrink-0" aria-hidden="true">{typeEmojis[challenge.type]}</span>
                    <div className="min-w-0">
                        <div className="font-medium text-[var(--forge-text-primary)] group-hover:text-[var(--ember)] transition-colors truncate">
                            {challenge.title}
                        </div>
                        <div className="text-xs text-[var(--forge-text-muted)] truncate">{challenge.projectName}</div>
                    </div>
                </Link>
            </td>

            {/* Difficulty */}
            <td>
                <span className={cn("px-2 py-0.5 rounded text-xs font-medium capitalize border", difficultyColors[challenge.difficulty])}>
                    {challenge.difficulty}
                </span>
            </td>

            {/* Type */}
            <td className="text-xs text-[var(--forge-text-secondary)] capitalize">
                {challenge.type}
            </td>

            {/* XP */}
            <td className="text-right">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gradient-to-r from-[var(--ember)]/5 to-[var(--ember-glow)]/5 text-[var(--ember)] text-sm font-semibold">
                    +{challenge.xpReward}
                </span>
            </td>

            {/* Time */}
            <td className="text-sm text-[var(--forge-text-secondary)] text-right">
                {challenge.estimatedMinutes}min
            </td>

            {/* Completed */}
            <td className="text-sm text-[var(--forge-text-secondary)] text-center">
                {challenge.timesCompleted}
            </td>

            {/* Success */}
            <td className="text-sm text-center">
                <span className={cn(
                    "font-medium",
                    (challenge.successRate || 0) >= 0.8 ? "text-[var(--forge-success)]" :
                        (challenge.successRate || 0) >= 0.5 ? "text-[var(--gold)]" : "text-[var(--forge-error)]"
                )}>
                    {Math.round((challenge.successRate || 0) * 100)}%
                </span>
            </td>

            {/* Action */}
            <td className="flex justify-center">
                <Link
                    href={`/forge/challenges/${challenge.id}`}
                    className="flex justify-center"
                    aria-label={`Go to ${challenge.title}`}
                    tabIndex={-1}
                    data-testid={`challenge-action-${challenge.id}`}
                >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--ember)]">
                        <ArrowRight size={16} aria-hidden="true" />
                    </span>
                </Link>
            </td>
        </tr>
    );
}
