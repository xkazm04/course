"use client";

/**
 * CompactGoalStep Component
 *
 * Compact goal selection step for the Oracle wizard.
 * Displays career goal options as selectable cards.
 */

import React from "react";
import { motion } from "framer-motion";
import { Briefcase, Check } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { careerGoalOptions } from "@/app/features/goal-path/lib/useCareerOracle";
import type { IndustrySector } from "@/app/features/goal-path/lib/predictiveTypes";

// ============================================================================
// TYPES
// ============================================================================

export interface CompactGoalStepProps {
    /** Currently selected goal */
    selectedGoal: string | null;
    /** Currently selected sector */
    selectedSector: IndustrySector | null;
    /** Callback when goal changes */
    onGoalChange: (goal: string, sector: IndustrySector) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CompactGoalStep({
    selectedGoal,
    selectedSector,
    onGoalChange,
}: CompactGoalStepProps) {
    return (
        <div className="h-full flex flex-col gap-4" data-testid="compact-goal-step">
            {/* Header */}
            <div className="flex flex-col gap-0.5 py-1">
                <h3 className="text-sm font-semibold text-[var(--forge-text-primary)]">
                    What's your career goal?
                </h3>
                <p className="text-xs text-[var(--forge-text-secondary)]">
                    Select your target role
                </p>
            </div>

            {/* Goal options grid - subsection uses gap-2 */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 overflow-y-auto">
                {careerGoalOptions.map(option => {
                    const isSelected = selectedGoal === option.id;

                    return (
                        <motion.button
                            key={option.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onGoalChange(option.id, option.sector)}
                            className={cn(
                                "relative flex flex-col items-center justify-center",
                                "p-3 rounded-xl",
                                "text-center",
                                "transition-all duration-200",
                                "border-2",
                                isSelected
                                    ? [
                                        "bg-[var(--ember)]/10",
                                        "border-[var(--ember)]",
                                    ]
                                    : [
                                        "bg-[var(--forge-bg-elevated)]",
                                        "border-[var(--forge-border-subtle)]",
                                        "hover:border-[var(--forge-text-muted)]",
                                    ]
                            )}
                        >
                            {/* Selected indicator */}
                            {isSelected && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[var(--ember)] flex items-center justify-center"
                                >
                                    <Check size={10} className="text-white" strokeWidth={3} />
                                </motion.div>
                            )}

                            {/* Icon */}
                            <div
                                className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center mb-2",
                                    isSelected
                                        ? "bg-[var(--ember)]/20"
                                        : "bg-[var(--forge-bg-anvil)]"
                                )}
                            >
                                <Briefcase
                                    size={16}
                                    className={cn(
                                        isSelected
                                            ? "text-[var(--ember)]"
                                            : "text-[var(--forge-text-secondary)]"
                                    )}
                                />
                            </div>

                            {/* Label */}
                            <span
                                className={cn(
                                    "text-xs font-medium leading-tight",
                                    isSelected
                                        ? "text-[var(--ember)]"
                                        : "text-[var(--forge-text-primary)]"
                                )}
                            >
                                {option.label}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
