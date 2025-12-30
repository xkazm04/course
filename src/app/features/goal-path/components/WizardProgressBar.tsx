"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { DURATION_NORMAL, DURATION_FAST } from "@/app/shared/lib/motionPrimitives";

// ============================================================================
// Types
// ============================================================================

export interface WizardStep {
    key: string;
    label: string;
}

export interface WizardProgressBarProps {
    steps: WizardStep[];
    currentStep: number;
    prefersReducedMotion?: boolean | null;
    className?: string;
}

// ============================================================================
// Step Circle Component
// ============================================================================

interface StepCircleProps {
    step: WizardStep;
    index: number;
    currentStep: number;
    prefersReducedMotion?: boolean | null;
}

const StepCircle = ({
    step,
    index,
    currentStep,
    prefersReducedMotion,
}: StepCircleProps) => {
    const stepNumber = index + 1;
    const isCompleted = currentStep > stepNumber;
    const isCurrent = currentStep === stepNumber;
    const isUpcoming = currentStep < stepNumber;

    return (
        <div className="flex flex-col items-center gap-1.5">
            {/* Step Circle */}
            <div
                className={cn(
                    "relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                    isCompleted && "bg-[var(--forge-success)]",
                    isCurrent && "bg-[var(--ember)]",
                    isUpcoming && "bg-[var(--forge-bg-elevated)]"
                )}
                data-testid={`wizard-progress-step-${step.key}`}
            >
                {/* Pulse ring animation for current step */}
                {isCurrent && (
                    <motion.div
                        className="absolute inset-0 rounded-full bg-[var(--ember)]/30"
                        initial={prefersReducedMotion ? false : { scale: 1, opacity: 0.6 }}
                        animate={
                            prefersReducedMotion
                                ? false
                                : {
                                      scale: [1, 1.5, 1.5],
                                      opacity: [0.6, 0.3, 0],
                                  }
                        }
                        transition={
                            prefersReducedMotion
                                ? { duration: 0 }
                                : {
                                      duration: 1.5,
                                      repeat: Infinity,
                                      ease: "easeOut",
                                  }
                        }
                        data-testid={`wizard-progress-pulse-${step.key}`}
                    />
                )}

                {/* Content: Checkmark or Step Number */}
                <AnimatePresence mode="wait">
                    {isCompleted ? (
                        <motion.div
                            key="check"
                            initial={
                                prefersReducedMotion
                                    ? { scale: 1 }
                                    : { scale: 0 }
                            }
                            animate={{ scale: 1 }}
                            exit={
                                prefersReducedMotion
                                    ? { opacity: 0 }
                                    : { scale: 0 }
                            }
                            transition={
                                prefersReducedMotion
                                    ? { duration: 0 }
                                    : {
                                          type: "spring",
                                          stiffness: 500,
                                          damping: 25,
                                          duration: DURATION_NORMAL,
                                      }
                            }
                            className="text-white"
                            data-testid={`wizard-progress-check-${step.key}`}
                        >
                            <Check size={ICON_SIZES.sm} strokeWidth={3} />
                        </motion.div>
                    ) : (
                        <motion.span
                            key="number"
                            initial={
                                prefersReducedMotion
                                    ? { opacity: 1 }
                                    : { opacity: 0 }
                            }
                            animate={{ opacity: 1 }}
                            exit={
                                prefersReducedMotion
                                    ? { opacity: 0 }
                                    : { opacity: 0 }
                            }
                            transition={
                                prefersReducedMotion
                                    ? { duration: 0 }
                                    : { duration: DURATION_FAST }
                            }
                            className={cn(
                                isCurrent && "text-[var(--forge-text-primary)]",
                                isUpcoming && "text-[var(--forge-text-muted)]"
                            )}
                        >
                            {stepNumber}
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* Step Label */}
            <span
                className={cn(
                    "text-xs font-bold uppercase tracking-widest transition-colors",
                    isCompleted && "text-[var(--forge-success)]",
                    isCurrent && "text-[var(--ember)]",
                    isUpcoming && "text-[var(--forge-text-muted)]"
                )}
            >
                {step.label}
            </span>
        </div>
    );
};

// ============================================================================
// Connector Line Component
// ============================================================================

interface ConnectorLineProps {
    isCompleted: boolean;
    prefersReducedMotion?: boolean | null;
}

const ConnectorLine = ({
    isCompleted,
    prefersReducedMotion,
}: ConnectorLineProps) => {
    return (
        <div className="flex-1 h-0.5 bg-[var(--forge-bg-elevated)] mx-2 relative overflow-hidden self-start mt-4">
            <motion.div
                className="absolute inset-y-0 left-0 bg-[var(--forge-success)]"
                initial={prefersReducedMotion ? { width: isCompleted ? "100%" : "0%" } : { width: "0%" }}
                animate={{ width: isCompleted ? "100%" : "0%" }}
                transition={
                    prefersReducedMotion
                        ? { duration: 0 }
                        : { duration: DURATION_NORMAL, ease: "easeOut" }
                }
            />
        </div>
    );
};

// ============================================================================
// Main WizardProgressBar Component
// ============================================================================

export const WizardProgressBar = ({
    steps,
    currentStep,
    prefersReducedMotion,
    className,
}: WizardProgressBarProps) => {
    return (
        <div
            className={cn("mb-8", className)}
            data-testid="wizard-progress-bar"
        >
            <div className="flex items-start justify-between">
                {steps.map((step, index) => (
                    <React.Fragment key={step.key}>
                        <StepCircle
                            step={step}
                            index={index}
                            currentStep={currentStep}
                            prefersReducedMotion={prefersReducedMotion}
                        />
                        {index < steps.length - 1 && (
                            <ConnectorLine
                                isCompleted={currentStep > index + 1}
                                prefersReducedMotion={prefersReducedMotion}
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

// ============================================================================
// Default Wizard Steps
// ============================================================================

export const defaultWizardSteps: WizardStep[] = [
    { key: "goal", label: "Goal" },
    { key: "style", label: "Style" },
    { key: "time", label: "Time" },
    { key: "done", label: "Done" },
];
