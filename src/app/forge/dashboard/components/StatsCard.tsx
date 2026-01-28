"use client";

import { motion } from "framer-motion";
import { TrendingUp, type LucideIcon } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { useAnimatedCounter } from "../../lib/useAnimatedCounter";
import { cardHover, buttonTap, textGradientStat } from "../../lib/animations";

interface StatsCardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    subtext?: string;
    trend?: string;
    iconColor?: string;
    suffix?: string;
    prefix?: string;
    animateValue?: boolean;
}

export function StatsCard({
    icon: Icon,
    label,
    value,
    subtext,
    trend,
    iconColor,
    suffix = "",
    prefix = "",
    animateValue = false,
}: StatsCardProps) {
    // Parse numeric value for animation
    const numericValue = typeof value === "number" ? value : parseInt(String(value).replace(/[^0-9]/g, ""), 10) || 0;

    const { count } = useAnimatedCounter({
        target: animateValue ? numericValue : 0,
        duration: 2000,
        increment: numericValue > 100 ? 10 : 1,
        startOnMount: animateValue && numericValue > 0,
    });

    // Display value - animated or static
    const displayValue = animateValue && numericValue > 0
        ? `${prefix}${count.toLocaleString()}${suffix}`
        : typeof value === "number"
            ? `${prefix}${value.toLocaleString()}${suffix}`
            : value;

    return (
        <motion.div
            className="relative bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm p-5 overflow-hidden group cursor-default"
            whileHover={cardHover}
            whileTap={buttonTap}
        >
            {/* Hover glow effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--ember)]/5 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                    <motion.div
                        className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            iconColor || "bg-[var(--forge-bg-elevated)]"
                        )}
                        whileHover={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 0.5 }}
                    >
                        <Icon size={20} className={iconColor ? "text-white" : "text-[var(--forge-text-muted)]"} />
                    </motion.div>
                    {trend && (
                        <motion.span
                            className="flex items-center gap-1 text-xs text-[var(--forge-success)] bg-[var(--forge-success)]/10 px-2 py-1 rounded-full"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <TrendingUp size={12} />
                            {trend}
                        </motion.span>
                    )}
                </div>
                <motion.div
                    className={cn(
                        "text-2xl font-bold mb-1",
                        animateValue ? textGradientStat : "text-[var(--forge-text-primary)]"
                    )}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    {displayValue}
                </motion.div>
                <div className="text-sm text-[var(--forge-text-muted)]">{label}</div>
                {subtext && (
                    <div className="text-xs text-[var(--forge-text-muted)] mt-1">{subtext}</div>
                )}
            </div>
        </motion.div>
    );
}
