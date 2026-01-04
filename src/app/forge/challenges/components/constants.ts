import type { ChallengeType, ChallengeDifficulty } from "../../lib/types";

export const typeOptions: { value: ChallengeType | "all"; label: string; emoji: string }[] = [
    { value: "all", label: "All", emoji: "🎯" },
    { value: "bug", label: "Bug", emoji: "🐛" },
    { value: "feature", label: "Feature", emoji: "✨" },
    { value: "refactor", label: "Refactor", emoji: "🔧" },
    { value: "test", label: "Test", emoji: "🧪" },
    { value: "docs", label: "Docs", emoji: "📚" },
    { value: "performance", label: "Perf", emoji: "⚡" },
    { value: "security", label: "Security", emoji: "🔒" },
];

export const difficultyOptions: { value: ChallengeDifficulty | "all"; label: string }[] = [
    { value: "all", label: "All Levels" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
];

export const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };

export const difficultyColors = {
    beginner: "bg-[var(--forge-success)]/10 text-[var(--forge-success)] border-[var(--forge-success)]/20",
    intermediate: "bg-[var(--gold)]/10 text-[var(--gold)] border-[var(--gold)]/20",
    advanced: "bg-[var(--forge-error)]/10 text-[var(--forge-error)] border-[var(--forge-error)]/20",
};

export const typeEmojis: Record<ChallengeType, string> = {
    bug: "🐛",
    feature: "✨",
    refactor: "🔧",
    test: "🧪",
    docs: "📚",
    performance: "⚡",
    security: "🔒",
};

export type SortKey = "title" | "xpReward" | "estimatedMinutes" | "difficulty" | "successRate" | "timesCompleted";
export type SortDir = "asc" | "desc";
