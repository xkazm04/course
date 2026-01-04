"use client";

import type { Challenge } from "../../lib/types";

interface StatsRowProps {
    challenges: Challenge[];
}

export function StatsRow({ challenges }: StatsRowProps) {
    const totalXP = challenges.reduce((sum, c) => sum + c.xpReward, 0);
    const avgTime = Math.round(challenges.reduce((sum, c) => sum + c.estimatedMinutes, 0) / (challenges.length || 1));
    const avgSuccess = Math.round(
        (challenges.reduce((sum, c) => sum + (c.successRate || 0), 0) / (challenges.length || 1)) * 100
    );

    const stats = [
        { label: "Challenges", value: challenges.length, icon: "🎯" },
        { label: "Total XP", value: totalXP.toLocaleString(), icon: "⚡" },
        { label: "Avg Time", value: `${avgTime}min`, icon: "⏱️" },
        { label: "Avg Success", value: `${avgSuccess}%`, icon: "📈" },
    ];

    return (
        <div className="flex items-center gap-6 px-4 py-3 bg-gradient-to-r from-[var(--ember)]/5 to-[var(--ember-glow)]/5 border-b border-[var(--ember)]/10">
            {stats.map((stat, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span>{stat.icon}</span>
                    <span className="text-sm text-[var(--forge-text-secondary)]">{stat.label}:</span>
                    <span className="text-sm font-semibold text-[var(--forge-text-primary)]">{stat.value}</span>
                </div>
            ))}
        </div>
    );
}
