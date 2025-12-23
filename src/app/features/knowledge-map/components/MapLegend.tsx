"use client";

/**
 * MapLegend Component
 *
 * Legend showing node status indicators.
 */

import React, { memo } from "react";
import { Check, Play, CircleDot, Lock } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { STATUS_CONFIG, type NodeStatus } from "../lib/types";

interface MapLegendProps {
    className?: string;
}

const STATUS_ICONS = {
    Check,
    Play,
    CircleDot,
    Lock,
};

const STATUS_LABELS: Record<NodeStatus, string> = {
    completed: "Completed",
    in_progress: "In Progress",
    available: "Available",
    locked: "Locked",
};

export const MapLegend: React.FC<MapLegendProps> = memo(function MapLegend({
    className,
}) {
    const statuses: NodeStatus[] = ["completed", "in_progress", "available", "locked"];

    return (
        <div
            className={cn(
                "flex flex-wrap gap-3 px-3 py-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-lg border border-slate-200 dark:border-slate-700 shadow-md",
                className
            )}
        >
            {statuses.map((status) => {
                const config = STATUS_CONFIG[status];
                const Icon = STATUS_ICONS[config.iconName];

                return (
                    <div
                        key={status}
                        className="flex items-center gap-1.5"
                    >
                        <div
                            className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center",
                                status === "completed" && "bg-emerald-500",
                                status === "in_progress" && "bg-indigo-500",
                                status === "available" && "bg-slate-200 dark:bg-slate-600",
                                status === "locked" && "bg-slate-200 dark:bg-slate-700"
                            )}
                        >
                            <Icon
                                size={ICON_SIZES.xs}
                                className={cn(
                                    status === "completed" && "text-white",
                                    status === "in_progress" && "text-white",
                                    status === "available" && "text-slate-500",
                                    status === "locked" && "text-slate-400"
                                )}
                            />
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                            {STATUS_LABELS[status]}
                        </span>
                    </div>
                );
            })}
        </div>
    );
});

export default MapLegend;
