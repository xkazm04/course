"use client";

import React from "react";
import { cn } from "@/app/shared/lib/utils";

export interface PredictionIndicatorProps {
    probability: number;
}

/**
 * Small indicator showing completion prediction as a colored dot and percentage.
 */
export const PredictionIndicator: React.FC<PredictionIndicatorProps> = ({ probability }) => {
    const color = probability >= 0.7 ? "emerald" : probability >= 0.4 ? "amber" : "red";
    const colorClasses = {
        emerald: "bg-[var(--forge-success)]",
        amber: "bg-[var(--forge-warning)]",
        red: "bg-[var(--forge-error)]",
    };

    return (
        <div className="flex items-center gap-1">
            <div className={cn("w-2 h-2 rounded-full", colorClasses[color])} />
            <span className="text-[10px] text-[var(--forge-text-secondary)]">
                {Math.round(probability * 100)}%
            </span>
        </div>
    );
};
