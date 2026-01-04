"use client";

import { TrendingUp } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";

interface StatsCardProps {
    icon: React.ElementType;
    label: string;
    value: string | number;
    subtext?: string;
    trend?: string;
    iconColor?: string;
}

export function StatsCard({
    icon: Icon,
    label,
    value,
    subtext,
    trend,
    iconColor,
}: StatsCardProps) {
    return (
        <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconColor || "bg-[var(--forge-bg-elevated)]")}>
                    <Icon size={20} className={iconColor ? "text-white" : "text-[var(--forge-text-muted)]"} />
                </div>
                {trend && (
                    <span className="flex items-center gap-1 text-xs text-[var(--forge-success)]">
                        <TrendingUp size={12} />
                        {trend}
                    </span>
                )}
            </div>
            <div className="text-2xl font-bold text-[var(--forge-text-primary)] mb-1">
                {value}
            </div>
            <div className="text-sm text-[var(--forge-text-muted)]">{label}</div>
            {subtext && (
                <div className="text-xs text-[var(--forge-text-muted)] mt-1">{subtext}</div>
            )}
        </div>
    );
}
