"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertTriangle,
    Plus,
    Minus,
    Clock,
    DollarSign,
    HelpCircle,
    Users,
    X,
    CheckCircle,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { TriggeredComplication, ComplicationType, COMPLICATION_CONFIG } from "../lib/types";

interface ComplicationAlertProps {
    complication: TriggeredComplication;
    onDismiss?: () => void;
    onResolve?: () => void;
}

const TYPE_ICONS: Record<ComplicationType, React.ElementType> = {
    scope_addition: Plus,
    scope_reduction: Minus,
    deadline_change: Clock,
    budget_change: DollarSign,
    requirement_clarification: HelpCircle,
    stakeholder_input: Users,
};

export const ComplicationAlert: React.FC<ComplicationAlertProps> = ({
    complication,
    onDismiss,
    onResolve,
}) => {
    const config = COMPLICATION_CONFIG[complication.type];
    const Icon = TYPE_ICONS[complication.type];

    const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
        amber: { bg: "bg-[var(--forge-warning)]/10", border: "border-[var(--forge-warning)]/30", text: "text-[var(--forge-warning)]" },
        emerald: { bg: "bg-[var(--forge-success)]/10", border: "border-[var(--forge-success)]/30", text: "text-[var(--forge-success)]" },
        red: { bg: "bg-[var(--forge-error)]/10", border: "border-[var(--forge-error)]/30", text: "text-[var(--forge-error)]" },
        purple: { bg: "bg-[var(--ember)]/10", border: "border-[var(--ember)]/30", text: "text-[var(--ember)]" },
        blue: { bg: "bg-[var(--forge-info)]/10", border: "border-[var(--forge-info)]/30", text: "text-[var(--forge-info)]" },
        orange: { bg: "bg-[var(--forge-warning)]/10", border: "border-[var(--forge-warning)]/30", text: "text-[var(--forge-warning)]" },
    };

    const colors = colorClasses[config.color] || colorClasses.amber;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
                "rounded-xl border-2 overflow-hidden",
                colors.bg,
                colors.border
            )}
        >
            {/* Animated attention border */}
            <motion.div
                className={cn(
                    "absolute inset-0 border-2 rounded-xl",
                    colors.border
                )}
                animate={{
                    opacity: [0.5, 1, 0.5],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                }}
            />

            <div className="relative p-4">
                {/* Header */}
                <div className="flex items-start gap-3">
                    <motion.div
                        className={cn(
                            "p-2 rounded-lg",
                            colors.bg
                        )}
                        animate={{
                            rotate: [0, -10, 10, -10, 0],
                        }}
                        transition={{
                            duration: 0.5,
                            repeat: 3,
                        }}
                    >
                        <AlertTriangle size={ICON_SIZES.lg} className={colors.text} />
                    </motion.div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium",
                                colors.bg,
                                colors.text
                            )}>
                                {config.label}
                            </span>
                            {complication.impact.stressLevel === "high" && (
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--forge-error)]/20 text-[var(--forge-error)]">
                                    High Impact
                                </span>
                            )}
                        </div>
                        <h4 className="font-semibold text-[var(--forge-text-primary)] mt-1">
                            Scope Change Detected
                        </h4>
                    </div>
                    {onDismiss && (
                        <button
                            onClick={onDismiss}
                            className="p-1 rounded-lg hover:bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)]"
                        >
                            <X size={ICON_SIZES.md} />
                        </button>
                    )}
                </div>

                {/* Client message */}
                <div className="mt-3 p-3 rounded-lg bg-[var(--forge-bg-workshop)]">
                    <p className="text-sm text-[var(--forge-text-secondary)] italic">
                        "{complication.clientMessage}"
                    </p>
                </div>

                {/* Impact details */}
                <div className="flex gap-4 mt-3">
                    {complication.impact.timeImpact !== 0 && (
                        <div className="flex items-center gap-1 text-xs">
                            <Clock size={ICON_SIZES.xs} className={complication.impact.timeImpact > 0 ? "text-[var(--forge-error)]" : "text-[var(--forge-success)]"} />
                            <span className={complication.impact.timeImpact > 0 ? "text-[var(--forge-error)]" : "text-[var(--forge-success)]"}>
                                {complication.impact.timeImpact > 0 ? "+" : ""}{complication.impact.timeImpact}h
                            </span>
                        </div>
                    )}
                    {complication.impact.budgetImpact !== 0 && (
                        <div className="flex items-center gap-1 text-xs">
                            <DollarSign size={ICON_SIZES.xs} className={complication.impact.budgetImpact < 0 ? "text-[var(--forge-error)]" : "text-[var(--forge-success)]"} />
                            <span className={complication.impact.budgetImpact < 0 ? "text-[var(--forge-error)]" : "text-[var(--forge-success)]"}>
                                {complication.impact.budgetImpact > 0 ? "+" : ""}${Math.abs(complication.impact.budgetImpact)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                {!complication.resolved && onResolve && (
                    <div className="flex gap-2 mt-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onResolve}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2",
                                "px-4 py-2 rounded-lg text-sm font-medium",
                                colors.bg,
                                colors.text,
                                "hover:opacity-80 transition-opacity"
                            )}
                        >
                            <CheckCircle size={ICON_SIZES.sm} />
                            Acknowledge
                        </motion.button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// Mini complication indicator for list views
interface ComplicationBadgeProps {
    complication: TriggeredComplication;
}

export const ComplicationBadge: React.FC<ComplicationBadgeProps> = ({
    complication,
}) => {
    const config = COMPLICATION_CONFIG[complication.type];
    const Icon = TYPE_ICONS[complication.type];

    const colorClasses: Record<string, string> = {
        amber: "bg-[var(--forge-warning)]/20 text-[var(--forge-warning)]",
        emerald: "bg-[var(--forge-success)]/20 text-[var(--forge-success)]",
        red: "bg-[var(--forge-error)]/20 text-[var(--forge-error)]",
        purple: "bg-[var(--ember)]/20 text-[var(--ember)]",
        blue: "bg-[var(--forge-info)]/20 text-[var(--forge-info)]",
        orange: "bg-[var(--forge-warning)]/20 text-[var(--forge-warning)]",
    };

    return (
        <div className={cn(
            "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
            colorClasses[config.color]
        )}>
            <Icon size={ICON_SIZES.xs} />
            {config.label}
        </div>
    );
};

// Container for multiple complications
interface ComplicationListProps {
    complications: TriggeredComplication[];
    onResolve?: (id: string) => void;
}

export const ComplicationList: React.FC<ComplicationListProps> = ({
    complications,
    onResolve,
}) => {
    const unresolvedComplications = complications.filter(c => !c.resolved);

    if (unresolvedComplications.length === 0) return null;

    return (
        <div className="space-y-3">
            <AnimatePresence mode="popLayout">
                {unresolvedComplications.map(complication => (
                    <ComplicationAlert
                        key={complication.id}
                        complication={complication}
                        onResolve={() => onResolve?.(complication.id)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};
