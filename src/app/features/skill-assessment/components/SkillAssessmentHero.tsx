"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Layers, RefreshCw } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { navigationModules } from "@/app/shared/lib/modules";
import { useAssessment } from "../lib/useAssessment";
import { AssessmentStart } from "./AssessmentStart";
import { AssessmentProgress } from "./AssessmentProgress";
import { QuestionCard } from "./QuestionCard";
import { AssessmentResultDisplay } from "./AssessmentResult";
import { getPathConfig } from "../lib/assessmentData";
import {
    use3DParallax,
} from "@/app/shared/lib/motionPrimitives";

interface SkillAssessmentHeroProps {
    /** Theme class names from parent */
    theme: {
        card: {
            shine: string;
            container: string;
            iconContainer: string;
            liveTag: string;
            title: string;
            subtitle: string;
            moduleDefault: string;
            moduleHovered: string;
            moduleIconDefault: string;
            moduleText: string;
            arrowDefault: string;
            arrowHovered: string;
            watermarkText: string;
        };
    };
    /** Reduced motion preference */
    reducedMotion?: boolean;
}

type AssessmentView = "idle" | "start" | "questions" | "result" | "personalized";

/**
 * Interactive skill assessment embedded in the landing hero card.
 * Transforms from navigation card to assessment flow based on state.
 */
export const SkillAssessmentHero = ({
    theme,
    reducedMotion = false,
}: SkillAssessmentHeroProps) => {
    const router = useRouter();
    const {
        state,
        currentQuestion,
        progress,
        totalQuestions,
        isComplete,
        hasCompletedOnboarding,
        profile,
        result,
        startAssessment,
        answerQuestion,
        goBack,
        reset,
        saveProfile,
        getCurrentAnswers,
    } = useAssessment();

    // View state management
    const [view, setView] = useState<AssessmentView>(() => {
        if (hasCompletedOnboarding && profile) return "personalized";
        return "idle";
    });
    const [hoveredModule, setHoveredModule] = useState<string | null>(null);

    // 3D parallax effect
    const {
        ref,
        rotateX,
        rotateY,
        contentX,
        contentY,
        handleMouseMove,
        handleMouseLeave,
    } = use3DParallax({
        rotationRange: reducedMotion ? 0 : 15,
        translationRange: reducedMotion ? 0 : 10,
    });

    // Get personalized module order if profile exists
    const orderedModules = profile
        ? navigationModules.sort((a, b) => {
              const orderA = profile.result.moduleOrder.indexOf(a.id);
              const orderB = profile.result.moduleOrder.indexOf(b.id);
              if (orderA === -1) return 1;
              if (orderB === -1) return -1;
              return orderA - orderB;
          })
        : navigationModules;

    // Handlers
    const handleStartAssessment = useCallback(() => {
        startAssessment();
        setView("questions");
    }, [startAssessment]);

    const handleAnswer = useCallback(
        (optionIds: string[]) => {
            answerQuestion(optionIds);
        },
        [answerQuestion]
    );

    const handleContinue = useCallback(() => {
        // Check if complete after state updates
        if (state && state.currentQuestionIndex >= totalQuestions - 1) {
            setView("result");
        }
    }, [state, totalQuestions]);

    const handleFinish = useCallback(() => {
        saveProfile();
        setView("personalized");
    }, [saveProfile]);

    const handleRetake = useCallback(() => {
        reset();
        setView("start");
    }, [reset]);

    const handleStartLearning = useCallback(() => {
        handleFinish();
        // Navigate to the first recommended module
        const firstModule = profile?.result.moduleOrder[0] || "overview";
        router.push(`/${firstModule}`);
    }, [handleFinish, profile, router]);

    // Card content based on view
    const renderCardContent = () => {
        switch (view) {
            case "start":
                return (
                    <AssessmentStart
                        onStart={handleStartAssessment}
                    />
                );

            case "questions":
                if (!currentQuestion) return null;
                return (
                    <div className="flex flex-col h-full">
                        <AssessmentProgress
                            current={state?.currentQuestionIndex || 0}
                            total={totalQuestions}
                            className="mb-4"
                        />
                        <QuestionCard
                            question={currentQuestion}
                            selectedOptions={getCurrentAnswers()}
                            onSelect={handleAnswer}
                            onContinue={handleContinue}
                            canGoBack={(state?.currentQuestionIndex || 0) > 0}
                            onBack={goBack}
                        />
                    </div>
                );

            case "result":
                if (!result) return null;
                return (
                    <AssessmentResultDisplay
                        result={result}
                        onStartLearning={handleStartLearning}
                        onRetake={handleRetake}
                    />
                );

            case "personalized":
                return (
                    <PersonalizedNavigation
                        theme={theme}
                        profile={profile}
                        orderedModules={orderedModules}
                        hoveredModule={hoveredModule}
                        onHover={setHoveredModule}
                        onRetake={handleRetake}
                    />
                );

            case "idle":
            default:
                return (
                    <DefaultNavigation
                        theme={theme}
                        modules={orderedModules}
                        hoveredModule={hoveredModule}
                        onHover={setHoveredModule}
                        onStartAssessment={() => setView("start")}
                        hasCompletedOnboarding={hasCompletedOnboarding}
                    />
                );
        }
    };

    // Update view when assessment completes
    React.useEffect(() => {
        if (isComplete && view === "questions") {
            setView("result");
        }
    }, [isComplete, view]);

    // Update view when profile loads
    React.useEffect(() => {
        if (hasCompletedOnboarding && profile && view === "idle") {
            setView("personalized");
        }
    }, [hasCompletedOnboarding, profile, view]);

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateY, rotateX, transformStyle: "preserve-3d" }}
            className="relative group perspective-[2000px] w-full max-w-md aspect-[3/4]"
            data-testid="skill-assessment-hero"
        >
            {/* Holographic Border / Shine */}
            <div
                style={{ transform: "translateZ(-20px)" }}
                className={cn(
                    "absolute inset-0 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                    theme.card.shine
                )}
            />

            <div
                style={{ transform: "translateZ(20px)" }}
                className={cn(
                    "relative w-full h-full backdrop-blur-[10px] rounded-3xl overflow-hidden",
                    theme.card.container
                )}
            >
                {/* Noise Texture */}
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

                {/* Chromatic Aberration */}
                <div className="absolute inset-0 rounded-3xl border top-0 left-0 border-r-2 border-b-2 border-transparent group-hover:border-cyan-400/30 transition-colors duration-500" />
                <div className="absolute inset-0 rounded-3xl border bottom-0 right-0 border-l-2 border-t-2 border-transparent group-hover:border-pink-400/30 transition-colors duration-500" />

                <motion.div
                    style={{ x: contentX, y: contentY, transform: "translateZ(40px)" }}
                    className="relative z-10 p-6 md:p-8 h-full flex flex-col overflow-y-auto"
                >
                    <AnimatePresence mode="wait">
                        {renderCardContent()}
                    </AnimatePresence>
                </motion.div>
            </div>
        </motion.div>
    );
};

// ============================================================================
// Sub-components
// ============================================================================

interface DefaultNavigationProps {
    theme: SkillAssessmentHeroProps["theme"];
    modules: typeof navigationModules;
    hoveredModule: string | null;
    onHover: (id: string | null) => void;
    onStartAssessment: () => void;
    hasCompletedOnboarding: boolean;
}

const DefaultNavigation = ({
    theme,
    modules,
    hoveredModule,
    onHover,
    onStartAssessment,
    hasCompletedOnboarding,
}: DefaultNavigationProps) => {
    return (
        <motion.div
            key="default-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col"
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div
                    className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg",
                        theme.card.iconContainer
                    )}
                >
                    <Layers size={ICON_SIZES.lg} />
                </div>
                <div
                    className={cn(
                        "px-3 py-1 text-xs font-bold rounded-lg",
                        theme.card.liveTag
                    )}
                >
                    LIVE
                </div>
            </div>

            <div className="space-y-1 mb-4">
                <h2 className={cn("text-2xl font-black", theme.card.title)}>
                    Course Platform
                </h2>
                <p className={theme.card.subtitle}>Explore all modules</p>
            </div>

            {/* Assessment CTA */}
            {!hasCompletedOnboarding && (
                <button
                    onClick={onStartAssessment}
                    className="mb-4 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm hover:from-indigo-600 hover:to-purple-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/25"
                    data-testid="start-assessment-cta"
                >
                    ✨ Personalize Your Path (60s)
                </button>
            )}

            {/* Module list */}
            <div className="flex-1 space-y-2">
                {modules.map((module) => (
                    <Link key={module.id} href={module.href}>
                        <motion.div
                            onMouseEnter={() => onHover(module.id)}
                            onMouseLeave={() => onHover(null)}
                            whileHover={{ x: 4 }}
                            className={cn(
                                "p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3",
                                hoveredModule === module.id
                                    ? theme.card.moduleHovered
                                    : theme.card.moduleDefault
                            )}
                            data-testid={`landing-module-${module.id}`}
                        >
                            <div
                                className={cn(
                                    "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                                    hoveredModule === module.id
                                        ? "bg-indigo-500 text-white"
                                        : theme.card.moduleIconDefault
                                )}
                            >
                                <module.icon size={ICON_SIZES.sm} />
                            </div>
                            <span
                                className={cn(
                                    "font-semibold flex-1 text-sm",
                                    theme.card.moduleText
                                )}
                            >
                                {module.title}
                            </span>
                            <ArrowUpRight
                                size={ICON_SIZES.sm}
                                className={cn(
                                    "transition-all",
                                    hoveredModule === module.id
                                        ? theme.card.arrowHovered
                                        : theme.card.arrowDefault
                                )}
                            />
                        </motion.div>
                    </Link>
                ))}
            </div>
        </motion.div>
    );
};

interface PersonalizedNavigationProps {
    theme: SkillAssessmentHeroProps["theme"];
    profile: ReturnType<typeof useAssessment>["profile"];
    orderedModules: typeof navigationModules;
    hoveredModule: string | null;
    onHover: (id: string | null) => void;
    onRetake: () => void;
}

const PersonalizedNavigation = ({
    theme,
    profile,
    orderedModules,
    hoveredModule,
    onHover,
    onRetake,
}: PersonalizedNavigationProps) => {
    const pathConfig = profile?.result
        ? getPathConfig(profile.result.recommendedPath)
        : null;

    return (
        <motion.div
            key="personalized-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col"
        >
            {/* Header with personalized badge */}
            <div className="flex justify-between items-start mb-4">
                <div
                    className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg",
                        pathConfig
                            ? `bg-gradient-to-br ${pathConfig.gradient}`
                            : theme.card.iconContainer
                    )}
                >
                    <Layers size={ICON_SIZES.lg} />
                </div>
                {profile?.result && (
                    <div className="px-3 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                        {profile.result.confidence}% MATCH
                    </div>
                )}
            </div>

            {/* Personalized title */}
            <div className="space-y-1 mb-4">
                <h2 className={cn("text-xl font-black", theme.card.title)}>
                    Your {pathConfig?.shortName || "Learning"} Path
                </h2>
                <p className={cn("text-sm", theme.card.subtitle)}>
                    {profile?.result.intensityDisplayName || "Customized for you"}
                </p>
            </div>

            {/* Personalized tags */}
            {profile?.result.personalizedTags && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {profile.result.personalizedTags.slice(0, 3).map((tag, i) => (
                        <span
                            key={i}
                            className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Optimized module list */}
            <div className="flex-1 space-y-2">
                {orderedModules.map((module, index) => (
                    <Link key={module.id} href={module.href}>
                        <motion.div
                            onMouseEnter={() => onHover(module.id)}
                            onMouseLeave={() => onHover(null)}
                            whileHover={{ x: 4 }}
                            className={cn(
                                "p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3",
                                hoveredModule === module.id
                                    ? theme.card.moduleHovered
                                    : theme.card.moduleDefault
                            )}
                            data-testid={`landing-module-${module.id}`}
                        >
                            {/* Order indicator */}
                            <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                {index + 1}
                            </div>
                            <div
                                className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                    hoveredModule === module.id
                                        ? "bg-indigo-500 text-white"
                                        : theme.card.moduleIconDefault
                                )}
                            >
                                <module.icon size={ICON_SIZES.sm} />
                            </div>
                            <span
                                className={cn(
                                    "font-semibold flex-1 text-sm",
                                    theme.card.moduleText
                                )}
                            >
                                {module.title}
                            </span>
                            <ArrowUpRight
                                size={ICON_SIZES.sm}
                                className={cn(
                                    "transition-all",
                                    hoveredModule === module.id
                                        ? theme.card.arrowHovered
                                        : theme.card.arrowDefault
                                )}
                            />
                        </motion.div>
                    </Link>
                ))}
            </div>

            {/* Retake option */}
            <button
                onClick={onRetake}
                className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                data-testid="retake-assessment-btn"
            >
                <RefreshCw size={12} />
                Retake Assessment
            </button>
        </motion.div>
    );
};
