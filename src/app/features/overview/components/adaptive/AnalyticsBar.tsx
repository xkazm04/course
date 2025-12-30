"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/app/shared/lib/utils";

export interface AnalyticsBarProps {
    label: string;
    value: number;
    color: "emerald" | "indigo" | "purple";
}

/**
 * Progress bar component for displaying analytics metrics.
 */
export const AnalyticsBar: React.FC<AnalyticsBarProps> = ({ label, value, color }) => {
    const colorClasses = {
        emerald: "bg-[var(--forge-success)]",
        indigo: "bg-[var(--ember)]",
        purple: "bg-[var(--forge-accent)]",
    };

    return (
        <div>
            <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--forge-text-secondary)]">{label}</span>
                <span className="font-medium text-[var(--forge-text-primary)]">{Math.round(value * 100)}%</span>
            </div>
            <div className="h-1.5 bg-[var(--forge-bg-workshop)] rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className={cn("h-full rounded-full", colorClasses[color])}
                />
            </div>
        </div>
    );
};
