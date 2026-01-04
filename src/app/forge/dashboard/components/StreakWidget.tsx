"use client";

import { Flame } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { useForge } from "../../layout";

export function StreakWidget() {
    const { user } = useForge();
    const days = ["M", "T", "W", "T", "F", "S", "S"];
    const activity = [true, true, true, false, true, true, true]; // Mock week activity

    if (!user) return null;

    return (
        <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Flame size={20} className="text-[var(--ember)]" />
                    <h3 className="font-semibold text-[var(--forge-text-primary)]">Streak</h3>
                </div>
                <div className="text-2xl font-bold text-[var(--ember)]">
                    {user.currentStreak} days
                </div>
            </div>
            <div className="flex justify-between">
                {days.map((day, i) => (
                    <div key={i} className="text-center">
                        <div className="text-xs text-[var(--forge-text-muted)] mb-2">{day}</div>
                        <div
                            className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center",
                                activity[i]
                                    ? "bg-gradient-to-br from-[var(--ember)] to-[var(--ember-glow)] text-white"
                                    : "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)]"
                            )}
                        >
                            {activity[i] ? <Flame size={14} /> : ""}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
