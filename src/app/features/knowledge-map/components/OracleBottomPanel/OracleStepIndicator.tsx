"use client";

/**
 * OracleStepIndicator Component
 *
 * Progress dots showing the current step in the Oracle wizard.
 */

import React from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { OracleWizardStep } from "../../lib/types";

// ============================================================================
// TYPES
// ============================================================================

export interface OracleStepIndicatorProps {
    /** Current active step */
    activeStep: OracleWizardStep;
    /** Callback when a step is clicked */
    onStepClick?: (step: OracleWizardStep) => void;
    /** Steps that are completed */
    completedSteps?: Set<OracleWizardStep>;
}

// ============================================================================
// STEP CONFIGURATION
// ============================================================================

interface StepConfig {
    id: OracleWizardStep;
    label: string;
    shortLabel: string;
}

const steps: StepConfig[] = [
    { id: "skills", label: "Skills", shortLabel: "1" },
    { id: "goal", label: "Goal", shortLabel: "2" },
    { id: "preferences", label: "Preferences", shortLabel: "3" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function OracleStepIndicator({
    activeStep,
    onStepClick,
    completedSteps = new Set(),
}: OracleStepIndicatorProps) {
    const activeIndex = steps.findIndex(s => s.id === activeStep);
    const isGenerating = activeStep === "generating";
    const isComplete = activeStep === "complete";

    return (
        <div
            className="flex items-center gap-2"
            data-testid="oracle-step-indicator"
        >
            {steps.map((step, index) => {
                const isActive = step.id === activeStep;
                const isCompleted = completedSteps.has(step.id) || index < activeIndex || isComplete;
                const isPast = index < activeIndex;
                const isClickable = isPast && !isGenerating && !isComplete;

                return (
                    <React.Fragment key={step.id}>
                        {/* Step dot */}
                        <motion.button
                            onClick={() => isClickable && onStepClick?.(step.id)}
                            disabled={!isClickable}
                            className={cn(
                                "relative flex items-center justify-center",
                                "w-8 h-8 rounded-full",
                                "text-xs font-semibold",
                                "transition-colors duration-200",
                                isActive && !isGenerating && [
                                    "bg-[var(--ember)] text-white",
                                    "ring-4 ring-[var(--ember)]/30",
                                ],
                                isCompleted && !isActive && [
                                    "bg-[var(--forge-success)] text-white",
                                ],
                                !isActive && !isCompleted && [
                                    "bg-[var(--forge-bg-anvil)]",
                                    "text-[var(--forge-text-secondary)]",
                                ],
                                isClickable && "cursor-pointer hover:scale-110",
                                !isClickable && "cursor-default"
                            )}
                            whileHover={isClickable ? { scale: 1.1 } : undefined}
                            whileTap={isClickable ? { scale: 0.95 } : undefined}
                            data-testid={`step-${step.id}`}
                        >
                            {isCompleted && !isActive ? (
                                <Check size={14} strokeWidth={3} />
                            ) : (
                                <span>{step.shortLabel}</span>
                            )}
                        </motion.button>

                        {/* Connector line */}
                        {index < steps.length - 1 && (
                            <div
                                className={cn(
                                    "w-8 h-0.5 rounded-full transition-colors duration-300",
                                    isPast || isCompleted
                                        ? "bg-[var(--forge-success)]"
                                        : "bg-[var(--forge-border-subtle)]"
                                )}
                            />
                        )}
                    </React.Fragment>
                );
            })}

            {/* Generating indicator */}
            {isGenerating && (
                <motion.div
                    className="flex items-center gap-2 ml-2 text-[var(--ember)]"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-xs font-medium">Generating...</span>
                </motion.div>
            )}

            {/* Complete indicator */}
            {isComplete && (
                <motion.div
                    className="flex items-center gap-2 ml-2 text-[var(--forge-success)]"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <Check size={16} strokeWidth={3} />
                    <span className="text-xs font-medium">Complete!</span>
                </motion.div>
            )}
        </div>
    );
}
