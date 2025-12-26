"use client";

/**
 * OracleExpandedWizard Component
 *
 * Horizontal 3-step wizard shown when the Oracle panel is expanded.
 * Steps: Skills -> Goal -> Preferences -> Generating -> Complete
 */

import React, { useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, ChevronDown } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { OracleStepIndicator } from "./OracleStepIndicator";
import { CompactSkillsStep } from "./CompactSkillsStep";
import { CompactGoalStep } from "./CompactGoalStep";
import { CompactPreferencesStep } from "./CompactPreferencesStep";
import type { UseOracleMapIntegrationReturn } from "../../lib/useOracleMapIntegration";
import type { OracleWizardStep } from "../../lib/types";

// ============================================================================
// TYPES
// ============================================================================

export interface OracleExpandedWizardProps {
    /** Oracle integration hook return */
    oracle: UseOracleMapIntegrationReturn;
    /** Collapse the panel */
    onCollapse: () => void;
    /** Whether path has been generated */
    hasGeneratedPath: boolean;
    /** Show path preview sidebar */
    onShowPathPreview: () => void;
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const stepVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 100 : -100,
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction > 0 ? -100 : 100,
        opacity: 0,
    }),
};

// ============================================================================
// COMPONENT
// ============================================================================

export function OracleExpandedWizard({
    oracle,
    onCollapse,
    hasGeneratedPath,
    onShowPathPreview,
}: OracleExpandedWizardProps) {
    const {
        integration,
        setActiveWizardStep,
        nextWizardStep,
        prevWizardStep,
        canProceedToNext,
        canGoBack,
        state: oracleState,
        updateSkills,
        updateGoal,
        updatePreferences,
        generatePath,
        generatePredictions,
    } = oracle;

    const activeStep = integration.activeStep;

    // Direction for animation (-1 = back, 1 = forward)
    const [direction, setDirection] = React.useState(1);

    // Handle next step
    const handleNext = useCallback(async () => {
        setDirection(1);

        if (activeStep === "preferences") {
            // Trigger path generation
            setActiveWizardStep("generating");
            await generatePredictions();
            await generatePath();
            setActiveWizardStep("complete");
        } else {
            nextWizardStep();
        }
    }, [activeStep, nextWizardStep, generatePredictions, generatePath, setActiveWizardStep]);

    // Handle previous step
    const handlePrev = useCallback(() => {
        setDirection(-1);
        prevWizardStep();
    }, [prevWizardStep]);

    // Handle step click from indicator
    const handleStepClick = useCallback((step: OracleWizardStep) => {
        const stepOrder: OracleWizardStep[] = ["skills", "goal", "preferences"];
        const currentIndex = stepOrder.indexOf(activeStep);
        const targetIndex = stepOrder.indexOf(step);

        if (targetIndex < currentIndex) {
            setDirection(-1);
        } else {
            setDirection(1);
        }

        setActiveWizardStep(step);
    }, [activeStep, setActiveWizardStep]);

    // Get button label based on step
    const nextButtonLabel = useMemo(() => {
        if (activeStep === "preferences") return "Generate Path";
        if (activeStep === "generating") return "Generating...";
        if (activeStep === "complete") return "View Path";
        return "Continue";
    }, [activeStep]);

    // Completed steps
    const completedSteps = useMemo(() => {
        const completed = new Set<OracleWizardStep>();
        const stepOrder: OracleWizardStep[] = ["skills", "goal", "preferences"];
        const currentIndex = stepOrder.indexOf(activeStep);

        stepOrder.forEach((step, index) => {
            if (index < currentIndex) {
                completed.add(step);
            }
        });

        return completed;
    }, [activeStep]);

    return (
        <div
            className="h-full flex flex-col"
            data-testid="oracle-expanded-wizard"
        >
            {/* Header with step indicator */}
            <div className="flex items-center justify-between mb-4">
                <OracleStepIndicator
                    activeStep={activeStep}
                    onStepClick={handleStepClick}
                    completedSteps={completedSteps}
                />

                <button
                    onClick={onCollapse}
                    className={cn(
                        "p-2 rounded-lg",
                        "text-slate-400 hover:text-slate-600",
                        "dark:text-slate-500 dark:hover:text-slate-300",
                        "hover:bg-slate-100 dark:hover:bg-slate-700/50",
                        "transition-colors"
                    )}
                >
                    <ChevronDown size={ICON_SIZES.sm} />
                </button>
            </div>

            {/* Step content area */}
            <div className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={activeStep}
                        custom={direction}
                        variants={stepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute inset-0"
                    >
                        {activeStep === "skills" && (
                            <CompactSkillsStep
                                selectedSkills={oracleState.userProfile.currentSkills?.map(s => s.name) || []}
                                onSkillsChange={updateSkills}
                            />
                        )}

                        {activeStep === "goal" && (
                            <CompactGoalStep
                                selectedGoal={oracleState.userProfile.targetRole || null}
                                selectedSector={oracleState.userProfile.targetSector || null}
                                onGoalChange={updateGoal}
                            />
                        )}

                        {activeStep === "preferences" && (
                            <CompactPreferencesStep
                                weeklyHours={oracleState.userProfile.weeklyHours}
                                learningStyle={oracleState.userProfile.learningStyle}
                                focusAreas={oracleState.userProfile.focusAreas || []}
                                onPreferencesChange={updatePreferences}
                            />
                        )}

                        {activeStep === "generating" && (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <motion.div
                                        className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-indigo-500 flex items-center justify-center"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Sparkles size={24} className="text-white" />
                                    </motion.div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        Analyzing your profile...
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Generating personalized learning path
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeStep === "complete" && (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <motion.div
                                        className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-emerald-500 flex items-center justify-center"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", damping: 15 }}
                                    >
                                        <Sparkles size={24} className="text-white" />
                                    </motion.div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        Your path is ready!
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Click "View Path" to see your personalized learning journey
                                    </p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                    onClick={handlePrev}
                    disabled={!canGoBack}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                        "text-xs font-medium transition-colors",
                        canGoBack
                            ? "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                            : "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                    )}
                >
                    <ArrowLeft size={14} />
                    Back
                </button>

                {activeStep === "complete" ? (
                    <button
                        onClick={onShowPathPreview}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-lg",
                            "text-sm font-medium",
                            "transition-all duration-200",
                            "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90"
                        )}
                    >
                        <Sparkles size={16} />
                        View Path
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        disabled={!canProceedToNext || activeStep === "generating"}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-lg",
                            "text-sm font-medium transition-all duration-200",
                            canProceedToNext && activeStep !== "generating"
                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                        )}
                    >
                        {nextButtonLabel}
                        {activeStep !== "generating" && (
                            <ArrowRight size={16} />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
