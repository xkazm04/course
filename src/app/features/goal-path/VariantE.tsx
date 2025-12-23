"use client";

/**
 * VariantE - AI Career Oracle
 *
 * A multi-step wizard for career path analysis and recommendations.
 * This component orchestrates the step flow, delegating rendering
 * to modular step components in ./components/oracle-steps/
 *
 * Steps:
 * 1. Welcome - Introduction and start
 * 2. Skills - Select current skills
 * 3. Goal - Choose career goal
 * 4. Preferences - Set learning preferences
 * 5. Analyzing - Loading/analysis animation
 * 6. Insights - Career intelligence report
 * 7. Path - Learning path timeline
 * 8. Jobs - Matching job opportunities
 */

import React, { useEffect } from "react";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import { PrismaticCard } from "@/app/shared/components";
import { useCareerOracle } from "./lib/useCareerOracle";
import {
    OracleProgressBar,
    WelcomeStep,
    SkillsStep,
    GoalStep,
    PreferencesStep,
    AnalyzingStep,
    InsightsStep,
    PathStep,
    JobsStep,
} from "./components/oracle-steps";

export const VariantE = () => {
    const oracle = useCareerOracle();
    const { state, goToStep, nextStep, prevStep } = oracle;
    const prefersReducedMotion = useReducedMotion();

    // Auto-generate predictions when reaching analyzing step
    useEffect(() => {
        if (state.step === "analyzing") {
            const runAnalysis = async () => {
                await oracle.generatePredictions();
                await oracle.generatePath();
                goToStep("insights");
            };
            runAnalysis();
        }
    }, [state.step]);

    return (
        <div className="max-w-4xl mx-auto">
            {/* Progress Indicator */}
            <OracleProgressBar currentStep={state.step} prefersReducedMotion={prefersReducedMotion} />

            <PrismaticCard className="min-h-[600px] relative overflow-visible">
                <div className="p-8 relative">
                    <AnimatePresence mode="wait">
                        {state.step === "welcome" && (
                            <WelcomeStep
                                onStart={() => goToStep("skills")}
                                prefersReducedMotion={prefersReducedMotion}
                            />
                        )}

                        {state.step === "skills" && (
                            <SkillsStep
                                selectedSkills={state.userProfile.currentSkills?.map((s) => s.name) ?? []}
                                onUpdateSkills={oracle.updateSkills}
                                onNext={nextStep}
                                onBack={prevStep}
                                prefersReducedMotion={prefersReducedMotion}
                            />
                        )}

                        {state.step === "goal" && (
                            <GoalStep
                                selectedGoal={state.userProfile.targetRole}
                                onSelectGoal={oracle.updateGoal}
                                onNext={nextStep}
                                onBack={prevStep}
                                prefersReducedMotion={prefersReducedMotion}
                            />
                        )}

                        {state.step === "preferences" && (
                            <PreferencesStep
                                preferences={{
                                    ...state.userProfile,
                                    focusAreas: state.userProfile.focusAreas,
                                }}
                                onUpdatePreferences={oracle.updatePreferences}
                                onUpdateFocusAreas={oracle.updateFocusAreas}
                                onNext={nextStep}
                                onBack={prevStep}
                                prefersReducedMotion={prefersReducedMotion}
                            />
                        )}

                        {state.step === "analyzing" && (
                            <AnalyzingStep prefersReducedMotion={prefersReducedMotion} />
                        )}

                        {state.step === "insights" && (
                            <InsightsStep
                                predictions={state.predictions}
                                horizon={state.horizon}
                                onSetHorizon={oracle.setHorizon}
                                onViewPath={() => goToStep("path")}
                                onViewJobs={() => goToStep("jobs")}
                                topGrowingSkills={oracle.topGrowingSkills}
                                recommendedSkills={oracle.recommendedSkills}
                                estimatedOutcomes={oracle.estimatedOutcomes}
                                prefersReducedMotion={prefersReducedMotion}
                            />
                        )}

                        {state.step === "path" && (
                            <PathStep
                                path={state.predictions.suggestedPath}
                                loading={state.loading.path}
                                onBack={() => goToStep("insights")}
                                onViewJobs={() => goToStep("jobs")}
                                prefersReducedMotion={prefersReducedMotion}
                            />
                        )}

                        {state.step === "jobs" && (
                            <JobsStep
                                jobs={state.predictions.matchingJobs}
                                filters={state.jobFilters}
                                loading={state.loading.jobs}
                                skillGaps={oracle.skillGaps}
                                onSetFilters={oracle.setJobFilters}
                                onRefresh={oracle.refreshJobs}
                                onBack={() => goToStep("insights")}
                                onViewPath={() => goToStep("path")}
                                prefersReducedMotion={prefersReducedMotion}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </PrismaticCard>
        </div>
    );
};

export default VariantE;
