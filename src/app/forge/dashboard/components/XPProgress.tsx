"use client";

import { useForge } from "../../layout";

export function XPProgress() {
    const { user } = useForge();

    if (!user) return null;

    const progress = (user.xp / (user.xp + user.xpToNextLevel)) * 100;

    return (
        <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--forge-text-primary)]">Level Progress</h3>
                <span className="text-sm text-[var(--forge-text-muted)]">Level {user.level}</span>
            </div>
            <div className="flex items-end justify-between mb-3">
                <div>
                    <div className="text-3xl font-bold text-[var(--forge-text-primary)]">
                        {user.xp.toLocaleString()}
                    </div>
                    <div className="text-sm text-[var(--forge-text-muted)]">Total XP</div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-semibold text-[var(--ember)]">
                        {user.xpToNextLevel.toLocaleString()}
                    </div>
                    <div className="text-xs text-[var(--forge-text-muted)]">to Level {user.level + 1}</div>
                </div>
            </div>
            <div className="w-full h-3 rounded-full bg-[var(--forge-bg-elevated)]">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] transition-all"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
