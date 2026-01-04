"use client";

import { CheckCircle, GitPullRequest, Play, Trophy } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";

const activities = [
    { type: "merged", title: "PR merged: Fix auth error handling", project: "OpenCRM", time: "2 hours ago", xp: 150 },
    { type: "submitted", title: "Submitted PR for review", project: "OpenTasks", time: "Yesterday" },
    { type: "started", title: "Started challenge: Add dark mode", project: "OpenForms", time: "2 days ago" },
    { type: "level_up", title: "Reached Level 7!", time: "3 days ago" },
];

const activityIcons = {
    merged: { icon: CheckCircle, color: "text-[var(--forge-success)]", bg: "bg-[var(--forge-success)]/10" },
    submitted: { icon: GitPullRequest, color: "text-[var(--ember-glow)]", bg: "bg-[var(--ember-glow)]/10" },
    started: { icon: Play, color: "text-[var(--forge-info)]", bg: "bg-[var(--forge-info)]/10" },
    level_up: { icon: Trophy, color: "text-[var(--ember)]", bg: "bg-[var(--ember)]/10" },
};

export function RecentActivity() {
    return (
        <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm">
            <div className="p-4 border-b border-[var(--forge-border-subtle)]">
                <h3 className="font-semibold text-[var(--forge-text-primary)]">Recent Activity</h3>
            </div>
            <div className="divide-y divide-[var(--forge-border-subtle)]">
                {activities.map((activity, i) => {
                    const config = activityIcons[activity.type as keyof typeof activityIcons];
                    const Icon = config.icon;
                    return (
                        <div key={i} className="flex items-start gap-3 p-4">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", config.bg)}>
                                <Icon size={16} className={config.color} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-[var(--forge-text-primary)]">
                                    {activity.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-[var(--forge-text-muted)]">
                                    {activity.project && <span>{activity.project}</span>}
                                    <span>{activity.time}</span>
                                </div>
                            </div>
                            {activity.xp && (
                                <span className="text-sm font-medium text-[var(--ember)]">
                                    +{activity.xp} XP
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
